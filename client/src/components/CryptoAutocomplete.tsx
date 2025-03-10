// client/src/components/CryptoAutocomplete.tsx

import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress,
  Avatar,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { cryptoApi } from '../services/api';
import useErrorHandler from '../hooks/useErrorHandler';

interface CryptoOption {
  symbol: string;
  name: string;
  currentPrice?: number;
}

interface CryptoAutocompleteProps {
  label?: string;
  value: string;
  onChange: (symbol: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

const CryptoAutocomplete: React.FC<CryptoAutocompleteProps> = ({
  label = 'Criptovaluta',
  value,
  onChange,
  required = false,
  error = false,
  helperText = ''
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<CryptoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<CryptoOption | null>(null);
  
  // Utilizziamo il hook personalizzato per la gestione degli errori
  const { error: localError, withErrorHandling } = useErrorHandler('CryptoAutocomplete');

  // Ottieni la lista delle criptovalute all'apertura del dropdown
  useEffect(() => {
    let active = true;

    if (!open) {
      return undefined;
    }

    setLoading(true);
    
    const loadOptions = async () => {
      await withErrorHandling(
        async () => {
          // Ottieni tutte le criptovalute
          const response = await cryptoApi.getAll();
          
          if (active) {
            setOptions(response.data);
            setLoading(false);
          }
        },
        'loadOptions'
      );
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, [open, withErrorHandling]);

  // Aggiorna la ricerca quando l'utente digita
  useEffect(() => {
    if (!open || !inputValue.trim()) return;

    // Debounce per evitare troppe richieste durante la digitazione
    const timer = setTimeout(async () => {
      setLoading(true);
      
      await withErrorHandling(
        async () => {
          // Cerca le criptovalute in base all'input
          const response = await cryptoApi.search(inputValue);
          setOptions(response.data.results || []);
          setLoading(false);
        },
        'searchCrypto'
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, open, withErrorHandling]);

  // Trova l'opzione corrente in base al valore
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.symbol === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  return (
    <>
      {/* Mostra l'errore se presente */}
      {localError.hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Errore nel caricamento delle criptovalute: {localError.message}
        </Alert>
      )}
      
      <Autocomplete
        id="crypto-autocomplete"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={selectedOption}
        onChange={(_, newValue) => {
          setSelectedOption(newValue);
          onChange(newValue?.symbol || '');
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        options={options}
        getOptionLabel={(option) => `${option.name} (${option.symbol})`}
        isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
        loading={loading}
        filterOptions={(x) => x} // Disabilita il filtro predefinito, la ricerca è gestita dal backend
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ 
                width: 30, 
                height: 30, 
                bgcolor: 'primary.light', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 1,
                color: 'white',
                fontWeight: 'bold'
              }}>
                {option.symbol.charAt(0)}
              </Box>
              <Box sx={{ ml: 1 }}>
                <Typography variant="body1">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.symbol} {option.currentPrice ? `- $${option.currentPrice.toFixed(2)}` : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error || localError.hasError}
            helperText={localError.hasError ? localError.message : helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
    </>
  );
};

export default CryptoAutocomplete;