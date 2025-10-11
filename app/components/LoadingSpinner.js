"use client";

import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { useEffect, useState } from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to prevent multiple spinners
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Fade in={true} timeout={100}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          gap: 2
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}
