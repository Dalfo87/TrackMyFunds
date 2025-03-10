// src/context/NotificationContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertColor,
  SnackbarOrigin
} from '@mui/material';

interface NotificationContextProps {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
  closeNotification: () => void;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  position?: SnackbarOrigin;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  position = { vertical: 'bottom', horizontal: 'right' }
}) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 6000
  });

  const showNotification = (
    message: string, 
    severity: AlertColor = 'info',
    duration: number = 6000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      duration
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    closeNotification();
  };

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={position}
      >
        <Alert 
          onClose={handleClose} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// Custom hook per utilizzare il contesto
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};