// client/src/utils/formatters.ts

/**
 * Formatta un valore numerico come valuta
 * @param value - Il valore da formattare
 * @param currency - La valuta (default: USD)
 * @param locale - Il locale da utilizzare (default: it-IT)
 * @returns Stringa formattata come valuta
 */
export const formatCurrency = (
    value: number | undefined | null,
    currency: string = 'USD',
    locale: string = 'it-IT'
  ): string => {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  };
  
  /**
   * Formatta una data in formato leggibile
   * @param dateString - La data da formattare (come stringa o oggetto Date)
   * @param locale - Il locale da utilizzare (default: it-IT)
   * @returns Stringa formattata come data
   */
  export const formatDate = (
    dateString: string | Date,
    locale: string = 'it-IT'
  ): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(locale);
  };
  
  /**
   * Formatta un valore numerico come percentuale
   * @param value - Il valore da formattare
   * @param decimals - Il numero di decimali (default: 2)
   * @returns Stringa formattata come percentuale
   */
  export const formatPercentage = (
    value: number | undefined | null, 
    decimals: number = 2
  ): string => {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    return `${value.toFixed(decimals)}%`;
  };
  
  /**
   * Formatta una quantità con un numero specifico di decimali
   * @param value - Il valore da formattare
   * @param decimals - Il numero di decimali (default: 3)
   * @returns Stringa rappresentante la quantità formattata
   */
  export const formatQuantity = (
    value: number | undefined | null, 
    decimals: number = 3
  ): string => {
    if (value === undefined || value === null) {
      value = 0;
    }
    
    return parseFloat(value.toFixed(decimals)).toString();
  };
  
  /**
   * Calcola l'equivalente in una valuta specifica
   * @param value - Il valore da convertire
   * @param exchangeRate - Il tasso di cambio da applicare
   * @param currency - La valuta di destinazione (default: EUR)
   * @param locale - Il locale da utilizzare (default: it-IT)
   * @returns Stringa formattata come valuta
   */
  export const calculateCurrencyEquivalent = (
    value: number | undefined | null,
    exchangeRate: number,
    currency: string = 'EUR',
    locale: string = 'it-IT'
  ): string => {
    if (value === undefined || value === null || exchangeRate === 0) {
      return formatCurrency(0, currency, locale);
    }
    
    const convertedValue = value * exchangeRate;
    return formatCurrency(convertedValue, currency, locale);
  };