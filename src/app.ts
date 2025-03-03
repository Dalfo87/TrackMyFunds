// src/app.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import logger from './utils/logger';

// Importa le routes
import cryptoRoutes from './routes/cryptos';
import transactionRoutes from './routes/transactions';
import portfolioRoutes from './routes/portfolio';
import analyticsRoutes from './routes/analytics';
import settingsRoutes from './routes/settings';

// Carica le variabili d'ambiente
dotenv.config();

// Log di avvio dell'applicazione
logger.info('======================================');
logger.info('TrackMy Funds application is starting...');
logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Data e ora di avvio: ${new Date().toISOString()}`);
logger.info('======================================');

// Inizializza Express
const app: Express = express();
const port = process.env.PORT || 2025;

// Connetti al database
connectDB()
  .then(() => logger.info('MongoDB connesso con successo'))
  .catch(err => {
    logger.error('Errore durante la connessione a MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // URL del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware per il logging delle richieste
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/cryptos', cryptoRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Rotta di test
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Benvenuto nell\'API di TrackMy Funds!' });
});

// Gestione degli errori 404
app.use((req: Request, res: Response) => {
  logger.warn(`404 - Route non trovata: ${req.originalUrl}`);
  res.status(404).json({ message: 'Endpoint non trovato' });
});

// Middleware di gestione errori
app.use((err: any, req: Request, res: Response, next: Function) => {
  logger.error('Errore non gestito:', err);
  res.status(500).json({
    success: false,
    message: 'Errore interno del server',
    error: process.env.NODE_ENV === 'production' ? 'Si è verificato un errore' : err.message
  });
});

// Avvia il server
app.listen(port, () => {
  logger.info(`Server in esecuzione su http://localhost:${port}`);
});

// Gestione delle interruzioni del processo
process.on('SIGINT', () => {
  logger.info('Applicazione terminata (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Applicazione terminata (SIGTERM)');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Eccezione non gestita:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promessa rifiutata non gestita:', reason);
});