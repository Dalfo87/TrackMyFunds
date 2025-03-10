// client/src/components/dashboard/TopAssets.tsx

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Box, 
  Typography, 
  Alert 
} from '@mui/material';
import { formatCurrency, formatPercentage, getProfitLossIcon, getProfitLossColor } from '../../utils';

interface TopAssetsProps {
  data: any[];
  error?: string | null;
}

const TopAssets: React.FC<TopAssetsProps> = ({ data, error }) => {
  if (error) {
    return (
      <Alert severity="error">
        Errore nel caricamento degli asset: {error}
      </Alert>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Alert severity="info">
        Nessun asset disponibile nel portafoglio. Aggiungi transazioni per visualizzare gli asset.
      </Alert>
    );
  }

  // Ordina gli asset per valore corrente
  const sortedAssets = [...data].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell align="right">Valore</TableCell>
            <TableCell align="right">Prezzo</TableCell>
            <TableCell align="right">ROI</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedAssets.map((asset) => (
            <TableRow key={asset.cryptoSymbol}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{asset.cryptoSymbol}</Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(asset.currentValue)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(asset.currentPrice)}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {getProfitLossIcon(asset.profitLossPercentage, { fontSize: "small", sx: { mr: 0.5 } })}
                  <Typography
                    variant="body2"
                    color={getProfitLossColor(asset.profitLossPercentage)}
                  >
                    {formatPercentage(asset.profitLossPercentage)}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TopAssets;