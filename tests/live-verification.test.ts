import test from 'node:test';
import assert from 'node:assert/strict';
import { assertVerifyProject, validateFixtures, validateVerificationKeys, VERIFY_PROJECT_REF } from '../scripts/verify-live';

const runId = '1f0bbcae-d729-42e6-a646-e008c3d38a8d';
const fixtures = {
  projectRef: VERIFY_PROJECT_REF, runId,
  users: ['090f351d-6544-438a-a4d7-f1957b73a223', 'b8ec0648-4951-46e3-8672-c085ea7b6653'].map((id, index) => ({ id, email: `fb-verify-${runId}-${index}@example.invalid`, password: 'synthetic-test-only-long-password' })),
};

test('live verifier refuses another project and nonsynthetic fixture identities before any writes', () => {
  assert.doesNotThrow(() => assertVerifyProject(`https://${VERIFY_PROJECT_REF}.supabase.co`));
  assert.throws(() => assertVerifyProject('https://another-project.supabase.co'));
  assert.throws(() => assertVerifyProject(`https://${VERIFY_PROJECT_REF}.supabase.co.evil.invalid`));
  assert.doesNotThrow(() => validateFixtures(fixtures));
  assert.throws(() => validateFixtures({ ...fixtures, projectRef: 'another-project' }));
  assert.throws(() => validateFixtures({ ...fixtures, users: [{ ...fixtures.users[0], email: 'real-user@example.com' }, fixtures.users[1]] }));
  assert.throws(() => validateFixtures({ ...fixtures, users: [fixtures.users[0], { ...fixtures.users[1], id: fixtures.users[0].id }] }));
});

test('live tests require separate admin cleanup credentials and reject privilege escalation in the public client', () => {
  const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  assert.doesNotThrow(() => validateVerificationKeys('sb_publishable_test', 'sb_secret_test'));
  assert.doesNotThrow(() => validateVerificationKeys(jwt('anon'), jwt('service_role')));
  assert.throws(() => validateVerificationKeys('sb_secret_test', 'sb_secret_other'));
  assert.throws(() => validateVerificationKeys(jwt('service_role'), 'sb_secret_test'));
  assert.throws(() => validateVerificationKeys(jwt('authenticated'), 'sb_secret_test'));
  assert.throws(() => validateVerificationKeys('sb_publishable_test', ''));
  assert.throws(() => validateVerificationKeys('sb_publishable_test', 'sb_publishable_other'));
  assert.throws(() => validateVerificationKeys('arbitrary-key', 'sb_secret_test'));
});
