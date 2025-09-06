"use client";

import { Box, Typography, CircularProgress, Paper, TextField, Button, Alert, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    // Client setup
    const router = useRouter();
    const supabase = createClientComponentClient();

    // State setup
    const [status, setStatus] = useState("verifying");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verification and password setup
    useEffect(() => {
        const verify = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    setStatus("error");
                    setError("Verification failed. Please use the verification link from your email or contact support.");
                    return;
                }
                setStatus("setPassword");
            } catch (err) {
                setStatus("error");
                setError(err.message || "Verification failed.");
            }
        };
        verify();
    }, [router, supabase.auth]);

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) { setError(updateError.message); setIsLoading(false); return; }
            
            // Sign out the user after password update to force them to login again
            await supabase.auth.signOut();
            
            setStatus("success");
            setTimeout(() => router.push("/egc-admin/login"), 3000);
        } catch (err) {
            setError(err.message || "Failed to set password.");
        } finally {
            setIsLoading(false);
        }
    };

    // Styles
    const containerStyles = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/login-bg.png)', backgroundSize: '80%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
    const paperStyles = { p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: '400px', mx: 2 };
    const successPaperStyles = { ...paperStyles, gap: 3 };
    const titleStyles = { mb: 2 };
    const formStyles = { width: '100%' };
    const textFieldStyles = { mb: 2 };
    const alertStyles = { mb: 2 };

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
                        <TextField 
                            label="New Password" 
                            type={showPassword ? "text" : "password"} 
                            fullWidth 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            sx={textFieldStyles}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField 
                            label="Confirm Password" 
                            type={showConfirmPassword ? "text" : "password"} 
                            fullWidth 
                            required 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            sx={textFieldStyles}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
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
                    <Typography variant="body1" color="text.secondary" sx={{ ...titleStyles, textAlign: 'center' }}>{error}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={containerStyles}>
            <Paper elevation={5} sx={successPaperStyles}>
                <Typography variant="h4" color="primary.main" sx={titleStyles}>Account Verified!</Typography>
                <Typography variant="h6" color="text.secondary" sx={titleStyles}>You can now log in. Redirecting to login page...</Typography>
            </Paper>
        </Box>
    );
}