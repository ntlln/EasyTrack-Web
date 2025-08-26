import React from 'react';
import { Box, Button, Container, Typography, Paper, Grid, Card, CardContent, Avatar, TextField } from '@mui/material';
import Layout from '../../components/Layout';

export default function ContactUs() {
  return (
    <Layout>
      {/* Header */}
      <Box
        sx={{
          background: '#f8f8f0',
          borderBottom: '1px solid rgba(33, 77, 34, 0.1)',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <img src="/images/green logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
              <Typography variant="h5" fontWeight={700} color="#214d22">
                EasyTrack
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Button color="inherit" href="/" sx={{ color: '#214d22', '&:hover': { bgcolor: 'rgba(33, 77, 34, 0.1)' } }}>
                Home
              </Button>
              <Button color="inherit" href="/services" sx={{ color: '#214d22', '&:hover': { bgcolor: 'rgba(33, 77, 34, 0.1)' } }}>
                Our Services
              </Button>
              <Button color="inherit" href="/about" sx={{ color: '#214d22', '&:hover': { bgcolor: 'rgba(33, 77, 34, 0.1)' } }}>
                About Us
              </Button>
              
              <Button 
                variant="contained" 
                href="/contact"
                sx={{ 
                  bgcolor: '#214d22', 
                  color: 'white',
                  '&:hover': { bgcolor: '#1a3d1b' }
                }}
              >
                Contact Us
              </Button>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: '#214d22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
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

      
      {/* Main Section with wavebg background */}
      <Box
        sx={{
          backgroundImage: 'url(/images/wavebg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          minHeight: '100vh',
          py: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box textAlign="center" mb={8}>
            <Typography 
              variant="h2" 
              fontWeight={700} 
              color="white"
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Get in Touch
            </Typography>
            <Typography 
              variant="h5" 
              color="white"
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                maxWidth: 600,
                mx: 'auto',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              We're here to help with all your logistics and tracking needs
            </Typography>
          </Box>

          {/* Contact Form Section */}
          <Grid container spacing={4} mb={8}>
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={4} 
                sx={{ 
                  p: 4, 
                  borderRadius: 3,
                  bgcolor: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  height: 'fit-content'
                }}
              >
                <Typography variant="h4" fontWeight={700} color="#214d22" gutterBottom>
                  Send us a Message
                </Typography>
                <Typography variant="body1" color="#666666" mb={4}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </Typography>
                
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f8f0',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.2)',
                          borderWidth: 1.5,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f8f0',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.2)',
                          borderWidth: 1.5,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f8f0',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.2)',
                          borderWidth: 1.5,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Subject"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f8f0',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.2)',
                          borderWidth: 1.5,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f8f0',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.2)',
                          borderWidth: 1.5,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(33, 77, 34, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#214d22',
                      color: 'white',
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#1a3d1b',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Contact Info Cards */}
                <Paper 
                  elevation={4} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    bgcolor: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="#214d22" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#214d22', width: 40, height: 40 }}>
                        📧
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="#214d22">
                          Email
                        </Typography>
                        <Typography variant="body2" color="#666666">
                          support@easytrack.com
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#214d22', width: 40, height: 40 }}>
                        📞
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="#214d22">
                          Phone
                        </Typography>
                        <Typography variant="body2" color="#666666">
                          +1 (555) 123-4567
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#214d22', width: 40, height: 40 }}>
                        📍
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="#214d22">
                          Address
                        </Typography>
                        <Typography variant="body2" color="#666666">
                          123 Logistics Street<br />
                          Manila, Philippines 1000
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Business Hours */}
                <Paper 
                  elevation={4} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    bgcolor: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="#214d22" gutterBottom>
                    Business Hours
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="#666666">Monday - Friday</Typography>
                      <Typography variant="body2" fontWeight={600} color="#214d22">8:00 AM - 6:00 PM</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="#666666">Saturday</Typography>
                      <Typography variant="body2" fontWeight={600} color="#214d22">9:00 AM - 4:00 PM</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="#666666">Sunday</Typography>
                      <Typography variant="body2" fontWeight={600} color="#214d22">Closed</Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Emergency Contact */}
                <Paper 
                  elevation={4} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    bgcolor: '#214d22',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Emergency Support
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    For urgent tracking issues or lost shipments
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{
                      color: 'white',
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    Call Emergency Line
                  </Button>
                </Paper>
              </Box>
            </Grid>
          </Grid>

          {/* FAQ Section */}
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, p: 4, backdropFilter: 'blur(10px)' }}>
            <Typography variant="h4" fontWeight={700} color="white" textAlign="center" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Grid container spacing={3} mt={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} color="#214d22" gutterBottom>
                      How do I track my shipment?
                    </Typography>
                    <Typography variant="body2" color="#666666">
                      Simply enter your booking number, container number, or bill of lading in our tracking system above.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} color="#214d22" gutterBottom>
                      What if my shipment is delayed?
                    </Typography>
                    <Typography variant="body2" color="#666666">
                      Contact our support team immediately. We'll investigate and provide real-time updates.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} color="#214d22" gutterBottom>
                      How long does delivery take?
                    </Typography>
                    <Typography variant="body2" color="#666666">
                      Delivery times vary by location and service type. Check your tracking for estimated delivery.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} color="#214d22" gutterBottom>
                      Can I change my delivery address?
                    </Typography>
                    <Typography variant="body2" color="#666666">
                      Address changes are possible before shipment departure. Contact us for assistance.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}