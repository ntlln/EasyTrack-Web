"use client"

import { Box, Typography, Button, TextField } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
    const router = useRouter();
    const [email, setEmail] = useState('');

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
                    <form style={formStyles}>
                        <TextField 
                            label="Email" 
                            type="email" 
                            placeholder="Email" 
                            required 
                            sx={{ width: "70%" }} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            sx={{ width: "60%" }}
                        >
                            Send Email Reset Link
                        </Button>
                    </form>
                    <Typography sx={backLinkStyles} onClick={() => router.push("/contractor/login")}>
                        Back to Login
                    </Typography>
                </Box>
            </Box>
        </>
    );
}