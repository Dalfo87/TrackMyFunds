import { TemplateConfig, TemplateProps } from './types';
import DefaultTemplate from './default/DefaultTemplate';
import defaultTemplate from './default/config';

// Registro dei template disponibili
const templates: Record<string, {
  component: React.FC<TemplateProps>;
  config: TemplateConfig;
}> = {
  default: {
    component: DefaultTemplate,
    config: defaultTemplate,
  },
};

// Funzione per registrare un nuovo template
export function registerTemplate(
  id: string,
  component: React.FC<TemplateProps>,
  config: TemplateConfig
): void {
  templates[id] = { component, config };
}

// Funzione per ottenere un template
export function getTemplate(id: string): {
  component: React.FC<TemplateProps>;
  config: TemplateConfig;
} {
  return templates[id] || templates['default'];
}

// Esporta template e tipi
export type { TemplateConfig, TemplateProps } from './types';
export { DefaultTemplate, defaultTemplate };
export default templates;