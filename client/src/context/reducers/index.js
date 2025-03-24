// src/context/reducers/index.js
import userReducer, { initialUserState } from './userReducer';
import settingsReducer, { initialSettingsState } from './settingsReducer';

// Stato iniziale combinato
export const initialState = {
  user: initialUserState,
  settings: initialSettingsState
};

// Root reducer che combina tutti i reducer
export default function rootReducer(state, action) {
  return {
    user: userReducer(state.user, action),
    settings: settingsReducer(state.settings, action)
  };
}