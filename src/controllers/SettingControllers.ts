// src/controllers/settingsController.ts

import express from 'express';
import Settings from '../models/Settings';

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
          lastCryptoUpdate: null
        });
        await settings.save();
      }
      
      return res.json({
        success: true,
        data: {
          coingeckoApiKey: settings.coingeckoApiKey,
          lastCryptoUpdate: settings.lastCryptoUpdate
        }
      });
    } catch (error) {
      console.error('Errore nel recupero delle impostazioni:', error);
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
      const { coingeckoApiKey } = req.body;
      
      // Verifica che almeno un campo sia fornito
      if (coingeckoApiKey === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Nessun dato da aggiornare'
        });
      }
      
      // Cerca e aggiorna le impostazioni, o crea un nuovo documento se non esiste
      const settings = await Settings.findOneAndUpdate(
        { user: userId },
        { 
          coingeckoApiKey: coingeckoApiKey !== undefined ? coingeckoApiKey : undefined
        },
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
        message: 'Impostazioni aggiornate con successo',
        data: {
          coingeckoApiKey: settings.coingeckoApiKey,
          lastCryptoUpdate: settings.lastCryptoUpdate
        }
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle impostazioni:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento delle impostazioni',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

export { SettingsController };