// src/shared/types/common.types.ts

export interface PaginationOptions {
    page: number;
    limit: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }
  
  export interface FilterOptions {
    [key: string]: any;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
  }
  
  export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }