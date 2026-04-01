import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  parseGitHubUrl,
  createGitHubClient,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
} from '@/lib/github';

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

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', user.id)
      .single();

    if (!profile?.github_access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(project.github_repo_url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid repo URL' }, { status: 400 });
    }

    const body = await request.json();
    const { file_path, content, commit_message, create_pr = true } = body;

    if (!file_path || !content) {
      return NextResponse.json({ error: 'file_path and content required' }, { status: 400 });
    }

    const octokit = createGitHubClient(profile.github_access_token);
    const baseBranch = project.github_default_branch || 'main';
    const branchName = `shipready/fix-${Date.now()}`;

    await createBranch(octokit, parsed.owner, parsed.repo, branchName, baseBranch);

    const { sha } = await createOrUpdateFile(
      octokit,
      parsed.owner,
      parsed.repo,
      file_path,
      content,
      commit_message || `fix: update ${file_path}`,
      branchName
    );

    let pr_url: string | undefined;
    if (create_pr) {
      const pr = await createPullRequest(
        octokit,
        parsed.owner,
        parsed.repo,
        commit_message || `ShipReady: fix ${file_path}`,
        `Applied by ShipReady compliance assistant.\n\nFile: \`${file_path}\``,
        branchName,
        baseBranch
      );
      pr_url = pr.html_url;
    }

    return NextResponse.json({
      data: { branch: branchName, commit_sha: sha, pr_url },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to apply fix';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
