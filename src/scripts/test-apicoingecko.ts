// src/tests/coingecko-integration.ts

import dotenv from 'dotenv';
import CoinGeckoService from '../services/coinGeckoService';

// Carica variabili d'ambiente
dotenv.config();

async function testCoinGeckoIntegration() {
  try {
    console.log('=== Test Integrazione CoinGecko ===\n');
    
    // Test 1: Recupero top 10 criptovalute
    console.log('Test 1: Recupero top 10 criptovalute');
    console.time('Test 1');
    const topCoins = await CoinGeckoService.getTopCoins(10);
    console.timeEnd('Test 1');
    
    console.log(`✅ Risultato: ${topCoins.length} criptovalute recuperate`);
    console.log('Prime 3 criptovalute:');
    topCoins.slice(0, 3).forEach((coin, index) => {
      console.log(`  ${index + 1}. ${coin.name} (${coin.symbol}): $${coin.currentPrice}`);
    });
    console.log();
    
    // Test 2: Recupero dettagli di Bitcoin
    console.log('Test 2: Recupero dettagli di Bitcoin');
    console.time('Test 2');
    const btcData = await CoinGeckoService.getCoinPrice('bitcoin');
    console.timeEnd('Test 2');
    
    console.log('✅ Dettagli Bitcoin recuperati:');
    console.log(`  Nome: ${btcData.name} (${btcData.symbol})`);
    console.log(`  Prezzo: $${btcData.currentPrice}`);
    console.log(`  Variazione 24h: ${btcData.priceChangePercentage24h}%`);
    console.log(`  Cap. di mercato: $${btcData.marketCap}`);
    console.log();
    
    // Test 3: Ricerca di una criptovaluta
    console.log('Test 3: Ricerca di una criptovaluta');
    console.time('Test 3');
    const searchResults = await CoinGeckoService.searchCoins('ethereum');
    console.timeEnd('Test 3');
    
    console.log(`✅ Risultato: ${searchResults.length} risultati trovati`);
    console.log('Primi 3 risultati:');
    searchResults.slice(0, 3).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} (${result.symbol}) - ID: ${result.id}`);
    });
    
    console.log('\n=== Tutti i test completati con successo! ===');
    
    // Verifica se è in uso la chiave API
    const apiKey = process.env.COINGECKO_API_KEY;
    console.log(`\nModalità API: ${apiKey ? 'Pro (con chiave API)' : 'Demo (senza chiave API)'}`);
    if (!apiKey) {
      console.log('⚠️ Nota: Stai usando l\'API demo di CoinGecko, che ha limiti di frequenza più restrittivi.');
      console.log('   Considera l\'aggiunta di una chiave API per aumentare i limiti di frequenza.');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Test fallito:', error);
    
    // Fornisci suggerimenti in base al tipo di errore
    if (error.response) {
      if (error.response.status === 429) {
        console.error('\n⚠️ Errore 429: Troppe richieste. Hai raggiunto il limite di frequenza dell\'API.');
        console.error('   Suggerimenti:');
        console.error('   - Attendi qualche minuto prima di riprovare');
        console.error('   - Utilizza una chiave API CoinGecko per aumentare i limiti');
        console.error('   - Implementa un meccanismo di cache per ridurre le richieste');
      } else if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n⚠️ Errore di autenticazione. Verifica che la tua chiave API sia corretta.');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ Impossibile connettersi al server CoinGecko. Verifica la tua connessione internet.');
    }
    
    return false;
  }
}

// Esegui il test
testCoinGeckoIntegration()
  .then(success => {
    if (success) {
      console.log('✨ Integrazione con CoinGecko funzionante');
    } else {
      console.log('⚠️ Test di integrazione fallito');
    }
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(error => {
    console.error('❌ Errore durante i test:', error);
    process.exit(1);
  });