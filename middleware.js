import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './lib/security-headers';
import { isAdminDomain, isAirlineDomain, isMainDomain, isWwwDomain, getRedirectUrl, getDomainConfig } from './config/domains';

export async function middleware(req) {
  let res = NextResponse.next();
  res = applySecurityHeaders(res);
  
  const hostname = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;
  
  // Debug logging
  console.log(`[MIDDLEWARE] hostname: ${hostname}, pathname: ${pathname}`);
  console.log(`[MIDDLEWARE] isWwwDomain: ${isWwwDomain(hostname)}`);
  console.log(`[MIDDLEWARE] isMainDomain: ${isMainDomain(hostname)}`);
  
  if (isWwwDomain(hostname)) {
    const config = getDomainConfig();
    const redirectUrl = `https://${config.mainDomain}${pathname}`;
    console.log(`[MIDDLEWARE] Redirecting www: ${hostname}${pathname} → ${redirectUrl}`);
    
    // Use NextResponse.redirect with absolute URL
    const url = new URL(redirectUrl);
    return NextResponse.redirect(url, { status: 301 });
  }
  
  if (isMainDomain(hostname)) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/airline')) {
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