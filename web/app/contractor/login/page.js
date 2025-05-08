"use client";
import { Box, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContractorLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setSnackbar({ open: false, message: '', severity: 'error' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      setLoading(false);
      return;
    }
    if (pathname === "/contractor/login") {
      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', userId)
        .single();
      if (profileError || !profile) {
        setSnackbar({ open: true, message: "Unable to fetch user profile.", severity: 'error' });
        setLoading(false);
        return;
      }
      const { data: airlineStaffRole, error: airlineStaffRoleError } = await supabase
        .from('profiles_roles')
        .select('id')
        .eq('role_name', 'Airline Staff')
        .single();
      if (airlineStaffRoleError || !airlineStaffRole) {
        setSnackbar({ open: true, message: "Account does not exist.", severity: 'error' });
        setLoading(false);
        return;
      }
      if (Number(profile.role_id) !== Number(airlineStaffRole.id)) {
        setSnackbar({ open: true, message: "Access denied: Only airline staff can log in here.", severity: 'error' });
        setLoading(false);
        return;
      }
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', userId);
    }
    router.push("/contractor/");
  };

  return (
    <Box sx={{ display: "flex", width: "auto", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%" }} >
      <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }} >
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }} >EasyTrack</Typography>
        <Typography color="secondary.main" >Login to EasyTrack</Typography>
        <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "70%" }} value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
        <TextField label="Password" type="password" placeholder="Enter your password" required sx={{ width: "70%" }} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "70%" }}>
          <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={{ fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Forgot Password?</Typography>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Button variant="contained" color="primary" sx={{ width: "40%" }} onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
        <Box sx={{ display: "flex", gap: 5 }}>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Terms and Conditions</Typography>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>Privacy Policy</Typography>
        </Box>
      </Box>
    </Box>
  );
} 