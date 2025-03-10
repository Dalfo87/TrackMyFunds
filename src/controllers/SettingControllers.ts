// src/controllers/settingsController.ts

import express from 'express';
import Settings from '../models/Settings';
import CoinGeckoService from '../services/coinGeckoService';
import logger from '../utils/logger';

type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

class SettingsController {
  /**
   * Recupera le impostazioni dell'utente
   */
  static getSettings: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user'; // In futuro, questo verrà estratto dall'autenticazione
      
      // Cerca le impostazioni dell'utente
      let settings = await Settings.findOne({ user: userId });
      
      // Se non esistono, crea un documento di impostazioni predefinite
      if (!settings) {
        settings = new Settings({
          user: userId,
          coingeckoApiKey: '',
          lastCryptoUpdate: null,
          cachingEnabled: true
        });
        await settings.save();
      }
      
      return res.json({
        success: true,
        data: {
          coingeckoApiKey: settings.coingeckoApiKey,
          lastCryptoUpdate: settings.lastCryptoUpdate,
          cachingEnabled: settings.cachingEnabled
        }
      });
    } catch (error) {
      logger.error('Errore nel recupero delle impostazioni:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel recupero delle impostazioni',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Aggiorna le impostazioni dell'utente
   */
  static updateSettings: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user'; // In futuro, questo verrà estratto dall'autenticazione
      const { coingeckoApiKey, cachingEnabled } = req.body;
      
      // Verifica che almeno un campo sia fornito
      if (coingeckoApiKey === undefined && cachingEnabled === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Nessun dato da aggiornare'
        });
      }
      
      // Se è stata fornita una chiave API, verifichiamola
      let apiKeyValid = false;
      let apiKeyMessage = '';
      
      if (coingeckoApiKey !== undefined && coingeckoApiKey !== '') {
        logger.info('Verifica della chiave API CoinGecko prima del salvataggio');
        const apiKeyTest = await CoinGeckoService.testApiKey(coingeckoApiKey);
        apiKeyValid = apiKeyTest.valid;
        apiKeyMessage = apiKeyTest.message;
        logger.info(`Risultato verifica chiave API: ${apiKeyValid ? 'Valida' : 'Non valida'} - ${apiKeyMessage}`);
      }
      
      // Crea un oggetto con le proprietà da aggiornare
      const updateData: any = {};
      if (coingeckoApiKey !== undefined) updateData.coingeckoApiKey = coingeckoApiKey;
      if (cachingEnabled !== undefined) updateData.cachingEnabled = cachingEnabled;
      
      // Cerca e aggiorna le impostazioni, o crea un nuovo documento se non esiste
      const settings = await Settings.findOneAndUpdate(
        { user: userId },
        updateData,
        { 
          new: true,       // Restituisce il documento aggiornato
          upsert: true     // Crea il documento se non esiste
        }
      );
      
      // Aggiorna la variabile d'ambiente (solo per la sessione corrente del server)
      if (coingeckoApiKey !== undefined) {
        process.env.COINGECKO_API_KEY = coingeckoApiKey;
      }
      
      return res.json({
        success: true,
        message: coingeckoApiKey !== undefined 
          ? `Impostazioni aggiornate con successo. Chiave API: ${apiKeyValid ? 'Valida' : 'Non valida'}`
          : 'Impostazioni aggiornate con successo',
        data: {
          coingeckoApiKey: settings.coingeckoApiKey,
          lastCryptoUpdate: settings.lastCryptoUpdate,
          cachingEnabled: settings.cachingEnabled,
          apiKeyValid: coingeckoApiKey !== undefined ? apiKeyValid : null,
          apiKeyMessage: coingeckoApiKey !== undefined ? apiKeyMessage : null
        }
      });
    } catch (error) {
      logger.error('Errore nell\'aggiornamento delle impostazioni:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento delle impostazioni',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Testa una chiave API di CoinGecko
   */
  static testApiKey: RequestHandler = async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: 'Chiave API richiesta'
        });
      }
      
      const result = await CoinGeckoService.testApiKey(apiKey);
      
      return res.json({
        success: true,
        valid: result.valid,
        message: result.message
      });
    } catch (error) {
      logger.error('Errore nel test della chiave API:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel test della chiave API',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

export { SettingsController };