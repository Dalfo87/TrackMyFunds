// src/context/selectors.js
// Selettori per prevenire re-render non necessari

// User selectors
export const selectUser = state => state.user.currentUser;
export const selectIsAuthenticated = state => state.user.isAuthenticated;
export const selectUserLoading = state => state.user.loading;
export const selectUserError = state => state.user.error;

// src/context/actions.js (aggiungi questi)
import { SETTINGS_ACTIONS } from './reducers/settingsReducer';

// Settings actions
export const changeTheme = (theme) => ({
  type: SETTINGS_ACTIONS.CHANGE_THEME,
  payload: theme
});

export const changeLanguage = (language) => ({
  type: SETTINGS_ACTIONS.CHANGE_LANGUAGE,
  payload: language
});

export const updateNotificationSettings = (settings) => ({
  type: SETTINGS_ACTIONS.UPDATE_NOTIFICATION_SETTINGS,
  payload: settings
});

export const updatePrivacySettings = (settings) => ({
  type: SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS,
  payload: settings
});

export const updateDisplaySettings = (settings) => ({
  type: SETTINGS_ACTIONS.UPDATE_DISPLAY_SETTINGS,
  payload: settings
});

export const resetSettings = () => ({
  type: SETTINGS_ACTIONS.RESET_SETTINGS
});
  state.settings.items.find(item => item.id === id);