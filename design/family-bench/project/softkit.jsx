// Family Bench — Claude-style "soft" primitives + Intuit wayfinding building blocks.
// Used by the v2 screens alongside the existing primitives.

// ─── PillButton — Claude-style, soft-rounded, subtle hover tone ──────
function PillButton({ children, tone = 'ghost', size = 'md', icon, iconRight, onClick, style = {}, full = false }) {
  const T = window.FB;
  const sizes = {
    sm: { p: '6px 12px', f: 12, r: 10, gap: 6, i: 13 },
    md: { p: '10px 16px', f: 13, r: 12, gap: 8, i: 15 },
    lg: { p: '14px 20px', f: 14, r: 14, gap: 9, i: 17 },
  }[size];
  const tones = {
    primary: { bg: T.ink, fg: T.paper, bd: T.ink },
    soft: { bg: T.paperDeep, fg: T.ink, bd: 'transparent' },
    ghost: { bg: 'transparent', fg: T.ink, bd: T.rule },
    accent: { bg: T.ox, fg: T.paper, bd: T.ox },
    accentSoft: { bg: T.oxWash, fg: T.oxDeep, bd: 'transparent' },
  }[tone];
  return (
    <button onClick={onClick} className="fb-sans" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sizes.gap,
      padding: sizes.p, fontSize: sizes.f, fontWeight: 500, letterSpacing: '-0.01em',
      background: tones.bg, color: tones.fg, border: `0.5px solid ${tones.bd}`, borderRadius: sizes.r,
      cursor: 'pointer', width: full ? '100%' : 'auto', whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon d={icon} size={sizes.i} stroke={tones.fg} sw={1.6}/>}
      {children}
      {iconRight && <Icon d={iconRight} size={sizes.i} stroke={tones.fg} sw={1.6}/>}
    </button>
  );
}

