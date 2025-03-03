// src/controllers/cryptoController.ts
import { NextFunction, Request, Response } from 'express';
import Crypto from '../models/Crypto';
import CoinGeckoService from '../services/coinGeckoService';

/**
 * Controller per gestire le operazioni relative alle criptovalute
 */
export class CryptoController {
  /**
   * Aggiorna le informazioni di tutte le criptovalute nel database
   */
  static async updateAllCryptoPrices(req: Request, res: Response): Promise<void> {
    try {
      // Recupera le top 100 criptovalute da CoinGecko
      const topCoins = await CoinGeckoService.getTopCoins(100);
      
      let updated = 0;
      let added = 0;
      
      // Aggiorna o aggiunge ciascuna criptovaluta
      for (const coin of topCoins) {
        const existingCrypto = await Crypto.findOne({ symbol: coin.symbol });
        
        if (existingCrypto) {
          // Aggiorna la criptovaluta esistente
          await Crypto.updateOne(
            { symbol: coin.symbol },
            { 
              currentPrice: coin.currentPrice,
              priceChangePercentage24h: coin.priceChangePercentage24h,
              marketCap: coin.marketCap,
              lastUpdated: new Date()
            }
          );
          updated++;
        } else {
          // Aggiungi una nuova criptovaluta
          const newCrypto = new Crypto({
            symbol: coin.symbol,
            name: coin.name,
            currentPrice: coin.currentPrice,
            priceChangePercentage24h: coin.priceChangePercentage24h,
            marketCap: coin.marketCap,
            lastUpdated: new Date()
          });
          
          await newCrypto.save();
          added++;
        }
      }
      
      res.json({
        success: true,
        message: `Prezzi aggiornati con successo: ${updated} aggiornati, ${added} aggiunti`
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dei prezzi:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento dei prezzi delle criptovalute',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Aggiorna le informazioni di una specifica criptovaluta tramite ID CoinGecko
   */
  static async updateCryptoByCoinGeckoId(req: Request, res: Response): Promise<void> {
    try {
      const { coinGeckoId } = req.params;
      
      // Recupera i dati aggiornati da CoinGecko
      const coinData = await CoinGeckoService.getCoinPrice(coinGeckoId);
      
      // Cerca la criptovaluta nel database
      const existingCrypto = await Crypto.findOne({ symbol: coinData.symbol });
      
      if (existingCrypto) {
        // Aggiorna la criptovaluta esistente
        await Crypto.updateOne(
          { symbol: coinData.symbol },
          { 
            currentPrice: coinData.currentPrice,
            priceChangePercentage24h: coinData.priceChangePercentage24h,
            marketCap: coinData.marketCap,
            lastUpdated: new Date()
          }
        );
        
        res.json({
          success: true,
          message: `Prezzo di ${coinData.name} (${coinData.symbol}) aggiornato con successo`
        });
      } else {
        // Aggiungi una nuova criptovaluta
        const newCrypto = new Crypto({
          symbol: coinData.symbol,
          name: coinData.name,
          currentPrice: coinData.currentPrice,
          priceChangePercentage24h: coinData.priceChangePercentage24h,
          marketCap: coinData.marketCap,
          lastUpdated: new Date()
        });
        
        await newCrypto.save();
        
        res.json({
          success: true,
          message: `${coinData.name} (${coinData.symbol}) aggiunto con successo`
        });
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento della criptovaluta:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento della criptovaluta',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Cerca una criptovaluta per nome o simbolo
   */
  static async searchCrypto(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parametro di ricerca mancante o non valido'
        });
        return;
      }
      
      // Cerca nella collezione locale
      const localResults = await Crypto.find({
        $or: [
          { symbol: new RegExp(query, 'i') },
          { name: new RegExp(query, 'i') }
        ]
      });
      
      // Se la ricerca locale non produce risultati, cerca tramite CoinGecko
      if (localResults.length === 0) {
        const apiResults = await CoinGeckoService.searchCoins(query);
        
        res.json({
          success: true,
          source: 'coingecko',
          results: apiResults.slice(0, 10)
        });
      } else {
        // Ritorna i risultati locali
        res.json({
          success: true,
          source: 'local',
          results: localResults
        });
      }
    } catch (error) {
      console.error('Errore nella ricerca delle criptovalute:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nella ricerca delle criptovalute',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export default CryptoController;