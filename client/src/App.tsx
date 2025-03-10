// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Providers
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';

// ErrorBoundary
import ErrorBoundary from './components/ErrorBoundary';

// Componenti di layout
import Layout from './components/layout/Layout';

// Pagine
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Tema dell'applicazione
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary componentName="AppRoot">
        <NotificationProvider>
          <AppProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={
                    <ErrorBoundary componentName="Dashboard">
                      <Dashboard />
                    </ErrorBoundary>
                  } />
                  <Route path="/portfolio" element={
                    <ErrorBoundary componentName="Portfolio">
                      <Portfolio />
                    </ErrorBoundary>
                  } />
                  <Route path="/transactions" element={
                    <ErrorBoundary componentName="Transactions">
                      <Transactions />
                    </ErrorBoundary>
                  } />
                  <Route path="/analytics" element={
                    <ErrorBoundary componentName="Analytics">
                      <Analytics />
                    </ErrorBoundary>
                  } />
                  <Route path="/settings" element={
                    <ErrorBoundary componentName="Settings">
                      <Settings />
                    </ErrorBoundary>
                  } />
                </Routes>
              </Layout>
            </Router>
          </AppProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;