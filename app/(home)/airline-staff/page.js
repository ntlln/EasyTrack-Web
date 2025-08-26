import { Box, Button, Container, TextField, Typography, Paper, Avatar } from '@mui/material';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

export default function AirlineStaff() {
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
          minHeight: '700px',
          pb: 6,
          pt: 4,
          mt: -1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection="column" alignItems="center" gap={6}>
            {/* Welcome Text Section - Centered */}
            <Box sx={{ textAlign: 'center', maxWidth: 800 }}>
              <Typography variant="h4" align="center" gutterBottom sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                Welcome, Airline Staff {'{Name}'}!
              </Typography>
              <Typography
                align="center"
                sx={{ 
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: 'white',
                  fontSize: { xs: 18, md: 24 },
                  lineHeight: 1.4,
                  mb: 4,
                  opacity: 0.9
                }}
                gutterBottom
              >
                Manage luggage bookings, track delivery statuses, and ensure smooth handling of passenger belongings.
              </Typography>
            </Box>
            
            {/* Air Asia Image Carousel - Layered Layout from admin.js */}
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
                      alt={`Air Asia ${index + 1}`} 
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
            
            {/* Action Buttons - Below the Image */}
            <Box sx={{ maxWidth: 800, textAlign: 'center' }}>
              <Box display="flex" flexDirection="column" gap={3} alignItems="center">
                {/* First Row - 2 Buttons */}
                <Box display="flex" flexDirection="row" gap={3} justifyContent="center">
                  <Button 
                    variant="contained" 
                    startIcon={<span style={{ fontSize: 22 }}>📦</span>}
                    sx={{ 
                      py: 2.5,
                      px: 4,
                      bgcolor: 'white',
                      color: '#214d22',
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: 17,
                      minHeight: 56,
                      minWidth: 200,
                      '&:hover': {
                        bgcolor: '#f5f6f7',
                        transform: 'translateY(-3px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Book Delivery
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<span style={{ fontSize: 22 }}>📋</span>}
                    sx={{ 
                      py: 2.5,
                      px: 4,
                      bgcolor: 'white',
                      color: '#214d22',
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: 17,
                      minHeight: 56,
                      minWidth: 200,
                      '&:hover': {
                        bgcolor: '#f5f6f7',
                        transform: 'translateY(-3px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Booking History
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<span style={{ fontSize: 22 }}>🔍</span>}
                    sx={{ 
                      py: 2.5,
                      px: 4,
                      bgcolor: 'white',
                      color: '#214d22',
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: 17,
                      minHeight: 56,
                      minWidth: 200,
                      '&:hover': {
                        bgcolor: '#f5f6f7',
                        transform: 'translateY(-3px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Luggage Tracking
                  </Button>
                </Box>
                
                
              </Box>
            </Box>
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
            zIndex: 0
          }} 
        />
      </Box>
      
     
    </Layout>
  );
} 