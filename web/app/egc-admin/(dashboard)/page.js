"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";

export default function Page() {
  // Theme setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/egc-admin/profile" },
    { title: "User Management", route: "/egc-admin/user-management" },
    { title: "Luggage Tracking", route: "/egc-admin/luggage-tracking" },
    { title: "History and Reports", route: "/egc-admin/history-and-reports" },
    { title: "Statistics", route: "/egc-admin/statistics" },
    { title: "Chat Support", route: "/egc-admin/chat-support" },
  ];

  // Styles
  const containerStyles = { p: 4 };
  const titleStyles = { mb: 4 };
  const cardStyles = { height: "100%", width: "35vh" };
  const linkStyles = { textDecoration: "none" };
  const linkTextStyles = { mt: 1, color: isDark ? "#fff" : "#000", cursor: "pointer", "&:hover": { color: theme.palette.primary.main, textDecoration: "underline" } };

  return (
    <Box sx={containerStyles}>
      <Box sx={titleStyles}><Typography variant="h3" color="primary.main" fontWeight="bold">Dashboard</Typography></Box>
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={cardStyles}>
              <CardContent>
                <Typography variant="h6" color="primary.main" fontWeight="bold">{card.title}</Typography>
                <Link href={card.route} style={linkStyles}>
                  <Typography variant="body2" sx={linkTextStyles}>View Details</Typography>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}