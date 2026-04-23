// Family Bench — shared UI primitives

const { useState, useEffect, useRef, useMemo } = React;

// ─── Icons (inline, 1.5 stroke, ink) ───────────────────────
const Icon = ({ d, size = 16, fill = 'none', stroke = 'currentColor', sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);
const I = {
  mic: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3',
  plus: 'M12 5v14M5 12h14',
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  home: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9Z',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z',
  scales: 'M12 3v18M5 21h14M5 7h14M5 7l-3 7a4 4 0 0 0 6 0L5 7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7Z',
  chat: 'M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z',
  flag: 'M4 21V4m0 0h11l-2 4 2 4H4',
  gavel: 'm14 14-8 8-4-4 8-8m0 0 4-4 4 4m-8 0 6-6m2 2 6-6-4-4-6 6',
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  caret: 'm9 6 6 6-6 6',
  caretDown: 'm6 9 6 6 6-6',
  shield: 'M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z',
  check: 'm5 12 5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  dot: <circle cx="12" cy="12" r="3"/>,
  upload: 'M12 16V4m0 0-5 5m5-5 5 5M4 20h16',
  paperclip: 'M21 11 12 20a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-1.5-1.5l8-8',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
  chevR: 'm9 6 6 6-6 6',
  filter: 'M4 5h16M7 12h10M10 19h4',
  grip: <><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></>,
  pin: 'M12 2v8m0 0-4 4h8l-4-4Zm0 8v12',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5m-2 6a4 4 0 0 1-5.7 0 4 4 0 0 1 0-5.7l3-3a4 4 0 0 1 5.7 0',
  doc: <><path d="M7 3h8l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h6"/></>,
  receipt: 'M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3Zm4 6h10M9 13h10M9 17h6',
  camera: <><path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/></>,
  wave: 'M3 12h2l2-7 3 14 3-10 2 6 2-4 2 2h2',
  spark: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z',
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
};

// ─── Surface / building blocks ────────────────────────────
function Stamp({ children, tone = 'ox' }) {
  const T = window.FB;
  const map = { ox: [T.ox, T.oxWash], sand: [T.sandDeep, T.sandWash], forest: [T.forest, T.forestWash], amber: [T.amber, T.amberWash], ink: [T.ink, T.paperDeep] };
  const [fg, bg] = map[tone];
  return (
    <span className="fb-mono fb-smallcaps" style={{
      color: fg, background: bg, padding: '2px 6px', fontSize: 9.5, fontWeight: 600,
      border: `0.5px solid ${fg}30`, borderRadius: 2, display: 'inline-block', letterSpacing: '0.12em',
    }}>{children}</span>
  );
}

function Rule({ color, dashed, style = {} }) {
  const T = window.FB;
  return <div style={{ height: 1, background: dashed ? 'none' : (color || T.rule), borderTop: dashed ? `1px dashed ${color || T.rule}` : 'none', ...style }} />;
}

// Monospace ID, timestamp, hash
function Mono({ children, size = 11, dim = false, style = {} }) {
  return <span className="fb-mono" style={{ fontSize: size, color: dim ? window.FB.inkMute : window.FB.ink, letterSpacing: '-0.01em', ...style }}>{children}</span>;
}

// Small-caps label (like section titles in legal docs)
function Label({ children, color, style = {} }) {
  return <div className="fb-sans fb-smallcaps" style={{ fontSize: 10.5, fontWeight: 600, color: color || window.FB.inkMute, letterSpacing: '0.14em', ...style }}>{children}</div>;
}

// Display — modern sans, tight tracking, editorial but not antique
// `italic` prop routes to the serif (Instrument Serif) for case captions / figures only.
function Display({ children, size = 32, weight = 500, italic = false, style = {} }) {
  const serif = italic;
  return <div className={serif ? 'fb-serif' : 'fb-sans fb-tight'} style={{
    fontSize: size,
    fontWeight: serif ? 400 : weight,
    fontStyle: serif ? 'italic' : 'normal',
    color: window.FB.ink,
    letterSpacing: serif ? '-0.005em' : '-0.025em',
    lineHeight: 1.02,
    ...style,
  }}>{children}</div>;
}

// Flag dot — severity indicator
function FlagDot({ sev = 'med' }) {
  const T = window.FB;
  const c = { low: T.sandDeep, med: T.amber, high: T.ox, emergency: T.oxDeep }[sev];
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: c, boxShadow: sev === 'emergency' ? `0 0 0 2px ${T.oxWash}` : 'none' }} />;
}

