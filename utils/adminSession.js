import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long');
const SESSION_DURATION = 24 * 60 * 60;
const COOKIE_OPTIONS = {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
};
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
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('role_id, profiles_status(status_name)')
            .eq('id', payload.adminId)
            .single();

        if (!profile || profile.profiles_status?.status_name === "Deactivated" || profile.role_id !== 1) {
            await clearAdminSession();
            return null;
        }

        if (payload.exp * 1000 - Date.now() < 60 * 60 * 1000) {
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
        ...COOKIE_OPTIONS,
        httpOnly: true,
        maxAge: SESSION_DURATION
    });
}

export async function clearAdminSession() {
    try {
        const supabase = createServerComponentClient({ cookies });
        await supabase.auth.signOut();

        const cookieStore = cookies();
        cookieStore.delete('admin_session', COOKIE_OPTIONS);
        cookieStore.delete('sb-auth-token', COOKIE_OPTIONS);
    } catch (error) {
        const cookieStore = cookies();
        cookieStore.delete('admin_session');
        cookieStore.delete('sb-auth-token');
    }
}

export async function handleAdminLogout() {
    try {
        await clearAdminSession();

        const cookieStore = cookies();
        const allCookies = cookieStore.getAll();
        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-') || cookie.name === 'admin_session') {
                cookieStore.delete(cookie.name, COOKIE_OPTIONS);
            }
        });

        return true;
    } catch (error) {
        return false;
    }
}
