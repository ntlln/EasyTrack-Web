"use client";

import { Box, Button, Container, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Navbar({ currentPage = 'home' }) {
  const [activeSection, setActiveSection] = useState(currentPage);

  // Set active section based on current page
  useEffect(() => {
    if (currentPage === 'about') {
      setActiveSection('about');
      return;
    }
    
    if (currentPage === 'home') {
      // Add smooth scrolling behavior
      document.documentElement.style.scrollBehavior = 'smooth';
      
      const handleScroll = () => {
        const sections = ['home'];
        const scrollPosition = window.scrollY;
        const headerHeight = 80; // Approximate header height
      
        let currentSection = 'home'; // Default to home
        
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementBottom = rect.bottom;
            
            // More precise detection: check if section is in the viewport
            // A section is active if its top is above the middle of the viewport
            const viewportMiddle = window.innerHeight / 2;
            
            if (elementTop <= viewportMiddle && elementBottom > headerHeight) {
              currentSection = section;
            }
          }
        }
        
        setActiveSection(currentSection);
      };

      // Initial call to set the correct section on page load
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
            <img src="/images/white-logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
            <Typography variant="h5" fontWeight={700} color="primary.contrastText">
              EasyTrack
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Button 
              variant={activeSection === 'home' ? 'contained' : 'text'}
              onClick={handleHomeClick}
              sx={{ 
                bgcolor: activeSection === 'home' ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                color: activeSection === 'home' ? 'primary.contrastText' : 'primary.contrastText',
                '&:hover': { 
                  bgcolor: activeSection === 'home' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)' 
                },
                transition: 'all 0.3s ease'
              }}
            >
              Home
            </Button>
            <Button 
              variant={activeSection === 'about' ? 'contained' : 'text'}
              href="/about" 
              sx={{ 
                bgcolor: activeSection === 'about' ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                color: activeSection === 'about' ? 'primary.contrastText' : 'primary.contrastText',
                '&:hover': { 
                  bgcolor: activeSection === 'about' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)' 
                },
                transition: 'all 0.3s ease'
              }}
            >
              About Us
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
