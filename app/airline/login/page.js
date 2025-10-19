"use client";

import { Box, Typography, Button, TextField, Checkbox, Snackbar, Alert, CircularProgress, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLoginStatus, incrementLoginAttempt, resetLoginAttempts, MAX_ATTEMPTS, COOLDOWN_MINUTES } from '../../../utils/auth';
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
    const [rememberMe, setRememberMe] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
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

    useEffect(() => { setLoginStatus(getLoginStatus(email)); }, [email]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted || !session?.user?.id) return;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role_id')
                    .eq('id', session.user.id)
                    .single();
                if (profile && [3, 1].includes(Number(profile.role_id))) {
                    router.replace('/airline/');
                    setTimeout(() => router.refresh(), 50);
                }
            } catch (_) { }
        };
        run();

        const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
            if (!sess?.user?.id) return;
            if (event === 'SIGNED_IN') {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role_id')
                        .eq('id', sess.user.id)
                        .single();
                    if (profile && [3, 1].includes(Number(profile.role_id))) {
                        router.replace('/airline/');
                        setTimeout(() => router.refresh(), 50);
                    }
                } catch (_) { }
            }
        });
        return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
    }, [router, supabase]);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSnackbar({ open: false, message: "", severity: "error" });
        let flowComplete = false;

        const status = getLoginStatus(email);
        if (!status.canAttempt) {
            setSnackbar({ open: true, message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`, severity: "error" });
            setEmail(""); setPassword(""); setIsLoading(false);
            return;
        }

        try {
            const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            
            if (signInError) {
                if (signInError.message.includes('Email not confirmed')) {
                    setSnackbar({ open: true, message: "Please verify your email first.", severity: "info" });
                    setEmail(""); setPassword(""); setIsLoading(false);
                    router.push("/airline/verify");
                    flowComplete = true;
                    return;
                }

                const attempts = incrementLoginAttempt(email);
                const remaining = MAX_ATTEMPTS - attempts;
                setSnackbar({ 
                    open: true, 
                    message: remaining > 0 
                        ? `Invalid credentials. ${remaining} attempts remaining.` 
                        : `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.`, 
                    severity: "error" 
                });
                setPassword(""); setIsLoading(false); setLoginStatus(getLoginStatus(email));
                return;
            }

            const userId = existingUser.user.id;
            const { data: profile, error: profileErr } = await supabase.from("profiles").select("role_id, last_sign_in_at, profiles_status(status_name)").eq("id", userId).single();

            if (!profile) { 
                await supabase.auth.signOut(); 
                throw new Error("User profile not found."); 
            }
            
            if (profile.profiles_status?.status_name === "Deactivated") { 
                await supabase.auth.signOut(); 
                throw new Error("This account has been deactivated."); 
            }

            if (profile.profiles_status?.status_name === "Archived") {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: "Account not found.", severity: "error" });
                setEmail(""); setPassword(""); setIsLoading(false);
                return;
            }

            if (![3, 1].includes(Number(profile.role_id))) {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: "Access denied: Only airline staff can log in here.", severity: "error" });
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
            if (rememberMe) {
                document.cookie = `remember_me=true; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
            }
            
            const { data: siRow } = await supabase
                .from('profiles_status')
                .select('id')
                .eq('status_name', 'Signed In')
                .single();
            
            const updateOnLogin = { 
                last_sign_in_at: new Date().toISOString(),
                ...(siRow?.id && { user_status_id: siRow.id })
            };
            
            await supabase.from("profiles").update(updateOnLogin).eq("id", userId);
            await supabase.auth.refreshSession();
            router.replace("/airline/");
            setTimeout(() => router.refresh(), 50);
            flowComplete = true;
        } catch (error) {
            setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
            setEmail(""); setPassword("");
            try { await supabase.auth.signOut(); } catch (_) {}
        } finally { 
            setIsLoading(false);
            if (!flowComplete) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) { await supabase.auth.signOut(); }
                } catch (_) {}
            }
        }
    };

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (event) => event.preventDefault();
    const containerStyles = { 
        display: "flex", 
        width: "auto", 
        height: "100vh", 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "background.default"
    };

    useEffect(() => {
        const container = document.querySelector('.login-container');
        if (container) {
            Object.assign(container.style, {
                backgroundImage: "url(/login-bg.png)",
                backgroundSize: "80%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundOpacity: "30%"
            });
        }
    }, []);

    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const inputFieldStyles = { width: "70%" };
    const checkboxContainerStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", width: "70%" };
    const checkboxWrapperStyles = { display: "flex", alignItems: "center", ml: -1 };
    const checkboxStyles = { color: "primary.main", '&.Mui-checked': { color: "primary.main" }, padding: "4px" };
    const checkboxLabelStyles = { fontSize: ".85rem", color: "secondary.main" };
    const forgotPasswordStyles = { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
    const buttonStyles = { width: "40%", minHeight: "36px", position: "relative" };
    const linksContainerStyles = { display: "flex", gap: 5 };
    const linkStyles = { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };

    return (
        <Box sx={containerStyles} className="login-container">
            <Box sx={formContainerStyles}>
                <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                <Typography color="secondary.main">Login to EasyTrack</Typography>

                <Box component="form" onSubmit={handleLogin} sx={formStyles}>
                    <TextField label="Email" type="email" placeholder="Enter your email" required sx={inputFieldStyles} value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading || !loginStatus.canAttempt} />
                    <TextField 
                        label="Password" 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Enter your password" 
                        required 
                        sx={inputFieldStyles} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
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

                    <Box sx={checkboxContainerStyles}>
                        <Box sx={checkboxWrapperStyles} onClick={() => setRememberMe(!rememberMe)} style={{ cursor: 'pointer' }}>
                            <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" sx={checkboxStyles} disabled={isLoading || !loginStatus.canAttempt} />
                            <Typography sx={checkboxLabelStyles}>Remember me</Typography>
                        </Box>
                        <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={forgotPasswordStyles}>Forgot Password?</Typography>
                    </Box>

                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading || !loginStatus.canAttempt}>
                            {!isLoading ? "Login" : <CircularProgress size={24} sx={{ color: "inherit" }} />}
                        </Button>
                        <Box sx={{ width: '40%', display: 'flex', justifyContent: 'center', my: 0.3 }}>
                            <Typography color="secondary.main" variant="body2">or</Typography>
                        </Box>
                        <Typography
                            color="secondary.main"
                            onClick={() => router.push("/airline/verify")}
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

                <Box sx={linksContainerStyles}>
                    <Typography color="secondary.main" sx={linkStyles} onClick={() => setOpenTerms(true)}>Terms and Conditions</Typography>
                    <Typography color="secondary.main" sx={linkStyles} onClick={() => setOpenPrivacy(true)}>Privacy Policy</Typography>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>

            <Dialog
                open={forcePwOpen}
                onClose={(event, reason) => { if (reason !== 'backdropClick') setForcePwOpen(false); }}
                disableEscapeKeyDown
            >
                <DialogTitle>Set a new password</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '360px' }}>
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

                                const updatePayload = { 
                                    last_sign_in_at: new Date().toISOString(),
                                    ...(statusRow?.id && { user_status_id: statusRow.id })
                                };
                                
                                await supabase.from('profiles').update(updatePayload).eq('id', userId);
                                setSnackbar({ open: true, message: 'Password updated successfully.', severity: 'success' });
                                setForcePwOpen(false);
                                router.replace('/airline/');
                            } catch (err) {
                                setSnackbar({ open: true, message: err.message || 'Failed to update password', severity: 'error' });
                            } finally {
                                setIsPwUpdating(false);
                            }
                        }}
                    >
                        {isPwUpdating ? <CircularProgress size={20} sx={{ color: 'primary.main' }} /> : 'Save and Continue'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openTerms} onClose={() => setOpenTerms(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ position: 'relative', pr: 6 }}>
                    Terms and Conditions
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenTerms(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
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
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenPrivacy(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
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