import { Theme } from './base';
import darkTheme from './dark';
import lightTheme from './light';

// Registro di temi disponibili
const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

// Funzione per registrare temi personalizzati
export function registerTheme(name: string, theme: Theme): void {
  themes[name] = theme;
}

// Funzione per ottenere un tema
export function getTheme(name: string): Theme {
  return themes[name] || darkTheme; // Fallback al tema scuro
}

// Esporta temi e tipi
export type { Theme, ThemeOptions } from './base';
export { darkTheme, lightTheme };
export default themes;