import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewPassword } from '../lib/auth/validation';

test('new passwords accept 72 ASCII bytes and reject 73 without truncating', () => {
  assert.doesNotThrow(() => validateNewPassword('a'.repeat(72)));
  assert.throws(() => validateNewPassword('a'.repeat(73)), /72 UTF-8 bytes/);
});

test('new password capacity counts UTF-8 bytes rather than JavaScript code units', () => {
  for (const password of ['é'.repeat(36), '界'.repeat(24), '🔒'.repeat(18), 'e\u0301'.repeat(24)]) {
    assert.equal(Buffer.byteLength(password, 'utf8'), 72);
    assert.ok(password.length < 72);
    assert.doesNotThrow(() => validateNewPassword(password));
    assert.throws(() => validateNewPassword(`${password}a`), /72 UTF-8 bytes/);
  }
  assert.throws(() => validateNewPassword('🔒'.repeat(19)), /72 UTF-8 bytes/);
});

test('new password validation preserves the existing minimum-length rule', () => {
  assert.throws(() => validateNewPassword('a'.repeat(11)), /at least 12 characters/);
  assert.doesNotThrow(() => validateNewPassword('a'.repeat(12)));
});
