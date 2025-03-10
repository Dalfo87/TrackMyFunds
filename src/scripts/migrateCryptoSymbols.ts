// src/scripts/migrateCryptoSymbols.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portfolio from '../models/Portfolio';
import logger from '../utils/logger';

// Carica le variabili d'ambiente
dotenv.config();

async function migrateCryptoSymbols() {
  try {
    logger.info('======================================');
    logger.info('Iniziando la migrazione dei simboli delle criptovalute');
    logger.info(`Data e ora: ${new Date().toISOString()}`);
    
    // Connessione al database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trackmyfunds';
    logger.info(`Connessione a MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    logger.info('Connesso al database');
    
    // Recupera tutti i portafogli
    const portfolios = await Portfolio.find();
    logger.info(`Trovati ${portfolios.length} portafogli da migrare`);
    
    let totalAssetsUpdated = 0;
    
    // Migra ciascun portafoglio
    for (const portfolio of portfolios) {
      let portfolioUpdated = false;
      
      // Migra ciascun asset nel portafoglio
      for (const asset of portfolio.assets) {
        // Verifica se c'è già cryptoSymbol
        if (!asset.cryptoSymbol && asset.symbol) {
          // Aggiungi cryptoSymbol basato su symbol
          asset.cryptoSymbol = asset.symbol.trim().toUpperCase();
          portfolioUpdated = true;
          totalAssetsUpdated++;
          
          logger.info(`Asset aggiornato: symbol "${asset.symbol}" -> cryptoSymbol "${asset.cryptoSymbol}"`);
        }
      }
      
      // Salva il portafoglio se ci sono state modifiche
      if (portfolioUpdated) {
        await portfolio.save();
        logger.info(`Portafoglio ${portfolio._id} aggiornato con successo`);
      }
    }
    
    logger.info(`Migrazione completata: ${totalAssetsUpdated} asset aggiornati`);
    logger.info('======================================');
    
    // Chiudi la connessione al database
    await mongoose.connection.close();
    logger.info('Connessione al database chiusa');
    
    return { success: true, assetsUpdated: totalAssetsUpdated };
  } catch (error) {
    logger.error('Errore durante la migrazione:', error);
    
    // Chiudi la connessione al database in caso di errore
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Connessione al database chiusa');
    }
    
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Esegui lo script solo se chiamato direttamente
if (require.main === module) {
  migrateCryptoSymbols()
    .then(result => {
      if (result.success) {
        console.log(`✅ Migrazione completata con successo! ${result.assetsUpdated} asset aggiornati.`);
      } else {
        console.error(`❌ Migrazione fallita: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Errore non gestito:', error);
      process.exit(1);
    });
}

export { migrateCryptoSymbols };