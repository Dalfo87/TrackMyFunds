// client/src/pages/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Button, Box, CircularProgress } from '@mui/material';
import { portfolioApi, analyticsApi, cryptoApi } from '../services/api';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import TopAssets from '../components/dashboard/TopAssets';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import MarketOverview from '../components/dashboard/MarketOverview';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>([]);
  const [error, setError] = useState<string | null>(null);

  // Funzione per aggiornare i prezzi delle criptovalute
  const handleUpdatePrices = async () => {
    try {
      setLoading(true);
      await cryptoApi.triggerUpdate();
      fetchDashboardData();
    } catch (error) {
      console.error('Errore nell\'aggiornamento dei prezzi:', error);
      setError('Errore nell\'aggiornamento dei prezzi. Riprova più tardi.');
    }
  };

  // Funzione per recuperare tutti i dati per la dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch in parallelo per migliorare le performance
      const [portfolioValue, performanceResponse, cryptosResponse] = await Promise.all([
        portfolioApi.getValue(),
        analyticsApi.getPortfolioPerformance(),
        cryptoApi.getAll()
      ]);

      setPortfolioData(portfolioValue.data);
      setPerformanceData(performanceResponse.data.data);
      setMarketData(cryptosResponse.data.slice(0, 10)); // Top 10 criptovalute
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei dati della dashboard:', error);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      setLoading(false);
    }
  };

  // Carica i dati all'avvio della pagina
  useEffect(() => {
    fetchDashboardData();
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
        <Button variant="contained" onClick={fetchDashboardData} sx={{ mt: 2 }}>
          Riprova
        </Button>
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
            <Button variant="outlined" size="small" onClick={handleUpdatePrices}>
              Aggiorna Prezzi
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
          <TopAssets data={performanceData?.assets || []} />
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
          <MarketOverview data={marketData} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;