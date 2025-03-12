// src/shared/repositories/baseRepository.ts
import mongoose, { Document, Model } from 'mongoose';
import { FilterOptions, PaginationOptions } from '../types';

export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async findAll(filter: FilterOptions = {}, pagination?: PaginationOptions): Promise<T[]> {
    let query = this.model.find(filter);
    
    if (pagination) {
      const { page, limit } = pagination;
      query = query.skip((page - 1) * limit).limit(limit);
    }
    
    return query.exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}