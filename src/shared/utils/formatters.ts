// src/shared/utils/formatters.ts

/**
 * Formatta un valore numerico come valuta
 */
export function formatCurrency(
    value: number | undefined | null,
    currency: string = 'USD',
    locale: string = 'it-IT'
  ): string {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(value);
  }
  
  /**
   * Formatta una data in formato leggibile
   */
  export function formatDate(
    dateString: string | Date,
    locale: string = 'it-IT'
  ): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(locale);
  }
  
  /**
   * Formatta un valore numerico come percentuale
   */
  export function formatPercentage(
    value: number | undefined | null, 
    decimals: number = 2
  ): string {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    return `${value.toFixed(decimals)}%`;
  }
  
  /**
   * Formatta una quantità con un numero specifico di decimali
   */
  export function formatQuantity(
    value: number | undefined | null, 
    decimals: number = 3
  ): string {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(value * factor) / factor;
    return rounded.toString();
  }
  
  /**
   * Calcola l'equivalente in una valuta specifica
   */
  export function calculateCurrencyEquivalent(
    value: number | undefined | null,
    exchangeRate: number,
    currency: string = 'EUR',
    locale: string = 'it-IT'
  ): string {
    if (value === undefined || value === null || exchangeRate === 0) {
      return formatCurrency(0, currency, locale);
    }
    
    const convertedValue = value * exchangeRate;
    return formatCurrency(convertedValue, currency, locale);
  }