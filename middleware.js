import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the pathname of the request (e.g. /, /dashboard, etc)
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for API routes, static files, and auth-related pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/server-api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/signin') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // For dashboard routes, we'll let the client-side handle auth redirects
  // since Firebase auth state is managed on the client
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}