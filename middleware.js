import { NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];
const onboardingPaths = ['/select-role', '/signup/role-selection', '/onboarding/customer', '/onboarding/instructor', '/onboarding/merchant'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths and API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Temporarily disable middleware redirects to let auth provider handle them
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};