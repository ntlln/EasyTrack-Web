import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const SESSION_DURATION = 24 * 60 * 60;
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60;

export async function getContractorSession() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase.from("profiles").select("role_id, profiles_status(status_name)").eq("id", session.user.id).single();
    if (!profile) return null;

    const allowedRoleIds = [1, 3];
    if (profile.profiles_status?.status_name === "Deactivated") return null;
    if (!allowedRoleIds.includes(Number(profile.role_id))) return null;

    const sessionExpiry = new Date(session.expires_at);
    const now = new Date();
    if (sessionExpiry - now < 60 * 60 * 1000) {
        await supabase.auth.refreshSession();
    }

    return session;
}

export async function setContractorSessionCookie(rememberMe = false) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION;
        await supabase.auth.updateSession({ expires_in: duration });
    }
}

export async function clearContractorSession() {
    try {
        const supabase = createServerComponentClient({ cookies });
        await supabase.auth.signOut();
        
        const cookieStore = cookies();
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

        const cookieOptions = {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        ['airline_session', 'sb-auth-token', 'remember_me', 'session', 'jwt', 'auth'].forEach(name => {
            cookieStore.delete(name, cookieOptions);
        });

        return true;
    } catch (error) {
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
            // Silent fallback
        }
        return false;
    }
}

export async function handleContractorLogout() {
    try {
        const supabase = createServerComponentClient({ cookies });
        await supabase.auth.signOut();
        await clearContractorSession();
        await supabase.auth.clearSession();
        return true;
    } catch (error) {
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