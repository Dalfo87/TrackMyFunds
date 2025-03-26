// src/context/reducers/index.ts
import userReducer, { initialUserState, UserState } from './userReducer';
import settingsReducer, { initialSettingsState, SettingsState } from './settingsReducer';

// Definizione dello stato dell'applicazione
export interface AppState {
  user: UserState;
  settings: SettingsState;
}

// Stato iniziale combinato
export const initialState: AppState = {
  user: initialUserState,
  settings: initialSettingsState
};

// Definizione dell'azione generica
export interface Action {
  type: string;
  payload?: any;
}

// Root reducer che combina tutti i reducer
export default function rootReducer(state: AppState = initialState, action: Action): AppState {
  return {
    user: userReducer(state.user, action),
    settings: settingsReducer(state.settings, action)
  };
}