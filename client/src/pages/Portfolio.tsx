// src/pages/Portfolio.tsx

import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Button, 
  Tabs, 
  Tab,
  Divider
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';
import { analyticsApi } from '../services/apiService';
import RefreshIcon from '@mui/icons-material/Refresh';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import PortfolioAssetsList from '../components/portfolio/PortfolioAssetList';
import PortfolioAllocation from '../components/portfolio/PortfolioAllocation';
import PortfolioPerformance from '../components/portfolio/PortfolioPerformance';

const Portfolio: React.FC = () => {
  const { state, updateCryptoPrices } = useAppContext();
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('Portfolio');
  
  const [tabValue, setTabValue] = useState(0);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Estrai i dati dal context
  const { 
    portfolio: { data: portfolioData, loading, error }
  } = state;

  // Carica i dati di performance
  useEffect(() => {
    const fetchPerformanceData = async () => {
      await withErrorHandling(
        async () => {
          setPerformanceLoading(true);
          const response = await analyticsApi.getPortfolioPerformance();
          setPerformanceData(response.data.data);
          setPerformanceLoading(false);
        },
        'fetchPerformance'
      );
    };

    fetchPerformanceData();
  }, [withErrorHandling]);

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Funzione per aggiornare i prezzi delle criptovalute nel portafoglio
  const handleRefreshPortfolio = async () => {
    await withErrorHandling(
      async () => {
        await updateCryptoPrices();
        showNotification('Portafoglio aggiornato con successo', 'success');
      },
      'refreshPortfolio'
    );
  };

  if ((loading && !portfolioData) || performanceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Gestione degli errori
  const displayError = localError.hasError ? localError.message : error;
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
            onClick={handleRefreshPortfolio}
          >
            Riprova
          </Button>
        </Paper>
      </Box>
    );
  }

  // Se non ci sono asset nel portafoglio
  if (!portfolioData || !portfolioData.assets || portfolioData.assets.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Portafoglio Vuoto
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Non hai ancora registrato nessuna transazione. Aggiungi una transazione per iniziare a tracciare il tuo portafoglio.
        </Typography>
        <Button 
          variant="contained"
          color="primary"
          href="/transactions"
        >
          Aggiungi Transazione
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Intestazione con titolo e pulsante di aggiornamento */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Il Mio Portafoglio</Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefreshPortfolio}
            disabled={loading}
          >
            {loading ? 'Aggiornamento...' : 'Aggiorna Prezzi'}
          </Button>
        </Box>
      </Grid>

      {/* Riepilogo del portafoglio */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Riepilogo
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <PortfolioSummary data={portfolioData} />
        </Paper>
      </Grid>

      {/* Allocazione del portafoglio */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Allocazione del Portafoglio
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <PortfolioAllocation assets={portfolioData.assets} />
        </Paper>
      </Grid>

      {/* Performance del portafoglio */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <PortfolioPerformance data={performanceData} />
        </Paper>
      </Grid>

      {/* Elenco dettagliato degli asset */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Tutti gli Asset" />
              <Tab label="In Profitto" />
              <Tab label="In Perdita" />
            </Tabs>
          </Box>
          
          <PortfolioAssetsList 
            assets={portfolioData.assets} 
            tabValue={tabValue} 
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Portfolio;