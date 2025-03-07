// client/src/components/transactions/TransactionForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Button, Grid, Box, Typography, Autocomplete,
  Divider, FormHelperText
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

// Enumeration dei metodi di pagamento (deve corrispondere a quello nel backend)
enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

interface TransactionFormProps {
  cryptos: any[];
  onSubmit: (data: any) => void;
  transaction?: any; // Proprietà opzionale per una transazione esistente da modificare
}

interface CryptoOption {
  symbol: string;
  name: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ cryptos, onSubmit, transaction }) => {
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    type: 'buy',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    date: dayjs(),
    notes: '',
    category: '',
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentCurrency: 'EUR'
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isAirdropType, setIsAirdropType] = useState(false);
  const [isCryptoPayment, setIsCryptoPayment] = useState(false);
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);

  // Lista di stablecoin comuni
  const commonStablecoins = [
    { value: 'USDT', label: 'Tether (USDT)' },
    { value: 'USDC', label: 'USD Coin (USDC)' },
    { value: 'DAI', label: 'Dai (DAI)' },
    { value: 'BUSD', label: 'Binance USD (BUSD)' },
    { value: 'TUSD', label: 'TrueUSD (TUSD)' }
  ];

  // Lista di valute fiat comuni
  const commonFiatCurrencies = [
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'CHF', label: 'Swiss Franc (CHF)' }
  ];

  // Prepara le opzioni per l'autocomplete
  useEffect(() => {
    if (cryptos && cryptos.length > 0) {
      const options = cryptos.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name
      }));
      setCryptoOptions(options);
    }
  }, [cryptos]);

  // Inizializza il form con i dati della transazione esistente se disponibile
  useEffect(() => {
    if (transaction) {
      setFormData({
        cryptoSymbol: transaction.cryptoSymbol || '',
        type: transaction.type || 'buy',
        quantity: transaction.quantity ? transaction.quantity.toString() : '',
        pricePerUnit: transaction.pricePerUnit ? transaction.pricePerUnit.toString() : '',
        totalAmount: transaction.totalAmount ? transaction.totalAmount.toString() : '',
        date: transaction.date ? dayjs(transaction.date) : dayjs(),
        notes: transaction.notes || '',
        category: transaction.category || '',
        paymentMethod: transaction.paymentMethod || PaymentMethod.BANK_TRANSFER,
        paymentCurrency: transaction.paymentCurrency || 'EUR'
      });

      // Trova e seleziona la crypto corrente
      if (transaction.cryptoSymbol) {
        const crypto = cryptoOptions.find(c => c.symbol === transaction.cryptoSymbol);
        if (crypto) {
          setSelectedCrypto(crypto);
        }
      }
    }
  }, [transaction, cryptoOptions]);

  // Effetto per gestire il cambiamento del tipo di transazione
  useEffect(() => {
    if (formData.type === 'airdrop') {
      setIsAirdropType(true);
      // Imposta automaticamente prezzo e totale a zero per airdrop
      setFormData(prev => ({
        ...prev,
        pricePerUnit: '0',
        totalAmount: '0',
        paymentMethod: '' as any, // Rimuovi il metodo di pagamento per airdrop
        paymentCurrency: '' // Rimuovi la valuta di pagamento per airdrop
      }));
    } else {
      setIsAirdropType(false);
      // Reimpostare il metodo di pagamento predefinito se prima era un airdrop
      if (!formData.paymentMethod) {
        setFormData(prev => ({
          ...prev,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentCurrency: 'EUR'
        }));
      }
    }
  }, [formData.type]);

  // Effetto per gestire il cambiamento del metodo di pagamento
  useEffect(() => {
    if (formData.paymentMethod === PaymentMethod.CRYPTO) {
      setIsCryptoPayment(true);
      // Imposta USDT come valuta predefinita per pagamenti crypto
      if (!commonStablecoins.some(sc => sc.value === formData.paymentCurrency)) {
        setFormData(prev => ({
          ...prev,
          paymentCurrency: 'USDT'
        }));
      }
    } else {
      setIsCryptoPayment(false);
      // Imposta EUR come valuta predefinita per pagamenti non crypto
      if (!commonFiatCurrencies.some(fc => fc.value === formData.paymentCurrency)) {
        setFormData(prev => ({
          ...prev,
          paymentCurrency: 'EUR'
        }));
      }
    }
  }, [formData.paymentMethod]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    // Se il nome è quantity, formatta il valore a max 3 decimali
    if (name === 'quantity') {
      const numValue = parseFloat(value as string);
      if (!isNaN(numValue)) {
        const formattedValue = parseFloat(numValue.toFixed(3)).toString();
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value as string
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value as string
      }));
    }
    
    // Se non è un airdrop, gestisci i calcoli automatici dei valori
    if (!isAirdropType && (name === 'quantity' || name === 'pricePerUnit' || name === 'totalAmount')) {
      let quantity: number = 0;
      let pricePerUnit: number = 0;
      let totalAmount: number = 0;
      
      if (name === 'quantity') {
        quantity = parseFloat(value as string);
        quantity = !isNaN(quantity) ? parseFloat(quantity.toFixed(3)) : 0;
        pricePerUnit = parseFloat(formData.pricePerUnit);
        totalAmount = quantity * pricePerUnit;
        if (!isNaN(totalAmount)) {
          setFormData(prev => ({
            ...prev,
            totalAmount: totalAmount.toFixed(2)
          }));
        }
      } else if (name === 'pricePerUnit') {
        quantity = parseFloat(formData.quantity);
        pricePerUnit = parseFloat(value as string);
        totalAmount = quantity * pricePerUnit;
        if (!isNaN(totalAmount)) {
          setFormData(prev => ({
            ...prev,
            totalAmount: totalAmount.toFixed(2)
          }));
        }
      } else { // totalAmount
        quantity = parseFloat(formData.quantity);
        totalAmount = parseFloat(value as string);
        if (!isNaN(quantity) && !isNaN(totalAmount) && quantity > 0) {
          pricePerUnit = totalAmount / quantity;
          setFormData(prev => ({
            ...prev,
            pricePerUnit: pricePerUnit.toFixed(2)
          }));
        }
      }
    }
    
    // Rimuovi l'errore per il campo che è stato modificato
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>, child: React.ReactNode) => {
    const syntheticEvent = {
      target: {
        name: e.target.name,
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  // Gestisce il cambiamento della data
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date
      }));
    }
  };

  // Valida il form prima dell'invio
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.cryptoSymbol) {
      newErrors.cryptoSymbol = 'Seleziona una criptovaluta';
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Inserisci una quantità valida';
    }
    
    // Solo per transazioni non airdrop, verifica il prezzo
    if (!isAirdropType && (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) < 0)) {
      newErrors.pricePerUnit = 'Inserisci un prezzo valido';
    }

    // Per acquisti, verifica che sia specificato un metodo di pagamento
    if (formData.type === 'buy' && !formData.paymentMethod) {
      newErrors.paymentMethod = 'Seleziona un metodo di pagamento';
    }

    // Per pagamenti crypto, verifica che sia specificata una valuta
    if (formData.paymentMethod === PaymentMethod.CRYPTO && !formData.paymentCurrency) {
      newErrors.paymentCurrency = 'Seleziona una valuta crypto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestisce l'invio del form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const formattedData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      totalAmount: parseFloat(formData.totalAmount),
      date: formData.date.toISOString()
    };
    
    onSubmit(formattedData);
  };

  // Gestisce la selezione della criptovaluta dall'autocomplete
  const handleCryptoChange = (event: React.SyntheticEvent, newValue: CryptoOption | null) => {
    setSelectedCrypto(newValue);
    setFormData(prev => ({
      ...prev,
      cryptoSymbol: newValue?.symbol || ''
    }));
    
    // Rimuovi l'errore se presente
    if (errors.cryptoSymbol) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cryptoSymbol;
        return newErrors;
      });
    }
  };

  // Filtra i risultati in base all'input dell'utente
  const filterOptions = (options: CryptoOption[], { inputValue }: { inputValue: string }) => {
    if (!inputValue) return options;
    
    const searchTerm = inputValue.toLowerCase();
    return options.filter(
      option => 
        option.symbol.toLowerCase().includes(searchTerm) || 
        option.name.toLowerCase().includes(searchTerm)
    );
  };

  // Funzione per ottenere l'etichetta del metodo di pagamento
  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return 'Bonifico Bancario';
      case PaymentMethod.CREDIT_CARD:
        return 'Carta di Credito';
      case PaymentMethod.DEBIT_CARD:
        return 'Carta di Debito';
      case PaymentMethod.CRYPTO:
        return 'Cryptocurrency/Stablecoin';
      case PaymentMethod.OTHER:
        return 'Altro';
      default:
        return method;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              id="crypto-select"
              options={cryptoOptions}
              getOptionLabel={(option) => `${option.name} (${option.symbol})`}
              value={selectedCrypto}
              onChange={handleCryptoChange}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              filterOptions={filterOptions}
              isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Criptovaluta"
                  error={!!errors.cryptoSymbol}
                  helperText={errors.cryptoSymbol}
                  required
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                label="Tipo"
              >
                <MenuItem value="buy">Acquisto</MenuItem>
                <MenuItem value="sell">Vendita</MenuItem>
                <MenuItem value="airdrop">Airdrop</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantità"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ step: '0.001' }}
              error={!!errors.quantity}
              helperText={errors.quantity || "Massimo 3 decimali"}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prezzo per Unità"
              name="pricePerUnit"
              type="number"
              value={formData.pricePerUnit}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              error={!!errors.pricePerUnit}
              helperText={errors.pricePerUnit}
              disabled={isAirdropType}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Importo Totale"
              name="totalAmount"
              type="number"
              value={formData.totalAmount}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              disabled={isAirdropType}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Data"
              value={formData.date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          
          {/* Sezione con metodo di pagamento, visibile solo per acquisti */}
          {formData.type === 'buy' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Dettagli Pagamento
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.paymentMethod}>
                  <InputLabel>Metodo di Pagamento</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleSelectChange}
                    label="Metodo di Pagamento"
                  >
                    <MenuItem value={PaymentMethod.BANK_TRANSFER}>{getPaymentMethodLabel(PaymentMethod.BANK_TRANSFER)}</MenuItem>
                    <MenuItem value={PaymentMethod.CREDIT_CARD}>{getPaymentMethodLabel(PaymentMethod.CREDIT_CARD)}</MenuItem>
                    <MenuItem value={PaymentMethod.DEBIT_CARD}>{getPaymentMethodLabel(PaymentMethod.DEBIT_CARD)}</MenuItem>
                    <MenuItem value={PaymentMethod.CRYPTO}>{getPaymentMethodLabel(PaymentMethod.CRYPTO)}</MenuItem>
                    <MenuItem value={PaymentMethod.OTHER}>{getPaymentMethodLabel(PaymentMethod.OTHER)}</MenuItem>
                  </Select>
                  {errors.paymentMethod && <FormHelperText>{errors.paymentMethod}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.paymentCurrency}>
                  <InputLabel>Valuta di Pagamento</InputLabel>
                  <Select
                    name="paymentCurrency"
                    value={formData.paymentCurrency}
                    onChange={handleSelectChange}
                    label="Valuta di Pagamento"
                  >
                    {/* Mostra stablecoin per pagamenti crypto, valute fiat per altri metodi */}
                    {isCryptoPayment ? 
                      commonStablecoins.map(stablecoin => (
                        <MenuItem key={stablecoin.value} value={stablecoin.value}>
                          {stablecoin.label}
                        </MenuItem>
                      ))
                      :
                      commonFiatCurrencies.map(fiat => (
                        <MenuItem key={fiat.value} value={fiat.value}>
                          {fiat.label}
                        </MenuItem>
                      ))
                    }
                  </Select>
                  {errors.paymentCurrency && <FormHelperText>{errors.paymentCurrency}</FormHelperText>}
                </FormControl>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              label="Categoria (opzionale)"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="es. Trading, Lungo termine, Promo"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Note (opzionale)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="es. Dettagli sull'acquisizione, motivo, fonte..."
            />
          </Grid>
          
          {isAirdropType && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Un airdrop è un'acquisizione gratuita di criptovalute. Verrà registrato come un'acquisizione con costo zero.
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary">
                {transaction ? 'Aggiorna Transazione' : (isAirdropType ? 'Registra Airdrop' : 'Salva Transazione')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default TransactionForm;