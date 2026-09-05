import type { Session } from '@supabase/supabase-js';
import { parsePkceCallback } from './sessionModel';

type CallbackResult = { data: { session: Session | null; redirectType?: string | null }; error: unknown };

export function createNativeCallbackHandler(options: {
  allowedCallbacks: string[];
  exchange: (code: string) => Promise<CallbackResult>;
  begin: () => void;
  complete: (session: Session, recovery: boolean) => void;
  fail: (message: string) => void;
  active: () => boolean;
}) {
  const handled = new Set<string>();
  let tail = Promise.resolve();
  return (url: string): Promise<void> => {
    const callback = parsePkceCallback(url, options.allowedCallbacks);
    if (!callback || !options.active()) return Promise.resolve();
    if ('error' in callback) { options.fail(callback.error); return Promise.resolve(); }
    if (handled.has(callback.code)) return tail;
    handled.add(callback.code);
    tail = tail.catch(() => undefined).then(async () => {
      if (!options.active()) return;
      options.begin();
      try {
        const result = await options.exchange(callback.code);
        if (!options.active()) return;
        if (result.error || !result.data.session) throw new Error('Invalid callback');
        options.complete(result.data.session, result.data.redirectType === 'PASSWORD_RECOVERY' || result.data.redirectType === 'recovery');
      } catch {
        if (options.active()) options.fail('This sign-in link could not be verified. Request a new email and open it on the same device.');
      }
    });
    return tail;
  };
}
