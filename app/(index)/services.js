import React from 'react';
import { Box, Button, Container, Typography, Paper, Grid, Card, CardContent, Avatar, Chip } from '@mui/material';
import Layout from '../components/Layout';

export default function Services() {
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
      title: 'Competitive Pricing',
      description: 'Transparent pricing with no hidden costs'
    },
    {
      icon: '⚡',
      title: 'Fast Delivery',
      description: 'Express options available for urgent shipments'
    },
    {
      icon: '🛡️',
      title: 'Fully Insured',
      description: 'All shipments are fully insured for your peace of mind'
    },
    {
      icon: '📱',
      title: 'Real-time Tracking',
      description: 'Track your shipments in real-time with our mobile app'
    },
    {
      icon: '🌍',
      title: 'Wide Coverage',
      description: 'Extensive local and regional delivery network'
    },
    {
      icon: '🎯',
      title: 'On-time Guarantee',
      description: 'Money-back guarantee if we miss our delivery window'
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
              <Button color="inherit" href="/" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Home
              </Button>
              <Button 
                variant="contained" 
                href="/services"
                sx={{ 
                  bgcolor: 'white', 
                  color: '#214d22',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
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
          backgroundImage: 'url(/images/wavebg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          color: 'white',
          py: 6,
          mt: -2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Our Services
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Comprehensive logistics solutions for all your delivery needs
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Services Section */}
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

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
              Why Choose EasyTrack?
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
              We make logistics simple, reliable, and efficient
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
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
                </Box>
              </Grid>
            ))}
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
            Ready to get started?
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 300, mb: 4, opacity: 0.9 }}>
            Contact us today to discuss your logistics needs and get a custom quote.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              href="/con"
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
              Get Quote
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/"
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
