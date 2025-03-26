// src/hooks/useSettings.ts
import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  selectTheme, 
  selectLanguage, 
  selectNotificationSettings,
  selectPrivacySettings,
  selectDisplaySettings,
  selectAllSettings 
} from '../context/selectors';
import { 
  changeTheme, 
  changeLanguage, 
  updateNotificationSettings,
  updatePrivacySettings,
  updateDisplaySettings,
  resetSettings 
} from '../context/actions';

interface DisplaySettings {
  fontSize: string;
  compactMode: boolean;
  highContrast: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  frequency: string;
}

interface PrivacySettings {
  shareData: boolean;
  cookiePreferences: string;
}

interface Settings {
  theme: string;
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  display: DisplaySettings;
}

interface UseSettingsReturn {
  theme: string;
  language: string;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  displaySettings: DisplaySettings;
  setTheme: (newTheme: string) => void;
  setLanguage: (newLanguage: string) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  updateDisplay: (settings: Partial<DisplaySettings>) => void;
  restoreDefaults: () => void;
}

export function useSettings(): UseSettingsReturn {
  const { state, dispatch } = useAppContext();
  
  // Selettori che estraggono valori dallo stato
  const theme = selectTheme(state);
  const language = selectLanguage(state);
  const notificationSettings = selectNotificationSettings(state);
  const privacySettings = selectPrivacySettings(state);
  const displaySettings = selectDisplaySettings(state);
  const allSettings = selectAllSettings(state);
  
  // Carica le impostazioni da localStorage all'avvio
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as Settings;
        // Aggiorna ogni sezione di impostazioni individualmente
        dispatch(changeTheme(parsedSettings.theme || theme));
        dispatch(changeLanguage(parsedSettings.language || language));
        if (parsedSettings.notifications) {
          dispatch(updateNotificationSettings(parsedSettings.notifications));
        }
        if (parsedSettings.privacy) {
          dispatch(updatePrivacySettings(parsedSettings.privacy));
        }
        if (parsedSettings.display) {
          dispatch(updateDisplaySettings(parsedSettings.display));
        }
      } catch (e) {
        console.error('Errore nel caricamento delle impostazioni:', e);
      }
    }
  }, []);
  
  // Salva le impostazioni in localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(allSettings));
  }, [allSettings]);
  
  // Action dispatcher
  const setTheme = (newTheme: string) => dispatch(changeTheme(newTheme));
  const setLanguage = (newLanguage: string) => dispatch(changeLanguage(newLanguage));
  const updateNotifications = (settings: Partial<NotificationSettings>) => dispatch(updateNotificationSettings(settings));
  const updatePrivacy = (settings: Partial<PrivacySettings>) => dispatch(updatePrivacySettings(settings));
  const updateDisplay = (settings: Partial<DisplaySettings>) => dispatch(updateDisplaySettings(settings));
  const restoreDefaults = () => dispatch(resetSettings());
  
  // Applica tema al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Opzionale: aggiungi classe dark/light al body
    document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
  }, [theme]);
  
  return {
    // Valori correnti
    theme,
    language,
    notificationSettings,
    privacySettings,
    displaySettings,
    
    // Funzioni per modificare le impostazioni
    setTheme,
    setLanguage,
    updateNotifications,
    updatePrivacy,
    updateDisplay,
    restoreDefaults
  };
}