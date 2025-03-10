// client/src/components/portfolio/PortfolioAllocation.tsx

import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Paper,
  Chip,
  useTheme,
  Alert
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils';
import useErrorHandler from '../../hooks/useErrorHandler';

interface PortfolioAllocationProps {
  assets: any[];
}

const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({ assets }) => {
  const theme = useTheme();
  const { error: localError } = useErrorHandler('PortfolioAllocation');

  // Colori per il grafico a torta
  const colors = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#8dd1e1',
    '#a4de6c',
    '#d0ed57',
    '#83a6ed',
    '#8884d8',
  ], [theme.palette.primary.main, theme.palette.secondary.main, 
      theme.palette.success.main, theme.palette.error.main,
      theme.palette.warning.main, theme.palette.info.main]);

  // Calcola i dati per il grafico a torta
  const pieData = useMemo(() => {
    // Se non ci sono asset, restituisci un array vuoto
    if (!assets || assets.length === 0) return [];

    // Calcola il valore totale del portafoglio
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    
    // Crea array di dati per il grafico
    const data = assets.map((asset, index) => ({
      name: asset.cryptoSymbol,
      value: asset.currentValue,
      percentage: (asset.currentValue / totalValue) * 100,
      color: colors[index % colors.length]
    }));
    
    // Ordina per valore decrescente
    return data.sort((a, b) => b.value - a.value);
  }, [assets, colors]);

  // Calcola i dati per allocazione per categoria
  const categoryData = useMemo(() => {
    // Se non ci sono asset, restituisci un array vuoto
    if (!assets || assets.length === 0) return [];

    const categories: {[key: string]: number} = {};
    
    // Raggruppa per categoria
    assets.forEach(asset => {
      const category = asset.category || 'Non categorizzato';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += asset.currentValue;
    });
    
    // Calcola il valore totale
    const totalValue = Object.values(categories).reduce((sum, value) => sum + value, 0);
    
    // Crea array di dati per il grafico
    return Object.entries(categories).map(([category, value], index) => ({
      name: category,
      value,
      percentage: (value / totalValue) * 100,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [assets, colors]);

  // Formatter personalizzato per il tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2">
            <strong>{payload[0].name}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatCurrency(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatPercentage(payload[0].payload.percentage)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Se c'è un errore, mostralo
  if (localError.hasError) {
    return (
      <Alert severity="error">
        Errore nell'elaborazione dei dati di allocazione: {localError.message}
      </Alert>
    );
  }

  // Se non ci sono asset, mostra un messaggio appropriato
  if (!assets || assets.length === 0) {
    return (
      <Alert severity="info">
        Nessun asset disponibile nel portafoglio. Aggiungi transazioni per visualizzare l'allocazione.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Grafico di allocazione per asset */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Allocazione per Asset
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Grafico di allocazione per categoria */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Allocazione per Categoria
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Elenco dei principali asset */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Principali Asset nel Portafoglio
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {pieData.slice(0, 10).map((asset, index) => (
            <Chip
              key={index}
              label={`${asset.name} (${formatPercentage(asset.percentage, 1)})`}
              style={{ backgroundColor: asset.color, color: 'white' }}
            />
          ))}
        </Box>
      </Grid>
    </Grid>
  );
};

export default PortfolioAllocation;