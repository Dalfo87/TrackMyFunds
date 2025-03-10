// src/pages/Transactions.tsx

import React, { useState } from 'react';
import { 
  Grid, Paper, Typography, Button, Box, CircularProgress, 
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';
import TransactionsList from '../components/transactions/TransactionsList';
import TransactionForm from '../components/transactions/TransactionForm';

const Transactions: React.FC = () => {
  const { state, fetchTransactions, addTransaction } = useAppContext();
  const { showNotification } = useNotification();
  const { error: localError, handleError, withErrorHandling } = useErrorHandler('TransactionsPage');
  
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  // Estrai i dati dal context
  const {
    transactions: { data: transactions, loading, error: contextError },
    cryptos: { data: cryptos }
  } = state;

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
    await withErrorHandling(
      async () => {
        const success = await addTransaction(transactionData);
        
        if (success) {
          handleCloseDialog();
          showNotification('Transazione aggiunta con successo!', 'success');
        } else {
          showNotification('Errore nell\'aggiunta della transazione', 'error');
        }
      },
      'addTransaction'
    );
  };

  // Ricarica le transazioni
  const handleRefresh = async () => {
    await withErrorHandling(
      async () => {
        await fetchTransactions();
        showNotification('Transazioni aggiornate', 'success');
      },
      'refreshTransactions'
    );
  };

  // Errore da mostrare (dal context o dal componente locale)
  const displayError = localError.hasError ? localError.message : contextError;

  // Loading state
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
        
        {displayError && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderLeft: '4px solid', 
              borderColor: 'error.main',
              bgcolor: 'error.dark',
              color: 'error.contrastText'
            }}
          >
            <Typography>{displayError}</Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 1, color: 'white', borderColor: 'white' }}
              onClick={handleRefresh}
              size="small"
            >
              Riprova
            </Button>
          </Paper>
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
              onRefresh={handleRefresh}
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