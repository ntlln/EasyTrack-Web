"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  // Client setup
  const router = useRouter();
  const supabase = createClientComponentClient();

  // State setup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle password reset callback: exchange code for a session then proceed
  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        // If already signed in, proceed
        const existingSession = await supabase.auth.getSession();
        if (existingSession?.data?.session) {
          setIsValidSession(true);
          return;
        }

        // If no code, show invalid link
        if (!code) {
          setSnackbar({ open: true, message: 'Invalid or expired reset link. Please request a new password reset.', severity: 'error' });
          setTimeout(() => router.push('/egc-admin/login'), 3000);
          return;
        }

        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('Password reset exchange error:', error);
          setSnackbar({ open: true, message: 'Invalid or expired reset link. Please request a new password reset.', severity: 'error' });
          setTimeout(() => router.push('/egc-admin/login'), 3000);
          return;
        }

        // Verify session is established
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setSnackbar({ open: true, message: 'Invalid or expired reset link. Please request a new password reset.', severity: 'error' });
          setTimeout(() => router.push('/egc-admin/login'), 3000);
          return;
        }

        setIsValidSession(true);
      } catch (err) {
        console.error('Password reset error:', err);
        setSnackbar({ open: true, message: 'Invalid or expired reset link. Please request a new password reset.', severity: 'error' });
        setTimeout(() => router.push('/egc-admin/login'), 3000);
      }
    };

    handlePasswordReset();
  }, [router, supabase.auth]);

  // Event handlers
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSnackbar({ open: false, message: '', severity: 'error' });
    setIsLoading(true);

    if (password !== confirmPassword) { setSnackbar({ open: true, message: 'Passwords do not match.', severity: 'error' }); setIsLoading(false); return; }
    if (password.length < 6) { setSnackbar({ open: true, message: 'Password must be at least 6 characters long.', severity: 'error' }); setIsLoading(false); return; }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setSnackbar({ open: true, message: error.message, severity: 'error' }); return; }
      setSnackbar({ open: true, message: 'Password has been reset successfully. Redirecting to login...', severity: 'success' });
      await supabase.auth.signOut();
      setTimeout(() => router.push('/egc-admin/login'), 2000);
    } catch (error) {
      setSnackbar({ open: true, message: 'An unexpected error occurred. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
  const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
  const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
  const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
  const textFieldStyles = { width: "70%" };
  const buttonStyles = { width: "60%", position: "relative" };
  const alertStyles = { width: '100%' };

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
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
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
            <TextField label="New Password" type="password" placeholder="Enter new password" required sx={textFieldStyles} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            <TextField label="Confirm Password" type="password" placeholder="Confirm new password" required sx={textFieldStyles} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
            <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading}>
              {!isLoading ? "Reset Password" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
            </Button>
          </form>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}