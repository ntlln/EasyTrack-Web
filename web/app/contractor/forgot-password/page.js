"use client"

import { Box, Typography, Button, TextField } from "@mui/material";
import { Global } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

export default function Page() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') handleResetPassword(event);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/contractor/reset-password` });
            if (error) throw error;
            router.push('/contractor/login');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Global styles={{ 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } }} />
            <Box sx={{ display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
                <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }}>
                    <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
                    <Typography color="secondary.main">Forgot Password</Typography>
                    <form onSubmit={handleResetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <TextField label="Email" type="email" placeholder="Email" required sx={{ width: "70%" }} value={email} onChange={(e) => setEmail(e.target.value)} error={!!error} helperText={error} onKeyPress={handleKeyPress} />
                        <Button type="submit" variant="contained" color="primary" sx={{ width: "60%" }} disabled={loading}>{loading ? 'Sending...' : 'Send Email Reset Link'}</Button>
                    </form>
                    <Typography sx={{ color: "secondary.main", cursor: "pointer", '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: ".85rem" }} onClick={() => router.push("/contractor/login")}>Back to Login</Typography>
                </Box>
            </Box>
        </>
    );
}