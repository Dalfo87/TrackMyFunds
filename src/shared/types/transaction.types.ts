// src/shared/types/transaction.types.ts

export enum TransactionType {
    BUY = 'buy',
    SELL = 'sell',
    AIRDROP = 'airdrop',
    FARMING = 'farming'
  }
  
  export enum PaymentMethod {
    BANK_TRANSFER = 'bank_transfer',
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    CRYPTO = 'crypto',
    OTHER = 'other'
  }
  
  export interface TransactionBase {
    id?: string;
    user: string;
    cryptoSymbol: string;
    type: TransactionType;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    date: Date;
    notes?: string;
    category?: string;
    paymentMethod?: PaymentMethod;
    paymentCurrency?: string;
  }