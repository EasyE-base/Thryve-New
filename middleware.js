import { NextResponse } from 'next/server'
import { canonicalizeRole } from '@/lib/roles'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password']

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl

  // Allow public and API routes
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Enforce Marketplace access at the edge
  if (pathname.startsWith('/marketplace')) {
    const cookie = request.cookies.get('user')?.value || ''
    if (!cookie) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', '/marketplace')
      return NextResponse.redirect(url)
    }

    let parsed
    try { parsed = JSON.parse(cookie) } catch { parsed = {} }
    const role = canonicalizeRole(parsed.role)
    const onboarded = !!parsed.onboardingCompleted

    if (!onboarded) {
      const url = new URL(`/onboarding/${role === 'instructor' ? 'instructor' : 'merchant'}`, request.url)
      return NextResponse.redirect(url)
    }

    if (role !== 'merchant' && role !== 'instructor') {
      const url = new URL('/signup', request.url)
      url.searchParams.set('role', 'merchant')
      url.searchParams.set('reason', 'marketplace_restricted')
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}