"use client";

import Sidebar from "../components/contractor-sidebar/page";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Box } from "@mui/material";

export default function Layout({ children }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractorLayoutContent>{children}</ContractorLayoutContent>
    </Suspense>
  );
}

function ContractorLayoutContent({ children }) {
  // Client and state setup
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [checkingSession, setCheckingSession] = useState(true);
  // Auth page check (support clean URLs on subdomain and internal prefixed paths)
  const normalizedPath = pathname?.startsWith('/contractor') ? pathname.replace(/^\/contractor/, '') || '/' : pathname;
  const isAuthPage = normalizedPath === "/login" || normalizedPath === "/forgot-password" || normalizedPath === "/reset-password" || normalizedPath === "/verify" || normalizedPath === "/otp";
  const contractorRoleId = 3; // Contractor

  // Session and role validation
  useEffect(() => {
    if (isAuthPage) { setCheckingSession(false); return; }
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) { router.replace("/login"); return; }

        const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
        // const { data: contractorRole } = await supabase.from('profiles_roles').select('id').eq('role_name', 'AirAsia').single();

        if (!profile || !profile.role_id || Number(profile.role_id) !== Number(contractorRoleId)) {
          try {
            const userId = session.user.id;
            const { data: statusRow } = await supabase
              .from('profiles_status')
              .select('id')
              .eq('status_name', 'Signed Out')
              .single();
            const signedOutId = statusRow?.id || null;
            if (signedOutId) {
              await supabase
                .from('profiles')
                .update({ user_status_id: signedOutId })
                .eq('id', userId);
            }
          } catch (_) { }
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error('Session check error:', error);
        router.replace("/login");
      }
    };
    checkSession();
  }, [pathname]);

  // Styles
  const containerStyles = { display: "flex", minHeight: "100vh", margin: 0, padding: 0, overflowX: "hidden" };
  const contentStyles = { flexGrow: 1, p: 4, ml: "64px", minHeight: "100vh", transition: "margin-left 0.3s ease" };

  if (checkingSession) return null;
  if (isAuthPage) return <Box sx={{ margin: 0, padding: 0, overflowX: "hidden", height: "100vh" }}>{children}</Box>;

  return (
    <Box sx={containerStyles}>
      <Sidebar />
      <Box sx={contentStyles}>{children}</Box>
    </Box>
  );
}