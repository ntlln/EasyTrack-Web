"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { getTheme } from "./theme"; // updated import
import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useSearchParams } from 'next/navigation';
import './globals.css'

export const ColorModeContext = createContext({ toggleMode: () => {}, mode: "light" });

export default function RootLayout({ children }) {
  const [mode, setMode] = useState("light");
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedMode = localStorage.getItem("themeMode");
    if (storedMode) {
      setMode(storedMode);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Minimum loading time of 500ms

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", newMode);
      return newMode;
    });
  };

  return (
    <html lang="en">
      <body>
        <ColorModeContext.Provider value={{ mode, toggleMode }}>
          <ThemeProvider theme={getTheme(mode)}>
            <CssBaseline />
            {isLoading && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: '64px', // Width of the minimized sidebar
                  width: 'calc(100% - 64px)', // Subtract minimized sidebar width
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: mode === "dark" ? "#28282B" : "#FAF9F6",
                  zIndex: 9999,
                }}
              >
                <CircularProgress size={60} thickness={4} />
              </Box>
            )}
            {children}
          </ThemeProvider>
        </ColorModeContext.Provider>
      </body>
    </html>
  );
}