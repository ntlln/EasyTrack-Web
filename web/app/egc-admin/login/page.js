"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress, Checkbox } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/egc-admin/");
        }
      } catch (error) {
        console.error('Session check error:', error);
        await supabase.auth.signOut();
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  const clearFields = () => {
    setEmail("");
    setPassword("");
  };

  const handleLogin = async () => {
    setLoading(true);
    setSnackbar(prev => ({ ...prev, open: false }));
    
    try {
      // Clear any existing session before login
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
        }
      });
      
      if (error) {
        clearFields();
        setSnackbar({ open: true, message: error.message, severity: "error" });
        setLoading(false);
        return;
      }

      if (pathname === "/egc-admin/login") {
        const userId = data.user.id;
        
        // First get the admin role ID
        const { data: adminRole, error: adminRoleError } = await supabase
          .from('profiles_roles')
          .select('id')
          .eq('role_name', 'Administrator')
          .single();

        if (adminRoleError || !adminRole) {
          await supabase.auth.signOut();
          clearFields();
          setSnackbar({ open: true, message: "System error: Admin role not found.", severity: "error" });
          setLoading(false);
          return;
        }

        // Then get the user profile with role information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            role_id, 
            user_status_id, 
            profiles_status (status_name)
          `)
          .eq('id', userId)
          .single();
        
        if (profileError || !profile) {
          await supabase.auth.signOut();
          clearFields();
          setSnackbar({ open: true, message: "Unable to fetch user profile.", severity: "error" });
          setLoading(false);
          return;
        }

        if (profile.profiles_status?.status_name === 'Deactivated') {
          await supabase.auth.signOut();
          clearFields();
          setSnackbar({ open: true, message: 'This account has been deactivated. Please contact an administrator for assistance.', severity: "error" });
          setLoading(false);
          return;
        }

        // Check if user's role_id matches the admin role ID
        if (Number(profile.role_id) !== Number(adminRole.id)) {
          await supabase.auth.signOut();
          clearFields();
          setSnackbar({ open: true, message: "Access denied: Only administrators can log in here.", severity: "error" });
          setLoading(false);
          return;
        }

        // Update last sign in
        await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', userId);

        // Set session cookie with proper options
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      router.push("/egc-admin/");
    } catch (error) {
      console.error('Login error:', error);
      await supabase.auth.signOut();
      clearFields();
      setSnackbar({ open: true, message: "An unexpected error occurred. Please try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Styling constants
  const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
  const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
  const formStyles = { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" };
  const checkboxContainerStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", width: "70%" };
  const checkboxStyles = { display: "flex", alignItems: "center" };
  const checkboxLabelStyles = { fontSize: ".85rem", color: "secondary.main" };
  const forgotPasswordStyles = { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
  const buttonStyles = { width: "40%", minHeight: "36px", position: "relative" };
  const progressStyles = { color: "white", position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" };
  const footerStyles = { display: "flex", gap: 5 };
  const footerLinkStyles = { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };

  return (
    <Box sx={containerStyles}>
      <Box sx={formContainerStyles}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }} sx={formStyles}>
          <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "70%" }} value={email} onChange={e => setEmail(e.target.value)} disabled={loading} onKeyPress={handleKeyPress} />
          <TextField label="Password" type="password" placeholder="Enter your password" required sx={{ width: "70%" }} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} onKeyPress={handleKeyPress} />
          <Box sx={checkboxContainerStyles}>
            <Box sx={checkboxStyles}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                size="small"
                sx={{
                  color: "primary.main",
                  '&.Mui-checked': {
                    color: "primary.main",
                  },
                  padding: "4px",
                }}
              />
              <Typography sx={checkboxLabelStyles}>Remember me</Typography>
            </Box>
            <Typography 
              color="secondary.main" 
              onClick={() => router.push("./forgot-password")} 
              sx={forgotPasswordStyles}
            >
              Forgot Password?
            </Typography>
          </Box>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            sx={buttonStyles} 
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={progressStyles}
                />
                <span style={{ visibility: "hidden" }}>Login</span>
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Box>
        <Box sx={footerStyles}>
          <Typography color="secondary.main" sx={footerLinkStyles}>Terms and Conditions</Typography>
          <Typography color="secondary.main" sx={footerLinkStyles}>Privacy Policy</Typography>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}