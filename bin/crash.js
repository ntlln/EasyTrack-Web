'use client';

import { Box, Container, Typography, Button, TextField, Paper } from '@mui/material';
import Image from 'next/image';
import { styled } from '@mui/material/styles';

// Styled components for layout and UI elements
const StyledHeader = styled('header')(({ theme }) => ({ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, padding: theme.spacing(3), marginBottom: theme.spacing(4) }));
const TrackingBox = styled(Paper)(({ theme }) => ({ padding: theme.spacing(3), borderRadius: theme.spacing(3), backgroundColor: theme.palette.background.paper, maxWidth: 550, marginTop: theme.spacing(4), position: 'relative', border: `2px solid ${theme.palette.primary.main}` }));
const BubbleNotch = styled(Box)(({ theme }) => ({ position: 'absolute', top: -20, left: 0, backgroundColor: theme.palette.primary.main, padding: theme.spacing(1, 2.5), borderRadius: '24px 24px 0 0', fontWeight: 'bold', color: theme.palette.primary.contrastText }));
const HeroSection = styled(Box)(({ theme }) => ({ position: 'relative', height: '400px', overflow: 'hidden', marginTop: theme.spacing(4), marginBottom: theme.spacing(4), borderRadius: theme.spacing(3), backgroundColor: theme.palette.primary.main }));
const HeroOverlay = styled(Box)(({ theme }) => ({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: theme.spacing(5), backgroundColor: 'rgba(0, 0, 0, 0.5)' }));

export default function Home() {
  return (
    <Box>
      <StyledHeader>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <Image src="/white-logo.png" alt="Logo" width={50} height={50} style={{ marginRight: 16 }} />
              <Typography variant="h4" component="h1">EasyTrack</Typography>
            </Box>
            <Box component="nav" display="flex" gap={2}>
              <Button color="inherit">Home</Button>
              <Button color="inherit">About</Button>
              <Button color="inherit">Our Services</Button>
              <Button color="inherit">Contact Us</Button>
              <Button variant="outlined" color="inherit">Sign in</Button>
            </Box>
          </Box>
        </Container>
      </StyledHeader>

      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" gap={15} my={2}>
          <Image src="/brand-4.png" alt="Luggage" width={400} height={400} style={{ maxWidth: '100%', height: 'auto' }} />
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Typography variant="h6" align="center" gutterBottom>Welcome!</Typography>
            <Typography variant="h2" align="center" sx={{ lineHeight: 1.1, fontWeight: 600, color: 'text.secondary' }}>
              Logistics you can trust,<br />luggage you can track.
            </Typography>
            <TrackingBox elevation={3}>
              <BubbleNotch>Track Luggage</BubbleNotch>
              <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
                <TextField fullWidth placeholder="Input your tracking number" variant="outlined" />
                <Button variant="contained" color="primary" sx={{ minWidth: 200 }}>Find Luggage</Button>
              </Box>
            </TrackingBox>
          </Box>
        </Box>

        <HeroSection>
          <Box sx={{ width: '100%', height: '100%', backgroundColor: 'primary.main', position: 'relative' }}>
            <HeroOverlay>
              <Typography variant="h2" color="white" fontWeight="bold" gutterBottom>LOGI CRAFT</Typography>
              <Typography variant="h5" color="white" sx={{ maxWidth: 500 }}>
                Crafting Your Logistics Success<br />
                Unlock Seamless Logistics: Where Precision Meets Progress. Navigate the Future of Transportation with Confidence.
              </Typography>
            </HeroOverlay>
          </Box>
        </HeroSection>
      </Container>

      <Box component="footer" py={4} textAlign="center" sx={{ bgcolor: 'background.paper' }}>
        <Typography>&copy; 2025 EasyTrack</Typography>
      </Box>
    </Box>
  );
} 