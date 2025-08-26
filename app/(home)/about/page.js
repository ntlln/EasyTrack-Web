import React from 'react';
import { Box, Button, Container, Typography, Grid, Avatar, Card, CardContent } from '@mui/material';
import Layout from '../../components/Layout';

export default function About() {
  const team = [
    {
      name: 'John Smith',
      position: 'CEO & Founder',
      avatar: 'JS',
      description: 'Leading the company with over 15 years of logistics experience'
    },
    {
      name: 'Sarah Johnson',
      position: 'Operations Manager',
      avatar: 'SJ',
      description: 'Ensuring smooth operations and customer satisfaction'
    },
    {
      name: 'Mike Chen',
      position: 'Technology Lead',
      avatar: 'MC',
      description: 'Driving innovation in our tracking and delivery systems'
    },
    {
      name: 'Lisa Rodriguez',
      position: 'Customer Success',
      avatar: 'LR',
      description: 'Building strong relationships with our valued customers'
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
              <Button color="inherit" href="/services" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Our Services
              </Button>
              <Button 
                variant="contained" 
                href="/about"
                sx={{ 
                  bgcolor: 'white', 
                  color: '#214d22',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
                About Us
              </Button>
              <Button color="inherit" href="/contact" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
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
              About Us
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Your trusted partner in logistics and delivery solutions
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Our Story Section */}
      <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: '#214d22' }}>
                Our Story
              </Typography>
              <Typography variant="body1" sx={{ color: '#666666', mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
                Founded in 2020, EasyTrack began with a simple mission: to make logistics accessible, 
                reliable, and transparent for everyone. What started as a small local delivery service 
                has grown into a trusted partner for businesses and individuals alike.
              </Typography>
              <Typography variant="body1" sx={{ color: '#666666', fontSize: '1.1rem', lineHeight: 1.8 }}>
                We believe that great logistics shouldn't be complicated. That's why we've built our 
                platform around simplicity, efficiency, and customer satisfaction. Every delivery, 
                every tracking update, and every customer interaction is designed to exceed expectations.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: '#214d22',
                  borderRadius: 3,
                  p: 4,
                  color: 'white',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  3+ Years
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                  of Excellence
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  Serving our community with dedication and innovation
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission & Vision Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
              Mission & Vision
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
              Driving the future of logistics with innovation and reliability
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid #214d22'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#214d22' }}>
                  Our Mission
                </Typography>
                <Typography variant="body1" sx={{ color: '#666666', fontSize: '1.1rem', lineHeight: 1.8 }}>
                  To provide seamless, reliable, and innovative logistics solutions that empower 
                  businesses and individuals to connect, grow, and succeed. We're committed to 
                  making every delivery count and every customer interaction meaningful.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid #214d22'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#214d22' }}>
                  Our Vision
                </Typography>
                <Typography variant="body1" sx={{ color: '#666666', fontSize: '1.1rem', lineHeight: 1.8 }}>
                  To become the leading logistics platform that sets the standard for excellence, 
                  innovation, and customer satisfaction. We envision a world where logistics is 
                  effortless, transparent, and accessible to everyone.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
              Meet Our Team
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
              The passionate people behind EasyTrack's success
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
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
                      fontSize: '1.5rem',
                      fontWeight: 600
                    }}
                  >
                    {member.avatar}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#214d22', mb: 2, fontWeight: 500 }}>
                    {member.position}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.9rem' }}>
                    {member.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
              Our Values
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
              The principles that guide everything we do
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 2, color: '#214d22' }}>🤝</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                  Trust
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Building lasting relationships through transparency and reliability
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 2, color: '#214d22' }}>⚡</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                  Efficiency
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Optimizing every process for speed and accuracy
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 2, color: '#214d22' }}>💡</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                  Innovation
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Embracing new technologies to improve our services
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 2, color: '#214d22' }}>❤️</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                  Care
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Treating every package and customer with the utmost care
                </Typography>
              </Box>
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
            Ready to work with us?
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 300, mb: 4, opacity: 0.9 }}>
            Let's discuss how EasyTrack can help with your logistics needs.
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
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/services"
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
              Our Services
            </Button>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
