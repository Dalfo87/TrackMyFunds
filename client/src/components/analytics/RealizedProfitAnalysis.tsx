// src/components/analytics/RealizedProfitAnalysis.tsx

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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNotification } from '../../context/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import { realizedProfitApi } from '../../services/apiService';
import { 
  formatCurrency, 
  formatPercentage,
  getProfitLossIcon,
  getProfitLossColor
} from '../../utils';

interface RealizedProfitAnalysisProps {}

const RealizedProfitAnalysis: React.FC<RealizedProfitAnalysisProps> = () => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [periodData, setPeriodData] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string>('month');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(1, 'year'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('RealizedProfitAnalysis');

  // Carica i dati all'inizio e quando cambiano i filtri
  useEffect(() => {
    const fetchData = async () => {
      await withErrorHandling(
        async () => {
          setLoading(true);

          // Prepara i parametri per le query
          const params: any = {};
          if (startDate) {
            params.startDate = startDate.format('YYYY-MM-DD');
          }
          if (endDate) {
            params.endDate = endDate.format('YYYY-MM-DD');
          }
          if (selectedCrypto) {
            params.cryptoSymbol = selectedCrypto;
          }

          // Richieste parallele per i diversi dati
          const [summaryResponse, transactionsResponse, periodResponse] = await Promise.all([
            realizedProfitApi.getTotal(params),
            realizedProfitApi.getAll(params),
            realizedProfitApi.getByPeriod(groupBy)
          ]);
          
          setSummaryData(summaryResponse.data);
          setTransactions(transactionsResponse.data);
          setPeriodData(periodResponse.data);
          
          setLoading(false);
        },
        'fetchData'
      );
    };

    fetchData();
  }, [withErrorHandling, groupBy, startDate, endDate, selectedCrypto]);

  // Gestione del cambio di periodo
  const handleGroupByChange = (event: SelectChangeEvent) => {
    setGroupBy(event.target.value);
  };

  // Filtro per criptovaluta
  const handleCryptoChange = (event: SelectChangeEvent) => {
    setSelectedCrypto(event.target.value);
  };

  // Ricarica i dati
  const handleRefresh = async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        
        const params: any = {};
        if (startDate) {
          params.startDate = startDate.format('YYYY-MM-DD');
        }
        if (endDate) {
          params.endDate = endDate.format('YYYY-MM-DD');
        }
        if (selectedCrypto) {
          params.cryptoSymbol = selectedCrypto;
        }

        const [summaryResponse, transactionsResponse, periodResponse] = await Promise.all([
          realizedProfitApi.getTotal(params),
          realizedProfitApi.getAll(params),
          realizedProfitApi.getByPeriod(groupBy)
        ]);
        
        setSummaryData(summaryResponse.data);
        setTransactions(transactionsResponse.data);
        setPeriodData(periodResponse.data);
        
        setLoading(false);
        showNotification('Dati aggiornati con successo', 'success');
      },
      'refreshData'
    );
  };

  // Componente personalizzato per il tooltip del grafico
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, border: 'none' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {payload[0].payload.period}
          </Typography>
          <Typography variant="body2">
            Profitto: {formatCurrency(payload[0].value)}
          </Typography>
          <Typography variant="body2">
            ROI: {formatPercentage(payload[0].payload.profitPercentage)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Transazioni: {payload[0].payload.tradesCount}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading && !summaryData) {
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

  if (!summaryData || (transactions.length === 0 && periodData.length === 0)) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Nessun dato disponibile
        </Typography>
        <Typography variant="body1" paragraph>
          Non ci sono dati di profitti/perdite realizzati. Effettua delle vendite di criptovalute verso stablecoin o valuta fiat per vedere questi dati.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          href="/transactions"
        >
          Vai alle Transazioni
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
              <DatePicker
                label="Data Inizio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
              <DatePicker
                label="Data Fine"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Criptovaluta</InputLabel>
              <Select
                value={selectedCrypto}
                label="Criptovaluta"
                onChange={handleCryptoChange}
              >
                <MenuItem value="">Tutte</MenuItem>
                {/* Qui popoliamo con le crypto disponibili */}
                {summaryData && summaryData.cryptoBreakdown && Object.keys(summaryData.cryptoBreakdown).map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Raggruppa per</InputLabel>
              <Select
                value={groupBy}
                label="Raggruppa per"
                onChange={handleGroupByChange}
              >
                <MenuItem value="day">Giorno</MenuItem>
                <MenuItem value="week">Settimana</MenuItem>
                <MenuItem value="month">Mese</MenuItem>
                <MenuItem value="year">Anno</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <Button 
              variant="outlined" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Aggiornamento...' : 'Aggiorna'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Riepilogo generale */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Riepilogo Profitti/Perdite Realizzati
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: summaryData.totalRealizedProfit >= 0 ? 'success.main' : 'error.main',
                  color: 'white'
                }}>
                  <Typography variant="overline" display="block">
                    Profitto/Perdita Totale
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(summaryData.totalRealizedProfit)}
                  </Typography>
                  <Typography variant="body2">
                    ROI: {formatPercentage(summaryData.totalProfitPercentage)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                  <Typography variant="overline" display="block">
                    Investimento Totale
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summaryData.totalCostBasis)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                  <Typography variant="overline" display="block">
                    Ricavi Totali
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summaryData.totalProceeds)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                  <Typography variant="overline" display="block">
                    Transazioni
                  </Typography>
                  <Typography variant="h6">
                    {summaryData.tradesCount}
                  </Typography>
                  <Typography variant="body2">
                    {summaryData.profitableTradesCount} profittevoli ({formatPercentage(summaryData.profitableTradesPercentage)})
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Grafico dei profitti nel tempo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Profitti/Perdite Realizzati nel Tempo
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalProfit" 
                    name="Profitto/Perdita" 
                    fill="#8884d8"
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Dettaglio per criptovaluta */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Profitti per Criptovaluta
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Criptovaluta</TableCell>
                    <TableCell align="right">Profitto/Perdita</TableCell>
                    <TableCell align="right">ROI</TableCell>
                    <TableCell align="right">Transazioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData && summaryData.cryptoBreakdown && 
                   Object.entries(summaryData.cryptoBreakdown)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => b.totalProfit - a.totalProfit)
                    .map(([symbol, data]: [string, any]) => (
                      <TableRow key={symbol} hover>
                        <TableCell>{symbol}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {getProfitLossIcon(data.totalProfit, { fontSize: "small", sx: { mr: 0.5 } })}
                            <Typography
                              variant="body2"
                              color={getProfitLossColor(data.totalProfit)}
                            >
                              {formatCurrency(data.totalProfit)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={getProfitLossColor(data.avgProfitPercentage)}
                          >
                            {formatPercentage(data.avgProfitPercentage)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {data.profitableCount + data.unprofitableCount}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Dettaglio transazioni */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Transazioni Recenti
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Crypto</TableCell>
                    <TableCell align="right">Quantità</TableCell>
                    <TableCell align="right">Venduto a</TableCell>
                    <TableCell align="right">Profitto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => (
                    <TableRow key={tx._id} hover>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.sourceCryptoSymbol} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {tx.soldQuantity.toFixed(4)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(tx.sellPrice)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {getProfitLossIcon(tx.realizedProfitLoss, { fontSize: "small", sx: { mr: 0.5 } })}
                          <Typography
                            variant="body2"
                            color={getProfitLossColor(tx.realizedProfitLoss)}
                          >
                            {formatCurrency(tx.realizedProfitLoss)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealizedProfitAnalysis;