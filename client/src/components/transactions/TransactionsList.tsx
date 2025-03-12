// src/components/transactions/TransactionsList.tsx

import React, { useState, useRef } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Box, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { transactionApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import TransactionForm, { TransactionFormRef } from './TransactionForm';
import { 
  formatCurrency, 
  formatDate, 
  formatQuantity,
  getTransactionTypeText,
  getTransactionTypeColor,
  getTransactionTypeIcon,
  getPaymentMethodIcon,
  getPaymentMethodName,
  PaymentMethod,
  TransactionType
} from '../../utils';

interface TransactionsListProps {
  transactions: any[];
  tabValue: number;
  onRefresh: () => void;
  cryptos?: any[];
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions, 
  tabValue, 
  onRefresh, 
  cryptos = [] 
}) => {
  const { showNotification } = useNotification();
  const { handleError, withErrorHandling } = useErrorHandler('TransactionsList');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  
  // Crea un ref per accedere ai metodi del form
  const formRef = useRef<TransactionFormRef>(null);

  if (!transactions || transactions.length === 0) {
    return <Typography>Nessuna transazione disponibile</Typography>;
  }

  // Filtra le transazioni in base al tab selezionato
  const filteredTransactions = transactions.filter(tx => {
    if (tabValue === 0) return true; // Tutte le transazioni
    if (tabValue === 1) return tx.type === 'buy'; // Solo acquisti
    if (tabValue === 2) return tx.type === 'sell'; // Solo vendite
    if (tabValue === 3) return tx.type === 'airdrop'; // Solo airdrop
    if (tabValue === 4) return tx.type === 'farming'; // Solo farming
    return true;
  });

  // Gestisce l'apertura del dialog di conferma per l'eliminazione
  const handleOpenDeleteDialog = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  // Gestisce la chiusura del dialog di conferma per l'eliminazione
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Gestisce l'eliminazione di una transazione
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    await withErrorHandling(
      async () => {
        await transactionApi.delete(selectedTransaction._id);
        handleCloseDeleteDialog();
        onRefresh(); // Ricarica i dati
        showNotification('Transazione eliminata con successo', 'success');
      },
      'deleteTransaction'
    );
  };

  // Gestisce l'apertura del dialog di modifica
  const handleOpenEditDialog = (transaction: any) => {
    setTransactionToEdit(transaction);
    setEditDialogOpen(true);
  };

  // Gestisce la chiusura del dialog di modifica
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setTransactionToEdit(null);
  };

  // Gestisce l'aggiornamento di una transazione
  const handleUpdateTransaction = async (updatedData: any) => {
    if (!transactionToEdit) return;
    
    await withErrorHandling(
      async () => {
        await transactionApi.update(transactionToEdit._id, updatedData);
        handleCloseEditDialog();
        showNotification('Transazione aggiornata con successo', 'success');
        onRefresh(); // Ricarica i dati
      },
      'updateTransaction'
    );
  };
  
  // Gestisce il click sul pulsante di salvataggio
  const handleSaveClick = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Criptovaluta</TableCell>
              <TableCell align="right">Quantità</TableCell>
              <TableCell align="right">Prezzo</TableCell>
              <TableCell align="right">Totale</TableCell>
              <TableCell align="right">Metodo Pagamento</TableCell>
              <TableCell align="right">Valuta</TableCell>
              <TableCell align="right">Categoria</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx._id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>
                  <Chip 
                    label={getTransactionTypeText(tx.type)} 
                    color={getTransactionTypeColor(tx.type)}
                    size="small"
                    icon={getTransactionTypeIcon(tx.type, { fontSize: "small" }) || undefined}
                  />
                </TableCell>
                <TableCell>{tx.cryptoSymbol}</TableCell>
                <TableCell align="right">{formatQuantity(tx.quantity)}</TableCell>
                <TableCell align="right">
                  {tx.type === 'airdrop' || tx.type === 'farming'
                    ? '0' 
                    : formatCurrency(tx.pricePerUnit)
                  }
                </TableCell>
                <TableCell align="right">
                  {tx.type === 'airdrop' || tx.type === 'farming'
                    ? '0' 
                    : formatCurrency(tx.totalAmount)
                  }
                </TableCell>
                <TableCell align="right">
                  {/* Per le transazioni farming, mostra diversamente il metodo di pagamento */}
                  {tx.type === 'farming' && tx.paymentMethod ? (
                    <Tooltip title="Crypto di origine">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Chip 
                          label="Origin" 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    </Tooltip>
                  ) : (tx.type === 'buy' || tx.type === 'sell') && tx.paymentMethod ? (
                    <Tooltip title={getPaymentMethodName(tx.paymentMethod)}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {getPaymentMethodIcon(tx.paymentMethod, { fontSize: 'small' })}
                      </Box>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {/* Per le transazioni farming, mostra la crypto di origine */}
                  {tx.type === 'farming' && tx.paymentCurrency ? (
                    <Tooltip title={`Crypto di origine: ${tx.paymentCurrency}`}>
                      <Chip 
                        label={tx.paymentCurrency} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                    </Tooltip>
                  ) : (tx.type === 'buy' || tx.type === 'sell') && tx.paymentCurrency ? (
                    <Chip 
                      label={tx.paymentCurrency} 
                      size="small" 
                      variant="outlined"
                      color={tx.paymentCurrency === 'USDT' ? "warning" : (tx.paymentMethod === PaymentMethod.CRYPTO ? "secondary" : "default")}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {tx.category || '-'}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenEditDialog(tx)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(tx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog di conferma per l'eliminazione */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.
          </Typography>
          {selectedTransaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {getTransactionTypeText(selectedTransaction.type)} di {formatQuantity(selectedTransaction.quantity)} {selectedTransaction.cryptoSymbol}
              </Typography>
              <Typography variant="body2">
                Data: {formatDate(selectedTransaction.date)}
              </Typography>
              {selectedTransaction.type !== 'airdrop' && selectedTransaction.type !== 'farming' && (
                <Typography variant="body2">
                  Importo: {formatCurrency(selectedTransaction.totalAmount)}
                </Typography>
              )}
              {selectedTransaction.type === 'farming' && selectedTransaction.paymentCurrency && (
                <Typography variant="body2">
                  Crypto di origine: {selectedTransaction.paymentCurrency}
                </Typography>
              )}
              {selectedTransaction.type === 'buy' && selectedTransaction.paymentMethod && (
                <Typography variant="body2">
                  Pagamento: {getPaymentMethodName(selectedTransaction.paymentMethod)} 
                  {selectedTransaction.paymentCurrency && ` (${selectedTransaction.paymentCurrency})`}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annulla</Button>
          <Button onClick={handleDeleteTransaction} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per la modifica di una transazione */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Modifica Transazione
        </DialogTitle>
        <DialogContent>
          {transactionToEdit && (
            <TransactionForm 
              cryptos={cryptos}
              onSubmit={handleUpdateTransaction}
              transaction={transactionToEdit}
              ref={formRef}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveClick}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionsList;