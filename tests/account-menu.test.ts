import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, type ComponentType, type ReactElement } from 'react';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

type RenderNode = {
  type: string | ComponentType;
  props: { accessibilityRole?: string; accessibilityLabel?: string; accessibilityState?: { expanded?: boolean }; disabled?: boolean; onPress?: () => void; onRequestClose?: () => void; children?: string };
  findAll: (predicate: (node: RenderNode) => boolean) => RenderNode[];
};
type RenderTree = { root: RenderNode; update: (element: ReactElement) => void; unmount: () => void };
const require = createRequire(import.meta.url);
const renderer = require('react-test-renderer') as { create: (element: ReactElement) => RenderTree; act: (callback: () => void | Promise<void>) => Promise<void> };
type User = { id: string; email: string; email_confirmed_at: string; user_metadata: Record<string, unknown> };
type Ports = {
  auth: { session: { user: User } | null; sessionGeneration: number };
  workspace: { saving: number; syncing: boolean; loading: boolean; switchingCase: boolean; persistence: { error: string | null } };
  routes: string[]; calls: string[]; cleanup: () => Promise<void>; signOut: () => Promise<void>;
};
const globals = globalThis as typeof globalThis & { __accountMenuPorts?: Ports; IS_REACT_ACT_ENVIRONMENT?: boolean };
globals.IS_REACT_ACT_ENVIRONMENT = true;
let compiled: Promise<string> | undefined;

async function harness() {
  compiled ??= build({ entryPoints: ['components/case-intelligence/AccountMenu.tsx'], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'], write: false, logLevel: 'silent', plugins: [{ name: 'account-menu-ports', setup(builder) {
    const sources: Record<string, string> = {
      'expo-router': 'const p=globalThis.__accountMenuPorts; export const router={push:route=>p.routes.push(route)};',
      'react-native': 'import {createElement} from "react"; export const Pressable="Pressable",Text="Text",View="View",ScrollView="ScrollView"; export const Modal=props=>props.visible?createElement("Modal",props,props.children):null; export const StyleSheet={create:s=>s,hairlineWidth:1,absoluteFillObject:{position:"absolute",top:0,bottom:0,left:0,right:0}};',
      'react-native-safe-area-context': 'export const useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});',
      '@/lib/auth/session': 'const p=globalThis.__accountMenuPorts; export const useAuthStore=selector=>selector(p.auth); useAuthStore.getState=()=>p.auth; export const signOut=()=>p.signOut();',
      '@/lib/case-intelligence/useCaseIntelligence': 'const p=globalThis.__accountMenuPorts; export const useCaseIntelligenceStore=()=>p.workspace; useCaseIntelligenceStore.getState=()=>p.workspace;',
      '@/lib/evidence/sourceCleanup': 'const p=globalThis.__accountMenuPorts; export const retryTemporarySourceCleanup=()=>p.cleanup();',
      './Icon': 'export const Icon=()=>null;',
    };
    builder.onResolve({ filter: /.*/ }, (args) => sources[args.path] ? { path: args.path, namespace: 'ports' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: sources[args.path], loader: 'js' }));
  } }] }).then((result) => result.outputFiles[0].text);
  const ports: Ports = {
    auth: { session: { user: { id: 'owner', email: 'sarah.chen@example.invalid', email_confirmed_at: '2026-09-05', user_metadata: {} } }, sessionGeneration: 1 },
    workspace: { saving: 0, syncing: false, loading: false, switchingCase: false, persistence: { error: null } }, routes: [], calls: [],
    cleanup: async () => { ports.calls.push('cleanup'); }, signOut: async () => { ports.calls.push('signOut'); },
  };
  globals.__accountMenuPorts = ports;
  const module = { exports: {} as { AccountMenu: ComponentType; accountInitials: (user: Partial<User>) => string } };
  new Function('module', 'exports', 'require', await compiled)(module, module.exports, require);
  let tree!: RenderTree;
  await renderer.act(() => { tree = renderer.create(createElement(module.exports.AccountMenu)); });
  const buttons = (label: string) => tree.root.findAll((node) => node.type === 'Pressable' && node.props.accessibilityLabel === label);
  return {
    ports, tree, buttons, initials: module.exports.accountInitials,
    avatar: () => tree.root.findAll((node) => node.type === 'Pressable' && node.props.accessibilityLabel?.startsWith('Account menu') === true)[0],
    modal: () => tree.root.findAll((node) => node.type === 'Modal'),
    async press(label: string) { const found = buttons(label); assert.equal(found.length, 1, label); assert.equal(found[0].props.accessibilityRole, 'button'); assert.notEqual(found[0].props.disabled, true); await renderer.act(async () => { found[0].props.onPress!(); await new Promise<void>((resolve) => setImmediate(resolve)); }); },
    async update() { await renderer.act(() => tree.update(createElement(module.exports.AccountMenu))); },
    async unmount() { await renderer.act(() => tree.unmount()); },
  };
}

