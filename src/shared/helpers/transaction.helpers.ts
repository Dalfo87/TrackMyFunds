// src/shared/helpers/transaction.helpers.ts

import { TransactionType, PaymentMethod } from '../types/transaction.types';
import { isStablecoin } from '../constants/crypto.constants';

/**
 * Funzione per ottenere il testo del tipo di transazione
 */
export function getTransactionTypeText(type: string): string {
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
}

/**
 * Funzione per ottenere il colore del tipo di transazione
 */
export function getTransactionTypeColor(
  type: string
): 'success' | 'error' | 'info' | 'secondary' | 'default' {
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
}

/**
 * Funzione per ottenere il nome del metodo di pagamento
 */
export function getPaymentMethodName(method?: string): string {
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
}

/**
 * Verifica se una transazione genera un profitto/perdita realizzato
 */
export function isRealizedProfitTransaction(
  type: string, 
  paymentMethod?: string, 
  paymentCurrency?: string
): boolean {
  if (type !== TransactionType.SELL) return false;
  if (paymentMethod !== PaymentMethod.CRYPTO) return false;
  if (!paymentCurrency) return false;
  
  return isStablecoin(paymentCurrency);
}