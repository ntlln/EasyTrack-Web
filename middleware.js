import { NextResponse } from 'next/server';
import { getAdminSession } from './utils/adminSession';
import { getContractorSessionMiddleware } from './utils/contractorSession';

export async function middleware(req) {
  const res = NextResponse.next();
  console.log('MIDDLEWARE: path:', req.nextUrl.pathname);

  // Contractor section access control
  if (req.nextUrl.pathname.startsWith('/contractor')) {
    if (
      req.nextUrl.pathname === '/contractor/login' ||
      req.nextUrl.pathname === '/contractor/forgot-password' ||
      req.nextUrl.pathname === '/contractor/reset-password' ||
      req.nextUrl.pathname === '/contractor/verify' ||
      req.nextUrl.pathname === '/contractor/otp'
    ) return res;
    const session = await getContractorSessionMiddleware(req, res);
    console.log('Session in middleware:', session);
    if (!session) {
      const url = new URL('/contractor/login', req.url);
      return NextResponse.redirect(url);
    }
  }

  // Admin section access control
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (req.nextUrl.pathname === '/admin/login') return res;
    const session = await getAdminSession();
    if (!session) {
      const url = new URL('/admin/login', req.url);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = { matcher: ['/contractor/:path*', '/admin/:path*'] }; 