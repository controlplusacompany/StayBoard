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

  // 2. Check for auth token (matches cookie set in login/page.tsx)
  const authToken = request.cookies.get('sb_auth_token');

  // 3. Redirect to login if accessing protected route without token
  if (isProtectedRoute && !authToken) {
    const url = new URL('/login', request.url);
    // Optional: add callback URL
    // url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // 4. Redirect to dashboard if accessing login while already authenticated
  if (pathname === '/login' && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
