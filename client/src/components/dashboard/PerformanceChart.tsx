// client/src/components/dashboard/PerformanceChart.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../services/api';

const PerformanceChart: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('1y');

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsApi.getHistoricalPerformance(period);
      setPerformanceData(response.data.data.timeline || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei dati di performance:', error);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      setLoading(false);
    }
  }, [period]); // period è l'unica dipendenza esterna di questa funzione

  // Modifica in src/components/dashboard/PerformanceChart.tsx
  useEffect(() => {
    fetchPerformanceData();
      }, [period, fetchPerformanceData]); // Aggiungi fetchPerformanceData alle dipendenze

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

  if (error) {
    return <Typography color="error">{error}</Typography>;
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
            formatter={(value) => new Intl.NumberFormat('it-IT', {
              style: 'currency',
              currency: 'EUR'
            }).format(value as number)}
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