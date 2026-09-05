import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase/client';
import { recoverySessionMarker, sessionFromAuthEvent, transitionSession } from './sessionModel';
import { createNativeCallbackHandler } from './nativeCallback';

const RECOVERY_MARKER_KEY = 'family-bench.auth-recovery.v1';
let markerWrites = Promise.resolve();
async function readRecoveryMarker(): Promise<string | null> {
  return Platform.OS === 'web' ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(RECOVERY_MARKER_KEY)) : SecureStore.getItemAsync(RECOVERY_MARKER_KEY);
}
function writeRecoveryMarker(marker: string | null): Promise<void> {
  markerWrites = markerWrites.catch(() => undefined).then(async () => {
    if (Platform.OS === 'web') {
      if (marker) localStorage.setItem(RECOVERY_MARKER_KEY, marker); else localStorage.removeItem(RECOVERY_MARKER_KEY);
    } else if (marker) await SecureStore.setItemAsync(RECOVERY_MARKER_KEY, marker);
    else await SecureStore.deleteItemAsync(RECOVERY_MARKER_KEY);
  });
  return markerWrites;
}

type AuthState = {
  session: Session | null;
  initialized: boolean;
  recovery: boolean;
  callbackPending: boolean;
  sessionGeneration: number;
  error: string | null;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  initialized: false,
  recovery: false,
  callbackPending: false,
  sessionGeneration: 0,
  error: null,
}));

export function getWorkspaceGeneration(): number {
  return useAuthStore.getState().sessionGeneration;
}

export function getWorkspaceOwnerId(): string {
  const { session, recovery } = useAuthStore.getState();
  if (!session?.user.email_confirmed_at || recovery) {
    throw new Error('Sign in with a verified email to open your case.');
  }
  return session.user.id;
}

export function hasVerifiedSession(session: Session | null): boolean {
  return Boolean(session?.user.id && session.user.email_confirmed_at);
}

// Subscribe before reading the session so a sign-out cannot be overwritten by
// a slower startup read. Callbacks deliberately do not await other Auth calls.
export function initializeAuth(): () => void {
  let live = true;
  let authRevision = 0;
  let startupComplete = false;
  let initialLinkPending = Platform.OS !== 'web';
  if (!supabase) {
    useAuthStore.setState({ ...transitionSession(useAuthStore.getState(), { session: null, recovery: false, callbackPending: false }), initialized: true });
    return () => { live = false; };
  }
  const client = supabase;
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    authRevision += 1;
    if (!live) return;
    const next = sessionFromAuthEvent(useAuthStore.getState(), event, session);
    useAuthStore.setState({ ...next, initialized: startupComplete && !initialLinkPending && !next.callbackPending, error: null });
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_OUT') {
      void writeRecoveryMarker(event === 'PASSWORD_RECOVERY' ? recoverySessionMarker(session) : null).catch(() => {
        if (live) useAuthStore.setState({ error: 'Unable to save password recovery status. Finish resetting your password before closing the app.' });
      });
    }
  });
  const startupRevision = authRevision;
  void Promise.all([client.auth.getSession(), readRecoveryMarker()]).then(([{ data, error }, marker]) => {
    if (live) {
      startupComplete = true;
      const current = useAuthStore.getState();
      const session = authRevision === startupRevision ? data.session : current.session;
      const recovery = current.recovery || Boolean(session && marker && marker === recoverySessionMarker(session));
      useAuthStore.setState({ ...transitionSession(current, { session, recovery }), initialized: !initialLinkPending && !current.callbackPending, error: error?.message ?? null });
    }
  }).catch(() => {
    if (live) {
      startupComplete = true;
      const current = useAuthStore.getState();
      const next = transitionSession(current, { session: current.callbackPending ? current.session : null });
      useAuthStore.setState({ ...next, initialized: !initialLinkPending && !next.callbackPending, error: 'Unable to restore your session. Please sign in again.' });
    }
  });
  // PKCE callbacks are consumed automatically in browsers, but native apps
  // must handle both cold-start links and URLs delivered to a running app.
  let linkSubscription: ReturnType<typeof Linking.addEventListener> | undefined;
  if (Platform.OS !== 'web') {
    let previousRecovery = false;
    const handleCallback = createNativeCallbackHandler({
      allowedCallbacks: [Linking.createURL('auth'), 'familybench://auth'],
      exchange: (code) => client.auth.exchangeCodeForSession(code),
      active: () => live,
      begin: () => {
        authRevision += 1;
        previousRecovery = useAuthStore.getState().recovery;
        useAuthStore.setState({ ...transitionSession(useAuthStore.getState(), { recovery: true, callbackPending: true }), initialized: false, error: null });
      },
      complete: (session, recovery) => {
        const current = useAuthStore.getState();
        // SIGNED_OUT cancels a pending callback; never restore it afterward.
        if (!current.callbackPending) return;
        useAuthStore.setState({ ...transitionSession(current, { session, recovery, callbackPending: false }), initialized: startupComplete, error: null });
        void writeRecoveryMarker(recovery ? recoverySessionMarker(session) : null).catch(() => {
          if (live) useAuthStore.setState({ error: 'Unable to save password recovery status. Finish resetting your password before closing the app.' });
        });
      },
      fail: (error) => {
        const current = useAuthStore.getState();
        useAuthStore.setState({ ...transitionSession(current, { recovery: current.callbackPending ? previousRecovery : current.recovery, callbackPending: false }), initialized: startupComplete && !initialLinkPending, error });
      },
    });
    linkSubscription = Linking.addEventListener('url', ({ url }) => { void handleCallback(url); });
    void Linking.getInitialURL().then((url) => { if (url && live) return handleCallback(url); }).catch(() => {
      if (live) useAuthStore.setState({ error: 'Unable to open the sign-in link. Request a new email and try again.' });
    }).finally(() => {
      initialLinkPending = false;
      if (live) useAuthStore.setState({ initialized: startupComplete && !useAuthStore.getState().callbackPending });
    });
  }
  const foreground = AppState.addEventListener('change', (state) => {
    if (Platform.OS === 'web') return;
    if (state === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
  return () => { live = false; subscription.unsubscribe(); foreground.remove(); linkSubscription?.remove(); };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
  useAuthStore.setState(transitionSession(useAuthStore.getState(), { session: null, recovery: false, callbackPending: false }));
  await writeRecoveryMarker(null);
}
