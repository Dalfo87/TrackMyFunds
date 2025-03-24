import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Drawer, CssBaseline } from '@mui/material';
import { TemplateProps } from '../types';
import defaultTemplate from './config';
import { useTheme } from '@mui/material/styles';

const DefaultTemplate: React.FC<TemplateProps> = ({ 
  children, 
  config = {}, 
  components = {} 
}) => {
  const theme = useTheme();
  
  // Unisci la configurazione predefinita con quella personalizzata
  const mergedConfig = {
    ...defaultTemplate,
    ...config,
    layouts: {
      ...defaultTemplate.layouts,
      ...(config.layouts || {}),
    },
  };
  
  // Ottieni la configurazione per il layout corrente
  // In un'implementazione reale, questo dovrebbe determinare la pagina corrente
  const currentLayout = mergedConfig.layouts.dashboard;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar 
        position={currentLayout.header?.fixed ? "fixed" : "static"}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          height: currentLayout.header?.height || '64px',
        }}
      >
        <Toolbar>
          {components.header || (
            <Typography variant="h6" noWrap>
              TrackMy Funds
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Spazio per compensare l'AppBar fixed */}
      {currentLayout.header?.fixed && <Toolbar />}
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: currentLayout.sidebar?.width || '240px',
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: currentLayout.sidebar?.width || '240px',
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar /> {/* Spazio per compensare l'AppBar */}
          <Box sx={{ overflow: 'auto' }}>
            {components.sidebar}
          </Box>
        </Drawer>
        
        {/* Contenuto principale */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: currentLayout.main?.padding || 3,
            width: { sm: `calc(100% - ${currentLayout.sidebar?.width || '240px'})` },
          }}
        >
          <Container maxWidth={false}>
            {children}
          </Container>
        </Box>
      </Box>
      
      {/* Footer */}
      {(components.footer || currentLayout.footer) && (
        <Box
          component="footer"
          sx={{
            p: 2,
            height: currentLayout.footer?.height || '48px',
            position: currentLayout.footer?.fixed ? 'fixed' : 'static',
            bottom: 0,
            width: '100%',
            bgcolor: 'background.paper',
          }}
        >
          {components.footer || (
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} TrackMy Funds
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DefaultTemplate;