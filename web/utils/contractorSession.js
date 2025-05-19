import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getContractorSession() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  // Verify if user has the correct role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, profiles_status(status_name)")
    .eq("id", session.user.id)
    .single();

  // Get both role IDs
  const { data: roles } = await supabase
    .from("profiles_roles")
    .select("id, role_name")
    .in("role_name", ["Airline Staff", "Administrator"]);

  if (!profile || !roles || roles.length === 0) {
    return null;
  }

  const allowedRoleIds = roles.map(role => role.id);

  if (profile.profiles_status?.status_name === "Deactivated" ||
      !allowedRoleIds.includes(Number(profile.role_id))) {
    return null;
  }

  return session;
}

export async function setContractorSessionCookie(rememberMe = false) {
  const supabase = createServerComponentClient({ cookies });
  
  // Set session expiry based on remember me
  const expiresIn = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 24 hours
  
  await supabase.auth.updateSession({
    expires_in: expiresIn
  });
}

export async function clearContractorSession() {
  const supabase = createServerComponentClient({ cookies });
  await supabase.auth.signOut();
} 