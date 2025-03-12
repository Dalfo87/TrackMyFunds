// src/modules/crypto/models/crypto.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICrypto extends Document {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChangePercentage24h?: number;
  marketCap?: number;
  lastUpdated: Date;
}

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
  timestamps: true
});

export const Crypto = mongoose.model<ICrypto>('Crypto', CryptoSchema);