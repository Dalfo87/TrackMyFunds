// src/modules/crypto/dtos/search-crypto.dto.ts
export interface SearchCryptoDto {
    query: string;
    limit?: number;
  }
  
  // src/modules/crypto/dtos/update-crypto.dto.ts
  export interface UpdateCryptoDto {
    currentPrice: number;
    priceChangePercentage24h?: number;
    marketCap?: number;
  }
  
  // src/modules/crypto/dtos/create-crypto.dto.ts
  export interface CreateCryptoDto {
    symbol: string;
    name: string;
    currentPrice: number;
    priceChangePercentage24h?: number;
    marketCap?: number;
  }