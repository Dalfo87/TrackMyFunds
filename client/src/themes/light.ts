import { createTheme } from '@mui/material/styles';
import { baseThemeOptions, Theme, ThemeOptions } from './base';

const lightThemeOptions: ThemeOptions = {
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  charts: {
    colors: ['#3f51b5', '#f50057', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'],
    gridLines: {
      color: 'rgba(0, 0, 0, 0.1)',
      opacity: 0.5,
    },
    tooltips: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#333333',
      borderColor: '#dddddd',
      borderWidth: 1,
    },
  },
  customShadows: {
    card: '0 2px 4px rgba(0, 0, 0, 0.1)',
    dialog: '0 4px 8px rgba(0, 0, 0, 0.15)',
    dropdown: '0 1px 2px rgba(0, 0, 0, 0.12)',
  },
};

const lightTheme = createTheme(lightThemeOptions) as Theme;

export default lightTheme;