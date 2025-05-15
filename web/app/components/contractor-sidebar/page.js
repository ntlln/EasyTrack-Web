"use client";

import { useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Button, IconButton, useMediaQuery } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
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

    const handleClickPages = () => setOpenPages(!openPages);
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/contractor/login");
    };

    const toggleSidebar = () => {
        setIsMinimized(!isMinimized);
    };

    const isActive = (route) => pathname === route;

    const isDropdownActive = () => {
        return (
            openPages ||
            pathname === "/contractor/luggage-tracking" ||
            pathname === "/contractor/history-and-reports" ||
            pathname === "/contractor/statistics"
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
            <Box p={3} display="flex" justifyContent="center" alignItems="center" onClick={() => router.push("/contractor/")} sx={{ cursor: "pointer" }}>
                {!isMinimized && <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={{ height: 70 }} />}
                {isMinimized && <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={{ height: 40 }} />}
            </Box>

            <Divider />

            <Box flexGrow={1}>
                <List component="nav" sx={{ flexGrow: 1 }}>
                    <ListItemButton 
                        onClick={() => router.push("/contractor/")} 
                        sx={isActive("/contractor/") ? activeStyles : {}}
                    >
                        <ListItemIcon>
                            <DashboardIcon sx={{ color: isActive("/contractor/") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Dashboard" />}
                    </ListItemButton>

                    <ListItemButton 
                        onClick={() => router.push("/contractor/profile")} 
                        sx={isActive("/contractor/profile") ? activeStyles : {}}
                    >
                        <ListItemIcon>
                            <AccountCircleIcon sx={{ color: isActive("/contractor/profile") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Profile" />}
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
                                    <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/contracts") ? activeStyles : {}) }} onClick={() => router.push("/contractor/contracts")}>
                                        <ListItemIcon>
                                            <ArticleIcon sx={{ color: isActive("/contractor/contracts") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Contracts" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/luggage-tracking") ? activeStyles : {}) }} onClick={() => router.push("/contractor/luggage-tracking")}>
                                        <ListItemIcon>
                                            <MyLocationIcon sx={{ color: isActive("/contractor/luggage-tracking") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Luggage Tracking" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/history-and-reports") ? activeStyles : {}) }} onClick={() => router.push("/contractor/history-and-reports")}>
                                        <ListItemIcon>
                                            <AssignmentIcon sx={{ color: isActive("/contractor/history-and-reports") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="History and Reports" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/statistics") ? activeStyles : {}) }} onClick={() => router.push("/contractor/statistics")}>
                                        <ListItemIcon>
                                            <BarChartIcon sx={{ color: isActive("/contractor/statistics") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Statistics" />
                                    </ListItemButton>

                                    <ListItemButton sx={{ pl: 4, ...(isActive("/contractor/payments") ? activeStyles : {}) }} onClick={() => router.push("/contractor/payments")}>
                                        <ListItemIcon>
                                            <PaymentIcon sx={{ color: isActive("/contractor/payments") ? theme.palette.primary.main : "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Payments" />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </>
                    )}

                    <ListItemButton 
                        onClick={() => router.push("/contractor/chat-support")} 
                        sx={isActive("/contractor/chat-support") ? activeStyles : {}}
                    >
                        <ListItemIcon>
                            <SupportAgentIcon sx={{ color: isActive("/contractor/chat-support") ? theme.palette.primary.main : "primary.main" }} />
                        </ListItemIcon>
                        {!isMinimized && <ListItemText primary="Chat Support" />}
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            <Box p={2} display="flex" flexDirection="column" gap={2}>
                {!isMinimized && (
                    <>
                        <Button
                            variant="contained"
                            startIcon={mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                            onClick={toggleMode}
                            fullWidth
                            sx={{ textTransform: "none" }}
                        >
                            {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            fullWidth
                            sx={{ textTransform: "none" }}
                        >
                            Logout
                        </Button>
                    </>
                )}
                {isMinimized && (
                    <Box display="flex" flexDirection="column" gap={2}>
                        <IconButton onClick={toggleMode} color="primary">
                            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                        <IconButton onClick={handleLogout} color="error">
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <IconButton
                onClick={toggleSidebar}
                sx={{
                    position: 'absolute',
                    right: -12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    },
                }}
            >
                <MenuIcon />
            </IconButton>
        </Box>
    );
}