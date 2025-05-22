"use client";

import { Box, Typography, CircularProgress, Paper } from "@mui/material";

export default function Page() {
    const showLoadingScreen = true; // Set to true to display the loading screen

    if (showLoadingScreen) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/login-bg.png)', backgroundSize: '80%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', }}>
                <Paper elevation={5} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: '400px', mx: 2, }}>
                    <CircularProgress color="primary" />
                    <Typography variant="h6" color="text.secondary">
                        Verifying your email...
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box
            sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/login-bg.png)', backgroundSize: '80%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', }}>
            <Paper elevation={5} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', maxWidth: '400px', mx: 2, }}>
                <Typography variant="h4" color="primary.main" sx={{ mb: 2 }}>
                    Email Verified Successfully
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    You can now log in to your account.
                </Typography>
            </Paper>
        </Box>
    );
}