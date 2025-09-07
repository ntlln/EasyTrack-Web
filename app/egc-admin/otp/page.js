"use client";

import { Box, Typography, TextField, Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('collect');
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) setEmail(e);
  }, []);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email) {
      setSnackbar({ open: true, message: "Enter your email.", severity: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setSnackbar({ open: true, message: "We sent a 6-digit code to your email.", severity: "info" });
      setStep('verify');
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to send code", severity: "error" });
    } finally { setIsLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code || code.length !== 6) {
      setSnackbar({ open: true, message: "Enter the 6-digit code.", severity: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("Verification succeeded but no session found.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", userId)
        .single();

      if (!profile || Number(profile.role_id) !== 1) {
        await supabase.auth.signOut();
        throw new Error("Access denied.");
      }

      // Update profile status and last_sign_in_at
      let signedInStatusId = null;
      const { data: siRow } = await supabase
        .from('profiles_status')
        .select('id')
        .eq('status_name', 'Signed In')
        .single();
      signedInStatusId = siRow?.id || null;
      const updateOnLogin = { last_sign_in_at: new Date().toISOString() };
      if (signedInStatusId) updateOnLogin.user_status_id = signedInStatusId;
      await supabase.from("profiles").update(updateOnLogin).eq("id", userId);

      router.replace("/egc-admin/");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to verify code", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyles = {
    display: "flex",
    width: "100%",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "background.default",
    position: "relative"
  };
  const bgStyles = {
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
  const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2, position: "relative", zIndex: 1 };
  const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
  const inputStyles = { width: "70%" };
  const buttonStyles = { width: "40%", minHeight: "36px", position: "relative" };
  const groupStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 };

  return (
    <Box sx={containerStyles}>
      <Box sx={bgStyles} />
      <Box sx={formContainerStyles}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login with OTP</Typography>
        {step === 'collect' && (
          <>
            <Typography color="secondary.main" sx={{ textAlign: 'center', px: 4 }}>Enter your email and we will send a 6-digit code.</Typography>
            <Box component="form" onSubmit={handleSend} sx={formStyles}>
              <Box sx={groupStyles}>
                <TextField label="Email" type="email" placeholder="you@example.com" required sx={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </Box>
              <Box sx={groupStyles}>
                <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading || !email}>
                  {!isLoading ? "Send Code" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
                </Button>
                <Typography color="secondary.main" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }} onClick={() => router.push('/egc-admin/login')}>
                  Back to login
                </Typography>
              </Box>
            </Box>
          </>
        )}
        {step === 'verify' && (
          <>
            <Typography color="secondary.main" sx={{ textAlign: 'center', px: 4 }}>We sent a 6-digit code to your email. Enter it below to continue.</Typography>
            <Box component="form" onSubmit={handleVerify} sx={formStyles}>
              <Box sx={groupStyles}>
                <TextField label="Email" type="email" placeholder="you@example.com" required sx={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                <TextField
                  label="6-digit code"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
                  placeholder="______"
                  sx={inputStyles}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                />
              </Box>
              <Box sx={groupStyles}>
                <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading || !email || code.length !== 6}>
                  {!isLoading ? "Verify" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      
    </Box>
  );
}


