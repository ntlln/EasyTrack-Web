"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  // Theme and client setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/contractor/profile" },
    { title: "Create Contract", route: "/contractor/create-contract" },
    { title: "Delivery History & Reports", route: "/contractor/history-and-reports" },
    { title: "Luggage Tracking", route: "/contractor/luggage-tracking" },
    { title: "Statistics", route: "/contractor/statistics" },
    { title: "Message Center", route: "/contractor/chat-support" },
    { title: "Payments", route: "/contractor/payments" },
  ];

  // Styles
  const linkStyles = { mt: 1, color: isDark ? "#fff" : "#000", cursor: "pointer", "&:hover": { color: theme.palette.primary.main, textDecoration: "underline" } };
  const cardStyles = { height: "100%", width: "35vh" };

  return (
    <Box p={4}>
      <Box mb={4}>
        <Typography variant="h3" color="primary.main" fontWeight="bold">
          Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={cardStyles}>
              <CardContent>
                <Typography variant="h6" color="primary.main" fontWeight={'bold'}>
                  {card.title}
                </Typography>

                <Link href={card.route} style={{ textDecoration: "none" }}>
                  <Typography
                    variant="body2"
                    sx={linkStyles}
                  >
                    View Details
                  </Typography>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}