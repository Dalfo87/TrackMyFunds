// src/context/selectors.js
// Selettori per prevenire re-render non necessari

// User selectors
export const selectUser = state => state.user.currentUser;
export const selectIsAuthenticated = state => state.user.isAuthenticated;
export const selectUserLoading = state => state.user.loading;
export const selectUserError = state => state.user.error;

// Settings selectors
export const selectTheme = state => state.settings.theme;
export const selectLanguage = state => state.settings.language;
export const selectNotificationSettings = state => state.settings.notifications;
export const selectPrivacySettings = state => state.settings.privacy;
export const selectDisplaySettings = state => state.settings.display;
export const selectAllSettings = state => state.settings;
  state.settings.items.find(item => item.id === id);