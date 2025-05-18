"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ColorModeContext } from "../layout";
import { useTheme } from "@mui/material/styles";
import AdminSidebar from "../components/admin-sidebar/page";

export default function AdminLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const { mode } = useContext(ColorModeContext);
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  // Don't show sidebar on auth pages
  const isAuthPage = pathname === "/egc-admin/login" ||
    pathname === "/egc-admin/forgot-password" ||
    pathname === "/egc-admin/reset-password";

  // Auth and session management
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Skip auth check for auth pages
        if (isAuthPage) {
          if (mounted) setIsLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (mounted) {
            setIsLoading(false);
            router.push("/egc-admin/login");
          }
          return;
        }

        // Verify the user's role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          if (mounted) {
            setIsLoading(false);
            router.push("/egc-admin/login");
          }
          return;
        }

        // Get admin role ID
        const { data: adminRole, error: roleError } = await supabase
          .from('profiles_roles')
          .select('id')
          .eq('role_name', 'Administrator')
          .single();

        if (roleError) {
          if (mounted) {
            setIsLoading(false);
            router.push("/egc-admin/login");
          }
          return;
        }

        // Check if user has admin role
        if (!profile || !adminRole || Number(profile.role_id) !== Number(adminRole.id)) {
          if (mounted) {
            setIsLoading(false);
            router.push("/egc-admin/login");
          }
          return;
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_OUT') {
            if (mounted) {
              setIsLoading(false);
              router.push("/egc-admin/login");
            }
          }
        });

        if (mounted) {
          setIsLoading(false);
        }

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
          router.push("/egc-admin/login");
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, isAuthPage, router]);

  // Styling constants
  const containerStyles = {
    display: "flex",
    minHeight: "100vh",
    bgcolor: "background.default",
    position: "relative"
  };
  const contentStyles = {
    flexGrow: 1,
    p: 4,
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100vh - 64px)",
    width: "calc(100% - 64px)", // Account for minimized sidebar width
    ml: "64px", // Match minimized sidebar width
    transition: "margin-left 0.2s ease-in-out, width 0.2s ease-in-out",
    "&.expanded": {
      width: "calc(100% - 280px)", // Account for expanded sidebar width
      ml: "280px" // Match expanded sidebar width
    }
  };
  const authContentStyles = {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%"
  };
  const loadingStyles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    bgcolor: "background.default"
  };

  if (isLoading && !isAuthPage) {
    return (
      <Box sx={loadingStyles}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthPage) {
    return (
      <Box sx={containerStyles}>
        <Box sx={authContentStyles}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={containerStyles}>
      <AdminSidebar />
      <Box sx={contentStyles}>
        {children}
      </Box>
    </Box>
  );
}