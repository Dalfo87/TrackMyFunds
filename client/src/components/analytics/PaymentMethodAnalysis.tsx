// src/components/analytics/PaymentMethodAnalysis.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Divider, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { analyticsApi } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import { 
  formatCurrency, 
  formatPercentage, 
  getPaymentMethodIcon, 
  getPaymentMethodName,
  PaymentMethod
} from '../../utils';

interface PaymentMethodAnalysisProps {}

const PaymentMethodAnalysis: React.FC<PaymentMethodAnalysisProps> = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('PaymentMethodAnalysis');

  // Definizione di colori per il grafico a torta
  const colors = [
    '#3f51b5', // Primary blue
    '#f50057', // Secondary pink
    '#4caf50', // Green
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#607d8b'  // Blue grey
  ];

  // Carica i dati di analisi dal backend
  useEffect(() => {
    const fetchData = async () => {
      await withErrorHandling(
        async () => {
          setLoading(true);

          const response = await analyticsApi.getInvestmentByPaymentMethod();
          setData(response.data.data);
          
          setLoading(false);
        },
        'fetchData'
      );
    };

    fetchData();
  }, [withErrorHandling]);

  // Ricarica i dati
  const handleRefresh = async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        const response = await analyticsApi.getInvestmentByPaymentMethod();
        setData(response.data.data);
        setLoading(false);
        showNotification('Dati aggiornati con successo', 'success');
      },
      'refreshData'
    );
  };

  // Genera i dati per il grafico a torta per metodo di pagamento
  const prepareChartData = () => {
    if (!data) return [];

    return Object.entries(data.percentageByMethod)
      .map(([method, percentage]) => ({
        name: getPaymentMethodName(method),
        value: data.byMethod[method].totalAmount,
        percentage,
        color: colors[Object.keys(data.percentageByMethod).indexOf(method) % colors.length]
      }))
      .filter(item => item.value > 0) // Filtra i metodi senza investimenti
      .sort((a, b) => b.value - a.value); // Ordina per valore decrescente
  };

  // Genera i dati per il grafico a torta per metodo e valuta
  const prepareDetailedChartData = () => {
    if (!data) return [];

    const result: any[] = [];
    
    Object.entries(data.byMethod).forEach(([method, methodData]: [string, any]) => {
      Object.entries(methodData.currencies).forEach(([currency, currencyData]: [string, any]) => {
        if (currencyData.totalAmount > 0) {
          result.push({
            name: `${getPaymentMethodName(method)} - ${currency}`,
            method: getPaymentMethodName(method),
            currency,
            value: currencyData.totalAmount,
            percentage: (currencyData.totalAmount / data.totalInvestment) * 100,
            color: colors[result.length % colors.length]
          });
        }
      });
    });
    
    return result.sort((a, b) => b.value - a.value); // Ordina per valore decrescente
  };

  // Componente personalizzato per il tooltip del grafico
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1, border: 'none' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            {formatCurrency(data.value)} ({formatPercentage(data.percentage)})
          </Typography>
          {data.currency && (
            <Typography variant="caption" color="textSecondary">
              Valuta: {data.currency}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Gestione dell'errore
  if (localError.hasError) {
    return (
      <Paper 
        sx={{ 
          p: 2, 
          borderLeft: '4px solid', 
          borderColor: 'error.main'
        }}
      >
        <Typography color="error">{localError.message}</Typography>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={handleRefresh}
          size="small"
          sx={{ mt: 1 }}
        >
          Riprova
        </Button>
      </Paper>
    );
  }

  if (!data || data.transactionCount === 0) {
    return (
      <Typography sx={{ p: 2 }}>
        Non ci sono dati sufficienti per l'analisi. Registra alcune transazioni di acquisto per vedere le statistiche.
      </Typography>
    );
  }

  const chartData = prepareChartData();
  const detailedChartData = prepareDetailedChartData();

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Riepilogo generale */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Riepilogo Investimenti per Metodo di Pagamento
            </Typography>
            <Typography variant="body1">
              Totale Investito: {formatCurrency(data.totalInvestment)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Numero di Transazioni: {data.transactionCount}
            </Typography>
          </Paper>
        </Grid>

        {/* Grafico a torta per metodo di pagamento */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Distribuzione per Metodo di Pagamento
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {chartData.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', p: 2 }}>
                Nessun dato disponibile per il grafico
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Tabella dei dati */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Dettaglio per Metodo di Pagamento
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metodo</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell align="right">%</TableCell>
                    <TableCell align="right">Transazioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(data.byMethod)
                    .filter(([_, methodData]: [string, any]) => methodData.transactionCount > 0)
                    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.totalAmount - a.totalAmount)
                    .map(([method, methodData]: [string, any]) => (
                      <TableRow key={method} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 1 }}>{getPaymentMethodIcon(method, { fontSize: "small" })}</Box>
                            {getPaymentMethodName(method)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(methodData.totalAmount)}</TableCell>
                        <TableCell align="right">{formatPercentage(data.percentageByMethod[method])}</TableCell>
                        <TableCell align="right">{methodData.transactionCount}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Dettaglio per valuta */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Dettaglio per Valuta di Pagamento
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300 }}>
                  {detailedChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={detailedChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          labelLine={false}
                          label={({ currency, percent }) => `${currency} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {detailedChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" sx={{ textAlign: 'center', p: 2 }}>
                      Nessun dato disponibile per il grafico
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metodo</TableCell>
                        <TableCell>Valuta</TableCell>
                        <TableCell align="right">Importo</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailedChartData.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{item.method}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.currency} 
                              size="small" 
                              variant="outlined"
                              color={item.method.includes('Cryptocurrency') ? "secondary" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                          <TableCell align="right">{formatPercentage(item.percentage)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentMethodAnalysis;