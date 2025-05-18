import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  console.log('MIDDLEWARE: path:', req.nextUrl.pathname);

  // Check if the request is for the contractor section
  if (req.nextUrl.pathname.startsWith('/contractor')) {
    // Allow access to all routes
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/contractor/:path*',
  ],
}; 