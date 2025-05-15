"use client"
import { Box, Typography, Button, TextField } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleResetPassword(event);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // If successful, redirect to login
      router.push('/contractor/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Global styles={{ 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } }} />
      <Box sx={{ display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }}>
          <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
          <Typography color="secondary.main">Reset Password</Typography>
          <form onSubmit={handleResetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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
            />
            <Button 
              type="submit"
              variant="contained" 
              color="primary" 
              sx={{ width: "60%" }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
          <Typography
            sx={{
              color: "secondary.main",
              cursor: "pointer",
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              },
              fontSize: ".85rem"
            }}
            onClick={() => router.push("/contractor/login")}
          >
            Back to Login
          </Typography>
        </Box>
      </Box>
    </>
  );
}