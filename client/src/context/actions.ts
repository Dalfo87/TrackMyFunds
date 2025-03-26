// src/context/actions.ts
import { SETTINGS_ACTIONS } from './reducers/settingsReducer';
import { USER_ACTIONS } from './reducers/userReducer';

// Definizione dei tipi
export interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export interface NotificationSettings {
  email?: boolean;
  push?: boolean;
  frequency?: string;
}

export interface PrivacySettings {
  shareData?: boolean;
  cookiePreferences?: string;
}

export interface DisplaySettings {
  fontSize?: string;
  compactMode?: boolean;
  highContrast?: boolean;
}

// User actions
export const loginRequest = () => ({
  type: USER_ACTIONS.LOGIN_REQUEST
});

export const loginSuccess = (user: User) => ({
  type: USER_ACTIONS.LOGIN_SUCCESS,
  payload: user
});

export const loginFailure = (errorMessage: string) => ({
  type: USER_ACTIONS.LOGIN_FAILURE,
  payload: errorMessage
});

export const logout = () => ({
  type: USER_ACTIONS.LOGOUT
});

export const updateProfile = (userData: Partial<User>) => ({
  type: USER_ACTIONS.UPDATE_PROFILE,
  payload: userData
});

// Settings actions
export const changeTheme = (theme: string) => ({
  type: SETTINGS_ACTIONS.CHANGE_THEME,
  payload: theme
});

export const changeLanguage = (language: string) => ({
  type: SETTINGS_ACTIONS.CHANGE_LANGUAGE,
  payload: language
});

export const updateNotificationSettings = (settings: NotificationSettings) => ({
  type: SETTINGS_ACTIONS.UPDATE_NOTIFICATION_SETTINGS,
  payload: settings
});

export const updatePrivacySettings = (settings: PrivacySettings) => ({
  type: SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS,
  payload: settings
});

export const updateDisplaySettings = (settings: DisplaySettings) => ({
  type: SETTINGS_ACTIONS.UPDATE_DISPLAY_SETTINGS,
  payload: settings
});

export const resetSettings = () => ({
  type: SETTINGS_ACTIONS.RESET_SETTINGS
});