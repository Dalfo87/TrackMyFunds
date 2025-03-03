// All'inizio di src/scripts/updatePrices.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Crypto from '../models/Crypto';
import CoinGeckoService from '../services/coinGeckoService';

// Carica le variabili d'ambiente (assicurati che sia prima di qualsiasi utilizzo)
dotenv.config();

// Messaggio per verificare se la chiave API è configurata
const apiKey = process.env.COINGECKO_API_KEY;
console.log(`CoinGecko API Key configurata: ${apiKey ? 'Sì' : 'No'}`);

/**
 * Script per aggiornare periodicamente i prezzi delle criptovalute
 */
async function updatePrices() {
  try {
    // Connetti al database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trackmyfunds';
    console.log(`Connessione a MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('Connesso al database');

    console.log('Avvio aggiornamento prezzi...');
    
    // Recupera tutte le criptovalute dal database
    const cryptos = await Crypto.find();
    console.log(`Trovate ${cryptos.length} criptovalute nel database`);
    
    if (cryptos.length === 0) {
      // Se non ci sono criptovalute nel database, recupera le top 100
      console.log('Nessuna criptovaluta trovata. Recupero le top 100...');
      const topCoins = await CoinGeckoService.getTopCoins(100);
      
      for (const coin of topCoins) {
        const newCrypto = new Crypto({
          symbol: coin.symbol,
          name: coin.name,
          currentPrice: coin.currentPrice,
          priceChangePercentage24h: coin.priceChangePercentage24h,
          marketCap: coin.marketCap,
          lastUpdated: new Date()
        });
        
        await newCrypto.save();
      }
      
      console.log(`Aggiunte ${topCoins.length} nuove criptovalute`);
    } else {
      // Altrimenti, aggiorna i prezzi delle criptovalute esistenti
      let updated = 0;
      let errors = 0;
      
      // Usa un metodo più efficiente con meno richieste API
      const topCoins = await CoinGeckoService.getTopCoins(250);
      const topCoinsMap = new Map(topCoins.map(coin => [coin.symbol, coin]));
      
      for (const crypto of cryptos) {
        try {
          const coinData = topCoinsMap.get(crypto.symbol);
          
          if (coinData) {
            crypto.currentPrice = coinData.currentPrice ?? 0;
            crypto.priceChangePercentage24h = coinData.priceChangePercentage24h;
            crypto.marketCap = coinData.marketCap;
            crypto.lastUpdated = new Date();
            
            await crypto.save();
            updated++;
          }
        } catch (error) {
          console.error(`Errore nell'aggiornamento di ${crypto.symbol}:`, error);
          errors++;
        }
      }
      
      console.log(`Aggiornamento completato: ${updated} aggiornate, ${errors} errori`);
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei prezzi:', error);
  } finally {
    // Chiudi la connessione al database
    await mongoose.connection.close();
    console.log('Connessione al database chiusa');
  }
}

// Esegui lo script
updatePrices()
  .then(() => {
    console.log('Script di aggiornamento completato');
    process.exit(0);
  })
  .catch(error => {
    console.error('Errore nello script di aggiornamento:', error);
    process.exit(1);
  });