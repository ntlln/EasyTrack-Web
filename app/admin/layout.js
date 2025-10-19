"use client";

import { useState, useEffect, useContext, Suspense, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Snackbar, Alert } from "@mui/material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ColorModeContext } from "../layout";
import AdminSidebar from "../components/AdminSidebar";
import LoadingSpinner from '../components/LoadingSpinner';
import { useTimeoutManager } from '../../utils/timeoutManager';
import { isAdminDomain, getDomainConfig } from '../../config/domains';

export default function Layout({ children }) {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}

function AdminLayoutContent({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient();
    const lastUserIdRef = useRef(null);
    const [toastQueue, setToastQueue] = useState([]);
    const [activeToast, setActiveToast] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useTimeoutManager();

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = getPageTitle();
        }
    }, [pathname]);

    const getPageTitle = () => {
        if (!pathname) return 'EasyTrack | Dashboard';
        const pageName = getPageNameFromPath(pathname, '/admin');
        return `EasyTrack | ${pageName}`;
    };

    const getPageNameFromPath = (path, basePath) => {
        const segments = path.replace(basePath, '').split('/').filter(Boolean);
        if (segments.length === 0) return 'Dashboard';
        
        const pageMap = {
            'dashboard': 'Dashboard', 'profile': 'Profile', 'user-management': 'User Management',
            'luggage-tracking': 'Luggage Tracking', 'luggage-management': 'Luggage Management',
            'transaction-management': 'Transaction Management', 'statistics': 'Statistics',
            'chat-support': 'Chat Support', 'logs': 'System Logs', 'verify': 'Verification',
            'login': 'Login', 'forgot-password': 'Forgot Password', 'reset-password': 'Reset Password',
            'edit-profile': 'Edit Profile', 'create-account': 'Create Account', 'view-profile': 'View Profile'
        };
        
        const firstSegment = segments[0];
        const pageName = pageMap[firstSegment] || firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).replace(/-/g, ' ');
        
        if (segments.length > 1) {
            const secondSegment = segments[1];
            const nestedPageName = pageMap[secondSegment] || secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1).replace(/-/g, ' ');
            return `${pageName} | ${nestedPageName}`;
        }
        return pageName;
    };

    const normalizedPath = pathname?.startsWith('/admin') ? pathname.replace(/^\/admin/, '') || '/' : pathname;
    const isAuthPage = normalizedPath === "/login" || normalizedPath === "/forgot-password" || normalizedPath === "/reset-password" || normalizedPath === "/verify" || normalizedPath === "/otp";
    const isLuggageManagementPage = normalizedPath === "/luggage-management";

    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            const hostname = window.location.hostname;
            if (isAdminDomain(hostname) && pathname.startsWith('/admin')) {
                const cleanPath = pathname.replace('/admin', '') || '/';
                router.replace(cleanPath);
            }
        }
    }, [pathname, router]);

    useEffect(() => {
        let mounted = true;
        let unsubscribe = null;

        const validateSession = async () => {
            try {
                if (isAuthPage) {
                    if (mounted) setIsLoading(false);
                    return;
                }

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session?.user) {
                    if (mounted) {
                        setIsLoading(false);
                        router.replace("/admin/login");
                    }
                    return;
                }

                lastUserIdRef.current = session.user.id;
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role_id')
                    .eq('id', session.user.id)
                    .single();

                if (profileError || !profile || Number(profile.role_id) !== 1) {
                    await supabase.auth.signOut();
                    if (mounted) {
                        setIsLoading(false);
                        router.replace("/admin/login");
                    }
                    return;
                }

                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
                    if (event === 'SIGNED_OUT' && mounted) {
                        setIsLoading(false);
                        router.replace("/admin/login");
                    }
                    
                    if (event === 'SIGNED_OUT') {
                        try {
                            const userId = lastUserIdRef.current;
                            if (userId) {
                                const { data: statusRow } = await supabase
                                    .from('profiles_status')
                                    .select('id')
                                    .eq('status_name', 'Signed Out')
                                    .single();
                                
                                if (statusRow?.id) {
                                    await supabase
                                        .from('profiles')
                                        .update({ user_status_id: statusRow.id })
                                        .eq('id', userId);
                                }
                            }
                        } catch (error) {
                            // Error updating user status
                        }
                    }
                });

                unsubscribe = subscription?.unsubscribe;
                if (mounted) setIsLoading(false);
            } catch (error) {
                if (mounted) {
                    setIsLoading(false);
                    router.replace("/admin/login");
                }
            }
        };

        validateSession();
        return () => {
            mounted = false;
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [isAuthPage, router]);

    useEffect(() => {
        const seed = async () => {
            if (isLoading || isAuthPage) return;
            try {
                const res = await fetch('/api/admin?action=allContracts');
                if (res.ok) {
                    const { data } = await res.json();
                    const recent = (data || []).slice(0, 20);
                    const statusNameById = new Map([
                        [1, 'Available'], [2, 'Cancelled'], [3, 'Accepted'], [4, 'In Transit'],
                        [5, 'Delivered'], [6, 'Delivery Failed'], [7, 'In Transit']
                    ]);
                    const mapped = recent.map(c => ({
                        id: `seed-contract-${c.id}-${c.created_at}`,
                        message: `Contract ${c.id} • ${statusNameById.get(Number(c.contract_status_id)) || 'Updated'}`,
                        severity: 'info', timestamp: c.created_at, read: false
                    }));
                    setNotifications(prev => {
                        const existing = new Set(prev.map(n => n.id));
                        const merged = [...mapped.filter(m => !existing.has(m.id)), ...prev];
                        return merged.slice(0, 100);
                    });
                }

                const userId = lastUserIdRef.current;
                if (userId) {
                    const convRes = await fetch(`/api/admin?action=conversations&userId=${userId}`);
                    if (convRes.ok) {
                        const { conversations } = await convRes.json();
                        const unread = (conversations || []).filter(c => (c.unreadCount || 0) > 0);
                        const mappedMsgs = unread.map(c => ({
                            id: `seed-msg-${c.id}-${c.lastMessageTime}`,
                            message: `Message from ${c.name}`, severity: 'info',
                            timestamp: c.lastMessageTime, read: false
                        }));
                        setNotifications(prev => {
                            const existing = new Set(prev.map(n => n.id));
                            const merged = [...mappedMsgs.filter(m => !existing.has(m.id)), ...prev];
                            return merged.slice(0, 100);
                        });
                    }
                }
            } catch (_) {}
        };
        seed();
    }, [isLoading, isAuthPage]);

    useEffect(() => {
        if (isLoading || isAuthPage) return;

        const statusNameById = new Map([
            [1, 'Available'], [2, 'Cancelled'], [3, 'Accepted'], [4, 'In Transit'],
            [5, 'Delivered'], [6, 'Delivery Failed'], [7, 'In Transit']
        ]);
        const severityByStatusId = new Map([
            [1, 'info'], [2, 'warning'], [3, 'info'], [4, 'info'],
            [5, 'success'], [6, 'error'], [7, 'info']
        ]);

        const channel = supabase
            .channel('contracts-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contracts' }, (payload) => {
                const contractId = payload?.new?.id;
                const statusId = Number(payload?.new?.contract_status_id) || 1;
                const message = `New contract ${contractId} • ${statusNameById.get(statusId) || 'Available'}`;
                const severity = severityByStatusId.get(statusId) || 'info';
                const notif = { id: `${Date.now()}-${contractId}-insert`, message, severity, timestamp: new Date().toISOString(), read: false };
                setToastQueue(prev => [...prev, { message, severity }]);
                setNotifications(prev => [notif, ...prev].slice(0, 100));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contracts' }, (payload) => {
                const prevStatus = Number(payload?.old?.contract_status_id);
                const nextStatus = Number(payload?.new?.contract_status_id);
                if (!nextStatus || prevStatus === nextStatus) return;
                const contractId = payload?.new?.id;
                const message = `Contract ${contractId} • ${statusNameById.get(nextStatus) || 'Updated'}`;
                const severity = severityByStatusId.get(nextStatus) || 'info';
                const notif = { id: `${Date.now()}-${contractId}-update`, message, severity, timestamp: new Date().toISOString(), read: false };
                setToastQueue(prev => [...prev, { message, severity }]);
                setNotifications(prev => [notif, ...prev].slice(0, 100));
            })
            .subscribe();

        const messagesChannel = supabase
            .channel('messages-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const msg = payload?.new;
                if (!msg || !lastUserIdRef.current || msg.receiver_id !== lastUserIdRef.current) return;

                try {
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('first_name, middle_initial, last_name, email')
                        .eq('id', msg.sender_id)
                        .single();
                    const name = sender ? `${sender.first_name || ''} ${sender.middle_initial || ''} ${sender.last_name || ''}`.replace(/  +/g, ' ').trim() || sender.email : 'New message';
                    const message = `Message from ${name}`;
                    const notif = { id: `${Date.now()}-${msg.id}-message`, message, severity: 'info', timestamp: msg.created_at || new Date().toISOString(), read: false };
                    setToastQueue(prev => [...prev, { message, severity: 'info' }]);
                    setNotifications(prev => [notif, ...prev].slice(0, 100));
                } catch (_) {
                    const message = 'New message received';
                    const notif = { id: `${Date.now()}-${msg.id}-message`, message, severity: 'info', timestamp: msg.created_at || new Date().toISOString(), read: false };
                    setToastQueue(prev => [...prev, { message, severity: 'info' }]);
                    setNotifications(prev => [notif, ...prev].slice(0, 100));
                }
            })
            .subscribe();

        return () => {
            try { supabase.removeChannel(channel); } catch (_) {}
            try { supabase.removeChannel(messagesChannel); } catch (_) {}
        };
    }, [isLoading, isAuthPage, supabase]);

    useEffect(() => {
        if (!activeToast && toastQueue.length > 0) {
            setActiveToast(toastQueue[0]);
            setToastQueue(q => q.slice(1));
        }
    }, [toastQueue, activeToast]);

    const containerStyles = { display: "flex", minHeight: "100vh", bgcolor: "background.default", position: "relative" };
    const contentStyles = { flexGrow: 1, p: 4, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)", width: "calc(100% - 64px)", ml: "64px", transition: "margin-left 0.2s ease-in-out, width 0.2s ease-in-out", bgcolor: "background.default", "&.expanded": { width: "calc(100% - 280px)", ml: "280px" } };
    const authContentStyles = { flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", bgcolor: "background.default" };

    if (isLoading && !isAuthPage && !isLuggageManagementPage) return <LoadingSpinner />;
    if (isAuthPage) return <Box sx={containerStyles}><Box sx={authContentStyles}>{children}</Box></Box>;
    return (
        <Box sx={containerStyles}>
            <AdminSidebar 
                notifications={notifications}
                markAllNotificationsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            />
            <Box sx={contentStyles}>
                {children}
            </Box>
            <Snackbar
                open={!!activeToast}
                autoHideDuration={4000}
                onClose={() => setActiveToast(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {activeToast ? (
                    <Alert
                        onClose={() => setActiveToast(null)}
                        severity={activeToast.severity}
                        variant="filled"
                        sx={{
                            width: '100%',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            '& .MuiAlert-icon': { color: '#fff' }
                        }}
                    >
                        {activeToast.message}
                    </Alert>
                ) : null}
            </Snackbar>
        </Box>
    );
}