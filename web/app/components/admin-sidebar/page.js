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
    const [openPages, setOpenPages] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { mode, toggleMode } = useContext(ColorModeContext);
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        setIsMinimized(isMobile);
    }, [isMobile]);

    const handleClickPages = () => setOpenPages(!openPages);
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) {
                router.push("/egc-admin/login");
            }
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/egc-admin/login");
    };

    const isActive = (route) => pathname === route;

    const isDropdownActive = () => {
        return (
            openPages ||
            pathname === "/egc-admin/luggage-tracking" ||
            pathname === "/egc-admin/history-and-reports" ||
            pathname === "/egc-admin/statistics"
        );
    };

    const activeStyles = {
        backgroundColor: mode === "light" ? "#f0f0f0" : "#333",
        color: theme.palette.primary.main,
        borderRadius: 1,
    };

    return (
        <Box
            width={isMinimized ? "80px" : "280px"}
            height="100vh"
            bgcolor="background.paper"
            display="flex"
            flexDirection="column"
            borderRight="1px solid"
            borderColor="divider"
            position="fixed"
            sx={{ 
                overflowY: 'auto',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                {!isMinimized && (
                    <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={{ height: 50 }} onClick={() => router.push("/egc-admin/")} style={{ cursor: "pointer" }} />
                )}
                <IconButton onClick={() => setIsMinimized(!isMinimized)}>
                    <MenuIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box flexGrow={1}>
                <List component="nav" sx={{ flexGrow: 1 }}>
                    <ListItemButton 
                        onClick={() => router.push("/egc-admin/")} 
                        sx={{
                            ...(isActive("/egc-admin/") ? activeStyles : {}),
                            justifyContent: isMinimized ? 'center' : 'flex-start',
                            px: isMinimized ? 1 : 2
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: isMinimized ? 'auto' : 40 }}>
                            <DashboardIcon sx={{ color: isActive("/egc-admin/") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Dashboard" />}
                    </ListItemButton>

                    <ListItemButton 
                        onClick={() => router.push("/egc-admin/profile")} 
                        sx={{
                            ...(isActive("/egc-admin/profile") ? activeStyles : {}),
                            justifyContent: isMinimized ? 'center' : 'flex-start',
                            px: isMinimized ? 1 : 2
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: isMinimized ? 'auto' : 40 }}>
                            <AccountCircleIcon sx={{ color: isActive("/egc-admin/profile") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Profile" />}
                    </ListItemButton>

                    <ListItemButton 
                        onClick={() => router.push("/egc-admin/user-management")} 
                        sx={{
                            ...(isActive("/egc-admin/user-management") ? activeStyles : {}),
                            justifyContent: isMinimized ? 'center' : 'flex-start',
                            px: isMinimized ? 1 : 2
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: isMinimized ? 'auto' : 40 }}>
                            <GroupsIcon sx={{ color: isActive("/egc-admin/user-management") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="User Management" />}
                    </ListItemButton>

                    {!isMinimized && (
                        <>
                            <ListItemButton onClick={handleClickPages} sx={isDropdownActive() ? activeStyles : {}}>
                                <ListItemIcon>
                                    <InventoryIcon sx={{ color: isDropdownActive() ? theme.palette.primary.main : "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText primary="Transactions" />
                                {openPages ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>

                            <Collapse in={openPages} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/luggage-tracking") ? activeStyles : {}) }} onClick={() => router.push("/egc-admin/luggage-tracking")}>
                                        <ListItemIcon>
                                            <MyLocationIcon sx={{ color: isActive("/egc-admin/luggage-tracking") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Luggage Tracking" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/history-and-reports") ? activeStyles : {}) }} onClick={() => router.push("/egc-admin/history-and-reports")}>
                                        <ListItemIcon>
                                            <AssignmentIcon sx={{ color: isActive("/egc-admin/history-and-reports") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="History and Reports" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/egc-admin/statistics") ? activeStyles : {}) }} onClick={() => router.push("/egc-admin/statistics")}>
                                        <ListItemIcon>
                                            <BarChartIcon sx={{ color: isActive("/egc-admin/statistics") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Statistics" />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </>
                    )}

                    <ListItemButton 
                        onClick={() => router.push("/egc-admin/chat-support")} 
                        sx={{
                            ...(isActive("/egc-admin/chat-support") ? activeStyles : {}),
                            justifyContent: isMinimized ? 'center' : 'flex-start',
                            px: isMinimized ? 1 : 2
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: isMinimized ? 'auto' : 40 }}>
                            <SupportAgentIcon sx={{ color: isActive("/egc-admin/chat-support") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Chat Support" />}
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            <Box p={2} display="flex" flexDirection="column" gap={2}>
                {!isMinimized && (
                    <Button
                        variant="contained"
                        startIcon={mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        onClick={toggleMode}
                        fullWidth
                        sx={{ textTransform: "none" }}
                    >
                        {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </Button>
                )}

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    fullWidth
                    sx={{ 
                        textTransform: "none",
                        minWidth: isMinimized ? 'auto' : undefined,
                        px: isMinimized ? 1 : 2
                    }}
                >
                    {!isMinimized && "Logout"}
                </Button>
            </Box>
        </Box>
    );
}