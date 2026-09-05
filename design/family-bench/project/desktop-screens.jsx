// Family Bench — desktop screens (browser window, 1440×900 canvas content)

// ─── Desktop shell — sidebar + content ──────────────
function DesktopShell({ active = 'home', children, search = true }) {
  const T = window.FB;
  const primary = [
    { id: 'home', label: 'Home', d: I.home },
    { id: 'evidence', label: 'Evidence', d: I.folder, n: '847' },
    { id: 'filings', label: 'Filings', d: I.scales, n: '3' },
    { id: 'advisor', label: 'Advisor', d: I.chat },
  ];
  const secondary = [
    { id: 'orders', label: 'Court Orders', n: '4' },
    { id: 'docs', label: 'Case Documents', n: '18' },
    { id: 'calc', label: 'Custody Calculator' },
    { id: 'reports', label: 'Reports' },
    { id: 'integrations', label: 'Integrations', n: '6' },
    { id: 'trust', label: 'Trust Center' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', background: T.paper, color: T.ink, fontFamily: T.sans }}>
      {/* Sidebar */}
      <div style={{ width: 248, borderRight: `0.5px solid ${T.rule}`, background: T.paperDeep, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: '18px 20px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Seal size={32} label="FB"/>
          <div>
            <div className="fb-sans" style={{ fontSize: 16, fontWeight: 500, lineHeight: 1 }}>Family Bench</div>
            <Mono size={9} dim>ALAMEDA · CA</Mono>
          </div>
        </div>

        {/* Case switcher */}
        <div style={{ padding: '12px 20px', borderBottom: `0.5px solid ${T.rule}` }}>
          <Label>Active Case</Label>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="fb-sans" style={{ fontSize: 14, fontWeight: 500 }}>In re: Chen</div>
            <Icon d={I.caretDown} size={12} stroke={T.inkMute}/>
          </div>
          <Mono size={9} dim style={{ marginTop: 2, display: 'block' }}>FL-24-0918</Mono>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px 12px' }}>
          {primary.map(t => <SideRow key={t.id} t={t} active={t.id === active}/>)}
          <div style={{ height: 1, background: T.rule, margin: '16px 8px 12px' }}/>
          <Label style={{ padding: '0 12px 8px' }}>Workspace</Label>
          {secondary.map(t => <SideRow key={t.id} t={t} dim/>)}
        </div>

        {/* Capture button */}
        <div style={{ padding: 12, borderTop: `0.5px solid ${T.rule}` }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: T.ink, color: T.paper, alignItems: 'center', cursor: 'pointer' }}>
            <Icon d={I.mic} size={16} stroke={T.paper} sw={1.8}/>
            <span className="fb-sans" style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Capture entry</span>
            <Mono size={10} style={{ color: 'rgba(246,242,234,0.5)' }}>⌘V</Mono>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {search && (
          <div style={{ height: 44, borderBottom: `0.5px solid ${T.rule}`, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, background: T.paper }}>
            <Icon d={I.search} size={14} stroke={T.inkMute}/>
            <span className="fb-sans" style={{ fontSize: 13, color: T.inkMute, flex: 1 }}>Search 847 entries, 18 documents, 4 orders…</span>
            <Mono size={9} dim>⌘K</Mono>
            <div style={{ width: 1, height: 16, background: T.rule, margin: '0 4px' }}/>
            <Mono size={10} dim>HEARING MAY 5 · 14 DAYS</Mono>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: T.sand, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>SC</div>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function SideRow({ t, active, dim }) {
  const T = window.FB;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
      background: active ? '#FFFFFF' : 'transparent', border: active ? `0.5px solid ${T.rule}` : '0.5px solid transparent',
      color: active ? T.ink : (dim ? T.inkMute : T.inkSoft), fontSize: 13, fontWeight: active ? 600 : 500,
      borderLeft: active ? `2px solid ${T.ox}` : '2px solid transparent',
      marginBottom: 1,
    }}>
      {t.d && <Icon d={t.d} size={15} stroke="currentColor" sw={1.5}/>}
      <span className="fb-sans" style={{ flex: 1 }}>{t.label}</span>
      {t.n && <Mono size={10} style={{ color: active ? T.ox : T.inkFaint }}>{t.n}</Mono>}
    </div>
  );
}

// ─── Desktop: Home (case dashboard) ──────────────────
function DesktopHome() {
  const T = window.FB;
  return (
    <DesktopShell active="home">
      {/* Letterhead */}
      <div style={{ padding: '32px 40px 24px', borderBottom: `1px solid ${T.ink}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Label>Case Dashboard · Good morning, Sarah</Label>
            <Display size={44} style={{ marginTop: 8 }}>In re: Marriage of Chen</Display>
            <div style={{ marginTop: 10, display: 'flex', gap: 18, alignItems: 'baseline' }}>
              <Mono size={11} dim>No. FL-24-0918</Mono>
              <Mono size={11} dim>SUPERIOR COURT · ALAMEDA</Mono>
              <Mono size={11} dim>DEPT. 24 · HON. ALVARADO</Mono>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Label>Hearing in</Label>
            <Display size={64} weight={500} style={{ color: T.ox, lineHeight: 0.9, marginTop: 4 }}>14<span style={{ fontSize: 24, color: T.ink }}> days</span></Display>
            <Mono size={10} dim style={{ marginTop: 6, display: 'block' }}>TUE MAY 5 · 9:00 AM · RFO</Mono>
          </div>
        </div>
      </div>
      <Rule style={{ margin: 0 }}/>

      {/* Three columns */}
      <div style={{ padding: '28px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 28 }}>
        {/* Col 1 — Needs attention */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Display size={22}>Needs attention</Display>
            <Mono size={10} dim>3 ITEMS</Mono>
          </div>
          <Rule style={{ margin: '10px 0 0' }}/>
          {[
            { s: 'high', t: 'Pattern detected · custody interference', b: 'Third denied visit in 30 days meets evidentiary threshold for FC § 3048 motion.', c: 'RFO-05 · Exhibit A' },
            { s: 'med', t: 'Income & Expense Declaration overdue', b: 'FL-150 must be served 45 days before hearing. Due tomorrow.', c: 'FL-150 · missing' },
            { s: 'med', t: 'Cross-reference discrepancy', b: 'Respondent\'s declared income ($4,200/mo) inconsistent with documented spending patterns ($6,800/mo).', c: 'FL-150 vs Exhibit D' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < 2 ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 14 }}>
              <FlagDot sev={r.s}/>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 16, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>{r.t}</div>
                <div className="fb-sans" style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{r.b}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Mono size={9} style={{ color: T.ox }}>{r.c.toUpperCase()}</Mono>
                  <span className="fb-sans" style={{ fontSize: 11, color: T.ink, textDecoration: 'underline', textDecorationColor: T.inkFaint }}>Address →</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Col 2 — Custody */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Display size={22}>Custody · 90 d</Display>
            <Mono size={10} dim>LEONIE · 7</Mono>
          </div>
          <Rule style={{ margin: '10px 0 16px' }}/>

          {/* Huge stat */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <Display size={56} weight={500} style={{ color: T.ox }}>−12</Display>
            <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute }}>overnights</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <BarCompare scheduled={50} actual={38} w={240}/>
          </div>

          {/* Weekly ticks */}
          <Label style={{ marginTop: 24 }}>Weekly breakdown</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3, marginTop: 8 }}>
            {Array.from({ length: 13 }).map((_, i) => {
              const v = [0, 0, 0, -1, 0, -2, 0, 0, -1, -1, 0, -2, -1][i];
              const bg = v === 0 ? T.paperEdge : v === -1 ? T.sandDeep : T.ox;
              return <div key={i} style={{ height: 26, background: bg, border: `0.5px solid ${T.rule}` }} title={`Week ${i+1}: ${v}`}/>;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Mono size={8} dim>JAN 21</Mono>
            <Mono size={8} dim>APR 21</Mono>
          </div>

          <div style={{ marginTop: 20, padding: '10px 12px', background: T.oxWash, border: `0.5px solid ${T.ox}30` }}>
            <Mono size={9} style={{ color: T.ox }}>AUTO-GENERATED CITATION</Mono>
            <div className="fb-sans" style={{ fontSize: 12, color: T.ink, marginTop: 4, lineHeight: 1.5 }}>
              "Pursuant to the custody order dated Jun 12 2024, Petitioner is entitled to 45 overnights per 90-day period. During Jan 21–Apr 21, Petitioner received 33 overnights, a shortfall of 12…"
            </div>
          </div>
        </div>

        {/* Col 3 — Activity + filings */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Display size={22}>Filings</Display>
            <Mono size={10} dim>3 ACTIVE</Mono>
          </div>
          <Rule style={{ margin: '10px 0 0' }}/>
          {[
            { id: 'RFO-05', title: 'Custody Modification', tone: 'ox', status: 'DRAFT · 68%', meta: 'Hearing May 5' },
            { id: 'FEE-02', title: 'Attorney Fee Waiver', tone: 'forest', status: 'READY', meta: 'FC § 2030' },
            { id: 'CON-01', title: 'Contempt (prep)', tone: 'sand', status: 'EXPLORING', meta: 'CCP § 1218' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <Mono size={10} style={{ color: T[f.tone] }}>{f.id}</Mono>
                  <div className="fb-sans" style={{ fontSize: 16, fontWeight: 500, color: T.ink, marginTop: 2 }}>{f.title}</div>
                </div>
                <Chip tone={f.tone}>{f.status}</Chip>
              </div>
              <Mono size={10} dim style={{ marginTop: 4, display: 'block' }}>{f.meta}</Mono>
            </div>
          ))}

          <Label style={{ marginTop: 24 }}>Today</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {[
              { t: 'denied', l: 'Denied weekend exchange', time: '08:04' },
              { t: 'statement', l: 'Child statement · EC § 1240', time: 'yesterday' },
              { t: 'comm', l: 'OFW · 4 msgs · 1 hostile', time: 'yesterday' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                <EntryMark type={r.t} size={20}/>
                <div className="fb-sans" style={{ fontSize: 13, flex: 1, color: T.ink }}>{r.l}</div>
                <Mono size={9} dim>{r.time}</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Desktop: Filing Builder (HERO) ──────────────────
function DesktopFiling() {
  const T = window.FB;
  return (
    <DesktopShell active="filings">
      <div style={{ padding: '24px 40px 20px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mono size={11} dim>FILINGS /</Mono>
            <Mono size={11} style={{ color: T.ox }}>RFO-05</Mono>
          </div>
          <Display size={34} style={{ marginTop: 6 }}>Custody Modification</Display>
          <Mono size={10} dim style={{ marginTop: 6, display: 'block' }}>4 FORMS · 14 EXHIBITS · 47 PP · SERVE BY MAY 5 (14 D)</Mono>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '8px 14px', border: `0.5px solid ${T.ink}`, fontFamily: T.sans, fontSize: 13, fontWeight: 500 }}>Preview PDF</div>
          <div style={{ padding: '8px 14px', background: T.ink, color: T.paper, fontFamily: T.sans, fontSize: 13, fontWeight: 600 }}>Mark ready to file</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 28, padding: '14px 40px 0', borderBottom: `0.5px solid ${T.rule}` }}>
        {['Documents', 'Evidence', 'Checklist'].map((t, i) => (
          <div key={t} style={{ paddingBottom: 10, borderBottom: i === 1 ? `2px solid ${T.ox}` : '2px solid transparent', color: i === 1 ? T.ink : T.inkMute, fontFamily: T.sans, fontSize: 13, fontWeight: i === 1 ? 600 : 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            {t}
            <Mono size={9} style={{ color: i === 1 ? T.ox : T.inkFaint }}>{['4', '14', '7'][i]}</Mono>
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ paddingBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Mono size={10} dim>6 UNASSIGNED MATCHES</Mono>
          <Icon d={I.filter} size={14} stroke={T.ink}/>
        </div>
      </div>

      {/* Body — three-pane layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', flex: 1, minHeight: 0 }}>
        {/* LEFT — exhibit groups */}
        <div style={{ borderRight: `0.5px solid ${T.rule}`, padding: '20px 20px', background: T.paperDeep, overflow: 'auto' }}>
          <Label>Exhibit groups</Label>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { l: 'A', t: 'Custody interference', n: 6, active: true },
              { l: 'B', t: 'Child statements', n: 2 },
              { l: 'C', t: 'Communications', n: 4 },
              { l: 'D', t: 'Financial records', n: 2 },
            ].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: g.active ? '#FFFFFF' : 'transparent', border: g.active ? `0.5px solid ${T.rule}` : 'none', borderLeft: g.active ? `2px solid ${T.ox}` : '2px solid transparent' }}>
                <div style={{ width: 26, height: 26, border: `0.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="fb-sans">
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{g.l}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{g.t}</div>
                  <Mono size={9} dim>{g.n} entries</Mono>
                </div>
              </div>
            ))}
            <div style={{ padding: '10px 12px', color: T.inkMute, fontFamily: T.sans, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Icon d={I.plus} size={12} stroke={T.inkMute}/> New group
            </div>
          </div>

          <Rule style={{ margin: '20px 0' }}/>
          <Label color={T.ox}>Checklist preview</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['FL-300', true], ['FL-311', true], ['FL-341', true], ['FL-150', false], ['MC-031', 'draft'], ['Exhibit A', true], ['Exhibit B', true], ['Exhibit C', 'draft'],
            ].map(([n, s], i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, border: `1px solid ${s === true ? T.forest : s === 'draft' ? T.amber : T.ox}`, background: s === true ? T.forest : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s === true && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2.5 2.5L7 1.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <Mono size={10} style={{ flex: 1 }}>{n}</Mono>
                <Mono size={9} dim>{s === true ? 'OK' : s === 'draft' ? 'DRAFT' : 'MISSING'}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — active exhibit */}
        <div style={{ padding: '24px 28px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
            <Display size={28}>Exhibit A</Display>
            <span className="fb-sans" style={{ fontSize: 15, color: T.inkMute }}>Custody interference</span>
            <div style={{ flex: 1 }}/>
            <Mono size={10} dim>DRAG · TO · REORDER</Mono>
          </div>
          <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, lineHeight: 1.5, paddingBottom: 16, borderBottom: `0.5px solid ${T.ruleSoft}` }}>
            Documented instances of custodial interference by Respondent, in violation of the custody order dated June 12 2024, § 4(c). Presented chronologically.
          </div>

          {/* Exhibit rows */}
          {[
            { id: '#00418', t: 'exchange', label: 'A-1 · Late drop-off, 45 minutes', date: 'Apr 21 · 15:45', meta: 'GPS verified · 37.810°,-122.272°', hash: 'a8f3c2…9b1e', tags: ['3rd in 30d', 'FC § 3048'] },
            { id: '#00412', t: 'denied', label: 'A-2 · No-show at scheduled exchange', date: 'Apr 14 · 17:00', meta: 'Witness M. Ortega · 48 hrs lost', hash: '7c2d9a…4f08', tags: ['witness'] },
            { id: '#00398', t: 'denied', label: 'A-3 · Refused return of child', date: 'Apr 7 · 18:30', meta: 'OFW message · "when I feel like it"', hash: '2e8b41…7c03', tags: ['OFW attached', 'FC § 271'] },
            { id: '#00384', t: 'exchange', label: 'A-4 · Late drop-off, 22 minutes', date: 'Mar 31 · 15:22', meta: 'Photo timestamp verified', hash: '4d71ba…2a56', tags: [] },
            { id: '#00371', t: 'statement', label: 'A-5 · Child statement re. interference', date: 'Mar 24 · 19:10', meta: '"Daddy said I can\'t call you"', hash: '9c1e85…8f2d', tags: ['EC § 1240'] },
            { id: '#00355', t: 'denied', label: 'A-6 · Missed mid-week dinner', date: 'Mar 18 · 17:00', meta: 'No prior notice given', hash: '6b4a20…1d97', tags: [] },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 8px', borderBottom: `0.5px solid ${T.ruleSoft}`, alignItems: 'flex-start' }}>
              <Icon d={I.grip} size={14} stroke={T.inkFaint} sw={1.5} style={{ marginTop: 4 }}/>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 36 }}>
                <EntryMark type={r.t} size={28}/>
                <Mono size={8} dim>{r.date.split(' · ')[1]}</Mono>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="fb-sans" style={{ fontSize: 15, fontWeight: 500, color: T.ink }}>{r.label}</div>
                  <Mono size={10} dim>{r.date.split(' · ')[0]}</Mono>
                </div>
                <div className="fb-sans" style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>{r.meta}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Mono size={9} dim>{r.id} · SHA {r.hash}</Mono>
                  {r.tags.map((t, j) => <Chip key={j} tone={t.includes('§') ? 'ox' : 'sand'} style={{ fontSize: 10 }}>{t}</Chip>)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Icon d={I.link} size={14} stroke={T.inkMute}/>
                <Mono size={10} style={{ color: T.ox }}>A-{i + 1}</Mono>
              </div>
            </div>
          ))}

          {/* Drop zone for 6th (drag echo) */}
          <div style={{ marginTop: 16, border: `1px dashed ${T.ox}60`, padding: '18px 14px', background: T.oxWash + '80', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Icon d={I.plus} size={16} stroke={T.ox}/>
            <div style={{ flex: 1 }}>
              <Mono size={10} style={{ color: T.ox }}>ADD FROM POOL</Mono>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ink, marginTop: 2 }}>6 unassigned entries match this exhibit group</div>
            </div>
          </div>
        </div>

        {/* RIGHT — AI suggestions + chain of custody */}
        <div style={{ borderLeft: `0.5px solid ${T.rule}`, padding: '20px 20px', background: T.paperDeep, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <Icon d={I.sparkle} size={14} stroke={T.ox} sw={1.8}/>
            <Label color={T.ox}>AI Suggestions</Label>
          </div>

          {[
            { s: 'STRONG MATCH', t: 'Entry #00419 · Child statement', b: 'Admissible under EC § 1240. Directly probative to custodial interference narrative.', tone: 'ox' },
            { s: 'POSSIBLE', t: 'Expense cluster, Mar–Apr', b: '4 unreimbursed expenses during periods of denied access. May support FC § 271 pattern.', tone: 'sand' },
            { s: 'CROSS-REF', t: 'Resp. FL-150 vs. bank records', b: 'Declared income ($4,200) inconsistent with Venmo activity ($6,800 avg).', tone: 'amber' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <Stamp tone={s.tone}>{s.s}</Stamp>
              <div className="fb-sans" style={{ fontSize: 14, fontWeight: 500, color: T.ink, marginTop: 8, lineHeight: 1.3 }}>{s.t}</div>
              <div className="fb-sans" style={{ fontSize: 12, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{s.b}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span className="fb-sans" style={{ fontSize: 11, color: T.ink, fontWeight: 500, textDecoration: 'underline', textDecorationColor: T.inkFaint }}>Add to A</span>
                <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>Dismiss</span>
              </div>
            </div>
          ))}

          <Rule style={{ margin: '20px 0' }}/>

          {/* Chain of custody preview */}
          <Label>Chain of custody · A-1</Label>
          <div style={{ marginTop: 10, background: '#FFFFFF', border: `0.5px solid ${T.rule}`, padding: 14 }}>
            <Mono size={9} style={{ color: T.ox }}>ENTRY #00418</Mono>
            <div className="fb-sans" style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Late drop-off · Apr 21</div>
            <Rule style={{ margin: '8px 0' }}/>
            {[
              ['CAPTURED',    '2026-04-21T15:48:09Z'],
              ['METHOD',      'Voice dictation'],
              ['DEVICE',      'iPhone · iOS 26.2'],
              ['GPS',         '± 5m · cellular'],
              ['SHA-256',     'a8f3c24d1b…ef9b1e'],
              ['EDITS',       '1 (+ reason logged)'],
              ['VERIFIED',    '✓ timestamps consistent'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <Mono size={9} dim>{k}</Mono>
                <Mono size={9}>{v}</Mono>
              </div>
            ))}
            <Rule style={{ margin: '8px 0' }}/>
            {/* QR-ish block */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <div style={{ width: 40, height: 40, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: T.ink, padding: 2 }}>
                {Array.from({ length: 25 }).map((_, i) => <div key={i} style={{ background: [0,2,4,5,6,10,11,13,16,18,19,22,24].includes(i) ? '#FFFFFF' : T.ink }}/>)}
              </div>
              <div style={{ flex: 1 }}>
                <Mono size={9} dim>VERIFY ONLINE</Mono>
                <Mono size={9} style={{ color: T.ox, marginTop: 2, display: 'block' }}>fb.court/v/a8f3c24d</Mono>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Desktop: Custody Calculator ───────────────────
function DesktopCalculator() {
  const T = window.FB;
  const weeks = [
    { lbl: 'W1', s: 3.5, a: 3.5, d: 0 }, { lbl: 'W2', s: 3.5, a: 3.5, d: 0 },
    { lbl: 'W3', s: 3.5, a: 2.5, d: -1, r: 'Late return 24h' }, { lbl: 'W4', s: 3.5, a: 3.5, d: 0 },
    { lbl: 'W5', s: 3.5, a: 1.5, d: -2, r: 'Denied weekend' }, { lbl: 'W6', s: 3.5, a: 3.5, d: 0 },
    { lbl: 'W7', s: 3.5, a: 3.5, d: 0 }, { lbl: 'W8', s: 3.5, a: 2.5, d: -1, r: 'Late return' },
    { lbl: 'W9', s: 3.5, a: 2.5, d: -1, r: 'Late return' }, { lbl: 'W10', s: 3.5, a: 3.5, d: 0 },
    { lbl: 'W11', s: 3.5, a: 1.5, d: -2, r: 'Denied · no-show' }, { lbl: 'W12', s: 3.5, a: 2.5, d: -1, r: 'Late 45m' },
    { lbl: 'W13', s: 3.5, a: 1.5, d: -2, r: 'Denied · Apr 14' },
  ];
  return (
    <DesktopShell active="calc" search={false}>
      <div style={{ padding: '24px 40px', borderBottom: `1px solid ${T.ink}` }}>
        <Label>Custody Calculator</Label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
          <Display size={32}>Scheduled vs. Actual</Display>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Mono size={11} dim>RANGE</Mono>
            <div style={{ padding: '5px 10px', border: `0.5px solid ${T.rule}`, background: '#FFFFFF' }} className="fb-mono" style={{ fontSize: 11 }}>Jan 21 → Apr 21 · 90 d</div>
            <Mono size={11} dim>· CHILD</Mono>
            <div style={{ padding: '5px 10px', border: `0.5px solid ${T.rule}`, background: '#FFFFFF' }} className="fb-mono" style={{ fontSize: 11 }}>Leonie · 7</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        {[
          { l: 'Scheduled', v: '45.0', u: 'overnights', c: T.ink },
          { l: 'Actual', v: '33.0', u: 'overnights', c: T.ox },
          { l: 'Shortfall', v: '−12.0', u: 'overnights · 26.7%', c: T.ox, big: true },
        ].map((s, i) => (
          <div key={i}>
            <Label>{s.l}</Label>
            <Display size={80} weight={500} style={{ color: s.c, marginTop: 6 }}>{s.v}</Display>
            <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>{s.u}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 40px 24px' }}>
        <Rule/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 10, alignItems: 'baseline' }}>
          <Display size={20}>Weekly breakdown</Display>
          <Mono size={10} dim>7 DISCREPANCIES · ALL LINKED TO ENTRIES</Mono>
        </div>

        {/* Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(13, 1fr)`, gap: 6, alignItems: 'end', height: 160 }}>
          <Mono size={9} dim style={{ alignSelf: 'end', paddingBottom: 20 }}>NTS</Mono>
          {weeks.map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                <div style={{ width: 8, height: w.s * 28, background: T.ink }}/>
                <div style={{ width: 8, height: w.a * 28, background: w.d < 0 ? T.ox : T.sandDeep, borderTop: w.d < 0 ? `1px solid ${T.ink}` : 'none' }}/>
              </div>
              <Mono size={8} dim>{w.lbl}</Mono>
            </div>
          ))}
        </div>

        {/* Discrepancy table */}
        <div style={{ marginTop: 32 }}>
          <Display size={18}>Discrepancies</Display>
          <Rule style={{ margin: '10px 0 0' }}/>
          {weeks.filter(w => w.d < 0).map((w, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 120px 1fr 100px 80px 20px', gap: 16, padding: '12px 0', borderBottom: `0.5px solid ${T.ruleSoft}`, alignItems: 'center' }}>
              <Mono size={11} dim>{w.lbl}</Mono>
              <Mono size={10} dim>{['Feb 4–10','Feb 18–24','Mar 11–17','Mar 18–24','Mar 25–31','Apr 8–14','Apr 15–21'][i]}</Mono>
              <div className="fb-sans" style={{ fontSize: 14, color: T.ink }}>{w.r}</div>
              <Mono size={10} style={{ color: T.ox }}>ENTRY #004{18 - i * 4}</Mono>
              <Mono size={11} style={{ color: T.ox }} className="fb-tnum">{w.d.toFixed(1)} nt</Mono>
              <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '20px 24px', background: T.paperDeep, border: `0.5px solid ${T.ink}`, borderLeft: `3px solid ${T.ox}` }}>
          <Label color={T.ox}>Court-ready citation paragraph</Label>
          <div className="fb-sans" style={{ fontSize: 15, color: T.ink, marginTop: 10, lineHeight: 1.7 }}>
            "Pursuant to the custody order dated June 12 2024, Petitioner Sarah Chen is entitled to forty-five (45) overnights per ninety-day period. During the period January 21 through April 21, 2026, Petitioner received thirty-three (33) overnights — a shortfall of twelve (12) overnights, or 26.7%, as documented in <span style={{ color: T.ox, fontStyle: 'normal' }}>Exhibit A, items 1–7</span>, each linked to contemporaneously logged evidence with verified forensic metadata."
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <div style={{ padding: '7px 14px', background: T.ink, color: T.paper, fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>Insert into MC-031</div>
            <div style={{ padding: '7px 14px', border: `0.5px solid ${T.ink}`, fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>Copy paragraph</div>
            <div style={{ padding: '7px 14px', border: `0.5px solid ${T.ink}`, fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>Generate PDF report</div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Desktop: Advisor ─────────────────────────────
function DesktopAdvisor() {
  const T = window.FB;
  return (
    <DesktopShell active="advisor" search={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `0.5px solid ${T.rule}` }}>
          <div style={{ padding: '24px 40px 16px', borderBottom: `0.5px solid ${T.rule}` }}>
            <Label>Advisor</Label>
            <Display size={28} style={{ marginTop: 4 }}>Strategic conversation</Display>
            <Mono size={10} dim style={{ marginTop: 6, display: 'block' }}>CASE CONTEXT LOADED · 847 ENTRIES · 4 ORDERS · 18 DOCS · CA KNOWLEDGE BASE</Mono>
          </div>
          <div className="fb-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div className="fb-sans" style={{ fontSize: 17, color: T.ink, padding: '12px 18px', background: T.ink, color: T.paper, maxWidth: '70%', lineHeight: 1.5 }}>
                Is 3 late pickups and 2 denied visits enough to file for contempt against David?
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
              <Seal size={32} label="FB"/>
              <div style={{ flex: 1 }}>
                <Mono size={9} dim>FAMILY BENCH ADVISOR · 09:42</Mono>
                <div className="fb-sans" style={{ fontSize: 16, color: T.ink, lineHeight: 1.65, marginTop: 6 }}>
                  Based on your documented case, the pattern could support <em style={{ background: T.oxWash, fontStyle: 'normal', padding: '0 3px' }}>either</em> a contempt action under <span style={{ color: T.ox }}>CCP § 1218</span> or a sanctions motion under <span style={{ color: T.ox }}>FC § 271</span>. These have different evidentiary thresholds:
                </div>

                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { h: 'Contempt · CCP § 1218', b: 'Requires beyond-reasonable-doubt proof of willful violation. Criminal-adjacent. Higher bar, stronger remedy.', strong: false },
                    { h: 'Sanctions · FC § 271', b: 'Requires preponderance of evidence of non-cooperation. Civil. Your record supports this today.', strong: true },
                  ].map((o, i) => (
                    <div key={i} style={{ padding: 14, border: `0.5px solid ${o.strong ? T.ox : T.rule}`, borderLeft: `2px solid ${o.strong ? T.ox : T.ink}`, background: o.strong ? T.oxWash + '70' : '#FFFFFF' }}>
                      <div className="fb-sans" style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{o.h}</div>
                      <div className="fb-sans" style={{ fontSize: 12, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{o.b}</div>
                      {o.strong && <Stamp tone="ox" style={{ marginTop: 8 }}>RECOMMENDED · 97%</Stamp>}
                    </div>
                  ))}
                </div>

                <div className="fb-sans" style={{ fontSize: 16, color: T.ink, lineHeight: 1.65, marginTop: 16 }}>
                  Your evidence file shows <span style={{ color: T.ox, fontWeight: 500 }}>3 verified late exchanges</span> and <span style={{ color: T.ox, fontWeight: 500 }}>2 outright denied visits</span> in 30 days [1][2][3][4][5], plus a spontaneous child statement admissible under EC § 1240 [6]. For FC § 271 purposes, this is a persuasive pattern.
                </div>

                {/* Source citations */}
                <div style={{ marginTop: 14, padding: 14, background: T.paperDeep, border: `0.5px solid ${T.rule}` }}>
                  <Label>Grounded in 6 sources from your case</Label>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['[1]', 'exchange', '#00418 · Late 45m · Apr 21'],
                      ['[2]', 'denied', '#00412 · No-show · Apr 14'],
                      ['[3]', 'denied', '#00398 · Weekend denied · Apr 7'],
                      ['[4]', 'exchange', '#00384 · Late 22m · Mar 31'],
                      ['[5]', 'comm', '#00411 · OFW hostile · Apr 19'],
                      ['[6]', 'statement', '#00419 · EC § 1240 candidate'],
                    ].map(([n, t, l], i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0' }}>
                        <Mono size={10} style={{ color: T.ox, width: 22 }}>{n}</Mono>
                        <EntryMark type={t} size={18}/>
                        <Mono size={10} style={{ flex: 1, color: T.ink }}>{l}</Mono>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    ['Draft FC § 271 sanctions motion', 'ink'],
                    ['Add these 6 entries to RFO-05', 'outline'],
                    ['Show me the contempt pathway', 'outline'],
                    ['Set reminder · 7 d before hearing', 'outline'],
                  ].map(([l, s], i) => (
                    <div key={i} style={{ padding: '8px 14px', background: s === 'ink' ? T.ink : 'transparent', color: s === 'ink' ? T.paper : T.ink, border: `0.5px solid ${T.ink}`, fontSize: 12, fontWeight: s === 'ink' ? 600 : 500, fontFamily: T.sans }}>
                      {l}
                    </div>
                  ))}
                </div>

                <Mono size={9} dim style={{ marginTop: 14, display: 'block' }}>
                  Legal information, not legal advice. An attorney can review your specific circumstances.
                </Mono>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 40px 20px', borderTop: `0.5px solid ${T.rule}`, background: T.paperDeep }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}` }}>
              <Icon d={I.sparkle} size={14} stroke={T.ox} sw={1.8}/>
              <span className="fb-sans" style={{ flex: 1, fontSize: 14, color: T.inkMute }}>Ask about a strategy, a statute, an entry, or a deadline…</span>
              <Mono size={10} dim>⌘ ↵</Mono>
              <Icon d={I.mic} size={16} stroke={T.ox}/>
            </div>
          </div>
        </div>

        {/* Right rail — case context */}
        <div style={{ padding: '24px 22px', background: T.paperDeep, overflow: 'auto' }}>
          <Label>Loaded context</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Evidence', '847 entries · 23 flagged'],
              ['Court orders', '4 (latest Jun 12 2024)'],
              ['Opposing filings', '2 motions, 1 response'],
              ['Hearings', '1 upcoming · May 5'],
              ['Deadlines', '3 within 30 d'],
              ['CA knowledge base', 'FC / CCP / EC / CRC'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: i < 5 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <span className="fb-sans" style={{ fontSize: 13, color: T.ink }}>{k}</span>
                <Mono size={10} dim>{v}</Mono>
              </div>
            ))}
          </div>

          <Rule style={{ margin: '20px 0' }}/>
          <Label>Recent conversations</Label>
          <div style={{ marginTop: 10 }}>
            {[
              'Is 3 late pickups enough to file for…',
              'How should I respond to his mediation…',
              'What\'s the deadline for my FL-150?',
              'Can Leonie\'s teacher be a witness?',
            ].map((q, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < 3 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <div className="fb-sans" style={{ fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</div>
                <Mono size={9} dim style={{ marginTop: 2, display: 'block' }}>{['9:42 AM', 'YESTERDAY', 'APR 18', 'APR 14'][i]}</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Desktop: Chain of Custody Certificate ─────────
function DesktopCertificate() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paperDeep, padding: 24, overflow: 'auto' }}>
      {/* Paper sheet */}
      <div style={{ maxWidth: 720, margin: '0 auto', background: '#FFFFFF', padding: '48px 56px', border: `1px solid ${T.rule}`, boxShadow: '0 4px 24px rgba(30,42,58,0.08)' }}>
        {/* Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: `2px solid ${T.ink}` }}>
          <div>
            <Seal size={52} label="FB"/>
            <Mono size={10} dim style={{ marginTop: 10, display: 'block' }}>FAMILY BENCH · EVIDENCE VAULT</Mono>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Label>Certificate of</Label>
            <Display size={32} style={{ marginTop: 2 }}>Chain of Custody</Display>
            <Mono size={10} dim style={{ marginTop: 6, display: 'block' }}>ISSUED 2026-04-21T15:51:02Z</Mono>
          </div>
        </div>

        {/* Case caption */}
        <div style={{ marginTop: 20, padding: '12px 0', borderBottom: `0.5px solid ${T.rule}` }}>
          <div className="fb-serif" style={{ fontSize: 28, fontStyle: "italic", letterSpacing: "-0.01em" }}>In re: Marriage of Chen</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
            <Mono size={10} dim>SUPERIOR CT. CA · ALAMEDA</Mono>
            <Mono size={10} dim>NO. FL-24-0918</Mono>
            <Mono size={10} dim>DEPT. 24</Mono>
          </div>
        </div>

        {/* Exhibit A-1 */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Display size={24}>Exhibit A-1</Display>
            <Mono size={10} dim>ENTRY #00418 · TYPE: EXCHANGE</Mono>
          </div>
          <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginTop: 4 }}>
            Late drop-off, 45 minutes · April 21, 2026, 15:45 PDT
          </div>
        </div>

        {/* Metadata grid */}
        <div style={{ marginTop: 20, border: `0.5px solid ${T.rule}` }}>
          {[
            ['Captured at',    '2026-04-21T15:48:09.113Z', 'Server authoritative'],
            ['Device time',    '2026-04-21T15:48:07.902Z', 'Δ +1.21s · consistent'],
            ['Device',         'iPhone 16 Pro · iOS 26.2.1', 'ID hash 7c2d…9b1e'],
            ['Capture method', 'Voice dictation → AI structured', 'Transcript SHA 4d81…9fa0'],
            ['Location',       '37.8100° N · 122.2720° W', 'GPS · ± 5m · cell-assisted'],
            ['Address',        '1425 Park Blvd, Oakland CA 94606', 'Reverse-geocoded'],
            ['IP',             'Hash 2e9f…c7b1', 'US-CA · Comcast'],
            ['Content SHA-256','a8f3c24d1b7e90a5…f3ef9b1e', 'Immutable'],
            ['Metadata SHA',   '6b4a20c81d97…2f5a', 'Immutable'],
            ['Edit history',   '1 edit · 2026-04-21T16:12:44Z', 'Typo, "fifteen"→"45"'],
            ['First-write hash','a8f3c24d1b7e90a5…f3ef9b1e', 'Preserved · see audit'],
            ['Verified',       '✓ Timestamps consistent · no offline gap', 'Automated'],
          ].map(([k, v, note], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', padding: '9px 14px', borderBottom: i < 11 ? `0.5px solid ${T.ruleSoft}` : 'none', alignItems: 'baseline' }}>
              <Mono size={9} dim>{k.toUpperCase()}</Mono>
              <Mono size={11}>{v}</Mono>
              <Mono size={9} dim style={{ fontStyle: 'italic' }}>{note}</Mono>
            </div>
          ))}
        </div>

        {/* Affirmation */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `0.5px solid ${T.rule}`, display: 'grid', gridTemplateColumns: '1fr 120px', gap: 24 }}>
          <div>
            <Label>Affirmation</Label>
            <div className="fb-sans" style={{ fontSize: 13, color: T.ink, marginTop: 8, lineHeight: 1.6 }}>
              I, the custodian of the Family Bench evidence vault, certify that the above record was captured at the stated time, has not been altered except as recorded in the audit log, and that the content and metadata hashes above match the immutable record.
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 20, alignItems: 'flex-end' }}>
              <div>
                <div style={{ borderBottom: `1px solid ${T.ink}`, width: 220, paddingBottom: 4 }}>
                  <span className="fb-sans" style={{ fontSize: 18, color: T.ink }}>Sarah Chen</span>
                </div>
                <Mono size={9} dim style={{ marginTop: 2, display: 'block' }}>PETITIONER · PRO SE</Mono>
              </div>
              <div>
                <div style={{ borderBottom: `1px solid ${T.ink}`, width: 100, paddingBottom: 4 }}>
                  <Mono size={11}>2026-04-21</Mono>
                </div>
                <Mono size={9} dim style={{ marginTop: 2, display: 'block' }}>DATE</Mono>
              </div>
            </div>
          </div>

          {/* QR + verify URL */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 120, height: 120, display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 1, background: T.ink, padding: 3 }}>
              {Array.from({ length: 81 }).map((_, i) => <div key={i} style={{ background: Math.random() > 0.45 ? '#FFFFFF' : T.ink }}/>)}
            </div>
            <Mono size={9} style={{ color: T.ox, marginTop: 6, display: 'block' }}>fb.court/v/a8f3c2</Mono>
            <Mono size={8} dim style={{ marginTop: 2, display: 'block' }}>PUBLIC VERIFY</Mono>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between' }}>
          <Mono size={9} dim>PAGE 14 OF 47 · EXHIBIT A-1 · CHAIN OF CUSTODY</Mono>
          <Mono size={9} dim>FB-CUST-2026-0418-A1</Mono>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesktopShell, DesktopHome, DesktopFiling, DesktopCalculator, DesktopAdvisor, DesktopCertificate });
