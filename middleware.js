export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const publicPaths = ['/login', '/signup', '/forgot-password'];
const onboardingPaths = ['/select-role', '/onboarding/customer', '/onboarding/business'];

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // Allow public paths and API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Ask our own API who the user is
  const meRes = await fetch(`${origin}/api/auth/me`, {
    headers: { cookie: request.headers.get('cookie') || '' },
  });

  const { role } = meRes.ok ? await meRes.json() : { role: null };

  // 1. No session → login
  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Has role but still on onboarding → dashboard
  if (role && onboardingPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. No role but not on onboarding → select-role
  if (!role && !onboardingPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/select-role', request.url));
  }

  // 4. Wrong onboarding flow → dashboard
  if (pathname.startsWith('/onboarding/customer') && role !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/onboarding/business') && role !== 'business') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};