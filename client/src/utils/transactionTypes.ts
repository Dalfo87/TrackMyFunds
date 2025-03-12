// client/src/utils/transactionTypes.ts

// Definizione dei tipi di transazione
export enum TransactionType {
    BUY = 'buy',
    SELL = 'sell',
    AIRDROP = 'airdrop',
    FARMING = 'farming'
  }
  
  // Definizione dei metodi di pagamento
  export enum PaymentMethod {
    BANK_TRANSFER = 'bank_transfer',
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    CRYPTO = 'crypto',
    OTHER = 'other'
  }
  
  // Lista delle stablecoin riconosciute dal sistema
  export const STABLECOINS = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FRAX'];
  
  // Funzione per verificare se una valuta è una stablecoin
  export const isStablecoin = (currency: string): boolean => {
    return STABLECOINS.includes(currency.toUpperCase());
  };
  
  // Funzione per ottenere il testo del tipo di transazione
  export const getTransactionTypeText = (type: string): string => {
    switch (type) {
      case TransactionType.BUY:
        return 'Acquisto';
      case TransactionType.SELL:
        return 'Vendita';
      case TransactionType.AIRDROP:
        return 'Airdrop';
      case TransactionType.FARMING:
        return 'Farming';
      default:
        return type || '-';
    }
  };
  
  // Funzione per ottenere il colore del tipo di transazione
  export const getTransactionTypeColor = (
    type: string
  ): 'success' | 'error' | 'info' | 'secondary' | 'default' => {
    switch (type) {
      case TransactionType.BUY:
        return 'success';
      case TransactionType.SELL:
        return 'error';
      case TransactionType.AIRDROP:
        return 'info';
      case TransactionType.FARMING:
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Funzione per ottenere il nome del metodo di pagamento
  export const getPaymentMethodName = (method?: string): string => {
    if (!method) return '-';
    
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return 'Bonifico Bancario';
      case PaymentMethod.CREDIT_CARD:
        return 'Carta di Credito';
      case PaymentMethod.DEBIT_CARD:
        return 'Carta di Debito';
      case PaymentMethod.CRYPTO:
        return 'Cryptocurrency/Stablecoin';
      case PaymentMethod.OTHER:
        return 'Altro';
      case 'undefined':
        return 'Non specificato';
      default:
        return method;
    }
  };
  
  // Funzione per ottenere la descrizione del metodo di pagamento in base al tipo di transazione
  export const getPaymentMethodDescription = (method: string, type: string): string => {
    if (type === TransactionType.BUY) {
      return `Pagato con ${getPaymentMethodName(method)}`;
    } 
    else if (type === TransactionType.SELL) {
      return `Ricevuto su ${getPaymentMethodName(method)}`;
    } 
    else if (type === TransactionType.FARMING) {
      return 'Guadagnato tramite staking/farming';
    } 
    else {
      return getPaymentMethodName(method);
    }
  };
  
  // Funzione per verificare se una transazione genera un profitto/perdita realizzato
  export const isRealizedProfitTransaction = (
    type: string, 
    paymentMethod?: string, 
    paymentCurrency?: string
  ): boolean => {
    if (type !== TransactionType.SELL) return false;
    if (paymentMethod !== PaymentMethod.CRYPTO) return false;
    if (!paymentCurrency) return false;
    
    return isStablecoin(paymentCurrency);
  };
  
  // Funzione per ottenere una descrizione riassuntiva della transazione
  export const getTransactionSummary = (transaction: any): string => {
    switch (transaction.type) {
      case TransactionType.BUY:
        return `Acquisto di ${transaction.quantity} ${transaction.cryptoSymbol} a ${transaction.pricePerUnit} USD per unità`;
      case TransactionType.SELL:
        return `Vendita di ${transaction.quantity} ${transaction.cryptoSymbol} a ${transaction.pricePerUnit} USD per unità`;
      case TransactionType.AIRDROP:
        return `Airdrop di ${transaction.quantity} ${transaction.cryptoSymbol}`;
      case TransactionType.FARMING:
        return `Farming di ${transaction.quantity} ${transaction.cryptoSymbol} da ${transaction.paymentCurrency || 'staking'}`;
      default:
        return `Transazione di ${transaction.quantity} ${transaction.cryptoSymbol}`;
    }
  };