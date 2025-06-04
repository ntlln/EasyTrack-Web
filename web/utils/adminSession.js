import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long');
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

// Session management functions
export async function createAdminSession(adminId) {
    const token = await new SignJWT({ adminId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(SESSION_DURATION + 's')
        .sign(JWT_SECRET);
    
    await setAdminSessionCookie(token);
    return token;
}

export async function getAdminSession() {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session');
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const supabase = createServerComponentClient({ cookies });
        
        // Verify user still exists and has admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role_id, profiles_status(status_name)')
            .eq('id', payload.adminId)
            .single();

        if (!profile || profile.profiles_status?.status_name === "Deactivated" || profile.role_id !== 1) {
            await clearAdminSession();
            return null;
        }

        // Refresh session if it's about to expire (within 1 hour)
        const expirationTime = new Date(payload.exp * 1000);
        const now = new Date();
        if (expirationTime - now < 60 * 60 * 1000) { // Less than 1 hour remaining
            await createAdminSession(payload.adminId);
        }

        return payload;
    } catch (error) {
        await clearAdminSession();
        return null;
    }
}

export async function setAdminSessionCookie(token) {
    const cookieStore = cookies();
    cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION,
        path: '/'
    });
}

export async function clearAdminSession() {
    try {
        // Clear Supabase session
        const supabase = createServerComponentClient({ cookies });
        await supabase.auth.signOut();

        // Clear admin session cookie
        const cookieStore = cookies();
        cookieStore.delete('admin_session', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any other related cookies
        cookieStore.delete('sb-auth-token', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    } catch (error) {
        console.error('Error clearing admin session:', error);
        // Even if there's an error, try to clear the cookies
        const cookieStore = cookies();
        cookieStore.delete('admin_session');
        cookieStore.delete('sb-auth-token');
    }
}

// Comprehensive logout function
export async function handleAdminLogout() {
    try {
        // Clear all sessions
        await clearAdminSession();

        // Clear any remaining auth-related cookies
        const cookieStore = cookies();
        const allCookies = cookieStore.getAll();
        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-') || cookie.name === 'admin_session') {
                cookieStore.delete(cookie.name, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }
        });

        return true;
    } catch (error) {
        console.error('Error during admin logout:', error);
        return false;
    }
}

// Middleware session check
export async function getAdminSessionMiddleware(req, res) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, profiles_status(status_name)')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.profiles_status?.status_name === "Deactivated" || profile.role_id !== 1) {
        await clearAdminSession();
        return null;
    }

    return session;
} 