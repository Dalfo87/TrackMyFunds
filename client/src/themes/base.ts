import { Theme as MuiTheme, ThemeOptions as MuiThemeOptions } from '@mui/material/styles';

// Estende l'interfaccia di Theme di Material UI
export interface ThemeOptions extends MuiThemeOptions {
  // Aggiungiamo le proprietà personalizzate per i grafici
  charts: {
    colors: string[];
    gridLines: {
      color: string;
      opacity: number;
    };
    tooltips: {
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      borderWidth: number;
    };
  };
  // Altre personalizzazioni specifiche dell'app
  customShadows?: {
    card: string;
    dialog: string;
    dropdown: string;
  };
}

// Estende il tipo Theme di Material UI
export interface Theme extends MuiTheme {
  charts: {
    colors: string[];
    gridLines: {
      color: string;
      opacity: number;
    };
    tooltips: {
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      borderWidth: number;
    };
  };
  customShadows?: {
    card: string;
    dialog: string;
    dropdown: string;
  };
}

// Impostazioni di base che saranno condivise tra tutti i temi
export const baseThemeOptions: Partial<ThemeOptions> = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    // Altre impostazioni di tipografia
  },
  shape: {
    borderRadius: 8,
  },
  // Altri elementi di base del tema
};