"use client";

import { useState, useEffect, useContext, Suspense, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ColorModeContext } from "../layout";
import { useTheme } from "@mui/material/styles";
import AdminSidebar from "../components/admin-sidebar/page";

export default function Layout({ children }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}

function AdminLayoutContent({ children }) {
    // Client setup
    const [isLoading, setIsLoading] = useState(true);
    const { mode } = useContext(ColorModeContext);
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient();
    const lastUserIdRef = useRef(null);

    // Auth page check
    const isAuthPage = pathname === "/egc-admin/login" || pathname === "/egc-admin/forgot-password" || pathname === "/egc-admin/reset-password" || pathname === "/egc-admin/verify" || pathname === "/egc-admin/otp";

    // Auth and session management
    useEffect(() => {
        let mounted = true;
        let unsubscribe = null;

        const checkSession = async () => {
            try {
                console.log('[AdminLayout] checkSession start. isAuthPage=', isAuthPage);
                if (isAuthPage) { if (mounted) { console.log('[AdminLayout] Auth page detected, stop loading'); setIsLoading(false); } return; }

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('[AdminLayout] getSession result:', { hasSession: !!session, sessionError });
                if (sessionError || !session) { if (mounted) { console.log('[AdminLayout] No session, redirect to login'); setIsLoading(false); router.replace("/egc-admin/login"); } return; }
                lastUserIdRef.current = session.user.id;

                const { data: profile, error: profileError } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
                console.log('[AdminLayout] profile fetch:', { profile, profileError });
                const adminRoleId = 1; // Administrator

                if (!profile || !adminRoleId || Number(profile.role_id) !== Number(adminRoleId)) {
                    console.warn('[AdminLayout] Role check failed. Signing out.');
                    await supabase.auth.signOut();
                    if (mounted) { console.log('[AdminLayout] Signed out due to role, redirecting'); setIsLoading(false); router.replace("/egc-admin/login"); }
                    return;
                }

                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
                    console.log('[AdminLayout] onAuthStateChange event:', event);
                    if (event === 'SIGNED_OUT' && mounted) { console.log('[AdminLayout] SIGNED_OUT -> stop loading and redirect'); setIsLoading(false); router.replace("/egc-admin/login"); }
                    if (event === 'SIGNED_OUT') {
                        try {
                            let userId = lastUserIdRef.current;
                            if (!userId) {
                                const { data: s } = await supabase.auth.getSession();
                                userId = s?.session?.user?.id || null;
                            }
                            const { data: statusRow } = await supabase
                                .from('profiles_status')
                                .select('id')
                                .eq('status_name', 'Signed Out')
                                .single();
                            const signedOutId = statusRow?.id || null;
                            if (userId && signedOutId) {
                                console.log('[AdminLayout] Updating Signed Out status for user', userId);
                                await supabase
                                    .from('profiles')
                                    .update({ user_status_id: signedOutId })
                                    .eq('id', userId);
                            }
                        } catch (_) { }
                    }
                });
                unsubscribe = subscription?.unsubscribe;

                if (mounted) { console.log('[AdminLayout] Session valid. Rendering app.'); setIsLoading(false); }
            } catch (error) {
                console.error('[AdminLayout] checkSession error:', error);
                if (mounted) { console.log('[AdminLayout] Error path -> redirect to login'); setIsLoading(false); router.replace("/egc-admin/login"); }
            }
        };
        checkSession();

        return () => {
            mounted = false;
            if (typeof unsubscribe === 'function') unsubscribe();
            console.log('[AdminLayout] cleanup complete');
        };
    }, [isAuthPage, router]);

    // Styles
    const containerStyles = { display: "flex", minHeight: "100vh", bgcolor: "background.default", position: "relative" };
    const contentStyles = { flexGrow: 1, p: 4, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)", width: "calc(100% - 64px)", ml: "64px", transition: "margin-left 0.2s ease-in-out, width 0.2s ease-in-out", "&.expanded": { width: "calc(100% - 280px)", ml: "280px" } };
    const authContentStyles = { flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" };
    const loadingStyles = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "background.default" };

    if (isLoading && !isAuthPage) return <Box sx={loadingStyles}><CircularProgress /></Box>;
    if (isAuthPage) return <Box sx={containerStyles}><Box sx={authContentStyles}>{children}</Box></Box>;
    return <Box sx={containerStyles}><AdminSidebar /><Box sx={contentStyles}>{children}</Box></Box>;
}