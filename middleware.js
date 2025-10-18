import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './lib/security-headers';
import { isAdminDomain, isAirlineDomain, isMainDomain, isWwwDomain, getRedirectUrl } from './config/domains';

export async function middleware(req) {
  let res = NextResponse.next();
  
  // Apply security headers
  res = applySecurityHeaders(res);
  
  // Handle domain-based routing
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    const hostname = req.headers.get('host') || '';
    const pathname = req.nextUrl.pathname;
    
    
    // Handle www redirect to main domain
    if (isWwwDomain(hostname)) {
      const redirectUrl = getRedirectUrl(hostname, pathname);
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Handle main domain routing
    if (isMainDomain(hostname)) {
      // Redirect admin/airline paths to their respective subdomains
      if (pathname.startsWith('/admin') || pathname.startsWith('/airline')) {
        const redirectUrl = getRedirectUrl(hostname, pathname);
        if (redirectUrl) {
          return NextResponse.redirect(redirectUrl);
        }
      }
      // For root path, redirect to admin portal
      if (pathname === '/') {
        const redirectUrl = getRedirectUrl(hostname, pathname);
        if (redirectUrl) {
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
    
    // Domain routing for subdomains - handle clean URLs
    if (isAdminDomain(hostname)) {
      // If accessing /admin path on admin domain, redirect to clean URL
      if (pathname.startsWith('/admin')) {
        const cleanPath = pathname.replace('/admin', '') || '/';
        const cleanUrl = new URL(cleanPath, req.url);
        return NextResponse.redirect(cleanUrl);
      }
      // For admin domain, rewrite to /admin path internally
      if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
        const adminUrl = new URL(`/admin${pathname}`, req.url);
        return NextResponse.rewrite(adminUrl);
      }
    }
    
    if (isAirlineDomain(hostname)) {
      // If accessing /airline path on airline domain, redirect to clean URL
      if (pathname.startsWith('/airline')) {
        const cleanPath = pathname.replace('/airline', '') || '/';
        const cleanUrl = new URL(cleanPath, req.url);
        return NextResponse.redirect(cleanUrl);
      }
      // For airline domain, rewrite to /airline path internally
      if (pathname !== '/airline' && !pathname.startsWith('/airline/')) {
        const airlineUrl = new URL(`/airline${pathname}`, req.url);
        return NextResponse.rewrite(airlineUrl);
      }
    }
  }
  
  return res;
}

export const config = { 
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};