import React from 'react';
import { Box, Container, Typography, Avatar, Card } from '@mui/material';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';

export default function About() {
  const Divider = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <Box sx={{ width: '80px', height: '3px', bgcolor: 'primary.main', borderRadius: '2px' }} />
    </Box>
  );

  const ValueCard = ({ emoji, title, description }) => (
    <Box 
      textAlign="center"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        p: 2
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>{emoji}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {description}
      </Typography>
    </Box>
  );

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

  const values = [
    {
      emoji: '🤝',
      title: 'Trust',
      description: 'Building lasting relationships through transparency and reliability'
    },
    {
      emoji: '⚡',
      title: 'Efficiency',
      description: 'Optimizing every process for speed and accuracy'
    },
    {
      emoji: '💡',
      title: 'Innovation',
      description: 'Embracing new technologies to improve our services'
    },
    {
      emoji: '❤️',
      title: 'Care',
      description: 'Treating every package and customer with the utmost care'
    }
  ];

  return (
    <Layout>
      <Navbar currentPage="about" />

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

      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', md: 'row' }} 
            alignItems={{ xs: 'center', md: 'flex-start' }}
            justifyContent="space-between"
            gap={{ xs: 4, md: 6 }}
            minHeight={{ xs: 'auto', md: '400px' }}
          >
            <Box 
              flex={{ xs: '1 1 auto', md: '1 1 50%' }}
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
                Our Story
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
                Founded in 2020, EasyTrack began with a simple mission: to make logistics accessible, 
                reliable, and transparent for everyone. What started as a small local delivery service 
                has grown into a trusted partner for businesses and individuals alike.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8 }}>
                We believe that great logistics shouldn't be complicated. That's why we've built our 
                platform around simplicity, efficiency, and customer satisfaction. Every delivery, 
                every tracking update, and every customer interaction is designed to exceed expectations.
              </Typography>
            </Box>
            <Box 
              flex={{ xs: '0 0 auto', md: '1 1 50%' }}
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 3,
                  p: 4,
                  color: 'primary.contrastText',
                  textAlign: 'center',
                  width: { xs: '100%', md: 'auto' },
                  maxWidth: 300
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
            </Box>
          </Box>
        </Container>
      </Box>

      <Divider />
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box 
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center" 
            mb={6}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Mission & Vision
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: 'text.secondary' }}>
              Driving the future of logistics with innovation and reliability
            </Typography>
          </Box>

          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', md: 'row' }} 
            gap={4}
            alignItems="stretch"
          >
            <Box flex={{ xs: '1 1 auto', md: '1 1 50%' }}>
              <Card
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid #214d22',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
                  Our Mission
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8 }}>
                  To provide seamless, reliable, and innovative logistics solutions that empower 
                  businesses and individuals to connect, grow, and succeed. We're committed to 
                  making every delivery count and every customer interaction meaningful.
                </Typography>
              </Card>
            </Box>
            <Box flex={{ xs: '1 1 auto', md: '1 1 50%' }}>
              <Card
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid #214d22',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
                  Our Vision
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8 }}>
                  To become the leading logistics platform that sets the standard for excellence, 
                  innovation, and customer satisfaction. We envision a world where logistics is 
                  effortless, transparent, and accessible to everyone.
                </Typography>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      <Divider />
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box 
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center" 
            mb={6}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Meet Our Team
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: 'text.secondary' }}>
              The passionate people behind EasyTrack's success
            </Typography>
          </Box>

          <Box 
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            flexWrap="wrap"
            gap={4}
            justifyContent="center"
          >
            {team.map((member, index) => (
              <Box 
                key={index}
                flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' }}
                minWidth={{ xs: '100%', sm: '280px', md: '200px' }}
                maxWidth={{ xs: '100%', sm: '400px', md: '300px' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 600
                      }}
                    >
                      {member.avatar}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                      {member.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', mb: 2, fontWeight: 500 }}>
                      {member.position}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    {member.description}
                  </Typography>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Divider />
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box 
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center" 
            mb={6}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Our Values
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: 'text.secondary' }}>
              The principles that guide everything we do
            </Typography>
          </Box>

          <Box 
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            flexWrap="wrap"
            gap={4}
            justifyContent="center"
          >
            {values.map((value, index) => (
              <Box 
                key={index}
                flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' }}
                minWidth={{ xs: '100%', sm: '250px', md: '200px' }}
                maxWidth={{ xs: '100%', sm: '350px', md: '300px' }}
              >
                <ValueCard {...value} />
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

    </Layout>
  );
}