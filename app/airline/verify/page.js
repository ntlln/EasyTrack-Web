"use client";

import { Box, Typography, Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [isLoading, setIsLoading] = useState(false);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleSendVerification = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSnackbar({ open: false, message: "", severity: "error" });

        try {
            const isProduction = process.env.NODE_ENV === 'production';
            const redirectUrl = isProduction 
                ? 'https://www.airline.ghe-easytrack.org/verify'
                : `${window.location.origin}/airline/verify`;

            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: { emailRedirectTo: redirectUrl }
            });
            
            if (error) throw error;
            
            setSnackbar({ open: true, message: "Magic link sent! Check your email and click the link to sign in.", severity: "success" });
            setEmail("");
        } catch (error) {
            setSnackbar({ open: true, message: error.message || "Failed to send verification email", severity: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const container = document.querySelector('.verify-container');
        if (container) {
            container.style.backgroundImage = "url(/login-bg.png)";
            container.style.backgroundSize = "80%";
            container.style.backgroundRepeat = "no-repeat";
            container.style.backgroundPosition = "center";
            container.style.backgroundOpacity = "30%";
        }

        const handleExchangeFromUrl = async () => {
            try {
                const url = new URL(window.location.href);
                const existingSession = await supabase.auth.getSession();
                
                if (existingSession?.data?.session) {
                    router.replace('/airline');
                    return;
                }

                const errorDescription = url.searchParams.get('error_description');
                if (errorDescription) {
                    setSnackbar({ open: true, message: decodeURIComponent(errorDescription), severity: 'error' });
                }

                const hasCode = !!url.searchParams.get('code');
                if (!hasCode) return;

                setIsLoading(true);
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
                if (error) throw error;

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('No active session after verification');

                router.replace('/airline');
            } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to verify magic link', severity: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        handleExchangeFromUrl();
    }, [router, supabase]);

    return (
        <Box 
            sx={{ 
                display: "flex", 
                width: "auto", 
                height: "100vh", 
                justifyContent: "center", 
                alignItems: "center",
                backgroundColor: "background.default"
            }} 
            className="verify-container"
        >
            <Box 
                sx={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    width: "50vh", 
                    backgroundColor: "background.default", 
                    boxShadow: 5, 
                    borderRadius: 3, 
                    alignItems: "center", 
                    pt: 5, 
                    pb: 5, 
                    gap: 2 
                }}
            >
                <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                <Typography color="secondary.main">Email Verification</Typography>
                <Typography color="secondary.main" variant="body2" sx={{ textAlign: 'center', px: 2 }}>
                    Enter your email address to receive a verification link
                </Typography>

                <Box 
                    component="form" 
                    onSubmit={handleSendVerification} 
                    sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                >
                    <TextField 
                        label="Email" 
                        type="email" 
                        placeholder="Enter your email" 
                        required 
                        sx={{ width: "70%" }} 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={isLoading} 
                    />

                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            sx={{ width: "60%", minHeight: "36px", position: "relative" }} 
                            disabled={isLoading}
                        >
                            {!isLoading ? "Send Verification Email" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
                        </Button>
                        
                        <Typography
                            color="secondary.main"
                            onClick={() => router.push("/airline/login")}
                            sx={{ 
                                fontSize: "1rem", 
                                cursor: "pointer", 
                                color: "secondary.main",
                                mt: 2,
                                "&:hover": { 
                                    textDecoration: "underline", 
                                    color: "primary.main" 
                                } 
                            }}
                        >
                            Back to Login
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar} 
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
