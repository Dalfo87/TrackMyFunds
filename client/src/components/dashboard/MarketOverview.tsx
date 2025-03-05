// client/src/components/dashboard/MarketOverview.tsx

import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface MarketOverviewProps {
  data: any[];
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>Dati di mercato non disponibili</Typography>;
  }

  // Funzione per formattare i valori monetari
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Funzione per formattare le percentuali
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Simbolo</TableCell>
            <TableCell align="right">Prezzo</TableCell>
            <TableCell align="right">Variazione 24h</TableCell>
            <TableCell align="right">Cap. di Mercato</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((crypto) => (
            <TableRow key={crypto.symbol}>
              <TableCell component="th" scope="row">
                {crypto.name}
              </TableCell>
              <TableCell>{crypto.symbol}</TableCell>
              <TableCell align="right">
                {formatCurrency(crypto.currentPrice)}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {crypto.priceChangePercentage24h >= 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    color={crypto.priceChangePercentage24h >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercentage(crypto.priceChangePercentage24h)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(crypto.marketCap)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MarketOverview;