// src/shared/utils/apiResponse.ts

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/common.types';

export class ApiResponseUtil {
  /**
   * Invia una risposta API standardizzata
   */
  static send<T>(res: Response, statusCode: number, data: ApiResponse<T>): Response {
    return res.status(statusCode).json(data);
  }
  
  /**
   * Invia una risposta di successo
   */
  static success<T>(
    res: Response, 
    data: T, 
    message: string = 'Operazione completata con successo', 
    statusCode: number = 200
  ): Response {
    return this.send(res, statusCode, {
      success: true,
      message,
      data
    });
  }
  
  /**
   * Invia una risposta di errore
   */
  static error(
    res: Response, 
    message: string = 'Si è verificato un errore', 
    statusCode: number = 500,
    error?: string
  ): Response {
    return this.send(res, statusCode, {
      success: false,
      message,
      error
    });
  }
  
  /**
   * Invia una risposta paginata
   */
  static paginated<T>(
    res: Response,
    items: T[],
    totalItems: number,
    page: number,
    limit: number,
    message: string = 'Dati recuperati con successo'
  ): Response {
    const totalPages = Math.ceil(totalItems / limit);
    
    return res.status(200).json({
      success: true,
      message,
      data: items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    } as PaginatedResponse<T>);
  }
}