import manifest from '../../assets/forms/manifest.json';
import type { CourtFormId } from './model';

export const COURT_FORM_TEMPLATES = {
  mc031: { ...manifest.forms.find((form) => form.id === 'MC-031')!, title: 'Attached declaration', formId: 'mc031' as const },
  fl300: { ...manifest.forms.find((form) => form.id === 'FL-300')!, title: 'Request for Order', formId: 'fl300' as const },
};

export function courtFormTemplate(formId: CourtFormId) {
  const template = COURT_FORM_TEMPLATES[formId];
  if (!template) throw new Error('This court form is not supported.');
  return template;
}
