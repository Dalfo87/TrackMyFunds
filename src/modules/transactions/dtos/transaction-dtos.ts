// src/modules/transactions/dtos/create-transaction.dto.ts
export interface CreateTransactionDto {
    cryptoSymbol: string;
    type: 'buy' | 'sell' | 'airdrop' | 'farming';
    quantity: number;
    pricePerUnit: number;
    totalAmount?: number;
    fees?: number;
    notes?: string;
    date?: Date;
    category?: string;
    paymentMethod?: string;
    paymentCurrency?: string;
  }
  
  // src/modules/transactions/dtos/update-transaction.dto.ts
  export interface UpdateTransactionDto {
    cryptoSymbol?: string;
    type?: 'buy' | 'sell' | 'airdrop' | 'farming';
    quantity?: number;
    pricePerUnit?: number;
    totalAmount?: number;
    fees?: number;
    notes?: string;
    date?: Date;
    category?: string;
    paymentMethod?: string;
    paymentCurrency?: string;
  }
  
  // src/modules/transactions/dtos/airdrop.dto.ts
  export interface AirdropDto {
    cryptoSymbol: string;
    quantity: number;
    date?: Date;
    notes?: string;
    category?: string;
  }
  
  // src/modules/transactions/dtos/farming.dto.ts
  export interface FarmingDto {
    cryptoSymbol: string;
    quantity: number;
    date?: Date;
    notes?: string;
    category?: string;
    paymentCurrency?: string; // La crypto di origine del farming/staking
  }
  
  // src/modules/transactions/dtos/filter-transactions.dto.ts
  export interface FilterTransactionsDto {
    type?: string;
    cryptoSymbol?: string;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    paymentMethod?: string;
  }