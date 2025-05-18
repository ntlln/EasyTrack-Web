import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  console.log('MIDDLEWARE: path:', req.nextUrl.pathname);

  try {
    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log('MIDDLEWARE: session exists?', !!session);

    // Check if the request is for the contractor section
    if (req.nextUrl.pathname.startsWith('/contractor')) {
      // Allow access to login and forgot-password pages
      if (req.nextUrl.pathname === '/contractor/login' || req.nextUrl.pathname === '/contractor/forgot-password') {
        // If user is already logged in AND is a contractor, redirect to dashboard
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role_id')
            .eq('id', session.user.id)
            .single();
          const { data: contractorRole } = await supabase
            .from('profiles_roles')
            .select('id')
            .eq('role_name', 'Airline Staff')
            .single();
          if (profile && contractorRole && Number(profile.role_id) === Number(contractorRole.id)) {
            return NextResponse.redirect(new URL('/contractor/', req.url));
          }
        }
        return res;
      }
      // Always allow access to reset-password, regardless of session
      if (req.nextUrl.pathname === '/contractor/reset-password') {
        return res;
      }

      // For all other contractor routes, check authentication
      if (!session) {
        // Clear any existing cookies before redirecting
        const response = NextResponse.redirect(new URL('/contractor/login', req.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }

      // Verify user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, user_status_id, profiles_status (status_name)')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        console.log('MIDDLEWARE: profile not found');
        const response = NextResponse.redirect(new URL('/contractor/login', req.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }

      // Check if account is deactivated
      if (profile.profiles_status?.status_name === 'Deactivated') {
        console.log('MIDDLEWARE: profile deactivated');
        const response = NextResponse.redirect(new URL('/contractor/login', req.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }

      // Get contractor role ID (must match 'Airline Staff' in DB)
      const { data: contractorRole } = await supabase
        .from('profiles_roles')
        .select('id')
        .eq('role_name', 'Airline Staff')
        .single();

      // Check if user has contractor role
      if (!contractorRole || Number(profile.role_id) !== Number(contractorRole.id)) {
        console.log('MIDDLEWARE: not contractor role');
        const response = NextResponse.redirect(new URL('/contractor/login', req.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }
    }

    // Always allow and clear cookies for logout
    if (req.nextUrl.pathname === '/contractor/logout') {
      const response = NextResponse.redirect(new URL('/contractor/login', req.url));
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Clear cookies on error
    const response = NextResponse.redirect(new URL('/contractor/login', req.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/contractor/:path*',
  ],
}; 