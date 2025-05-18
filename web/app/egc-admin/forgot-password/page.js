"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

export default function Page() {
    // State and client setup
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Event handlers
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleKeyPress = (event) => { if (event.key === 'Enter') handleResetPassword(event); };

    // Password reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const origin = window.location.origin;
            const resetUrl = `${origin}/egc-admin/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetUrl, options: { emailRedirectTo: resetUrl } });
            if (error) throw error;
            setSnackbar({ open: true, message: "Password reset link has been sent to your email.", severity: "success" });
            setEmail('');
        } catch (error) {
            setError(error.message);
            setSnackbar({ open: true, message: error.message, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Styling constants
    const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
    const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const backLinkStyles = { color: "secondary.main", cursor: "pointer", '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: ".85rem" };

    return (
        <>
            <Global styles={globalStyles} />
            <Box sx={containerStyles}>
                <Box sx={formContainerStyles}>
                    <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                    <Typography color="secondary.main">Forgot Password</Typography>
                    <form onSubmit={handleResetPassword} style={formStyles}>
                        <TextField label="Email" type="email" placeholder="Email" required sx={{ width: "70%" }} value={email} onChange={(e) => setEmail(e.target.value)} error={!!error} helperText={error} onKeyPress={handleKeyPress} disabled={loading} />
                        <Button type="submit" variant="contained" color="primary" sx={{ width: "60%" }} disabled={loading}>{loading ? 'Sending...' : 'Send Email Reset Link'}</Button>
                    </form>
                    <Typography sx={backLinkStyles} onClick={() => router.push("/egc-admin/login")}>Back to Login</Typography>
                </Box>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
}