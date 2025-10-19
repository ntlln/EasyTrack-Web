"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { getTheme } from "./theme";
import { useState, useEffect, createContext } from "react";
import { setCookie, getCookie } from 'cookies-next';

export const ColorModeContext = createContext({ toggleMode: () => {}, mode: "light" });

export default function Layout({ children }) {
    const [mode, setMode] = useState("light");

    useEffect(() => {
        const savedMode = getCookie('theme-mode') || 'light';
        setMode(savedMode);
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        setCookie('theme-mode', newMode, { 
            maxAge: 60 * 60 * 24 * 365,
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