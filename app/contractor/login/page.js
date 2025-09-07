"use client";

import { Box, Typography, Button, TextField, Checkbox, FormControlLabel, Snackbar, Alert, CircularProgress, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLoginStatus, incrementLoginAttempt, resetLoginAttempts, MAX_ATTEMPTS, COOLDOWN_MINUTES } from '../../../utils/auth';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Page() {
    // Client and state setup
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

    useEffect(() => { setLoginStatus(getLoginStatus(email)); }, [email]);

    // Event handlers
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('[ContractorLogin] Submit login');
        setIsLoading(true);
        setSnackbar({ open: false, message: "", severity: "error" });

        const status = getLoginStatus(email);
        if (!status.canAttempt) {
            setSnackbar({ open: true, message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`, severity: "error" });
            setEmail(""); setPassword(""); setIsLoading(false);
            return;
        }

        try {
            console.log('[ContractorLogin] Calling signInWithPassword');
            const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            console.log('[ContractorLogin] Login attempt result:', { hasUser: !!existingUser?.user, signInError });
            
            if (signInError) {
                if (signInError.message.includes('Email not confirmed')) {
                    const { error: otpError } = await supabase.auth.signInWithOtp({
                        email: email,
                        options: { emailRedirectTo: `${window.location.origin}/contractor/verify` }
                    });
                    
                    if (otpError) throw otpError;
                    
                    setSnackbar({ open: true, message: "Please check your email for a verification link.", severity: "info" });
                    setEmail(""); setPassword(""); setIsLoading(false);
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
            console.log('[ContractorLogin] Auth OK. userId=', userId);
            const { data: profile, error: profileErr } = await supabase.from("profiles").select("role_id, last_sign_in_at, profiles_status(status_name)").eq("id", userId).single();
            console.log('[ContractorLogin] Fetched profile:', { profile, profileErr });

            if (!profile) { 
                await supabase.auth.signOut(); 
                console.log('No profile found, signing out.');
                throw new Error("User profile not found."); 
            }
            
            if (profile.profiles_status?.status_name === "Deactivated") { 
                await supabase.auth.signOut(); 
                console.log('Account deactivated, signing out.');
                throw new Error("This account has been deactivated."); 
            }

            if (profile.profiles_status?.status_name === "Archived") {
                await supabase.auth.signOut();
                console.log('Account archived, signing out.');
                throw new Error("This account has been archived.");
            }

            console.log('User role_id:', profile.role_id);
            // Allow contractor role; optionally allow admin as well if required
            if (![3, 1].includes(Number(profile.role_id))) {
                await supabase.auth.signOut();
                console.log('Role not allowed, signing out.');
                setSnackbar({ open: true, message: "Access denied: Only contractor staff can log in here.", severity: "error" });
                setEmail(""); setPassword(""); setIsLoading(false);
                return;
            }

            // First-time login: force password change
            if (!profile.last_sign_in_at) {
                console.log('[ContractorLogin] First-time login. Forcing password change modal.');
                resetLoginAttempts(email);
                setForcePwOpen(true);
                setIsLoading(false);
                return;
            }

            resetLoginAttempts(email);
            if (rememberMe) {
                // Set a cookie to indicate remember me preference
                document.cookie = `remember_me=true; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
            }
            // Set Signed In status and last_sign_in_at
            let signedInStatusId = null;
            const { data: siRow } = await supabase
                .from('profiles_status')
                .select('id')
                .eq('status_name', 'Signed In')
                .single();
            signedInStatusId = siRow?.id || null;
            const updateOnLogin = { last_sign_in_at: new Date().toISOString() };
            if (signedInStatusId) updateOnLogin.user_status_id = signedInStatusId;
            const { error: updErr } = await supabase.from("profiles").update(updateOnLogin).eq("id", userId);
            if (updErr) console.warn('[ContractorLogin] Failed to update last_sign_in/status:', updErr);
            await supabase.auth.refreshSession();
            console.log('Redirecting to /contractor/dashboard...');
            router.replace("/contractor/");
        } catch (error) {
            console.log('Login error:', error);
            setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
            setEmail(""); setPassword("");
        } finally { setIsLoading(false); }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    // Styles
    const containerStyles = { 
        display: "flex", 
        width: "auto", 
        height: "100vh", 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "background.default"
    };

    useEffect(() => {
        // Set background image after component mounts
        const container = document.querySelector('.login-container');
        if (container) {
            container.style.backgroundImage = "url(/login-bg.png)";
            container.style.backgroundSize = "80%";
            container.style.backgroundRepeat = "no-repeat";
            container.style.backgroundPosition = "center";
            container.style.backgroundOpacity = "30%";
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

                    <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading || !loginStatus.canAttempt}>
                        {!isLoading ? "Login" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
                    </Button>
                </Box>

                <Box sx={linksContainerStyles}>
                    <Typography color="secondary.main" sx={linkStyles}>Terms and Conditions</Typography>
                    <Typography color="secondary.main" sx={linkStyles}>Privacy Policy</Typography>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>

            {/* Force password change dialog for first-time login */}
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

                                // Set Activated status and last_sign_in_at
                                let activatedStatusId = null;
                                const { data: statusRow, error: statusErr } = await supabase
                                    .from('profiles_status')
                                    .select('id')
                                    .eq('status_name', 'Activated')
                                    .single();
                                if (!statusErr) activatedStatusId = statusRow?.id || null;

                                const updatePayload = { last_sign_in_at: new Date().toISOString() };
                                if (activatedStatusId) updatePayload.user_status_id = activatedStatusId;
                                const { error: profileUpdateErr } = await supabase
                                    .from('profiles')
                                    .update(updatePayload)
                                    .eq('id', userId);
                                if (profileUpdateErr) throw profileUpdateErr;

                                setSnackbar({ open: true, message: 'Password updated successfully.', severity: 'success' });
                                setForcePwOpen(false);
                                router.replace('/contractor/');
                            } catch (err) {
                                console.error('[ContractorLogin] Password update error:', err);
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
        </Box>
    );
} 