// ─── SoftCard — rounded, breathing, optional header ───────────────
function SoftCard({ title, subtitle, right, children, p = 18, style = {}, accent = false, interactive = false }) {
  const T = window.FB;
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, border: `0.5px solid ${T.rule}`,
      padding: p, boxShadow: accent ? `0 1px 0 ${T.rule}, 0 0 0 1px ${T.ox}20` : `0 1px 0 ${T.rule}`,
      ...style,
    }}>
      {(title || right) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            {title && <div className="fb-sans fb-tight" style={{ fontSize: 15, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>{title}</div>}
            {subtitle && <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkMute, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── StepRail — Intuit-style numbered outline, checkmarks, progress ──
function StepRail({ steps, current, style = {} }) {
  const T = window.FB;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...style }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        const hasSub = s.sub && (active || done);
        return (
          <div key={i}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px',
              background: active ? T.paperDeep : 'transparent', borderRadius: 10,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 1,
                background: done ? T.forest : active ? T.ink : 'transparent',
                border: upcoming ? `1px solid ${T.rule}` : 'none',
                color: done || active ? T.paper : T.inkMute,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
              }} className="fb-sans">
                {done ? <svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 5.5l2.2 2L9 2.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> : (i + 1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fb-sans" style={{
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  color: done ? T.inkSoft : active ? T.ink : upcoming ? T.inkMute : T.ink,
                  letterSpacing: '-0.01em',
                }}>{s.label}</div>
                {s.hint && <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>{s.hint}</div>}
              </div>
              {s.badge && (
                <span className="fb-sans" style={{ fontSize: 10, fontWeight: 600, color: T.ox, background: T.oxWash, padding: '2px 7px', borderRadius: 999 }}>{s.badge}</span>
              )}
            </div>
            {hasSub && (
              <div style={{ paddingLeft: 45, marginBottom: 4 }}>
                {s.sub.map((t, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5, color: t.done ? T.inkMute : T.inkSoft }} className="fb-sans">
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: t.done ? T.forestWash : T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2L7 1.5" stroke={T.forest} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ProgressBar — big friendly ──────────────────────────────
function ProgressBar({ pct, label, style = {} }) {
  const T = window.FB;
  return (
    <div style={style}>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute, fontWeight: 500 }}>{label}</span>
        <span className="fb-sans fb-tnum" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{pct}%</span>
      </div>}
      <div style={{ height: 6, background: T.paperDeep, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: T.ink, borderRadius: 3, transition: 'width 300ms' }}/>
      </div>
    </div>
  );
}

// ─── HelpTip — "What does this mean?" inline explainer ───────
function HelpTip({ term, children, inline = false }) {
  const T = window.FB;
  return (
    <span style={{ display: inline ? 'inline-flex' : 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: T.ink, borderBottom: `1px dotted ${T.inkFaint}`, cursor: 'help' }}>{term}</span>
      {!inline && children && (
        <span style={{ width: 14, height: 14, borderRadius: 7, background: T.paperDeep, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: T.inkMute, fontWeight: 600, cursor: 'help' }} className="fb-sans">?</span>
      )}
    </span>
  );
}

// ─── InfoCallout — "Why this matters" side panel ────────────
function InfoCallout({ title, children, tone = 'ink' }) {
  const T = window.FB;
  const tones = { ink: { bg: T.paperDeep, bd: T.rule, fg: T.ink, mark: T.ink },
                  ox:  { bg: T.oxWash, bd: `${T.ox}30`, fg: T.oxDeep, mark: T.ox },
                  forest: { bg: T.forestWash, bd: `${T.forest}30`, fg: T.forest, mark: T.forest } }[tone];
  return (
    <div style={{ background: tones.bg, borderRadius: 12, padding: '14px 16px', border: `0.5px solid ${tones.bd}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 4, height: 4, borderRadius: 2, background: tones.mark }}/>
        <span className="fb-sans" style={{ fontSize: 10.5, fontWeight: 600, color: tones.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div className="fb-sans" style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

// ─── BigChoice — TurboTax-style big radio tile ───────────────
function BigChoice({ label, hint, selected, icon, onClick, badge }) {
  const T = window.FB;
  return (
    <div onClick={onClick} style={{
      padding: '16px 18px', background: selected ? T.paperDeep : '#FFFFFF',
      border: `1px solid ${selected ? T.ink : T.rule}`, borderRadius: 14,
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      boxShadow: selected ? `0 0 0 3px ${T.ink}10` : 'none',
    }}>
      {icon && (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: selected ? T.ink : T.paperDeep, color: selected ? T.paper : T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon d={icon} size={18} stroke="currentColor" sw={1.6}/>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div className="fb-sans fb-tight" style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{label}</div>
        {hint && <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 2 }}>{hint}</div>}
      </div>
      {badge && <span className="fb-sans" style={{ fontSize: 10, fontWeight: 600, color: T.ox, background: T.oxWash, padding: '3px 8px', borderRadius: 999 }}>{badge}</span>}
      <div style={{ width: 18, height: 18, borderRadius: 9, border: `1.5px solid ${selected ? T.ink : T.rule}`, background: selected ? T.ink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.paper }}/>}
      </div>
    </div>
  );
}

// ─── MoodDot — tender face-free mood indicator (colored dot + label) ─
const MOODS = [
  { k: 'calm',       label: 'Calm',        color: '#6E9E7A', note: 'Relaxed, settled, content' },
  { k: 'happy',      label: 'Happy',       color: '#C99B3E', note: 'Energetic, smiling, engaged' },
  { k: 'quiet',      label: 'Quiet',       color: '#8896A8', note: 'Withdrawn, few words' },
  { k: 'anxious',    label: 'Anxious',     color: '#C99B3E', note: 'Clingy, nervous, watchful' },
  { k: 'upset',      label: 'Upset',       color: '#B48338', note: 'Tearful, frustrated' },
  { k: 'distressed', label: 'Distressed',  color: '#B44028', note: 'Crying, panicked, shaken' },
  { k: 'angry',      label: 'Angry',       color: '#842E1C', note: 'Shouting, stomping, resistant' },
];

function MoodPicker({ value, onPick }) {
  const T = window.FB;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {MOODS.map(m => {
        const sel = value === m.k;
        return (
          <div key={m.k} onClick={() => onPick && onPick(m.k)} style={{
            padding: '12px 14px', borderRadius: 12,
            background: sel ? T.paperDeep : '#FFFFFF',
            border: `1px solid ${sel ? T.ink : T.rule}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: sel ? `0 0 0 3px ${T.ink}10` : 'none',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: m.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fb-sans" style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{m.label}</div>
              <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segment — soft segmented control ────────────────────
function Segment({ items, value, onChange, full = true }) {
  const T = window.FB;
  return (
    <div style={{ display: 'inline-flex', padding: 3, background: T.paperDeep, borderRadius: 10, width: full ? '100%' : 'auto' }}>
      {items.map(it => {
        const active = it.v === value;
        return (
          <div key={it.v} onClick={() => onChange && onChange(it.v)} style={{
            flex: full ? 1 : 'initial', padding: '7px 14px', borderRadius: 8, textAlign: 'center',
            background: active ? '#FFFFFF' : 'transparent', color: active ? T.ink : T.inkMute,
            fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: 'pointer',
            boxShadow: active ? '0 1px 2px rgba(20,24,31,0.08)' : 'none',
          }} className="fb-sans">{it.label}</div>
        );
      })}
    </div>
  );
}

// ─── NextStep — Intuit's "what to do now" hero ───────────
function NextStepCard({ kicker, title, body, primary, secondary, tone = 'ox' }) {
  const T = window.FB;
  const fg = tone === 'ox' ? T.ox : T.ink;
  const bg = tone === 'ox' ? T.oxWash : T.paperDeep;
  return (
    <div style={{ padding: '20px 22px', background: bg, borderRadius: 16, border: `0.5px solid ${fg}25` }}>
      <div className="fb-sans" style={{ fontSize: 10.5, color: fg, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{kicker}</div>
      <div className="fb-sans fb-tight" style={{ fontSize: 22, color: T.ink, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</div>
      {body && <div className="fb-sans" style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{body}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {primary && <PillButton tone="primary" size="md">{primary}</PillButton>}
        {secondary && <PillButton tone="ghost" size="md">{secondary}</PillButton>}
      </div>
    </div>
  );
}

// ─── FBStatusBar — thin iOS-style status bar for mobile frames ──────
function FBStatusBar({ dark = false, time = '9:41' }) {
  const c = dark ? '#FFFFFF' : '#14181F';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, padding: '14px 26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10, pointerEvents: 'none' }}>
      <span className="fb-sans fb-tnum" style={{ fontSize: 15, fontWeight: 600, color: c, letterSpacing: '-0.01em' }}>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {/* Signal */}
        <svg width="17" height="10" viewBox="0 0 17 11" fill="none">
          {[3, 5, 7, 9].map((h, i) => <rect key={i} x={1 + i*4} y={10-h} width="3" height={h} rx="0.5" fill={c}/>)}
        </svg>
        {/* Wifi */}
        <svg width="15" height="10" viewBox="0 0 16 11" fill="none">
          <path d="M8 10.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM2.2 4.2A8.2 8.2 0 0 1 8 2a8.2 8.2 0 0 1 5.8 2.2M4.6 6.6A4.8 4.8 0 0 1 8 5a4.8 4.8 0 0 1 3.4 1.6" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {/* Battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke={c} strokeOpacity="0.35"/>
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill={c}/>
          <rect x="23" y="4" width="1.5" height="4" rx="0.75" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

Object.assign(window, { PillButton, SoftCard, StepRail, ProgressBar, HelpTip, InfoCallout, BigChoice, MoodPicker, MOODS, Segment, NextStepCard, FBStatusBar });
