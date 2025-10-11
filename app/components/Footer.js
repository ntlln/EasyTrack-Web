import { Box, Container, Typography, Grid, IconButton } from '@mui/material';
import { Phone, Email, LocationOn, AccessTime } from '@mui/icons-material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        py: 6,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} alignItems="flex-start">
          {/* Left Side - Company Info */}
          <Box flex={1}>
            <Box display="flex" alignItems="center" mb={2}>
              <img src="/images/white-logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
              <Typography variant="h5" fontWeight={700} color="primary.contrastText">
                EasyTrack
              </Typography>
            </Box>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mb: 2 }}>
              Your trusted partner in logistics and tracking solutions. 
              Streamlining operations for businesses across the Philippines.
            </Typography>
          </Box>

          {/* Right Side - Contact & Business Hours */}
          <Box flex={1} display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
            {/* Contact Information */}
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} color="primary.contrastText" mb={3}>
                Contact Information
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Phone sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  +63 912 345 6789
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Email sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  easytrack.thewalkingdev@gmail.com
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="flex-start">
                <LocationOn sx={{ mr: 2, mt: 0.5, color: 'rgba(255,255,255,0.8)' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  123 Logistics Street, Metro Manila, Philippines
                </Typography>
              </Box>
            </Box>

            {/* Business Hours */}
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} color="primary.contrastText" mb={3}>
                Business Hours
              </Typography>
              
              <Box display="flex" alignItems="flex-start">
                <AccessTime sx={{ mr: 2, mt: 0.5, color: 'rgba(255,255,255,0.8)' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  Monday - Friday: 8:00 AM - 6:00 PM<br />
                  Saturday: 9:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Bar */}
        <Box 
          sx={{ 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            mt: 4, 
            pt: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="body2" color="rgba(255,255,255,0.6)">
            © 2024 EasyTrack. All rights reserved.
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">
            Powered by The Walking Dev
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 