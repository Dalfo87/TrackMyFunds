import { ReactNode } from 'react';

// Definizione della struttura di un template
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  layouts: {
    dashboard: LayoutConfig;
    portfolio: LayoutConfig;
    transactions: LayoutConfig;
    analytics: LayoutConfig;
    settings: LayoutConfig;
  };
  charts: {
    preferredProvider: 'recharts' | 'chartjs' | 'd3';
    colorScheme: string[];
  };
  // Altre configurazioni specifiche del template
}

// Configurazione del layout per una pagina
export interface LayoutConfig {
  header?: {
    height?: string;
    fixed?: boolean;
    components?: string[];
  };
  sidebar?: {
    width?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    components?: string[];
  };
  main?: {
    padding?: string;
    components?: string[];
  };
  footer?: {
    height?: string;
    fixed?: boolean;
    components?: string[];
  };
}

// Proprietà del componente template
export interface TemplateProps {
  children?: ReactNode;
  config?: Partial<TemplateConfig>;
  components?: {
    [key: string]: ReactNode;
  };
}