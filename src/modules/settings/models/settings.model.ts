// src/modules/settings/models/settings.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  user: string;
  defaultCurrency: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  apiKeys: {
    coinGecko?: string;
    // Altre API keys che potrebbero essere necessarie in futuro
  };
  notifications: {
    priceAlerts: boolean;
    portfolioSummary: boolean;
    dailyReport: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  dataRefreshRate: number; // in minuti
  autoRefresh: boolean;
  privacyMode: boolean;
  categories: string[]; // Categorie personalizzate per le transazioni
  createdAt: Date;
  updatedAt: Date;
}

// Definizione dello schema
const SettingsSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    unique: true
  },
  defaultCurrency: {
    type: String,
    default: 'EUR'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  language: {
    type: String,
    default: 'it'
  },
  apiKeys: {
    coinGecko: String
  },
  notifications: {
    priceAlerts: {
      type: Boolean,
      default: true
    },
    portfolioSummary: {
      type: Boolean,
      default: true
    },
    dailyReport: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },
  dataRefreshRate: {
    type: Number,
    default: 15 // 15 minuti di default
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  privacyMode: {
    type: Boolean,
    default: false
  },
  categories: {
    type: [String],
    default: ['Trading', 'Investimento a lungo termine', 'DeFi', 'Mining', 'Staking']
  }
}, {
  timestamps: true
});

// Crea e esporta il modello
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);