import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    // Color palette
    palette: {
      mode,
      primary: { 
        main: mode === "dark" ? "#A3D65C" : "#214D22", // dark green tone
        contrastText: mode === "dark" ? "#1E1E20" : "#FFFFFF"
      },
      secondary: { main: mode === "dark" ? "#9AA0A6" : "#6B7280" }, // neutral gray
      background: {
        default: mode === "dark" ? "#1E1E20" : "#FAFAFA", // softer contrast for eyes
        paper: mode === "dark" ? "#242426" : "#FFFFFF",
      },
      text: {
        primary: mode === "dark" ? "#EDEDED" : "#1E1E1E",
        secondary:
          mode === "dark"
            ? "rgba(237, 237, 237, 0.75)"
            : "rgba(30, 30, 30, 0.7)",
      },
      divider: mode === "dark"
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
      success: { 
        main: "#7FB77E",
        contrastText: "#FFFFFF"
      },
      warning: { 
        main: "#E6A157",
        contrastText: "#FFFFFF"
      },
      error: { 
        main: "#D36161",
        contrastText: "#FFFFFF"
      },
      info: { 
        main: "#5CAAE6",
        contrastText: "#FFFFFF"
      },
    },

    // Typography configuration
    typography: {
      fontFamily: "Onest, sans-serif",
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 500 },
      h4: { fontWeight: 500 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
      body1: { fontSize: "1rem" },
      body2: { fontSize: "0.9rem" },
      button: { textTransform: "none", fontWeight: 500 },
    },

    // Component styles
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#242426" : "#FFFFFF",
            borderRadius: "12px",
            boxShadow:
              mode === "dark"
                ? "0px 4px 20px rgba(0,0,0,0.6)"
                : "0px 4px 20px rgba(0,0,0,0.1)",
            padding: "16px",
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: { color: mode === "dark" ? "#A3D65C" : "#214D22" },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow:
                mode === "dark"
                  ? "0px 0px 10px rgba(163, 214, 92, 0.4)"
                  : "0px 0px 10px rgba(75, 139, 59, 0.3)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#242426" : "#FFFFFF",
            borderRadius: "12px",
            boxShadow:
              mode === "dark"
                ? "0px 4px 20px rgba(0,0,0,0.6)"
                : "0px 4px 20px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow:
                mode === "dark"
                  ? "0px 8px 30px rgba(0,0,0,0.8)"
                  : "0px 8px 30px rgba(0,0,0,0.15)",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: mode === "dark" ? "#A3D65C" : "#4B8B3B",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: mode === "dark" ? "#A3D65C" : "#4B8B3B",
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#1E1E20" : "#4B8B3B",
            color: mode === "dark" ? "#EDEDED" : "#FFFFFF",
            boxShadow: mode === "dark"
              ? "0px 2px 10px rgba(0,0,0,0.3)"
              : "0px 2px 10px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "dark" ? "#242426" : "#FFFFFF",
            borderRight: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            boxShadow: mode === "dark"
              ? "2px 0 10px rgba(0,0,0,0.3)"
              : "2px 0 10px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            margin: "4px 8px",
            "&:hover": {
              backgroundColor: mode === "dark" ? "rgba(163, 214, 92, 0.1)" : "rgba(75, 139, 59, 0.1)",
            },
            "&.Mui-selected": {
              backgroundColor: mode === "dark" ? "rgba(163, 214, 92, 0.2)" : "rgba(75, 139, 59, 0.2)",
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(163, 214, 92, 0.3)" : "rgba(75, 139, 59, 0.3)",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: "16px",
            fontWeight: 500,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            fontWeight: 500,
          },
        },
      },
    },
  });