// client/src/components/transactions/TransactionForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Button, Grid, Box, FormHelperText, Typography 
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

interface TransactionFormProps {
  cryptos: any[];
  onSubmit: (data: any) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ cryptos, onSubmit }) => {
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    type: 'buy',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    date: dayjs(),
    notes: '',
    category: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isAirdropType, setIsAirdropType] = useState(false);

  // Effetto per gestire il cambiamento del tipo di transazione
  useEffect(() => {
    if (formData.type === 'airdrop') {
      setIsAirdropType(true);
      // Imposta automaticamente prezzo e totale a zero per airdrop
      setFormData(prev => ({
        ...prev,
        pricePerUnit: '0',
        totalAmount: '0'
      }));
    } else {
      setIsAirdropType(false);
    }
  }, [formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Se non è un airdrop, gestisci i calcoli automatici dei valori
    if (!isAirdropType && (name === 'quantity' || name === 'pricePerUnit' || name === 'totalAmount')) {
      const quantity = name === 'quantity' ? parseFloat(value as string) : parseFloat(formData.quantity);
      const pricePerUnit = name === 'pricePerUnit' ? parseFloat(value as string) : parseFloat(formData.pricePerUnit);
      const totalAmount = name === 'totalAmount' ? parseFloat(value as string) : parseFloat(formData.totalAmount);
      
      if (!isNaN(quantity) && !isNaN(pricePerUnit) && name !== 'totalAmount') {
        setFormData(prev => ({
          ...prev,
          totalAmount: (quantity * pricePerUnit).toFixed(2)
        }));
      } else if (!isNaN(quantity) && !isNaN(totalAmount) && name === 'totalAmount') {
        setFormData(prev => ({
          ...prev,
          pricePerUnit: quantity > 0 ? (totalAmount / quantity).toFixed(2) : prev.pricePerUnit
        }));
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.cryptoSymbol}>
              <InputLabel>Criptovaluta</InputLabel>
              <Select
                name="cryptoSymbol"
                value={formData.cryptoSymbol}
                onChange={handleSelectChange}
                label="Criptovaluta"
              >
                {cryptos.map(crypto => (
                  <MenuItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </MenuItem>
                ))}
              </Select>
              {errors.cryptoSymbol && (
                <FormHelperText>{errors.cryptoSymbol}</FormHelperText>
              )}
            </FormControl>
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
              inputProps={{ step: 'any' }}
              error={!!errors.quantity}
              helperText={errors.quantity}
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
                {isAirdropType ? 'Registra Airdrop' : 'Salva Transazione'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default TransactionForm;