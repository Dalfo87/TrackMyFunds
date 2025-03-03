// client/src/components/transactions/AirdropForm.tsx

import React, { useState } from 'react';
import { 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Button, Grid, Box, FormHelperText, Typography 
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

interface AirdropFormProps {
  cryptos: any[];
  onSubmit: (data: any) => void;
}

const AirdropForm: React.FC<AirdropFormProps> = ({ cryptos, onSubmit }) => {
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    quantity: '',
    date: dayjs(),
    notes: '',
    category: 'airdrop' // Valore predefinito per gli airdrop
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Rimuovi l'errore per il campo che è stato modificato
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
      date: formData.date.toISOString()
    };
    
    onSubmit(formattedData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <form onSubmit={handleSubmit}>
        <Typography variant="body2" color="textSecondary" paragraph>
          Un airdrop è un'acquisizione gratuita di criptovalute. Verrà registrato come un'acquisizione con costo zero.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.cryptoSymbol}>
              <InputLabel>Criptovaluta</InputLabel>
              <Select
                name="cryptoSymbol"
                value={formData.cryptoSymbol}
                onChange={(event) =>
                  handleChange({
                    target: { name: event.target.name, value: event.target.value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
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
            <DatePicker
              label="Data"
              value={formData.date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Categoria (opzionale)"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="es. Fork, Promo"
              defaultValue="airdrop"
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
              placeholder="es. Airdrop da fork di blockchain, promozione exchange, ecc."
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary">
                Registra Airdrop
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default AirdropForm;