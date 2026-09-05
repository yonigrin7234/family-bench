import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { FAMILY_BENCH_PROJECT_REF, type SupabaseEnvironmentStatus } from '../lib/supabase/environment';

const url = `https://${FAMILY_BENCH_PROJECT_REF}.supabase.co`;
const publishableKey = 'sb_publishable_synthetic_test_key';
const jwt = (claims: Record<string, string>) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;

// Load the actual client and environment validator, substituting only SDK and
// native ports. Build-time definitions also exercise Expo's direct env accesses.
async function loadClient(values: { url?: string; key?: string; projectRef?: string }, platform: 'web' | 'ios' = 'web') {
  const calls: unknown[][] = [];
  const modules: Record<string, string> = {
    '@supabase/supabase-js': 'export function createClient(...args) { globalThis.__createClientCalls.push(args); return { initialized: true }; }',
    'react-native': `export const Platform = { OS: ${JSON.stringify(platform)} };`,
    'expo-secure-store': 'export function getItemAsync() { throw new Error("Unexpected storage access"); } export const setItemAsync=getItemAsync, deleteItemAsync=getItemAsync;',
  };
  const result = await build({
    absWorkingDir: resolve(import.meta.dirname, '..'), entryPoints: ['lib/supabase/client.ts'],
    bundle: true, platform: 'node', format: 'cjs', write: false,
    define: {
      __DEV__: 'false',
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(values.url) ?? 'undefined',
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(values.key) ?? 'undefined',
      'process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF': JSON.stringify(values.projectRef) ?? 'undefined',
      'process.env.EXPO_PUBLIC_SUPABASE_ALLOW_LOCAL': 'undefined',
    },
    plugins: [{ name: 'client-test-ports', setup(builder) {
      builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: modules[args.path], loader: 'js' }));
    } }],
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles![0].text, { module, exports: module.exports, URL, atob, __createClientCalls: calls });
  return {
    calls,
    client: module.exports as { supabase: unknown; isSupabaseConfigured: boolean; supabaseEnvironmentStatus: SupabaseEnvironmentStatus },
  };
}

test('client initializes with trimmed URL and public key on web and native', async () => {
  for (const platform of ['web', 'ios'] as const) {
    for (const key of [publishableKey, jwt({ role: 'anon', ref: FAMILY_BENCH_PROJECT_REF })]) {
      const { client, calls } = await loadClient({ url: ` \t${url}\r\n`, key: `\n${key} \t` }, platform);
      assert.equal(client.supabaseEnvironmentStatus, 'configured');
      assert.equal(client.isSupabaseConfigured, true);
      assert.ok(client.supabase);
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], url);
      assert.equal(calls[0][1], key);
    }
  }
});

test('client does not initialize for another project even when public configuration is padded', async () => {
  for (const values of [
    { url: ' \nhttps://other-project.supabase.co\n', key: ` ${publishableKey}\n` },
    { url, key: jwt({ role: 'anon', ref: 'other-project' }) },
    { url, key: publishableKey, projectRef: 'other-project' },
  ]) {
    const { client, calls } = await loadClient(values);
    assert.equal(client.supabaseEnvironmentStatus, 'wrong_project');
    assert.equal(client.isSupabaseConfigured, false);
    assert.equal(client.supabase, null);
    assert.equal(calls.length, 0);
  }
});

test('client does not initialize with malformed, privileged, or missing configuration', async () => {
  for (const values of [
    { url: 'not a URL', key: publishableKey },
    { url, key: 'sb_secret_synthetic_test_key' },
    { url, key: jwt({ role: 'service_role', ref: FAMILY_BENCH_PROJECT_REF }) },
    { url, key: '\n \t' },
    { url, key: 'invalid key' },
    { key: publishableKey },
  ]) {
    const { client, calls } = await loadClient(values);
    assert.notEqual(client.supabaseEnvironmentStatus, 'configured');
    assert.equal(client.isSupabaseConfigured, false);
    assert.equal(client.supabase, null);
    assert.equal(calls.length, 0);
  }
});
