import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { createElement, type ComponentType, type ReactElement } from 'react';
import type { NextStep } from '../lib/case-intelligence/types';

type RenderNode = {
  type: string | ComponentType;
  props: { accessibilityRole?: string; accessibilityLabel?: string; disabled?: boolean; onPress?: () => void; children?: unknown };
  findAll: (predicate: (node: RenderNode) => boolean) => RenderNode[];
};
type RenderTree = { root: RenderNode; update: (element: ReactElement) => void; unmount: () => void };
const require = createRequire(import.meta.url);
const renderer = require('react-test-renderer') as {
  create: (element: ReactElement) => RenderTree;
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

type Route = string | { pathname: string; params: Record<string, string> };
function fixture(nextStep: NextStep, caseId = 'case-a') {
  return {
    home: {
      activeCase: { id: caseId, title: 'Synthetic case' }, primaryPerson: null, nextStep,
      upcomingKeyDates: [] as { id: string; title: string; event_date: string }[],
      recentEntries: [], flaggedEntries: [],
    },
    snapshot: { filingPackages: [], entries: [], evidenceAttachments: [] },
    filingEntryLinkCounts: {}, hasUserCaseSetup: true, hasHydrated: true, isDemoCase: false, loading: false,
  };
}
type Ports = { state: ReturnType<typeof fixture>; routes: Route[]; mobile: boolean };
const globals = globalThis as typeof globalThis & { __homeActionPorts?: Ports; IS_REACT_ACT_ENVIRONMENT?: boolean };
globals.IS_REACT_ACT_ENVIRONMENT = true;
let compiled: Promise<string> | undefined;

// Render the real Home, NextStepCard and PillButton. Only platform, router, state and unrelated
// chrome are replaced, so a missing callback on an enabled rendered button fails these tests.
async function harness(nextStep: NextStep, mobile = false) {
  compiled ??= build({
    entryPoints: ['app/index.tsx'], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'], write: false, logLevel: 'silent',
    plugins: [{ name: 'home-action-ports', setup(builder) {
      const sources: Record<string, string> = {
        'expo-router': `const p = globalThis.__homeActionPorts; export const router = { push: (route) => p.routes.push(route) };`,
        'react-native': `export const Pressable='Pressable', Text='Text', View='View'; export const StyleSheet={create:s=>s,hairlineWidth:1};`,
        '@/lib/case-intelligence': `const p = globalThis.__homeActionPorts; export const useCaseIntelligenceHome=()=>p.state; export const useCasePatterns=()=>({activePatterns:[]}); export const formatDateLabel=date=>date;`,
        '@/lib/hooks/useResponsive': `const p = globalThis.__homeActionPorts; export const useResponsive=()=>({isMobile:p.mobile});`,
        '@/components/case-intelligence/CaseScreen': `export const CaseScreen=({children})=>children;`,
        '@/components/case-intelligence/EntryCard': `export const EntryCard=()=>null;`,
        '@/components/ui/fb': `export * from './components/ui/fb/tokens'; export {NextStepCard} from './components/ui/fb/NextStepCard'; export {PillButton} from './components/ui/fb/PillButton'; export const Chip=({children})=>children,Display=Chip,SoftCard=Chip,Rule=()=>null,ProgressBar=()=>null,Icon=()=>null;`,
        './Icon': `export const Icon=()=>null;`,
      };
      builder.onResolve({ filter: /.*/ }, (args) => sources[args.path] ? { path: args.path, namespace: 'ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: sources[args.path], loader: 'js', resolveDir: resolve('.') }));
    } }],
  }).then(result => result.outputFiles[0].text);
  const ports: Ports = { state: fixture(nextStep), routes: [], mobile };
  globals.__homeActionPorts = ports;
  const module = { exports: {} as { default: ComponentType } };
  new Function('module', 'exports', 'require', await compiled)(module, module.exports, require);
  const Home = module.exports.default;
  let tree!: RenderTree;
  await renderer.act(() => { tree = renderer.create(createElement(Home)); });
  function buttons(label: string) {
    return tree.root.findAll(node => node.type === 'Pressable' && node.props.accessibilityLabel === label);
  }
  return {
    ports, buttons,
    texts(text: string) { return tree.root.findAll(node => node.type === 'Text' && node.props.children === text); },
    async press(label: string) {
      const matches = buttons(label);
      assert.equal(matches.length, 1, `Expected one rendered ${label} button`);
      assert.equal(matches[0].props.accessibilityRole, 'button');
      assert.notEqual(matches[0].props.disabled, true);
      assert.equal(typeof matches[0].props.onPress, 'function', `${label} must have a real handler`);
      await renderer.act(() => { matches[0].props.onPress!(); });
    },
    async update(next: ReturnType<typeof fixture>) {
      ports.state = next;
      await renderer.act(() => { tree.update(createElement(Home)); });
    },
    async unmount() { await renderer.act(() => tree.unmount()); },
  };
}

const captureStep: NextStep = {
  title: 'Log the next event', body: 'Capture the facts while they are fresh.',
  primaryLabel: 'Log event', secondaryLabel: 'Not now',
};

test('Home Log event and Switch case invoke their existing routes on desktop and mobile', async () => {
  for (const mobile of [false, true]) {
    const h = await harness(captureStep, mobile);
    try {
      await h.press('Log event');
      await h.press('Switch case');
      assert.deepEqual(h.ports.routes, ['/capture', '/cases']);
    } finally { await h.unmount(); }
  }
});

test('Home filing suggestion opens the specific package rather than the generic capture flow', async () => {
  const h = await harness({ ...captureStep, title: 'Continue your filing', primaryLabel: 'Continue filing', relatedFilingPackageId: 'package-a' });
  try {
    await h.press('Continue filing');
    assert.deepEqual(h.ports.routes, [{ pathname: '/filings', params: { packageId: 'package-a' } }]);
  } finally { await h.unmount(); }
});

test('Home date suggestion and visible date strip both open the existing Case Map dates view', async () => {
  const step = { ...captureStep, title: 'Prepare for your date', primaryLabel: 'Review date', relatedKeyDateId: 'date-a' };
  const h = await harness(step);
  try {
    const state = fixture(step);
    state.home.upcomingKeyDates = [{ id: 'date-a', title: 'Filing deadline', event_date: '2027-01-01' }];
    await h.update(state);
    assert.equal(h.texts('days to next date').length, 1);
    assert.equal(h.texts('days to hearing').length, 0, 'Non-hearing dates must not be described as hearings');
    await h.press('Review date');
    await h.press('Open date: Filing deadline');
    assert.deepEqual(h.ports.routes, ['/case-map', '/case-map']);
  } finally { await h.unmount(); }
});

test('Not now dismisses only the displayed suggestion in this Home session and case', async () => {
  const h = await harness(captureStep);
  try {
    const before = structuredClone(h.ports.state);
    await h.press('Not now');
    assert.equal(h.buttons('Log event').length, 0);
    assert.equal(h.buttons('Not now').length, 0);
    assert.deepEqual(h.ports.routes, []);
    assert.deepEqual(h.ports.state, before, 'Dismissal must not mutate case data');
    await h.update(fixture({ ...captureStep }));
    assert.equal(h.buttons('Log event').length, 0, 'The same suggestion stays dismissed on rerender');
    await h.update(fixture(captureStep, 'case-b'));
    assert.equal(h.buttons('Log event').length, 1, 'Dismissal must not carry into another case');
    await h.update(fixture({ ...captureStep, title: 'New date added', primaryLabel: 'Review date', relatedKeyDateId: 'date-b' }));
    assert.equal(h.buttons('Review date').length, 1, 'A different suggestion in the original case remains visible');
  } finally { await h.unmount(); }
  const reopened = await harness(captureStep);
  try { assert.equal(reopened.buttons('Log event').length, 1, 'A new Home session starts with its suggestion visible'); }
  finally { await reopened.unmount(); }
});
