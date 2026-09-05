import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { createElement, type ComponentType, type ReactElement } from 'react';

type RenderNode = {
  type: string | ComponentType;
  props: { children?: unknown; accessibilityLabel?: string; accessibilityState?: { selected?: boolean }; onPress?: () => void };
  findAll: (predicate: (node: RenderNode) => boolean) => RenderNode[];
};
type RenderTree = { root: RenderNode; update: (element: ReactElement) => void; unmount: () => void };
const require = createRequire(import.meta.url);
const renderer = require('react-test-renderer') as {
  create: (element: ReactElement) => RenderTree;
  act: (callback: () => void | Promise<void>) => Promise<void>;
};
type Route = { pathname: string; params: { id: string } };
type Ports = { width: number; routes: Route[]; state: ReturnType<typeof fixture> };
const globals = globalThis as typeof globalThis & { __timelineActionPorts?: Ports; IS_REACT_ACT_ENVIRONMENT?: boolean };
globals.IS_REACT_ACT_ENVIRONMENT = true;

function fixture() {
  return {
    snapshot: { children: [], evidenceAttachments: [] },
    entries: ['a', 'b'].map((suffix) => ({ id: `entry-${suffix}`, event_date: '2026-09-05', entry_type: 'journal', title: `Event ${suffix}`, body: `Original detail ${suffix}` })),
    activeCase: { title: 'Synthetic case' }, source: 'supabase', loading: false, filingEntryLinkCounts: {},
  };
}

let compiled: Promise<string> | undefined;
// Keep Timeline, CaseScreen and useResponsive real: the regression depends on
// the actual shell hiding its rail. Replace only native/data/router and other UI.
async function harness(width: number) {
  compiled ??= build({
    entryPoints: ['app/timeline.tsx'], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'], write: false, logLevel: 'silent',
    plugins: [{ name: 'timeline-action-ports', setup(builder) {
      const sources: Record<string, string> = {
        'expo-router': 'const p=globalThis.__timelineActionPorts; export const router={push:route=>p.routes.push(route)};',
        'react-native': 'const p=globalThis.__timelineActionPorts; export const Pressable="Pressable",Text="Text",View="View",ScrollView="ScrollView"; export const StyleSheet={create:s=>s,hairlineWidth:1}; export const useWindowDimensions=()=>({width:p.width,height:900});',
        'expo-status-bar': 'export const StatusBar=()=>null;',
        'react-native-safe-area-context': 'export const useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});',
        '@/lib/case-intelligence': 'const p=globalThis.__timelineActionPorts; export const useCaseIntelligenceTimeline=()=>p.state; export const ENTRY_TYPE_OPTIONS=[{value:"journal",shortLabel:"Journal",tone:"ink"}]; export const getEntryTypeOption=()=>ENTRY_TYPE_OPTIONS[0],formatDateLabel=date=>date,isEntryReviewed=()=>false;',
        '@/components/case-intelligence/EntryCard': 'export const EntryCard=()=>null;',
        './BottomNav': 'export const BottomNav=()=>null,DesktopSidebar=()=>null;',
        './WorkspaceStatus': 'export const WorkspaceStatus=()=>null;',
        './AccountMenu': 'export const AccountMenu=()=>null;',
        '@/components/ui/fb': 'export * from "./components/ui/fb/tokens"; export {PillButton} from "./components/ui/fb/PillButton"; export const Chip=({children})=>children,Display=Chip,SoftCard=Chip,Label=Chip,Segment=()=>null,Icon=()=>null;',
        './Icon': 'export const Icon=()=>null;',
      };
      builder.onResolve({ filter: /.*/ }, (args) => sources[args.path] ? { path: args.path, namespace: 'ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: sources[args.path], loader: 'js', resolveDir: resolve('.') }));
    } }],
  }).then((result) => result.outputFiles[0].text);
  const ports: Ports = { width, routes: [], state: fixture() };
  globals.__timelineActionPorts = ports;
  const module = { exports: {} as { default: ComponentType } };
  new Function('module', 'exports', 'require', await compiled)(module, module.exports, require);
  const Timeline = module.exports.default;
  let tree!: RenderTree;
  await renderer.act(() => { tree = renderer.create(createElement(Timeline)); });
  return {
    ports,
    rows: () => tree.root.findAll((node) => node.type === 'Pressable' && /^(Open|Select) timeline event /.test(node.props.accessibilityLabel ?? '')),
    text: (value: string) => tree.root.findAll((node) => node.type === 'Text' && node.props.children === value),
    async press(node: RenderNode) { assert.equal(typeof node.props.onPress, 'function'); await renderer.act(() => node.props.onPress!()); },
    fullEntryButton: () => tree.root.findAll((node) => node.type === 'Pressable' && node.props.accessibilityLabel === 'Open full entry'),
    async resize(nextWidth: number) { ports.width = nextWidth; await renderer.act(() => tree.update(createElement(Timeline))); },
    async unmount() { await renderer.act(() => tree.unmount()); },
  };
}

test('tablet and narrow desktop timeline rows open their entry while the real shell hides the inspector', async () => {
  for (const width of [800, 1280, 1439]) {
    const h = await harness(width);
    try {
      assert.equal(h.text('EVENT INSPECTOR').length, 0);
      assert.equal(h.rows().length, 2);
      assert.ok(h.rows().every((row) => row.props.accessibilityLabel?.startsWith('Open timeline event ')));
      await h.press(h.rows()[1]);
      assert.deepEqual(h.ports.routes, [{ pathname: '/entry/[id]', params: { id: 'entry-b' } }]);
    } finally { await h.unmount(); }
  }
});

test('at 1440px a timeline row selects a visible inspector and its full-entry button opens the selected record', async () => {
  const h = await harness(1440);
  try {
    assert.equal(h.text('EVENT INSPECTOR').length, 1);
    assert.ok(h.rows().every((row) => row.props.accessibilityLabel?.startsWith('Select timeline event ')));
    await h.press(h.rows()[1]);
    assert.deepEqual(h.ports.routes, []);
    assert.equal(h.rows()[0].props.accessibilityState?.selected, false);
    assert.equal(h.rows()[1].props.accessibilityState?.selected, true);
    assert.equal(h.text('Original detail b').length, 1);
    assert.equal(h.fullEntryButton().length, 1);
    await h.press(h.fullEntryButton()[0]);
    assert.deepEqual(h.ports.routes, [{ pathname: '/entry/[id]', params: { id: 'entry-b' } }]);
  } finally { await h.unmount(); }
});

test('resizing below the inspector threshold changes an existing row from selection to navigation', async () => {
  const h = await harness(1440);
  try {
    await h.press(h.rows()[1]);
    await h.resize(1280);
    assert.equal(h.text('EVENT INSPECTOR').length, 0);
    assert.ok(h.rows()[1].props.accessibilityLabel?.startsWith('Open timeline event '));
    assert.equal(h.rows()[1].props.accessibilityState, undefined);
    await h.press(h.rows()[1]);
    assert.deepEqual(h.ports.routes, [{ pathname: '/entry/[id]', params: { id: 'entry-b' } }]);
  } finally { await h.unmount(); }
});
