// src/components/dashboard/PerformanceChart.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton, Button, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import { formatCurrency } from '../../utils';

const PerformanceChart: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('1y');
  
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('PerformanceChart');

  const fetchPerformanceData = useCallback(async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        
        const response = await analyticsApi.getHistoricalPerformance(period);
        setPerformanceData(response.data.data.timeline || []);
        
        setLoading(false);
      },
      'fetchData'
    );
  }, [period, withErrorHandling]);

  useEffect(() => {
    fetchPerformanceData();
  }, [period, fetchPerformanceData]);

  const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: string) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Formattazione dei dati per il grafico
  const chartData = performanceData.map(snapshot => ({
    date: new Date(snapshot.date).toLocaleDateString('it-IT'),
    value: snapshot.estimatedValue,
    investment: snapshot.totalInvestment
  }));

  if (loading && performanceData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Visualizzazione dell'errore
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
          onClick={() => fetchPerformanceData()}
          size="small"
          sx={{ mt: 1 }}
        >
          Riprova
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="1m">1M</ToggleButton>
          <ToggleButton value="3m">3M</ToggleButton>
          <ToggleButton value="6m">6M</ToggleButton>
          <ToggleButton value="1y">1A</ToggleButton>
          <ToggleButton value="all">Tutti</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value) => formatCurrency(value as number, 'EUR')}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8884d8" 
            name="Valore Portafoglio" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="investment" 
            stroke="#82ca9d" 
            name="Investimento" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PerformanceChart;