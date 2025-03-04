// src/controllers/cryptoController.ts
import { NextFunction, Request, Response } from 'express';
import Crypto from '../models/Crypto';
import Settings from '../models/Settings';
import CoinGeckoService from '../services/coinGeckoService';
import logger from '../utils/logger';

/**
 * Controller per gestire le operazioni relative alle criptovalute
 */
export class CryptoController {
  
  /**
   * Aggiorna le informazioni di tutte le criptovalute nel database
   */
  static async updateAllCryptoPrices(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Avvio aggiornamento prezzi delle top 100 criptovalute...');
      logger.info('API Key configurata: ' + (process.env.COINGECKO_API_KEY ? 'Sì (presente)' : 'No (assente)'));
      
      // Recupera le top 100 criptovalute da CoinGecko
      const topCoins = await CoinGeckoService.getTopCoins(100);
      logger.info(`Recuperate ${topCoins.length} criptovalute da CoinGecko`);
      
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
      
      logger.info(`Aggiornamento completato: ${updated} aggiornate, ${added} aggiunte`);
      
      res.json({
        success: true,
        message: `Prezzi aggiornati con successo: ${updated} aggiornati, ${added} aggiunti`
      });
    } catch (error) {
      logger.error('Errore nell\'aggiornamento dei prezzi:', error);
      
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento dei prezzi delle criptovalute',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

// /**
//  * Aggiorna solo i prezzi delle criptovalute presenti nel portafoglio dell'utente
//  */
// static async updatePortfolioCryptoPrices(req: Request, res: Response): Promise<void> {
//   try {
//     logger.info('Avvio aggiornamento prezzi delle criptovalute nel portafoglio...');
    
//     // Recupera il portafoglio dell'utente
//     const portfolio = await Portfolio.findOne({ user: 'default_user' });
    
//     if (!portfolio || portfolio.assets.length === 0) {
//       logger.info('Nessuna criptovaluta nel portafoglio da aggiornare');
//       res.json({
//         success: true,
//         message: 'Nessuna criptovaluta nel portafoglio da aggiornare'
//       });
//       return;
//     }
    
//     // Estrai i simboli delle criptovalute dal portafoglio
//     const portfolioSymbols = portfolio.assets.map(asset => asset.cryptoSymbol);
//     logger.info(`Criptovalute nel portafoglio: ${portfolioSymbols.join(', ')}`);
    
//     // Recupera le criptovalute dal database
//     const cryptosToUpdate = await Crypto.find({ symbol: { $in: portfolioSymbols } });
    
//     if (cryptosToUpdate.length === 0) {
//       logger.info('Nessuna criptovaluta trovata nel database da aggiornare');
//       res.json({
//         success: true,
//         message: 'Nessuna criptovaluta trovata nel database da aggiornare'
//       });
//       return;
//     }
    
//     logger.info(`Trovate ${cryptosToUpdate.length} criptovalute da aggiornare`);
    
//     // Prepara un array di richieste per recuperare i prezzi aggiornati
//     const topCoins = await CoinGeckoService.getTopCoins(250); // Recupera le prime 250 per avere più probabilità di trovare le nostre
//     const topCoinsMap = new Map(topCoins.map(coin => [coin.symbol.toUpperCase(), coin]));
    
//     let updated = 0;
//     let errors = 0;
    
//     // Aggiorna ogni criptovaluta
//     for (const crypto of cryptosToUpdate) {
//       try {
//         const coinData = topCoinsMap.get(crypto.symbol.toUpperCase());
        
//         if (coinData) {
//           await Crypto.updateOne(
//             { symbol: crypto.symbol },
//             { 
//               currentPrice: coinData.currentPrice ?? 0,
//               priceChangePercentage24h: coinData.priceChangePercentage24h,
//               marketCap: coinData.marketCap,
//               lastUpdated: new Date()
//             }
//           );
          
//           updated++;
//           logger.info(`Aggiornata ${crypto.symbol} a $${coinData.currentPrice}`);
//         } else {
//           // Se non troviamo la cripto nell'elenco delle top, proviamo a recuperarla direttamente
//           try {
//             // Poiché non abbiamo l'ID CoinGecko ma solo il simbolo, questa è una soluzione semplificata
//             // In un'implementazione completa, dovresti mappare i simboli agli ID CoinGecko
//             logger.info(`${crypto.symbol} non trovata nella top 250, provo ricerca diretta...`);
//             const searchResults = await CoinGeckoService.searchCoins(crypto.symbol);
            
//             if (searchResults.length > 0) {
//               // Cerchiamo la corrispondenza esatta per simbolo
//               const exactMatch = searchResults.find(result => 
//                 result.symbol.toUpperCase() === crypto.symbol.toUpperCase()
//               );
              
//               if (exactMatch) {
//                 const coinDetails = await CoinGeckoService.getCoinPrice(exactMatch.id);
//                 await Crypto.updateOne(
//                   { symbol: crypto.symbol },
//                   { 
//                     currentPrice: coinDetails.currentPrice ?? 0,
//                     priceChangePercentage24h: coinDetails.priceChangePercentage24h,
//                     marketCap: coinDetails.marketCap,
//                     lastUpdated: new Date()
//                   }
//                 );
//                 updated++;
//                 logger.info(`Aggiornata ${crypto.symbol} a $${coinDetails.currentPrice} (via ricerca)`);
//               } else {
//                 logger.warn(`Nessuna corrispondenza esatta per ${crypto.symbol}`);
//                 errors++;
//               }
//             } else {
//               logger.warn(`Nessun risultato per ${crypto.symbol}`);
//               errors++;
//             }
//           } catch (searchError) {
//             logger.error(`Errore nella ricerca di ${crypto.symbol}:`, searchError);
//             errors++;
//           }
//         }
//       } catch (error) {
//         logger.error(`Errore nell'aggiornamento di ${crypto.symbol}:`, error);
//         errors++;
//       }
//     }
    
//     logger.info(`Aggiornamento completato: ${updated} aggiornate, ${errors} errori`);
    
//     res.json({
//       success: true,
//       message: `Prezzi aggiornati con successo: ${updated} aggiornati, ${errors} errori`
//     });
//   } catch (error) {
//     logger.error('Errore nell\'aggiornamento dei prezzi del portafoglio:', error);
    
//     res.status(500).json({
//       success: false,
//       message: 'Errore nell\'aggiornamento dei prezzi delle criptovalute',
//       error: error instanceof Error ? error.message : String(error)
//     });
//   }
// }
  /**
   * Aggiorna le informazioni di una specifica criptovaluta tramite ID CoinGecko
   */
  static async updateCryptoByCoinGeckoId(req: Request, res: Response): Promise<void> {
    try {
      const { coinGeckoId } = req.params;
      logger.info(`Avvio aggiornamento singola criptovaluta con ID: ${coinGeckoId}`);
      
      // Recupera i dati aggiornati da CoinGecko
      const coinData = await CoinGeckoService.getCoinPrice(coinGeckoId);
      logger.info(`Dati recuperati per ${coinData.name} (${coinData.symbol})`);
      
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
        
        logger.info(`Criptovaluta ${coinData.symbol} aggiornata con successo`);
        
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
        
        logger.info(`Nuova criptovaluta ${coinData.symbol} aggiunta con successo`);
        
        res.json({
          success: true,
          message: `${coinData.name} (${coinData.symbol}) aggiunto con successo`
        });
      }
    } catch (error) {
      logger.error('Errore nell\'aggiornamento della criptovaluta:', error);
      
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
      logger.info(`Ricerca criptovaluta con query: ${query}`);
      
      if (!query || typeof query !== 'string') {
        logger.info('Parametro di ricerca mancante o non valido');
        res.status(400).json({
          success: false,
          message: 'Parametro di ricerca mancante o non valido'
        });
        return;
      }
      
      // Cerca nella collezione locale
      logger.info('Ricerca nel database locale...');
      const localResults = await Crypto.find({
        $or: [
          { symbol: new RegExp(query, 'i') },
          { name: new RegExp(query, 'i') }
        ]
      });
      
      logger.info(`Trovati ${localResults.length} risultati nel database locale`);
      
      // Se la ricerca locale non produce risultati, cerca tramite CoinGecko
      if (localResults.length === 0) {
        logger.info('Nessun risultato locale, ricerca su CoinGecko...');
        const apiResults = await CoinGeckoService.searchCoins(query);
        logger.info(`Trovati ${apiResults.length} risultati su CoinGecko`);
        
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
      logger.error('Errore nella ricerca delle criptovalute:', error);
      
      res.status(500).json({
        success: false,
        message: 'Errore nella ricerca delle criptovalute',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Aggiorna l'elenco completo delle criptovalute disponibili
   * Recupera tutte le criptovalute da CoinGecko senza limiti
   */
  static async refreshAllCryptos(req: Request, res: Response): Promise<void> {
    logger.info('======================================');
    logger.info('Avvio processo di aggiornamento completo delle criptovalute');
    logger.info(`Data e ora: ${new Date().toISOString()}`);
    logger.info(`API Key configurata: ${process.env.COINGECKO_API_KEY ? 'Sì (presente)' : 'No (assente)'}`);
    
    try {
      // Avvia il processo in background
      res.json({
        success: true,
        message: 'Aggiornamento delle criptovalute avviato in background',
        estimatedTime: 'Questo processo potrebbe richiedere diversi minuti'
      });
      
      // Questa parte verrà eseguita dopo aver inviato la risposta
      logger.info('Risposta inviata al client, continua il processo in background');
      
      try {
        // Recupera tutte le criptovalute da CoinGecko (senza limiti)
        logger.info('Richiamo CoinGeckoService.getTopCoins(0) per ottenere tutte le criptovalute...');
        const allCoins = await CoinGeckoService.getTopCoins(0); // 0 significa "tutte"
        logger.info(`Recuperate ${allCoins.length} criptovalute da CoinGecko`);
        
        if (allCoins.length === 0) {
          logger.error('Errore: Nessuna criptovaluta recuperata da CoinGecko');
          return;
        }
        
        let updated = 0;
        let added = 0;
        let errors = 0;
        
        logger.info('Inizio aggiornamento del database...');
        
        // Aggiorna o aggiunge ciascuna criptovaluta
        for (const coin of allCoins) {
          try {
            if (!coin.symbol) {
              logger.error('Errore: Symbol mancante per una criptovaluta', coin);
              errors++;
              continue;
            }
            
            const existingCrypto = await Crypto.findOne({ symbol: coin.symbol });
            
            if (existingCrypto) {
              // Aggiorna la criptovaluta esistente
              await Crypto.updateOne(
                { symbol: coin.symbol },
                { 
                  name: coin.name,
                  currentPrice: coin.currentPrice,
                  priceChangePercentage24h: coin.priceChangePercentage24h,
                  marketCap: coin.marketCap,
                  lastUpdated: new Date()
                }
              );
              updated++;
              
              if (updated % 50 === 0) {
                logger.info(`Progresso: ${updated} criptovalute aggiornate, ${added} aggiunte`);
              }
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
              
              if ((updated + added) % 50 === 0) {
                logger.info(`Progresso: ${updated} criptovalute aggiornate, ${added} aggiunte`);
              }
            }
          } catch (coinError) {
            logger.error(`Errore nell'elaborazione di ${coin.symbol}:`, coinError);
            errors++;
            // Continua con la prossima criptovaluta
            continue;
          }
        }
        
        // Aggiorna il timestamp dell'ultimo aggiornamento nelle impostazioni
        logger.info('Aggiornamento del timestamp nelle impostazioni...');
        const updateResult = await Settings.findOneAndUpdate(
          { user: 'default_user' },
          { lastCryptoUpdate: new Date() },
          { upsert: true, new: true }
        );
        
        logger.info(`Timestamp aggiornato: ${updateResult.lastCryptoUpdate}`);
        logger.info(`Aggiornamento completato: ${updated} criptovalute aggiornate, ${added} aggiunte, ${errors} errori`);
        logger.info('======================================');
      } catch (backgroundError) {
        logger.error('Errore durante l\'elaborazione in background:', backgroundError);
        logger.info('======================================');
      }
    } catch (error) {
      logger.error('Errore durante l\'invio della risposta iniziale:', error);
      // La risposta è già stata inviata, quindi non possiamo rispondere con un errore
      logger.info('======================================');
    }
  }
}

export default CryptoController;