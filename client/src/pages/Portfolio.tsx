// client/src/pages/Portfolio.tsx

import React, { useEffect, useState } from 'react';
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
import { portfolioApi, analyticsApi, cryptoApi } from '../services/api';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import PortfolioAssetsList from '../components/portfolio/PortfolioAssetList';
import PortfolioAllocation from '../components/portfolio/PortfolioAllocation';
import PortfolioPerformance from '../components/portfolio/PortfolioPerformance';
import RefreshIcon from '@mui/icons-material/Refresh';

const Portfolio: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Funzione per recuperare tutti i dati per il portafoglio
  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch in parallelo per migliorare le performance
      const [portfolioValue, performanceResponse] = await Promise.all([
        portfolioApi.getValue(),
        analyticsApi.getPortfolioPerformance()
      ]);

      setPortfolioData(portfolioValue.data);
      setPerformanceData(performanceResponse.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei dati del portafoglio:', error);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      setLoading(false);
    }
  };

  // Funzione per aggiornare i prezzi delle criptovalute nel portafoglio
  const handleRefreshPortfolio = async () => {
    try {
      setLoading(true);
      // Utilizza l'endpoint per aggiornare solo le criptovalute nel portafoglio
      await cryptoApi.triggerUpdatePortfolio();
      await fetchPortfolioData();
    } catch (error) {
      console.error('Errore nell\'aggiornamento dei prezzi:', error);
      setError('Errore nell\'aggiornamento dei prezzi. Riprova più tardi.');
      setLoading(false);
    }
  };

  // Carica i dati all'avvio della pagina
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  if (loading && !portfolioData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchPortfolioData} sx={{ mt: 2 }}>
          Riprova
        </Button>
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