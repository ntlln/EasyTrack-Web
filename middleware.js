import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './lib/security-headers';
import { isAdminDomain, isAirlineDomain, isMainDomain, isWwwDomain, getRedirectUrl } from './config/domains';

export async function middleware(req) {
  let res = NextResponse.next();
  res = applySecurityHeaders(res);
  
  const hostname = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;
  
  if (isWwwDomain(hostname)) {
    const redirectUrl = getRedirectUrl(hostname, pathname);
    if (redirectUrl) return NextResponse.redirect(redirectUrl);
  }
  
  if (isMainDomain(hostname)) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/airline') || pathname === '/') {
      const redirectUrl = getRedirectUrl(hostname, pathname);
      if (redirectUrl) return NextResponse.redirect(redirectUrl);
    }
  }
  
  if (isAdminDomain(hostname)) {
    if (pathname.startsWith('/admin')) {
      const cleanPath = pathname.replace('/admin', '') || '/';
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }
    if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
  }
  
  if (isAirlineDomain(hostname)) {
    if (pathname.startsWith('/airline')) {
      const cleanPath = pathname.replace('/airline', '') || '/';
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }
    if (pathname !== '/airline' && !pathname.startsWith('/airline/')) {
      return NextResponse.rewrite(new URL(`/airline${pathname}`, req.url));
    }
  }
  
  return res;
}

export const config = { 
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|ph-address|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ]
};