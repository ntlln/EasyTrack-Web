"use client";

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getLoginStatus, incrementLoginAttempt, resetLoginAttempts, MAX_ATTEMPTS, COOLDOWN_MINUTES } from "../../../utils/auth";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import TermsAndConditions from '../../components/TermsAndConditions';
import PrivacyPolicy from '../../components/PrivacyPolicy';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState({ canAttempt: true, remainingTime: 0, attempts: 0 });
  const [forcePwOpen, setForcePwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPwUpdating, setIsPwUpdating] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || !session?.user?.id) return;
        const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
        if (profile && Number(profile.role_id) === 1) {
          router.replace("/admin/");
          setTimeout(() => router.refresh(), 50);
        }
      } catch (error) { }
    };
    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === 'SIGNED_IN' && sess?.user?.id) {
        try {
          const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', sess.user.id).single();
          if (profile && Number(profile.role_id) === 1) {
            router.replace("/admin/");
            setTimeout(() => router.refresh(), 50);
          }
        } catch (_) { }
      }
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, [router, supabase]);

  useEffect(() => { setLoginStatus(getLoginStatus(email)); }, [email]);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSnackbar({ open: false, message: "", severity: "error" });
    let flowComplete = false;
    
    const loadingTimeout = setTimeout(() => {
      if (!flowComplete) {
        setIsLoading(false);
      }
    }, 10000);

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
          setSnackbar({ open: true, message: "Please verify your email first.", severity: "info" });
          setEmail(""); setPassword(""); setIsLoading(false);
          router.replace("/admin/verify");
          flowComplete = true;
          return;
        }
        const attempts = incrementLoginAttempt(email);
        const remaining = MAX_ATTEMPTS - attempts;
        setSnackbar({ open: true, message: remaining > 0 ? `Invalid credentials. ${remaining} attempts remaining.` : `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.`, severity: "error" });
        setPassword(""); setIsLoading(false); setLoginStatus(getLoginStatus(email));
        return;
      }

      const userId = data.user.id;
      const { data: profile, error: profileErr } = await supabase.from("profiles").select("role_id, last_sign_in_at, profiles_status(status_name)").eq("id", userId).single();

      if (!profile) { await supabase.auth.signOut(); throw new Error("User profile not found."); }
      if (profile.profiles_status?.status_name === "Deactivated") { await supabase.auth.signOut(); throw new Error("This account has been deactivated."); }
      if (profile.profiles_status?.status_name === "Archived") {
        await supabase.auth.signOut();
        setSnackbar({ open: true, message: "Account not found.", severity: "error" });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }
      if (Number(profile.role_id) !== 1) {
        await supabase.auth.signOut();
        setSnackbar({ open: true, message: "Access denied: Only administrators can log in here.", severity: "error" });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }

      if (!profile.last_sign_in_at) {
        resetLoginAttempts(email);
        setForcePwOpen(true);
        setIsLoading(false);
        flowComplete = true;
        return;
      }

      resetLoginAttempts(email);
      const { data: activeRowOnLogin } = await supabase
        .from('profiles_status')
        .select('id')
        .eq('status_name', 'Signed In')
        .single();

      const updateOnLogin = { last_sign_in_at: new Date().toISOString() };
      if (activeRowOnLogin?.id) updateOnLogin.user_status_id = activeRowOnLogin.id;
      await supabase.from("profiles").update(updateOnLogin).eq("id", userId);
      
      setIsLoading(false);
      router.replace("/admin/");
      setTimeout(() => router.refresh(), 50);
      flowComplete = true;
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
      setEmail(""); setPassword("");
      try { await supabase.auth.signOut(); } catch (_) {}
    } finally { 
      clearTimeout(loadingTimeout);
      if (!flowComplete) {
        setIsLoading(false);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) { await supabase.auth.signOut(); }
        } catch (_) {}
      }
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();


  const styles = {
    container: {
      display: "flex",
      width: "100%",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "background.default",
      position: "relative"
    },
    background: {
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
    },
    formContainer: {
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
    },
    form: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    textField: { width: "70%" },
    forgotPassword: { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } },
    button: { 
      width: "40%", 
      minHeight: "36px", 
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    linkContainer: { display: "flex", gap: 5 },
    link: { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } },
    alert: { width: '100%' },
    dialogContent: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: '360px' },
    changePwButton: { minWidth: '120px', position: 'relative' }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.background} />
      <Box sx={styles.formContainer}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>

        <Box component="form" onSubmit={handleLogin} sx={styles.form}>
          <TextField 
            label="Email" 
            type="email" 
            placeholder="Enter your email" 
            required 
            sx={styles.textField} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            disabled={isLoading || !loginStatus.canAttempt} 
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            required
            sx={styles.textField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || !loginStatus.canAttempt}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    disabled={isLoading || !loginStatus.canAttempt}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "70%" }}>
            <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={styles.forgotPassword}>Forgot Password?</Typography>
          </Box>

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isLoading || !loginStatus.canAttempt} sx={styles.button}>
              {!isLoading ? "Login" : <CircularProgress size={24} color="inherit" />}
            </Button>
            <Box sx={{ width: '40%', display: 'flex', justifyContent: 'center', my: 0.3 }}>
              <Typography color="secondary.main" variant="body2">or</Typography>
            </Box>
            <Typography
              color="secondary.main"
              onClick={() => router.push("/admin/verify")}
              sx={{ 
                width: '40%', 
                mt: 0.1, 
                fontSize: '0.85rem', 
                textAlign: 'center', 
                cursor: 'pointer', 
                '&:hover': { 
                  color: 'primary.main' 
                } 
              }}
            >
              Login with Email
            </Typography>
          </Box>
        </Box>

        <Box sx={styles.linkContainer}>
          <Typography onClick={() => setOpenTerms(true)} color="secondary.main" sx={styles.link}>Terms and Conditions</Typography>
          <Typography onClick={() => setOpenPrivacy(true)} color="secondary.main" sx={styles.link}>Privacy Policy</Typography>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={styles.alert}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog
        open={forcePwOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setForcePwOpen(false);
        }}
        disableEscapeKeyDown
      >
        <DialogTitle>Set a new password</DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Typography color="secondary.main">For security, please change your password before continuing.</Typography>
          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPwUpdating}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword((v) => !v)}
                    edge="end"
                    disabled={isPwUpdating}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPwUpdating}
            error={Boolean(confirmPassword) && newPassword !== confirmPassword}
            helperText={Boolean(confirmPassword) && newPassword !== confirmPassword ? 'Passwords do not match' : ' '}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    edge="end"
                    disabled={isPwUpdating}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            sx={styles.changePwButton}
            disabled={isPwUpdating || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
            onClick={async () => {
              try {
                setIsPwUpdating(true);
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                if (!userId) throw new Error('No active session');

                const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
                if (upErr) throw upErr;

                const { data: statusRow } = await supabase
                  .from('profiles_status')
                  .select('id')
                  .eq('status_name', 'Activated')
                  .single();

                const updatePayload = { last_sign_in_at: new Date().toISOString() };
                if (statusRow?.id) updatePayload.user_status_id = statusRow.id;
                
                await supabase.from('profiles').update(updatePayload).eq('id', userId);
                setSnackbar({ open: true, message: 'Password updated successfully.', severity: 'success' });
                setForcePwOpen(false);
                router.push('/admin/');
              } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to update password', severity: 'error' });
              } finally {
                setIsPwUpdating(false);
              }
            }}
          >
            {isPwUpdating ? <CircularProgress size={20} color="inherit" /> : 'Save and Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTerms} onClose={() => setOpenTerms(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ position: 'relative', pr: 6 }}>
          Terms and Conditions
          <IconButton aria-label="close" onClick={() => setOpenTerms(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TermsAndConditions />
        </DialogContent>
      </Dialog>

      <Dialog open={openPrivacy} onClose={() => setOpenPrivacy(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ position: 'relative', pr: 6 }}>
          Privacy Policy
          <IconButton aria-label="close" onClick={() => setOpenPrivacy(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PrivacyPolicy />
        </DialogContent>
      </Dialog>
    </Box>
  );
}