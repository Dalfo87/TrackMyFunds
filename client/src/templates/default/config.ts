import { TemplateConfig } from '../types';

const defaultTemplate: TemplateConfig = {
  id: 'default',
  name: 'Default Template',
  description: 'Template predefinito per TrackMy Funds',
  version: '1.0.0',
  author: 'TrackMy Funds Team',
  layouts: {
    dashboard: {
      header: {
        height: '64px',
        fixed: true,
      },
      sidebar: {
        width: '240px',
        collapsible: true,
        defaultCollapsed: false,
      },
      main: {
        padding: '24px',
      },
      footer: {
        height: '48px',
        fixed: false,
      },
    },
    // Configurazioni simili per altre pagine
    portfolio: {
      // ...
    },
    transactions: {
      // ...
    },
    analytics: {
      // ...
    },
    settings: {
      // ...
    }
  },
  charts: {
    preferredProvider: 'recharts',
    colorScheme: ['#3f51b5', '#f50057', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'],
  },
};

export default defaultTemplate;