import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=no_code', requestUrl.origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(new URL('/sign-in?error=auth_failed', requestUrl.origin));
  }

  // If we got a GitHub token from the OAuth flow, store it for repo access
  const session = data.session;
  if (session?.provider_token && session.user) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const githubUsername = session.user.user_metadata?.user_name ||
      session.user.user_metadata?.preferred_username || '';

    await adminClient
      .from('profiles')
      .update({
        github_access_token: session.provider_token,
        github_username: githubUsername,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        avatar_url: session.user.user_metadata?.avatar_url || '',
      })
      .eq('id', session.user.id);
  }

  // Set auth cookies for the session
  const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin));

  if (session?.access_token) {
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }
  if (session?.refresh_token) {
    response.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}
