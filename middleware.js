import { NextResponse } from 'next/server'
import { auth } from 'firebase-admin'
import { initAdmin } from '@/lib/firebase-admin'

// Initialize Firebase Admin SDK
initAdmin()

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')?.value

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password', '/']
  // Define onboarding paths
  const onboardingPaths = ['/signup/role-selection', '/onboarding/customer', '/onboarding/instructor', '/onboarding/merchant']

  // Allow access to public paths and API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // If no session cookie, redirect to login for protected routes
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the session cookie
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true)
    const { role } = decodedToken // The role comes directly from the token now!

    console.log(`[Middleware] User ${decodedToken.uid} with role ${role} accessing ${pathname}`)

    // --- Routing Logic ---

    // 1. If user has a role and is trying to access onboarding, redirect to dashboard
    if (role && onboardingPaths.includes(pathname)) {
      console.log(`[Middleware] User with role ${role} trying to access onboarding, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 2. If user has NO role, they MUST go to the role selection page
    if (!role && !onboardingPaths.includes(pathname)) {
      console.log(`[Middleware] User without role trying to access ${pathname}, redirecting to role selection`)
      return NextResponse.redirect(new URL('/signup/role-selection', request.url))
    }
    
    // 3. If user is trying to access the wrong onboarding flow, redirect them
    if (pathname.startsWith('/onboarding/customer') && role && role !== 'customer') {
      console.log(`[Middleware] User with role ${role} trying to access customer onboarding, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/onboarding/instructor') && role && role !== 'instructor') {
      console.log(`[Middleware] User with role ${role} trying to access instructor onboarding, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/onboarding/merchant') && role && role !== 'merchant') {
      console.log(`[Middleware] User with role ${role} trying to access merchant onboarding, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If all checks pass, allow the request to proceed
    return NextResponse.next()

  } catch (error) {
    // If cookie is invalid or expired, clear it and redirect to login
    console.error('Middleware auth error:', error.message)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('session', '', { maxAge: -1 }) // Clear the cookie
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}