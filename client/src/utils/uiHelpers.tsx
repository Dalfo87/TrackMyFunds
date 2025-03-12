// client/src/utils/uiHelpers.tsx
import React from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SpaIcon from '@mui/icons-material/Spa'; // Icona per farming/staking

// Enum per i tipi di transazione
export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  AIRDROP = 'airdrop',
  FARMING = 'farming'
}

// Enum per i metodi di pagamento
export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

/**
 * Restituisce l'icona del metodo di pagamento
 * @param method - Il metodo di pagamento
 * @param props - Proprietà aggiuntive da passare all'icona
 * @returns Componente icona
 */
export const getPaymentMethodIcon = (method?: string, props = {}) => {
  if (!method) return null;
  
  switch (method) {
    case PaymentMethod.BANK_TRANSFER:
      return <AccountBalanceIcon {...props} />;
    case PaymentMethod.CREDIT_CARD:
      return <CreditCardIcon {...props} />;
    case PaymentMethod.DEBIT_CARD:
      return <PaymentIcon {...props} />;
    case PaymentMethod.CRYPTO:
      return <CurrencyExchangeIcon {...props} />;
    case PaymentMethod.OTHER:
    default:
      return <HelpOutlineIcon {...props} />;
  }
};

/**
 * Restituisce il nome del metodo di pagamento
 * @param method - Il metodo di pagamento
 * @returns Stringa con il nome leggibile
 */
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

/**
 * Restituisce il colore per il tipo di transazione
 * @param type - Il tipo di transazione
 * @returns Stringa con il colore Material UI
 */
export const getTransactionTypeColor = (type?: string): 'success' | 'error' | 'info' | 'secondary' | 'default' => {
  if (!type) return 'default';
  
  switch (type) {
    case TransactionType.BUY:
      return 'success';
    case TransactionType.SELL:
      return 'error';
    case TransactionType.AIRDROP:
      return 'info';
    case TransactionType.FARMING:
      return 'secondary'; // Colore viola per il farming
    default:
      return 'default';
  }
};

/**
 * Restituisce il testo del tipo di transazione
 * @param type - Il tipo di transazione
 * @returns Stringa con il nome leggibile
 */
export const getTransactionTypeText = (type?: string): string => {
  if (!type) return '-';
  
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
      return type;
  }
};

/**
 * Restituisce l'icona appropriata per profit/loss
 * @param value - Il valore del profit/loss
 * @param props - Proprietà aggiuntive da passare all'icona
 * @returns Componente icona
 */
export const getProfitLossIcon = (value: number, props = {}) => {
  return value >= 0 
    ? <TrendingUpIcon color="success" {...props} />
    : <TrendingDownIcon color="error" {...props} />;
};

/**
 * Restituisce il colore appropriato per profit/loss
 * @param value - Il valore del profit/loss
 * @returns Stringa con il colore Material UI
 */
export const getProfitLossColor = (value: number): string => {
  return value >= 0 ? 'success.main' : 'error.main';
};

/**
 * Restituisce l'icona per il tipo di transazione
 * @param type - Il tipo di transazione
 * @param props - Proprietà aggiuntive da passare all'icona
 * @returns Componente icona
 */
export const getTransactionTypeIcon = (type?: string, props = {}) => {
  if (!type) return null;
  
  switch (type) {
    case TransactionType.BUY:
      return <TrendingUpIcon color="success" {...props} />;
    case TransactionType.SELL:
      return <TrendingDownIcon color="error" {...props} />;
    case TransactionType.FARMING:
      return <SpaIcon color="secondary" {...props} />; // Icona specifica per farming
    case TransactionType.AIRDROP:
      return <CurrencyExchangeIcon color="info" {...props} />;
    default:
      return <HelpOutlineIcon {...props} />;
  }
};