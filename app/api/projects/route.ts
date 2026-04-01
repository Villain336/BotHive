import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseGitHubUrl } from '@/lib/github';
import { checkProjectLimit } from '@/lib/usage';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check project limit
    const projLimit = await checkProjectLimit(user.id);
    if (!projLimit.allowed) {
      return NextResponse.json({ error: projLimit.reason }, { status: 429 });
    }

    const body = await request.json();
    const { github_repo_url } = body;

    if (!github_repo_url) {
      return NextResponse.json({ error: 'github_repo_url is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(github_repo_url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        github_repo_url,
        github_repo_name: `${parsed.owner}/${parsed.repo}`,
        github_default_branch: 'main',
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
