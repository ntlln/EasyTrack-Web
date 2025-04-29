"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { getTheme } from "./theme"; // updated import
import { useState, useEffect, createContext, useContext } from "react";
import './globals.css'

export const ColorModeContext = createContext({ toggleMode: () => {}, mode: "light" });

export default function RootLayout({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const storedMode = localStorage.getItem("themeMode");
    if (storedMode) {
      setMode(storedMode);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

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
            {children}
          </ThemeProvider>
        </ColorModeContext.Provider>
      </body>
    </html>
  );
}