// Paper card — clean surface with hairline
function Paper({ children, p = 16, style = {}, deep = false }) {
  const T = window.FB;
  return <div style={{ background: deep ? T.paperDeep : '#FFFFFF', border: `0.5px solid ${T.rule}`, padding: p, ...style }}>{children}</div>;
}

// Seal — modern monogram. Flat square with tight FB wordmark.
function Seal({ size = 48, label = 'FB', style = {} }) {
  const T = window.FB;
  return (
    <div style={{ width: size, height: size, background: T.ink, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <span className="fb-sans fb-tight" style={{ fontSize: size * 0.44, fontWeight: 600, letterSpacing: '-0.04em' }}>{label}</span>
    </div>
  );
}

// Striped placeholder — for "drop imagery here"
function StripedPlaceholder({ label, h = 120, style = {} }) {
  const T = window.FB;
  return (
    <div style={{
      height: h, background: `repeating-linear-gradient(135deg, ${T.paperDeep}, ${T.paperDeep} 6px, ${T.paperEdge} 6px, ${T.paperEdge} 12px)`,
      border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.inkMute, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      ...style,
    }}>{label}</div>
  );
}

// Severity / status chip
function Chip({ children, tone = 'ink', outline = true, style = {} }) {
  const T = window.FB;
  const map = { ink: [T.ink, T.paperDeep], ox: [T.ox, T.oxWash], sand: [T.sandDeep, T.sandWash], forest: [T.forest, T.forestWash], amber: [T.amber, T.amberWash], mute: [T.inkMute, T.paperDeep] };
  const [fg, bg] = map[tone];
  return (
    <span className="fb-sans" style={{
      fontSize: 11, fontWeight: 500, color: fg, background: outline ? 'transparent' : bg,
      border: outline ? `0.5px solid ${fg}55` : 'none', padding: '2px 7px', borderRadius: 999,
      display: 'inline-flex', alignItems: 'center', gap: 5, ...style,
    }}>{children}</span>
  );
}

// Mini bar chart for time-share comparisons
function BarCompare({ scheduled = 50, actual = 38, w = 140, height = 6 }) {
  const T = window.FB;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="fb-mono" style={{ fontSize: 9, color: T.inkMute, width: 48 }}>SCHED</div>
        <div style={{ width: w, height, background: T.paperEdge, borderRadius: 0 }}>
          <div style={{ width: `${scheduled}%`, height: '100%', background: T.ink }} />
        </div>
        <div className="fb-mono fb-tnum" style={{ fontSize: 10, color: T.ink }}>{scheduled}%</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="fb-mono" style={{ fontSize: 9, color: T.inkMute, width: 48 }}>ACTUAL</div>
        <div style={{ width: w, height, background: T.paperEdge, borderRadius: 0 }}>
          <div style={{ width: `${actual}%`, height: '100%', background: T.ox }} />
        </div>
        <div className="fb-mono fb-tnum" style={{ fontSize: 10, color: T.ox }}>{actual}%</div>
      </div>
    </div>
  );
}

// Entry type → letter mark (modernized palette)
const ENTRY_META = {
  journal:      { k: 'JR', color: '#5C6675', label: 'Journal' },
  exchange:     { k: 'EX', color: '#14181F', label: 'Exchange' },
  denied:       { k: 'DN', color: '#B44028', label: 'Visit Denied' },
  expense:      { k: 'EP', color: '#2F5A3A', label: 'Expense' },
  medical:      { k: 'MD', color: '#842E1C', label: 'Medical' },
  statement:    { k: 'ST', color: '#8A7647', label: 'Child Statement' },
  comm:         { k: 'CM', color: '#2B323D', label: 'Communication' },
  incident:     { k: 'IN', color: '#B44028', label: 'Incident' },
  compliance:   { k: 'CP', color: '#2F5A3A', label: 'Compliance' },
  witness:      { k: 'WT', color: '#A76A14', label: 'Witness' },
};

function EntryMark({ type, size = 22 }) {
  const T = window.FB;
  const m = ENTRY_META[type] || ENTRY_META.journal;
  return (
    <div style={{ width: size, height: size, border: `0.5px solid ${m.color}55`, color: m.color, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="fb-mono fb-tnum">
      <span style={{ fontSize: size * 0.36, fontWeight: 600, letterSpacing: '0.02em' }}>{m.k}</span>
    </div>
  );
}

Object.assign(window, { Icon, I, Stamp, Rule, Mono, Label, Display, FlagDot, Paper, Seal, StripedPlaceholder, Chip, BarCompare, EntryMark, ENTRY_META });
