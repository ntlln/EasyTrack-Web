"use client";

import { Box, Button, Container, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Navbar({ currentPage = 'home' }) {
  const [activeSection, setActiveSection] = useState(currentPage);

  useEffect(() => {
    if (currentPage === 'about') {
      setActiveSection('about');
      return;
    }
    
    if (currentPage === 'home') {
      document.documentElement.style.scrollBehavior = 'smooth';
      
      const handleScroll = () => {
        const element = document.getElementById('home');
        if (element) {
          const rect = element.getBoundingClientRect();
          const viewportMiddle = window.innerHeight / 2;
          
          if (rect.top <= viewportMiddle && rect.bottom > 80) {
            setActiveSection('home');
          }
        }
      };

      handleScroll();
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.documentElement.style.scrollBehavior = 'auto';
      };
    }
  }, [currentPage]);

  const handleHomeClick = () => {
    if (currentPage === 'home') {
      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/';
    }
  };

  const getButtonStyles = (section) => ({
    variant: activeSection === section ? 'contained' : 'text',
    sx: {
      bgcolor: activeSection === section ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
      color: 'primary.contrastText',
      '&:hover': {
        bgcolor: activeSection === section ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)'
      },
      transition: 'all 0.3s ease'
    }
  });

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <img src="/brand-1.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
            <Typography variant="h5" fontWeight={700} color="primary.contrastText">
              EasyTrack
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Button 
              onClick={handleHomeClick}
              {...getButtonStyles('home')}
            >
              Home
            </Button>
            <Button 
              href="/about" 
              {...getButtonStyles('about')}
            >
              About Us
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
