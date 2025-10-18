"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}

function ForgotPasswordContent() {
    // Client and state setup
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [isLoading, setIsLoading] = useState(false);

    // Event handlers
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSnackbar({ open: false, message: '', severity: 'error' });
        setIsLoading(true);
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                setSnackbar({ open: true, message: 'Please enter a valid email address.', severity: 'error' });
                return;
            }

            // First check if the user exists and is verified
            const response = await fetch('/api/check-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSnackbar({ open: true, message: data.error, severity: 'error' });
                return;
            }

            // Only proceed with password reset if user is verified
            // Determine the correct redirect URL based on environment
            const isProduction = process.env.NODE_ENV === 'production';
            const redirectUrl = isProduction 
                ? 'https://www.admin.ghe-easytrack.org/reset-password'
                : `${window.location.origin}/admin/reset-password`;

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { 
                redirectTo: redirectUrl 
            });
            
            if (resetError) { 
                console.error('Password reset error:', resetError);
                if (resetError.message.includes('seconds')) {
                    setSnackbar({ open: true, message: resetError.message, severity: 'error' });
                } else if (resetError.message.includes('rate limit')) {
                    setSnackbar({ open: true, message: 'Too many requests. Please wait a moment before trying again.', severity: 'error' });
                } else {
                    setSnackbar({ open: true, message: 'Failed to send reset email. Please try again later.', severity: 'error' });
                }
                return; 
            }
            
            setSnackbar({ open: true, message: 'Password reset link has been sent to your email. Please check your inbox and spam folder.', severity: 'success' });
        } catch (error) {
            console.error('Reset password error:', error);
            setSnackbar({ open: true, message: 'An unexpected error occurred. Please try again.', severity: 'error' });
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleBackToLogin = () => {
        // Clear any existing session before navigating back
        supabase.auth.signOut();
        router.push("/admin/login");
    };

    // Styles
    const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
    const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const backLinkStyles = { color: "secondary.main", cursor: "pointer", '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: ".85rem" };
    const buttonStyles = { width: "60%", position: "relative" };
    const buttonProgressStyles = { position: "absolute", top: "50%", left: "50%", marginTop: -12, marginLeft: -12 };
    const textFieldStyles = { width: "70%" };
    const progressStyles = { color: "primary.main" };
    const alertStyles = { width: '100%' };

    return (
        <>
            <Global styles={globalStyles} />
            <Box sx={containerStyles}>
                <Box sx={formContainerStyles}>
                    <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                    <Typography color="secondary.main">Forgot Password</Typography>
                    <form onSubmit={handleSubmit} style={formStyles}>
                        <TextField 
                            label="Email" 
                            type="email" 
                            placeholder="Enter your email address" 
                            required 
                            sx={textFieldStyles} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={isLoading}
                            autoComplete="email"
                            inputProps={{ 'aria-label': 'Email address for password reset' }}
                        />
                        <Button type="submit" variant="contained" color="primary" sx={buttonStyles} disabled={isLoading}>
                            {!isLoading ? "Send Email Reset Link" : <CircularProgress size={24} sx={progressStyles} />}
                        </Button>
                    </form>
                    <Typography sx={backLinkStyles} onClick={handleBackToLogin}>Back to Login</Typography>
                </Box>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
}