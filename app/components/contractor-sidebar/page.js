"use client";

import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Button, IconButton, useMediaQuery, Typography, Snackbar, Alert, Avatar, Tooltip } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import WarningIcon from '@mui/icons-material/Warning';
import { ColorModeContext } from "../../layout";
import { useTheme } from "@mui/material/styles";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ContractorSidebarContent />
        </Suspense>
    );
}

function ContractorSidebarContent() {
    // State and context setup
    const [openPages, setOpenPages] = useState(() => typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('contractorSidebarTransactionsOpen') || 'true') : true);
    const [isMinimized, setIsMinimized] = useState(true);
    const { mode, toggleMode } = useContext(ColorModeContext);
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const chatUnreadIntervalRef = useRef(null);
    const prevUnreadRef = useRef(0);
    const prevUnreadByConvRef = useRef(new Map());
    const didInitRef = useRef(false);
    const [toast, setToast] = useState({ open: false, title: '', message: '', severity: 'info', targetUserId: null });
    const [profile, setProfile] = useState(null);
    const [corporationName, setCorporationName] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const closeToast = () => setToast(prev => ({ ...prev, open: false }));

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector('[data-sidebar]');
            if (!sidebar?.contains(event.target)) setIsMinimized(true);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save state to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.setItem('contractorSidebarTransactionsOpen', JSON.stringify(openPages));
    }, [openPages]);

    // Start polling unread conversations and show toast on increase
    useEffect(() => {
        const setup = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const userId = session.user.id;

            // Fetch basic profile with role_id, corporation_id, and verification status
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select(`
                        first_name, middle_initial, last_name, email, pfp_id, role_id, corporation_id,
                        verify_status_id, verify_status(status_name)
                    `)
                    .eq('id', userId)
                    .single();
                setProfile(profileData || { email: session.user.email });
                
                // Set verification status
                const verified = profileData?.verify_status?.status_name === 'Verified';
                setIsVerified(verified);
                setVerificationStatus(profileData?.verify_status?.status_name || 'Not Verified');
                
                console.log('[ContractorSidebar] Verification status:', {
                    verifyStatusId: profileData?.verify_status_id,
                    statusName: profileData?.verify_status?.status_name,
                    isVerified: verified
                });
                
                if (profileData?.corporation_id) {
                    try {
                        const { data: corp } = await supabase
                            .from('profiles_corporation')
                            .select('corporation_name')
                            .eq('id', profileData.corporation_id)
                            .single();
                        setCorporationName(corp?.corporation_name || '');
                    } catch (_) { /* ignore */ }
                } else {
                    setCorporationName('');
                }
            } catch (_) { /* ignore profile fetch errors */ }

            const fetchUnread = async () => {
                try {
                    const res = await fetch(`/api/admin?action=conversations&userId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        const conversations = data.conversations || [];
                        const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

                        // Compute per-conversation increases
                        const prevMap = prevUnreadByConvRef.current || new Map();
                        const increases = [];
                        let totalDelta = 0;
                        conversations.forEach(c => {
                            const prev = prevMap.get(c.id) || 0;
                            const cur = c.unreadCount || 0;
                            if (cur > prev) {
                                increases.push({ ...c, delta: cur - prev });
                                totalDelta += (cur - prev);
                            }
                        });

                        if (didInitRef.current && totalDelta > 0) {
                            const mostRecent = increases.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))[0];
                            if (mostRecent) {
                                const label = `${mostRecent.name}${mostRecent.role ? ` - ${mostRecent.role}` : ''}`;
                                const suffix = totalDelta > 1 ? ` (+${totalDelta - 1} more)` : '';
                                setToast({ open: true, title: label, message: `${mostRecent.lastMessage}${suffix}`.trim(), severity: 'info', targetUserId: mostRecent.id });
                            }
                        }

                        // Update refs and state
                        const nextMap = new Map();
                        conversations.forEach(c => nextMap.set(c.id, c.unreadCount || 0));
                        prevUnreadByConvRef.current = nextMap;
                        prevUnreadRef.current = totalUnread;
                        setChatUnreadCount(totalUnread);
                        if (!didInitRef.current) didInitRef.current = true;
                    }
                } catch (_) { /* ignore */ }
            };

            // initial fetch and interval
            fetchUnread();
            if (chatUnreadIntervalRef.current) clearInterval(chatUnreadIntervalRef.current);
            chatUnreadIntervalRef.current = setInterval(fetchUnread, 5000);
        };
        setup();
        return () => {
            if (chatUnreadIntervalRef.current) {
                clearInterval(chatUnreadIntervalRef.current);
                chatUnreadIntervalRef.current = null;
            }
        };
    }, []);

    // Navigation and auth handlers
    const handleClickPages = () => isMinimized ? setIsMinimized(false) : setOpenPages(!openPages);
    const handleNavigation = (route) => { router.push(route); setIsMinimized(true); };
    const isActive = (route) => pathname === route;
    const isDropdownActive = () => openPages;

    // Auth handlers
    const handleLogout = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            if (userId) {
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
            }
        } catch (_) { /* ignore status update errors on logout */ }
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).filter(key => key.startsWith('sb-') && key.endsWith('-auth-token')).forEach(key => localStorage.removeItem(key));
            sessionStorage.clear();
        }
        router.push("/contractor/login");
    };

    // Styles
    const activeStyles = { backgroundColor: mode === "light" ? "#f0f0f0" : "#333", color: theme.palette.primary.main, borderRadius: 1 };
    const sidebarStyles = { width: isMinimized ? "64px" : "280px", height: "100vh", bgcolor: "background.paper", display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider", position: "fixed", dataSidebar: true, overflowY: 'auto', overflowX: 'hidden', transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }), zIndex: 1200, '&::-webkit-scrollbar': { width: '8px', height: '0px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: theme.palette.mode === 'light' ? '#ccc' : '#555', borderRadius: '4px' } };
    const headerStyles = { p: 1, display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "80px", position: "relative" };
    const logoStyles = { height: 50, width: "auto", cursor: "pointer", display: isMinimized ? "none" : "block", flex: 1, objectFit: "contain" };
    const menuButtonStyles = { position: isMinimized ? "absolute" : "static", right: isMinimized ? "50%" : "auto", transform: isMinimized ? "translateX(50%)" : "none", top: isMinimized ? 25 : "auto" };
    const listItemStyles = (route) => ({ ...(isActive(route) ? activeStyles : {}), minHeight: 48, px: isMinimized ? 0 : 2, justifyContent: isMinimized ? 'center' : 'flex-start', '& .MuiListItemIcon-root': { minWidth: isMinimized ? 'auto' : 40, justifyContent: 'center' }, '& .MuiListItemText-root': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '& .MuiTypography-root': { fontSize: '0.875rem', lineHeight: 1.2 } } });
    const iconStyles = (route) => ({ color: isActive(route) ? theme.palette.primary.main : "primary.main", fontSize: 24 });
    const bottomSectionStyles = { p: 1, display: "flex", flexDirection: "column", gap: 1 };
    const buttonStyles = { textTransform: "none", minWidth: isMinimized ? 'auto' : undefined, px: isMinimized ? 1 : 2, justifyContent: isMinimized ? 'center' : 'flex-start', minHeight: 48, '& .MuiButton-startIcon': { margin: isMinimized ? 0 : undefined } };
    const modeButtonStyles = { ...buttonStyles, '& .MuiTypography-root': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem', lineHeight: 1.2 } };
    const transactionsButtonStyles = { ...listItemStyles("/contractor/transactions"), ...(isDropdownActive() ? activeStyles : {}) };
    const ROLE_NAME_BY_ID = { 1: 'Administrator', 2: 'Delivery Personnel', 3: 'Airline Personnel' };

    return (
        <>
        <Box sx={sidebarStyles} data-sidebar="true">
            <Box sx={headerStyles}>
                <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={logoStyles} onClick={() => handleNavigation("/contractor/")} />
                <IconButton onClick={() => setIsMinimized(!isMinimized)} size="small" sx={menuButtonStyles}><MenuIcon /></IconButton>
            </Box>

            <Divider />

            <Box flexGrow={1}>
                <List component="nav" sx={{ flexGrow: 1 }}>
                    <ListItemButton onClick={() => handleNavigation("/contractor/")} sx={listItemStyles("/contractor/")}>
                        <ListItemIcon><DashboardIcon sx={iconStyles("/contractor/")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="Dashboard" />}
                    </ListItemButton>

                    <ListItemButton onClick={() => handleNavigation("/contractor/profile")} sx={listItemStyles("/contractor/profile")}>
                        <ListItemIcon><AccountCircleIcon sx={iconStyles("/contractor/profile")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="Profile" />}
                    </ListItemButton>

                    <ListItemButton onClick={handleClickPages} sx={transactionsButtonStyles}>
                        <ListItemIcon><InventoryIcon sx={{ color: isDropdownActive() ? theme.palette.primary.main : "primary.main" }} /></ListItemIcon>
                        {!isMinimized && <><ListItemText primary="Transactions" />{openPages ? <ExpandLess /> : <ExpandMore />}</>}
                    </ListItemButton>

                    {!isMinimized && openPages && (
                        <Collapse in={openPages} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2 }}>
                                <ListItemButton 
                                    sx={{ 
                                        pl: 4, 
                                        ...(isActive("/contractor/booking") ? activeStyles : {}), 
                                        ...listItemStyles("/contractor/booking"),
                                        ...(isVerified ? {} : { 
                                            opacity: 0.5, 
                                            cursor: 'not-allowed',
                                            '&:hover': { backgroundColor: 'transparent' }
                                        })
                                    }} 
                                    onClick={() => isVerified ? handleNavigation("/contractor/booking") : null}
                                    disabled={!isVerified}
                                >
                                    <ListItemIcon>
                                        <ArticleIcon sx={{
                                            ...iconStyles("/contractor/booking"),
                                            ...(isVerified ? {} : { opacity: 0.5 })
                                        }} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span>Booking</span>
                                                {!isVerified && (
                                                    <Tooltip title="Complete account verification" arrow>
                                                        <WarningIcon sx={{ 
                                                            color: 'warning.main',
                                                            fontSize: '1rem'
                                                        }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        } 
                                    />
                                </ListItemButton>

                                <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/luggage-tracking") ? activeStyles : {}), ...listItemStyles("/contractor/luggage-tracking") }} onClick={() => handleNavigation("/contractor/luggage-tracking")}>
                                    <ListItemIcon><MyLocationIcon sx={iconStyles("/contractor/luggage-tracking")} /></ListItemIcon>
                                    <ListItemText primary="Luggage Tracking" />
                                </ListItemButton>
                            </List>
                        </Collapse>
                    )}

                    <ListItemButton onClick={() => handleNavigation("/contractor/chat-support")} sx={{ ...listItemStyles("/contractor/chat-support"), position: 'relative' }}>
                        <ListItemIcon sx={{ position: 'relative' }}>
                            <SupportAgentIcon sx={iconStyles("/contractor/chat-support")} />
                            {isMinimized && chatUnreadCount > 0 && (
                                <Box sx={{ position: 'absolute', top: -2, right: -2, bgcolor: 'primary.main', color: '#fff', borderRadius: '10px', px: 0.5, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1 }}>
                                    {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                                </Box>
                            )}
                        </ListItemIcon>
                        {!isMinimized && (
                            <>
                                <ListItemText primary="Chat Support" />
                                {chatUnreadCount > 0 && (
                                    <Box sx={{ ml: 1, bgcolor: 'primary.main', color: '#fff', borderRadius: '12px', px: 1, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: 1 }}>
                                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                                    </Box>
                                )}
                            </>
                        )}
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            <Box sx={bottomSectionStyles}>
                {isMinimized ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                        <Avatar src={profile?.pfp_id || undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: '#fff' }}>
                            {((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase() || (profile?.email?.[0] || 'A').toUpperCase()}
                        </Avatar>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 1, gap: 1 }}>
                        <Avatar src={profile?.pfp_id || undefined} sx={{ bgcolor: 'primary.main', color: '#fff' }}>
                            {((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase() || (profile?.email?.[0] || 'A').toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                {`${profile?.first_name || ''} ${profile?.middle_initial || ''} ${profile?.last_name || ''}`.replace(/  +/g, ' ').trim() || profile?.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {(ROLE_NAME_BY_ID[Number(profile?.role_id)] || 'No Role') + (corporationName ? ` - ${corporationName}` : '')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: isVerified ? 'success.main' : 'warning.main' 
                                }} />
                                <Typography variant="caption" color={isVerified ? 'success.main' : 'warning.main'} sx={{ fontWeight: 500 }}>
                                    {verificationStatus}
                                </Typography>
                            </Box>
                        </Box>
                        
                    </Box>
                )}
                <Button variant="contained" startIcon={mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />} onClick={toggleMode} fullWidth sx={buttonStyles}>
                    {!isMinimized && <Typography noWrap>{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</Typography>}
                </Button>

                <Button variant="contained" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} fullWidth sx={buttonStyles}>
                    {!isMinimized && "Logout"}
                </Button>
            </Box>
        </Box>
        <Snackbar 
            open={toast.open} 
            autoHideDuration={4000} 
            onClose={closeToast}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%', bgcolor: 'primary.main', color: 'primary.contrastText', '& .MuiAlert-icon': { color: 'primary.contrastText' }, cursor: toast.targetUserId ? 'pointer' : 'default' }} onClick={() => { if (toast.targetUserId) { closeToast(); router.push(`/contractor/chat-support?openUser=${toast.targetUserId}`); } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 600 }}>{toast.title}</Typography>
                    <Typography sx={{ mt: 0.5 }}>{toast.message}</Typography>
                </Box>
            </Alert>
        </Snackbar>

        </>
    );
}