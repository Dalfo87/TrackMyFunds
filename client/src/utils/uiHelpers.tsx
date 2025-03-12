// Modifica al file src/utils/uiHelpers.tsx

// Importa invece di ridefinire
import { 
  TransactionType, 
  PaymentMethod, 
  getTransactionTypeText,
  getTransactionTypeColor,
  getPaymentMethodName
} from './transactionTypes';

import React from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SpaIcon from '@mui/icons-material/Spa'; // Icona per farming/staking

// Ri-esporta gli elementi importati
export { TransactionType, PaymentMethod, getTransactionTypeText, getTransactionTypeColor, getPaymentMethodName };

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