// src/scripts/removeSymbolField.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portfolio from '../models/Portfolio';

// Carica le variabili d'ambiente
dotenv.config();

async function removeSymbolField() {
  try {
    console.log('======================================');
    console.log('Iniziando la rimozione del campo symbol obsoleto');
    console.log(`Data e ora: ${new Date().toISOString()}`);
    
    // Connessione al database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trackmyfunds';
    console.log(`Connessione a MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    console.log('Connesso al database');
    
    // Rimuovi il campo 'symbol' da tutti gli asset in tutti i portafogli
    const result = await Portfolio.updateMany(
      {}, 
      { $unset: { "assets.$[].symbol": "" } }
    );
    
    console.log(`Rimozione completata: ${result.modifiedCount} portafogli aggiornati`);
    console.log('======================================');
    
    // Chiudi la connessione al database
    await mongoose.connection.close();
    console.log('Connessione al database chiusa');
    
    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('Errore durante la rimozione del campo symbol:', error);
    
    // Chiudi la connessione al database in caso di errore
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Connessione al database chiusa');
    }
    
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Esegui lo script solo se chiamato direttamente
if (require.main === module) {
  removeSymbolField()
    .then(result => {
      if (result.success) {
        console.log(`✅ Rimozione completata con successo! ${result.modifiedCount} portafogli aggiornati.`);
      } else {
        console.error(`❌ Rimozione fallita: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Errore non gestito:', error);
      process.exit(1);
    });
}