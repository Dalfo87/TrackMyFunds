// src/components/settings/ThemeSelector.js
import React from 'react';
import { useSettings } from '../../hooks/useSettings';

function ThemeSelector() {
  const { theme, setTheme } = useSettings();
  
  return (
    <div className="theme-selector">
      <h4>Tema</h4>
      <div className="form-group">
        <select 
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">Chiaro</option>
          <option value="dark">Scuro</option>
          <option value="system">Automatico (sistema)</option>
        </select>
      </div>
    </div>
  );
}

export default ThemeSelector;