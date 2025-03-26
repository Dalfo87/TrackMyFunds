// src/context/selectors.ts
import { AppState } from './reducers';
import { User } from './actions';

// User selectors
export const selectUser = (state: AppState): User | null => state.user.currentUser;
export const selectIsAuthenticated = (state: AppState): boolean => state.user.isAuthenticated;
export const selectUserLoading = (state: AppState): boolean => state.user.loading;
export const selectUserError = (state: AppState): string | null => state.user.error;

// Settings selectors
export const selectTheme = (state: AppState): string => state.settings.theme;
export const selectLanguage = (state: AppState): string => state.settings.language;
export const selectNotificationSettings = (state: AppState) => state.settings.notifications;
export const selectPrivacySettings = (state: AppState) => state.settings.privacy;
export const selectDisplaySettings = (state: AppState) => state.settings.display;
export const selectAllSettings = (state: AppState) => state.settings;