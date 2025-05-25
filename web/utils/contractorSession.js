import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Session management
export async function getContractorSession() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase.from("profiles").select("role_id, profiles_status(status_name)").eq("id", session.user.id).single();
    const { data: roles } = await supabase.from("profiles_roles").select("id, role_name").in("role_name", ["AirAsia", "Administrator"]);

    if (!profile || !roles || roles.length === 0) return null;

    const allowedRoleIds = roles.map(role => role.id);
    const isAdmin = roles.find(role => role.id === Number(profile.role_id))?.role_name === "Administrator";
    
    if (!isAdmin && profile.profiles_status?.status_name === "Deactivated") return null;
    if (!allowedRoleIds.includes(Number(profile.role_id))) return null;

    await supabase.auth.refreshSession();
    return session;
}

// Cookie management
export async function setContractorSessionCookie(rememberMe = false) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.auth.refreshSession();
}

export async function clearContractorSession() {
    const supabase = createServerComponentClient({ cookies });
    await supabase.auth.signOut();
} 