// src/models/Settings.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  user: string;                // ID dell'utente (per uso futuro con autenticazione)
  coingeckoApiKey?: string;    // Chiave API di CoinGecko
  lastCryptoUpdate?: Date;     // Data dell'ultimo aggiornamento delle criptovalute
  createdAt: Date;             // Data di creazione del documento
  updatedAt: Date;             // Data dell'ultimo aggiornamento
}

const SettingsSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    default: 'default_user',  // Default utente finché non implementiamo l'autenticazione
    unique: true              // Un solo documento di impostazioni per utente
  },
  coingeckoApiKey: {
    type: String,
    default: '',
    trim: true
  },
  lastCryptoUpdate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Aggiunge automaticamente campi createdAt e updatedAt
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);