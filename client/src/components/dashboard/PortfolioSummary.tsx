// client/src/components/dashboard/PortfolioSummary.tsx

import React from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface PortfolioSummaryProps {
  data: {
    totalValue?: number;
    totalInvestment?: number;
    totalProfitLoss?: number;
    totalROI?: number;
  } | null;
}

// Questo rende esplicito che data potrebbe essere null o
// potrebbe non avere tutte le proprietà

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ data }) => {
  if (!data) return <Typography>Dati non disponibili</Typography>;

  const { totalValue, totalInvestment, totalProfitLoss, totalROI } = data;
  const isProfit = (totalProfitLoss ?? 0) >= 0;

  // Funzione per formattare i valori monetari
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      value = 0;
    }
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Funzione per formattare le percentuali
  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      return '0.00%'; // Valore predefinito quando value è undefined o null
    }
    return `${value.toFixed(2)}%`;
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
              bgcolor: isProfit ? 'success.main' : 'error.main',
              color: 'white',
              p: 1.5,
              borderRadius: 1,
              mt: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6">
              ROI: {formatPercentage(totalROI)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortfolioSummary;