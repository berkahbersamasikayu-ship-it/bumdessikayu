import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  const isLoginPage = req.nextUrl.pathname === '/login';
  const isProtectedRoute = !isLoginPage && req.nextUrl.pathname !== '/api/login';

  if (!session.isLoggedIn && isProtectedRoute && req.nextUrl.pathname.startsWith('/')) {
    // Kecualikan API routes dan static assets
    if (!req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (session.isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*|favicon.ico).*)',],
};