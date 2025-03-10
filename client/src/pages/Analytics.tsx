// src/pages/Analytics.tsx

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Button
} from '@mui/material';
import { analyticsApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';
import PaymentMethodAnalysis from '../components/analytics/PaymentMethodAnalysis';
import PortfolioPerformance from '../components/portfolio/PortfolioPerformance';

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('Analytics');

  // Carica i dati di performance
  useEffect(() => {
    const fetchAnalytics = async () => {
      await withErrorHandling(
        async () => {
          setLoading(true);
          
          const response = await analyticsApi.getPortfolioPerformance();
          setPerformanceData(response.data.data);
          
          setLoading(false);
        },
        'fetchAnalytics'
      );
    };

    fetchAnalytics();
  }, [withErrorHandling]);

  // Funzione per ricaricare i dati
  const handleRefresh = async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        const response = await analyticsApi.getPortfolioPerformance();
        setPerformanceData(response.data.data);
        setLoading(false);
        showNotification('Dati aggiornati con successo', 'success');
      },
      'refreshAnalytics'
    );
  };

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Loading state
  if (loading && !performanceData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Analisi del Portafoglio
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Analizza il tuo portafoglio in modo dettagliato, con dati su performace, costi e metodi di investimento.
        </Typography>
        
        {(localError.hasError || error) && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderLeft: '4px solid', 
              borderColor: 'error.main',
              bgcolor: 'error.dark',
              color: 'error.contrastText'
            }}
          >
            <Typography>{localError.message || error}</Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 1, color: 'white', borderColor: 'white' }}
              onClick={handleRefresh}
              size="small"
            >
              Riprova
            </Button>
          </Paper>
        )}
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="analytics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Performance Generale" />
              <Tab label="Metodi di Pagamento" />
              <Tab label="Profit/Loss Realizzato" />
              <Tab label="Analisi per Categoria" />
            </Tabs>
          </Box>

          {/* Tab Panel per la Performance Generale */}
          {tabValue === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Generale del Portafoglio
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {/* Utilizziamo il componente già esistente PortfolioPerformance */}
              <PortfolioPerformance data={performanceData} />
            </Box>
          )}

          {/* Tab Panel per l'Analisi dei Metodi di Pagamento */}
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Analisi per Metodo di Pagamento
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Questa analisi mostra come sono distribuiti i tuoi investimenti in base al metodo di pagamento utilizzato.
                Puoi distinguere facilmente tra acquisti effettuati con bonifici bancari e quelli effettuati con cryptocurrencies.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <PaymentMethodAnalysis />
            </Box>
          )}

          {/* Tab Panel per il Profit/Loss Realizzato */}
          {tabValue === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Profitto/Perdita Realizzato
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Visualizza i profitti e le perdite che hai effettivamente realizzato attraverso le vendite di criptovalute.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1">
                  Analisi dettagliata del profit/loss realizzato in arrivo con il prossimo aggiornamento!
                </Typography>
              </Box>
            </Box>
          )}

          {/* Tab Panel per l'Analisi per Categoria */}
          {tabValue === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Analisi per Categoria
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Analizza la performance delle tue criptovalute raggruppate per categoria.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1">
                  Analisi dettagliata per categoria in arrivo con il prossimo aggiornamento!
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Analytics;