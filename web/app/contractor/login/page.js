"use client";

import { Box, Typography, Button, TextField, Checkbox, FormControlLabel, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContractorLogin() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    // Session check for redirect
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) router.push("/contractor/");
            } catch (error) {
                console.error('Session check error:', error);
            }
        };
        checkSession();
    }, [router, supabase.auth]);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setSnackbar({ open: false, message: '', severity: 'error' });
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email, 
                password
            });
            
            if (error) {
                setSnackbar({ open: true, message: error.message, severity: 'error' });
                return;
            }

            // Get user profile and role
            const userId = data.user.id;
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`role_id, user_status_id, profiles_status (status_name)`)
                .eq('id', userId)
                .single();
            
            if (profileError || !profile) {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: "Unable to fetch user profile.", severity: 'error' });
                return;
            }

            // Check if account is deactivated
            if (profile.profiles_status?.status_name === 'Deactivated') {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: 'This account has been deactivated. Please contact an administrator for assistance.', severity: 'error' });
                return;
            }

            // Get contractor role
            const { data: contractorRole, error: contractorRoleError } = await supabase
                .from('profiles_roles')
                .select('id')
                .eq('role_name', 'Airline Staff')
                .single();
            
            if (contractorRoleError || !contractorRole) {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: "Account does not exist.", severity: 'error' });
                return;
            }

            // Verify user has contractor role
            if (Number(profile.role_id) !== Number(contractorRole.id)) {
                await supabase.auth.signOut();
                setSnackbar({ open: true, message: "Access denied: Only contractors can log in here.", severity: 'error' });
                return;
            }

            // Update last sign in
            await supabase
                .from('profiles')
                .update({ last_sign_in_at: new Date().toISOString() })
                .eq('id', userId);

            router.push("/contractor/");
        } catch (error) {
            console.error('Login error:', error);
            setSnackbar({ open: true, message: "An unexpected error occurred. Please try again.", severity: 'error' });
        }
    };

    // Styling constants
    const containerStyles = { display: "flex", width: "auto", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%" };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const checkboxStyles = { color: "primary.main", '&.Mui-checked': { color: "primary.main" }, padding: "4px" };
    const forgotPasswordStyles = { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
    const buttonStyles = { width: "40%", minHeight: "36px" };
    const linkStyles = { fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };

    return (
        <Box sx={containerStyles}>
            <Box sx={formContainerStyles}>
                <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                <Typography color="secondary.main">Login to EasyTrack</Typography>
                <form onSubmit={handleLogin} style={formStyles}>
                    <TextField 
                        label="Email" 
                        type="email" 
                        placeholder="Enter your email" 
                        required 
                        sx={{ width: "70%" }} 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                    <TextField 
                        label="Password" 
                        type="password" 
                        placeholder="Enter your password" 
                        required 
                        sx={{ width: "70%" }} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "70%" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Checkbox 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                                size="small" 
                                sx={checkboxStyles} 
                            />
                            <Typography sx={{ fontSize: ".85rem", color: "secondary.main" }}>
                                Remember me
                            </Typography>
                        </Box>
                        <Typography 
                            color="secondary.main" 
                            onClick={() => router.push("./forgot-password")} 
                            sx={forgotPasswordStyles}
                        >
                            Forgot Password?
                        </Typography>
                    </Box>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        sx={buttonStyles}
                    >
                        Login
                    </Button>
                </form>
                <Box sx={{ display: "flex", gap: 5 }}>
                    <Typography color="secondary.main" sx={linkStyles}>
                        Terms and Conditions
                    </Typography>
                    <Typography color="secondary.main" sx={linkStyles}>
                        Privacy Policy
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
        </Box>
    );
} 