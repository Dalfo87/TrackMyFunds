// client/src/components/portfolio/AssetDetailsDialog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider, 
  Grid, 
  Chip,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { transactionApi } from '../../services/api';

interface AssetDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  asset: any;
}

const AssetDetailsDialog: React.FC<AssetDetailsDialogProps> = ({ open, onClose, asset }) => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Funzione per recuperare le transazioni dell'asset
  const fetchTransactions = useCallback(async () => {
    if (!asset || !asset.cryptoSymbol) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In una implementazione reale, dovresti avere un endpoint per recuperare
      // le transazioni per un asset specifico. Per ora, simuliamo
      const response = await transactionApi.getAll();
      
      // Filtra le transazioni per il simbolo dell'asset
      const assetTransactions = response.data.filter(
        (tx: any) => tx.cryptoSymbol === asset.cryptoSymbol
      );
      
      setTransactions(assetTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel recupero delle transazioni:', error);
      setError('Errore nel recupero delle transazioni. Riprova più tardi.');
      setLoading(false);
    }
  }, [asset]);
  
  // Carica le transazioni dell'asset quando il dialog è aperto
  useEffect(() => {
    if (open && asset) {
      fetchTransactions();
    }
  }, [open, asset, fetchTransactions]);
  
  // Funzione per formattare valori monetari in dollari
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Funzione per formattare le date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };
  
  // Funzione per formattare le quantità con max 3 decimali
  const formatQuantity = (value: number) => {
    return parseFloat(value.toFixed(3)).toString();
  };
  
  // Funzione per ottenere il colore del chip in base al tipo di transazione
  const getChipColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      case 'airdrop':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Funzione per ottenere il testo del tipo di transazione in italiano
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'buy':
        return 'Acquisto';
      case 'sell':
        return 'Vendita';
      case 'airdrop':
        return 'Airdrop';
      default:
        return type;
    }
  };
  
  // Genera dati di esempio per il grafico
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Crea un prezzo random che oscilla intorno al prezzo corrente
      const randomFactor = 0.8 + Math.random() * 0.4; // tra 0.8 e 1.2
      const price = asset.currentPrice * randomFactor;
      
      data.push({
        date: date.toLocaleDateString('it-IT'),
        price: price
      });
    }
    
    return data;
  };
  
  // Dati per il grafico
  const chartData = generateChartData();
  
  // Se l'asset non è definito, non mostrare nulla
  if (!asset) return null;
  
  // Calcola se l'asset è in profitto o in perdita
  const isProfit = asset.profitLoss >= 0;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {asset.cryptoSymbol}
            {asset.category && (
              <Chip 
                label={asset.category} 
                size="small" 
                color="default" 
                variant="outlined"
                sx={{ ml: 1, fontSize: '0.75rem' }}
              />
            )}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Riepilogo principale dell'asset */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Quantità Posseduta
            </Typography>
            <Typography variant="h6">
              {formatQuantity(asset.quantity)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Valore Attuale
            </Typography>
            <Typography variant="h6">
              {formatCurrency(asset.currentValue)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Prezzo Attuale
            </Typography>
            <Typography variant="h6">
              {formatCurrency(asset.currentPrice)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Prezzo Medio di Acquisto
            </Typography>
            <Typography variant="h6">
              {formatCurrency(asset.averagePrice)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Costo Investimento
            </Typography>
            <Typography variant="h6">
              {formatCurrency(asset.investmentValue)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Profitto/Perdita
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isProfit ? (
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
              )}
              <Typography
                variant="h6"
                color={isProfit ? 'success.main' : 'error.main'}
              >
                {formatCurrency(asset.profitLoss)} ({asset.profitLossPercentage.toFixed(2)}%)
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Tabs per navigare tra le diverse sezioni */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<ShowChartIcon />} label="Grafico" />
            <Tab icon={<SwapHorizIcon />} label="Transazioni" />
            <Tab icon={<InfoOutlinedIcon />} label="Informazioni" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ minHeight: 300 }}>
          {tabValue === 0 && (
            <Box sx={{ height: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                Andamento del Prezzo (Ultimi 30 Giorni)
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => formatCurrency(value).split(',')[0]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), "Prezzo"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Storico Transazioni
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : transactions.length === 0 ? (
                <Typography variant="body2">
                  Nessuna transazione trovata per questo asset.
                </Typography>
              ) : (
                <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {transactions.map((tx, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        p: 2, 
                        borderBottom: '1px solid', 
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={getTransactionTypeText(tx.type)} 
                          color={getChipColor(tx.type) as any}
                          size="small"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(tx.date)}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Quantità:
                          </Typography>
                          <Typography variant="body2">
                            {formatQuantity(tx.quantity)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Prezzo:
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(tx.pricePerUnit)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Importo Totale:
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(tx.totalAmount)}
                          </Typography>
                        </Grid>
                        
                        {tx.notes && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Note:
                            </Typography>
                            <Typography variant="body2">
                              {tx.notes}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Informazioni sull'Asset
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Simbolo
                    </Typography>
                    <Typography variant="body1">
                      {asset.cryptoSymbol}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Categoria
                    </Typography>
                    <Typography variant="body1">
                      {asset.category || 'Non categorizzato'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Note Aggiuntive
                    </Typography>
                    <Typography variant="body1">
                      Nessuna nota disponibile.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetDetailsDialog;