// src/modules/portfolio/repositories/portfolio.repository.ts
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { Portfolio, IPortfolio } from '../models/portfolio.model';
import { Logger } from '../../../shared/utils/logger';
import { UpdatePortfolioDto } from '../dtos/portfolio-dtos';

export class PortfolioRepository extends BaseRepository<IPortfolio> {
  constructor() {
    super(Portfolio);
  }

  /**
   * Trova o crea il portafoglio di un utente
   */
  async findOrCreateByUser(userId: string): Promise<IPortfolio> {
    try {
      let portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio) {
        Logger.info(`Creazione nuovo portafoglio per l'utente: ${userId}`);
        portfolio = new Portfolio({
          user: userId,
          assets: [],
          lastUpdated: new Date()
        });
        await portfolio.save();
      }
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nel trovare/creare il portafoglio per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Aggiorna il portafoglio di un utente
   */
  async updatePortfolio(userId: string, updateData: UpdatePortfolioDto): Promise<IPortfolio | null> {
    try {
      // Prima ottieni il portafoglio esistente
      const portfolio = await this.findOrCreateByUser(userId);
      
      // Se ci sono nuovi asset, sostituisci quelli esistenti o aggiungine di nuovi
      if (updateData.assets && updateData.assets.length > 0) {
        updateData.assets.forEach(assetUpdate => {
          const assetIndex = portfolio.assets.findIndex(
            asset => asset.cryptoSymbol.toUpperCase() === assetUpdate.cryptoSymbol.toUpperCase()
          );
          
          if (assetIndex !== -1) {
            // Aggiorna l'asset esistente
            if (assetUpdate.quantity !== undefined) {
              portfolio.assets[assetIndex].quantity = assetUpdate.quantity;
            }
            if (assetUpdate.averagePrice !== undefined) {
              portfolio.assets[assetIndex].averagePrice = assetUpdate.averagePrice;
            }
            if (assetUpdate.category !== undefined) {
              portfolio.assets[assetIndex].category = assetUpdate.category;
            }
            if (assetUpdate.type !== undefined) {
              portfolio.assets[assetIndex].type = assetUpdate.type;
            }
          } else {
            // Aggiungi un nuovo asset
            portfolio.assets.push({
              cryptoSymbol: assetUpdate.cryptoSymbol.toUpperCase(),
              quantity: assetUpdate.quantity || 0,
              averagePrice: assetUpdate.averagePrice || 0,
              category: assetUpdate.category,
              type: assetUpdate.type
            });
          }
        });
      }
      
      // Aggiorna la data di ultimo aggiornamento
      portfolio.lastUpdated = new Date();
      
      // Salva le modifiche
      await portfolio.save();
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento del portafoglio per l'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Trova un asset specifico nel portafoglio dell'utente
   */
  async findAssetBySymbol(userId: string, cryptoSymbol: string): Promise<any | null> {
    try {
      const portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio) {
        return null;
      }
      
      return portfolio.assets.find(
        asset => asset.cryptoSymbol.toUpperCase() === cryptoSymbol.toUpperCase()
      );
    } catch (error) {
      Logger.error(`Errore nel trovare l'asset ${cryptoSymbol} nel portafoglio dell'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Rimuove completamente un asset dal portafoglio
   */
  async removeAsset(userId: string, cryptoSymbol: string): Promise<IPortfolio | null> {
    try {
      const portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio) {
        return null;
      }
      
      // Filtra l'asset da rimuovere
      const assetIndex = portfolio.assets.findIndex(
        asset => asset.cryptoSymbol.toUpperCase() === cryptoSymbol.toUpperCase()
      );
      
      if (assetIndex !== -1) {
        portfolio.assets.splice(assetIndex, 1);
        portfolio.lastUpdated = new Date();
        await portfolio.save();
      }
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nella rimozione dell'asset ${cryptoSymbol} dal portafoglio dell'utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Aggiorna la categoria di un asset
   */
  async updateAssetCategory(userId: string, cryptoSymbol: string, category: string): Promise<IPortfolio | null> {
    try {
      const portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio) {
        return null;
      }
      
      const assetIndex = portfolio.assets.findIndex(
        asset => asset.cryptoSymbol.toUpperCase() === cryptoSymbol.toUpperCase()
      );
      
      if (assetIndex !== -1) {
        portfolio.assets[assetIndex].category = category;
        portfolio.lastUpdated = new Date();
        await portfolio.save();
      }
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento della categoria dell'asset ${cryptoSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene tutti gli asset con una categoria specifica
   */
  async getAssetsByCategory(userId: string, category: string): Promise<any[]> {
    try {
      const portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio) {
        return [];
      }
      
      return portfolio.assets.filter(asset => asset.category === category);
    } catch (error) {
      Logger.error(`Errore nel recupero degli asset per categoria ${category}:`, error);
      throw error;
    }
  }
}