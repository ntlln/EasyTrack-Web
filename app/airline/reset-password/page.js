"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleInvalidLink = () => {
      setSnackbar({ open: true, message: 'Invalid or expired reset link. Please request a new password reset.', severity: 'error' });
      setTimeout(() => router.push('/airline/login'), 3000);
    };

    const handlePasswordReset = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        const existingSession = await supabase.auth.getSession();
        if (existingSession?.data?.session) {
          setIsValidSession(true);
          return;
        }

        if (!code) return handleInvalidLink();

        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) return handleInvalidLink();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return handleInvalidLink();

        setIsValidSession(true);
      } catch (err) {
        handleInvalidLink();
      }
    };

    handlePasswordReset();
  }, [router, supabase.auth]);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);
  const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  
  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
    setIsLoading(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSnackbar({ open: false, message: '', severity: 'error' });
    setIsLoading(true);
    
    if (password !== confirmPassword) return showError('Passwords do not match.');
    if (password.length < 6) return showError('Password must be at least 6 characters long.');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return showError(error.message);
      
      setSnackbar({ open: true, message: 'Password has been reset successfully. Redirecting to login...', severity: 'success' });
      await supabase.auth.signOut();
      setTimeout(() => router.push('/airline/login'), 2000);
    } catch (error) {
      showError('An unexpected error occurred. Please try again.');
    } finally { 
      setIsLoading(false); 
    }
  };

  const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
  const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
  const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
  const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };

  if (!isValidSession) {
    return (
      <>
        <Global styles={globalStyles} />
        <Box sx={containerStyles}>
          <Box sx={formContainerStyles}>
            <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
            <Typography color="secondary.main">Invalid Reset Link</Typography>
            <Typography color="secondary.main" align="center">Please request a new password reset link.</Typography>
          </Box>
        </Box>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Global styles={globalStyles} />
      <Box sx={containerStyles}>
        <Box sx={formContainerStyles}>
          <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
          <Typography color="secondary.main">Reset Password</Typography>
          <form onSubmit={handleSubmit} style={formStyles}>
            <TextField 
              label="New Password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter new password" 
              required 
              sx={{ width: "70%" }} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField 
              label="Confirm Password" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm new password" 
              required 
              sx={{ width: "70%" }} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ width: "60%", position: "relative" }} disabled={isLoading}>
              {!isLoading ? "Reset Password" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
            </Button>
          </form>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}