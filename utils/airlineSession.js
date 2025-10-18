import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { jwtVerify, SignJWT } from 'jose';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long');
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// Session management
export async function getContractorSession() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase.from("profiles").select("role_id, profiles_status(status_name)").eq("id", session.user.id).single();
    if (!profile) return null;

    const allowedRoleIds = [1, 3]; // 1 = Administrator, 3 = Contractor Personnel
    if (profile.profiles_status?.status_name === "Deactivated") return null;
    if (!allowedRoleIds.includes(Number(profile.role_id))) return null;

    // Check if session needs refresh (within 1 hour of expiry)
    const sessionExpiry = new Date(session.expires_at);
    const now = new Date();
    if (sessionExpiry - now < 60 * 60 * 1000) { // Less than 1 hour remaining
        await supabase.auth.refreshSession();
    }

    return session;
}

// Cookie management
export async function setContractorSessionCookie(rememberMe = false) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Set session duration based on remember me preference
        const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION;
        await supabase.auth.updateSession({ expires_in: duration });
    }
}

export async function clearContractorSession() {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Clear Supabase session and all related data
        await supabase.auth.signOut();
        
        // Clear all cookies
        const cookieStore = cookies();
        
        // Clear all Supabase-related cookies
        const allCookies = cookieStore.getAll();
        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                cookieStore.delete(cookie.name, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }
        });

        // Clear airline-specific cookies
        cookieStore.delete('airline_session', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any remaining auth-related cookies
        cookieStore.delete('sb-auth-token', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any potential remember me cookies
        cookieStore.delete('remember_me', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any session-related cookies
        cookieStore.delete('session', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any JWT-related cookies
        cookieStore.delete('jwt', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Clear any remaining auth cookies
        cookieStore.delete('auth', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return true;
    } catch (error) {
        console.error('Error clearing airline session:', error);
        // Even if there's an error, try to clear all cookies
        try {
            const cookieStore = cookies();
            const allCookies = cookieStore.getAll();
            allCookies.forEach(cookie => {
                cookieStore.delete(cookie.name, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            });
        } catch (clearError) {
            console.error('Error during fallback cookie clearing:', clearError);
        }
        return false;
    }
}

// Comprehensive logout function
export async function handleContractorLogout() {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // First, clear the Supabase session
        await supabase.auth.signOut();
        
        // Then clear all cookies and local storage
        await clearContractorSession();
        
        // Clear any remaining Supabase data
        await supabase.auth.clearSession();
        
        return true;
    } catch (error) {
        console.error('Error during airline logout:', error);
        // Try to clear everything even if there's an error
        await clearContractorSession();
        return false;
    }
}

export async function getContractorSessionMiddleware(req, res) {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, profiles_status(status_name)')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.profiles_status?.status_name === "Deactivated" || ![1, 3].includes(Number(profile.role_id))) {
        await clearContractorSession();
        return null;
    }

    return session;
} 