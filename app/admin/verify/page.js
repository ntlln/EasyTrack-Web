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
                ? 'https://www.admin.ghe-easytrack.org/verify'
                : `${window.location.origin}/admin/verify`;

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
        const handleExchangeFromUrl = async () => {
            try {
                const url = new URL(window.location.href);
                const existingSession = await supabase.auth.getSession();
                
                if (existingSession?.data?.session) {
                    router.replace('/admin');
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

                router.replace('/admin');
            } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to verify magic link', severity: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        handleExchangeFromUrl();
    }, [router, supabase]);

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
    const inputFieldStyles = { width: "70%" };
    const buttonStyles = { 
        width: "60%", 
        minHeight: "36px", 
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    };
    const backButtonStyles = { 
        fontSize: "1rem", 
        cursor: "pointer", 
        color: "secondary.main",
        "&:hover": { 
            textDecoration: "underline", 
            color: "primary.main" 
        } 
    };

    return (
        <Box sx={containerStyles}>
            <Box sx={backgroundStyles} />
            <Box sx={formContainerStyles}>
                <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                <Typography color="secondary.main">Email Verification</Typography>
                <Typography color="secondary.main" variant="body2" sx={{ textAlign: 'center', px: 2 }}>
                    Enter your email address to receive a verification link
                </Typography>

                <Box component="form" onSubmit={handleSendVerification} sx={formStyles}>
                    <TextField 
                        label="Email" 
                        type="email" 
                        placeholder="Enter your email" 
                        required 
                        sx={inputFieldStyles} 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={isLoading} 
                    />

                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            sx={buttonStyles} 
                            disabled={isLoading}
                        >
                            {!isLoading ? "Send Verification Email" : <CircularProgress size={24} sx={{ color: "primary.main" }} />}
                        </Button>
                        
                        <Typography
                            color="secondary.main"
                            onClick={() => router.push("/admin/login")}
                            sx={{ ...backButtonStyles, mt: 2 }}
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
