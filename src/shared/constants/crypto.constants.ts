// src/shared/constants/crypto.constants.ts

/**
 * Lista delle stablecoin riconosciute dal sistema
 */
export const STABLECOINS = [
    'USDT', 'USDC', 'DAI', 'BUSD', 
    'TUSD', 'USDP', 'GUSD', 'FRAX'
  ];
  
  /**
   * Verifica se una valuta è una stablecoin
   */
  export function isStablecoin(currency: string): boolean {
    return STABLECOINS.includes(currency.toUpperCase());
  }