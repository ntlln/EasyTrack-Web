"use client";

import { useState, useContext } from "react";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Button } from "@mui/material";
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
import { ColorModeContext } from "../../layout";

export default function Sidebar() {
    const [openPages, setOpenPages] = useState(false);

    const { mode, toggleMode } = useContext(ColorModeContext);

    const handleClickPages = () => setOpenPages(!openPages);

    const handleLogout = () => {
        console.log("Logging out...");
    };

    return (
        <Box
            width="280px"
            height="100vh"
            bgcolor="background.paper"
            display="flex"
            flexDirection="column"
            borderRight="1px solid"
            borderColor="divider"
            position="fixed"
            sx={{ overflowY: 'auto' }}
        >
            {/* Logo / Brand */}
            <Box p={3} display="flex" justifyContent="center" alignItems="center">
                <Box component="img" src="../brand-2.png" alt="EasyTrack Logo" sx={{ height: 70 }} />
            </Box>

            <Divider />

            {/* Main Menu */}
            <Box flexGrow={1}>
                <List component="nav" sx={{ flexGrow: 1, color: "primary.main" }}>
                    {/* Dashboard */}
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>

                    <ListItemButton>
                        <ListItemIcon>
                            <AccountCircleIcon sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItemButton>

                    <ListItemButton>
                        <ListItemIcon>
                            <GroupsIcon sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText primary="User Management" />
                    </ListItemButton>

                    {/* Transactions (Expandable) */}
                    <ListItemButton onClick={handleClickPages}>
                        <ListItemIcon>
                            <InventoryIcon sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText primary="Transactions" />
                        {openPages ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openPages} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItemButton sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <MyLocationIcon sx={{ color: "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText primary="Luggage Tracking" />
                            </ListItemButton>
                            <ListItemButton sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <AssignmentIcon sx={{ color: "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText primary="History and Reports" />
                            </ListItemButton>
                            <ListItemButton sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <BarChartIcon sx={{ color: "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText primary="Statistics" />
                            </ListItemButton>
                        </List>
                    </Collapse>

                    {/* Chat Support */}
                    <ListItemButton>
                        <ListItemIcon>
                            <SupportAgentIcon sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText primary="Chat Support" />
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            {/* Bottom Section: Dark Mode Toggle + Logout */}
            <Box p={2} display="flex" flexDirection="column" gap={2}>
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
            </Box>
        </Box>
    );
}