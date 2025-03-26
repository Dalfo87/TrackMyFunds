import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography paragraph>
          Questa è una versione semplificata della dashboard per debug.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;