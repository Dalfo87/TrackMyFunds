// client/src/components/portfolio/PortfolioAssetsList.tsx

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableSortLabel,
  Paper, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssetDetailsDialog from './AssetDetailsDialog';
import { 
  formatCurrency, 
  formatQuantity, 
  getProfitLossIcon, 
  getProfitLossColor 
} from '../../utils';

interface PortfolioAssetsListProps {
  assets: any[];
  tabValue: number;
}

// Definizione delle proprietà per l'ordinamento
type OrderDirection = 'asc' | 'desc';
type OrderableField = 'symbol' | 'currentValue' | 'profitLoss' | 'profitLossPercentage' | 'quantity';

const PortfolioAssetsList: React.FC<PortfolioAssetsListProps> = ({ assets, tabValue }) => {
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [orderBy, setOrderBy] = useState<OrderableField>('currentValue');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filtra gli asset in base al tab selezionato
  const filteredAssets = assets.filter(asset => {
    if (tabValue === 0) return true; // Tutti gli asset
    if (tabValue === 1) return asset.profitLoss > 0; // Solo in profitto
    if (tabValue === 2) return asset.profitLoss < 0; // Solo in perdita
    return true;
  });

  // Funzione per gestire l'ordinamento
  const handleRequestSort = (property: OrderableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Funzione per l'ordinamento degli asset
  const sortedAssets = () => {
    return [...filteredAssets].sort((a, b) => {
      const multiplier = order === 'asc' ? 1 : -1;
      
      if (a[orderBy] < b[orderBy]) {
        return -1 * multiplier;
      }
      if (a[orderBy] > b[orderBy]) {
        return 1 * multiplier;
      }
      return 0;
    });
  };

  // Gestisce l'apertura del dialogo dei dettagli
  const handleOpenDetails = (asset: any) => {
    setSelectedAsset(asset);
    setDetailsOpen(true);
  };

  // Gestisce la chiusura del dialogo dei dettagli
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedAsset(null);
  };

  if (!assets || assets.length === 0) {
    return <Typography>Nessun asset disponibile</Typography>;
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'symbol'}
                  direction={order}
                  onClick={() => handleRequestSort('symbol')}
                >
                  Asset
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'quantity'}
                  direction={order}
                  onClick={() => handleRequestSort('quantity')}
                >
                  Quantità
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Prezzo Attuale</TableCell>
              <TableCell align="right">Prezzo Medio</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'currentValue'}
                  direction={order}
                  onClick={() => handleRequestSort('currentValue')}
                >
                  Valore Attuale
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Costo Investimento</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'profitLoss'}
                  direction={order}
                  onClick={() => handleRequestSort('profitLoss')}
                >
                  Profitto/Perdita
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'profitLossPercentage'}
                  direction={order}
                  onClick={() => handleRequestSort('profitLossPercentage')}
                >
                  ROI
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAssets().map((asset) => (
              <TableRow key={asset.cryptoSymbol}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={asset.cryptoSymbol} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    {asset.category && (
                      <Chip 
                        label={asset.category} 
                        size="small" 
                        color="default" 
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{formatQuantity(asset.quantity)}</TableCell>
                <TableCell align="right">{formatCurrency(asset.currentPrice)}</TableCell>
                <TableCell align="right">{formatCurrency(asset.averagePrice)}</TableCell>
                <TableCell align="right">{formatCurrency(asset.currentValue)}</TableCell>
                <TableCell align="right">{formatCurrency(asset.investmentValue)}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {getProfitLossIcon(asset.profitLoss, { fontSize: "small", sx: { mr: 0.5 } })}
                    <Typography
                      variant="body2"
                      color={getProfitLossColor(asset.profitLoss)}
                    >
                      {formatCurrency(asset.profitLoss)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={getProfitLossColor(asset.profitLossPercentage)}
                  >
                    {formatQuantity(asset.profitLossPercentage, 2)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Dettagli Asset">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDetails(asset)}
                      color="primary"
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog per i dettagli dell'asset */}
      {selectedAsset && (
        <AssetDetailsDialog 
          open={detailsOpen} 
          onClose={handleCloseDetails} 
          asset={selectedAsset} 
        />
      )}
    </>
  );
};

export default PortfolioAssetsList;