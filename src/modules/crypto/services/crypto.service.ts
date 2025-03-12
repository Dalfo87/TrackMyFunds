// src/modules/crypto/services/crypto.service.ts
import { CryptoRepository } from '../repositories/crypto.repository';
import { CoinGeckoService } from './coinGecko.service';
import { CreateCryptoDto } from '../dtos/create-crypto.dto';
import { UpdateCryptoDto } from '../dtos/update-crypto.dto';
import { SearchCryptoDto } from '../dtos/search-crypto.dto';
import { ICrypto } from '../models/crypto.model';
import { Logger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/utils/errorHandler';

export class CryptoService {
  constructor(
    private cryptoRepository: CryptoRepository,
    private coinGeckoService: CoinGeckoService
  ) {}
  
  /**
   * Ottiene tutte le criptovalute
   */
  async getAllCryptos(): Promise<ICrypto[]> {
    try {
      return await this.cryptoRepository.findAll();
    } catch (error) {
      Logger.error('Errore nel recupero di tutte le criptovalute:', error);
      throw new ApiError(500, 'Errore nel recupero delle criptovalute');
    }
  }
  
  /**
   * Ottiene una criptovaluta per simbolo
   */
  async getCryptoBySymbol(symbol: string): Promise<ICrypto> {
    try {
      const crypto = await this.cryptoRepository.findBySymbol(symbol);
      
      if (!crypto) {
        throw new ApiError(404, `Criptovaluta con simbolo ${symbol} non trovata`);
      }
      
      return crypto;
    } catch (error) {
      Logger.error(`Errore nel recupero della criptovaluta con simbolo ${symbol}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, `Errore nel recupero della criptovaluta ${symbol}`);
    }
  }
  
  /**
   * Crea una nuova criptovaluta
   */
  async createCrypto(createDto: CreateCryptoDto): Promise<ICrypto> {
    try {
      // Verifica se la criptovaluta esiste già
      const existing = await this.cryptoRepository.findBySymbol(createDto.symbol);
      
      if (existing) {
        throw new ApiError(400, `La criptovaluta con simbolo ${createDto.symbol} esiste già`);
      }
      
      return await this.cryptoRepository.create({
        ...createDto,
        symbol: createDto.symbol.toUpperCase(),
        lastUpdated: new Date()
      });
    } catch (error) {
      Logger.error('Errore nella creazione della criptovaluta:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nella creazione della criptovaluta');
    }
  }
  
  /**
   * Aggiorna una criptovaluta esistente
   */
  async updateCrypto(symbol: string, updateDto: UpdateCryptoDto): Promise<ICrypto> {
    try {
      const crypto = await this.cryptoRepository.findBySymbol(symbol);
      
      if (!crypto) {
        throw new ApiError(404, `Criptovaluta con simbolo ${symbol} non trovata`);
      }
      
      return await this.cryptoRepository.update(crypto.id, {
        ...updateDto,
        lastUpdated: new Date()
      });
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento della criptovaluta ${symbol}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, `Errore nell'aggiornamento della criptovaluta ${symbol}`);
    }
  }
  
  /**
   * Elimina una criptovaluta
   */
  async deleteCrypto(symbol: string): Promise<boolean> {
    try {
      const crypto = await this.cryptoRepository.findBySymbol(symbol);
      
      if (!crypto) {
        throw new ApiError(404, `Criptovaluta con simbolo ${symbol} non trovata`);
      }
      
      return await this.cryptoRepository.delete(crypto.id);
    } catch (error) {
      Logger.error(`Errore nell'eliminazione della criptovaluta ${symbol}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, `Errore nell'eliminazione della criptovaluta ${symbol}`);
    }
  }
  
  /**
   * Cerca criptovalute per nome o simbolo
   */
  async searchCryptos(searchDto: SearchCryptoDto): Promise<any> {
    try {
      const { query, limit = 10 } = searchDto;
      
      if (!query || query.trim().length === 0) {
        throw new ApiError(400, 'La query di ricerca non può essere vuota');
      }
      
      // Prima cerchiamo nel nostro database
      const localResults = await this.cryptoRepository.searchCryptos(query);
      
      // Se abbiamo abbastanza risultati locali, restituiamoli
      if (localResults.length >= limit) {
        return {
          source: 'local',
          results: localResults.slice(0, limit)
        };
      }
      
      // Altrimenti, cerchiamo anche su CoinGecko
      const apiResults = await this.coinGeckoService.searchCoins(query, limit);
      
      return {
        source: localResults.length > 0 ? 'combined' : 'api',
        results: [...localResults, ...apiResults].slice(0, limit)
      };
    } catch (error) {
      Logger.error('Errore nella ricerca delle criptovalute:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nella ricerca delle criptovalute');
    }
  }
  
  /**
   * Aggiorna i prezzi di tutte le criptovalute dal servizio CoinGecko
   */
  async updateAllPrices(): Promise<{ updated: number; added: number }> {
    try {
      Logger.info('Inizio aggiornamento prezzi di tutte le criptovalute');
      
      // Ottieni i dati aggiornati da CoinGecko
      const topCoins = await this.coinGeckoService.getTopCoins(100);
      
      let updated = 0;
      let added = 0;
      
      // Aggiorna o crea ogni criptovaluta
      for (const coin of topCoins) {
        try {
          const existing = await this.cryptoRepository.findBySymbol(coin.symbol);
          
          if (existing) {
            // Aggiorna la criptovaluta esistente
            await this.cryptoRepository.update(existing.id, {
              currentPrice: coin.currentPrice,
              priceChangePercentage24h: coin.priceChangePercentage24h,
              marketCap: coin.marketCap,
              lastUpdated: new Date()
            });
            updated++;
          } else {
            // Crea una nuova criptovaluta
            await this.cryptoRepository.create({
              symbol: coin.symbol,
              name: coin.name,
              currentPrice: coin.currentPrice,
              priceChangePercentage24h: coin.priceChangePercentage24h,
              marketCap: coin.marketCap,
              lastUpdated: new Date()
            });
            added++;
          }
        } catch (coinError) {
          Logger.error(`Errore nell'aggiornamento/creazione di ${coin.symbol}:`, coinError);
          // Continua con la prossima criptovaluta
        }
      }
      
      Logger.info(`Completato aggiornamento prezzi: ${updated} aggiornate, ${added} aggiunte`);
      return { updated, added };
    } catch (error) {
      Logger.error('Errore nell\'aggiornamento dei prezzi delle criptovalute:', error);
      throw new ApiError(500, 'Errore nell\'aggiornamento dei prezzi delle criptovalute');
    }
  }
}