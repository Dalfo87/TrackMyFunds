// src/pages/Dashboard.tsx

import React from 'react';
import { Grid, Paper, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import TopAssets from '../components/dashboard/TopAssets';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import MarketOverview from '../components/dashboard/MarketOverview';

const Dashboard: React.FC = () => {
  const { 
    state, 
    updateCryptoPrices 
  } = useAppContext();
  
  const { showNotification } = useNotification();
  const { error: localError, handleError, withErrorHandling } = useErrorHandler('Dashboard');

  // Estrai i dati e gli stati di caricamento dal context
  const { 
    portfolio: { data: portfolioData, loading: portfolioLoading, error: portfolioError },
    cryptos: { data: marketData, loading: cryptosLoading }
  } = state;

  // Verifica se stiamo caricando
  const isLoading = portfolioLoading || cryptosLoading;

  // Funzione per gestire l'aggiornamento dei prezzi
  const handleUpdatePrices = async () => {
    await withErrorHandling(
      async () => {
        await updateCryptoPrices();
        showNotification('Prezzi aggiornati con successo', 'success');
      },
      'updatePrices'
    );
  };

  // Stato di caricamento iniziale
  if (isLoading && !portfolioData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Gestione degli errori
  const displayError = localError.hasError ? localError.message : portfolioError;
  if (displayError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Paper 
          sx={{ 
            p: 2, 
            borderLeft: '4px solid', 
            borderColor: 'error.main',
            bgcolor: 'error.dark',
            color: 'error.contrastText'
          }}
        >
          <Typography>{displayError}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 1, color: 'white', borderColor: 'white' }}
            onClick={handleUpdatePrices}
          >
            Riprova
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Riepilogo del portafoglio */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Riepilogo del Portafoglio</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleUpdatePrices}
              disabled={isLoading}
            >
              {isLoading ? 'Aggiornamento...' : 'Aggiorna Prezzi'}
            </Button>
          </Box>
          <PortfolioSummary data={portfolioData} />
        </Paper>
      </Grid>

      {/* Asset principali */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Asset Principali
          </Typography>
          <TopAssets data={portfolioData?.assets || []} />
        </Paper>
      </Grid>

      {/* Grafico delle performance */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance del Portafoglio
          </Typography>
          <PerformanceChart />
        </Paper>
      </Grid>

      {/* Panoramica del mercato */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Panoramica del Mercato
          </Typography>
          <MarketOverview data={marketData.slice(0, 10)} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;