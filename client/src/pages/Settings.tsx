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
  Divider
} from '@mui/material';
import { settingsApi, cryptoApi } from '../services/api';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Carica le impostazioni attuali all'avvio della pagina
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsApi.getSettings();
        setApiKey(response.data.coingeckoApiKey || '');
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento delle impostazioni:', error);
        setError('Errore nel caricamento delle impostazioni. Riprova più tardi.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Gestisce il salvataggio della chiave API
  const handleSaveApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await settingsApi.updateSettings({ coingeckoApiKey: apiKey });
      
      setSuccess('Chiave API salvata con successo!');
      setOpenSnackbar(true);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel salvataggio della chiave API:', error);
      setError('Errore nel salvataggio della chiave API. Riprova più tardi.');
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  // Gestisce l'aggiornamento delle criptovalute
  const handleUpdateCryptos = async () => {
    try {
      setUpdateLoading(true);
      setError(null);
      
      const response = await cryptoApi.refreshAll();
      
      setSuccess(`Aggiornamento completato! Sono state caricate ${response.data.count} criptovalute.`);
      setOpenSnackbar(true);
      setUpdateLoading(false);
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle criptovalute:', error);
      setError('Errore nell\'aggiornamento delle criptovalute. Riprova più tardi.');
      setOpenSnackbar(true);
      setUpdateLoading(false);
    }
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
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
            L'ultima volta che hai aggiornato le criptovalute: {updateLoading ? "In corso..." : "Mai"}
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
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default Settings;