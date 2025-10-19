import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) => {
  const isDark = mode === "dark";
  const primaryColor = isDark ? "#A3D65C" : "#214D22";
  const primaryContrast = isDark ? "#1E1E20" : "#FFFFFF";
  const secondaryColor = isDark ? "#9AA0A6" : "#6B7280";
  const bgDefault = isDark ? "#1E1E20" : "#FAFAFA";
  const bgPaper = isDark ? "#242426" : "#FFFFFF";
  const textPrimary = isDark ? "#EDEDED" : "#1E1E1E";
  const textSecondary = isDark ? "rgba(237, 237, 237, 0.75)" : "rgba(30, 30, 30, 0.7)";
  const dividerColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return createTheme({
    palette: {
      mode,
      primary: { 
        main: primaryColor,
        contrastText: primaryContrast
      },
      secondary: { main: secondaryColor },
      background: {
        default: bgDefault,
        paper: bgPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider: dividerColor,
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

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: bgPaper,
            borderRadius: "12px",
            boxShadow: isDark ? "0px 4px 20px rgba(0,0,0,0.6)" : "0px 4px 20px rgba(0,0,0,0.1)",
            padding: "16px",
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: { color: primaryColor },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow: isDark ? "0px 0px 10px rgba(163, 214, 92, 0.4)" : "0px 0px 10px rgba(75, 139, 59, 0.3)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: bgPaper,
            borderRadius: "12px",
            boxShadow: isDark ? "0px 4px 20px rgba(0,0,0,0.6)" : "0px 4px 20px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow: isDark ? "0px 8px 30px rgba(0,0,0,0.8)" : "0px 8px 30px rgba(0,0,0,0.15)",
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
                borderColor: primaryColor,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: primaryColor,
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? bgDefault : "#4B8B3B",
            color: isDark ? textPrimary : "#FFFFFF",
            boxShadow: isDark ? "0px 2px 10px rgba(0,0,0,0.3)" : "0px 2px 10px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: bgPaper,
            borderRight: `1px solid ${dividerColor}`,
            boxShadow: isDark ? "2px 0 10px rgba(0,0,0,0.3)" : "2px 0 10px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            margin: "4px 8px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(163, 214, 92, 0.1)" : "rgba(75, 139, 59, 0.1)",
            },
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(163, 214, 92, 0.2)" : "rgba(75, 139, 59, 0.2)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(163, 214, 92, 0.3)" : "rgba(75, 139, 59, 0.3)",
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
};