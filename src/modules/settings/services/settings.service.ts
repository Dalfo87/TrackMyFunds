// src/modules/settings/services/settings.service.ts
import { SettingsRepository } from '../repositories/settings.repository';
import { ISettings } from '../models/settings.model';
import { 
  UpdateSettingsDto,
  ApiKeyDto,
  CategoryDto 
} from '../dtos/update-settings.dto'; // Import dal nuovo file consolidato
import { Logger } from '../../../shared/utils/logger';
import { ErrorHandler, ApiError } from '../../../shared/utils/errorHandler';

export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  /**
   * Ottiene le impostazioni di un utente
   */
  async getUserSettings(userId: string): Promise<ISettings> {
    try {
      return await this.settingsRepository.findOrCreateByUser(userId);
    } catch (error) {
      Logger.error(`Errore nel servizio getUserSettings:`, error);
      throw new ApiError(500, 'Errore nel recupero delle impostazioni');
    }
  }

  /**
   * Aggiorna le impostazioni di un utente
   */
  async updateSettings(userId: string, updateData: UpdateSettingsDto): Promise<ISettings> {
    try {
      const updated = await this.settingsRepository.updateUserSettings(userId, updateData);
      
      if (!updated) {
        throw new ApiError(404, 'Impostazioni non trovate');
      }
      
      return updated;
    } catch (error) {
      Logger.error(`Errore nel servizio updateSettings:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Errore nell\'aggiornamento delle impostazioni');
    }
  }

  /**
   * Aggiorna la chiave API di CoinGecko
   */
  async updateCoinGeckoApiKey(userId: string, { apiKey }: ApiKeyDto): Promise<ISettings> {
    try {
      const updated = await this.settingsRepository.updateCoinGeckoApiKey(userId, apiKey);
      
      if (!updated) {
        throw new ApiError(404, 'Impostazioni non trovate');
      }
      
      // Qui potremmo aggiungere la logica per validare la chiave API
      // chiamando l'API di CoinGecko con la nuova chiave
      
      return updated;
    } catch (error) {
      Logger.error(`Errore nel servizio updateCoinGeckoApiKey:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Errore nell\'aggiornamento della chiave API');
    }
  }

  /**
   * Aggiunge una categoria personalizzata
   */
  async addCategory(userId: string, { category }: CategoryDto): Promise<ISettings> {
    try {
      if (!category || typeof category !== 'string' || category.trim() === '') {
        throw new ApiError(400, 'La categoria non può essere vuota');
      }
      
      const updated = await this.settingsRepository.addCategory(userId, category.trim());
      
      if (!updated) {
        throw new ApiError(404, 'Impostazioni non trovate');
      }
      
      return updated;
    } catch (error) {
      Logger.error(`Errore nel servizio addCategory:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Errore nell\'aggiunta della categoria');
    }
  }

  /**
   * Rimuove una categoria personalizzata
   */
  async removeCategory(userId: string, { category }: CategoryDto): Promise<ISettings> {
    try {
      if (!category || typeof category !== 'string') {
        throw new ApiError(400, 'È necessario specificare una categoria valida');
      }
      
      const updated = await this.settingsRepository.removeCategory(userId, category);
      
      if (!updated) {
        throw new ApiError(404, 'Impostazioni non trovate');
      }
      
      return updated;
    } catch (error) {
      Logger.error(`Errore nel servizio removeCategory:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Errore nella rimozione della categoria');
    }
  }

  /**
   * Reimposta le impostazioni alle impostazioni predefinite
   */
  async resetToDefaults(userId: string): Promise<ISettings> {
    try {
      // Manteniamo l'utente e le API keys, ma reimpostiamo tutto il resto
      const settings = await this.settingsRepository.findOrCreateByUser(userId);
      
      if (!settings) {
        throw new ApiError(404, 'Impostazioni non trovate');
      }
      
      const apiKeys = settings.apiKeys;
      
      // Eliminiamo le impostazioni correnti e creiamone di nuove
      await this.settingsRepository.delete(settings.id);
      
      // Creiamo nuove impostazioni con i valori predefiniti, ma manteniamo le API keys
      const newSettings = await this.settingsRepository.create({
        user: userId,
        apiKeys
      });
      
      return newSettings;
    } catch (error) {
      Logger.error(`Errore nel servizio resetToDefaults:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Errore nel ripristino delle impostazioni predefinite');
    }
  }
}