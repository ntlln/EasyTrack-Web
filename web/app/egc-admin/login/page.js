"use client"
import { Box, Typography, Button, TextField, Alert, Snackbar } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setSnackbar(prev => ({ ...prev, open: false }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      setLoading(false);
      return;
    }
    if (pathname === "/egc-admin/login") {
      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`role_id, user_status_id, profiles_status(status_name), profiles_roles!inner(role_name)`)
        .eq('id', userId)
        .single();
      if (profileError || !profile) {
        setSnackbar({ open: true, message: "Unable to fetch user profile.", severity: 'error' });
        setLoading(false);
        return;
      }
      if (profile.profiles_status?.status_name === 'Deactivated') {
        setSnackbar({ 
          open: true, 
          message: 'This account has been deactivated. Please contact an administrator for assistance.', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }
      if (profile.profiles_roles?.role_name !== 'Administrator') {
        setSnackbar({ open: true, message: 'This account does not have admin privileges.', severity: 'error' });
        setLoading(false);
        return;
      }
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', userId);
    }
    router.push("./");
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "70%" }} value={email} onChange={e => setEmail(e.target.value)} disabled={loading} onKeyPress={handleKeyPress} />
          <TextField label="Password" type="password" placeholder="Enter your password" required sx={{ width: "70%" }} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} onKeyPress={handleKeyPress} />
          <Button type="submit" variant="contained" color="primary" sx={{ width: "40%" }} disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
        </form>
        <Box sx={{ display: "flex", gap: 5 }}>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Terms and Conditions</Typography>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Privacy Policy</Typography>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}