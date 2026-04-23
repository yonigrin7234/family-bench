// Family Bench — DV / Safety layer
// Panic mode, decoy/stealth, emergency resources, confidential-address suppression,
// evidence preservation mode. Visual language shifts: higher contrast, bigger hit
// targets, simpler copy. This is life-critical UI.

// ─── Panic mode (active) — fullscreen mobile ─────────────────────
function PanicModeMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: '#0A0B0F', color: '#FFFFFF', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar dark/>

      {/* Recording pulse header */}
      <div style={{ padding: '60px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', width: 10, height: 10 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: '#E5484D', animation: 'pulse 1.2s ease-out infinite' }}/>
          <div style={{ position: 'absolute', inset: 2, borderRadius: 3, background: '#E5484D' }}/>
        </div>
        <span className="fb-sans" style={{ fontSize: 11, color: '#E5484D', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Protected mode · recording</span>
        <div style={{ flex: 1 }}/>
        <span className="fb-mono fb-tnum" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>00:47</span>
      </div>

      <div style={{ padding: '32px 24px 0' }}>
        <div className="fb-serif fb-tight" style={{ fontSize: 38, color: '#FFFFFF', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          I'm with you.
        </div>
        <div className="fb-serif" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 14, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: '-0.005em' }}>
          Audio, location, and timestamps are being recorded to a sealed entry. Nothing shows on this screen. Nothing syncs to anyone until you say so.
        </div>
      </div>

      {/* Active protections */}
      <div style={{ padding: '24px 24px 0' }}>
        <div className="fb-sans" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>What's active right now</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Audio capture', '16-bit · hashed every 30 s'],
            ['Location trail', 'Within 3 m · updated every 15 s'],
            ['Preserved timestamps', 'Device + server, cross-checked'],
            ['Disguised on unlock', "If someone opens the app, they'll see the weather"],
          ].map(([t, s], i) => (
            <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#2F7D32', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }} className="fb-sans">✓</div>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 13.5, color: '#FFFFFF', fontWeight: 600 }}>{t}</div>
                <div className="fb-sans" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Quick actions */}
      <div style={{ padding: '0 24px 20px' }}>
        <div className="fb-sans" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>If you need it</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={{
            padding: '16px 12px', background: '#E5484D', color: '#FFFFFF', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'left', fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Call</div>
            <div style={{ marginTop: 4 }}>911</div>
          </button>
          <button style={{
            padding: '16px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 14,
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'left', fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>DV Hotline</div>
            <div style={{ marginTop: 4 }}>1-800-799-7233</div>
          </button>
          <button style={{
            padding: '16px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 14,
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'left', fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Alert</div>
            <div style={{ marginTop: 4 }}>Trusted contact</div>
          </button>
          <button style={{
            padding: '16px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 14,
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'left', fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Find</div>
            <div style={{ marginTop: 4 }}>Nearest shelter</div>
          </button>
        </div>
      </div>

      {/* Stop bar */}
      <div style={{ padding: '0 24px 36px' }}>
        <div style={{
          padding: '18px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: 16,
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, background: '#0A0B0F', borderRadius: 2 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hold to stop</div>
            <div className="fb-sans" style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 500, marginTop: 2 }}>Recording will be sealed and saved to your case</div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }`}</style>
    </div>
  );
}

// ─── Decoy / Stealth settings — mobile ──────────────────────────
function StealthSettingsMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Stealth & Safety</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Hide, decoy, confidential</div>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 30px' }}>
        {/* Opener */}
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your protection layer</div>
        <div className="fb-serif fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.15 }}>
          Make this app harder to find and harder to open.
        </div>
        <div className="fb-serif" style={{ fontSize: 14, color: T.inkSoft, marginTop: 10, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: '-0.005em' }}>
          If someone takes your phone, what do you want them to see?
        </div>

        {/* Panic trigger */}
        <div style={{ marginTop: 20, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid #E5484D40`, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: '#B43238', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Panic trigger</div>
          <div className="fb-serif fb-tight" style={{ fontSize: 18, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 3 }}>
            Three-tap · side button
          </div>
          <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 4, lineHeight: 1.5 }}>
            Press the lock button three times. Nothing visible changes. Recording starts. Your trusted contact gets a silent alert.
          </div>
          <Rule style={{ margin: '12px 0' }}/>
          <Toggle label="Enabled" on/>
        </div>

        {/* Decoy */}
        <div style={{ marginTop: 12, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Decoy mode</div>
          <div className="fb-serif fb-tight" style={{ fontSize: 18, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 3 }}>
            Show a different app if someone opens this one
          </div>

          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>Pick a decoy</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { n: 'Weather',     icon: '☀', selected: true },
              { n: 'Calculator',  icon: '=', },
              { n: 'Notes',       icon: '✎', },
              { n: 'Recipes',     icon: '♨', },
              { n: 'Meditation',  icon: '◯', },
              { n: 'None',        icon: '—', },
            ].map((d, i) => (
              <div key={i} style={{
                padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                background: d.selected ? T.ink : T.paperDeep,
                color: d.selected ? T.paper : T.ink,
                border: `0.5px solid ${d.selected ? T.ink : T.rule}`,
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{d.icon}</div>
                <div className="fb-sans" style={{ fontSize: 11, fontWeight: 500 }}>{d.n}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '10px 12px', background: T.paperDeep, borderRadius: 10 }}>
            <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>How to reveal</div>
            <div className="fb-sans" style={{ fontSize: 12, color: T.ink, lineHeight: 1.5 }}>
              Swipe down with three fingers on the decoy screen, then enter your PIN.
            </div>
          </div>
        </div>

        {/* Hide app */}
        <div style={{ marginTop: 12, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hide on home screen</div>
          <Toggle label='Replace name with "Notes"' on/>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label="Use generic gray icon" on/>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label='Hide from Spotlight & Siri search' on/>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label='Auto-clear recent screenshots' off/>
        </div>

        {/* Confidential */}
        <div style={{ marginTop: 12, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confidential address</div>
          <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 4, lineHeight: 1.5 }}>
            California CCP § 367.3 — your address will be suppressed from every document, PDF, filing, and shared view.
          </div>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label="Suppress my address" on/>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label="Suppress child's school" on/>
          <Rule style={{ margin: '10px 0' }}/>
          <Toggle label="Suppress workplace" off/>
        </div>

        {/* Resources */}
        <div style={{ marginTop: 20 }}>
          <PillButton tone="ghost" size="lg" full iconRight="m9 6 6 6-6 6">Emergency resources</PillButton>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on }) {
  const T = window.FB;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="fb-sans" style={{ fontSize: 13, color: T.ink }}>{label}</span>
      <div style={{
        width: 36, height: 22, borderRadius: 11,
        background: on ? T.ox : T.inkFaint,
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 18, height: 18, background: '#FFFFFF', borderRadius: 9,
          transition: 'left 0.2s',
        }}/>
      </div>
    </div>
  );
}

// ─── Emergency resources — mobile ────────────────────────────────
function EmergencyResourcesMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Emergency resources</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Alameda County · updated today</div>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 30px' }}>
        {/* Immediate danger */}
        <div style={{ padding: '16px 18px', background: '#FDEDED', border: '0.5px solid #E5484D40', borderRadius: 14, marginBottom: 12 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: '#B43238', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>If you're in danger now</div>
          <div className="fb-serif fb-tight" style={{ fontSize: 20, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.2 }}>
            Call 911 or text 911
          </div>
          <div className="fb-sans" style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>
            Text-to-911 works in Alameda County.
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button style={{
              padding: '14px 12px', background: '#E5484D', color: '#FFFFFF', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>Call 911</button>
            <button style={{
              padding: '14px 12px', background: '#FFFFFF', color: '#E5484D', border: '1px solid #E5484D', borderRadius: 12,
              fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>Text 911</button>
          </div>
        </div>

        {/* Hotlines */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, marginBottom: 10 }}>Hotlines · 24/7 · free</div>
        {[
          { n: 'National DV Hotline', num: '1-800-799-7233', text: 'Text "START" to 88788', langs: '200+ languages' },
          { n: 'California Coalition for Battered Women', num: '1-888-988-9239', langs: 'EN · ES' },
          { n: 'Alameda County DV Shelter', num: '1-510-536-7233', langs: 'EN · ES · ZH · VI' },
          { n: 'LGBTQ+ Violence Hotline', num: '1-866-488-7386' },
          { n: 'Legal Aid of Alameda County', num: '1-510-663-4755', note: 'Free family-law advice · sliding scale' },
        ].map((h, i) => (
          <div key={i} style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12, marginBottom: 6 }}>
            <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{h.n}</div>
            <div className="fb-mono" style={{ fontSize: 14, color: T.ox, fontWeight: 600, marginTop: 4 }}>{h.num}</div>
            {h.text && <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{h.text}</div>}
            {h.langs && <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{h.langs}</div>}
            {h.note && <div className="fb-sans" style={{ fontSize: 11, color: T.inkSoft, marginTop: 4, fontStyle: 'italic' }}>{h.note}</div>}
          </div>
        ))}

        {/* Shelters near you */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Shelters · within 15 miles</div>
        {[
          { n: 'Safe Passage — Oakland', d: '2.1 mi · beds available', b: 'Confidential location · call first' },
          { n: 'Ruby\'s Place — Hayward', d: '9.4 mi · 3 beds open', b: '72-hr emergency · 60-day transitional' },
          { n: 'Tri-Valley Haven', d: '14 mi · family suites', b: 'Children welcome · pets by arrangement' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12, marginBottom: 6 }}>
            <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{s.n}</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 500, marginTop: 2 }}>{s.d}</div>
            <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 3, lineHeight: 1.45 }}>{s.b}</div>
          </div>
        ))}

        {/* Safety plan */}
        <div style={{ marginTop: 18, padding: '16px 18px', background: T.paperDeep, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Safety plan</div>
          <div className="fb-serif fb-tight" style={{ fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.25 }}>
            Build a plan for if you need to leave quickly.
          </div>
          <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 6, lineHeight: 1.5 }}>
            Documents, medications, keys, one bag. Takes 10 minutes. Private — only you see it.
          </div>
          <div style={{ marginTop: 10 }}>
            <PillButton tone="primary" size="md" iconRight="m9 6 6 6-6 6">Build my safety plan</PillButton>
          </div>
        </div>

        {/* Browser safety */}
        <div style={{ marginTop: 12, padding: '12px 14px', background: T.paperDeep + '80', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon d={I.lock} size={13} stroke={T.inkSoft} sw={1.8}/>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkSoft, lineHeight: 1.5, flex: 1 }}>
            Reading this on a shared device? <span style={{ color: T.ox, fontWeight: 600 }}>Tap here to close and clear</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Preservation Mode banner — shown on Home ───────────
function EvidencePreservationDesktop() {
  const T = window.FB;
  return (
    <DesktopShell active="home">
      {/* Active banner */}
      <div style={{ padding: '20px 40px', background: '#0A0B0F', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 12, height: 12 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: '#E5484D', animation: 'pulse 1.5s ease-out infinite' }}/>
          <div style={{ position: 'absolute', inset: 3, borderRadius: 3, background: '#E5484D' }}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: '#E5484D', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Evidence Preservation Mode · active since Apr 10</div>
          <div className="fb-sans" style={{ fontSize: 13.5, color: '#FFFFFF', fontWeight: 500, marginTop: 2 }}>Every entry triple-signed · redundant backups · confidential address on · decoy enabled</div>
        </div>
        <PillButton tone="ghost" size="sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>Manage</PillButton>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Safety</div>
          <div className="fb-serif fb-tight" style={{ fontSize: 36, color: T.ink, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 6, lineHeight: 1.05 }}>
            You're protected.
          </div>
          <div className="fb-serif" style={{ fontSize: 17, color: T.inkSoft, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: '-0.005em', maxWidth: 640 }}>
            Because you've opted into preservation mode, every entry is signed with three independent timestamps, every file hash is mirrored to two backup regions, and every screen output strips your home address and your child's school.
          </div>

          {/* What's protected */}
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { i: '✓', t: 'Address suppressed', s: 'CCP § 367.3 · hidden from all filings + PDFs' },
              { i: '✓', t: 'Child\'s school hidden', s: 'Not printed, not shared, not even in metadata' },
              { i: '✓', t: 'Triple-signed entries', s: 'Device + server + trusted notary endpoint' },
              { i: '✓', t: 'Mirrored backups', s: 'US-West + US-East · SHA-256 cross-verified' },
              { i: '✓', t: 'Screenshot detection', s: 'Alerts if anyone snapshots this screen' },
              { i: '✓', t: 'Tamper canary',  s: 'Hourly proof of integrity · public URL' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: T.forest, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }} className="fb-sans">{f.i}</div>
                <div>
                  <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{f.t}</div>
                  <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 3, lineHeight: 1.5 }}>{f.s}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Safety plan progress */}
          <div style={{ marginTop: 20, padding: '20px 22px', background: T.paperDeep, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your safety plan</div>
                <div className="fb-serif fb-tight" style={{ fontSize: 19, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
                  6 of 8 steps complete
                </div>
              </div>
              <div className="fb-sans fb-tight fb-tnum" style={{ fontSize: 28, color: T.ox, fontWeight: 600, letterSpacing: '-0.025em' }}>75%</div>
            </div>
            {[
              ['Trusted contact set', true, 'Sister — Maya'],
              ['Escape bag location', true, 'Front hall closet'],
              ['Key documents copied', true, 'Digital + printed'],
              ['Medications list', true, '2 for me, 1 for Leonie'],
              ['Legal aid contact saved', true, 'Alameda Legal Aid'],
              ['Safe address chosen', true, 'Maya\'s — not shared here'],
              ['Code word with Leonie', false, 'Something she\'ll remember'],
              ['Daycare + school alerted', false, 'Who can and cannot pick up'],
            ].map(([t, done, note], i) => (
              <div key={i} style={{ padding: '9px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, background: done ? T.forest : 'transparent', border: done ? 'none' : `1.5px solid ${T.inkFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: T.paper, fontSize: 10, fontWeight: 700 }} className="fb-sans">
                  {done ? '✓' : ''}
                </div>
                <span className="fb-sans" style={{ fontSize: 13, color: done ? T.inkMute : T.ink, fontWeight: done ? 400 : 600, textDecoration: done ? 'line-through' : 'none', flex: 1 }}>{t}</span>
                <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Panic button</div>
          <div style={{ marginTop: 10, padding: '20px 22px', background: '#0A0B0F', color: '#FFFFFF', borderRadius: 16 }}>
            <div className="fb-serif fb-tight" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Triple-tap the side button.
            </div>
            <div className="fb-sans" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.5 }}>
              Audio + location start recording silently. Maya gets a text. Your screen doesn't change — so whoever's with you doesn't know.
            </div>
            <Rule style={{ margin: '14px 0', borderColor: 'rgba(255,255,255,0.1)' }}/>
            <div className="fb-sans" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Last test</div>
            <div className="fb-sans" style={{ fontSize: 12, color: '#FFFFFF' }}>12 days ago · worked in 2.1 s</div>
            <div style={{ marginTop: 12 }}>
              <PillButton tone="ghost" size="sm" full style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>Test it now</PillButton>
            </div>
          </div>

          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22 }}>Trusted contact</div>
          <div style={{ marginTop: 10, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="fb-serif" style={{ fontSize: 16, color: T.ink, fontWeight: 500, fontStyle: 'italic' }}>M</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Maya Ortega</div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>Sister · Oakland · verified</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T.forest }}/>
          </div>

          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22 }}>Quick exit</div>
          <div style={{ marginTop: 10, padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12 }}>
            <div className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500, lineHeight: 1.5 }}>
              Press <span className="fb-mono" style={{ background: T.paperDeep, padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Esc</span> or swipe left to instantly show a weather app.
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }`}</style>
    </DesktopShell>
  );
}

Object.assign(window, { PanicModeMobile, StealthSettingsMobile, EmergencyResourcesMobile, EvidencePreservationDesktop });
