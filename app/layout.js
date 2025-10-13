"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { getTheme } from "./theme";
import { useState, useEffect, createContext, useContext, Suspense } from "react";
import { usePathname, useSearchParams } from 'next/navigation';
import { setCookie, getCookie } from 'cookies-next';
import LoadingSpinner from './components/LoadingSpinner';

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
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Theme initialization - check cookies for saved theme, default to light
    useEffect(() => {
        const savedMode = getCookie('theme-mode') || 'light';
        setMode(savedMode);
    }, []);

    // Loading state management - show spinner immediately on navigation
    useEffect(() => {
        // Skip loading for contractor and admin routes as they have their own loading
        if (pathname?.startsWith('/contractor') || pathname?.startsWith('/egc-admin')) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        
        // Show loading for minimum time to ensure smooth transition
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

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
                            {isLoading && <LoadingSpinner />}
                            {!isLoading && children}
                        </Box>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </body>
        </html>
    );
}