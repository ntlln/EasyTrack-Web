"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { getTheme } from "./theme";
import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useSearchParams } from 'next/navigation';

export const ColorModeContext = createContext({ toggleMode: () => {}, mode: "light" });

export default function Layout({ children }) {
    // State setup
    const [mode, setMode] = useState("light");
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Theme initialization
    useEffect(() => {
        const storedMode = localStorage.getItem("themeMode");
        if (storedMode) setMode(storedMode);
        else setMode(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }, []);

    // Loading state management
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    // Theme toggle handler
    const toggleMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === "light" ? "dark" : "light";
            localStorage.setItem("themeMode", newMode);
            return newMode;
        });
    };

    // Styles
    const loadingStyles = { position: 'fixed', top: 0, left: '64px', width: 'calc(100% - 64px)', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: mode === "dark" ? "#28282B" : "#FAF9F6", zIndex: 9999 };

    return (
        <html lang="en">
            <head>
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
                            {isLoading && <Box sx={loadingStyles}><CircularProgress size={60} thickness={4} /></Box>}
                            {children}
                        </Box>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </body>
        </html>
    );
}