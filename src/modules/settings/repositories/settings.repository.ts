// src/modules/settings/repositories/settings.repository.ts
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { Settings, ISettings } from '../models/settings.model';
import { Logger } from '../../../shared/utils/logger';

export class SettingsRepository extends BaseRepository<ISettings> {
  constructor() {
    super(Settings);
  }

  /**
   * Trova o crea le impostazioni per un utente specifico
   */
  async findOrCreateByUser(userId: string): Promise<ISettings> {
    try {
      let settings = await Settings.findOne({ user: userId });
      
      if (!settings) {
        Logger.info(`Creazione nuove impostazioni per l'utente: ${userId}`);
        settings = await Settings.create({ user: userId });
      }
      
      return settings;
    } catch (error) {
      Logger.error(`Errore nel trovare/creare impostazioni per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Aggiorna le impostazioni di un utente
   */
  async updateUserSettings(userId: string, updateData: Partial<ISettings>): Promise<ISettings | null> {
    try {
      return await Settings.findOneAndUpdate(
        { user: userId },
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento delle impostazioni per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Aggiunge una nuova categoria personalizzata
   */
  async addCategory(userId: string, category: string): Promise<ISettings | null> {
    try {
      return await Settings.findOneAndUpdate(
        { user: userId },
        { $addToSet: { categories: category } },
        { new: true }
      );
    } catch (error) {
      Logger.error(`Errore nell'aggiunta della categoria per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Rimuove una categoria personalizzata
   */
  async removeCategory(userId: string, category: string): Promise<ISettings | null> {
    try {
      return await Settings.findOneAndUpdate(
        { user: userId },
        { $pull: { categories: category } },
        { new: true }
      );
    } catch (error) {
      Logger.error(`Errore nella rimozione della categoria per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Aggiorna la chiave API di CoinGecko
   */
  async updateCoinGeckoApiKey(userId: string, apiKey: string): Promise<ISettings | null> {
    try {
      return await Settings.findOneAndUpdate(
        { user: userId },
        { 'apiKeys.coinGecko': apiKey },
        { new: true }
      );
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento della chiave API per l'utente ${userId}:`, error);
      throw error;
    }
  }
}