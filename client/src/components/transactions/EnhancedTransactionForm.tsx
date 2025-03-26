// client/src/components/transactions/EnhancedTransactionForm.tsx

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Button, Grid, Box, Typography, Autocomplete,
  Divider, FormHelperText, Alert, Stepper, Step, StepLabel,
  Paper, RadioGroup, FormControlLabel, Radio, Chip
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { cryptoApi } from '../../services/apiService';
import useErrorHandler from '../../hooks/useErrorHandler';
import { TransactionType, PaymentMethod, STABLECOINS, isStablecoin } from '../../utils/transactionTypes';

interface TransactionFormProps {
  cryptos: any[];
  onSubmit: (data: any) => void;
  transaction?: any; // Proprietà opzionale per una transazione esistente
}

// Definisci l'interfaccia per i metodi esposti
export interface TransactionFormRef {
  submitForm: () => void;
}

interface CryptoOption {
  symbol: string;
  name: string;
}

// Enum per le fasi del form (visibile solo quando l'acquisto/vendita è con crypto)
enum TransactionStep {
  BASIC_INFO = 0,
  PAYMENT_DETAILS = 1,
  CONFIRMATION = 2
}

const EnhancedTransactionForm = forwardRef<TransactionFormRef, TransactionFormProps>(({ 
  cryptos, 
  onSubmit, 
  transaction 
}, ref) => {
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    type: TransactionType.BUY,
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    date: dayjs(),
    notes: '',
    category: '',
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentCurrency: 'EUR',
    // Campi aggiuntivi per farming
    sourceCryptoSymbol: '' // Solo per farming
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeStep, setActiveStep] = useState<TransactionStep>(TransactionStep.BASIC_INFO);
  
  const [isAirdropType, setIsAirdropType] = useState(false);
  const [isFarmingType, setIsFarmingType] = useState(false);
  const [isCryptoPayment, setIsCryptoPayment] = useState(false);
  const [isStablecoinPayment, setIsStablecoinPayment] = useState(false);
  
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [selectedSourceCrypto, setSelectedSourceCrypto] = useState<CryptoOption | null>(null);
  
  // Utilizziamo il hook personalizzato per la gestione degli errori
  const { error: localError, withErrorHandling } = useErrorHandler('EnhancedTransactionForm');

  // Lista di stablecoin comuni
  const stablecoinOptions = STABLECOINS.map(symbol => ({ 
    value: symbol, 
    label: `${symbol} (Stablecoin)` 
  }));

  // Lista di valute fiat comuni
  const fiatCurrencyOptions = [
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'CHF', label: 'Swiss Franc (CHF)' }
  ];

  // Carica la lista completa delle criptovalute all'avvio
  useEffect(() => {
    const fetchCryptos = async () => {
      if (cryptos && cryptos.length > 0) {
        // Se le criptovalute sono già fornite come prop, usale
        const options = cryptos.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.name
        }));
        setCryptoOptions(options);
      } else {
        // Altrimenti, caricale dall'API
        await withErrorHandling(
          async () => {
            const response = await cryptoApi.getAll();
            const options = response.data.map((crypto: any) => ({
              symbol: crypto.symbol,
              name: crypto.name
            }));
            setCryptoOptions(options);
          },
          'fetchCryptos'
        );
      }
    };

    fetchCryptos();
  }, [cryptos, withErrorHandling]);

  // Inizializza il form con i dati della transazione esistente se disponibile
  useEffect(() => {
    if (transaction) {
      // Precompila tutti i campi dalla transazione esistente
      setFormData({
        cryptoSymbol: transaction.cryptoSymbol || '',
        type: transaction.type || TransactionType.BUY,
        quantity: transaction.quantity ? transaction.quantity.toString() : '',
        pricePerUnit: transaction.pricePerUnit ? transaction.pricePerUnit.toString() : '',
        totalAmount: transaction.totalAmount ? transaction.totalAmount.toString() : '',
        date: transaction.date ? dayjs(transaction.date) : dayjs(),
        notes: transaction.notes || '',
        category: transaction.category || '',
        paymentMethod: transaction.paymentMethod || PaymentMethod.BANK_TRANSFER,
        paymentCurrency: transaction.paymentCurrency || 'EUR',
        sourceCryptoSymbol: transaction.sourceCryptoSymbol || '' // Campo per farming
      });

      // Trova e seleziona la crypto corrente
      if (transaction.cryptoSymbol && cryptoOptions.length > 0) {
        const crypto = cryptoOptions.find(c => c.symbol === transaction.cryptoSymbol);
        if (crypto) {
          setSelectedCrypto(crypto);
        }
      }
      
      // Se si tratta di farming, imposta anche la crypto di origine
      if (transaction.type === TransactionType.FARMING && transaction.sourceCryptoSymbol) {
        const sourceCrypto = cryptoOptions.find(c => c.symbol === transaction.sourceCryptoSymbol);
        if (sourceCrypto) {
          setSelectedSourceCrypto(sourceCrypto);
        }
      }
    }
  }, [transaction, cryptoOptions]);

  // Effetto per gestire il cambiamento del tipo di transazione
  useEffect(() => {
    if (formData.type === TransactionType.AIRDROP) {
      setIsAirdropType(true);
      setIsFarmingType(false);
      // Imposta automaticamente prezzo e totale a zero per airdrop
      setFormData(prev => ({
        ...prev,
        pricePerUnit: '0',
        totalAmount: '0',
        paymentMethod: '' as PaymentMethod, // Rimuovi il metodo di pagamento
        paymentCurrency: '' // Rimuovi la valuta di pagamento
      }));
    } 
    else if (formData.type === TransactionType.FARMING) {
      setIsAirdropType(false);
      setIsFarmingType(true);
      // Imposta automaticamente prezzo e totale a zero per farming
      setFormData(prev => ({
        ...prev,
        pricePerUnit: '0',
        totalAmount: '0',
        // Per il farming, imposta sempre il metodo di pagamento a CRYPTO
        paymentMethod: PaymentMethod.CRYPTO,
        // Usa la crypto di origine se specificata, altrimenti la stessa crypto
        paymentCurrency: prev.sourceCryptoSymbol || prev.cryptoSymbol
      }));
    } 
    else {
      setIsAirdropType(false);
      setIsFarmingType(false);
      
      // Reimposta il metodo di pagamento predefinito
      if (!formData.paymentMethod) {
        setFormData(prev => ({
          ...prev,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentCurrency: formData.type === TransactionType.SELL ? 
            (prev.paymentMethod === PaymentMethod.CRYPTO ? 'USDT' : 'EUR') : 'EUR'
        }));
      }
      
      // Reimposta lo step attivo
      setActiveStep(TransactionStep.BASIC_INFO);
    }
  }, [formData.type, formData.paymentMethod]); 

  // Effetto per gestire il cambiamento del metodo di pagamento
  useEffect(() => {
    if (formData.paymentMethod === PaymentMethod.CRYPTO) {
      setIsCryptoPayment(true);
      
      // Verifica se è una stablecoin
      const isStable = isStablecoin(formData.paymentCurrency);
      setIsStablecoinPayment(isStable);
      
      // Imposta USDT come default se non è già impostata una valuta crypto
      if (!stablecoinOptions.some(opt => opt.value === formData.paymentCurrency) && 
          !cryptoOptions.some(opt => opt.symbol === formData.paymentCurrency)) {
        setFormData(prev => ({
          ...prev,
          paymentCurrency: 'USDT'
        }));
      }
    } else {
      setIsCryptoPayment(false);
      setIsStablecoinPayment(false);
      
      // Imposta EUR come default per pagamenti non crypto
      if (!fiatCurrencyOptions.some(opt => opt.value === formData.paymentCurrency)) {
        setFormData(prev => ({
          ...prev,
          paymentCurrency: 'EUR'
        }));
      }
    }
  }, [formData.paymentMethod, formData.paymentCurrency, cryptoOptions, stablecoinOptions, fiatCurrencyOptions]);

  // Esponi il metodo submitForm attraverso il ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (validateForm()) {
        const formattedData = prepareDataForSubmission();
        onSubmit(formattedData);
      }
    }
  }));

  // Prepara i dati per l'invio
  const prepareDataForSubmission = () => {
    let data = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      pricePerUnit: parseFloat(formData.pricePerUnit || '0'),
      totalAmount: parseFloat(formData.totalAmount || '0'),
      date: formData.date.toISOString()
    };
    
    // Per il farming, utilizza sourceCryptoSymbol come paymentCurrency
    if (formData.type === TransactionType.FARMING) {
      data.paymentCurrency = formData.sourceCryptoSymbol;
    }
    
    return data;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    // Se il nome è quantity, formatta il valore a max 8 decimali
    if (name === 'quantity') {
      const stringValue = value as string;
      const numValue = parseFloat(stringValue);
      
      if (!isNaN(numValue)) {
        // Conserva tutti i decimali nell'input, ma arrotonda per i calcoli
        setFormData(prev => ({
          ...prev,
          [name]: stringValue
        }));
      } else if (stringValue === '' || stringValue === '.') {
        // Permetti input vuoti o decimali parziali
        setFormData(prev => ({
          ...prev,
          [name]: stringValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value as string
      }));
    }
    
    // Se non è un airdrop o farming, calcola automaticamente i valori
    if (!isAirdropType && !isFarmingType && 
        (name === 'quantity' || name === 'pricePerUnit' || name === 'totalAmount')) {
      calculateValues(name, value as string);
    }
    
    // Rimuovi l'errore per il campo modificato
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Calcola automaticamente i valori basati sull'input dell'utente
  const calculateValues = (changedField: string, value: string) => {
    let quantity: number = 0;
    let pricePerUnit: number = 0;
    let totalAmount: number = 0;
    
    // Converti i valori in numeri
    const parseInput = (input: string) => {
      const num = parseFloat(input);
      return !isNaN(num) ? num : 0;
    };
    
    if (changedField === 'quantity') {
      quantity = parseInput(value);
      pricePerUnit = parseInput(formData.pricePerUnit);
      totalAmount = quantity * pricePerUnit;
      
      if (!isNaN(totalAmount)) {
        setFormData(prev => ({
          ...prev,
          totalAmount: totalAmount.toFixed(2)
        }));
      }
    } 
    else if (changedField === 'pricePerUnit') {
      quantity = parseInput(formData.quantity);
      pricePerUnit = parseInput(value);
      totalAmount = quantity * pricePerUnit;
      
      if (!isNaN(totalAmount)) {
        setFormData(prev => ({
          ...prev,
          totalAmount: totalAmount.toFixed(2)
        }));
      }
    } 
    else { // totalAmount
      quantity = parseInput(formData.quantity);
      totalAmount = parseInput(value);
      
      if (!isNaN(quantity) && !isNaN(totalAmount) && quantity > 0) {
        pricePerUnit = totalAmount / quantity;
        
        setFormData(prev => ({
          ...prev,
          pricePerUnit: pricePerUnit.toFixed(4)
        }));
      }
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
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
    
    // Validazione comune per tutti i tipi di transazione
    if (!formData.cryptoSymbol) {
      newErrors.cryptoSymbol = 'Seleziona una criptovaluta';
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Inserisci una quantità valida';
    }
    
    // Solo per acquisti e vendite, verifica il prezzo
    if (!isAirdropType && !isFarmingType) {
      if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) < 0) {
        newErrors.pricePerUnit = 'Inserisci un prezzo valido';
      }
      
      if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
        newErrors.totalAmount = 'L\'importo totale deve essere positivo';
      }
    }
  
    // Per acquisti e vendite, verifica che sia specificato un metodo di pagamento
    if ((formData.type === TransactionType.BUY || formData.type === TransactionType.SELL) && !formData.paymentMethod) {
      newErrors.paymentMethod = formData.type === TransactionType.BUY 
        ? 'Seleziona un metodo di pagamento' 
        : 'Seleziona un metodo di ricezione';
    }
  
    // Per pagamenti crypto, verifica che sia specificata una valuta
    if (formData.paymentMethod === PaymentMethod.CRYPTO && !formData.paymentCurrency) {
      newErrors.paymentCurrency = formData.type === TransactionType.BUY 
        ? 'Seleziona una valuta crypto' 
        : 'Seleziona una valuta ricevuta';
    }
    
    // Per farming, verifica che sia specificata una crypto di origine
    if (formData.type === TransactionType.FARMING && !formData.sourceCryptoSymbol) {
      newErrors.sourceCryptoSymbol = 'Seleziona la criptovaluta di origine';
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
    
    const formattedData = prepareDataForSubmission();
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

  // Gestisce la selezione della crypto di origine per il farming
  const handleSourceCryptoChange = (event: React.SyntheticEvent, newValue: CryptoOption | null) => {
    setSelectedSourceCrypto(newValue);
    setFormData(prev => ({
      ...prev,
      sourceCryptoSymbol: newValue?.symbol || '',
      // Aggiorna anche paymentCurrency per mantenere la consistenza
      paymentCurrency: newValue?.symbol || ''
    }));
    
    // Rimuovi l'errore se presente
    if (errors.sourceCryptoSymbol) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sourceCryptoSymbol;
        return newErrors;
      });
    }
  };

  // Avanza al prossimo step del form
  const handleNext = () => {
    // Validazione specifica per lo step corrente
    let isValid = true;
    const stepErrors: {[key: string]: string} = {};
    
    if (activeStep === TransactionStep.BASIC_INFO) {
      // Validazione dei dati di base
      if (!formData.cryptoSymbol) {
        stepErrors.cryptoSymbol = 'Seleziona una criptovaluta';
        isValid = false;
      }
      
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        stepErrors.quantity = 'Inserisci una quantità valida';
        isValid = false;
      }
      
      if (!isAirdropType && !isFarmingType) {
        if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) < 0) {
          stepErrors.pricePerUnit = 'Inserisci un prezzo valido';
          isValid = false;
        }
      }
    }
    else if (activeStep === TransactionStep.PAYMENT_DETAILS) {
      // Validazione dei dettagli di pagamento
      if (!formData.paymentMethod) {
        stepErrors.paymentMethod = 'Seleziona un metodo di pagamento';
        isValid = false;
      }
      
      if (formData.paymentMethod === PaymentMethod.CRYPTO && !formData.paymentCurrency) {
        stepErrors.paymentCurrency = 'Seleziona una valuta';
        isValid = false;
      }
    }
    
    if (!isValid) {
      setErrors(stepErrors);
      return;
    }
    
    // Avanza allo step successivo
    setActiveStep(prevStep => {
      const nextStep = prevStep + 1;
      return nextStep as TransactionStep;
    });
  };

  // Torna allo step precedente
  const handleBack = () => {
    setActiveStep(prevStep => {
      const prevStepValue = prevStep - 1;
      return prevStepValue >= 0 ? prevStepValue as TransactionStep : prevStep;
    });
  };

  // Rendering dei vari step del form
  const renderStepContent = () => {
    switch (activeStep) {
      case TransactionStep.BASIC_INFO:
        return renderBasicInfoStep();
      case TransactionStep.PAYMENT_DETAILS:
        return renderPaymentDetailsStep();
      case TransactionStep.CONFIRMATION:
        return renderConfirmationStep();
      default:
        return renderBasicInfoStep();
    }
  };

  // Step 1: Informazioni di base sulla transazione
  const renderBasicInfoStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          id="crypto-select"
          options={cryptoOptions}
          getOptionLabel={(option) => `${option.name} (${option.symbol})`}
          value={selectedCrypto}
          onChange={handleCryptoChange}
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
          <InputLabel>Tipo di Transazione</InputLabel>
          <Select
            name="type"
            value={formData.type}
            onChange={handleSelectChange}
            label="Tipo di Transazione"
          >
            <MenuItem value={TransactionType.BUY}>Acquisto</MenuItem>
            <MenuItem value={TransactionType.SELL}>Vendita</MenuItem>
            <MenuItem value={TransactionType.AIRDROP}>Airdrop</MenuItem>
            <MenuItem value={TransactionType.FARMING}>Farming</MenuItem>
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
          inputProps={{ step: '0.00000001' }}
          error={!!errors.quantity}
          helperText={errors.quantity}
          required
        />
      </Grid>
      
      {!isAirdropType && !isFarmingType && (
        <>
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
              required
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
              error={!!errors.totalAmount}
              helperText={errors.totalAmount}
              required
            />
          </Grid>
        </>
      )}
      
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
          <DatePicker
            label="Data"
            value={formData.date}
            onChange={handleDateChange}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      
      {/* Sezione specifica per il farming */}
      {isFarmingType && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              Dettagli Farming
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Il farming rappresenta criptovalute guadagnate fornendo liquidità o attraverso staking.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              id="source-crypto-select"
              options={cryptoOptions}
              getOptionLabel={(option) => `${option.name} (${option.symbol})`}
              value={selectedSourceCrypto}
              onChange={handleSourceCryptoChange}
              isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Crypto di Origine (staking/liquidity)"
                  error={!!errors.sourceCryptoSymbol}
                  helperText={errors.sourceCryptoSymbol}
                  required
                />
              )}
            />
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

      {/* Descrizioni informative per i vari tipi di transazione */}
      {isAirdropType && (
        <Grid item xs={12}>
          <Alert severity="info">
            Un airdrop è un'acquisizione gratuita di criptovalute. Verrà registrato come un'acquisizione con costo zero.
          </Alert>
        </Grid>
      )}

      {isFarmingType && (
        <Grid item xs={12}>
          <Alert severity="info">
            Il farming ti permette di tracciare i reward guadagnati tramite staking o liquidity providing.
            La crypto di origine indica cosa stai stakando, mentre la crypto principale è ciò che ricevi come reward.
          </Alert>
        </Grid>
      )}
      
      {/* Per acquisti e vendite normali */}
      {!isAirdropType && !isFarmingType && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={() => setActiveStep(TransactionStep.CONFIRMATION)}>
              Vai alla Conferma
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleNext}
            >
              Continua
            </Button>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  // Step 2: Dettagli del pagamento
  const renderPaymentDetailsStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {formData.type === TransactionType.BUY ? 'Dettagli del Pagamento' : 'Dettagli della Ricezione'}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {formData.type === TransactionType.BUY 
            ? 'Specifica come hai pagato per questa acquisizione' 
            : 'Specifica come hai ricevuto i fondi da questa vendita'
          }
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <Typography variant="subtitle2" gutterBottom>
            {formData.type === TransactionType.BUY ? 'Metodo di Pagamento' : 'Metodo di Ricezione'}
          </Typography>
          <RadioGroup
            row
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <FormControlLabel 
              value={PaymentMethod.BANK_TRANSFER} 
              control={<Radio />} 
              label="Bonifico Bancario" 
            />
            <FormControlLabel 
              value={PaymentMethod.CREDIT_CARD} 
              control={<Radio />} 
              label="Carta di Credito" 
            />
            <FormControlLabel 
              value={PaymentMethod.DEBIT_CARD} 
              control={<Radio />} 
              label="Carta di Debito" 
            />
            <FormControlLabel 
              value={PaymentMethod.CRYPTO} 
              control={<Radio />} 
              label="Crypto/Stablecoin" 
            />
            <FormControlLabel 
              value={PaymentMethod.OTHER} 
              control={<Radio />} 
              label="Altro" 
            />
          </RadioGroup>
          {errors.paymentMethod && (
            <FormHelperText error>{errors.paymentMethod}</FormHelperText>
          )}
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.paymentCurrency}>
          <InputLabel>
            {formData.type === TransactionType.BUY ? 'Valuta del Pagamento' : 'Valuta Ricevuta'}
          </InputLabel>
          <Select
            name="paymentCurrency"
            value={formData.paymentCurrency}
            onChange={handleSelectChange}
            label={formData.type === TransactionType.BUY ? 'Valuta del Pagamento' : 'Valuta Ricevuta'}
          >
            {isCryptoPayment ? (
              // Mostra stablecoin e altre crypto per pagamenti crypto
              <>
                <MenuItem disabled>
                  <Typography variant="caption" color="textSecondary">Stablecoin</Typography>
                </MenuItem>
                {stablecoinOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
                
                <MenuItem disabled>
                  <Typography variant="caption" color="textSecondary">Altre Criptovalute</Typography>
                </MenuItem>
                {cryptoOptions
                  .filter(crypto => !stablecoinOptions.some(s => s.value === crypto.symbol))
                  .slice(0, 10) // Limita a 10 per evitare menu troppo lunghi
                  .map(crypto => (
                    <MenuItem key={crypto.symbol} value={crypto.symbol}>
                      {crypto.name} ({crypto.symbol})
                    </MenuItem>
                  ))
                }
              </>
            ) : (
              // Mostra valute fiat per pagamenti tradizionali
              fiatCurrencyOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))
            )}
          </Select>
          {errors.paymentCurrency && (
            <FormHelperText>{errors.paymentCurrency}</FormHelperText>
          )}
        </FormControl>
      </Grid>
      
      {formData.type === TransactionType.SELL && isCryptoPayment && isStablecoinPayment && (
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Importante:</strong> Questa vendita verso stablecoin verrà registrata come profitto/perdita realizzato.
              Il sistema terrà traccia del guadagno o della perdita effettiva derivante da questa transazione.
            </Typography>
          </Alert>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={handleBack}>
            Indietro
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleNext}
          >
            Rivedi
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  // Step 3: Conferma della transazione
  const renderConfirmationStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Conferma Transazione
        </Typography>
        <Typography variant="body2" paragraph>
          Verifica i dettagli della transazione prima di salvare.
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Tipo di Transazione</Typography>
              <Typography variant="body1">
                <Chip 
                  label={
                    formData.type === TransactionType.BUY ? 'Acquisto' : 
                    formData.type === TransactionType.SELL ? 'Vendita' :
                    formData.type === TransactionType.AIRDROP ? 'Airdrop' : 'Farming'
                  }
                  color={
                    formData.type === TransactionType.BUY ? 'success' : 
                    formData.type === TransactionType.SELL ? 'error' :
                    formData.type === TransactionType.AIRDROP ? 'info' : 'secondary'
                  }
                  size="small"
                />
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Criptovaluta</Typography>
              <Typography variant="body1">{selectedCrypto?.name} ({formData.cryptoSymbol})</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Quantità</Typography>
              <Typography variant="body1">{formData.quantity}</Typography>
            </Grid>
            
            {!isAirdropType && !isFarmingType && (
              <>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Prezzo per Unità</Typography>
                  <Typography variant="body1">${formData.pricePerUnit}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Importo Totale</Typography>
                  <Typography variant="body1">${formData.totalAmount}</Typography>
                </Grid>
              </>
            )}
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Data</Typography>
              <Typography variant="body1">{formData.date.format('DD/MM/YYYY')}</Typography>
            </Grid>
            
            {!isAirdropType && (
              <>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">
                    {formData.type === TransactionType.BUY ? 'Metodo di Pagamento' : 
                     formData.type === TransactionType.FARMING ? 'Crypto di Origine' :
                     'Metodo di Ricezione'}
                  </Typography>
                  <Typography variant="body1">
                    {formData.type === TransactionType.FARMING ? 
                     (selectedSourceCrypto?.name || formData.sourceCryptoSymbol) : 
                     (formData.paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Bonifico Bancario' :
                      formData.paymentMethod === PaymentMethod.CREDIT_CARD ? 'Carta di Credito' :
                      formData.paymentMethod === PaymentMethod.DEBIT_CARD ? 'Carta di Debito' :
                      formData.paymentMethod === PaymentMethod.CRYPTO ? 'Crypto/Stablecoin' : 'Altro')}
                  </Typography>
                </Grid>
                
                {(formData.type === TransactionType.BUY || formData.type === TransactionType.SELL) && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">
                      {formData.type === TransactionType.BUY ? 'Valuta del Pagamento' : 'Valuta Ricevuta'}
                    </Typography>
                    <Typography variant="body1">
                      <Chip 
                        label={formData.paymentCurrency} 
                        size="small" 
                        color={isStablecoinPayment ? "warning" : "default"}
                        variant="outlined"
                      />
                    </Typography>
                  </Grid>
                )}
              </>
            )}
            
            {formData.category && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Categoria</Typography>
                <Typography variant="body1">{formData.category}</Typography>
              </Grid>
            )}
            
            {formData.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Note</Typography>
                <Typography variant="body1">{formData.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={handleBack}>
            Indietro
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
          >
            Conferma e Salva
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      {/* Mostra l'errore se presente */}
      {localError.hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Errore nel form: {localError.message}
        </Alert>
      )}
      
      {/* Stepper visibile solo per acquisti e vendite */}
      {!isAirdropType && !isFarmingType && (
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step completed={activeStep > TransactionStep.BASIC_INFO}>
            <StepLabel>Informazioni Base</StepLabel>
          </Step>
          <Step completed={activeStep > TransactionStep.PAYMENT_DETAILS}>
            <StepLabel>Dettagli Pagamento</StepLabel>
          </Step>
          <Step completed={activeStep >= TransactionStep.CONFIRMATION}>
            <StepLabel>Conferma</StepLabel>
          </Step>
        </Stepper>
      )}

      <form onSubmit={handleSubmit}>
        {/* Contenuto che cambia in base allo step attivo */}
        {isAirdropType || isFarmingType ? renderBasicInfoStep() : renderStepContent()}
        
        {/* Pulsante di submit visibile solo per airdrop e farming */}
        {(isAirdropType || isFarmingType) && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
            >
              Salva
            </Button>
          </Box>
        )}
      </form>
    </LocalizationProvider>
  );
});

export default EnhancedTransactionForm;