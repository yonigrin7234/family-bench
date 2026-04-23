// Family Bench — Filing Builder v2 (TurboTax-style wizard)
// Desktop: left step rail, center stage, right "why this matters"
// Mobile: full-screen step with progress

// ─── Desktop Filing Wizard ───────────────────────────────
function DesktopFilingWizard() {
  const T = window.FB;

  const steps = [
    { n: 1, t: 'What you want',     s: 'done' },
    { n: 2, t: 'Why you want it',   s: 'done' },
    { n: 3, t: 'Supporting facts',  s: 'active' },
    { n: 4, t: 'Evidence to attach',s: 'pending' },
    { n: 5, t: 'Other side response',s: 'pending' },
    { n: 6, t: 'Review & sign',     s: 'pending' },
    { n: 7, t: 'Serve & file',      s: 'pending' },
  ];

  return (
    <DesktopShell active="filings">
      {/* Breadcrumb + save state */}
      <div style={{ padding: '20px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Filings</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-mono" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>RFO-05</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>Supporting facts</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: T.forest }}/>
            Saved 12 seconds ago
          </span>
          <PillButton tone="ghost" size="sm" icon={I.eye}>Preview packet</PillButton>
        </div>
      </div>

      {/* Title strip */}
      <div style={{ padding: '18px 40px 24px', borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Filing · Request for Order</div>
            <div className="fb-sans fb-tight" style={{ fontSize: 30, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>Custody Modification</div>
            <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>
              Forms: FL-300 · FL-311 · FL-341 · MC-031 declaration · 6 exhibits
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
            <Stat k="To deadline" v="14d" tone={T.ox}/>
            <Stat k="Forms ready" v="3/4"/>
            <Stat k="Exhibits" v="6/6" tone={T.forest}/>
          </div>
        </div>
      </div>

      {/* 3-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', minHeight: 720 }}>
        {/* LEFT — step rail */}
        <div style={{ padding: '28px 18px 28px 32px', borderRight: `0.5px solid ${T.rule}` }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Your filing · 7 steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map((st, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 12px', borderRadius: 10,
                background: st.s === 'active' ? '#FFFFFF' : 'transparent',
                border: `0.5px solid ${st.s === 'active' ? T.rule : 'transparent'}`,
                boxShadow: st.s === 'active' ? `0 1px 2px ${T.ink}08` : 'none',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: st.s === 'done' ? T.ink : st.s === 'active' ? T.ox : T.paperDeep,
                  color: st.s === 'pending' ? T.inkMute : T.paper,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1,
                }} className="fb-sans fb-tnum">
                  {st.s === 'done'
                    ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l1.8 1.8L8 2.5" stroke={T.paper} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : st.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 13, color: st.s === 'pending' ? T.inkMute : T.ink, fontWeight: st.s === 'active' ? 600 : 500 }}>{st.t}</div>
                  {st.s === 'active' && <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 500, marginTop: 3 }}>In progress · 3 of 5</div>}
                  {st.s === 'done' && <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 3 }}>Reviewed</div>}
                </div>
              </div>
            ))}
          </div>

          <Rule style={{ margin: '20px 0' }}/>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Filing packet</div>
          {[
            { n: 'FL-300', t: 'Request for Order', s: 'ready' },
            { n: 'FL-311', t: 'Child Custody Add-On', s: 'ready' },
            { n: 'FL-341', t: 'Order Attachment', s: 'ready' },
            { n: 'MC-031', t: 'Declaration', s: 'draft' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: i < 3 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <span className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600, minWidth: 44 }}>{f.n}</span>
              <span className="fb-sans" style={{ fontSize: 11.5, color: T.ink, flex: 1 }}>{f.t}</span>
              <span className="fb-sans" style={{ fontSize: 10, color: f.s === 'ready' ? T.forest : T.inkMute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.s}</span>
            </div>
          ))}
        </div>

        {/* CENTER — the question */}
        <div style={{ padding: '40px 48px' }}>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step 3 of 7 · Supporting facts</div>
          <div className="fb-sans fb-tight" style={{ fontSize: 32, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, marginTop: 8, maxWidth: 620 }}>
            Which incidents best support your request?
          </div>
          <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginTop: 10, lineHeight: 1.55, maxWidth: 620 }}>
            We surfaced 23 relevant entries from your journal. Pick the ones you want to cite — we suggest the most probative by default. You can always change this later.
          </div>

          {/* Tab toolbar */}
          <div style={{ marginTop: 28, display: 'flex', gap: 4, borderBottom: `0.5px solid ${T.rule}` }}>
            {[
              ['Suggested', 8, true],
              ['All recent', 23],
              ['By pattern', 4],
              ['Statements', 6],
            ].map(([l, n, act], i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: act ? `2px solid ${T.ink}` : '2px solid transparent', marginBottom: -0.5 }}>
                <span className="fb-sans" style={{ fontSize: 13, color: act ? T.ink : T.inkMute, fontWeight: act ? 600 : 500 }}>{l}</span>
                <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute, fontWeight: 500, marginLeft: 6 }}>{n}</span>
              </div>
            ))}
          </div>

          {/* Incident picker — list of checkboxes */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t: 'exchange', title: 'Late drop-off · 45 min', d: 'Tue Apr 21', meta: '3rd in 30d · photo · witness', sel: true, why: 'Establishes pattern' },
              { t: 'statement', title: 'Leonie: "Daddy said I have to keep my things…"', d: 'Tue Apr 21', meta: 'EC § 1240 candidate · linked to exchange', sel: true, why: 'Admissible hearsay' },
              { t: 'deny',     title: 'Denied weekend visit', d: 'Sat Apr 11', meta: 'OFW message · medical excuse unverified', sel: true, why: 'Direct order violation' },
              { t: 'statement', title: 'Leonie: "He yelled at Maria"', d: 'Wed Apr 2', meta: 'Spontaneous · corroborated by nanny', sel: true, why: 'Supports best-interest'  },
              { t: 'exchange', title: 'No-show pickup', d: 'Fri Mar 28', meta: 'Photo of empty curb · M. Ortega witness', sel: false },
              { t: 'comm',     title: 'Hostile text message thread', d: 'Mar 19–21', meta: '7 messages · AI flagged 2 as denigrating', sel: false },
            ].map((inc, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                background: inc.sel ? '#FFFFFF' : T.paperDeep + '60',
                border: `0.5px solid ${inc.sel ? T.ink + '30' : T.rule}`,
                borderRadius: 12,
                boxShadow: inc.sel ? `0 1px 2px ${T.ink}08` : 'none',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, marginTop: 2,
                  background: inc.sel ? T.ink : 'transparent',
                  border: `1.5px solid ${inc.sel ? T.ink : T.inkFaint}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {inc.sel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l1.8 1.8L8 2.5" stroke={T.paper} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <EntryMark type={inc.t} size={26}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{inc.title}</div>
                    <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute }}>{inc.d}</span>
                  </div>
                  <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 3 }}>{inc.meta}</div>
                  {inc.why && (
                    <div style={{ marginTop: 8, padding: '5px 10px', background: T.oxWash, borderRadius: 6, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <Icon d={I.spark} size={11} stroke={T.ox}/>
                      <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>{inc.why}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 28, padding: '20px 0', borderTop: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Selected</div>
              <div className="fb-sans fb-tight" style={{ fontSize: 22, color: T.ink, fontWeight: 600, marginTop: 2 }}>4 of 23 incidents · covers 3 legal theories</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton tone="ghost" size="lg" icon="m15 6-6 6 6 6">Back</PillButton>
              <PillButton tone="primary" size="lg" iconRight="m9 6 6 6-6 6">Continue to evidence</PillButton>
            </div>
          </div>
        </div>

        {/* RIGHT — why this matters + live draft */}
        <div style={{ padding: '28px 28px', background: T.paperDeep + '60', borderLeft: `0.5px solid ${T.rule}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: T.oxWash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={I.spark} size={12} stroke={T.ox} sw={1.8}/>
            </div>
            <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Why this step matters</span>
          </div>
          <div className="fb-serif" style={{ fontSize: 16, color: T.ink, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
            California family courts modify custody only when there's a <em style={{ color: T.ox }}>material change in circumstances</em>.
          </div>
          <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, marginTop: 10 }}>
            Picking the right incidents here determines whether the judge sees a <HelpTip term="pattern"/> or a list of complaints. <br/><br/>
            We suggest 4–8 probative entries across the <em>three theories</em> in your request: chronic lateness, denigration, and denied visits.
          </div>

          <Rule style={{ margin: '20px 0' }}/>

          {/* Live preview */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Live draft · MC-031 ¶ 4</div>
          <div style={{ background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, padding: '14px 16px' }}>
            <div className="fb-serif" style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.65, letterSpacing: '-0.003em' }}>
              <strong>4.</strong> Since the June 12, 2024 order, Respondent has demonstrated a pattern of non-compliance. On <span style={{ background: T.oxWash, padding: '1px 3px', borderRadius: 3 }}>April 21, 2026</span>, Respondent returned the child <span style={{ background: T.oxWash, padding: '1px 3px', borderRadius: 3 }}>45 minutes late</span>, her third late exchange in 30 days. During that exchange, the child made a spontaneous statement…
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <CiteChip>Entry #00418</CiteChip>
              <CiteChip>Entry #00419</CiteChip>
              <CiteChip>Pattern #P-03</CiteChip>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', background: T.forestWash, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: T.forest, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }} className="fb-sans">✓</div>
            <div>
              <div className="fb-sans" style={{ fontSize: 12, fontWeight: 600, color: T.forest }}>Strong grounding</div>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2, lineHeight: 1.5 }}>Each fact cites a sealed entry. No unsupported claims.</div>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

