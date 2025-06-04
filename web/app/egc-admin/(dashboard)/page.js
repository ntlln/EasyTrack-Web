"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function Page() {
  // Theme setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/egc-admin/profile", icon: AccountCircleIcon },
    { title: "User Management", route: "/egc-admin/user-management", icon: GroupsIcon },
    { title: "Luggage Management", route: "/egc-admin/luggage-management", icon: MyLocationIcon },
    { title: "Transaction Management", route: "/egc-admin/transaction-management", icon: AssignmentIcon },
    // { title: "History and Reports", route: "/egc-admin/history-and-reports", icon: AssignmentIcon },
    { title: "Statistics", route: "/egc-admin/statistics", icon: BarChartIcon },
    { title: "Chat Support", route: "/egc-admin/chat-support", icon: SupportAgentIcon },
  ];

  // Styles
  const containerStyles = { p: 4 };
  const titleStyles = { mb: 4 };
  const cardStyles = { height: "100%", width: "35vh" };
  const linkStyles = { textDecoration: "none" };
  const iconStyles = { fontSize: 40, color: "primary.main", mb: 2 };

  return (
    <Box sx={containerStyles}>
      <Box sx={titleStyles}><Typography variant="h4" color="primary.main" fontWeight="bold">Dashboard</Typography></Box>
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Link href={card.route} style={linkStyles}>
              <Card sx={{ ...cardStyles, cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s ease-in-out' } }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon sx={iconStyles} />
                  <Typography variant="h6" color="primary.main" fontWeight="bold" textAlign="center">{card.title}</Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}