test('account avatar uses authenticated identity and exposes accessible open, close and dismissal', async () => {
  const h = await harness();
  try {
    assert.equal(h.initials(h.ports.auth.session!.user), 'SC');
    assert.equal(h.initials({ email: 'other@example.invalid', user_metadata: { full_name: 'Actual User' } }), 'AU');
    assert.equal(h.initials({}), '?');
    assert.equal(h.avatar().props.accessibilityState?.expanded, false);
    await h.press('Account menu for sarah.chen@example.invalid');
    assert.equal(h.avatar().props.accessibilityState?.expanded, true);
    assert.equal(h.modal()[0].props.accessibilityLabel, 'Account menu');
    await h.press('Close account menu'); assert.equal(h.modal().length, 0);
    await h.press('Account menu for sarah.chen@example.invalid');
    await renderer.act(() => h.modal()[0].props.onRequestClose!());
    assert.equal(h.modal().length, 0, 'Escape / native back dismissal closes the modal');
  } finally { await h.unmount(); }
});

test('account menu closes and navigates only to the existing dashboard and Settings destinations', async () => {
  const h = await harness();
  try {
    for (const label of ['Dashboard', 'Account & settings']) { await h.press('Account menu for sarah.chen@example.invalid'); await h.press(label); assert.equal(h.modal().length, 0); }
    assert.deepEqual(h.ports.routes, ['/', '/settings']);
  } finally { await h.unmount(); }
});

test('sign-out waits for temporary-source cleanup, prevents duplicate submissions and closes after success', async () => {
  const h = await harness(); let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  h.ports.cleanup = async () => { h.ports.calls.push('cleanup'); await pending; };
  try {
    await h.press('Account menu for sarah.chen@example.invalid'); await h.press('Sign out');
    assert.deepEqual(h.ports.calls, ['cleanup']);
    assert.equal(h.buttons('Signing out…')[0].props.disabled, true);
    assert.equal(h.buttons('Signing out…')[0].props.onPress, undefined);
    await renderer.act(async () => { finish(); await pending; });
    assert.deepEqual(h.ports.calls, ['cleanup', 'signOut']); assert.equal(h.modal().length, 0);
  } finally { finish(); await h.unmount(); }
});

test('failed cleanup or sign-out stays visible and retryable without a false success', async () => {
  const h = await harness();
  try {
    await h.press('Account menu for sarah.chen@example.invalid');
    h.ports.cleanup = async () => { h.ports.calls.push('cleanup'); throw new Error('Temporary cleanup failed'); };
    await h.press('Sign out');
    assert.deepEqual(h.ports.calls, ['cleanup']);
    assert.ok(h.tree.root.findAll((node) => node.props.accessibilityRole === 'alert' && node.props.children === 'Temporary cleanup failed').length);
    h.ports.cleanup = async () => { h.ports.calls.push('cleanup'); };
    h.ports.signOut = async () => { h.ports.calls.push('signOut'); throw new Error('Sign out unavailable'); };
    await h.press('Sign out');
    assert.equal(h.modal().length, 1);
    assert.ok(h.tree.root.findAll((node) => node.props.accessibilityRole === 'alert' && node.props.children === 'Sign out unavailable').length);
  } finally { await h.unmount(); }
});

test('unsaved failures and active saves block sign-out, and an account change cancels an awaiting action', async () => {
  const h = await harness(); let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  try {
    await h.press('Account menu for sarah.chen@example.invalid');
    h.ports.workspace.saving = 1; await h.update(); assert.equal(h.buttons('Sign out')[0].props.disabled, true);
    h.ports.workspace.saving = 0; h.ports.workspace.persistence.error = 'Disk full'; await h.update(); assert.equal(h.buttons('Sign out')[0].props.disabled, true);
    h.ports.workspace.persistence.error = null; await h.update();
    h.ports.cleanup = async () => { h.ports.calls.push('cleanup'); await pending; };
    await h.press('Sign out');
    h.ports.auth = { session: { user: { ...h.ports.auth.session!.user, id: 'new-owner', email: 'new@example.invalid' } }, sessionGeneration: 2 };
    await h.update();
    await renderer.act(async () => { finish(); await pending; });
    assert.deepEqual(h.ports.calls, ['cleanup']); assert.equal(h.modal().length, 0);
    assert.equal(h.avatar().props.accessibilityLabel, 'Account menu for new@example.invalid');
  } finally { finish(); await h.unmount(); }
});
