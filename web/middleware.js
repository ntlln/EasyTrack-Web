import { NextResponse } from 'next/server';
import { getAdminSession } from './utils/adminSession';
import { getContractorSession } from './utils/contractorSession';

export async function middleware(req) {
  const res = NextResponse.next();
  console.log('MIDDLEWARE: path:', req.nextUrl.pathname);

  // Check if the request is for the contractor section
  if (req.nextUrl.pathname.startsWith('/contractor')) {
    // Allow access to login page without authentication
    if (req.nextUrl.pathname === '/contractor/login' || 
        req.nextUrl.pathname === '/contractor/forgot-password') {
      return res;
    }

    const session = await getContractorSession();
    
    // If no valid session, redirect to contractor login
    if (!session) {
      const url = new URL('/contractor/login', req.url);
      url.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Check if the request is for the admin section
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page without authentication
    if (req.nextUrl.pathname === '/admin/login') {
      return res;
    }

    const session = await getAdminSession();
    
    // If no valid session, redirect to admin login
    if (!session) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/contractor/:path*',
    '/admin/:path*',
  ],
}; 