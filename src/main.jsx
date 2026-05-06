import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: '#f0effe',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e1b4b',
      secondary: '#475569',
      disabled: '#94a3b8',
    },
    divider: 'rgba(0,0,0,0.06)',
  },
  spacing: 7,
  shape: {
    borderRadius: 10,
  },
  typography: {
    htmlFontSize: 14,
    fontFamily: ['Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    fontSize: 13,
    body1: { fontSize: '0.8125rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.45 },
    caption: { fontSize: '0.6875rem', lineHeight: 1.35 },
    h1: { fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.025em' },
    h3: { fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.018em' },
    h5: { fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontSize: '0.9375rem', fontWeight: 700 },
    button: { fontSize: '0.8125rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        html: { scrollBehavior: 'smooth' },
        body: {
          fontFamily: 'Inter, Segoe UI, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: '0.01em',
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
        sizeSmall: { padding: '4px 10px', fontSize: '0.75rem' },
        sizeLarge: { padding: '8px 18px', fontSize: '0.875rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 10 },
          '& .MuiOutlinedInput-input': { padding: '15px', fontSize: '0.8125rem' },
          '&.project-description-textarea textarea': { padding: '0px' },

        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px',
          fontSize: '0.8125rem',
        },
        head: {
          padding: '10px 14px',
          fontSize: '0.65rem',
          letterSpacing: '0.06em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 7, fontWeight: 700, fontSize: '0.6875rem', height: 22 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 800 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 7,
          fontSize: '0.6875rem',
          fontWeight: 600,
          bgcolor: '#1e1b4b',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { scrollbarWidth: 'thin' },
      },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
