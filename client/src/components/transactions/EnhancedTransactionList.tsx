// src/components/transactions/EnhancedTransactionList.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Box, Tooltip, 
  Collapse, Grid, TextField, MenuItem, Select, FormControl, InputLabel,
  SelectChangeEvent, InputAdornment, TableSortLabel, TablePagination,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SpaIcon from '@mui/icons-material/Spa';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LinkIcon from '@mui/icons-material/Link';

import { transactionApi, realizedProfitApi } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import EnhancedTransactionForm, { TransactionFormRef } from './EnhancedTransactionForm';
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
  TransactionType,
  isStablecoin
} from '../../utils';

interface EnhancedTransactionsListProps {
  transactions: any[];
  tabValue: number;
  onRefresh: () => void;
  cryptos?: any[];
}

// Definizione dei tipi di ordinamento
type OrderDirection = 'asc' | 'desc';
type OrderableField = 'date' | 'cryptoSymbol' | 'quantity' | 'pricePerUnit' | 'totalAmount';

const EnhancedTransactionsList: React.FC<EnhancedTransactionsListProps> = ({ 
  transactions, 
  tabValue, 
  onRefresh, 
  cryptos = [] 
}) => {
  const { showNotification } = useNotification();
  const { handleError, withErrorHandling } = useErrorHandler('EnhancedTransactionsList');
  
  // Stati per dialog e transazione selezionata
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  
  // Stati per il filtro avanzato
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    minAmount: '',
    maxAmount: '',
    category: '',
    paymentMethod: ''
  });
  
  // Stati per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stati per l'ordinamento
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [orderBy, setOrderBy] = useState<OrderableField>('date');
  
  // Stati per i profitti realizzati
  const [realizedProfits, setRealizedProfits] = useState<Record<string, any>>({});
  const [loadingProfits, setLoadingProfits] = useState(false);
  
  // Ref per il form
  const formRef = useRef<TransactionFormRef>(null);

  // Effetto per caricare i profitti realizzati
  useEffect(() => {
    const loadRealizedProfits = async () => {
      if (transactions.length === 0) return;
      
      // Carica i profitti realizzati solo per le transazioni di vendita
      const sellTransactions = transactions.filter(tx => 
        tx.type === TransactionType.SELL && 
        tx.paymentMethod === PaymentMethod.CRYPTO && 
        isStablecoin(tx.paymentCurrency || '')
      );
      
      if (sellTransactions.length === 0) return;
      
      setLoadingProfits(true);
      
      try {
        const response = await realizedProfitApi.getAll();
        
        // Crea un oggetto con i profitti mappati per ID di transazione
        const profitsMap: Record<string, any> = {};
        response.data.forEach((profit: any) => {
          profitsMap[profit.originalTransactionId] = profit;
        });
        
        setRealizedProfits(profitsMap);
      } catch (error) {
        handleError(error, 'loadRealizedProfits');
      } finally {
        setLoadingProfits(false);
      }
    };
    
    loadRealizedProfits();
  }, [transactions, handleError]);

  // Se non ci sono transazioni, mostra un messaggio
  if (!transactions || transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" gutterBottom>
          Nessuna transazione disponibile
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{ mt: 1 }}
        >
          Aggiorna
        </Button>
      </Box>
    );
  }

  // Filtra le transazioni in base al tab selezionato e ai filtri avanzati
  const filteredTransactions = transactions.filter(tx => {
    // 1. Filtra per tab
    if (tabValue === 0) {} // Mostra tutte
    else if (tabValue === 1 && tx.type !== TransactionType.BUY) return false;
    else if (tabValue === 2 && tx.type !== TransactionType.SELL) return false;
    else if (tabValue === 3 && tx.type !== TransactionType.AIRDROP) return false;
    else if (tabValue === 4 && tx.type !== TransactionType.FARMING) return false;
    
    // 2. Filtra per ricerca testuale
    if (filters.search && !tx.cryptoSymbol.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // 3. Filtra per data
    if (filters.startDate && dayjs(tx.date).isBefore(filters.startDate, 'day')) {
      return false;
    }
    if (filters.endDate && dayjs(tx.date).isAfter(filters.endDate, 'day')) {
      return false;
    }
    
    // 4. Filtra per importo
    if (filters.minAmount && tx.totalAmount < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && tx.totalAmount > parseFloat(filters.maxAmount)) {
      return false;
    }
    
    // 5. Filtra per categoria
    if (filters.category && tx.category !== filters.category) {
      return false;
    }
    
    // 6. Filtra per metodo di pagamento
    if (filters.paymentMethod && tx.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    
    return true;
  });

  // Funzione per gestire il sort
  const handleRequestSort = (property: OrderableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Funzione per ordinare le transazioni
  const sortedTransactions = () => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      
      // Ordina in base al campo selezionato
      if (orderBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a[orderBy] < b[orderBy] ? -1 : a[orderBy] > b[orderBy] ? 1 : 0;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
  };

  // Funzione per gestire la paginazione
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Gestisce il toggle dei filtri
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Gestisce il cambio dei filtri
  const handleFilterChange = (name: string, value: any) => {
    setFilters({
      ...filters,
      [name]: value
    });
    setPage(0); // Torna alla prima pagina quando cambia un filtro
  };

  // Gestisce la pulizia dei filtri
  const handleClearFilters = () => {
    setFilters({
      search: '',
      startDate: null,
      endDate: null,
      minAmount: '',
      maxAmount: '',
      category: '',
      paymentMethod: ''
    });
    setPage(0);
  };

  // Ottiene le categorie uniche per il filtro
  const uniqueCategories = Array.from(new Set(transactions.filter(tx => tx.category).map(tx => tx.category)));

  // Componente per visualizzare i dettagli di una transazione
  const TransactionRow = ({ transaction }: { transaction: any }) => {
    const [open, setOpen] = useState(false);
    
    // Verifica se questa transazione ha generato un profitto/perdita realizzato
    const hasRealizedProfit = realizedProfits[transaction._id];
    
    // Attributi per transazioni di farming
    const isFarming = transaction.type === TransactionType.FARMING;
    const farmingSourceCrypto = isFarming ? transaction.paymentCurrency : null;
    
    return (
      <>
        <TableRow 
          hover
          sx={{ 
            '& > *': { borderBottom: 'unset' },
            bgcolor: hasRealizedProfit ? 
              (hasRealizedProfit.realizedProfitLoss > 0 ? 'success.dark' : 'error.dark') : undefined,
            '&:hover': hasRealizedProfit ? {
              bgcolor: hasRealizedProfit.realizedProfitLoss > 0 ? 'success.main' : 'error.main',
            } : undefined,
          }}
        >
          <TableCell>
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{formatDate(transaction.date)}</TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTransactionTypeIcon(transaction.type, { fontSize: "small", sx: { mr: 0.5 } })}
              <Chip 
                label={getTransactionTypeText(transaction.type)} 
                color={getTransactionTypeColor(transaction.type)}
                size="small"
                icon={
                  isFarming ? <SpaIcon /> : 
                  (hasRealizedProfit ? <AttachMoneyIcon /> : undefined)
                }
              />
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={transaction.cryptoSymbol} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              {isFarming && (
                <Tooltip title={`Originato da staking di ${farmingSourceCrypto}`}>
                  <Chip 
                    label={farmingSourceCrypto}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    icon={<LinkIcon fontSize="small" />}
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
            </Box>
          </TableCell>
          <TableCell align="right">{formatQuantity(transaction.quantity)}</TableCell>
          <TableCell align="right">
            {transaction.type === TransactionType.AIRDROP || transaction.type === TransactionType.FARMING
              ? '0' 
              : formatCurrency(transaction.pricePerUnit)
            }
          </TableCell>
          <TableCell align="right">
            {transaction.type === TransactionType.AIRDROP || transaction.type === TransactionType.FARMING
              ? '0' 
              : formatCurrency(transaction.totalAmount)
            }
          </TableCell>
          <TableCell align="right">
            {transaction.paymentMethod ? (
              <Tooltip title={getPaymentMethodName(transaction.paymentMethod)}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {getPaymentMethodIcon(transaction.paymentMethod, { fontSize: 'small' })}
                </Box>
              </Tooltip>
            ) : '-'}
          </TableCell>
          <TableCell align="right">
            {transaction.paymentCurrency ? (
              <Chip 
                label={transaction.paymentCurrency} 
                size="small" 
                variant="outlined"
                color={
                  isStablecoin(transaction.paymentCurrency) ? "warning" : 
                  (transaction.paymentMethod === PaymentMethod.CRYPTO ? "secondary" : "default")
                }
              />
            ) : '-'}
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => handleOpenEditDialog(transaction)}
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleOpenDeleteDialog(transaction)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  {/* Dettagli base */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dettagli Transazione
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Data</Typography>
                          <Typography variant="body2">{formatDate(transaction.date)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Tipo</Typography>
                          <Typography variant="body2">{getTransactionTypeText(transaction.type)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Crypto</Typography>
                          <Typography variant="body2">{transaction.cryptoSymbol}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Quantità</Typography>
                          <Typography variant="body2">{formatQuantity(transaction.quantity)}</Typography>
                        </Grid>
                        {(transaction.type !== TransactionType.AIRDROP && transaction.type !== TransactionType.FARMING) && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Prezzo</Typography>
                              <Typography variant="body2">{formatCurrency(transaction.pricePerUnit)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Importo Totale</Typography>
                              <Typography variant="body2">{formatCurrency(transaction.totalAmount)}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Dettagli pagamento */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      {transaction.type === TransactionType.BUY ? 'Dettagli Pagamento' :
                       transaction.type === TransactionType.SELL ? 'Dettagli Ricezione' :
                       transaction.type === TransactionType.FARMING ? 'Dettagli Farming' : 'Informazioni Aggiuntive'}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={1}>
                        {transaction.type === TransactionType.FARMING ? (
                          <>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">Crypto di Origine (staking/liquidity)</Typography>
                              <Typography variant="body2">{transaction.paymentCurrency}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">Tipo Reward</Typography>
                              <Typography variant="body2">Farming/Staking</Typography>
                            </Grid>
                          </>
                        ) : (transaction.type === TransactionType.BUY || transaction.type === TransactionType.SELL) ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Metodo</Typography>
                              <Typography variant="body2">{getPaymentMethodName(transaction.paymentMethod)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Valuta</Typography>
                              <Typography variant="body2">{transaction.paymentCurrency}</Typography>
                            </Grid>
                          </>
                        ) : null}
                        
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary">Categoria</Typography>
                          <Typography variant="body2">
                            {transaction.category || 'Non specificata'}
                          </Typography>
                        </Grid>
                        
                        {transaction.notes && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary">Note</Typography>
                            <Typography variant="body2">{transaction.notes}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Sezione profitto realizzato */}
                  {hasRealizedProfit && (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: hasRealizedProfit.realizedProfitLoss > 0 ? 'success.main' : 'error.main',
                        color: 'white',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1
                      }}>
                        <LightbulbIcon sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle2">
                            Profitto/Perdita Realizzato
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(hasRealizedProfit.realizedProfitLoss)} 
                            ({hasRealizedProfit.profitLossPercentage.toFixed(2)}%)
                          </Typography>
                          <Typography variant="caption">
                            Costo Base: {formatCurrency(hasRealizedProfit.costBasis)} | 
                            Ricavo: {formatCurrency(hasRealizedProfit.proceedsAmount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  // Calcola le transazioni da mostrare in base alla paginazione
  const paginatedTransactions = sortedTransactions().slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      {/* Barra dei filtri */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">
            {filteredTransactions.length} transazioni trovate
            {loadingProfits && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </Typography>
          <Box>
            <Button 
              size="small" 
              startIcon={<FilterListIcon />} 
              onClick={handleToggleFilters}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Nascondi Filtri' : 'Mostra Filtri'}
            </Button>
            <Button 
              size="small" 
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              color="primary"
            >
              Aggiorna
            </Button>
          </Box>
        </Box>
        
        <Collapse in={showFilters}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Cerca"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
                  <DatePicker 
                    label="Data Inizio"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
                  <DatePicker 
                    label="Data Fine"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Importo Minimo"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  size="small"
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Importo Massimo"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  size="small"
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e: SelectChangeEvent) => handleFilterChange('category', e.target.value)}
                    label="Categoria"
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    {uniqueCategories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Metodo Pagamento</InputLabel>
                  <Select
                    value={filters.paymentMethod}
                    onChange={(e: SelectChangeEvent) => handleFilterChange('paymentMethod', e.target.value)}
                    label="Metodo Pagamento"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value={PaymentMethod.BANK_TRANSFER}>Bonifico Bancario</MenuItem>
                    <MenuItem value={PaymentMethod.CREDIT_CARD}>Carta di Credito</MenuItem>
                    <MenuItem value={PaymentMethod.DEBIT_CARD}>Carta di Debito</MenuItem>
                    <MenuItem value={PaymentMethod.CRYPTO}>Cryptocurrency</MenuItem>
                    <MenuItem value={PaymentMethod.OTHER}>Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={handleClearFilters}
                >
                  Pulisci Filtri
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      </Box>
      
      {/* Tabella delle transazioni */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '3%' }}></TableCell>
              <TableCell style={{ width: '10%' }}>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Data
                </TableSortLabel>
              </TableCell>
              <TableCell style={{ width: '10%' }}>Tipo</TableCell>
              <TableCell style={{ width: '15%' }}>
                <TableSortLabel
                  active={orderBy === 'cryptoSymbol'}
                  direction={orderBy === 'cryptoSymbol' ? order : 'asc'}
                  onClick={() => handleRequestSort('cryptoSymbol')}
                >
                  Criptovaluta
                </TableSortLabel>
              </TableCell>
              <TableCell style={{ width: '10%' }} align="right">
                <TableSortLabel
                  active={orderBy === 'quantity'}
                  direction={orderBy === 'quantity' ? order : 'asc'}
                  onClick={() => handleRequestSort('quantity')}
                >
                  Quantità
                </TableSortLabel>
              </TableCell>
              <TableCell style={{ width: '10%' }} align="right">
                <TableSortLabel
                  active={orderBy === 'pricePerUnit'}
                  direction={orderBy === 'pricePerUnit' ? order : 'asc'}
                  onClick={() => handleRequestSort('pricePerUnit')}
                >
                  Prezzo
                </TableSortLabel>
              </TableCell>
              <TableCell style={{ width: '10%' }} align="right">
                <TableSortLabel
                  active={orderBy === 'totalAmount'}
                  direction={orderBy === 'totalAmount' ? order : 'asc'}
                  onClick={() => handleRequestSort('totalAmount')}
                >
                  Totale
                </TableSortLabel>
              </TableCell>
              <TableCell style={{ width: '7%' }} align="right">Metodo</TableCell>
              <TableCell style={{ width: '10%' }} align="right">Valuta</TableCell>
              <TableCell style={{ width: '15%' }} align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map((tx) => (
              <TransactionRow key={tx._id} transaction={tx} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Paginazione */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Righe per pagina:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
      />

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
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Modifica Transazione
        </DialogTitle>
        <DialogContent>
          {transactionToEdit && (
            <EnhancedTransactionForm 
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

export default EnhancedTransactionsList;