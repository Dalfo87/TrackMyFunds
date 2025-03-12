// src/modules/realizedprofit/models/realizedProfit.model.ts
import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaccia che definisce un profitto/perdita realizzato
 * Registra in modo permanente le vendite di crypto in stablecoin o fiat
 */
export interface IRealizedProfit extends Document {
  user: string;                 // ID utente
  sourceCryptoSymbol: string;   // Simbolo della crypto venduta
  targetCurrency: string;       // Valuta/crypto ricevuta
  isStablecoin: boolean;        // Indica se la valuta target è una stablecoin
  soldQuantity: number;         // Quantità venduta
  averageBuyPrice: number;      // Prezzo medio di acquisto
  sellPrice: number;            // Prezzo di vendita
  costBasis: number;            // Base di costo totale (quantità * prezzo medio)
  proceedsAmount: number;       // Importo ricevuto dalla vendita
  realizedProfitLoss: number;   // Profitto/perdita realizzato
  profitLossPercentage: number; // Percentuale di profitto/perdita
  originalTransactionId: mongoose.Types.ObjectId; // ID della transazione di vendita originale
  date: Date;                   // Data della vendita
  category?: string;            // Categoria per raggruppamenti
  notes?: string;               // Note opzionali
}

const RealizedProfitSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    default: 'default_user'  // Temporaneo, finché non si implementa l'autenticazione
  },
  sourceCryptoSymbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  targetCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  isStablecoin: {
    type: Boolean,
    required: true,
    default: false
  },
  soldQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  averageBuyPrice: {
    type: Number, 
    required: true,
    min: 0
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0
  },
  costBasis: {
    type: Number,
    required: true
  },
  proceedsAmount: {
    type: Number,
    required: true
  },
  realizedProfitLoss: {
    type: Number,
    required: true
  },
  profitLossPercentage: {
    type: Number,
    required: true
  },
  originalTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true  // Aggiunge automaticamente createdAt e updatedAt
});

// Indici per migliorare le prestazioni delle query
RealizedProfitSchema.index({ user: 1, date: -1 });
RealizedProfitSchema.index({ user: 1, sourceCryptoSymbol: 1 });
RealizedProfitSchema.index({ user: 1, targetCurrency: 1 });

export const RealizedProfit = mongoose.model<IRealizedProfit>('RealizedProfit', RealizedProfitSchema);