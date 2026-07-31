// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  const isPublicPage = req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/login';
  const isApiOrStatic = req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/_next');

  if (!session.isLoggedIn && !isPublicPage && !isApiOrStatic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session.isLoggedIn && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};