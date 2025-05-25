"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ColorModeContext } from "../layout";
import { useTheme } from "@mui/material/styles";
import AdminSidebar from "../components/admin-sidebar/page";

export default function Layout({ children }) {
  // Client setup
  const [isLoading, setIsLoading] = useState(true);
  const { mode } = useContext(ColorModeContext);
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  // Auth page check
  const isAuthPage = pathname === "/egc-admin/login" || pathname === "/egc-admin/forgot-password" || pathname === "/egc-admin/reset-password" || pathname === "/egc-admin/verify";

  // Auth and session management
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        if (isAuthPage) { if (mounted) setIsLoading(false); return; }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) { if (mounted) { setIsLoading(false); router.replace("/egc-admin/login"); } return; }

        const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
        const { data: adminRole } = await supabase.from('profiles_roles').select('id').eq('role_name', 'Administrator').single();

        if (!profile || !adminRole || Number(profile.role_id) !== Number(adminRole.id)) {
          await supabase.auth.signOut();
          if (mounted) { setIsLoading(false); router.replace("/egc-admin/login"); }
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_OUT' && mounted) { setIsLoading(false); router.replace("/egc-admin/login"); }
        });

        if (mounted) setIsLoading(false);
        return () => subscription?.unsubscribe();
      } catch (error) {
        if (mounted) { setIsLoading(false); router.replace("/egc-admin/login"); }
      }
    };
    checkSession();
  }, [isAuthPage, router, supabase, supabase.auth, isLoading]);

  // Styles
  const containerStyles = { display: "flex", minHeight: "100vh", bgcolor: "background.default", position: "relative" };
  const contentStyles = { flexGrow: 1, p: 4, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)", width: "calc(100% - 64px)", ml: "64px", transition: "margin-left 0.2s ease-in-out, width 0.2s ease-in-out", "&.expanded": { width: "calc(100% - 280px)", ml: "280px" } };
  const authContentStyles = { flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" };
  const loadingStyles = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "background.default" };

  if (isLoading && !isAuthPage) return <Box sx={loadingStyles}><CircularProgress /></Box>;
  if (isAuthPage) return <Box sx={containerStyles}><Box sx={authContentStyles}>{children}</Box></Box>;
  return <Box sx={containerStyles}><AdminSidebar /><Box sx={contentStyles}>{children}</Box></Box>;
}