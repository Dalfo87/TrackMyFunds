console.log('TrackMy Funds application is starting...');

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';

// Importa le routes
import cryptoRoutes from './routes/cryptos';
import transactionRoutes from './routes/transactions';
import portfolioRoutes from './routes/portfolio';
import analyticsRoutes from './routes/analytics';

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Express
const app: Express = express();
const port = process.env.PORT || 2025;

// Connetti al database
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // URL del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/cryptos', cryptoRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/analytics', analyticsRoutes);


// Rotta di test
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Benvenuto nell\'API di TrackMy Funds!' });
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in esecuzione su http://localhost:${port}`);
});

// Gestione degli errori 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint non trovato' });
});