// client/src/components/portfolio/PortfolioPerformance.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { cryptoApi } from '../../services/api';

interface PortfolioPerformanceProps {
  data: any;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ data }) => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('1y');
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

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gestisce il cambio di intervallo temporale
  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newRange: string | null) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Se i dati non sono disponibili
  if (!data || !data.timeline || data.timeline.length === 0) {
    return (
      <Typography variant="body1">
        Dati di performance non disponibili. Aggiungi transazioni per visualizzare la performance.
      </Typography>
    );
  }

  // Formatta i dati per il grafico di performance
  const performanceChartData = data.timeline.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('it-IT'),
    valore: item.estimatedValue,
    investimento: item.totalInvestment
  }));

  // Calcola le metriche di performance
  const latestSnapshot = data.timeline[data.timeline.length - 1];
  const totalInvestment = latestSnapshot.totalInvestment || 0;
  const currentValue = latestSnapshot.estimatedValue || 0;
  const totalProfitLoss = currentValue - totalInvestment;
  const totalROI = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
  const isProfit = totalProfitLoss >= 0;

  // Calcola l'equivalente in euro
  const euroEquivalent = currentValue * euroRate;

  // Funzione per formattare valori monetari
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Funzione per formattare valori in euro
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Funzione per formattare percentuali
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Customizza il tooltip del grafico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, border: 'none', boxShadow: 2 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {label}
            </Typography>
            {payload.map((entry: any, index: number) => (
              <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: entry.color,
                    mr: 1,
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="caption" sx={{ mr: 1 }}>
                  {entry.name}:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(entry.value)}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={3}>
      {/* Selettore intervallo temporale */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Valore del Portafoglio" />
            <Tab label="ROI nel Tempo" />
          </Tabs>
          
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            aria-label="Periodo di tempo"
          >
            <ToggleButton value="1m">1M</ToggleButton>
            <ToggleButton value="3m">3M</ToggleButton>
            <ToggleButton value="6m">6M</ToggleButton>
            <ToggleButton value="1y">1A</ToggleButton>
            <ToggleButton value="all">Tutti</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Grid>

      {/* Grafico di performance */}
      <Grid item xs={12}>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => formatCurrency(value).split(',')[0]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="valore"
                name="Valore del Portafoglio"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="investimento"
                name="Investimento Totale"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Metriche di performance */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Investimento Totale
            </Typography>
            <Typography variant="h4">
              {formatCurrency(totalInvestment)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Valore Attuale
            </Typography>
            <Typography variant="h4">
              {formatCurrency(currentValue)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatEuro(euroEquivalent)} (EUR)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ 
          height: '100%', 
          bgcolor: isProfit ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
          border: `1px solid ${isProfit ? 'rgba(46, 125, 50, 0.5)' : 'rgba(211, 47, 47, 0.5)'}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                Profitto/Perdita
              </Typography>
              {isProfit ? (
                <TrendingUpIcon color="success" fontSize="small" />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" />
              )}
            </Box>
            <Typography variant="h4" color={isProfit ? 'success.main' : 'error.main'}>
              {formatCurrency(totalProfitLoss)}
            </Typography>
            <Typography variant="body2" color={isProfit ? 'success.main' : 'error.main'}>
              ROI: {formatPercentage(totalROI)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PortfolioPerformance;