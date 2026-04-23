// Family Bench — v2 Home screens (Claude-soft, one hero next-step)

// ─── Mobile Home v2 ─────────────────────────────────────
function MobileHomeV2() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', paddingTop: 54, paddingBottom: 96 }}>
        {/* Greeting */}
        <div style={{ padding: '10px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, fontWeight: 500 }}>Good morning, Sarah</div>
            <div className="fb-sans fb-tight" style={{ fontSize: 28, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>Here's today.</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: T.paperDeep, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }} className="fb-sans">SC</div>
        </div>

        {/* Case card — subtle */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 12, border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: T.ink, color: T.paper, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }} className="fb-sans fb-tight">FB</div>
            <div style={{ flex: 1 }}>
              <div className="fb-serif" style={{ fontSize: 15, color: T.ink, fontStyle: 'italic', letterSpacing: '-0.005em' }}>In re: Marriage of Chen</div>
              <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginTop: 1 }}>FL-24-0918 · ALAMEDA · DEPT. 24</div>
            </div>
            <Icon d={I.caretDown} size={12} stroke={T.inkMute}/>
          </div>
        </div>

        {/* NEXT STEP — Intuit hero */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ padding: '18px 20px 20px', background: T.oxWash, borderRadius: 16, border: `0.5px solid ${T.ox}25` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fb-sans" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next step</span>
              <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>Due tomorrow</span>
            </div>
            <div className="fb-sans fb-tight" style={{ fontSize: 22, color: T.ink, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 8 }}>
              Serve your FL-150<br/>(Income & Expense)
            </div>
            <div className="fb-sans" style={{ fontSize: 13, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
              This form must be served 45 days before the May 5 hearing. We've pre-filled it from your last pay stub.
            </div>
            <ProgressBar pct={72} label="Form completion" style={{ marginTop: 16 }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <PillButton tone="primary" size="md" iconRight="m9 6 6 6-6 6" style={{ flex: 1 }}>Continue FL-150</PillButton>
              <PillButton tone="ghost" size="md">Later</PillButton>
            </div>
          </div>
        </div>

        {/* Countdown strip */}
        <div style={{ padding: '0 20px 16px' }}>
          <SoftCard p={0}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="fb-sans fb-tight fb-tnum" style={{ fontSize: 44, color: T.ink, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>14</div>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>days to hearing</div>
                <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 2 }}>Tue May 5 · 9:00 AM · RFO</div>
              </div>
              <Icon d={I.chevR} size={14} stroke={T.inkFaint}/>
            </div>
            <Rule/>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto' }} className="fb-scroll">
              {[['FL-300', true], ['FL-311', true], ['FL-341', true], ['FL-150', 'now'], ['MC-031', false], ['Ex. A', true], ['Ex. B', true]].map(([n, s], i) => (
                <div key={i} className="fb-mono" style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 500, background: s === true ? T.forestWash : s === 'now' ? T.oxWash : T.paperDeep, color: s === true ? T.forest : s === 'now' ? T.ox : T.inkMute, display: 'flex', gap: 5, alignItems: 'center' }}>
                  {s === true && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2L7 1.5" stroke={T.forest} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {s === 'now' && <div style={{ width: 5, height: 5, borderRadius: 3, background: T.ox }}/>}
                  {n}
                </div>
              ))}
            </div>
          </SoftCard>
        </div>

        {/* Quick capture */}
        <div style={{ padding: '0 20px 16px' }}>
          <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>Quick capture</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Log pickup', h: 'Exchange', i: I.clock },
              { l: 'Denied visit', h: 'No-show', i: I.x },
              { l: 'Child said…', h: 'Statement', i: I.chat },
              { l: 'Add expense', h: 'Receipt', i: I.receipt },
            ].map((q, k) => (
              <div key={k} style={{ padding: '14px 14px', background: '#FFFFFF', borderRadius: 12, border: `0.5px solid ${T.rule}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={q.i} size={15} stroke={T.ink} sw={1.6}/>
                </div>
                <div>
                  <div className="fb-sans" style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{q.l}</div>
                  <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 1 }}>{q.h}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's log */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, paddingLeft: 2 }}>
            <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Today · 3 entries</div>
            <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>See all →</span>
          </div>
          <SoftCard p={0}>
            {[
              { t: 'exchange', l: 'Late drop-off · 45 min', m: 'Tue · 3:45 PM', flag: 'ox' },
              { t: 'statement', l: '"Daddy said I have to keep my things…"', m: 'Tue · 3:47 PM', flag: 'ox' },
              { t: 'comm', l: 'OFW · 4 messages imported', m: 'Tue · morning', flag: null },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', alignItems: 'center' }}>
                <EntryMark type={r.t} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fb-sans" style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.l}</div>
                  <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{r.m}</div>
                </div>
                {r.flag && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.ox }}/>}
              </div>
            ))}
          </SoftCard>
        </div>
      </div>
      <FBTabBar active="home"/>
    </div>
  );
}

// ─── Desktop Home v2 ─────────────────────────────────────
function DesktopHomeV2() {
  const T = window.FB;
  return (
    <DesktopShell active="home">
      <div style={{ padding: '32px 40px 24px' }}>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, fontWeight: 500 }}>Good morning, Sarah</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
          <div className="fb-sans fb-tight" style={{ fontSize: 40, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em' }}>Here's today.</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <div><div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hearing</div>
              <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600, marginTop: 2 }}>Tue · May 5</div></div>
            <div><div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Countdown</div>
              <div className="fb-sans fb-tnum fb-tight" style={{ fontSize: 30, color: T.ox, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 2 }}>14 <span style={{ fontSize: 13, color: T.inkMute, fontWeight: 500 }}>days</span></div></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* LEFT — Next step + today's activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Next step hero */}
          <div style={{ padding: '24px 28px', background: T.oxWash, borderRadius: 20, border: `0.5px solid ${T.ox}25` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next up · due tomorrow</span>
              <span className="fb-sans fb-tnum" style={{ fontSize: 12, color: T.ox, fontWeight: 600, background: '#FFFFFF', padding: '4px 10px', borderRadius: 999 }}>13 days of work left</span>
            </div>
            <div className="fb-sans fb-tight" style={{ fontSize: 32, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, marginTop: 10 }}>
              Serve your FL-150 (Income & Expense Declaration)
            </div>
            <div className="fb-sans" style={{ fontSize: 14, color: T.inkSoft, marginTop: 8, lineHeight: 1.55 }}>
              This form must be served 45 days before your hearing. We've pre-filled 72% from your last pay stub and integrated accounts.
            </div>
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[['Sections done', '5 of 7'], ['Attachments', '3 of 4'], ['Last edit', 'Yesterday']].map(([k, v], i) => (
                <div key={i} style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: 10 }}>
                  <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</div>
                  <div className="fb-sans" style={{ fontSize: 15, color: T.ink, fontWeight: 600, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
            <ProgressBar pct={72} label="FL-150 progress" style={{ marginTop: 18 }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <PillButton tone="primary" size="lg" iconRight="m9 6 6 6-6 6">Continue FL-150</PillButton>
              <PillButton tone="ghost" size="lg">Show me what's missing</PillButton>
              <PillButton tone="ghost" size="lg">Mark complete</PillButton>
            </div>
          </div>

          {/* Also on your plate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Also on your plate · 2 things</div>
              <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>See all →</span>
            </div>
            {[
              { kicker: 'Pattern detected', title: 'Third denied visit in 30 days', body: 'This may meet the threshold for an FC § 3048 motion. Advisor can walk you through whether to add it to RFO-05.', cta: 'Review with advisor', tone: 'ink' },
              { kicker: 'Cross-reference', title: "Respondent's income looks inconsistent", body: 'Declared $4,200/mo in his FL-150; your records show $6,800/mo average spend. Worth flagging.', cta: 'Open comparison', tone: 'ink' },
            ].map((c, i) => (
              <div key={i} style={{ padding: '18px 20px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14, marginBottom: 10, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, background: T.ox, marginTop: 8 }}/>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.kicker}</div>
                  <div className="fb-sans fb-tight" style={{ fontSize: 17, color: T.ink, fontWeight: 600, letterSpacing: '-0.015em', marginTop: 4 }}>{c.title}</div>
                  <div className="fb-sans" style={{ fontSize: 13, color: T.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{c.body}</div>
                </div>
                <PillButton tone="soft" size="sm" iconRight="m9 6 6 6-6 6">{c.cta}</PillButton>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Case status + recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Custody split */}
          <SoftCard title="Custody · last 90 days" subtitle="Leonie, 7" p={20} right={
            <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, background: T.oxWash, padding: '4px 10px', borderRadius: 999 }}>−12 overnights</span>
          }>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
              <div className="fb-sans fb-tight" style={{ fontSize: 46, fontWeight: 600, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>38%</div>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Actual vs. <span style={{ color: T.ink, fontWeight: 600 }}>50% scheduled</span></div>
                <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 500, marginTop: 3 }}>7 documented discrepancies</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <BarCompare scheduled={50} actual={38} w={240}/>
            </div>
          </SoftCard>

          {/* Today's activity */}
          <SoftCard title="Today's activity" subtitle="3 new entries · all sealed" p={0}>
            {[
              { t: 'exchange', l: 'Late drop-off · 45 min', m: '3:45 PM · linked', flag: true },
              { t: 'statement', l: '"Daddy said I have to keep my things…"', m: '3:47 PM · EC § 1240', flag: true },
              { t: 'comm', l: 'OFW · 4 messages imported', m: 'Morning · 1 flagged hostile', flag: false },
            ].map((r, i) => (
              <div key={i} style={{ padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'center', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <EntryMark type={r.t} size={24}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fb-sans" style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.l}</div>
                  <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{r.m}</div>
                </div>
                {r.flag && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.ox }}/>}
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </SoftCard>

          {/* Active filings */}
          <SoftCard title="Active filings" p={0}>
            {[
              { id: 'RFO-05', t: 'Custody Modification', pct: 68, tone: T.ox },
              { id: 'FEE-02', t: 'Attorney Fee Waiver',  pct: 100, tone: T.forest },
              { id: 'CON-01', t: 'Contempt (exploring)', pct: 12, tone: T.inkMute },
            ].map((f, i) => (
              <div key={i} style={{ padding: '14px 18px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div className="fb-mono" style={{ fontSize: 10, color: f.tone, fontWeight: 600 }}>{f.id}</div>
                    <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600, marginTop: 2 }}>{f.t}</div>
                  </div>
                  <span className="fb-sans fb-tnum" style={{ fontSize: 12, color: f.pct === 100 ? T.forest : T.inkMute, fontWeight: 600 }}>{f.pct}%</span>
                </div>
                <div style={{ marginTop: 8 }}><ProgressBar pct={f.pct}/></div>
              </div>
            ))}
          </SoftCard>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { MobileHomeV2, DesktopHomeV2 });
