// src/components/Settings/SettingsPanel.tsx
import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import ThemeSelector from './ThemeSelector';
import LanguageSelector from './LanguageSelector';

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

const SettingsPanel: React.FC = () => {
  const { 
    notificationSettings, 
    privacySettings, 
    displaySettings,
    updateNotifications,
    updatePrivacy, 
    updateDisplay,
    restoreDefaults
  } = useSettings();
  
  return (
    <div className="settings-panel">
      <h2>Impostazioni</h2>
      
      <section className="settings-section">
        <h3>Aspetto</h3>
        <ThemeSelector />
        
        <h4>Visualizzazione</h4>
        <div className="form-group">
          <label>Dimensione testo</label>
          <select 
            value={displaySettings.fontSize}
            onChange={(e) => updateDisplay({ fontSize: e.target.value })}
          >
            <option value="small">Piccolo</option>
            <option value="medium">Medio</option>
            <option value="large">Grande</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>
            <input 
              type="checkbox"
              checked={displaySettings.compactMode}
              onChange={(e) => updateDisplay({ compactMode: e.target.checked })}
            />
            Modalità compatta
          </label>
        </div>
        
        <div className="form-group">
          <label>
            <input 
              type="checkbox"
              checked={displaySettings.highContrast}
              onChange={(e) => updateDisplay({ highContrast: e.target.checked })}
            />
            Alto contrasto
          </label>
        </div>
      </section>
      
      <section className="settings-section">
        <h3>Lingua</h3>
        <LanguageSelector />
      </section>
      
      <section className="settings-section">
        <h3>Notifiche</h3>
        <div className="form-group">
          <label>
            <input 
              type="checkbox"
              checked={notificationSettings.email}
              onChange={(e) => updateNotifications({ email: e.target.checked })}
            />
            Notifiche email
          </label>
        </div>
        
        <div className="form-group">
          <label>
            <input 
              type="checkbox"
              checked={notificationSettings.push}
              onChange={(e) => updateNotifications({ push: e.target.checked })}
            />
            Notifiche push
          </label>
        </div>
        
        <div className="form-group">
          <label>Frequenza digest</label>
          <select 
            value={notificationSettings.frequency}
            onChange={(e) => updateNotifications({ frequency: e.target.value })}
          >
            <option value="daily">Giornaliera</option>
            <option value="weekly">Settimanale</option>
            <option value="never">Mai</option>
          </select>
        </div>
      </section>
      
      <section className="settings-section">
        <h3>Privacy</h3>
        <div className="form-group">
          <label>
            <input 
              type="checkbox"
              checked={privacySettings.shareData}
              onChange={(e) => updatePrivacy({ shareData: e.target.checked })}
            />
            Condividi dati anonimi per migliorare il servizio
          </label>
        </div>
        
        <div className="form-group">
          <label>Preferenze cookie</label>
          <select 
            value={privacySettings.cookiePreferences}
            onChange={(e) => updatePrivacy({ cookiePreferences: e.target.value })}
          >
            <option value="essential">Solo essenziali</option>
            <option value="analytics">Essenziali + Analytics</option>
            <option value="marketing">Essenziali + Analytics + Marketing</option>
            <option value="all">Tutti i cookie</option>
          </select>
        </div>
      </section>
      
      <div className="settings-actions">
        <button 
          className="reset-button"
          onClick={restoreDefaults}
        >
          Ripristina impostazioni predefinite
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;