"use client";

import { Box, Card, CardContent, Typography, Grid, Divider, Alert, Button } from "@mui/material";
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
import WarningIcon from '@mui/icons-material/Warning';
import { Gauge } from '@mui/x-charts/Gauge';
import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function Page() {
  // Theme setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Dashboard cards configuration
  const cards = [
    { title: "Profile", route: "/admin/profile", icon: AccountCircleIcon, requiresVerification: false },
    { title: "User Management", route: "/admin/user-management", icon: GroupsIcon, requiresVerification: true },
    { title: "Luggage Tracking", route: "/admin/luggage-tracking", icon: LocationOnIcon, requiresVerification: false },
    { title: "Luggage Management", route: "/admin/luggage-management", icon: MyLocationIcon, requiresVerification: true },
    { title: "Transaction Management", route: "/admin/transaction-management", icon: AssignmentIcon, requiresVerification: true },
    { title: "Statistics", route: "/admin/statistics", icon: BarChartIcon, requiresVerification: false },
    { title: "Chat Support", route: "/admin/chat-support", icon: SupportAgentIcon, requiresVerification: false },
    { title: "System Logs", route: "/admin/logs", icon: HistoryIcon, requiresVerification: false },
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
  const [isVerified, setIsVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('verify_status_id, verify_status(status_name)')
          .eq('id', session.user.id)
          .single();

        const verified = profile?.verify_status?.status_name === 'Verified';
        setIsVerified(verified);
        
        console.log('[AdminDashboard] Verification status:', {
          verifyStatusId: profile?.verify_status_id,
          statusName: profile?.verify_status?.status_name,
          isVerified: verified
        });
      } catch (error) {
        console.error('[AdminDashboard] Error checking verification:', error);
        setIsVerified(false);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkVerification();
  }, [supabase]);

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

  // Derived statistics (fixed total per requirements)
  const totalDeliveries = 50;
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
      
      {/* Verification Status Alert */}
      {!verificationLoading && !isVerified && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Account Not Verified:</strong> Complete your profile verification to access all dashboard features.
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {cards.map((card, index) => {
          const isDisabled = card.requiresVerification && !isVerified;
          const cardContent = (
            <Card sx={{ 
              ...cardStyles, 
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              '&:hover': isDisabled ? {} : { transform: 'scale(1.02)', transition: 'transform 0.2s ease-in-out' }
            }}>
              <CardContent 
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                onClick={isDisabled ? () => setShowVerificationMessage(true) : undefined}
              >
                <card.icon sx={{ ...iconStyles, opacity: isDisabled ? 0.5 : 1 }} />
                <Typography variant="h6" color="primary.main" fontWeight="bold" textAlign="center">
                  {card.title}
                </Typography>
                {isDisabled && (
                  <Typography variant="caption" color="warning.main" fontWeight="bold" sx={{ mt: 1 }}>
                    VERIFY REQUIRED
                  </Typography>
                )}
              </CardContent>
            </Card>
          );

          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              {isDisabled ? (
                cardContent
              ) : (
                <Link href={card.route} style={linkStyles}>
                  {cardContent}
                </Link>
              )}
            </Grid>
          );
        })}
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
                <Link href={`/admin/luggage-management?status=${encodeURIComponent(filterValue)}`} style={linkStyles}>
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

      {/* Account Not Verified Message */}
      {showVerificationMessage && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Box sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 4,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: 3
          }}>
            <WarningIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" color="warning.main" fontWeight="bold" mb={2}>
              Account Not Verified
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: theme.palette.mode === 'dark' ? 'white' : 'black' }}>
              You need to complete your profile verification before accessing this feature. Please complete your profile information and upload your government ID documents.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowVerificationMessage(false)}
                sx={{ minWidth: 120 }}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setShowVerificationMessage(false);
                  router.push('/admin/profile');
                }}
                sx={{ minWidth: 200 }}
              >
                Complete Profile Verification
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}