import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type SessionState = {
  session: Session | null;
  recovery: boolean;
  callbackPending: boolean;
  sessionGeneration: number;
};

export function recoverySessionMarker(session: Session | null): string | null {
  if (!session) return null;
  try {
    const payload = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))) as { session_id?: string };
    if (typeof claims.session_id === 'string' && /^[\w-]+$/.test(claims.session_id)) return `${session.user.id}:${claims.session_id}`;
  } catch { /* A legacy token without a session ID stays restricted until sign-out. */ }
  return session.user.id;
}

/** A refresh of the same session does not invalidate in-flight workspace work. */
export function transitionSession(current: SessionState, patch: Partial<Omit<SessionState, 'sessionGeneration'>>): SessionState {
  const next = { ...current, ...patch };
  const changed = current.session?.user.id !== next.session?.user.id
    || Boolean(current.session?.user.email_confirmed_at) !== Boolean(next.session?.user.email_confirmed_at)
    || current.recovery !== next.recovery;
  return { ...next, sessionGeneration: current.sessionGeneration + (changed ? 1 : 0) };
}

export function sessionFromAuthEvent(current: SessionState, event: AuthChangeEvent, session: Session | null): SessionState {
  const sameOwner = current.session?.user.id === session?.user.id;
  const callbackPending = current.callbackPending && event !== 'SIGNED_OUT';
  const recovery = callbackPending || Boolean(session && (event === 'PASSWORD_RECOVERY'
    || (current.recovery && sameOwner)));
  return transitionSession(current, { session, recovery, callbackPending });
}

export type PkceCallback = { code: string } | { error: string };

/** Only this app's exact auth callback routes may consume the stored PKCE verifier. */
export function parsePkceCallback(raw: string, allowedCallbacks: string[]): PkceCallback | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  const matches = allowedCallbacks.some((callback) => {
    try {
      const allowed = new URL(callback);
      return url.protocol === allowed.protocol && url.host === allowed.host && url.pathname === allowed.pathname
        && !url.username && !url.password;
    } catch { return false; }
  });
  if (!matches) return null;
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has('error') || hash.has('error')) {
    return { error: 'This sign-in link is invalid or expired. Request a new email and open it on this device.' };
  }
  const code = url.searchParams.get('code');
  if (!code) return null;
  if (url.searchParams.getAll('code').length !== 1 || !/^[A-Za-z0-9_-]{1,2048}$/.test(code)) {
    return { error: 'This sign-in link is invalid. Request a new email and open it on this device.' };
  }
  return { code };
}
