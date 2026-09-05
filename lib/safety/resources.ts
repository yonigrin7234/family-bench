/** Primary provider pages checked 2026-09-05. Opening this module performs no outbound action. */
export const SAFETY_RESOURCES_CHECKED = 'September 5, 2026';
export const SAFETY_ACTIONS = [
  { id: 'emergency-call', label: 'Call 911', url: 'tel:911', fallback: 'Dial 911 directly from a phone.' },
  { id: 'emergency-guide', label: '911.gov emergency guidance', url: 'https://www.911.gov/calling-911/', fallback: 'Visit 911.gov/calling-911/ in a browser. For an emergency, dial 911 directly.' },
  { id: 'hotline-call', label: 'Call 800-799-7233', url: 'tel:+18007997233', fallback: 'Dial 800-799-7233 directly from a phone.' },
  { id: 'hotline-text', label: 'Open text to 88788', url: 'sms:88788', fallback: 'Open your messaging app and text START to 88788 when it is safe to do so.' },
  { id: 'hotline-help', label: 'The Hotline website and chat', url: 'https://www.thehotline.org/get-help/', fallback: 'Visit thehotline.org/get-help/ in a browser, or call 800-799-7233.' },
  { id: 'lifeline-call', label: 'Call 988', url: 'tel:988', fallback: 'Dial 988 directly from a phone.' },
  { id: 'lifeline-text', label: 'Open text to 988', url: 'sms:988', fallback: 'Open your messaging app and address a text to 988.' },
  { id: 'lifeline-help', label: '988 Lifeline website and chat', url: 'https://988lifeline.org/help-yourself/', fallback: 'Visit 988lifeline.org/help-yourself/ in a browser, or call 988.' },
  { id: 'safety-plan', label: 'The Hotline safety planning guide', url: 'https://www.thehotline.org/plan-for-safety/', fallback: 'Visit thehotline.org/plan-for-safety/ in a browser, or call 800-799-7233 for support.' },
  { id: 'local-providers', label: 'Find local support through The Hotline', url: 'https://www.thehotline.org/get-help/directory-of-local-providers/', fallback: 'Visit thehotline.org/get-help/directory-of-local-providers/ in a browser, or call 800-799-7233.' },
  { id: 'digital-safety', label: 'The Hotline internet safety guide', url: 'https://www.thehotline.org/plan-for-safety/internet-safety/', fallback: 'Visit thehotline.org/plan-for-safety/internet-safety/ in a browser you can use safely.' },
] as const;
export type SafetyActionId = typeof SAFETY_ACTIONS[number]['id'];

/** The UI invokes this only from an explicit press. No case data or message body is passed. */
export async function openSafetyAction(id: string, openUrl: (url: string) => Promise<unknown>): Promise<void> {
  const action = SAFETY_ACTIONS.find((row) => row.id === id);
  if (!action) throw new Error('This safety resource is not available. Use one of the listed numbers or websites.');
  try { await openUrl(action.url); }
  catch { throw new Error(`Your device could not open this link. ${action.fallback}`); }
}
