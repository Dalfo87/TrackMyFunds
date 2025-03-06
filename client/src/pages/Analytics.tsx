// client/src/pages/Analytics.tsx

import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import PaymentMethodAnalysis from '../components/analytics/PaymentMethodAnalysis';
import PortfolioPerformance from '../components/portfolio/PortfolioPerformance';
import { analyticsApi } from '../services/api';

// Componente per il contenuto di ogni tab
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Funzione helper per generare le props per l'accessibilità dei tabs
function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [performanceData, setPerformanceData] = useState<any>(null);

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Analisi del Portafoglio
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Analizza il tuo portafoglio in modo dettagliato, con dati su performace, costi e metodi di investimento.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="analytics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Performance Generale" {...a11yProps(0)} />
              <Tab label="Metodi di Pagamento" {...a11yProps(1)} />
              <Tab label="Profit/Loss Realizzato" {...a11yProps(2)} />
              <Tab label="Analisi per Categoria" {...a11yProps(3)} />
            </Tabs>
          </Box>

          {/* Tab Panel per la Performance Generale */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Generale del Portafoglio
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {/* Utilizziamo il componente già esistente PortfolioPerformance */}
              <PortfolioPerformance data={performanceData} />
            </Box>
          </TabPanel>

          {/* Tab Panel per l'Analisi dei Metodi di Pagamento */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Analisi per Metodo di Pagamento
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Questa analisi mostra come sono distribuiti i tuoi investimenti in base al metodo di pagamento utilizzato.
                Puoi distinguere facilmente tra acquisti effettuati con bonifici bancari e quelli effettuati con cryptocurrencies.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <PaymentMethodAnalysis />
            </Box>
          </TabPanel>

          {/* Tab Panel per il Profit/Loss Realizzato */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Profitto/Perdita Realizzato
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Visualizza i profitti e le perdite che hai effettivamente realizzato attraverso le vendite di criptovalute.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1">
                  Analisi dettagliata del profit/loss realizzato in arrivo con il prossimo aggiornamento!
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab Panel per l'Analisi per Categoria */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Analisi per Categoria
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Analizza la performance delle tue criptovalute raggruppate per categoria.
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1">
                  Analisi dettagliata per categoria in arrivo con il prossimo aggiornamento!
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Analytics;