// src/app.ts (aggiornamento con nuovo modulo realizedprofit)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './shared/config';
import { requestLoggerMiddleware } from './shared/middleware/requestLoggerMiddleware';
import { errorMiddleware } from './shared/middleware/errorMiddleware';

// Importa i moduli
import settingsRoutes from './modules/settings/routes';
import cryptoRoutes from './modules/crypto/routes';
import transactionsRoutes from './modules/transactions/routes';
import portfolioRoutes from './modules/portfolio/routes'; 
import realizedprofitRoutes from './modules/realizedProfit/routes'; // Nuovo modulo realizedprofit
// Altri import per altri moduli

// Inizializza l'app
const app = express();

// Middleware globali
app.use(cors(config.server.cors));
app.use(express.json());
app.use(requestLoggerMiddleware);

// Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/cryptos', cryptoRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/realized-profits', realizedprofitRoutes); // Aggiungi il nuovo modulo
// Altre routes per altri moduli

// Middleware per la gestione degli errori (deve essere l'ultimo)
app.use(errorMiddleware);

// Connessione al database
mongoose.connect(config.database.uri)
  .then(() => console.log('Connesso a MongoDB'))
  .catch(err => console.error('Errore nella connessione a MongoDB:', err));

export default app;