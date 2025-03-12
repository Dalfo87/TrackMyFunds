// src/modules/portfolio/models/portfolio.model.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IPortfolioAsset {
  cryptoSymbol: string;    // Simbolo della criptovaluta
  quantity: number;        // Quantità totale posseduta
  averagePrice: number;    // Prezzo medio di acquisto
  category?: string;       // Categoria dell'investimento
  type?: string;           // Tipo di asset (es. "crypto", "stablecoin")
}

export interface IPortfolio extends Document {
  user: string;            // ID dell'utente
  assets: IPortfolioAsset[];  // Array di asset posseduti
  lastUpdated: Date;       // Data dell'ultimo aggiornamento
}

const PortfolioAssetSchema: Schema = new Schema({
  cryptoSymbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  }
});

const PortfolioSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    default: 'default_user'  // Temporaneo, finché non implementiamo l'autenticazione
  },
  assets: [PortfolioAssetSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);