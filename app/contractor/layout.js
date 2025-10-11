"use client";

import Sidebar from "../components/ContractorSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Box } from "@mui/material";
import LoadingSpinner from '../components/LoadingSpinner';
import { useTimeoutManager } from '../../utils/timeoutManager';

export default function Layout({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
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

  // Timeout manager for automatic logout after 30 minutes of inactivity
  useTimeoutManager();

  // Enhanced session validation
  useEffect(() => {
    if (isAuthPage) {
      setCheckingSession(false);
      return;
    }

    const validateSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role_id')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || Number(profile.role_id) !== contractorRoleId) {
          try {
            const { data: statusRow } = await supabase
              .from('profiles_status')
              .select('id')
              .eq('status_name', 'Signed Out')
              .single();
            
            if (statusRow?.id) {
              await supabase
                .from('profiles')
                .update({ user_status_id: statusRow.id })
                .eq('id', session.user.id);
            }
          } catch (error) {
            console.error('Error updating user status:', error);
          }
          
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error('Session validation error:', error);
        router.replace("/login");
      }
    };

    validateSession();
  }, [pathname, supabase, router, contractorRoleId, isAuthPage]);

  // Styles
  const containerStyles = { display: "flex", minHeight: "100vh", margin: 0, padding: 0, overflowX: "hidden", bgcolor: "background.default" };
  const contentStyles = { flexGrow: 1, p: 4, ml: "64px", minHeight: "100vh", transition: "margin-left 0.3s ease", bgcolor: "background.default" };

  if (checkingSession) {
    // Add small delay to prevent overlap with main layout loading
    return <LoadingSpinner />;
  }
  if (isAuthPage) return <Box sx={{ margin: 0, padding: 0, overflowX: "hidden", height: "100vh", bgcolor: "background.default" }}>{children}</Box>;

  return (
    <Box sx={containerStyles}>
      <Sidebar />
      <Box sx={contentStyles}>{children}</Box>
    </Box>
  );
}