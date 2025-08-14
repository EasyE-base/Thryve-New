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
    // Prefer secure session cookie (Firebase session JWT), fallback to legacy 'user' cookie
    const sessionCookie = request.cookies.get('session')?.value || ''
    const legacyCookie = request.cookies.get('user')?.value || ''

    let role = 'unknown'
    let onboarded = false

    if (sessionCookie) {
      try {
        const payloadB64 = sessionCookie.split('.')[1] || ''
        // base64url → base64
        const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
        const json = Buffer.from(normalized, 'base64').toString('utf8')
        const payload = JSON.parse(json)
        role = canonicalizeRole(payload.role)
        onboarded = !!payload.onboardingComplete
      } catch {}
    }

    if ((role === 'unknown' || onboarded === false) && legacyCookie) {
      try {
        const legacy = JSON.parse(legacyCookie)
        const maybeRole = canonicalizeRole(legacy.role)
        const maybeOnboarded = !!legacy.onboardingCompleted
        if (maybeRole !== 'unknown') role = maybeRole
        if (maybeOnboarded) onboarded = true
      } catch {}
    }

    if (!sessionCookie && !legacyCookie) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', '/marketplace')
      return NextResponse.redirect(url)
    }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)'],
}