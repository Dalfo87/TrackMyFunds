// client/src/components/dashboard/MarketOverview.tsx

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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { formatCurrency, formatPercentage, getProfitLossIcon, getProfitLossColor } from '../../utils';

interface MarketOverviewProps {
  data: any[];
  error?: string | null;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ data, error }) => {
  if (error) {
    return (
      <Alert severity="error">
        Errore nel caricamento dei dati di mercato: {error}
      </Alert>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Alert severity="info">
        Dati di mercato non disponibili al momento. Riprova più tardi.
      </Alert>
    );
  }

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
                  {getProfitLossIcon(crypto.priceChangePercentage24h, { fontSize: "small", sx: { mr: 0.5 } })}
                  <Typography
                    variant="body2"
                    color={getProfitLossColor(crypto.priceChangePercentage24h)}
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