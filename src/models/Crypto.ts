import mongoose, { Schema, Document } from 'mongoose';

// Interfaccia che definisce la struttura di un documento Crypto
export interface ICrypto extends Document {
  symbol: string;         // Simbolo della criptovaluta (es. BTC)
  name: string;           // Nome completo (es. Bitcoin)
  currentPrice: number;   // Prezzo attuale in USD
  priceChangePercentage24h?: number;  // Variazione % nelle ultime 24h
  marketCap?: number;     // Capitalizzazione di mercato
  lastUpdated: Date;      // Data dell'ultimo aggiornamento
}

// Schema che definisce la struttura e i vincoli del modello
const CryptoSchema: Schema = new Schema({
  symbol: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  currentPrice: { 
    type: Number, 
    required: true 
  },
  priceChangePercentage24h: { 
    type: Number 
  },
  marketCap: { 
    type: Number 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true  // Aggiunge automaticamente campi createdAt e updatedAt
});

// Esporta il modello
export default mongoose.model<ICrypto>('Crypto', CryptoSchema);