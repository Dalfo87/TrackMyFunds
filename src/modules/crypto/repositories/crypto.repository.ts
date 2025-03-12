// src/modules/crypto/repositories/crypto.repository.ts
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { Crypto, ICrypto } from '../models/crypto.model';

export class CryptoRepository extends BaseRepository<ICrypto> {
  constructor() {
    super(Crypto);
  }

  async findBySymbol(symbol: string): Promise<ICrypto | null> {
    return Crypto.findOne({ symbol: symbol.toUpperCase() }).exec();
  }

  async searchCryptos(query: string): Promise<ICrypto[]> {
    return Crypto.find({
      $or: [
        { symbol: new RegExp(query, 'i') },
        { name: new RegExp(query, 'i') }
      ]
    }).exec();
  }

  async updatePrices(cryptos: Array<{ symbol: string; price: number; change24h?: number; marketCap?: number }>): Promise<number> {
    let updated = 0;
    
    for (const crypto of cryptos) {
      const result = await Crypto.updateOne(
        { symbol: crypto.symbol },
        { 
          currentPrice: crypto.price,
          priceChangePercentage24h: crypto.change24h,
          marketCap: crypto.marketCap,
          lastUpdated: new Date()
        }
      );
      
      if (result.modifiedCount > 0) {
        updated++;
      }
    }
    
    return updated;
  }
}