// src/pages/Transactions.tsx

import React, { useState, useRef } from 'react';
import { 
  Grid, Paper, Typography, Button, Box, CircularProgress, 
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';
import EnhancedTransactionList from '../components/transactions/EnhancedTransactionList';
import EnhancedTransactionForm, { TransactionFormRef } from '../components/transactions/EnhancedTransactionForm';

/**
 * Pagina principale per la gestione delle transazioni
 * Permette di visualizzare, filtrare, aggiungere, modificare ed eliminare transazioni
 */
const Transactions: React.FC = () => {
  // Hooks per accedere al contesto dell'applicazione e alle notifiche
  const { state, fetchTransactions, addTransaction } = useAppContext();
  const { showNotification } = useNotification();
  const { error: localError, withErrorHandling } = useErrorHandler('TransactionsPage');
  
  // Stato per il tab attivo e il dialogo di aggiunta transazione
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Riferimento al form di transazione per accedere ai suoi metodi
  const formRef = useRef<TransactionFormRef>(null);

  // Estrae i dati dal contesto
  const {
    transactions: { data: transactions, loading, error: contextError },
    cryptos: { data: cryptos }
  } = state;

  /**
   * Gestisce il cambio di tab
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  /**
   * Apre il dialog per aggiungere una nuova transazione
   */
  const handleOpenTransactionDialog = () => {
    setOpenDialog(true);
  };

  /**
   * Chiude il dialog di aggiunta transazione
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  /**
   * Aggiunge una nuova transazione
   */
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

  /**
   * Ricarica le transazioni dal server
   */
  const handleRefresh = async () => {
    await withErrorHandling(
      async () => {
        await fetchTransactions();
        showNotification('Transazioni aggiornate', 'success');
      },
      'refreshTransactions'
    );
  };
  
  /**
   * Gestisce il click sul pulsante di salvataggio nel dialog
   */
  const handleSaveClick = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  // Errore da mostrare (dal context o dal componente locale)
  const displayError = localError.hasError ? localError.message : contextError;

  // Stato di caricamento - mostra un indicatore di progresso
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
        {/* Intestazione con titolo e pulsante per aggiungere transazioni */}
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
        
        {/* Visualizzazione errori */}
        {displayError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={handleRefresh}
              >
                Riprova
              </Button>
            }
          >
            {displayError}
          </Alert>
        )}
        
        {/* Container principale con tabs e lista transazioni */}
        <Paper sx={{ width: '100%' }}>
          {/* Tabs per filtrare le transazioni per tipo */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Tutte le Transazioni" />
              <Tab label="Acquisti" />
              <Tab label="Vendite" />
              <Tab label="Airdrop" />
              <Tab label="Farming" />
            </Tabs>
          </Box>
          
          {/* Lista delle transazioni */}
          <Box sx={{ p: 2 }}>
            <EnhancedTransactionList 
              transactions={transactions} 
              tabValue={tabValue} 
              onRefresh={handleRefresh}
              cryptos={cryptos}
            />
          </Box>
        </Paper>
      </Grid>
      
      {/* Dialog per aggiungere transazioni */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Aggiungi Transazione
        </DialogTitle>
        <DialogContent>
          <EnhancedTransactionForm 
            cryptos={cryptos} 
            onSubmit={handleAddTransaction}
            ref={formRef}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveClick}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Transactions;