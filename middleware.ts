import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/pricing', '/about', '/api/webhooks'];
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes (except dashboard-related), and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    PUBLIC_ROUTES.some((route) => pathname === route)
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('sb-access-token')?.value;

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (accessToken && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT authenticated and tries to access dashboard, redirect to sign-in
  if (!accessToken && pathname.startsWith('/dashboard')) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
