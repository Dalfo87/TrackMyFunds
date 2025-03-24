import { createTheme } from '@mui/material/styles';
import { baseThemeOptions, Theme, ThemeOptions } from './base';

const darkThemeOptions: ThemeOptions = {
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  charts: {
    colors: ['#3f51b5', '#f50057', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'],
    gridLines: {
      color: 'rgba(255, 255, 255, 0.1)',
      opacity: 0.5,
    },
    tooltips: {
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      textColor: '#ffffff',
      borderColor: '#3f51b5',
      borderWidth: 1,
    },
  },
  customShadows: {
    card: '0 4px 8px rgba(0, 0, 0, 0.5)',
    dialog: '0 8px 16px rgba(0, 0, 0, 0.7)',
    dropdown: '0 2px 4px rgba(0, 0, 0, 0.6)',
  },
};

const darkTheme = createTheme(darkThemeOptions) as Theme;

export default darkTheme;