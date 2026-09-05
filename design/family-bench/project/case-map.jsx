// Family Bench — Case Map + Document Intake
// The "catch up mid-litigation" flow. Upload court orders / opposing filings,
// OCR extracts provisions + deadlines + parties, build a visual timeline of
// every court event in your case.

// ─── Mobile: Intake landing / empty-ish ─────────────────────────
function IntakeMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Case Map</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>12 docs · 4 orders · 8 hearings</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.plus} size={14} stroke={T.paper} sw={1.8}/>
        </div>
      </div>

      {/* Processing banner */}
      <div style={{ padding: '16px 20px 10px' }}>
        <div style={{ padding: '14px 16px', background: T.oxWash + '60', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, border: `1.5px solid ${T.ox}`, borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 1s linear infinite' }}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 12.5, color: T.ox, fontWeight: 600 }}>Reading custody evaluation · 47 pages</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Extracting provisions, dates, parties. 38% complete.</div>
            <div style={{ marginTop: 8, height: 3, background: T.paper, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '38%', height: '100%', background: T.ox }}/>
            </div>
          </div>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
        {/* Just-extracted card */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 8 }}>Just extracted · 2 min ago</div>
        <SoftCard p={18} accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.05em' }}>ORDER · FL-340</div>
              <div className="fb-serif fb-tight" style={{ fontSize: 19, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.2 }}>
                Stipulated Custody Order
              </div>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 3 }}>Filed Jun 12, 2024 · Dept. 24</div>
            </div>
            <div style={{ width: 36, height: 48, background: T.paperDeep, borderRadius: 6, border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="fb-mono" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600 }}>14p</span>
            </div>
          </div>
          <Rule style={{ margin: '12px 0' }}/>
          <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Provisions I found · 11</div>
          {[
            { sec: '§ 4(a)', t: '50/50 alternating week schedule' },
            { sec: '§ 4(c)', t: 'Exchanges at school or at curbside · 15-min grace' },
            { sec: '§ 6', t: 'Communication via OFW only' },
            { sec: '§ 9(b)', t: 'No new romantic partners overnight (first 6 mo)', expired: true },
          ].map((p, i) => (
            <div key={i} style={{ padding: '8px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600, flexShrink: 0, marginTop: 1, width: 40 }}>{p.sec}</span>
              <span className="fb-sans" style={{ fontSize: 12.5, color: T.ink, flex: 1, lineHeight: 1.4 }}>{p.t}</span>
              {p.expired && <span className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Expired</span>}
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <PillButton tone="soft" size="sm" iconRight="m9 6 6 6-6 6">See all 11 provisions</PillButton>
          </div>
        </SoftCard>

        {/* Timeline */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 22 }}>Timeline · In re: Chen</div>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 1, background: T.rule }}/>
          {[
            { d: 'May 5, 2026', dd: '14 d out', t: 'Hearing · RFO-05', m: 'Dept. 24 · 9:00 AM', tone: T.ox, upcoming: true },
            { d: 'Apr 10, 2026', t: 'RFO-05 filed by Petitioner', m: 'Custody modification · self-represented', tone: T.forest },
            { d: 'Mar 18, 2026', t: 'Ex parte denied', m: 'Emergency motion re: school pickup denied' },
            { d: 'Jan 2, 2026', t: 'Minute Order · Judge Tanaka', m: 'Contempt finding denied · no willfulness' },
            { d: 'Nov 14, 2025', t: 'FL-300 filed by Respondent', m: 'Contempt OSC · denied Jan 2' },
            { d: 'Jun 12, 2024', t: 'Stipulated Custody Order', m: '50/50 alternating week · filed today', tone: T.forest },
            { d: 'Feb 8, 2024', t: 'Case opened', m: 'Petition for dissolution' },
          ].map((e, i) => (
            <div key={i} style={{ marginBottom: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -24, top: 4, width: 11, height: 11, borderRadius: 6, background: e.upcoming ? T.ox : e.tone || '#FFFFFF', border: `1.5px solid ${e.tone || T.inkFaint}` }}/>
              <div className="fb-mono" style={{ fontSize: 10, color: e.upcoming ? T.ox : T.inkMute, fontWeight: 600, letterSpacing: '0.03em' }}>{e.d}{e.dd && ` · ${e.dd}`}</div>
              <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{e.t}</div>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>{e.m}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Desktop: Case Map — full visual timeline ───────────────────
function DesktopCaseMap() {
  const T = window.FB;

  // Events normalized onto a timeline. x = 0..1 across 27 months
  const events = [
    { x: 0.00,  type: 'case',   label: 'Case opened',                         d: 'Feb 8, 2024', tone: T.inkSoft },
    { x: 0.06,  type: 'filing', label: 'Petition for dissolution',            d: 'Feb 22, 2024' },
    { x: 0.18,  type: 'hearing',label: 'Case management',                     d: 'May 2, 2024' },
    { x: 0.23,  type: 'order',  label: 'Stipulated Custody Order · FL-340', d: 'Jun 12, 2024', tone: T.forest, big: true },
    { x: 0.38,  type: 'filing', label: 'FL-300 · Contempt OSC',               d: 'Nov 14, 2025', tone: T.ox },
    { x: 0.44,  type: 'hearing',label: 'Contempt hearing',                    d: 'Dec 8, 2025' },
    { x: 0.50,  type: 'order',  label: 'Minute Order · contempt denied',      d: 'Jan 2, 2026', tone: T.forest },
    { x: 0.62,  type: 'filing', label: 'Ex parte · denied',                   d: 'Mar 18, 2026' },
    { x: 0.75,  type: 'filing', label: 'RFO-05 · custody modification',       d: 'Apr 10, 2026', tone: T.ox, big: true },
    { x: 0.82,  type: 'today',  label: 'Today',                               d: 'Apr 21, 2026' },
    { x: 0.93,  type: 'hearing',label: 'Hearing · Dept. 24',                  d: 'May 5, 2026', tone: T.ox, upcoming: true, big: true },
  ];

  return (
    <DesktopShell active="case-map">
      <div style={{ padding: '28px 40px 20px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Case Map</div>
          <div className="fb-sans fb-tight" style={{ fontSize: 32, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>In re: Marriage of Chen</div>
          <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 3 }}>Case 24FL-04812 · Alameda Superior · 27 months open · 12 docs · 8 hearings</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton tone="ghost" size="md" icon={I.filter}>Filter</PillButton>
          <PillButton tone="ghost" size="md" icon={I.upload}>Export</PillButton>
          <PillButton tone="primary" size="md" icon={I.plus}>Upload document</PillButton>
        </div>
      </div>

      {/* Timeline strip */}
      <div style={{ padding: '32px 40px 40px', borderBottom: `0.5px solid ${T.rule}` }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 18, alignItems: 'center' }}>
          {[
            ['Order', T.forest, 'square'],
            ['Motion / Filing', T.inkSoft, 'square'],
            ['Hearing', T.ox, 'circle'],
            ['Your filing', T.ink, 'diamond'],
          ].map(([lbl, clr, shape], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 9, height: 9, background: clr,
                borderRadius: shape === 'circle' ? 5 : shape === 'square' ? 2 : 0,
                transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
              }}/>
              <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 500 }}>{lbl}</span>
            </div>
          ))}
          <div style={{ flex: 1 }}/>
          <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute }}>Zoom</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {['27mo','12mo','3mo','30d'].map((z, i) => (
              <span key={i} className="fb-sans" style={{ fontSize: 10.5, color: z === '27mo' ? T.paper : T.ink, fontWeight: 500, padding: '4px 9px', background: z === '27mo' ? T.ink : T.paperDeep, borderRadius: 6 }}>{z}</span>
            ))}
          </div>
        </div>

        {/* Timeline canvas */}
        <div style={{ position: 'relative', height: 200, padding: '0 20px' }}>
          {/* Baseline */}
          <div style={{ position: 'absolute', left: 20, right: 20, top: 110, height: 2, background: T.rule }}/>

          {/* Year ticks */}
          {[
            { p: 0.00, l: '2024' },
            { p: 0.35, l: '2025' },
            { p: 0.72, l: '2026' },
          ].map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: `calc(20px + ${t.p} * (100% - 40px))`, top: 110, transform: 'translateX(-50%)' }}>
              <div style={{ width: 1, height: 8, background: T.inkFaint }}/>
              <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, marginTop: 10, textAlign: 'center', transform: 'translateX(-50%)', position: 'absolute', left: 0 }}>{t.l}</div>
            </div>
          ))}

          {/* Quarter ticks */}
          {[0.09, 0.17, 0.26, 0.44, 0.53, 0.62, 0.81, 0.90].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: `calc(20px + ${p} * (100% - 40px))`, top: 110, transform: 'translateX(-50%)', width: 1, height: 4, background: T.rule }}/>
          ))}

          {/* Today line */}
          <div style={{ position: 'absolute', left: `calc(20px + 0.82 * (100% - 40px))`, top: 30, bottom: 30, width: 0, borderLeft: `1px dashed ${T.ox}` }}>
            <span className="fb-sans" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Today</span>
          </div>

          {/* Events */}
          {events.filter(e => e.type !== 'today').map((e, i) => {
            const above = i % 2 === 0;
            const color = e.tone || T.inkSoft;
            const shape = e.type === 'order' ? 'square' : e.type === 'hearing' ? 'circle' : e.type === 'filing' ? 'diamond' : 'circle';
            const size = e.big ? 14 : 10;
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `calc(20px + ${e.x} * (100% - 40px))`,
                top: 110 - size / 2,
                transform: 'translateX(-50%)',
              }}>
                <div style={{
                  width: size, height: size, background: e.upcoming ? '#FFFFFF' : color,
                  borderRadius: shape === 'circle' ? size / 2 : shape === 'square' ? 2 : 0,
                  transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
                  border: e.upcoming ? `2px solid ${color}` : `1px solid ${color}`,
                  boxShadow: e.big ? `0 0 0 4px ${color}20` : 'none',
                }}/>
                {/* Label connector */}
                <div style={{
                  position: 'absolute',
                  left: size / 2,
                  [above ? 'bottom' : 'top']: size,
                  width: 1, height: 24, background: T.rule,
                  transform: 'translateX(-50%)',
                }}/>
                <div style={{
                  position: 'absolute',
                  left: size / 2,
                  [above ? 'bottom' : 'top']: size + 28,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>
                  <div className="fb-mono" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600 }}>{e.d}</div>
                  <div className="fb-sans" style={{ fontSize: 11, color: T.ink, fontWeight: 600, marginTop: 2, maxWidth: 140, whiteSpace: 'normal', lineHeight: 1.25 }}>{e.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-col: Active issues + Document library */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px' }}>
        {/* Active issues feed */}
        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Active issues</div>
              <div className="fb-serif fb-tight" style={{ fontSize: 22, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
                What's live right now.
              </div>
            </div>
            <span className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute }}>Auto-extracted from filings + orders</span>
          </div>

          {[
            {
              tag: 'Live — hearing in 14 days',
              tone: T.ox,
              title: 'Custody modification (your filing)',
              src: 'RFO-05 · filed Apr 10',
              issues: [
                'Child: schedule modification',
                'Makeup time for denied visits',
                'Attorney fees ($3,500 requested)',
              ],
              deadline: { t: 'Opposing response', d: 'Apr 25 · 4 days' },
            },
            {
              tag: 'Unresolved · opposing claim',
              tone: T.inkMute,
              title: 'Denigrating communications',
              src: 'Opposing RFO-04 · filed Apr 16',
              issues: [
                'Alleged hostile OFW messages',
                'Request for communication counseling',
                'No monetary relief requested',
              ],
              deadline: { t: 'Your response due', d: 'Apr 30 · 9 days' },
            },
            {
              tag: 'Monitoring',
              tone: T.forest,
              title: 'Compliance with § 4(c) exchanges',
              src: 'Jun 2024 order · § 4(c)',
              issues: [
                '7 late exchanges in 30 days',
                '3 denied weekends',
                'Pattern forming — see P-03',
              ],
              deadline: null,
            },
          ].map((issue, i) => (
            <div key={i} style={{ padding: '20px 22px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 180px', gap: 20 }}>
              <div>
                <div className="fb-sans" style={{ fontSize: 10, color: issue.tone, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{issue.tag}</div>
                <div className="fb-serif fb-tight" style={{ fontSize: 20, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 5, lineHeight: 1.2 }}>{issue.title}</div>
                <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 4 }}>Source: <span className="fb-mono">{issue.src}</span></div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {issue.issues.map((it, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 4, height: 4, borderRadius: 2, background: issue.tone, marginTop: 7, flexShrink: 0 }}/>
                      <span className="fb-sans" style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.5 }}>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {issue.deadline && (
                  <div style={{ padding: '12px 14px', background: T.oxWash + '60', borderRadius: 10 }}>
                    <div className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Deadline</div>
                    <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600, marginTop: 4 }}>{issue.deadline.t}</div>
                    <div className="fb-sans fb-tnum" style={{ fontSize: 15, color: T.ox, fontWeight: 600, letterSpacing: '-0.015em', marginTop: 2 }}>{issue.deadline.d}</div>
                  </div>
                )}
                <PillButton tone="ghost" size="sm" full style={{ marginTop: 8 }} iconRight="m9 6 6 6-6 6">Open source</PillButton>
              </div>
            </div>
          ))}
        </div>

        {/* Document library rail */}
        <div style={{ padding: '24px 28px', borderLeft: `0.5px solid ${T.rule}`, background: T.paperDeep + '40' }}>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Document library</div>
          <div className="fb-sans fb-tight" style={{ fontSize: 20, color: T.ink, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 3 }}>12 documents</div>

          {/* Drop zone */}
          <div style={{ marginTop: 16, padding: '20px 16px', border: `1.5px dashed ${T.rule}`, borderRadius: 12, background: '#FFFFFF', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon d={I.upload} size={16} stroke={T.ink} sw={1.8}/>
            </div>
            <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 600, marginTop: 10 }}>Drop a PDF here</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 3, lineHeight: 1.4 }}>Court orders, filings, evals.<br/>I'll read + extract in under a minute.</div>
          </div>

          {/* Grouped docs */}
          <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 }}>Orders · 4</div>
          {[
            { t: 'Stipulated Custody Order', d: 'Jun 12, 2024', p: 14, sec: '11 provisions', active: true },
            { t: 'Temporary Orders (DVRO)', d: 'Feb 8, 2024', p: 8, sec: '6 provisions · superseded' },
          ].map((d, i) => (
            <DocRow key={i} {...d}/>
          ))}

          <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Opposing filings · 3</div>
          {[
            { t: 'Opposing RFO-04 · denigrating comms', d: 'Apr 16, 2026', p: 22, sec: '3 issues raised', tone: T.ox },
            { t: 'FL-300 · Contempt OSC', d: 'Nov 14, 2025', p: 18, sec: 'Denied Jan 2' },
          ].map((d, i) => (
            <DocRow key={i} {...d}/>
          ))}

          <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Your filings · 5</div>
          {[
            { t: 'RFO-05 · Custody Modification (draft)', d: 'Apr 10, 2026', p: 12, sec: '75% complete', tone: T.ox, active: true },
          ].map((d, i) => (
            <DocRow key={i} {...d}/>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

function DocRow({ t, d, p, sec, active, tone }) {
  const T = window.FB;
  return (
    <div style={{ padding: '10px 12px', background: active ? T.oxWash + '40' : '#FFFFFF', border: `0.5px solid ${active ? T.ox + '30' : T.rule}`, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
      <div style={{ width: 28, height: 36, background: T.paperDeep, borderRadius: 4, border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="fb-mono" style={{ fontSize: 8.5, color: T.inkMute, fontWeight: 700 }}>{p}p</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 2 }}>{d} · <span style={{ color: tone || T.inkMute }}>{sec}</span></div>
      </div>
      <Icon d={I.chevR} size={11} stroke={T.inkFaint}/>
    </div>
  );
}

// ─── Desktop: Upload flow — OCR in progress ──────────────────────
function DesktopIntakeUpload() {
  const T = window.FB;
  return (
    <DesktopShell active="case-map">
      <div style={{ padding: '28px 40px 20px', borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Case Map</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>Upload document</span>
        </div>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reading document</div>
        <div className="fb-sans fb-tight" style={{ fontSize: 28, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>
          Custody-Evaluation-Chen-Final.pdf
        </div>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>47 pages · uploaded 2 min ago · reading + extracting now</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', minHeight: 640 }}>
        {/* PDF preview */}
        <div style={{ padding: '28px 40px', background: T.paperDeep + '50' }}>
          <div style={{
            background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 8,
            aspectRatio: '8.5/11', maxWidth: 540, margin: '0 auto', padding: '40px 48px',
            position: 'relative', fontFamily: 'Times, serif', fontSize: 11, color: '#2A2A2A', lineHeight: 1.5,
            boxShadow: `0 8px 24px ${T.ink}15`,
          }}>
            {/* Page header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>SUPERIOR COURT OF CALIFORNIA</div>
              <div style={{ fontSize: 11 }}>COUNTY OF ALAMEDA</div>
            </div>
            <div style={{ borderBottom: '2px solid #2A2A2A', marginBottom: 16, paddingBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>In re: Marriage of Chen</div>
              <div style={{ fontSize: 10 }}>Case No. 24FL-04812</div>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>§ III. FINDINGS</div>
            <div>The evaluator met with each parent individually over the course of <span style={{ background: T.oxWash, padding: '0 2px' }}>six sessions between March 4 and April 11, 2026</span>. Both parents presented…</div>
            <div style={{ marginTop: 10 }}>Child <span style={{ background: T.oxWash, padding: '0 2px' }}>Leonie Chen, age 8</span>, expressed a preference to remain in her current school and to see both parents regularly…</div>
            <div style={{ marginTop: 10 }}>With respect to the Court's question regarding <span style={{ background: T.oxWash, padding: '0 2px' }}>allegations of non-compliance with exchange times</span>, the evaluator reviewed…</div>
            <div style={{ marginTop: 10, opacity: 0.5 }}>The Court should further consider the following factors: stability of home environment, continuity of…</div>
            <div style={{ position: 'absolute', bottom: 20, right: 48, fontSize: 9, color: '#888' }}>Page 14 of 47</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <PillButton tone="ghost" size="sm" icon="m15 6-6 6 6 6">Prev</PillButton>
            <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute, padding: '6px 12px' }}>Page 14 of 47</span>
            <PillButton tone="ghost" size="sm" iconRight="m9 6 6 6-6 6">Next</PillButton>
          </div>
        </div>

        {/* Extraction panel */}
        <div style={{ padding: '24px 28px', borderLeft: `0.5px solid ${T.rule}`, overflow: 'auto' }}>
          {/* Progress */}
          <div style={{ padding: '14px 16px', background: T.oxWash + '50', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${T.ox}`, borderTopColor: 'transparent', flexShrink: 0, marginTop: 2, animation: 'spin 1s linear infinite' }}/>
            <div style={{ flex: 1 }}>
              <div className="fb-sans" style={{ fontSize: 12.5, color: T.ox, fontWeight: 600 }}>Reading page 14 of 47 · 38%</div>
              <div style={{ marginTop: 6, height: 3, background: T.paper, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', background: T.ox }}/>
              </div>
            </div>
          </div>

          {/* What I've found */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>What I've pulled out so far</div>

          {/* Classified */}
          <div style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, marginBottom: 8 }}>
            <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Document type</div>
            <div className="fb-serif fb-tight" style={{ fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 2 }}>
              Custody Evaluation — Evaluator's Report
            </div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 3 }}>Filed by court-appointed · not party-submitted</div>
          </div>

          {/* Entities */}
          <div style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, marginBottom: 8 }}>
            <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>People identified</div>
            {[
              ['Dr. M. Williams, Ph.D.', 'Evaluator · court-appointed'],
              ['Leonie Chen, age 8', 'Subject minor'],
              ['Petitioner · Sarah Chen', "You"],
              ['Respondent · David Chen', 'Other parent'],
            ].map(([n, r], i) => (
              <div key={i} style={{ padding: '6px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{n}</span>
                <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute }}>{r}</span>
              </div>
            ))}
          </div>

          {/* Key dates */}
          <div style={{ padding: '14px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, marginBottom: 8 }}>
            <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Dates extracted · 6</div>
            {[
              ['Mar 4 – Apr 11, 2026', '6 evaluator sessions'],
              ['Apr 18, 2026', 'Report filed with court'],
              ['Apr 25, 2026', 'Response from parties due'],
            ].map(([d, c], i) => (
              <div key={i} style={{ padding: '5px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <div className="fb-mono" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600 }}>{d}</div>
                <div className="fb-sans" style={{ fontSize: 11.5, color: T.ink, marginTop: 1 }}>{c}</div>
              </div>
            ))}
          </div>

          {/* Cross references — the magic */}
          <div style={{ padding: '14px 16px', background: T.forestWash, border: `0.5px solid ${T.forest}30`, borderRadius: 10, marginBottom: 8 }}>
            <div className="fb-sans" style={{ fontSize: 10, color: T.forest, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Linked to your evidence</div>
            <div className="fb-serif" style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
              The evaluator asked about <em>allegations of non-compliance with exchange times</em> — that's your <span className="fb-mono" style={{ color: T.ox, fontWeight: 600 }}>Pattern P-03</span> (7 late exchanges in 30 d).
            </div>
            <div style={{ marginTop: 8 }}>
              <PillButton tone="soft" size="sm" iconRight="m9 6 6 6-6 6">Link to P-03</PillButton>
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontStyle: 'italic' }}>Still reading · 29 pages to go</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DesktopShell>
  );
}

Object.assign(window, { IntakeMobile, DesktopCaseMap, DesktopIntakeUpload });
