// src/modules/crypto/dtos/crypto.dtos.ts
export interface SearchCryptoDto {
  query: string;
  limit?: number;
}

export interface UpdateCryptoDto {
  currentPrice: number;
  priceChangePercentage24h?: number;
  marketCap?: number;
}

export interface CreateCryptoDto {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChangePercentage24h?: number;
  marketCap?: number;
}