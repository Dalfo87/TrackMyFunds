// client/src/components/dashboard/PortfolioSummary.tsx

import React, { useEffect, useState } from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { cryptoApi } from '../../services/api';

interface PortfolioSummaryProps {
  data: {
    totalValue?: number;
    totalInvestment?: number;
    totalProfitLoss?: number;
    totalROI?: number;
  } | null;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ data }) => {
  const [euroRate, setEuroRate] = useState<number>(0);

  useEffect(() => {
    // Recupera il tasso di cambio EUR/USD usando la crypto "euro-coin"
    const fetchEuroRate = async () => {
      try {
        const response = await cryptoApi.getBySymbol('EURC');
        if (response.data && response.data.currentPrice) {
          setEuroRate(response.data.currentPrice);
        } else {
          // Valore fallback nel caso in cui l'API non restituisca un dato valido
          setEuroRate(0.91); // Valore approssimativo EUR/USD
        }
      } catch (error) {
        console.error('Errore nel recupero del tasso di cambio EUR/USD:', error);
        setEuroRate(0.91); // Valore fallback in caso di errore
      }
    };

    fetchEuroRate();
  }, []);

  if (!data) return <Typography>Dati non disponibili</Typography>;

  const { totalValue, totalInvestment, totalProfitLoss } = data;
  const isProfit = (totalProfitLoss ?? 0) >= 0;

  // Funzione per formattare i valori monetari
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      value = 0;
    }
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Calcola l'equivalente in euro
  const calculateEuroEquivalent = (value: number | undefined | null) => {
    if (value === undefined || value === null || euroRate === 0) {
      return '0.00 €';
    }
    const euroValue = value * euroRate;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(euroValue);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4" align="center">
            {formatCurrency(totalValue)}
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Valore Totale
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body1">
            {formatCurrency(totalInvestment)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Investimento
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isProfit ? (
              <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
            ) : (
              <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
            )}
            <Typography 
              variant="body1"
              color={isProfit ? 'success.main' : 'error.main'}
            >
              {formatCurrency(totalProfitLoss)}
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Profitto/Perdita
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Box 
            sx={{ 
              bgcolor: 'info.main',
              color: 'white',
              p: 1.5,
              borderRadius: 1,
              mt: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6">
              Eq. in Euro: {calculateEuroEquivalent(totalValue)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortfolioSummary;