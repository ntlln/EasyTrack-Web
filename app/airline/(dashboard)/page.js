"use client";

import { Box, Card, CardContent, Typography, Grid, Alert, Button } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningIcon from '@mui/icons-material/Warning';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Page() {
  const theme = useTheme();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [isVerified, setIsVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const cards = [
    { title: "Profile", route: "/airline/profile", icon: AccountCircleIcon, requiresVerification: false },
    { title: "Luggage Tracking", route: "/airline/luggage-tracking", icon: MyLocationIcon, requiresVerification: false },
    { title: "Booking", route: "/airline/booking", icon: LocalShippingIcon, requiresVerification: true },
    { title: "Message Center", route: "/airline/chat-support", icon: SupportAgentIcon, requiresVerification: false },
  ];

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
      } catch (error) {
        setIsVerified(false);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkVerification();
  }, [supabase]);

  if (verificationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      {!isVerified && (
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
              height: "100%", 
              width: "35vh",
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              '&:hover': isDisabled ? {} : { 
                transform: 'scale(1.02)', 
                transition: 'transform 0.2s ease-in-out' 
              }
            }}>
              <CardContent 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
                onClick={isDisabled ? () => setShowVerificationMessage(true) : undefined}
              >
                <card.icon sx={{ fontSize: 40, color: "primary.main", mb: 2, opacity: isDisabled ? 0.5 : 1 }} />
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
              {isDisabled ? cardContent : (
                <Link href={card.route} style={{ textDecoration: "none" }}>
                  {cardContent}
                </Link>
              )}
            </Grid>
          );
        })}
      </Grid>

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
                  router.push('/airline/profile');
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