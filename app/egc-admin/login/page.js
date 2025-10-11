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
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Page() {
  // Client and state setup
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

  // Session and role validation
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || !session?.user?.id) return;
        const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', session.user.id).single();
        if (profile && Number(profile.role_id) === 1) {
          router.replace("/egc-admin/");
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
            router.replace("/egc-admin/");
            setTimeout(() => router.refresh(), 50);
          }
        } catch (_) { }
      }
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, [router, supabase]);

  useEffect(() => { setLoginStatus(getLoginStatus(email)); }, [email]);

  // Event handlers
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('[AdminLogin] Submit login');
    setIsLoading(true);
    setSnackbar({ open: false, message: "", severity: "error" });
    let flowComplete = false; // set true when we navigate or intentionally pause at a modal
    
    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (!flowComplete) {
        console.warn('[AdminLogin] Login timeout - resetting loading state');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const status = getLoginStatus(email);
    if (!status.canAttempt) {
      setSnackbar({ open: true, message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`, severity: "error" });
      setEmail(""); setPassword(""); setIsLoading(false);
      return;
    }

    try {
      console.log('[AdminLogin] Calling signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn('[AdminLogin] signInWithPassword error:', error);
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setSnackbar({ open: true, message: "Please verify your email first.", severity: "info" });
          setEmail(""); setPassword(""); setIsLoading(false);
          // Redirect to verify page
          router.replace("/egc-admin/verify");
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
      console.log('[AdminLogin] Auth OK. userId=', userId);
      const adminRoleId = 1; // Administrator role ID
      const { data: profile, error: profileErr } = await supabase.from("profiles").select("role_id, last_sign_in_at, profiles_status(status_name)").eq("id", userId).single();
      console.log('[AdminLogin] Profile fetch:', { profile, profileErr });

      if (!profile) { await supabase.auth.signOut(); throw new Error("User profile not found."); }
      if (profile.profiles_status?.status_name === "Deactivated") { await supabase.auth.signOut(); throw new Error("This account has been deactivated."); }
      if (profile.profiles_status?.status_name === "Archived") {
        await supabase.auth.signOut();
        setSnackbar({ open: true, message: "Account not found.", severity: "error" });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }
      if (Number(profile.role_id) !== adminRoleId) {
        await supabase.auth.signOut();
        setSnackbar({ open: true, message: "Access denied: Only administrators can log in here.", severity: "error" });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }

      // If first login (no previous sign-in), force password change before proceeding
      if (!profile.last_sign_in_at) {
        console.log('[AdminLogin] First-time login. Forcing password change modal.');
        resetLoginAttempts(email);
        setForcePwOpen(true);
        setIsLoading(false);
        flowComplete = true; // intentionally stay with session for password update
        return;
      }

      resetLoginAttempts(email);
      // On every successful login, update last_sign_in_at and set status to 'Signed In' if available
      let activeStatusIdOnLogin = null;
      const { data: activeRowOnLogin } = await supabase
        .from('profiles_status')
        .select('id')
        .eq('status_name', 'Signed In')
        .single();
      console.log('[AdminLogin] Signed In status id:', activeRowOnLogin);
      activeStatusIdOnLogin = activeRowOnLogin?.id || null;

      const updateOnLogin = { last_sign_in_at: new Date().toISOString() };
      if (activeStatusIdOnLogin) updateOnLogin.user_status_id = activeStatusIdOnLogin;
      const { error: updErr } = await supabase.from("profiles").update(updateOnLogin).eq("id", userId);
      if (updErr) console.warn('[AdminLogin] Failed to update last_sign_in/status:', updErr);
      console.log('[AdminLogin] About to navigate to /egc-admin/');
      setIsLoading(false); // Stop loading before navigation
      router.replace("/egc-admin/");
      setTimeout(() => router.refresh(), 50);
      flowComplete = true;
      console.log('[AdminLogin] Navigation initiated, flowComplete set to true');
    } catch (error) {
      console.error('[AdminLogin] Login flow error:', error);
      setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
      setEmail(""); setPassword("");
      try { await supabase.auth.signOut(); } catch (_) {}
    } finally { 
      console.log('[AdminLogin] Finally block - flowComplete:', flowComplete);
      clearTimeout(loadingTimeout);
      if (!flowComplete) {
        setIsLoading(false);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) { await supabase.auth.signOut(); console.log('[AdminLogin] Cleaned up lingering session after failed login.'); }
        } catch (_) {}
      }
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();


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
  const buttonStyles = { 
    width: "40%", 
    minHeight: "36px", 
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  const progressStyles = { 
    color: "inherit"
  };
  const loginProgressStyles = { 
    color: "inherit"
  };
  const linkContainerStyles = { display: "flex", gap: 5 };
  const linkStyles = { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
  const alertStyles = { width: '100%' };
  const dialogContentStyles = { display: 'flex', flexDirection: 'column', gap: 2, minWidth: '360px' };
  const changePwButtonStyles = { minWidth: '120px', position: 'relative' };

  return (
    <Box sx={containerStyles}>
      <Box sx={backgroundStyles} />
      <Box sx={formContainerStyles}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>

        <Box component="form" onSubmit={handleLogin} sx={formStyles}>
          <TextField label="Email" type="email" placeholder="Enter your email" required sx={textFieldStyles} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading || !loginStatus.canAttempt} />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            required
            sx={textFieldStyles}
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
            <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={forgotPasswordStyles}>Forgot Password?</Typography>
          </Box>

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isLoading || !loginStatus.canAttempt} sx={buttonStyles}>
              {!isLoading ? "Login" : <CircularProgress size={24} sx={{ ...loginProgressStyles, color: 'inherit' }} />}
            </Button>
            <Box sx={{ width: '40%', display: 'flex', justifyContent: 'center', my: 0.3 }}>
              <Typography color="secondary.main" variant="body2">or</Typography>
            </Box>
            <Typography
              color="secondary.main"
              onClick={() => router.push("/egc-admin/verify")}
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

        <Box sx={linkContainerStyles}>
          <Typography onClick={() => setOpenTerms(true)} color="secondary.main" sx={linkStyles}>Terms and Conditions</Typography>
          <Typography onClick={() => setOpenPrivacy(true)} color="secondary.main" sx={linkStyles}>Privacy Policy</Typography>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Force password change dialog for first-time login */}
      <Dialog
        open={forcePwOpen}
        onClose={(event, reason) => {
          // Prevent closing via backdrop click
          if (reason !== 'backdropClick') setForcePwOpen(false);
        }}
        disableEscapeKeyDown
      >
        <DialogTitle>Set a new password</DialogTitle>
        <DialogContent sx={dialogContentStyles}>
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
            sx={changePwButtonStyles}
            disabled={isPwUpdating || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
            onClick={async () => {
              try {
                setIsPwUpdating(true);
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                if (!userId) throw new Error('No active session');

                const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
                if (upErr) throw upErr;

                // Activate account by setting user_status_id to the id of 'Activated'
                let activeStatusId = null;
                const { data: statusRow, error: statusErr } = await supabase
                  .from('profiles_status')
                  .select('id')
                  .eq('status_name', 'Activated')
                  .single();
                if (!statusErr) {
                  activeStatusId = statusRow?.id || null;
                }

                const updatePayload = { last_sign_in_at: new Date().toISOString() };
                if (activeStatusId) {
                  updatePayload.user_status_id = activeStatusId;
                }
                const { error: profileUpdateErr } = await supabase
                  .from('profiles')
                  .update(updatePayload)
                  .eq('id', userId);
                if (profileUpdateErr) throw profileUpdateErr;
                setSnackbar({ open: true, message: 'Password updated successfully.', severity: 'success' });
                setForcePwOpen(false);
                router.push('/egc-admin/');
              } catch (err) {
                console.error('[AdminLogin] Password update error:', err);
                setSnackbar({ open: true, message: err.message || 'Failed to update password', severity: 'error' });
              } finally {
                setIsPwUpdating(false);
              }
            }}
          >
            {isPwUpdating ? <CircularProgress size={20} sx={progressStyles} /> : 'Save and Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms and Conditions Modal */}
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

      {/* Privacy Policy Modal */}
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