export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const publicPaths = ['/login', '/signup', '/forgot-password'];
  const onboardingPaths = ['/select-role', '/onboarding/customer', '/onboarding/business'];

  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
    const { role } = decodedToken;

    if (role && onboardingPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!role && !onboardingPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/select-role', request.url));
    }

    if (pathname.startsWith('/onboarding/customer') && role && role !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/onboarding/business') && role && role !== 'business') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error.message);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('session', '', { maxAge: -1 });
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};