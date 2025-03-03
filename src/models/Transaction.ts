import mongoose, { Schema, Document } from 'mongoose';

// Definiamo i tipi di transazione possibili
export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  AIRDROP = 'airdrop'  // Nuovo tipo di transazione
}

// Interfaccia per il documento Transaction
export interface ITransaction extends Document {
  user: string;               // ID dell'utente (per uso futuro con autenticazione)
  cryptoSymbol: string;       // Simbolo della criptovaluta (es. BTC)
  type: TransactionType;      // Tipo: acquisto o vendita
  quantity: number;           // Quantità acquistata/venduta
  pricePerUnit: number;       // Prezzo per unità al momento della transazione
  totalAmount: number;        // Importo totale della transazione
  fees?: number;              // Commissioni (opzionale)
  notes?: string;             // Note aggiuntive
  date: Date;                 // Data della transazione
  category?: string;          // Categoria (es. alto rischio, stabile, lungo termine)
}

const TransactionSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    default: 'default_user'  // Temporaneo, finché non implementiamo l'autenticazione
  },
  cryptoSymbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Aggiunta nel modello TransactionSchema, nella sezione pre-save

// Middleware pre-save per calcolare automaticamente il totale
TransactionSchema.pre('save', function(next) {
  // Se totalAmount non è specificato e type non è AIRDROP, lo calcoliamo
  if (!this.totalAmount && this.quantity && this.pricePerUnit && this.type !== TransactionType.AIRDROP) {
    this.totalAmount = Number(this.quantity) * Number(this.pricePerUnit);
  }
  
  // Per gli airdrop, impostiamo automaticamente pricePerUnit e totalAmount a 0
  if (this.type === TransactionType.AIRDROP) {
    this.pricePerUnit = 0;
    this.totalAmount = 0;
  }
  
  next();
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);