import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) => createTheme({
    // Color palette
    palette: {
        mode,
        primary: { main: "#5D8736" },
        secondary: { main: "#808080" },
        background: {
            default: mode === "dark" ? "#28282B" : "#FAF9F6",
            paper: mode === "dark" ? "#28282B" : "#FAF9F6"
        },
        text: {
            primary: mode === "dark" ? "#FFFFFF" : "#000000",
            secondary: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"
        }
    },

    // Typography configuration
    typography: {
        fontFamily: 'Onest, sans-serif',
        h1: { fontFamily: 'Onest, sans-serif' },
        h2: { fontFamily: 'Onest, sans-serif' },
        h3: { fontFamily: 'Onest, sans-serif' },
        h4: { fontFamily: 'Onest, sans-serif' },
        h5: { fontFamily: 'Onest, sans-serif' },
        h6: { fontFamily: 'Onest, sans-serif' },
        subtitle1: { fontFamily: 'Onest, sans-serif' },
        subtitle2: { fontFamily: 'Onest, sans-serif' },
        body1: { fontFamily: 'Onest, sans-serif' },
        body2: { fontFamily: 'Onest, sans-serif' },
        button: { fontFamily: 'Onest, sans-serif' },
        caption: { fontFamily: 'Onest, sans-serif' },
        overline: { fontFamily: 'Onest, sans-serif' }
    },

    // Component styles
    components: {
        MuiPaper: {
            styleOverrides: {
                root: { backgroundColor: mode === "dark" ? "#28282B" : "#FAF9F6", borderRadius: "12px", boxShadow: mode === "dark" ? "0px 4px 20px rgba(0,0,0,0.5)" : "0px 4px 20px rgba(0,0,0,0.1)", padding: "16px" }
            }
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: { color: "#5D8736" }
            }
        }
    }
});