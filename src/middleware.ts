import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define segments to protect
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/property') || 
                          pathname.startsWith('/booking') ||
                          pathname.startsWith('/housekeeping') ||
                          pathname.startsWith('/invoices') ||
                          pathname.startsWith('/guests') ||
                          pathname.startsWith('/reports') ||
                          pathname.startsWith('/rates') ||
                          pathname.startsWith('/channels') ||
                          pathname.startsWith('/settings');

  // 2. Check for auth cookies
  const authToken = request.cookies.get('sb_auth_token');
  const userRole = request.cookies.get('sb_user_role')?.value;
  const userProperty = request.cookies.get('sb_user_property')?.value;

  // 3. Redirect to login if accessing protected route without token
  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Role-Based Access Control (RBAC) - Lockdown for Staff
  if (authToken) {
    if (userRole === 'reception') {
      // 🔒 HARD LOCKDOWN: Staff cannot access these sections
      const restrictedForStaff = ['/dashboard', '/reports', '/rates', '/channels', '/settings', '/invoices'];
      const isRestricted = restrictedForStaff.some(path => pathname.startsWith(path));

      if (isRestricted) {
        const targetProperty = userProperty || '010'; 
        return NextResponse.redirect(new URL(`/property/${targetProperty}`, request.url));
      }

      // 🔒 PROPERTY LOCK: Prevent staff from accessing other properties
      if (pathname.startsWith('/property/')) {
        const id = pathname.split('/')[2];
        if (id && userProperty && id !== userProperty) {
          return NextResponse.redirect(new URL(`/property/${userProperty}`, request.url));
        }
      }
    }

    // Prevent authenticated users from visiting login
    if (pathname === '/login') {
      const target = (userRole === 'reception' && userProperty) 
        ? `/property/${userProperty}` 
        : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico|cityscape.png|logo.png).*)',
  ],
};
