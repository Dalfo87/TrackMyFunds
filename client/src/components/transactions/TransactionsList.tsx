// client/src/components/transactions/TransactionsList.tsx

import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Box, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { transactionApi } from '../../services/api';

// Enum per i metodi di pagamento (deve corrispondere a quello nel backend)
enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

interface TransactionsListProps {
  transactions: any[];
  tabValue: number;
  onRefresh: () => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, tabValue, onRefresh }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  if (!transactions || transactions.length === 0) {
    return <Typography>Nessuna transazione disponibile</Typography>;
  }

  // Filtra le transazioni in base al tab selezionato
  const filteredTransactions = transactions.filter(tx => {
    if (tabValue === 0) return true; // Tutte le transazioni
    if (tabValue === 1) return tx.type === 'buy'; // Solo acquisti
    if (tabValue === 2) return tx.type === 'sell'; // Solo vendite
    if (tabValue === 3) return tx.type === 'airdrop'; // Solo airdrop
    return true;
  });

  // Funzione per formattare i valori monetari
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

  // Funzione per ottenere l'icona e il testo del metodo di pagamento
  const getPaymentMethodInfo = (method?: string) => {
    if (!method) {
      return { icon: null, text: '-' };
    }
    
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return { 
          icon: <AccountBalanceIcon fontSize="small" />, 
          text: 'Bonifico Bancario' 
        };
      case PaymentMethod.CREDIT_CARD:
        return { 
          icon: <CreditCardIcon fontSize="small" />, 
          text: 'Carta di Credito' 
        };
      case PaymentMethod.DEBIT_CARD:
        return { 
          icon: <PaymentIcon fontSize="small" />, 
          text: 'Carta di Debito' 
        };
      case PaymentMethod.CRYPTO:
        return { 
          icon: <CurrencyExchangeIcon fontSize="small" />, 
          text: 'Cryptocurrency' 
        };
      case PaymentMethod.OTHER:
        return { 
          icon: <HelpOutlineIcon fontSize="small" />, 
          text: 'Altro' 
        };
      default:
        return { icon: null, text: method };
    }
  };

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
    
    try {
      await transactionApi.delete(selectedTransaction._id);
      handleCloseDeleteDialog();
      onRefresh(); // Ricarica i dati
    } catch (error) {
      console.error('Errore nell\'eliminazione della transazione:', error);
      // Qui potresti gestire l'errore, ad esempio mostrando un messaggio
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
                    color={getChipColor(tx.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{tx.cryptoSymbol}</TableCell>
                <TableCell align="right">{formatQuantity(tx.quantity)}</TableCell>
                <TableCell align="right">
                  {tx.type === 'airdrop' 
                    ? '0' 
                    : formatCurrency(tx.pricePerUnit)
                  }
                </TableCell>
                <TableCell align="right">
                  {tx.type === 'airdrop' 
                    ? '0' 
                    : formatCurrency(tx.totalAmount)
                  }
                </TableCell>
                <TableCell align="right">
                  {tx.type === 'buy' ? (
                    <Tooltip title={getPaymentMethodInfo(tx.paymentMethod).text}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {getPaymentMethodInfo(tx.paymentMethod).icon}
                      </Box>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {tx.type === 'buy' && tx.paymentCurrency ? (
                    <Chip 
                      label={tx.paymentCurrency} 
                      size="small" 
                      variant="outlined"
                      color={tx.paymentMethod === PaymentMethod.CRYPTO ? "secondary" : "default"}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {tx.category || '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleOpenDeleteDialog(tx)}
                  >
                    <DeleteIcon />
                  </IconButton>
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
              {selectedTransaction.type !== 'airdrop' && (
                <Typography variant="body2">
                  Importo: {formatCurrency(selectedTransaction.totalAmount)}
                </Typography>
              )}
              {selectedTransaction.type === 'buy' && selectedTransaction.paymentMethod && (
                <Typography variant="body2">
                  Pagamento: {getPaymentMethodInfo(selectedTransaction.paymentMethod).text} 
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
    </>
  );
};

export default TransactionsList;