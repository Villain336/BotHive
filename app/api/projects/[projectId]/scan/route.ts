import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseGitHubUrl, getRepoTree, getMultipleFiles } from '@/lib/github';
import { runFullScan } from '@/lib/scanners';
import type { RepoContext } from '@/lib/scanners/types';
import { randomUUID } from 'crypto';

const KEY_FILES = [
  'package.json', '.gitignore', 'next.config.js', 'next.config.mjs', 'next.config.ts',
  'middleware.ts', 'middleware.js', '.env.example', 'Dockerfile',
  'docker-compose.yml', 'docker-compose.yaml', '.dockerignore',
  'jest.config.js', 'jest.config.ts', 'vitest.config.ts', 'vitest.config.js',
  'tsconfig.json', '.eslintrc.json', '.eslintrc.js',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const supabase = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update status to scanning
    await supabase
      .from('projects')
      .update({ status: 'scanning' })
      .eq('id', projectId);

    // Get GitHub token from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', user.id)
      .single();

    const parsed = parseGitHubUrl(project.github_repo_url);
    if (!parsed) {
      await supabase.from('projects').update({ status: 'error' }).eq('id', projectId);
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    // Use user's token or unauthenticated access for public repos
    const octokit = new Octokit({
      auth: profile?.github_access_token || undefined,
    });

    // Get repo tree
    const tree = await getRepoTree(octokit, parsed.owner, parsed.repo);

    // Update default branch
    await supabase
      .from('projects')
      .update({ github_default_branch: tree.defaultBranch })
      .eq('id', projectId);

    // Get key file contents
    const existingKeyFiles = KEY_FILES.filter((kf) =>
      tree.files.some((f) => f.path === kf)
    );
    const fileContents = await getMultipleFiles(
      octokit,
      parsed.owner,
      parsed.repo,
      existingKeyFiles,
      tree.defaultBranch
    );

    // Build repo context
    const packageJson = fileContents['package.json']
      ? JSON.parse(fileContents['package.json'])
      : undefined;

    // Detect language/framework
    let language = 'unknown';
    let framework = 'unknown';
    if (packageJson) {
      language = 'javascript';
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps?.typescript) language = 'typescript';
      if (deps?.next) framework = 'nextjs';
      else if (deps?.react) framework = 'react';
      else if (deps?.vue) framework = 'vue';
      else if (deps?.express) framework = 'express';
    } else if (tree.files.some((f) => f.path.endsWith('.py'))) {
      language = 'python';
    } else if (tree.files.some((f) => f.path.endsWith('.go'))) {
      language = 'go';
    }

    const repoContext: RepoContext = {
      files: tree.files,
      fileContents,
      packageJson,
      language,
      framework,
    };

    // Run scan
    const scanResult = runFullScan(repoContext);
    const scanId = randomUUID();

    // Save findings
    const findingsToInsert = scanResult.results.flatMap((r) =>
      r.findings.map((f) => ({
        project_id: projectId,
        scan_id: scanId,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        file_path: f.file_path || null,
        line_number: f.line_number || null,
        fix_suggestion: f.fix_suggestion || null,
        status: 'open',
      }))
    );

    if (findingsToInsert.length > 0) {
      await supabase.from('scan_findings').insert(findingsToInsert);
    }

    // Update project scores
    await supabase
      .from('projects')
      .update({
        overall_score: scanResult.overall_score,
        test_score: scanResult.test_score,
        security_score: scanResult.security_score,
        legal_score: scanResult.legal_score,
        ops_score: scanResult.ops_score,
        status: 'ready',
        last_scan_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    // Increment scan count
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('scans_used_this_month')
      .eq('id', user.id)
      .single();

    await supabase
      .from('profiles')
      .update({ scans_used_this_month: (currentProfile?.scans_used_this_month || 0) + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      data: {
        scan_id: scanId,
        ...scanResult,
        findings_count: findingsToInsert.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scan failed';
    console.error('Scan error:', error);

    // Try to update project status back to error
    try {
      const { projectId } = params;
      const sb = getSupabaseAdmin();
      await sb.from('projects').update({ status: 'error' }).eq('id', projectId);
    } catch { /* ignore */ }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
