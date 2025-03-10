// client/src/components/dashboard/TopAssets.tsx

import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography } from '@mui/material';
import { formatCurrency, formatPercentage, getProfitLossIcon, getProfitLossColor } from '../../utils';

interface TopAssetsProps {
  data: any[];
}

const TopAssets: React.FC<TopAssetsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>Nessun asset disponibile</Typography>;
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
            <TableRow key={asset.symbol}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{asset.symbol}</Typography>
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
                  {getProfitLossIcon(asset.roi, { fontSize: "small", sx: { mr: 0.5 } })}
                  <Typography
                    variant="body2"
                    color={getProfitLossColor(asset.roi)}
                  >
                    {formatPercentage(asset.roi)}
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