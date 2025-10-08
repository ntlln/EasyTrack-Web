import { NextResponse } from 'next/server';
import { getAdminSessionMiddleware } from './utils/adminSession';
import { getContractorSessionMiddleware } from './utils/contractorSession';

export async function middleware(req) {
  const res = NextResponse.next();
  console.log('MIDDLEWARE: path:', req.nextUrl.pathname);
  const hostHeader = (req.headers.get('host') || req.nextUrl.host || '').toLowerCase();
  const hostname = ((hostHeader.split(':')[0] || '') || req.nextUrl.hostname || '').replace(/\.$/, '');
  const path = req.nextUrl.pathname;

  const MAIN_HOST = 'www.ghe-easytrack.org';
  const ADMIN_HOST = 'www.admin.ghe-easytrack.org';
  const CONTRACTOR_HOST = 'www.airline.ghe-easytrack.org';

  // Localhost subdomains support for development
  const isLocalTld = hostname.endsWith('.localhost');
  const firstLabel = hostname.split('.').shift();
  const stripWww = (h) => h?.startsWith('www.') ? h.slice(4) : h;
  const prodHost = stripWww(hostname);
  const isProdMainHost = prodHost === 'ghe-easytrack.org';
  const isProdAdminHost = prodHost === 'admin.ghe-easytrack.org';
  const isProdContractorHost = prodHost === 'airline.ghe-easytrack.org';
  const isMainHost = isProdMainHost || hostname === 'localhost' || hostname === '127.0.0.1';
  const isAdminHost = isProdAdminHost || hostname === 'admin.localhost' || (isLocalTld && firstLabel === 'admin');
  const isContractorHost = isProdContractorHost || hostname === 'airline.localhost' || (isLocalTld && firstLabel === 'airline');

  console.log('MIDDLEWARE: hostname:', hostname, 'isAdminHost:', isAdminHost, 'isContractorHost:', isContractorHost);

  // Skip Next.js internals, API routes, and static assets
  const isNextInternal = path.startsWith('/_next');
  const isApiRoute = path.startsWith('/api');
  const isAsset = path.includes('.') || path === '/favicon.ico' || path === '/robots.txt' || path === '/sitemap.xml';
  if (isNextInternal || isApiRoute || isAsset) {
    return res;
  }

  // Block protected spaces on the main domain
  if (isMainHost) {
    if (path.startsWith('/egc-admin') || path.startsWith('/contractor')) {
      return new NextResponse('Not Found', { status: 404 });
    }
    return res;
  }

  // Admin subdomain: hide /egc-admin in URL while rewriting internally
  if (isAdminHost) {
    // If user tries to access with prefix, redirect to clean URL
    if (path.startsWith('/egc-admin')) {
      const cleanPath = path.replace(/^\/egc-admin/, '') || '/';
      const cleanUrl = new URL(cleanPath, req.url);
      return NextResponse.redirect(cleanUrl);
    }

    const internalPath = `/egc-admin${path === '/' ? '' : path}`;
    const internalUrl = new URL(internalPath, req.url);

    // Auth exceptions (user-facing clean URLs)
    const isAuthPage = ['/login', '/forgot-password', '/reset-password', '/verify', '/otp']
      .some(p => path === p);
    if (!isAuthPage) {
      const session = await getAdminSessionMiddleware(req, res);
      if (!session) {
        // Redirect user to clean login URL
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Rewrite to internal admin route structure
    return NextResponse.rewrite(internalUrl);
  }

  // Contractor subdomain: hide /contractor in URL while rewriting internally
  if (isContractorHost) {
    // If user tries to access with prefix, redirect to clean URL
    if (path.startsWith('/contractor')) {
      const cleanPath = path.replace(/^\/contractor/, '') || '/';
      const cleanUrl = new URL(cleanPath, req.url);
      return NextResponse.redirect(cleanUrl);
    }

    const internalPath = `/contractor${path === '/' ? '' : path}`;
    const internalUrl = new URL(internalPath, req.url);

    // Auth exceptions (user-facing clean URLs)
    const isAuthPage = ['/login', '/forgot-password', '/reset-password', '/verify', '/otp']
      .some(p => path === p);
    if (!isAuthPage) {
      const session = await getContractorSessionMiddleware(req, res);
      if (!session) {
        // Redirect user to clean login URL
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Rewrite to internal contractor route structure
    return NextResponse.rewrite(internalUrl);
  }

  return res;
}

export const config = { matcher: ['/:path*'] };