// Family Bench — Integrations & Connectors
// Claude-style connector list with REAL brand logos (inline SVG, no external assets).
// Scope: court portals, calendar, co-parenting, docs, cloud, evidence sources.

// ─── Brand logos — inline SVG, authentic colors ──────────────────
const Logos = {
  // Google Calendar — calendar with "31" and Google colors
  gcal: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect x="7" y="7" width="34" height="34" rx="3" fill="#fff" stroke="#DADCE0"/>
      <path d="M7 14h34v6H7z" fill="#1A73E8"/>
      <text x="24" y="34" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#1A73E8" textAnchor="middle">31</text>
      <rect x="13" y="5" width="3" height="6" rx="1" fill="#5F6368"/>
      <rect x="32" y="5" width="3" height="6" rx="1" fill="#5F6368"/>
    </svg>
  ),
  // Gmail — classic envelope M
  gmail: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M6 14v22a2 2 0 0 0 2 2h6V22l10 7 10-7v16h6a2 2 0 0 0 2-2V14l-4-2-14 10L10 12z" fill="#EA4335"/>
      <path d="M6 14l4-2 14 10 14-10 4 2v4L24 30 6 18z" fill="#FBBC04"/>
      <path d="M38 38V22l4-3v17a2 2 0 0 1-2 2z" fill="#34A853"/>
      <path d="M6 38V22l4 3v13z" fill="#4285F4"/>
    </svg>
  ),
  // Apple iCloud — cloud shape
  icloud: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <defs>
        <linearGradient id="icg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3FA9F5"/>
          <stop offset="1" stopColor="#1E7ECC"/>
        </linearGradient>
      </defs>
      <path d="M14 34a8 8 0 0 1-1-15.9A10 10 0 0 1 33 18a7 7 0 0 1 1 14H14z" fill="url(#icg)"/>
    </svg>
  ),
  // Google Drive — triangle
  gdrive: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M18 6h12l14 24H22L8 30z" fill="#FFC107"/>
      <path d="M22 30h22l-6 10H16z" fill="#1976D2"/>
      <path d="M8 30l8-12 12-12-6 12-8 14z" fill="#4CAF50"/>
    </svg>
  ),
  // Dropbox — twin blue boxes
  dropbox: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M14 6L4 13l10 7 10-7zM34 6l-10 7 10 7 10-7zM4 27l10 7 10-7-10-7zM34 20l-10 7 10 7 10-7zM14 36l10 7 10-7-10-7z" fill="#0061FF"/>
    </svg>
  ),
  // Docusign — black/yellow D
  docusign: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="6" fill="#FFCC22"/>
      <path d="M14 10h10c7 0 12 6 12 14s-5 14-12 14H14z M20 16v16h4c4 0 7-3 7-8s-3-8-7-8z" fill="#000" fillRule="evenodd"/>
    </svg>
  ),
  // Zoom — blue video
  zoom: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#2D8CFF"/>
      <path d="M10 18v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V18a2 2 0 0 0-2-2H12a2 2 0 0 0-2 2zm22 2l6-3v12l-6-3z" fill="#fff"/>
    </svg>
  ),
  // Ring — teal camera
  ring: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#1998D5"/>
      <circle cx="24" cy="24" r="9" fill="none" stroke="#fff" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="3.5" fill="#fff"/>
      <circle cx="33" cy="15" r="1.6" fill="#fff"/>
    </svg>
  ),
  // Nest — green thermostat circle
  nest: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <circle cx="24" cy="24" r="18" fill="#00A4B4"/>
      <circle cx="24" cy="24" r="12" fill="#0B6E7A"/>
      <circle cx="24" cy="24" r="5" fill="#fff"/>
    </svg>
  ),
  // Apple (for iMessage / health)
  apple: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M33.5 25.3c0-4.2 3.4-6.2 3.6-6.3-2-2.9-5-3.3-6.1-3.3-2.6-.3-5 1.5-6.3 1.5s-3.3-1.5-5.5-1.4c-2.8 0-5.4 1.6-6.9 4.2-2.9 5-.8 12.5 2.1 16.5 1.4 2 3.1 4.2 5.3 4.1 2.1-.1 3-1.4 5.5-1.4s3.3 1.4 5.5 1.3c2.3 0 3.7-2 5.1-4a17 17 0 0 0 2.3-4.7c0-.1-4.5-1.8-4.6-6.5zm-4.2-12c1.1-1.4 1.9-3.3 1.7-5.2-1.6.1-3.6 1.1-4.8 2.5-1 1.2-2 3.2-1.7 5 1.8.2 3.6-.9 4.8-2.3z" fill="#14181F"/>
    </svg>
  ),
  // OurFamilyWizard — heart+gear in blue
  ofw: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#0A3D62"/>
      <path d="M24 36s-10-6-10-14a6 6 0 0 1 10-4 6 6 0 0 1 10 4c0 8-10 14-10 14z" fill="#F5A623"/>
    </svg>
  ),
  // TalkingParents — green bubble
  talkingparents: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#2C7A3D"/>
      <path d="M10 16a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H20l-7 6v-6h-1a2 2 0 0 1-2-2z" fill="#fff"/>
      <circle cx="18" cy="22" r="1.8" fill="#2C7A3D"/>
      <circle cx="24" cy="22" r="1.8" fill="#2C7A3D"/>
      <circle cx="30" cy="22" r="1.8" fill="#2C7A3D"/>
    </svg>
  ),
  // TurboCourt — orange T (CA efiling)
  turbocourt: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#F16522"/>
      <path d="M10 14h28v6h-11v18h-6V20H10z" fill="#fff"/>
    </svg>
  ),
  // Odyssey / Tyler — generic court portal (dark blue C)
  odyssey: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#1B3A5F"/>
      <path d="M16 8h4v4h-4zM28 8h4v4h-4zM10 16h28v2H10zM12 20h24v20H12z" fill="#C9A961"/>
      <path d="M16 24h16v2H16zM16 28h16v2H16zM16 32h12v2H16z" fill="#1B3A5F"/>
    </svg>
  ),
  // LA County Superior (generic seal)
  courtportal: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <circle cx="24" cy="24" r="20" fill="#7A1F2B"/>
      <circle cx="24" cy="24" r="16" fill="none" stroke="#C9A961" strokeWidth="1"/>
      <path d="M24 10l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="#C9A961"/>
      <text x="24" y="38" fontFamily="Georgia, serif" fontSize="5" fill="#C9A961" textAnchor="middle" fontWeight="700">SUPERIOR COURT</text>
    </svg>
  ),
  // iMessage — green bubble
  imessage: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M24 6C13 6 4 13 4 22c0 5 2.8 9.4 7.3 12.3L9 42l8-4.3c2.2.5 4.6.8 7 .8 11 0 20-7 20-16.5S35 6 24 6z" fill="#34C759"/>
    </svg>
  ),
  // WhatsApp
  whatsapp: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path d="M4 44l3-11a20 20 0 1 1 8 8L4 44z" fill="#25D366"/>
      <path d="M16 15c-1-2-2-2-3-2s-4 1-4 5 4 9 4 9 6 7 11 8 6 1 7 0 2-3 2-4-2-1-3-2-2-1-3 0-1 2-2 2-3-2-5-4-4-5-4-6 1-1 1-2 1-1 1-2 1-1 0-2l-2-4z" fill="#fff"/>
    </svg>
  ),
  // Dropbox-like Stripe for payments
  stripe: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#635BFF"/>
      <path d="M22 18c0-1 1-1.5 2.5-1.5 2 0 5 .6 7 1.6v-6a20 20 0 0 0-7-1.1c-5.7 0-9.5 3-9.5 8 0 7.7 10 6.4 10 9.7 0 1.2-1 1.7-2.7 1.7-2.2 0-5-.9-7.3-2.1v6.2a18 18 0 0 0 7.3 1.5c5.8 0 9.7-2.9 9.7-8 0-8.3-10-6.7-10-10z" fill="#fff"/>
    </svg>
  ),
  // Apple Health (heart)
  applehealth: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#fff" stroke="#EEE"/>
      <path d="M24 38s-12-7-12-16a7 7 0 0 1 12-5 7 7 0 0 1 12 5c0 9-12 16-12 16z" fill="#FA2E48"/>
    </svg>
  ),
  // Venmo-style (co-parent expense sharing)
  venmo: (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <rect width="48" height="48" rx="10" fill="#3D95CE"/>
      <path d="M34 12c1.5 2.3 2 4.8 2 7.7 0 9-8 21-14 27H10L4 14l12-1 3 25c3-4 6.5-10 6.5-14.2 0-2.3-.4-3.9-1-5.2z" fill="#fff"/>
    </svg>
  ),
};

