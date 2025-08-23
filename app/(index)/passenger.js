import { Box, Button, Container, TextField, Typography, Paper, Avatar } from '@mui/material';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Passenger() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    'https://www.shutterstock.com/image-photo/closeup-detail-view-cargo-cart-600nw-2423113091.jpg',
    'https://media.istockphoto.com/id/1266783840/photo/loading-of-cargo-containers-to-airplane.jpg?s=612x612&w=0&k=20&c=QpTBf9neFD8AMrYgk7BZrhQcGIqLnIzjwKk8yyWArwk=',
    'https://static.vecteezy.com/system/resources/thumbnails/050/391/215/small/check-in-counter-transportation-system-holiday-moving-journey-airport-fly-travel-essentials-arrival-suitcase-on-a-conveyor-belt-at-the-airport-seen-from-a-worm-s-eye-view-photo.jpg',
    'https://static.vecteezy.com/system/resources/previews/026/463/814/large_2x/suitcases-in-airport-departure-lounge-airplane-in-background-summer-vacation-concept-traveler-suitcases-in-airport-terminal-waiting-area-empty-hall-interior-with-large-windows-generative-ai-photo.jpg',
    'https://media.istockphoto.com/id/933320678/video/passengers-taking-their-luggage-off-the-baggage-carousel-at-the-airport.jpg?s=640x640&k=20&c=r2skyzM131skxh0n_2oS_RQC1M0sN6PJfQQ7DNd0t_0='
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Layout>
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#214d22',
          pt: 4,
          pb: 0,
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" pb={2}>
            <Box display="flex" alignItems="center">
              <img src="/images/white-logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 8 }} />
              <Typography variant="h4" fontWeight={700} fontFamily="'Onest', Arial, sans-serif" color="white">
                EasyTrack
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <nav>
                <Button color="inherit" href="/" sx={{ color: 'white' }}>Home</Button>
                <Button color="inherit" href="/" sx={{ color: 'white' }}>About Us</Button>
                <Button color="inherit" href="/" sx={{ color: 'white' }}>Contact Us</Button>
                <Button variant="outlined" sx={{ ml: 2, color: 'white', borderColor: 'white' }}>Sign in</Button>
              </nav>
              <Avatar src="/images/pfp.avif" alt="Profile" sx={{ ml: 2, width: 40, height: 40 }} />
            </Box>
          </Box>
          
          {/* Header Line Divider */}
          <Box 
            sx={{ 
              height: 1, 
              bgcolor: 'rgba(219, 218, 218, 0.8)', 
              width: '100%',
              mt: 1,
              mb: 1
            }} 
          />
        </Container>
      </Box>

      {/* Main Section with wavebg background */}
      <Box
        sx={{
          backgroundImage: 'url(/images/wavebg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          minHeight: '100vh',
          pb: 6,
          pt: 4,
          mt: -1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
            {/* Welcome Text Section - Centered */}
            <Box sx={{ textAlign: 'center', maxWidth: 800, mb: 2 }}>
              <Typography 
                variant="h3" 
                align="center" 
                gutterBottom 
                sx={{ 
                  color: 'white', 
                  mb: 2, 
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '3rem' }
                }}
              >
                Welcome, passenger {'{Name}'}!
              </Typography>
              <Typography
                align="center"
                sx={{ 
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: 'white',
                  fontSize: { xs: 16, md: 20 },
                  lineHeight: 1.6,
                  opacity: 0.95
                }}
                gutterBottom
              >
                Logistics you can trust,<br />luggage you can track.
              </Typography>
            </Box>
            
            {/* Passenger Image Carousel - Layered Layout */}
            <Box sx={{ width: 800, height: 600, position: 'relative', overflow: 'visible', borderRadius: 3, boxShadow: 3 }}>
              {images.map((image, index) => {
                const offset = index - currentImageIndex;
                const isActive = index === currentImageIndex;
                const isVisible = Math.abs(offset) <= 2; // Show 5 images at once
                
                if (!isVisible) return null;
                
                return (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: `${50 + offset * 30}%`,
                      transform: `translateX(-50%) scale(${isActive ? 1 : 0.8})`,
                      width: '100%',
                      height: '100%',
                      opacity: isActive ? 1 : 0.6,
                      zIndex: isActive ? 10 : 5 - Math.abs(offset),
                      transition: 'all 0.5s ease-in-out',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`Passenger ${index + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>
                );
              })}
              
              {/* Left Arrow */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  zIndex: 20,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    transform: 'translateY(-50%) scale(1.1)',
                  }
                }}
                onClick={() => setCurrentImageIndex((prevIndex) => 
                  prevIndex === 0 ? images.length - 1 : prevIndex - 1
                )}
              >
                ‹
              </Box>
              
              {/* Right Arrow */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  zIndex: 20,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    transform: 'translateY(-50%) scale(1.1)',
                  }
                }}
                onClick={() => setCurrentImageIndex((prevIndex) => 
                  (prevIndex + 1) % images.length
                )}
              >
                ›
              </Box>
              
              {/* Carousel Indicators */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: '50%', 
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 20
              }}>
                {images.map((_, dotIndex) => (
                  <Box
                    key={dotIndex}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: dotIndex === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setCurrentImageIndex(dotIndex)}
                  />
                ))}
              </Box>
            </Box>
            
            {/* Inspirational Quote */}
            <Box sx={{ textAlign: 'center', mb: 4, maxWidth: 700 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  lineHeight: 1.6,
                  opacity: 0.9,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 1
                }}
              >
                "The best logistics is invisible logistics. When everything works perfectly, 
                you don't even notice it's there."
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
              </Typography>
            </Box>

            {/* Tracking Container - Enhanced Design */}
            <Paper 
              elevation={8}
              sx={{ 
                maxWidth: 600, 
                width: '100%',
                textAlign: 'center', 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #4CAF50, #45a049, #4CAF50)',
                  borderRadius: '4px 4px 0 0'
                }
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  fontWeight: 700, 
                  color: '#214d22', 
                  mb: 3,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                Track My Shipment
              </Typography>
              
              <Box 
                display="flex" 
                flexDirection={{ xs: 'column', sm: 'row' }} 
                gap={2} 
                alignItems="stretch"
                sx={{ mb: 2 }}
              >
                <TextField
                  fullWidth
                  placeholder="Enter Booking No., Container No., or B/L"
                  variant="outlined"
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(33, 77, 34, 0.2)',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(33, 77, 34, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '1rem',
                      fontWeight: 500,
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 200 },
                    bgcolor: '#4CAF50',
                    color: 'white',
                    borderRadius: 2,
                    py: 1.8,
                    px: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      bgcolor: '#45a049',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Track Shipment Now
                </Button>
              </Box>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(33, 77, 34, 0.7)', 
                  fontSize: '0.875rem',
                  fontStyle: 'italic'
                }}
              >
                Enter your booking reference, container number, or bill of lading to track your shipment
              </Typography>
            </Paper>
          </Box>
        </Container>
        
        <img 
          src="/images/strip.svg" 
          alt="Strip" 
          style={{ 
            width: '100%',
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 0,
            marginTop: '2rem'
          }} 
        />
      </Box>
    </Layout>
  );
} 