import test from 'node:test';
import assert from 'node:assert/strict';
import type { Session } from '@supabase/supabase-js';
import { sessionFromAuthEvent, transitionSession, parsePkceCallback, recoverySessionMarker, type SessionState } from '../lib/auth/sessionModel';
import { createNativeCallbackHandler } from '../lib/auth/nativeCallback';
import { FAMILY_BENCH_PROJECT_REF, getSupabaseEnvironmentStatus } from '../lib/supabase/environment';
const owner = '11111111-1111-4111-8111-111111111111';
function jwt(claims: unknown) { return `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`; }
function session(id = owner, sessionId = 'session-one'): Session {
  return { user: { id, email_confirmed_at: '2026-09-05' }, access_token: jwt({ session_id: sessionId }), refresh_token: 'secret', token_type: 'bearer', expires_in: 3600 } as Session;
}
function empty(): SessionState { return { session: null, recovery: false, callbackPending: false, sessionGeneration: 0 }; }

test('workspace generation changes for sign-out/same-owner sign-in and recovery, but not token refresh', () => {
  let state = sessionFromAuthEvent(empty(), 'SIGNED_IN', session());
  assert.equal(state.sessionGeneration, 1);
  state = sessionFromAuthEvent(state, 'TOKEN_REFRESHED', session());
  assert.equal(state.sessionGeneration, 1);
  state = sessionFromAuthEvent(state, 'PASSWORD_RECOVERY', session());
  assert.equal(state.sessionGeneration, 2);
  for (const event of ['USER_UPDATED', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'SIGNED_IN'] as const) {
    state = sessionFromAuthEvent(state, event, session());
    assert.equal(state.recovery, true);
    assert.equal(state.sessionGeneration, 2);
  }
  state = sessionFromAuthEvent(state, 'SIGNED_OUT', null);
  assert.equal(state.recovery, false);
  assert.equal(state.sessionGeneration, 3);
  state = sessionFromAuthEvent(state, 'SIGNED_IN', session());
  assert.equal(state.sessionGeneration, 4);
});

test('callback gate stays active before and during SIGNED_IN and sign-out cancels it', () => {
  let state = transitionSession(empty(), { callbackPending: true, recovery: true });
  state = sessionFromAuthEvent(state, 'INITIAL_SESSION', null);
  assert.equal(state.recovery, true);
  state = sessionFromAuthEvent(state, 'SIGNED_IN', session());
  assert.equal(state.recovery, true);
  state = sessionFromAuthEvent(state, 'SIGNED_OUT', null);
  assert.equal(state.callbackPending, false);
  assert.equal(state.recovery, false);
});

test('recovery markers survive token refresh but do not gate a later fresh sign-in', () => {
  assert.equal(recoverySessionMarker(session()), recoverySessionMarker({ ...session(), access_token: jwt({ session_id: 'session-one', exp: 9000 }) }));
  assert.notEqual(recoverySessionMarker(session()), recoverySessionMarker(session(owner, 'session-two')));
  assert.equal(recoverySessionMarker(null), null);
});

test('native PKCE callback only accepts exact registered routes and never surfaces URL secrets', () => {
  const allowed = ['familybench://auth', 'exp://127.0.0.1:8081/--/auth'];
  assert.deepEqual(parsePkceCallback('familybench://auth?code=one-two', allowed), { code: 'one-two' });
  assert.deepEqual(parsePkceCallback('exp://127.0.0.1:8081/--/auth?code=one', allowed), { code: 'one' });
  for (const url of ['https://attacker.example/auth?code=secret', 'familybench://other?code=secret', 'familybench://auth/other?code=secret', 'familybench://attacker@auth?code=secret']) {
    assert.equal(parsePkceCallback(url, allowed), null);
  }
  const error = parsePkceCallback('familybench://auth?error=expired&error_description=PRIVATE_SECRET', allowed);
  assert.ok(error && 'error' in error);
  assert.ok(!JSON.stringify(error).includes('PRIVATE_SECRET'));
});

