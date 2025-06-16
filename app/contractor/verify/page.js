"use client";

import { Box, Typography, CircularProgress, Paper, TextField, Button, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    // Client and state setup
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [status, setStatus] = useState("verifying");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Account verification
    useEffect(() => {
        const verify = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) { setStatus("error"); setError("Verification failed. Please use the verification link from your email or contact support."); return; }
                setStatus("setPassword");
            } catch (err) { setStatus("error"); setError(err.message || "Verification failed."); }
        };
        verify();
    }, [router, supabase.auth]);

    // Password setup
    const handleSetPassword = async (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) { setError(updateError.message); setIsLoading(false); return; }
            setStatus("success");
            setTimeout(() => router.push("/contractor/login"), 3000);
        } catch (err) { setError(err.message || "Failed to set password."); } finally { setIsLoading(false); }
    };

    // Styles
    const containerStyles = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/login-bg.png)', backgroundSize: '80%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
    const paperStyles = { p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: '400px', mx: 2 };
    const formStyles = { width: '100%' };
    const textFieldStyles = { mb: 2 };
    const alertStyles = { mb: 2 };
    const titleStyles = { mb: 2 };
    const subtitleStyles = { mb: 2, textAlign: 'center' };

    if (status === "verifying") {
        return (
            <Box sx={containerStyles}>
                <Paper elevation={5} sx={paperStyles}>
                    <CircularProgress color="primary" />
                    <Typography variant="h6" color="text.secondary">Verifying your account...</Typography>
                </Paper>
            </Box>
        );
    }

    if (status === "setPassword") {
        return (
            <Box sx={containerStyles}>
                <Paper elevation={5} sx={paperStyles}>
                    <Typography variant="h5" color="primary.main" sx={titleStyles}>Set Your Password</Typography>
                    <Typography variant="body2" color="text.secondary" sx={titleStyles}>Please set a password for your account before logging in.</Typography>
                    <form onSubmit={handleSetPassword} style={formStyles}>
                        <TextField label="New Password" type="password" fullWidth required value={password} onChange={e => setPassword(e.target.value)} sx={textFieldStyles} />
                        <TextField label="Confirm Password" type="password" fullWidth required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} sx={textFieldStyles} />
                        {error && <Alert severity="error" sx={alertStyles}>{error}</Alert>}
                        <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}>
                            {isLoading ? <CircularProgress size={24} /> : "Set Password & Continue"}
                        </Button>
                    </form>
                </Paper>
            </Box>
        );
    }

    if (status === "error") {
        return (
            <Box sx={containerStyles}>
                <Paper elevation={5} sx={paperStyles}>
                    <Typography variant="h4" color="error" sx={titleStyles}>Verification Failed</Typography>
                    <Typography variant="body1" color="text.secondary" sx={subtitleStyles}>{error}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={containerStyles}>
            <Paper elevation={5} sx={paperStyles}>
                <Typography variant="h4" color="primary.main" sx={titleStyles}>Account Verified!</Typography>
                <Typography variant="h6" color="text.secondary" sx={titleStyles}>You can now log in. Redirecting to login page...</Typography>
            </Paper>
        </Box>
    );
}