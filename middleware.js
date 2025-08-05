import { NextResponse } from 'next/server';

// Routes that require authentication **and** completed onboarding
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/my-bookings',
  '/instructor-payouts',
  '/studio-payouts',
  '/business-settings',
];

// Routes that require authentication but not completed onboarding.
// These are the onboarding pages themselves.
const onboardingRoutes = [
  '/onboarding',
  // we do **not** include /signup/role-selection here so that users can
  // access role selection before any middleware checks.
];

// Routes that require specific roles once onboarding is complete.
const roleProtectedRoutes = {
  '/marketplace': ['merchant', 'instructor', 'studio-owner'],
  '/studio': ['merchant', 'studio-owner'],
  '/instructor-payouts': ['instructor'],
  '/studio-payouts': ['merchant', 'studio-owner'],
};

// Pages that only unauthenticated users should visit.
// We leave this array empty by default because login/signup flow is handled
// explicitly, but you can add routes like '/login' if you want to force
// signed-in users away from those pages.
const guestOnlyRoutes = [
  '/login',
];

// Main middleware function runs on every matched request
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for Next.js internals, API routes and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // 2. Skip middleware for the sign‑up flow and home page to allow new users in
  if (pathname.startsWith('/signup') || pathname === '/') {
    return NextResponse.next();
  }

  // 3. Attempt to read the user session from a cookie named `user`
  const userCookie = request.cookies.get('user');
  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie.value);
    } catch (error) {
      console.error('middleware: failed to parse user cookie:', error);
      // If the cookie is invalid, clear it and continue unauthenticated
      const response = NextResponse.next();
      response.cookies.delete('user');
      return response;
    }
  }

  // Helper: determine if current route is in a list
  const isOnboardingRoute = onboardingRoutes.some(route =>
    pathname.startsWith(route),
  );
  const requiresFullAuth = protectedRoutes.some(route =>
    pathname.startsWith(route),
  );

  // 4. Onboarding pages: user must be authenticated, but onboarding may not be complete
  if (isOnboardingRoute) {
    if (!user) {
      // Redirect unauthenticated users trying to access onboarding to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated users can access onboarding
    return NextResponse.next();
  }

  // 5. Fully protected pages: require authentication and completed onboarding
  if (requiresFullAuth) {
    if (!user) {
      // Not authenticated → redirect to login and preserve intended path
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // User is signed in but has not completed onboarding
    if (!user.onboardingCompleted) {
      // If user chose a role, send them back to the appropriate onboarding page
      if (user.role) {
        return NextResponse.redirect(
          new URL(`/onboarding/${user.role}`, request.url),
        );
      }
      // No role yet → send to role selection
      return NextResponse.redirect(
        new URL('/signup/role-selection', request.url),
      );
    }
  }

  // 6. Role‑based protection for authenticated & onboarded users
  const roleRequirement = Object.entries(roleProtectedRoutes).find(([route]) =>
    pathname.startsWith(route),
  );
  if (roleRequirement && user) {
    const [, allowedRoles] = roleRequirement;
    if (!allowedRoles.includes(user.role)) {
      // User does not have permission for this route
      if (user.role === 'customer' || user.role === 'client') {
        // Customers/clients should be sent to explore
        return NextResponse.redirect(new URL('/explore', request.url));
      }
      // Other roles get sent to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 7. Keep signed‑in users away from guest‑only pages (e.g. login)
  if (guestOnlyRoutes.includes(pathname) && user) {
    if (user.onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If onboarding is incomplete, send to next step
    if (user.role) {
      return NextResponse.redirect(
        new URL(`/onboarding/${user.role}`, request.url),
      );
    }
    return NextResponse.redirect(
      new URL('/signup/role-selection', request.url),
    );
  }

  // Otherwise continue normally
  return NextResponse.next();
}

// Apply middleware to all pages except API routes and static assets
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};