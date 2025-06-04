"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import BarChartIcon from '@mui/icons-material/BarChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PaymentIcon from '@mui/icons-material/Payment';

export default function Page() {
  // Theme and client setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/contractor/profile", icon: AccountCircleIcon },
    { title: "Booking", route: "/contractor/booking", icon: LocalShippingIcon },
    // { title: "Delivery History & Reports", route: "/contractor/history-and-reports", icon: AssignmentIcon },
    { title: "Luggage Tracking", route: "/contractor/luggage-tracking", icon: MyLocationIcon },
    // { title: "Statistics", route: "/contractor/statistics", icon: BarChartIcon },
    { title: "Message Center", route: "/contractor/chat-support", icon: SupportAgentIcon },
    // { title: "Payments", route: "/contractor/payments", icon: PaymentIcon },
  ];

  // Styles
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