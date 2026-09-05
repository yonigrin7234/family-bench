import assert from 'node:assert/strict';
import test from 'node:test';
import { firstTaskDestination } from '../lib/welcome/firstTask';
import { openSafetyAction } from '../lib/safety/resources';

test('first-task selection preserves capture or hearing intent through required case setup', () => {
  assert.deepEqual(firstTaskDestination('capture', false), { pathname: '/onboarding', params: { next: 'capture' } });
  assert.deepEqual(firstTaskDestination('briefcase', false), { pathname: '/onboarding', params: { next: 'briefcase' } });
  assert.deepEqual(firstTaskDestination('case', false), { pathname: '/onboarding' });
  assert.deepEqual(firstTaskDestination('capture', true), { pathname: '/capture' });
  assert.deepEqual(firstTaskDestination('briefcase', true), { pathname: '/briefcase' });
  assert.deepEqual(firstTaskDestination('case', true), { pathname: '/cases' });
});

test('safety dispatcher rejects arbitrary URLs and unknown actions before opening anything', async () => {
  const opened: string[] = [];
  for (const untrusted of ['https://example.com', 'tel:123', 'javascript:alert(1)', '__proto__', 'constructor', '']) {
    await assert.rejects(openSafetyAction(untrusted, async (url) => { opened.push(url); }), /not available/);
  }
  assert.deepEqual(opened, []);
});

test('explicit safety actions open only the requested destination and never prefill message content', async () => {
  const opened: string[] = [];
  const open = async (url: string) => { opened.push(url); };
  await openSafetyAction('hotline-call', open);
  await openSafetyAction('hotline-text', open);
  await openSafetyAction('lifeline-text', open);
  assert.deepEqual(opened, ['tel:+18007997233', 'sms:88788', 'sms:988']);
  assert.ok(opened.every((url) => !url.includes('?') && !url.includes('&')));
});

test('device-handler failure gives a usable manual destination without claiming contact succeeded', async () => {
  await assert.rejects(openSafetyAction('emergency-call', async () => { throw new Error('Internal handler detail'); }), { message: 'Your device could not open this link. Dial 911 directly from a phone.' });
  await assert.rejects(openSafetyAction('hotline-text', async () => { throw new Error('Internal handler detail'); }), /text START to 88788/);
  await assert.rejects(openSafetyAction('digital-safety', async () => { throw new Error('Internal handler detail'); }), /thehotline.org\/plan-for-safety\/internet-safety\//);
});
