"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { getTheme } from "./theme";
import { useState, useEffect, createContext, useContext, Suspense } from "react";
import { setCookie, getCookie } from 'cookies-next';

export const ColorModeContext = createContext({ toggleMode: () => {}, mode: "light" });

export default function Layout({ children }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}

function LayoutContent({ children }) {
    // State setup
    const [mode, setMode] = useState("light");

    // Theme initialization - check cookies for saved theme, default to light
    useEffect(() => {
        const savedMode = getCookie('theme-mode') || 'light';
        setMode(savedMode);
    }, []);

    // Theme toggle handler
    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        setCookie('theme-mode', newMode, { 
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax'
        });
    };

    return (
        <html lang="en">
            <head>
                <title>EasyTrack</title>
                <link rel="icon" href="/brand-1.png" type="image/png" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Onest:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <style jsx global>{`
                    * {
                        font-family: 'Onest', sans-serif;
                    }
                `}</style>
            </head>
            <body>
                <ColorModeContext.Provider value={{ mode, toggleMode }}>
                    <ThemeProvider theme={getTheme(mode)}>
                        <CssBaseline />
                        <Box sx={{ margin: 0, padding: 0, overflowX: 'hidden', height: '100vh' }}>
                            {children}
                        </Box>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </body>
        </html>
    );
}