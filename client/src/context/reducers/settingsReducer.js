// src/context/reducers/settingsReducer.js
export const initialSettingsState = {
  theme: 'light',          // tema: light/dark
  language: 'it',          // lingua dell'interfaccia
  notifications: {
    email: true,           // notifiche via email
    push: false,           // notifiche push
    frequency: 'daily'     // frequenza digest: daily/weekly/never
  },
  privacy: {
    shareData: false,      // condivisione dati per migliorare servizio
    cookiePreferences: 'essential' // essential/analytics/marketing/all
  },
  display: {
    fontSize: 'medium',    // small/medium/large
    compactMode: false,    // modalità compatta
    highContrast: false    // modalità alto contrasto
  }
};

export const SETTINGS_ACTIONS = {
  CHANGE_THEME: 'settings/changeTheme',
  CHANGE_LANGUAGE: 'settings/changeLanguage',
  UPDATE_NOTIFICATION_SETTINGS: 'settings/updateNotificationSettings',
  UPDATE_PRIVACY_SETTINGS: 'settings/updatePrivacySettings',
  UPDATE_DISPLAY_SETTINGS: 'settings/updateDisplaySettings',
  RESET_SETTINGS: 'settings/resetToDefaults'
};

export default function settingsReducer(state = initialSettingsState, action) {
  switch (action.type) {
    case SETTINGS_ACTIONS.CHANGE_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    case SETTINGS_ACTIONS.CHANGE_LANGUAGE:
      return {
        ...state,
        language: action.payload
      };
      
    case SETTINGS_ACTIONS.UPDATE_NOTIFICATION_SETTINGS:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload
        }
      };
      
    case SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS:
      return {
        ...state,
        privacy: {
          ...state.privacy,
          ...action.payload
        }
      };
      
    case SETTINGS_ACTIONS.UPDATE_DISPLAY_SETTINGS:
      return {
        ...state,
        display: {
          ...state.display,
          ...action.payload
        }
      };
      
    case SETTINGS_ACTIONS.RESET_SETTINGS:
      return initialSettingsState;
      
    default:
      return state;
  }
}