// ─── Integration row — Claude-style ───────────────────────────────
function IntegrationRow({ logo, name, subtitle, on, disabled, status, onToggle }) {
  const T = window.FB;
  const [checked, setChecked] = React.useState(on);
  return (
    <div style={{
      padding: '12px 14px', background: disabled ? T.paperDeep + '60' : 'transparent',
      borderBottom: `0.5px solid ${T.ruleSoft}`,
      display: 'flex', gap: 14, alignItems: 'center',
      opacity: disabled ? 0.55 : 1,
    }}>
      <div style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 500, lineHeight: 1.2 }}>{name}</div>
        {subtitle && <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
      {status && (
        <div className="fb-sans" style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: status === 'needs-auth' ? T.ox : status === 'syncing' ? T.forest : T.inkMute,
          marginRight: 6,
        }}>{status === 'needs-auth' ? 'Reconnect' : status === 'syncing' ? 'Syncing' : status}</div>
      )}
      <SwitchToggle on={checked} onClick={() => !disabled && setChecked(v => !v)}/>
    </div>
  );
}

function SwitchToggle({ on, onClick }) {
  const T = window.FB;
  return (
    <div onClick={onClick} style={{
      width: 36, height: 22, borderRadius: 11, cursor: 'pointer',
      background: on ? '#0A84FF' : '#D6D3CB',
      position: 'relative', transition: 'background 0.18s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 18, height: 18, background: '#FFFFFF', borderRadius: 9,
        transition: 'left 0.18s',
        boxShadow: '0 1.5px 3px rgba(0,0,0,0.12)',
      }}/>
    </div>
  );
}

