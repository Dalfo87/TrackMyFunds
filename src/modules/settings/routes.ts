// src/modules/settings/routes.ts
import { Router } from 'express';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { SettingsRepository } from './repositories/settings.repository';
import { authMiddleware } from '../../shared/middleware/authMiddleware'; // Assumiamo che esista un middleware di autenticazione

const router = Router();

// Inizializzazione delle dipendenze
const settingsRepository = new SettingsRepository();
const settingsService = new SettingsService(settingsRepository);
const settingsController = new SettingsController(settingsService);

// Applica il middleware di autenticazione a tutte le routes
router.use(authMiddleware);

// Definizione delle routes
router.get('/', (req, res) => settingsController.getUserSettings(req, res));
router.put('/', (req, res) => settingsController.updateSettings(req, res));
router.put('/api-keys/coingecko', (req, res) => settingsController.updateCoinGeckoApiKey(req, res));
router.post('/categories', (req, res) => settingsController.addCategory(req, res));
router.delete('/categories/:category', (req, res) => settingsController.removeCategory(req, res));
router.post('/reset', (req, res) => settingsController.resetToDefaults(req, res));

export default router;