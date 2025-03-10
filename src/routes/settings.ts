// src/routes/settings.ts

import express from 'express';
import { SettingsController } from '../controllers/SettingControllers';

// Definisci esplicitamente il router
const router = express.Router();

// Route per le impostazioni
router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);
router.post('/test-api-key', SettingsController.testApiKey);

export default router;