// ─── Mobile: connector settings menu (matches user reference) ──────
function ConnectorsMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Connectors</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>8 connected · 3 syncing</div>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '14px 20px 6px' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Court + legal</div>
        </div>
        <div style={{ background: '#FFFFFF', margin: '0 20px', borderRadius: 14, border: `0.5px solid ${T.rule}`, overflow: 'hidden' }}>
          <IntegrationRow logo={Logos.courtportal} name="Alameda Superior Court" subtitle="Case 24FL-04812 · filings, minute orders" on status="syncing"/>
          <IntegrationRow logo={Logos.turbocourt} name="TurboCourt" subtitle="California e-filing" on/>
          <IntegrationRow logo={Logos.docusign} name="Docusign" subtitle="Notarized declarations"/>
        </div>

        <div style={{ padding: '18px 20px 6px' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Co-parenting</div>
        </div>
        <div style={{ background: '#FFFFFF', margin: '0 20px', borderRadius: 14, border: `0.5px solid ${T.rule}`, overflow: 'hidden' }}>
          <IntegrationRow logo={Logos.ofw} name="OurFamilyWizard" subtitle="Messages · ToneMeter · shared calendar" on status="needs-auth"/>
          <IntegrationRow logo={Logos.talkingparents} name="TalkingParents" subtitle="Locked messaging thread" on/>
        </div>

        <div style={{ padding: '18px 20px 6px' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Calendar + comms</div>
        </div>
        <div style={{ background: '#FFFFFF', margin: '0 20px', borderRadius: 14, border: `0.5px solid ${T.rule}`, overflow: 'hidden' }}>
          <IntegrationRow logo={Logos.gcal} name="Google Calendar" subtitle="Custody schedule · hearings" on/>
          <IntegrationRow logo={Logos.gmail} name="Gmail" subtitle="Auto-archive opposing counsel" on/>
          <IntegrationRow logo={Logos.imessage} name="iMessage" subtitle="Export threads as evidence"/>
          <IntegrationRow logo={Logos.whatsapp} name="WhatsApp"/>
        </div>

        <div style={{ padding: '18px 20px 6px' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Storage + docs</div>
        </div>
        <div style={{ background: '#FFFFFF', margin: '0 20px', borderRadius: 14, border: `0.5px solid ${T.rule}`, overflow: 'hidden' }}>
          <IntegrationRow logo={Logos.icloud} name="iCloud" subtitle="12 GB · backup" on/>
          <IntegrationRow logo={Logos.gdrive} name="Google Drive" subtitle="Shared with attorney"/>
          <IntegrationRow logo={Logos.dropbox} name="Dropbox"/>
        </div>

        <div style={{ padding: '18px 20px 6px' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Evidence sources</div>
        </div>
        <div style={{ background: '#FFFFFF', margin: '0 20px', borderRadius: 14, border: `0.5px solid ${T.rule}`, overflow: 'hidden' }}>
          <IntegrationRow logo={Logos.ring} name="Ring" subtitle="Doorbell footage at exchanges"/>
          <IntegrationRow logo={Logos.nest} name="Nest" subtitle="Indoor cam · kitchen handoff"/>
          <IntegrationRow logo={Logos.zoom} name="Zoom" subtitle="Recorded supervised visits"/>
          <IntegrationRow logo={Logos.applehealth} name="Apple Health" subtitle="Sleep + HRV near events"/>
          <IntegrationRow logo={Logos.venmo} name="Venmo" subtitle="Expense receipts · reimbursements"/>
        </div>

        {/* Footer actions — matches user reference */}
        <div style={{ margin: '22px 20px 16px', padding: '4px 0', borderTop: `0.5px solid ${T.rule}` }}>
          {[
            { i: 'M3 7h18M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2', t: 'Manage connectors' },
            { i: 'M12 5v14M5 12h14', t: 'Add connector' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '14px 14px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: i === 0 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <Icon d={r.i} size={18} stroke={T.ink} sw={1.8}/>
              <span className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>{r.t}</span>
            </div>
          ))}
          <div style={{ padding: '14px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <Icon d="M11 4a7 7 0 0 1 4.9 11.9L20 20" size={18} stroke={T.ink} sw={1.8}/>
            <div style={{ flex: 1 }}>
              <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>Tool access</div>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>Load tools when needed</div>
            </div>
            <Icon d="m9 6 6 6-6 6" size={14} stroke={T.inkFaint}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop: full connector settings page ───────────────────────
function DesktopConnectors() {
  const T = window.FB;

  const Section = ({ label, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  return (
    <DesktopShell active="settings">
      <div style={{ padding: '28px 40px 20px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Settings · connectors</div>
          <div className="fb-sans fb-tight" style={{ fontSize: 32, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>Your integrations</div>
          <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 3 }}>8 connected · 1 needs re-auth · 3 available. Bench reads, writes, or both — you decide per source.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton tone="ghost" size="md">Import history</PillButton>
          <PillButton tone="primary" size="md" icon={I.plus}>Add connector</PillButton>
        </div>
      </div>

      <div style={{ padding: '28px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 36 }}>
        <div>
          <Section label="Court & legal">
            <IntegrationRow logo={Logos.courtportal} name="Alameda Superior Court (Odyssey Portal)"
              subtitle="Case 24FL-04812 · filings, minute orders, hearing calendar · 2-way"
              on status="syncing"/>
            <IntegrationRow logo={Logos.turbocourt} name="TurboCourt · California e-filing"
              subtitle="Submit RFOs, FL-300s, responsive filings directly" on/>
            <IntegrationRow logo={Logos.docusign} name="Docusign"
              subtitle="Sign declarations · notarize online with CA-licensed notary"/>
            <IntegrationRow logo={Logos.odyssey} name="Tyler Odyssey (other counties)"
              subtitle="For when venue changes" />
          </Section>

          <Section label="Co-parenting platforms">
            <IntegrationRow logo={Logos.ofw} name="OurFamilyWizard"
              subtitle="Messages · ToneMeter · expenses · shared journal · read-only import"
              on status="needs-auth"/>
            <IntegrationRow logo={Logos.talkingparents} name="TalkingParents"
              subtitle="Tamper-proof messaging thread · export PDF bundle" on/>
          </Section>

          <Section label="Calendar, email, messaging">
            <IntegrationRow logo={Logos.gcal} name="Google Calendar"
              subtitle="Custody schedule, hearings, exchange times · 2-way" on/>
            <IntegrationRow logo={Logos.gmail} name="Gmail"
              subtitle="Auto-archive threads from opposing counsel" on/>
            <IntegrationRow logo={Logos.imessage} name="iMessage"
              subtitle="Export specific threads as chain-of-custody evidence"/>
            <IntegrationRow logo={Logos.whatsapp} name="WhatsApp"
              subtitle="Same — thread-scoped export only"/>
          </Section>

          <Section label="Storage & documents">
            <IntegrationRow logo={Logos.icloud} name="iCloud Drive"
              subtitle="12.4 GB used · encrypted backup of your case" on/>
            <IntegrationRow logo={Logos.gdrive} name="Google Drive"
              subtitle="Share specific folders with attorney / mediator"/>
            <IntegrationRow logo={Logos.dropbox} name="Dropbox"
              subtitle="Read-only — import existing case files"/>
          </Section>

          <Section label="Evidence sources · physical world">
            <IntegrationRow logo={Logos.ring} name="Ring"
              subtitle="2 cameras · doorbell + driveway · exchange handoffs" on/>
            <IntegrationRow logo={Logos.nest} name="Nest"
              subtitle="1 indoor camera · kitchen" on/>
            <IntegrationRow logo={Logos.zoom} name="Zoom"
              subtitle="Recordings of supervised visits with consent" on/>
            <IntegrationRow logo={Logos.applehealth} name="Apple Health"
              subtitle="Sleep, HRV, steps around incidents · read-only, opt-in per day"/>
          </Section>

          <Section label="Money">
            <IntegrationRow logo={Logos.venmo} name="Venmo"
              subtitle="Child-expense receipts · reimbursement tracking" on/>
            <IntegrationRow logo={Logos.stripe} name="Stripe"
              subtitle="If you invoice for shared expenses"/>
          </Section>
        </div>

        {/* Right rail: policy & principles */}
        <div>
          <div style={{ position: 'sticky', top: 28 }}>
            <div style={{ padding: '20px 22px', background: T.paperDeep, borderRadius: 14 }}>
              <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>How connectors work</div>
              <div className="fb-serif fb-tight" style={{ fontSize: 19, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.25 }}>
                You own every byte. We read what you say, nothing more.
              </div>
              <Rule style={{ margin: '14px 0' }}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Scoped auth', 'Read-only by default. Write permissions asked separately per action.'],
                  ['Local-first pull', 'Imports come down to your device, hash first, then mirror.'],
                  ['Redaction on ingest', 'Your address + child\'s school stripped before anything is stored.'],
                  ['Revoke any time', 'One tap severs the link. Existing ingested data stays yours.'],
                  ['Audit log', 'Every read, every API call, every token refresh — visible to you.'],
                ].map(([t, s], i) => (
                  <div key={i}>
                    <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{t}</div>
                    <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2, lineHeight: 1.5 }}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <PillButton tone="ghost" size="sm" full iconRight="m9 6 6 6-6 6">View audit log</PillButton>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12 }}>
              <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tool access</div>
              <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 500, marginTop: 5 }}>Load tools only when needed</div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 4, lineHeight: 1.5 }}>Bench asks permission in-context the first time a task requires a connector. No background polling, no pre-load.</div>
              <Rule style={{ margin: '10px 0' }}/>
              <div className="fb-sans" style={{ fontSize: 12, color: T.ink, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Enabled</span>
                <SwitchToggle on onClick={() => {}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { ConnectorsMobile, DesktopConnectors });
