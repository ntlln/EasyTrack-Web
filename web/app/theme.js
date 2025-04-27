import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: "#5D8736",
    },
    secondary: {
      main: "#808080",
    },
    background: {
      default: mode === "dark" ? "#28282B" : "#FAF9F6",
      paper: mode === "dark" ? "#28282B" : "#FAF9F6",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: mode === "dark" ? "#28282B" : "#FAF9F6",
          borderRadius: "12px",
          boxShadow: mode === "dark" ? "0px 4px 20px rgba(0,0,0,0.5)" : "0px 4px 20px rgba(0,0,0,0.1)", padding: "16px",
        },
      },
    },
  },
});