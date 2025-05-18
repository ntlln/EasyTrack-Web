"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Button, IconButton, useMediaQuery } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import { ColorModeContext } from "../../layout";
import { useTheme } from "@mui/material/styles";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Sidebar() {
    // State and context management
    const [openPages, setOpenPages] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const { mode, toggleMode } = useContext(ColorModeContext);
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Click outside handler for sidebar
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector('[data-sidebar]');
            if (!isMinimized && sidebar && !sidebar.contains(event.target)) setIsMinimized(true);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMinimized]);

    // Navigation and session management
    const handleClickPages = () => setOpenPages(!openPages);
    const handleNavigation = (route) => { router.push(route); setIsMinimized(true); };
    const isActive = (route) => pathname === route;
    const isDropdownActive = () => openPages || pathname === "/egc-admin/luggage-tracking" || pathname === "/egc-admin/history-and-reports" || pathname === "/egc-admin/statistics";

    // Auth management
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) router.push("/egc-admin/login");
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') { localStorage.clear(); sessionStorage.clear(); }
        router.push("/egc-admin/login");
    };

    // Styling constants
    const activeStyles = { backgroundColor: mode === "light" ? "#f0f0f0" : "#333", color: theme.palette.primary.main, borderRadius: 1 };
    const sidebarStyles = { width: isMinimized ? "80px" : "280px", height: "100vh", bgcolor: "background.paper", display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider", position: "fixed", dataSidebar: true, overflowY: 'auto', transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }), zIndex: 1200 };
    const listItemStyles = (route) => ({ ...(isActive(route) ? activeStyles : {}), justifyContent: isMinimized ? 'center' : 'flex-start', px: isMinimized ? 1 : 2 });
    const iconStyles = (route) => ({ minWidth: isMinimized ? 'auto' : 40, color: isActive(route) ? theme.palette.primary.main : "primary.main" });

    return (
        <Box sx={sidebarStyles}>
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                {!isMinimized && <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={{ height: 50, cursor: "pointer" }} onClick={() => handleNavigation("/egc-admin/")} />}
                <IconButton onClick={() => setIsMinimized(!isMinimized)} size="small"><MenuIcon /></IconButton>
            </Box>

            <Divider />

            <Box flexGrow={1}>
                <List component="nav" sx={{ flexGrow: 1 }}>
                    <ListItemButton onClick={() => handleNavigation("/egc-admin/")} sx={listItemStyles("/egc-admin/")}>
                        <ListItemIcon><DashboardIcon sx={iconStyles("/egc-admin/")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="Dashboard" />}
                    </ListItemButton>

                    <ListItemButton onClick={() => handleNavigation("/egc-admin/profile")} sx={listItemStyles("/egc-admin/profile")}>
                        <ListItemIcon><AccountCircleIcon sx={iconStyles("/egc-admin/profile")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="Profile" />}
                    </ListItemButton>

                    <ListItemButton onClick={() => handleNavigation("/egc-admin/user-management")} sx={listItemStyles("/egc-admin/user-management")}>
                        <ListItemIcon><GroupsIcon sx={iconStyles("/egc-admin/user-management")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="User Management" />}
                    </ListItemButton>

                    {!isMinimized && (
                        <>
                            <ListItemButton onClick={handleClickPages} sx={isDropdownActive() ? activeStyles : {}}>
                                <ListItemIcon><InventoryIcon sx={{ color: isDropdownActive() ? theme.palette.primary.main : "primary.main" }} /></ListItemIcon>
                                <ListItemText primary="Transactions" />
                                {openPages ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>

                            <Collapse in={openPages} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/luggage-tracking") ? activeStyles : {}) }} onClick={() => handleNavigation("/egc-admin/luggage-tracking")}>
                                        <ListItemIcon><MyLocationIcon sx={iconStyles("/egc-admin/luggage-tracking")} /></ListItemIcon>
                                        <ListItemText primary="Luggage Tracking" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/history-and-reports") ? activeStyles : {}) }} onClick={() => handleNavigation("/egc-admin/history-and-reports")}>
                                        <ListItemIcon><AssignmentIcon sx={iconStyles("/egc-admin/history-and-reports")} /></ListItemIcon>
                                        <ListItemText primary="History and Reports" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/statistics") ? activeStyles : {}) }} onClick={() => handleNavigation("/egc-admin/statistics")}>
                                        <ListItemIcon><BarChartIcon sx={iconStyles("/egc-admin/statistics")} /></ListItemIcon>
                                        <ListItemText primary="Statistics" />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </>
                    )}

                    <ListItemButton onClick={() => handleNavigation("/egc-admin/chat-support")} sx={listItemStyles("/egc-admin/chat-support")}>
                        <ListItemIcon><SupportAgentIcon sx={iconStyles("/egc-admin/chat-support")} /></ListItemIcon>
                        {!isMinimized && <ListItemText primary="Chat Support" />}
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            <Box p={2} display="flex" flexDirection="column" gap={2}>
                {!isMinimized && (
                    <Button variant="contained" startIcon={mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />} onClick={toggleMode} fullWidth sx={{ textTransform: "none" }}>
                        {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </Button>
                )}

                <Button variant="contained" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} fullWidth sx={{ textTransform: "none", minWidth: isMinimized ? 'auto' : undefined, px: isMinimized ? 1 : 2 }}>
                    {!isMinimized && "Logout"}
                </Button>
            </Box>
        </Box>
    );
}