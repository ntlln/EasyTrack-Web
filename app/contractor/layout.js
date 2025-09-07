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
  const isAuthPage = pathname === "/contractor/login" || pathname === "/contractor/forgot-password" || pathname === "/contractor/reset-password" || pathname === "/contractor/verify" || pathname === "/contractor/otp";
  const contractorRoleId = 3; // Contractor

  // Session and role validation
  useEffect(() => {
    if (isAuthPage) { setCheckingSession(false); return; }
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) { router.replace("/contractor/login"); return; }

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
          router.replace("/contractor/login");
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error('Session check error:', error);
        router.replace("/contractor/login");
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