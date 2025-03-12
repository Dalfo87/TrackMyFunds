// src/modules/settings/__tests__/settings.repository.test.ts
import mongoose from 'mongoose';
import { SettingsRepository } from '../repositories/settings.repository';
import { Settings } from '../models/settings.model';

// Mock del modello
jest.mock('../models/settings.model', () => ({
  Settings: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

describe('SettingsRepository', () => {
  let settingsRepository: SettingsRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    settingsRepository = new SettingsRepository();
  });
  
  describe('findOrCreateByUser', () => {
    it('dovrebbe restituire le impostazioni esistenti', async () => {
      const mockSettings = { user: 'user123', defaultCurrency: 'EUR' };
      (Settings.findOne as jest.Mock).mockResolvedValue(mockSettings);
      
      const result = await settingsRepository.findOrCreateByUser('user123');
      
      expect(Settings.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(result).toEqual(mockSettings);
      expect(Settings.create).not.toHaveBeenCalled();
    });
    
    it('dovrebbe creare nuove impostazioni se non esistono', async () => {
      const mockSettings = { user: 'user123', defaultCurrency: 'EUR' };
      (Settings.findOne as jest.Mock).mockResolvedValue(null);
      (Settings.create as jest.Mock).mockResolvedValue(mockSettings);
      
      const result = await settingsRepository.findOrCreateByUser('user123');
      
      expect(Settings.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Settings.create).toHaveBeenCalledWith({ user: 'user123' });
      expect(result).toEqual(mockSettings);
    });
  });
  
  // Altri test per gli altri metodi
});