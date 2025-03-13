// src/modules/crypto/scripts/updateCryptoPrices.ts
import mongoose from 'mongoose';
import { CryptoRepository } from '../repositories/crypto.repository';
import { CoinGeckoService } from '../services/coinGecko.service';
import { CryptoService } from '../services/crypto.service';
import { config } from '../../../shared/config';
import { Logger } from '../../../shared/utils/logger';

async function updateCryptoPrices() {
  try {
    Logger.info('Script di aggiornamento prezzi avviato');
    
    // Connessione al database
    await mongoose.connect(config.database.uri);
    Logger.info('Connesso a MongoDB');
    
    // Inizializzazione delle dipendenze
    const cryptoRepository = new CryptoRepository();
    const coinGeckoService = new CoinGeckoService();
    const cryptoService = new CryptoService(cryptoRepository, coinGeckoService);
    
    // Esegui l'aggiornamento
    const result = await cryptoService.updateAllPrices();
    
    Logger.info(`Aggiornamento completato: ${result.updated} criptovalute aggiornate, ${result.added} aggiunte`);
    
    // Chiudi la connessione al database
    await mongoose.connection.close();
    Logger.info('Connessione al database chiusa');
    
    return { success: true, ...result };
  } catch (error) {
    Logger.error('Errore durante l\'aggiornamento dei prezzi:', error);
    
    // Assicurati di chiudere la connessione al database in caso di errore
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      Logger.info('Connessione al database chiusa');
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

// Esegui lo script solo se chiamato direttamente
if (require.main === module) {
  updateCryptoPrices()
    .then(result => {
      if (result.success) {
        console.log(`✅ Aggiornamento completato con successo: ${(result as { updated: number; added: number }).updated} aggiornate, ${(result as { updated: number; added: number }).added} aggiunte`);
      } else {
        console.error(`❌ Aggiornamento fallito: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Errore non gestito:', error);
      process.exit(1);
    });
}

export { updateCryptoPrices };