// client/src/utils/__tests__/uiHelpers.test.tsx

import React from 'react';
import { render } from '@testing-library/react';
import { 
  getPaymentMethodName, 
  getPaymentMethodIcon, 
  getTransactionTypeText, 
  getTransactionTypeColor,
  getProfitLossIcon,
  getProfitLossColor,
  PaymentMethod,
  TransactionType
} from '../uiHelpers';

describe('Utility UI', () => {
  describe('getPaymentMethodName', () => {
    it('dovrebbe restituire il nome corretto per ogni metodo di pagamento', () => {
      expect(getPaymentMethodName(PaymentMethod.BANK_TRANSFER)).toBe('Bonifico Bancario');
      expect(getPaymentMethodName(PaymentMethod.CREDIT_CARD)).toBe('Carta di Credito');
      expect(getPaymentMethodName(PaymentMethod.DEBIT_CARD)).toBe('Carta di Debito');
      expect(getPaymentMethodName(PaymentMethod.CRYPTO)).toBe('Cryptocurrency/Stablecoin');
      expect(getPaymentMethodName(PaymentMethod.OTHER)).toBe('Altro');
    });
    
    it('dovrebbe gestire i valori non definiti', () => {
      expect(getPaymentMethodName()).toBe('-');
      expect(getPaymentMethodName('undefined')).toBe('Non specificato');
      expect(getPaymentMethodName('metodo_sconosciuto')).toBe('metodo_sconosciuto');
    });
  });
  
  describe('getPaymentMethodIcon', () => {
    it('dovrebbe restituire l\'icona corretta per ogni metodo di pagamento', () => {
      // Poiché le icone sono componenti React, testiamo che vengano renderizzate
      const { container: bankTransferContainer } = render(
        <>{getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER)}</>
      );
      expect(bankTransferContainer.firstChild).not.toBeNull();
      
      const { container: creditCardContainer } = render(
        <>{getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)}</>
      );
      expect(creditCardContainer.firstChild).not.toBeNull();
    });
    
    it('dovrebbe gestire i valori non definiti', () => {
      expect(getPaymentMethodIcon()).toBeNull();
    });
    
    it('dovrebbe applicare le props passate alle icone', () => {
      const { container } = render(
        <>{getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER, { fontSize: 'large' })}</>
      );
      
      // Verifica che la prop fontSize sia stata applicata
      const svgElement = container.querySelector('svg');
      expect(svgElement).toHaveAttribute('font-size', 'large');
    });
  });
  
  describe('getTransactionTypeText', () => {
    it('dovrebbe restituire il testo corretto per ogni tipo di transazione', () => {
      expect(getTransactionTypeText(TransactionType.BUY)).toBe('Acquisto');
      expect(getTransactionTypeText(TransactionType.SELL)).toBe('Vendita');
      expect(getTransactionTypeText(TransactionType.AIRDROP)).toBe('Airdrop');
    });
    
    it('dovrebbe gestire i valori non definiti', () => {
      expect(getTransactionTypeText()).toBe('-');
      expect(getTransactionTypeText('tipo_sconosciuto')).toBe('tipo_sconosciuto');
    });
  });
  
  describe('getTransactionTypeColor', () => {
    it('dovrebbe restituire il colore corretto per ogni tipo di transazione', () => {
      expect(getTransactionTypeColor(TransactionType.BUY)).toBe('success');
      expect(getTransactionTypeColor(TransactionType.SELL)).toBe('error');
      expect(getTransactionTypeColor(TransactionType.AIRDROP)).toBe('info');
    });
    
    it('dovrebbe gestire i valori non definiti', () => {
      expect(getTransactionTypeColor()).toBe('default');
      expect(getTransactionTypeColor('tipo_sconosciuto')).toBe('default');
    });
  });
  
  describe('getProfitLossIcon', () => {
    it('dovrebbe applicare le props passate alle icone', () => {
      const { container } = render(
        <>{getProfitLossIcon(100, { fontSize: 'large' })}</>
      );
      expect(container.firstChild).not.toBeNull();
      
      // Per valori negativi
      const { container: negativeContainer } = render(
        <>{getProfitLossIcon(-100)}</>
      );
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
    
    it('dovrebbe applicare le props passate alle icone', () => {
      const { container } = render(
        <>{getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER, { fontSize: 'large' })}</>
      );
      
      // Verifica che la prop fontSize sia stata applicata
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });
  
  describe('getProfitLossColor', () => {
    it('dovrebbe restituire il colore corretto in base al valore', () => {
      expect(getProfitLossColor(100)).toBe('success.main');
      expect(getProfitLossColor(0)).toBe('success.main');
      expect(getProfitLossColor(-100)).toBe('error.main');
    });
  });
});