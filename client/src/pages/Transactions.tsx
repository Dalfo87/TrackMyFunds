// client/src/pages/Transactions.tsx

import React, { useState, useEffect } from 'react';
import { 
  Grid, Paper, Typography, Button, Box, CircularProgress, 
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { transactionApi, cryptoApi } from '../services/api';
import TransactionsList from '../components/transactions/TransactionsList';
import TransactionForm from '../components/transactions/TransactionForm';

const Transactions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  // Carica i dati all'avvio della pagina
  useEffect(() => {
    fetchData();
  }, []);

  // Funzione per recuperare dati di transazioni e criptovalute
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch in parallelo per migliorare le performance
      const [transactionsResponse, cryptosResponse] = await Promise.all([
        transactionApi.getAll(),
        cryptoApi.getAll()
      ]);

      setTransactions(transactionsResponse.data);
      setCryptos(cryptosResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei dati delle transazioni:', error);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      setLoading(false);
    }
  };

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Apre il dialog per aggiungere una nuova transazione
  const handleOpenTransactionDialog = () => {
    setOpenDialog(true);
  };

  // Chiude il dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Aggiunge una nuova transazione (standard o airdrop)
  const handleAddTransaction = async (transactionData: any) => {
    try {
      // Determina se è un airdrop o una transazione normale in base al tipo
      if (transactionData.type === 'airdrop') {
        await transactionApi.recordAirdrop(transactionData);
      } else {
        await transactionApi.add(transactionData);
      }
      
      handleCloseDialog();
      fetchData(); // Ricarica i dati
    } catch (error) {
      console.error('Errore nell\'aggiunta della transazione:', error);
      setError('Errore nell\'aggiunta della transazione. Riprova più tardi.');
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Transazioni</Typography>
          <Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenTransactionDialog}
            >
              Nuova Transazione
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Tutte le Transazioni" />
              <Tab label="Acquisti" />
              <Tab label="Vendite" />
              <Tab label="Airdrop" />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 2 }}>
            <TransactionsList 
              transactions={transactions} 
              tabValue={tabValue} 
              onRefresh={fetchData}
              cryptos={cryptos} // Passa la lista delle criptovalute al componente
            />
          </Box>
        </Paper>
      </Grid>
      
      {/* Dialog per aggiungere transazioni con supporto per tutti i tipi */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Aggiungi Transazione
        </DialogTitle>
        <DialogContent>
          <TransactionForm 
            cryptos={cryptos} 
            onSubmit={handleAddTransaction} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Transactions;