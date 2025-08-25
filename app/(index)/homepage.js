import { Box, Button, Container, Typography, Paper, Grid, Card, CardContent, Avatar, Chip, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Test() {
  const [selectedVehicle, setSelectedVehicle] = useState('motorcycle');
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

  const deliveryVehicles = [
    {
      id: 'motorcycle',
      name: 'Motorcycle',
      weight: '200kg',
      baseFare: '₱49',
      perKm: '₱6/km',
      icon: '🛵',
      description: 'Cheapest delivery option; perfect for small items such as food and documents.'
    },
    {
      id: 'sedan',
      name: 'Sedan',
      weight: '300kg',
      baseFare: '₱100',
      perKm: '₱18/km',
      icon: '🚗',
      description: 'Cakes, Food trays & Fragile goods'
    },
    {
      id: 'suv',
      name: 'Subcompact SUV',
      weight: '600kg',
      baseFare: '₱115',
      perKm: '₱20/km',
      icon: '🚙',
      description: 'Small appliances (microwave, fan)'
    },
    {
      id: 'van',
      name: '7-seater SUV / Small Van',
      weight: '800kg',
      baseFare: '₱200',
      perKm: '₱20/km',
      icon: '🚐',
      description: 'Appliance (TV or Aircon), Gaming setup'
    },
    {
      id: 'pickup',
      name: 'Pickup',
      weight: '1,000kg',
      baseFare: '₱250',
      perKm: '₱25/km',
      icon: '🛻',
      description: 'Furniture and bulky items'
    },
    {
      id: 'truck',
      name: 'Truck',
      weight: '7,000kg',
      baseFare: '₱4,320',
      perKm: '₱48/km',
      icon: '🚛',
      description: 'Good for general business delivery'
    }
  ];

  const services = [
    {
      icon: '🚚',
      title: 'Express Delivery',
      description: 'Same-day delivery for urgent shipments across the city',
      features: ['Real-time tracking', 'Priority handling', 'Guaranteed delivery']
    },
    {
      icon: '📦',
      title: 'Package Handling',
      description: 'Professional handling of fragile and valuable items',
      features: ['Insurance included', 'Careful packaging', 'Signature required']
    },
    {
      icon: '🌍',
      title: 'International Shipping',
      description: 'Worldwide delivery with customs handling',
      features: ['Documentation support', 'Customs clearance', 'Global tracking']
    },
    {
      icon: '🏢',
      title: 'Business Solutions',
      description: 'Tailored logistics solutions for businesses',
      features: ['Bulk discounts', 'Dedicated account manager', 'API integration']
    },
    {
      icon: '🛡️',
      title: 'Secure Transport',
      description: 'High-security transport for valuable items',
      features: ['Armed escort', 'GPS monitoring', '24/7 surveillance']
    },
    {
      icon: '🌱',
      title: 'Eco-Friendly Delivery',
      description: 'Green delivery options for environmentally conscious customers',
      features: ['Electric vehicles', 'Carbon offset', 'Sustainable packaging']
    }
  ];

  const features = [
    {
      icon: '💰',
      title: 'Affordable rates',
      description: 'Transparent pricing with no hidden costs'
    },
    {
      icon: '⚡',
      title: 'Fast order matching',
      description: 'Match orders and deliver your goods immediately'
    },
    {
      icon: '🚚',
      title: 'Wide-ranging delivery vehicles',
      description: 'Motorcycle, sedan, MPV, pick-up & truck delivery services'
    },
    {
      icon: '🗺️',
      title: '48 serviceable areas',
      description: 'Island-wide coverage across Luzon and in Cebu'
    },
    {
      icon: '🛡️',
      title: 'Safe delivery',
      description: 'Professional partner drivers to deliver packages safely'
    },
    {
      icon: '📍',
      title: 'Real-time Tracking',
      description: 'Track orders real-time from pick-up to drop-off'
    }
  ];

     return (
     <Layout>
      {/* Header */}
      <Box
        sx={{
          background: '#214d22',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <img src="/images/white-logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
              <Typography variant="h5" fontWeight={700} color="white">
                EasyTrack
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Button 
                variant="contained" 
                href="/"
                sx={{ 
                  bgcolor: 'white', 
                  color: '#214d22',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
                Home
              </Button>
              <Button color="inherit" href="/test" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Our Services
              </Button>
              <Button color="inherit" href="/about" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                About Us
              </Button>
              
              <Button color="inherit" href="/con" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Contact Us
              </Button>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#214d22',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                DP
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

       {/* Welcome Section with Wave Background */}
        <Box
          sx={{
            backgroundImage: ` url(/images/wavebg.svg)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            color: 'white',
            py: 3, // reduced padding so container almost hugs text
            mt: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg" sx={{ py: 0 }}> {/* remove extra padding from Container */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.4, // smaller gap between texts
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                mb: 0, // no extra space below
              }}
            >
              Hi, Delivery Partner
            </Typography>
          </Container>
        </Box>


      {/* Carousel Section with Wave Background */}
      <Box
        sx={{
          backgroundImage: 'url(/images/wavebg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          py: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={6}>
            {/* Text Content */}
            <Box flex={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  lineHeight: 1.2,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                Deliver Faster
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 300,
                  mb: 4,
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                On-demand delivery platform.<br />
                Get your order matched in 30 seconds.
              </Typography>
              
              {/* Tracking Container */}
              <Paper 
                elevation={4}
                sx={{ 
                  maxWidth: 500, 
                  width: '100%',
                  textAlign: 'left', 
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    fontWeight: 700, 
                    color: '#214d22', 
                    mb: 2
                  }}
                >
                  Track My Shipment
                </Typography>
                
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', sm: 'row' }} 
                  gap={3} 
                  alignItems="stretch"
                  sx={{ mb: 2 }}
                >
                  <TextField
                    fullWidth
                    placeholder="Enter Booking No., Container No., or B/L"
                    variant="outlined"
                    sx={{ 
                      flex: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        height: 48,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                          borderWidth: 1,
                          borderRadius: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                          borderWidth: 1,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                          borderWidth: 1,
                        },
                        transition: 'all 0.2s ease',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        color: '#214d22',
                        backgroundColor: 'transparent',
                        '&::placeholder': {
                          color: '#999999',
                          opacity: 1,
                          fontWeight: 400,
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    sx={{ 
                      flex: 1,
                      minWidth: { xs: '100%', sm: 120 },
                      bgcolor: '#214d22',
                      color: 'white',
                      borderRadius: 2,
                      height: 48,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(33, 77, 34, 0.3)',
                      '&:hover': {
                        bgcolor: '#1a3d1b',
                        boxShadow: '0 4px 12px rgba(33, 77, 34, 0.4)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Track Now
                  </Button>
                </Box>
              </Paper>
            </Box>

            {/* Image Carousel */}
            <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
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
                      transition: 'opacity 0.5s ease-in-out',
                      backgroundImage: `url(${image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                ))}
                
                {/* Navigation Dots */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                    zIndex: 10
                  }}
                >
                  {images.map((_, dotIndex) => (
                    <Box
                      key={dotIndex}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: dotIndex === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: dotIndex === currentImageIndex ? 'white' : 'rgba(255,255,255,0.8)'
                        }
                      }}
                      onClick={() => setCurrentImageIndex(dotIndex)}
                    />
                  ))}
                </Box>

                {/* Navigation Arrows */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 20,
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
                    zIndex: 10,
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
                
                <Box
                  sx={{
                    position: 'absolute',
                    right: 20,
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
                    zIndex: 10,
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
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

             {/* Services Section */}
       <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               Your 24/7 delivery app partner
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               Fast. Simple. Affordable.
             </Typography>
           </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                                     <Avatar
                     sx={{
                       width: 60,
                       height: 60,
                       mx: 'auto',
                       mb: 2,
                       bgcolor: '#214d22',
                       fontSize: '1.5rem'
                     }}
                   >
                     {feature.icon}
                   </Avatar>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     {feature.title}
                   </Typography>
                   <Typography variant="body2" sx={{ color: '#666666' }}>
                     {feature.description}
                   </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

             {/* Our Services Section */}
       <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               What We Offer
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               From local deliveries to international shipping, we've got you covered
             </Typography>
           </Box>

           <Grid container spacing={4}>
             {services.map((service, index) => (
               <Grid item xs={12} sm={6} md={4} key={index}>
                 <Card
                   sx={{
                     height: '100%',
                     textAlign: 'center',
                     p: 3,
                     borderRadius: 3,
                     boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                     transition: 'transform 0.3s ease',
                     '&:hover': {
                       transform: 'translateY(-5px)',
                       boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                     }
                   }}
                 >
                   <Avatar
                     sx={{
                       width: 80,
                       height: 80,
                       mx: 'auto',
                       mb: 2,
                       bgcolor: '#214d22',
                       fontSize: '2rem'
                     }}
                   >
                     {service.icon}
                   </Avatar>
                   <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     {service.title}
                   </Typography>
                   <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
                     {service.description}
                   </Typography>
                   
                   <Box sx={{ mb: 2 }}>
                     {service.features.map((feature, featureIndex) => (
                       <Chip
                         key={featureIndex}
                         label={feature}
                         size="small"
                         sx={{
                           m: 0.5,
                           bgcolor: '#214d22',
                           color: 'white',
                           fontSize: '0.75rem'
                         }}
                       />
                     ))}
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         </Container>
       </Box>

       {/* Get in Touch Section */}
       <Box sx={{ py: 8, bgcolor: 'white' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               Get in Touch with Us
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               Ready to start your delivery journey? Contact us today!
             </Typography>
           </Box>

           <Grid container spacing={4}>
             <Grid item xs={12} md={6}>
               <Card
                 sx={{
                   p: 4,
                   borderRadius: 3,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                   border: '2px solid #214d22'
                 }}
               >
                 <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#214d22' }}>
                   Contact Information
                 </Typography>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📞 Phone
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     +63 912 345 6789
                   </Typography>
                 </Box>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📧 Email
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     info@easytrack.com
                   </Typography>
                 </Box>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📍 Address
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     123 Logistics Street, Metro Manila, Philippines
                   </Typography>
                 </Box>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     🕒 Business Hours
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     Monday - Friday: 8:00 AM - 6:00 PM<br />
                     Saturday: 9:00 AM - 4:00 PM<br />
                     Sunday: Closed
                   </Typography>
                 </Box>
               </Card>
             </Grid>
             <Grid item xs={12} md={6}>
               <Card
                 sx={{
                   p: 4,
                   borderRadius: 3,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                   border: '2px solid #214d22'
                 }}
               >
                 <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#214d22' }}>
                   Quick Contact Form
                 </Typography>
                 <Box sx={{ mb: 3 }}>
                   <TextField
                     fullWidth
                     label="Your Name"
                     variant="outlined"
                     sx={{ mb: 2 }}
                   />
                   <TextField
                     fullWidth
                     label="Email Address"
                     variant="outlined"
                     sx={{ mb: 2 }}
                   />
                   <TextField
                     fullWidth
                     label="Phone Number"
                     variant="outlined"
                     sx={{ mb: 2 }}
                   />
                   <TextField
                     fullWidth
                     label="Message"
                     variant="outlined"
                     multiline
                     rows={4}
                     sx={{ mb: 3 }}
                   />
                   <Button
                     variant="contained"
                     fullWidth
                     size="large"
                     sx={{
                       bgcolor: '#214d22',
                       color: 'white',
                       py: 1.5,
                       fontSize: '1.1rem',
                       fontWeight: 600,
                       borderRadius: 3,
                       textTransform: 'none',
                       '&:hover': {
                         bgcolor: '#1a3d1b'
                       }
                     }}
                   >
                     Send Message
                   </Button>
                 </Box>
               </Card>
             </Grid>
           </Grid>
         </Container>
       </Box>

             {/* CTA Section */}
       <Box
         sx={{
           background: '#214d22',
           color: 'white',
           py: 8,
           textAlign: 'center'
         }}
       >
         <Container maxWidth="md">
           <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
             Ready to roll?
           </Typography>
           <Typography variant="h6" sx={{ fontWeight: 300, mb: 4, opacity: 0.9 }}>
           Partner with EasyTrack and start delivering what matters today.
           </Typography>
           <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
             <Button
               variant="contained"
               size="large"
               sx={{
                 bgcolor: '#ffffff',
                 color: '#214d22',
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 fontWeight: 600,
                 borderRadius: 3,
                 textTransform: 'none',
                 '&:hover': {
                   bgcolor: '#f0f0f0'
                 }
               }}
             >
               Download App
             </Button>
             <Button
               variant="outlined"
               size="large"
               sx={{
                 borderColor: 'white',
                 color: 'white',
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 fontWeight: 600,
                 borderRadius: 3,
                 textTransform: 'none',
                 '&:hover': {
                   borderColor: 'white',
                   bgcolor: 'rgba(255,255,255,0.1)'
                 }
               }}
             >
               Learn More
             </Button>
           </Box>
         </Container>
       </Box>
    </Layout>
  );
}
