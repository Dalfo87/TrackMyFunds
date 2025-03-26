// client/src/pages/Settings.tsx

import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  CircularProgress, 
  Alert,
  Snackbar,
  Divider,
  Chip
} from '@mui/material';
import { settingsApi, cryptoApi } from '../services/apiService';
import { formatDate } from '../utils';
import useErrorHandler from '../hooks/useErrorHandler';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState<string>('');
  const [apiKeyTestLoading, setApiKeyTestLoading] = useState(false);
  
  const { error: localError, withErrorHandling } = useErrorHandler('Settings');

  // Carica le impostazioni attuali all'avvio della pagina
  useEffect(() => {
    const fetchSettings = async () => {
      await withErrorHandling(
        async () => {
          setLoading(true);
          const response = await settingsApi.getSettings();
          setApiKey(response.data.coingeckoApiKey || '');
          if (response.data.lastCryptoUpdate) {
            setLastUpdateDate(new Date(response.data.lastCryptoUpdate));
          }
          setLoading(false);
        },
        'fetchSettings'
      );
    };

    fetchSettings();
  }, [withErrorHandling]);

  // Test della chiave API (senza salvarla)
  const handleTestApiKey = async () => {
    await withErrorHandling(
      async () => {
        setApiKeyTestLoading(true);
        
        const response = await settingsApi.testApiKey(apiKey);
        
        setApiKeyValid(response.data.valid);
        setApiKeyMessage(response.data.message);
        
        setApiKeyTestLoading(false);
      },
      'testApiKey'
    );
  };

  // Gestisce il salvataggio della chiave API
  const handleSaveApiKey = async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        
        const response = await settingsApi.updateSettings({ coingeckoApiKey: apiKey });
        
        setApiKeyValid(response.data.data.apiKeyValid);
        setApiKeyMessage(response.data.data.apiKeyMessage || '');
        
        setSuccess(`Chiave API salvata con successo! ${response.data.data.apiKeyValid ? 'La chiave è valida.' : 'La chiave non è valida.'}`);
        setOpenSnackbar(true);
        setLoading(false);
      },
      'updateSettings'
    );
  };

  // Gestisce l'aggiornamento delle criptovalute
  const handleUpdateCryptos = async () => {
    await withErrorHandling(
      async () => {
        setUpdateLoading(true);
        
        const response = await cryptoApi.refreshAll();
        
        setSuccess(`Aggiornamento completato! Sono state caricate ${response.data.count} criptovalute.`);
        setLastUpdateDate(new Date());
        setOpenSnackbar(true);
        setUpdateLoading(false);
      },
      'refreshCryptos'
    );
  };

  // Chiude lo snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Impostazioni
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            API CoinGecko
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Inserisci la tua chiave API di CoinGecko per aumentare il limite di richieste e accedere a funzionalità aggiuntive.
          </Typography>
          
          <TextField
            fullWidth
            label="Chiave API CoinGecko"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Inserisci la tua chiave API..."
            margin="normal"
          />
          
          {apiKeyValid !== null && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Chip 
                icon={apiKeyValid ? <CheckCircleIcon /> : <CancelIcon />}
                label={apiKeyMessage || (apiKeyValid ? 'Chiave API valida' : 'Chiave API non valida')}
                color={apiKeyValid ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          )}
          
          {localError.hasError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError.message}
            </Alert>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              color="info"
              onClick={handleTestApiKey}
              disabled={!apiKey || apiKeyTestLoading}
            >
              {apiKeyTestLoading ? <CircularProgress size={24} /> : 'Testa Chiave'}
            </Button>
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSaveApiKey}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Salva'}
            </Button>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aggiornamento Criptovalute
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Aggiorna l'elenco completo delle criptovalute disponibili da CoinGecko. Questa operazione potrebbe richiedere alcuni minuti.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleUpdateCryptos}
              disabled={updateLoading}
              size="large"
            >
              {updateLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Aggiornamento in corso...
                </>
              ) : (
                'Aggiorna Criptovalute'
              )}
            </Button>
          </Box>
          
          <Typography variant="caption" color="textSecondary" align="center" sx={{ display: 'block', mt: 1 }}>
            L'ultima volta che hai aggiornato le criptovalute: {updateLoading ? "In corso..." : (lastUpdateDate ? formatDate(lastUpdateDate) : "Mai")}
          </Typography>
        </Paper>
      </Grid>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={localError.hasError ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {localError.hasError ? localError.message : success}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default Settings;