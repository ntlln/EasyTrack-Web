"use client";

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getLoginStatus, incrementLoginAttempt, resetLoginAttempts, MAX_ATTEMPTS, COOLDOWN_MINUTES } from "../../../utils/auth";

export default function Page() {
  // Client and state setup
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState({ canAttempt: true, remainingTime: 0, attempts: 0 });

  // Session and role validation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
          if (profile && Number(profile.role_id) === 1) router.push("/egc-admin/"); // 1 = Administrator
        }
      } catch (error) { }
    };
    checkSession();
  }, [router, supabase.auth]);

  useEffect(() => { setLoginStatus(getLoginStatus(email)); }, [email]);

  // Event handlers
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSnackbar({ open: false, message: "", severity: "error" });

    const status = getLoginStatus(email);
    if (!status.canAttempt) {
      setSnackbar({ open: true, message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`, severity: "error" });
      setEmail(""); setPassword(""); setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/egc-admin/verify` } });
          setSnackbar({ open: true, message: otpError ? otpError.message : "Please check your email for a verification link.", severity: otpError ? "error" : "info" });
          setEmail(""); setPassword(""); setIsLoading(false);
          return;
        }
        const attempts = incrementLoginAttempt(email);
        const remaining = MAX_ATTEMPTS - attempts;
        setSnackbar({ open: true, message: remaining > 0 ? `Invalid credentials. ${remaining} attempts remaining.` : `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.`, severity: "error" });
        setPassword(""); setIsLoading(false); setLoginStatus(getLoginStatus(email));
        return;
      }

      const userId = data.user.id;
      const adminRoleId = 1; // Administrator role ID
      const { data: profile } = await supabase.from("profiles").select("role_id, profiles_status(status_name)").eq("id", userId).single();

      if (!profile) { await supabase.auth.signOut(); throw new Error("User profile not found."); }
      if (profile.profiles_status?.status_name === "Deactivated") { await supabase.auth.signOut(); throw new Error("This account has been deactivated."); }
      if (Number(profile.role_id) !== adminRoleId) {
        await supabase.auth.signOut();
        setSnackbar({ open: true, message: "Access denied: Only administrators can log in here.", severity: "error" });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }

      resetLoginAttempts(email);
      await supabase.from("profiles").update({ last_sign_in_at: new Date().toISOString() }).eq("id", userId);
      router.push("/egc-admin/");
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
      setEmail(""); setPassword("");
    } finally { setIsLoading(false); }
  };

  // Styles
  const containerStyles = {
    display: "flex",
    width: "100%",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "background.default",
    position: "relative"
  };

  const backgroundStyles = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url(/login-bg.png)",
    backgroundSize: "80%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    zIndex: 0
  };

  const formContainerStyles = {
    display: "flex",
    flexDirection: "column",
    width: "50vh",
    backgroundColor: "background.default",
    boxShadow: 5,
    borderRadius: 3,
    alignItems: "center",
    pt: 5,
    pb: 5,
    gap: 2,
    position: "relative",
    zIndex: 1
  };
  const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
  const textFieldStyles = { width: "70%" };
  const forgotPasswordStyles = { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
  const buttonStyles = { width: "40%", minHeight: "36px", position: "relative" };
  const progressStyles = { color: "primary.main", position: "absolute", top: "50%", left: "50%", marginTop: -12, marginLeft: -12 };
  const linkContainerStyles = { display: "flex", gap: 5 };
  const linkStyles = { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
  const alertStyles = { width: '100%' };

  return (
    <Box sx={containerStyles}>
      <Box sx={backgroundStyles} />
      <Box sx={formContainerStyles}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>

        <Box component="form" onSubmit={handleLogin} sx={formStyles}>
          <TextField label="Email" type="email" placeholder="Enter your email" required sx={textFieldStyles} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading || !loginStatus.canAttempt} />
          <TextField label="Password" type="password" placeholder="Enter your password" required sx={textFieldStyles} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading || !loginStatus.canAttempt} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "70%" }}>
            <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={forgotPasswordStyles}>Forgot Password?</Typography>
          </Box>

          <Button type="submit" variant="contained" color="primary" disabled={isLoading || !loginStatus.canAttempt} sx={buttonStyles}>
            {!isLoading ? "Login" : <CircularProgress size={24} sx={progressStyles} />}
          </Button>
        </Box>

        <Box sx={linkContainerStyles}>
          <Typography onClick={() => router.push("/terms-and-conditions")} color="secondary.main" sx={linkStyles}>Terms and Conditions</Typography>
          <Typography onClick={() => router.push("/privacy-policy")} color="secondary.main" sx={linkStyles}>Privacy Policy</Typography>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}