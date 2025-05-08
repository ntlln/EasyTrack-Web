"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CircularProgress from "@mui/material/CircularProgress";

export default function Page() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        router.push("/egc-admin/login");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <CircularProgress />
    </Box>
  );

  const cards = [
    { title: "User Management", route: "/egc-admin/user-management" },
    { title: "Delivery History & Reports", route: "/egc-admin/history-and-reports" },
    { title: "Luggage Tracking", route: "/egc-admin/luggage-tracking" },
    { title: "Statistics", route: "/egc-admin/statistics" },
    { title: "Message Center", route: "/egc-admin/chat-support" },
  ];

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
            <Card sx={{ height: "100%", width: "35vh" }}>
              <CardContent>
                <Typography variant="h6" color="primary.main" fontWeight={'bold'}>
                  {card.title}
                </Typography>

                <Link href={card.route} style={{ textDecoration: "none" }}>
                  <Typography variant="body2" sx={{ mt: 1, color: isDark ? "#fff" : "#000", cursor: "pointer", "&:hover": { color: theme.palette.primary.main, textDecoration: "underline", } }}>
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