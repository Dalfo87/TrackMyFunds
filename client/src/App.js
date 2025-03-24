// src/App.js
import React from 'react';
import { AppProvider } from './context/AppContext';
import { useSettings } from './hooks/useSettings';
import SettingsPanel from './components/Settings/SettingsPanel';
import UserProfile from './components/User/UserProfile';

// Componente wrapper che applica le impostazioni
function AppWithSettings() {
  const { theme, language, displaySettings } = useSettings();
  
  // Crea classi CSS basate sulle impostazioni
  const appClasses = [
    `theme-${theme}`,
    `lang-${language}`,
    displaySettings.compactMode ? 'compact-mode' : '',
    displaySettings.highContrast ? 'high-contrast' : '',
    `font-size-${displaySettings.fontSize}`
  ].filter(Boolean).join(' ');
  
  return (
    <div className={`app ${appClasses}`}>
      <h1>La mia App</h1>
      <UserProfile />
      <SettingsPanel />
    </div>
  );
}

// Componente principale
function App() {
  return (
    <AppProvider>
      <AppWithSettings />
    </AppProvider>
  );
}

export default App;