// src/components/settings/LanguageSelector.js
import React from 'react';
import { useSettings } from '../../hooks/useSettings';

function LanguageSelector() {
  const { language, setLanguage } = useSettings();
  
  return (
    <div className="language-selector">
      <div className="form-group">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="it">Italiano</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
  );
}

export default LanguageSelector;