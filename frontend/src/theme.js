import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#B87B28', // Burnished Warm Gold / Amber Cognac
      light: '#D49B45',
      dark: '#8C5914',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1C1917', // Deep Charcoal
      light: '#292524',
      dark: '#0C0A09',
      contrastText: '#FAF6F0',
    },
    background: {
      default: '#F6F3EE', // Warm Linen Beige
      paper: '#FFFFFF',   // Crisp Ivory White Card
    },
    text: {
      primary: '#1C1917',   // Deep Charcoal
      secondary: '#4D473E', // High Contrast Warm Umber (WCAG AA Compliant)
      disabled: '#78716C',
    },
    divider: 'rgba(28, 25, 23, 0.08)',
    success: {
      main: '#059669', // Emerald
      light: '#10B981',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E11D48', // Ruby
      light: '#F43F5E',
      dark: '#BE123C',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    info: {
      main: '#0284C7',
      light: '#38BDF8',
      dark: '#0369A1',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1C1917',
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1C1917',
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 600,
      color: '#1C1917',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#1C1917',
    },
    h5: {
      fontWeight: 600,
      color: '#1C1917',
    },
    h6: {
      fontWeight: 600,
      color: '#1C1917',
    },
    subtitle1: {
      color: '#4D473E',
    },
    subtitle2: {
      color: '#4D473E',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F6F3EE',
          color: '#1C1917',
          scrollbarColor: '#D6CFC4 #F6F3EE',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F6F3EE',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#D6CFC4',
            borderRadius: '4px',
            border: '2px solid #F6F3EE',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          boxShadow: '0 4px 20px rgba(28, 25, 23, 0.04)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(28, 25, 23, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(184, 123, 40, 0.35)',
            boxShadow: '0 12px 32px rgba(28, 25, 23, 0.08)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '9px 22px',
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          backgroundColor: '#1C1917', // Charcoal button for punchy luxury look
          color: '#FAF6F0',
          boxShadow: '0 4px 14px rgba(28, 25, 23, 0.15)',
          '&:hover': {
            backgroundColor: '#292524',
            boxShadow: '0 6px 20px rgba(28, 25, 23, 0.25)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(28, 25, 23, 0.18)',
          color: '#1C1917',
          '&:hover': {
            borderColor: '#B87B28',
            backgroundColor: 'rgba(184, 123, 40, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: 'rgba(28, 25, 23, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(184, 123, 40, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#B87B28',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#4D473E',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#B87B28',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8F6F2',
          '& th': {
            color: '#4D473E',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: '1px solid rgba(28, 25, 23, 0.08)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(28, 25, 23, 0.06)',
          color: '#1C1917',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(246, 243, 238, 0.6) !important',
          },
        },
      },
    },
  },
});

export default theme;
