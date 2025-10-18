import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './lib/security-headers';

export async function middleware(req) {
  let res = NextResponse.next();
  
  // Apply security headers
  res = applySecurityHeaders(res);
  
  return res;
}

export const config = { matcher: ['/:path*'] };