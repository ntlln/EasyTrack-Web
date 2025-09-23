"use client";

import { Box, Card, CardContent, Typography, Grid, Divider } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Gauge } from '@mui/x-charts/Gauge';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  // Theme setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/egc-admin/profile", icon: AccountCircleIcon },
    { title: "User Management", route: "/egc-admin/user-management", icon: GroupsIcon },
    { title: "Luggage Tracking", route: "/egc-admin/luggage-tracking", icon: LocationOnIcon },
    { title: "Luggage Management", route: "/egc-admin/luggage-management", icon: MyLocationIcon },
    { title: "Transaction Management", route: "/egc-admin/transaction-management", icon: AssignmentIcon },
    { title: "Statistics", route: "/egc-admin/statistics", icon: BarChartIcon },
    { title: "Chat Support", route: "/egc-admin/chat-support", icon: SupportAgentIcon },
    { title: "System Logs", route: "/egc-admin/logs", icon: HistoryIcon },
  ];

  // Contract status definitions (from image)
  const statusList = [
    { id: 1, name: 'Available for Pickup' },
    { id: 2, name: 'Cancelled' },
    { id: 3, name: 'Accepted - Awaiting Pickup' },
    { id: 4, name: 'In Transit' },
    { id: 5, name: 'Delivered' },
    { id: 6, name: 'Delivery Failed' },
  ];

  // Contracts state
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin?action=allContracts');
        const result = await res.json();
        setContracts(result.data || []);
      } catch (err) {
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  // Derived statistics (match statistics page)
  const totalDeliveries = contracts.length;
  const statusCounts = useMemo(() => {
    const counts = {};
    statusList.forEach(s => { counts[s.id] = 0; });
    contracts.forEach(contract => {
      if (contract.contract_status_id && Object.prototype.hasOwnProperty.call(counts, contract.contract_status_id)) {
        counts[contract.contract_status_id]++;
      }
    });
    return counts;
  }, [contracts]);

  // Styles
  const titleStyles = { mb: 4 };
  const cardStyles = { height: "100%", width: "35vh" };
  const linkStyles = { textDecoration: "none" };
  const iconStyles = { fontSize: 40, color: "primary.main", mb: 2 };

  // Gauge card style aligned with statistics page
  const gaugeCardStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    py: 2,
    width: 180,
    height: 180,
    m: 'auto',
    bgcolor: theme.palette.background.paper,
    borderRadius: 2,
    boxShadow: isDark ? 2 : 1,
    border: isDark ? `1px solid ${theme.palette.divider}` : undefined,
    transition: 'background 0.3s'
  };

  

  return (
    <Box>
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
      <Divider sx={{ my: 4 }} />
      {/* Status Gauges */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" color="primary.main" fontWeight="bold" mb={2}>Performance Overview</Typography>
        <Grid container spacing={3} justifyContent="center">
          {statusList.map((status) => {
            const statusFilterMap = {
              1: 'available',
              2: 'cancelled',
              3: 'accepted',
              4: 'transit',
              5: 'delivered',
              6: 'failed'
            };
            const filterValue = statusFilterMap[status.id];
            const value = totalDeliveries ? Math.round((statusCounts[status.id] || 0) / totalDeliveries * 100) : 0;
            return (
              <Grid item xs={12} sm={6} md={4} lg={2} key={status.id}>
                <Link href={`/egc-admin/luggage-management?status=${encodeURIComponent(filterValue)}`} style={linkStyles}>
                  <Card sx={{ ...gaugeCardStyles, cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s ease-in-out' } }}>
                    <Typography variant="subtitle2" color="primary.main" fontWeight="bold" mb={1} textAlign="center">{status.name}</Typography>
                    <Gauge value={value} width={100} height={100} startAngle={0} endAngle={360} innerRadius="80%" outerRadius="100%" text={`${value}%`} />
                    <Typography variant="body2" color="primary.main" mt={1}>{statusCounts[status.id] || 0} / {totalDeliveries}</Typography>
                  </Card>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {loading && <Typography>Loading...</Typography>}
    </Box>
  );
}