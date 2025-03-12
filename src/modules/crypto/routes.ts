// src/modules/crypto/routes.ts
import { Router } from 'express';
import { CryptoController } from './controllers/crypto.controller';
import { CryptoService } from './services/crypto.service';
import { CryptoRepository } from './repositories/crypto.repository';
import { CoinGeckoService } from './services/coinGecko.service';

const router = Router();

// Inizializzazione delle dipendenze
const cryptoRepository = new CryptoRepository();
const coinGeckoService = new CoinGeckoService();
const cryptoService = new CryptoService(cryptoRepository, coinGeckoService);
const cryptoController = new CryptoController(cryptoService);

// Definizione delle routes
router.get('/', (req, res) => cryptoController.getAllCryptos(req, res));
router.post('/', (req, res) => cryptoController.createCrypto(req, res));
router.get('/search', (req, res) => cryptoController.searchCryptos(req, res));
router.post('/update-prices', (req, res) => cryptoController.updateAllPrices(req, res));
router.get('/:symbol', (req, res) => cryptoController.getCryptoBySymbol(req, res));
router.put('/:symbol', (req, res) => cryptoController.updateCrypto(req, res));
router.delete('/:symbol', (req, res) => cryptoController.deleteCrypto(req, res));

export default router;