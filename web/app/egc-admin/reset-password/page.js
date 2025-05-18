"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const checkResetToken = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (!accessToken || !refreshToken) {
        setSnackbar({
          open: true,
          message: "Invalid or expired reset link. Please request a new password reset.",
          severity: "error"
        });
        setTimeout(() => {
          router.push('/egc-admin/login');
        }, 3000);
        return;
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) throw error;

        // Verify that we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Invalid session');
        }

        setIsValidToken(true);
      } catch (error) {
        console.error('Session error:', error);
        setSnackbar({
          open: true,
          message: "Invalid or expired reset link. Please request a new password reset.",
          severity: "error"
        });
        setTimeout(() => {
          router.push('/egc-admin/login');
        }, 3000);
      }
    };
    checkResetToken();
  }, [searchParams, router, supabase.auth]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleKeyPress = (event) => { if (event.key === 'Enter') handleResetPassword(event); };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isValidToken) {
      setSnackbar({
        open: true,
        message: "Invalid or expired reset link. Please request a new password reset.",
        severity: "error"
      });
      return;
    }

    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      setSnackbar({
        open: true,
        message: "Password reset successful! Redirecting to login...",
        severity: "success"
      });

      // Sign out after successful password reset
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/egc-admin/login');
      }, 2000);
    } catch (error) {
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
  const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
  const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
  const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
  const backLinkStyles = { color: "secondary.main", cursor: "pointer", '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: ".85rem" };

  return (
    <>
      <Global styles={globalStyles} />
      <Box sx={containerStyles}>
        <Box sx={formContainerStyles}>
          <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
          <Typography color="secondary.main">Reset Password</Typography>
          <form onSubmit={handleResetPassword} style={formStyles}>
            <TextField 
              label="New Password" 
              type="password" 
              placeholder="Enter new password" 
              required 
              sx={{ width: "70%" }} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              error={!!error} 
              onKeyPress={handleKeyPress}
              disabled={loading || !isValidToken}
            />
            <TextField 
              label="Confirm Password" 
              type="password" 
              placeholder="Confirm new password" 
              required 
              sx={{ width: "70%" }} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              error={!!error} 
              helperText={error} 
              onKeyPress={handleKeyPress}
              disabled={loading || !isValidToken}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              sx={{ width: "60%" }} 
              disabled={loading || !isValidToken}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
          <Typography 
            sx={backLinkStyles} 
            onClick={() => router.push("/egc-admin/login")}
          >
            Back to Login
          </Typography>
        </Box>
      </Box>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}