// client/src/utils/__tests__/formatters.test.ts

import { 
    formatCurrency, 
    formatDate, 
    formatPercentage, 
    formatQuantity,
    calculateCurrencyEquivalent
  } from '../formatters';
  
  describe('Utility di formattazione', () => {
    describe('formatCurrency', () => {
      it('dovrebbe formattare correttamente un valore numerico', () => {
        expect(formatCurrency(1234.56)).toContain('1.234,56');
        expect(formatCurrency(1234.56)).toContain('$'); // Verifica la valuta predefinita
      });
      
      it('dovrebbe rispettare la valuta specificata', () => {
        expect(formatCurrency(1234.56, 'EUR')).toContain('€');
        expect(formatCurrency(1234.56, 'GBP')).toContain('£');
      });
      
      it('dovrebbe gestire correttamente i valori null e undefined', () => {
        expect(formatCurrency(null)).toContain('0');
        expect(formatCurrency(undefined)).toContain('0');
      });
      
      it('dovrebbe rispettare il locale specificato', () => {
        // Il formato USA usa punto per i decimali e virgola per le migliaia
        expect(formatCurrency(1234.56, 'USD', 'en-US')).toMatch(/1,234\.56/);
        
        // Il formato italiano usa virgola per i decimali e punto per le migliaia
        expect(formatCurrency(1234.56, 'EUR', 'it-IT')).toMatch(/1\.234,56/);
      });
    });
    
    describe('formatDate', () => {
      it('dovrebbe formattare correttamente una data come stringa', () => {
        const dateString = '2023-01-15T12:00:00.000Z';
        // Il risultato dipenderà dal locale, ma dovrebbe contenere giorno, mese e anno
        expect(formatDate(dateString)).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
      });
      
      it('dovrebbe formattare correttamente un oggetto Date', () => {
        const date = new Date(2023, 0, 15); // 15 gennaio 2023
        expect(formatDate(date)).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
      });
      
      it('dovrebbe rispettare il locale specificato', () => {
        const date = new Date(2023, 0, 15); // 15 gennaio 2023
        
        // Formato italiano (giorno/mese/anno)
        const itDate = formatDate(date, 'it-IT');
        expect(itDate.split('/')[0]).toMatch(/15/); // Il giorno viene prima
        
        // Formato americano (mese/giorno/anno)
        const usDate = formatDate(date, 'en-US');
        expect(usDate.split('/')[0]).toMatch(/1/); // Il mese viene prima
      });
    });
    
    describe('formatPercentage', () => {
      it('dovrebbe formattare correttamente un valore percentuale', () => {
        expect(formatPercentage(12.345)).toBe('12.35%');
        expect(formatPercentage(0)).toBe('0.00%');
        expect(formatPercentage(-5.67)).toBe('-5.67%');
      });
      
      it('dovrebbe rispettare il numero di decimali specificato', () => {
        expect(formatPercentage(12.345, 1)).toBe('12.3%');
        expect(formatPercentage(12.345, 3)).toBe('12.345%');
        expect(formatPercentage(12.345, 0)).toBe('12%');
      });
      
      it('dovrebbe gestire correttamente i valori null e undefined', () => {
        expect(formatPercentage(null)).toBe('0.00%');
        expect(formatPercentage(undefined)).toBe('0.00%');
      });
    });
    
    describe('formatQuantity', () => {
      it('dovrebbe formattare correttamente una quantità', () => {
        expect(formatQuantity(1.2345)).toBe('1.235'); // Arrotonda a 3 decimali per default
        expect(formatQuantity(1)).toBe('1');
        expect(formatQuantity(1.2)).toBe('1.2');
      });
      
      it('dovrebbe rispettare il numero di decimali specificato', () => {
        expect(formatQuantity(1.2345, 2)).toBe('1.23');
        expect(formatQuantity(1.2345, 4)).toBe('1.2345');
        expect(formatQuantity(1.2345, 0)).toBe('1');
      });
      
      it('dovrebbe gestire correttamente i valori null e undefined', () => {
        expect(formatQuantity(null)).toBe('0');
        expect(formatQuantity(undefined)).toBe('0');
      });
    });
    
    describe('calculateCurrencyEquivalent', () => {
      it('dovrebbe calcolare correttamente l\'equivalente in un\'altra valuta', () => {
        const value = 100;
        const exchangeRate = 0.85; // 1 USD = 0.85 EUR
        
        const result = calculateCurrencyEquivalent(value, exchangeRate, 'EUR');
        expect(result).toContain('85'); // 100 * 0.85 = 85
        expect(result).toContain('€'); // Valuta EUR
      });
      
      it('dovrebbe gestire correttamente i valori nulli', () => {
        expect(calculateCurrencyEquivalent(null, 0.85)).toContain('0');
        expect(calculateCurrencyEquivalent(100, 0)).toContain('0');
      });
      
      it('dovrebbe rispettare il locale specificato', () => {
        const value = 1234.56;
        const exchangeRate = 0.85;
        
        const itResult = calculateCurrencyEquivalent(value, exchangeRate, 'EUR', 'it-IT');
        expect(itResult).toMatch(/1\.049,88/); // 1234.56 * 0.85 = 1049.876, arrotondato
        
        const usResult = calculateCurrencyEquivalent(value, exchangeRate, 'EUR', 'en-US');
        expect(usResult).toMatch(/1,049\.88/);
      });
    });
  });