test('cold-start and running-app duplicate callbacks exchange only once, retaining recovery redirect type', async () => {
  let exchanges = 0;
  const actions: string[] = [];
  const handle = createNativeCallbackHandler({ allowedCallbacks: ['familybench://auth'], active: () => true,
    begin: () => actions.push('begin'),
    exchange: async () => { exchanges++; return { data: { session: session(), redirectType: 'PASSWORD_RECOVERY' }, error: null }; },
    complete: (_, recovery) => actions.push(recovery ? 'recovery' : 'signed-in'), fail: (message) => actions.push(message),
  });
  await Promise.all([handle('familybench://auth?code=one'), handle('familybench://auth?code=one')]);
  assert.equal(exchanges, 1);
  assert.deepEqual(actions, ['begin', 'recovery']);
});

test('callback completion is ignored after disposal and exchange errors contain no server or URL details', async () => {
  let active = true;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const complete: unknown[] = [];
  const handle = createNativeCallbackHandler({ allowedCallbacks: ['familybench://auth'], active: () => active, begin: () => {},
    exchange: async () => { await pending; return { data: { session: session() }, error: null }; },
    complete: (value) => complete.push(value), fail: (message) => complete.push(message),
  });
  const operation = handle('familybench://auth?code=one');
  await Promise.resolve(); await Promise.resolve(); active = false; release(); await operation;
  assert.deepEqual(complete, []);
  const failures: string[] = [];
  const fail = createNativeCallbackHandler({ allowedCallbacks: ['familybench://auth'], active: () => true, begin: () => {},
    exchange: async () => { throw new Error('PRIVATE_SERVER_SECRET'); }, complete: () => {}, fail: (message) => failures.push(message),
  });
  await fail('familybench://auth?code=two');
  assert.equal(failures.length, 1);
  assert.ok(!failures[0].includes('PRIVATE_SERVER_SECRET'));
});

const url = `https://${FAMILY_BENCH_PROJECT_REF}.supabase.co`;
function environment(key: string, extra: Record<string, string> = {}) { return getSupabaseEnvironmentStatus({ EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: key, ...extra }); }
test('public builds reject secret keys, service_role JWTs, malformed keys and foreign legacy anon claims', () => {
  assert.equal(environment('sb_publishable_example'), 'configured');
  assert.equal(environment(jwt({ role: 'anon', ref: FAMILY_BENCH_PROJECT_REF })), 'configured');
  for (const key of ['sb_secret_NEVER_EXPOSE', jwt({ role: 'service_role', ref: FAMILY_BENCH_PROJECT_REF }), jwt({ role: 'authenticated', ref: FAMILY_BENCH_PROJECT_REF }), 'not-a-key']) {
    assert.equal(environment(key), 'invalid');
  }
  assert.equal(environment(jwt({ role: 'anon', ref: 'other-project' })), 'wrong_project');
  assert.equal(environment('sb_publishable_example', { EXPO_PUBLIC_SUPABASE_PROJECT_REF: 'other-project' }), 'wrong_project');
});

test('project URL rejects redirects/credentials/path tricks and local endpoints need explicit opt-in', () => {
  for (const candidate of [`${url}/auth`, `${url}?redirect=secret`, `${url}#secret`, `https://name:secret@${FAMILY_BENCH_PROJECT_REF}.supabase.co`]) {
    assert.equal(environment('sb_publishable_example', { EXPO_PUBLIC_SUPABASE_URL: candidate }), 'invalid');
  }
  for (const candidate of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
    assert.equal(environment('sb_publishable_example', { EXPO_PUBLIC_SUPABASE_URL: candidate }), 'wrong_project');
    assert.equal(environment('sb_publishable_example', { EXPO_PUBLIC_SUPABASE_URL: candidate, EXPO_PUBLIC_SUPABASE_ALLOW_LOCAL: 'true' }), 'configured');
  }
  assert.equal(environment('sb_publishable_example', { EXPO_PUBLIC_SUPABASE_URL: 'https://other-project.supabase.co', EXPO_PUBLIC_SUPABASE_PROJECT_REF: 'other-project' }), 'wrong_project');
});
