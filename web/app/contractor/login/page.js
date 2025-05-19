"use client";


import { Box, Typography, Button, TextField, Checkbox, FormControlLabel, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getLoginStatus, incrementLoginAttempt, resetLoginAttempts, MAX_ATTEMPTS, COOLDOWN_MINUTES } from '@/utils/auth';

export default function ContractorLogin() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState({ canAttempt: true, remainingTime: 0, attempts: 0 });

    useEffect(() => {
        setLoginStatus(getLoginStatus());
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) router.push("/contractor/");
        };
        checkSession();
    }, [router, supabase.auth]);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSnackbar({ open: false, message: "", severity: "error" });

        const status = getLoginStatus(email);
        if (!status.canAttempt) {
            setSnackbar({
                open: true,
                message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`,
                severity: "error",
            });
            setEmail(""); setPassword(""); setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                const attempts = incrementLoginAttempt(email);
                const remaining = MAX_ATTEMPTS - attempts;

                setSnackbar({
                    open: true,
                    message: remaining > 0
                        ? `Invalid credentials. ${remaining} attempts remaining.`
                        : `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.`,
                    severity: "error",
                });

                // Only clear password for invalid credentials
                setPassword("");
                setIsLoading(false);
                setLoginStatus(getLoginStatus(email));
                return;
            }

            const userId = data.user.id;

            // Get both role IDs
            const { data: roles } = await supabase
                .from("profiles_roles")
                .select("id, role_name")
                .in("role_name", ["Airline Staff", "Administrator"]);

            const { data: profile } = await supabase
                .from("profiles")
                .select("role_id, profiles_status(status_name)")
                .eq("id", userId)
                .single();

            if (!roles || roles.length === 0 || !profile) {
                await supabase.auth.signOut();
                throw new Error("User role or profile not found.");
            }

            if (profile.profiles_status?.status_name === "Deactivated") {
                await supabase.auth.signOut();
                throw new Error("This account has been deactivated.");
            }

            const allowedRoleIds = roles.map(role => role.id);
            if (!allowedRoleIds.includes(Number(profile.role_id))) {
                await supabase.auth.signOut();
                setSnackbar({ 
                    open: true, 
                    message: "Access denied: Only airline staff and administrator can log in here.", 
                    severity: "error" 
                });
                // Clear both fields for unauthorized users
                setEmail(""); setPassword(""); setIsLoading(false);
                return;
            }

            resetLoginAttempts(email);

            // Update session expiry based on remember me
            if (rememberMe) {
                await supabase.auth.updateSession({
                    expires_in: 60 * 60 * 24 * 30 // 30 days
                });
            }

            await supabase
                .from("profiles")
                .update({ last_sign_in_at: new Date().toISOString() })
                .eq("id", userId);

            router.push("/contractor/");
        } catch (error) {
            setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
            // Clear both fields for other errors
            setEmail(""); setPassword("");
        } finally {
            setIsLoading(false);
        }
    };

    // Styling constants
    const containerStyles = { display: "flex", width: "auto", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%" };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: "50vh", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const formStyles = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
    const checkboxStyles = { color: "primary.main", '&.Mui-checked': { color: "primary.main" }, padding: "4px" };
    const forgotPasswordStyles = { fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } };
    const buttonStyles = { width: "40%", minHeight: "36px", position: "relative" };
    const buttonProgressStyles = { position: "absolute", top: "50%", left: "50%", marginTop: -12, marginLeft: -12 };
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
                        disabled={isLoading || !loginStatus.canAttempt}
                    />
                    <TextField 
                        label="Password" 
                        type="password" 
                        placeholder="Enter your password" 
                        required 
                        sx={{ width: "70%" }} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        disabled={isLoading || !loginStatus.canAttempt}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "70%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", ml: -1 }}>
                            <Checkbox 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                                size="small" 
                                sx={checkboxStyles} 
                                disabled={isLoading || !loginStatus.canAttempt}
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
                        disabled={isLoading || !loginStatus.canAttempt}
                    >
                        {!isLoading ? "Login" : (
                            <CircularProgress 
                                size={24}
                                sx={{
                                    color: "primary.main"
                                }}
                            />
                        )}
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