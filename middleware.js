import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  // Handle auth routes
  if (['/login', '/signup'].includes(pathname) || pathname.startsWith('/signup/')) {
    if (session) {
      const role = session.user.user_metadata?.role
      const onboardingComplete = session.user.user_metadata?.onboarding_complete
      
      if (!role) {
        return NextResponse.redirect(new URL('/signup/role-selection', req.url))
      }
      
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL(`/onboarding/${role}`, req.url))
      }
      
      const redirectUrl = getRoleRedirect(role)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    return response
  }

  // Protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    const userRole = session.user.user_metadata?.role
    const onboardingComplete = session.user.user_metadata?.onboarding_complete
    
    if (!userRole) {
      return NextResponse.redirect(new URL('/signup/role-selection', req.url))
    }
    
    // Redirect to onboarding if incomplete
    if (!onboardingComplete && !pathname.includes('/onboarding')) {
      return NextResponse.redirect(new URL(`/onboarding/${userRole}`, req.url))
    }
    
    // Validate role access for dashboard
    if (pathname.startsWith('/dashboard')) {
      const pathRole = pathname.split('/')[2]
      if (pathRole && pathRole !== userRole) {
        return NextResponse.redirect(new URL(getRoleRedirect(userRole), req.url))
      }
    }
  }

  return response
}

function getRoleRedirect(role) {
  switch (role) {
    case 'customer':
      return '/dashboard/customer'
    case 'instructor':
      return '/dashboard/instructor'
    case 'merchant':
      return '/dashboard/merchant'
    default:
      return '/signup/role-selection'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}