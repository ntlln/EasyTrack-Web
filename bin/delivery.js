import { Box, Button, Container, TextField, Typography, Paper, Avatar } from '@mui/material';
import { useState, useEffect } from 'react';
import Layout from '../app/components/Layout';

export default function Delivery() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    'https://media.istockphoto.com/id/1186576767/photo/young-happy-delivery-man-with-cardboard-boxes-looking-at-camera.jpg?s=612x612&w=0&k=20&c=1r4I1j4d0bV8T0JTdeYo2U4hmA0fsa2pJGMfI3xmkYg=',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=500&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&crop=center',
    'https://img.freepik.com/free-photo/side-view-valet-holding-baggage_23-2149901447.jpg?semt=ais_hybrid&w=740&q=80',
   'https://static.vecteezy.com/system/resources/previews/026/463/814/large_2x/suitcases-in-airport-departure-lounge-airplane-in-background-summer-vacation-concept-traveler-suitcases-in-airport-terminal-waiting-area-empty-hall-interior-with-large-windows-generative-ai-photo.jpg',
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
                <Button color="inherit" href="/" sx={{ color: 'white' }}>Home</Button>
                <Button color="inherit" href="/" sx={{ color: 'white' }}>Home</Button>
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
          <Box display="flex" alignItems="center" gap={8}>
            {/* Delivery Image Carousel */}
            <Box sx={{ width: 500, height: 500, position: 'relative', overflow: 'hidden', borderRadius: 3, boxShadow: 3 }}>
              {images.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: index === currentImageIndex ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                  }}
                >
                  <img 
                    src={image} 
                    alt={`Delivery ${index + 1}`} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
              ))}
              
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
                gap: 1
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
            
            <Box flex={1} sx={{ pl: 4 }}>
              <Typography variant="h4" align="right" gutterBottom sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                Welcome, Delivery Personnel {'{Name}'}!
              </Typography>
              <Typography
                align="right"
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
                Efficient and reliable delivery services to meetcustomer needs. Manage your contracts, track deliveries, and analyze performance.
              </Typography>
              <Box mt={6}>
                <Box sx={{ maxWidth: 600, ml: 'auto' }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3, textAlign: 'right' }}>
                   
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={3}>
                    <Button 
                      variant="contained" 
                      startIcon={<span style={{ fontSize: 22 }}>🚚</span>}
                      sx={{ 
                        py: 2.5,
                        px: 4,
                        bgcolor: 'white',
                        color: '#214d22',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 17,
                        minHeight: 56,
                        '&:hover': {
                          bgcolor: '#f5f6f7',
                          transform: 'translateY(-3px)',
                          boxShadow: 4
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Booking Management
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<span style={{ fontSize: 22 }}>📱</span>}
                      sx={{ 
                        py: 2.5,
                        px: 4,
                        bgcolor: 'white',
                        color: '#214d22',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 17,
                        minHeight: 56,
                        '&:hover': {
                          bgcolor: '#f5f6f7',
                          transform: 'translateY(-3px)',
                          boxShadow: 4
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                    History
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<span style={{ fontSize: 22 }}>📊</span>}
                      sx={{ 
                        py: 2.5,
                        px: 4,
                        bgcolor: 'white',
                        color: '#214d22',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 17,
                        minHeight: 56,
                        '&:hover': {
                          bgcolor: '#f5f6f7',
                          transform: 'translateY(-3px)',
                          boxShadow: 4
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Performance Statistics
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
        <img 
          src="/images/strip.svg" 
          alt="Strip" 
          style={{ width: '100%'}} 
        />
      </Box>
      
     
    </Layout>
  );
} 