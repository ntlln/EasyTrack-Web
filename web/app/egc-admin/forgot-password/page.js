"use client"

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [isLoading, setIsLoading] = useState(false);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSnackbar({ open: false, message: '', severity: 'error' });
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/egc-admin/reset-password`,
            });

            if (error) {
                setSnackbar({ open: true, message: error.message, severity: 'error' });
                return;
            }

            setSnackbar({ 
                open: true, 
                message: 'Password reset link has been sent to your email.', 
                severity: 'success' 
            });
        } catch (error) {
            console.error('Reset password error:', error);
            setSnackbar({ 
                open: true, 
                message: 'An unexpected error occurred. Please try again.', 
                severity: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Styling constants
    const globalStyles = { 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } };
    const containerStyles = { display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const backLinkStyles = { color: "secondary.main", cursor: "pointer", '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: ".85rem" };
    const buttonStyles = { width: "60%", position: "relative" };
    const buttonProgressStyles = { position: "absolute", top: "50%", left: "50%", marginTop: -12, marginLeft: -12 };

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
                            placeholder="Email" 
                            required 
                            sx={{ width: "70%" }} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            sx={buttonStyles}
                            disabled={isLoading}
                        >
                            {!isLoading ? "Send Email Reset Link" : (
                                <CircularProgress 
                                    size={24}
                                    sx={{
                                        color: "primary.main"
                                    }}
                                />
                            )}
                        </Button>
                    </form>
                    <Typography sx={backLinkStyles} onClick={() => router.push("/egc-admin/login")}>
                        Back to Login
                    </Typography>
                </Box>
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
        </>
    );
}