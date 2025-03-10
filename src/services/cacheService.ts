// src/services/cacheService.ts
import logger from '../utils/logger';

interface CacheItem<T> {
  value: T;
  expiry: number; // Timestamp di scadenza
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cacheStats: {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
  };

  private constructor() {
    this.cache = new Map();
    this.cacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
    this.startCleanupInterval();
  }

  /**
   * Ottiene l'istanza singleton del servizio di cache
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
      logger.info('CacheService: Inizializzato nuovo servizio di cache');
    }
    return CacheService.instance;
  }

  /**
   * Imposta un elemento nella cache con un TTL specificato
   * @param key Chiave per l'elemento
   * @param value Valore da memorizzare
   * @param ttlSeconds Tempo di vita in secondi (default: 5 minuti)
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const now = Date.now();
    const expiry = now + (ttlSeconds * 1000);
    
    this.cache.set(key, { value, expiry });
    this.cacheStats.size = this.cache.size;
    
    logger.debug(`CacheService: Elemento impostato con chiave "${key}", scade in ${ttlSeconds} secondi`);
  }

  /**
   * Ottiene un elemento dalla cache se esiste e non è scaduto
   * @param key Chiave dell'elemento
   * @returns Valore memorizzato o null se non esiste o è scaduto
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    const now = Date.now();

    // Se l'elemento non esiste o è scaduto
    if (!item || item.expiry < now) {
      if (item && item.expiry < now) {
        // Rimuovi l'elemento scaduto
        this.cache.delete(key);
        this.cacheStats.evictions++;
        this.cacheStats.size = this.cache.size;
        logger.debug(`CacheService: Elemento "${key}" scaduto e rimosso dalla cache`);
      }
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    logger.debug(`CacheService: Cache hit per chiave "${key}"`);
    return item.value;
  }

  /**
   * Verifica se un elemento è presente nella cache e non è scaduto
   * @param key Chiave da verificare
   * @returns true se l'elemento esiste e non è scaduto
   */
  public has(key: string): boolean {
    const item = this.cache.get(key);
    const now = Date.now();
    return !!item && item.expiry > now;
  }

  /**
   * Rimuove un elemento dalla cache
   * @param key Chiave dell'elemento da rimuovere
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.cacheStats.size = this.cache.size;
      logger.debug(`CacheService: Elemento "${key}" rimosso dalla cache`);
    }
    return result;
  }

  /**
   * Rimuove tutti gli elementi dalla cache che iniziano con il prefisso specificato
   * @param keyPrefix Prefisso della chiave
   * @returns Numero di elementi rimossi
   */
  public deleteByPrefix(keyPrefix: string): number {
    // Crea prima un array di chiavi da eliminare per evitare di modificare
    // la collezione durante l'iterazione
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        keysToDelete.push(key);
      }
    }
    
    // Ora elimina tutte le chiavi raccolte
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    const count = keysToDelete.length;
    
    if (count > 0) {
      this.cacheStats.size = this.cache.size;
      logger.debug(`CacheService: Rimossi ${count} elementi con prefisso "${keyPrefix}" dalla cache`);
    }
    
    return count;
  }

  /**
   * Svuota completamente la cache
   */
  public clear(): void {
    const oldSize = this.cache.size;
    
    // Svuota la cache
    this.cache.clear();
    
    // Aggiorna le statistiche
    this.cacheStats.size = 0;
    
    logger.info(`CacheService: Cache svuotata, rimossi ${oldSize} elementi`);
  }

  /**
   * Avvia un intervallo di pulizia periodica per rimuovere elementi scaduti
   */
  private startCleanupInterval(): void {
    // Esegui pulizia ogni minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    logger.debug('CacheService: Avviato intervallo di pulizia della cache');
  }

  /**
   * Ferma l'intervallo di pulizia
   */
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('CacheService: Fermato intervallo di pulizia della cache');
    }
  }

  /**
   * Rimuove tutti gli elementi scaduti dalla cache
   */
  public cleanup(): void {
    const now = Date.now();
    // Crea prima un array di chiavi da eliminare
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        keysToDelete.push(key);
      }
    }
    
    // Ora elimina tutte le chiavi scadute
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    const expiredCount = keysToDelete.length;
    
    if (expiredCount > 0) {
      this.cacheStats.evictions += expiredCount;
      this.cacheStats.size = this.cache.size;
      logger.debug(`CacheService: Rimossi ${expiredCount} elementi scaduti dalla cache`);
    }
  }

  /**
   * Ottiene le statistiche correnti della cache
   */
  public getStats(): any {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits + this.cacheStats.misses > 0 
        ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

export default CacheService.getInstance();