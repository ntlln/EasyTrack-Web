import { useTheme } from '@mui/material/styles';

// Theme utility functions for consistent styling
export const useThemeUtils = () => {
  const theme = useTheme();
  
  return {
    // Spacing utilities
    spacing: {
      xs: theme.spacing(1),
      sm: theme.spacing(2),
      md: theme.spacing(3),
      lg: theme.spacing(4),
      xl: theme.spacing(6),
    },
    
    // Color utilities
    colors: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      background: theme.palette.background.default,
      paper: theme.palette.background.paper,
      text: {
        primary: theme.palette.text.primary,
        secondary: theme.palette.text.secondary,
      },
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
    },
    
    // Typography utilities
    typography: {
      fontFamily: theme.typography.fontFamily,
      h1: theme.typography.h1,
      h2: theme.typography.h2,
      h3: theme.typography.h3,
      h4: theme.typography.h4,
      h5: theme.typography.h5,
      h6: theme.typography.h6,
      body1: theme.typography.body1,
      body2: theme.typography.body2,
      button: theme.typography.button,
    },
    
    // Component styling utilities
    components: {
      // Paper component styling
      paper: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0px 4px 20px rgba(0,0,0,0.6)' 
          : '0px 4px 20px rgba(0,0,0,0.1)',
        padding: theme.spacing(2),
      },
      
      // Button component styling
      button: {
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 0px 10px rgba(163, 214, 92, 0.4)'
            : '0px 0px 10px rgba(75, 139, 59, 0.3)',
        },
      },
      
      // Card component styling
      card: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark'
          ? '0px 4px 20px rgba(0,0,0,0.6)'
          : '0px 4px 20px rgba(0,0,0,0.1)',
        padding: theme.spacing(2),
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 8px 30px rgba(0,0,0,0.8)'
            : '0px 8px 30px rgba(0,0,0,0.15)',
        },
      },
      
      // Input component styling
      input: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
        },
      },
      
      // Sidebar styling
      sidebar: {
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '2px 0 10px rgba(0,0,0,0.3)'
          : '2px 0 10px rgba(0,0,0,0.1)',
      },
      
      // Navigation styling
      navigation: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      
      // Footer styling
      footer: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
    
    // Animation utilities
    animations: {
      fadeIn: {
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      slideIn: {
        animation: 'slideIn 0.3s ease-in-out',
        '@keyframes slideIn': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      bounce: {
        animation: 'bounce 0.5s ease-in-out',
        '@keyframes bounce': {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
      },
    },
    
    // Responsive utilities
    breakpoints: {
      xs: theme.breakpoints.up('xs'),
      sm: theme.breakpoints.up('sm'),
      md: theme.breakpoints.up('md'),
      lg: theme.breakpoints.up('lg'),
      xl: theme.breakpoints.up('xl'),
    },
  };
};

// Export theme utilities for use without hook
export const getThemeUtils = (theme) => ({
  spacing: {
    xs: theme.spacing(1),
    sm: theme.spacing(2),
    md: theme.spacing(3),
    lg: theme.spacing(4),
    xl: theme.spacing(6),
  },
  colors: {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    background: theme.palette.background.default,
    paper: theme.palette.background.paper,
    text: {
      primary: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
    },
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  },
  components: {
    paper: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: '12px',
      boxShadow: theme.palette.mode === 'dark' 
        ? '0px 4px 20px rgba(0,0,0,0.6)' 
        : '0px 4px 20px rgba(0,0,0,0.1)',
      padding: theme.spacing(2),
    },
    button: {
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: theme.palette.mode === 'dark'
          ? '0px 0px 10px rgba(163, 214, 92, 0.4)'
          : '0px 0px 10px rgba(75, 139, 59, 0.3)',
      },
    },
    card: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: '12px',
      boxShadow: theme.palette.mode === 'dark'
        ? '0px 4px 20px rgba(0,0,0,0.6)'
        : '0px 4px 20px rgba(0,0,0,0.1)',
      padding: theme.spacing(2),
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: theme.palette.mode === 'dark'
          ? '0px 8px 30px rgba(0,0,0,0.8)'
          : '0px 8px 30px rgba(0,0,0,0.15)',
      },
    },
    sidebar: {
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.palette.mode === 'dark'
        ? '2px 0 10px rgba(0,0,0,0.3)'
        : '2px 0 10px rgba(0,0,0,0.1)',
    },
    navigation: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    footer: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
});