function CiteChip({ children }) {
  const T = window.FB;
  return (
    <span className="fb-mono" style={{ fontSize: 9.5, color: T.ox, fontWeight: 600, padding: '3px 7px', background: T.oxWash, borderRadius: 4, letterSpacing: '0.02em' }}>{children}</span>
  );
}

function Stat({ k, v, tone }) {
  const T = window.FB;
  return (
    <div>
      <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
      <div className="fb-sans fb-tight fb-tnum" style={{ fontSize: 20, color: tone || T.ink, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>{v}</div>
    </div>
  );
}

// ─── Mobile Filing Wizard ───────────────────────────────
function MobileFilingWizard() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      {/* Header */}
      <div style={{ padding: '58px 20px 14px', borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d="m15 6-6 6 6 6" size={16} stroke={T.ink} sw={1.8}/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600 }}>RFO-05 · Custody</div>
            <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>Step 3 of 7</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={I.eye} size={14} stroke={T.ink} sw={1.6}/>
          </div>
        </div>
        <ProgressBar pct={43}/>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 110px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Supporting facts</div>
        <div className="fb-sans fb-tight" style={{ fontSize: 24, color: T.ink, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Which incidents best support your request?</div>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 8, lineHeight: 1.5 }}>We picked the strongest 8 from 23 relevant entries. Tap to include or swap.</div>

        {/* Why this matters — collapsed */}
        <div style={{ marginTop: 18, padding: '14px 16px', background: T.oxWash, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon d={I.spark} size={14} stroke={T.ox} sw={1.8}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 12, color: T.ox, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Why this matters</div>
            <div className="fb-serif" style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginTop: 4, fontStyle: 'italic' }}>
              Courts want a <em style={{ color: T.ox }}>pattern</em>, not a list. 4–8 strong entries &gt; 20 weak ones.
            </div>
          </div>
          <Icon d={I.chevR} size={12} stroke={T.ox}/>
        </div>

        {/* Selected count */}
        <div style={{ marginTop: 20, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Suggested · 4 selected</span>
          <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>See all 23</span>
        </div>

        {[
          { t: 'exchange', title: 'Late drop-off · 45 min', d: 'Apr 21', sel: true, why: 'Pattern' },
          { t: 'statement', title: '"Daddy said I have to keep my things…"', d: 'Apr 21', sel: true, why: 'EC § 1240' },
          { t: 'deny', title: 'Denied weekend visit', d: 'Apr 11', sel: true, why: 'Direct violation' },
          { t: 'statement', title: '"He yelled at Maria"', d: 'Apr 2', sel: true, why: 'Best-interest' },
          { t: 'exchange', title: 'No-show pickup', d: 'Mar 28', sel: false },
          { t: 'comm', title: 'Hostile text thread', d: 'Mar 19–21', sel: false },
        ].map((inc, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 8,
            background: inc.sel ? '#FFFFFF' : T.paperDeep + '60',
            border: `0.5px solid ${inc.sel ? T.ink + '30' : T.rule}`, borderRadius: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, marginTop: 2,
              background: inc.sel ? T.ink : 'transparent',
              border: `1.5px solid ${inc.sel ? T.ink : T.inkFaint}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {inc.sel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l1.8 1.8L8 2.5" stroke={T.paper} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <EntryMark type={inc.t} size={24}/>
            <div style={{ flex: 1 }}>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600, lineHeight: 1.3 }}>{inc.title}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute }}>{inc.d}</span>
                {inc.why && <span className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, background: T.oxWash, padding: '2px 7px', borderRadius: 999 }}>{inc.why}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FFFFFFEE', backdropFilter: 'blur(8px)', borderTop: `0.5px solid ${T.rule}`, padding: '14px 20px 30px', display: 'flex', gap: 10 }}>
        <PillButton tone="ghost" size="lg" icon="m15 6-6 6 6 6">Back</PillButton>
        <PillButton tone="primary" size="lg" full iconRight="m9 6 6 6-6 6" style={{ flex: 1 }}>Continue · 4 selected</PillButton>
      </div>
    </div>
  );
}

Object.assign(window, { DesktopFilingWizard, MobileFilingWizard });
