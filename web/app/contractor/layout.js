"use client";

import Sidebar from "../components/contractor-sidebar/page";
import '../globals.css';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Box } from "@mui/material";

export default function Layout({ children }) {
  // State and client setup
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [checkingSession, setCheckingSession] = useState(true);
  const isAuthPage = pathname === "/contractor/login" || pathname === "/contractor/forgot-password" || pathname === "/contractor/reset-password";

  // Session management
  useEffect(() => {
    if (isAuthPage) { setCheckingSession(false); return; }
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        router.replace("/contractor/login");
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
      const { data: contractorRole } = await supabase.from('profiles_roles').select('id').eq('role_name', 'Airline Staff').single();
      if (!profile || !contractorRole || Number(profile.role_id) !== Number(contractorRole.id)) {
        router.replace("/contractor/login");
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [pathname]);

  if (checkingSession) return null;
  if (isAuthPage) return <>{children}</>;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 4, ml: "64px", minHeight: "100vh", transition: "margin-left 0.3s ease" }}>
        {children}
      </Box>
    </Box>
  );
}