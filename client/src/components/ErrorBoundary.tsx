// src/components/common/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Divider,
  Collapse 
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import { logError } from '../utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(_: Error): State {
    return {
      hasError: true,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Aggiorna lo stato
    this.setState({
      error,
      errorInfo
    });

    // Log l'errore
    const componentName = this.props.componentName || 'UnknownComponent';
    logError(error, `ErrorBoundary:${componentName}`);
    console.error("ComponentStack:", errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback personalizzato se fornito
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback predefinito
      return (
        <Paper
          sx={{
            p: 3,
            m: 2,
            borderLeft: '4px solid',
            borderColor: 'error.main',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            <BugReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Si è verificato un errore
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
            Siamo spiacenti, qualcosa è andato storto durante il caricamento di questo componente.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Riprova
            </Button>
            
            <Button
              variant="outlined"
              color="info"
              onClick={this.toggleDetails}
            >
              {this.state.showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
            </Button>
          </Box>
          
          {/* Dettagli dell'errore per debugging */}
          <Collapse in={this.state.showDetails}>
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom color="error">
                Messaggio di errore:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                {this.state.error?.message || 'Errore sconosciuto'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom color="error">
                Stack dell'errore:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo?.componentStack || 'Stack non disponibile'}
              </Typography>
            </Paper>
          </Collapse>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;