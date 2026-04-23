// Family Bench — v2 Advisor, Evidence, Pattern Detail (Claude-soft)
// Softened vocabulary: breathing cards, editorial serif accents, quieter borders,
// big "why this matters" callouts. One hero action per screen.

// ─── Mobile Advisor v2 ───────────────────────────────────
function MobileAdvisorV2() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      {/* Header */}
      <div style={{ padding: '58px 20px 14px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={16} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>Advisor</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Grounded in 847 entries · In re: Chen</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.plus} size={15} stroke={T.ink} sw={1.8}/>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 120px' }}>
        {/* User question */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <div style={{ maxWidth: '80%', padding: '12px 16px', background: T.ink, color: T.paper, borderRadius: '18px 18px 4px 18px' }}>
            <div className="fb-sans" style={{ fontSize: 14, lineHeight: 1.45 }}>Should I file contempt for the denied weekend?</div>
          </div>
        </div>

        {/* Advisor response */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: T.oxWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Icon d={I.spark} size={13} stroke={T.ox} sw={1.8}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="fb-serif" style={{ fontSize: 16.5, color: T.ink, lineHeight: 1.45, letterSpacing: '-0.005em' }}>
              Probably not on its own. One missed visit rarely supports contempt in Alameda — but paired with your other two, it starts to look like a <em style={{ color: T.ox }}>pattern of willful non-compliance</em>.
            </div>
            <div className="fb-sans" style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 12, lineHeight: 1.55 }}>
              Here's what I'd consider, in order of strength:
            </div>

            {/* Options */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: 1, t: 'Add to your pending RFO-05', h: 'Lower burden, same hearing.', tone: T.forest, strong: 'Recommended' },
                { n: 2, t: 'Separate OSC for contempt', h: 'Higher burden, criminal-adjacent.', tone: T.inkMute },
                { n: 3, t: 'Document and wait for the 4th', h: 'Cleanest pattern at 4+ events.', tone: T.inkMute },
              ].map((o, i) => (
                <div key={i} style={{ padding: '14px 14px', background: '#FFFFFF', border: `0.5px solid ${o.strong ? T.ox + '40' : T.rule}`, borderRadius: 12, display: 'flex', gap: 12 }}>
                  <div className="fb-serif fb-tight" style={{ fontSize: 20, color: o.tone, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1, width: 22 }}>{o.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span className="fb-sans" style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{o.t}</span>
                      {o.strong && <span className="fb-sans" style={{ fontSize: 9.5, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>✓ {o.strong}</span>}
                    </div>
                    <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 3, lineHeight: 1.45 }}>{o.h}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grounding */}
            <div style={{ marginTop: 14, padding: '12px 14px', background: T.paperDeep + '80', borderRadius: 10 }}>
              <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>What I looked at</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {['Entry #00418', 'Entry #00362', 'Entry #00297', 'FC § 3028', 'Alameda Local Rule 5.119', 'Custody order § 4(c)'].map((c, i) => (
                  <span key={i} className="fb-mono" style={{ fontSize: 9.5, color: i < 3 ? T.ox : T.ink, fontWeight: 600, padding: '3px 7px', background: i < 3 ? T.oxWash : '#FFFFFF', borderRadius: 4 }}>{c}</span>
                ))}
              </div>
            </div>

            {/* Action row */}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <PillButton tone="primary" size="md" iconRight="m9 6 6 6-6 6">Add to RFO-05</PillButton>
              <PillButton tone="soft" size="md" icon={I.eye}>Show evidence</PillButton>
            </div>

            {/* Caveat */}
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.4 }}>
              I'm not your lawyer. This is pattern-matching across your records and California Family Code — good to sanity-check, not a substitute for counsel in a close call.
            </div>
          </div>
        </div>

        {/* Follow-up suggestions */}
        <div style={{ marginTop: 22 }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>You might also ask</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'What evidence would I need for the OSC path?',
              'How strong is my current RFO-05?',
              'Draft me a letter to opposing counsel',
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon d={I.chat} size={11} stroke={T.inkMute}/>
                <span className="fb-sans" style={{ fontSize: 12.5, color: T.ink }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FFFFFFEE', backdropFilter: 'blur(8px)', borderTop: `0.5px solid ${T.rule}`, padding: '12px 16px 30px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: T.paperDeep, borderRadius: 22 }}>
          <span className="fb-sans" style={{ flex: 1, fontSize: 13.5, color: T.inkMute }}>Ask about your case…</span>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={I.mic} size={14} stroke={T.paper} sw={1.8}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Advisor v2 ──────────────────────────────────
function DesktopAdvisorV2() {
  const T = window.FB;
  return (
    <DesktopShell active="advisor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%' }}>
        {/* Main conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px 40px 18px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Advisor</div>
              <div className="fb-sans fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>Let's think this through.</div>
              <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkMute, marginTop: 4 }}>Grounded in your 847 entries, your custody order, and California Family Code.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton tone="ghost" size="sm" icon={I.folder}>Conversations</PillButton>
              <PillButton tone="ghost" size="sm" icon={I.plus}>New</PillButton>
            </div>
          </div>

          <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 40px 40px' }}>
            {/* User */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <div style={{ maxWidth: 520, padding: '14px 18px', background: T.ink, color: T.paper, borderRadius: '18px 18px 4px 18px' }}>
                <div className="fb-sans" style={{ fontSize: 14.5, lineHeight: 1.5 }}>Should I file contempt for the denied weekend visit on April 11?</div>
              </div>
            </div>

            {/* Advisor */}
            <div style={{ display: 'flex', gap: 14, maxWidth: 740 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: T.oxWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <Icon d={I.spark} size={15} stroke={T.ox} sw={1.8}/>
              </div>
              <div style={{ flex: 1 }}>
                <div className="fb-serif" style={{ fontSize: 20, color: T.ink, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                  Probably not on its own. One missed visit rarely wins a contempt finding in Alameda — but paired with your other two in the last 30 days, it starts to look like a <em style={{ color: T.ox }}>pattern of willful non-compliance</em>.
                </div>

                {/* Options grid */}
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { n: 1, t: 'Add this incident to your pending RFO-05', h: 'Same hearing, lower evidentiary burden. Reframes the request as a pattern, which is how the court thinks about custody modifications anyway.', tone: T.ox, strong: true, cta: 'Add to RFO-05' },
                    { n: 2, t: 'File a separate Order to Show Cause for contempt', h: 'Higher burden — you need to prove willfulness beyond a reasonable doubt. Possible but harder with one isolated event.', tone: T.inkMute, cta: 'See requirements' },
                    { n: 3, t: 'Document carefully and wait for the next event', h: 'Four documented denials in 60 days is the cleanest pattern. You already have three. One more and the math gets very hard to argue against.', tone: T.inkMute, cta: 'Set a watch' },
                  ].map((o, i) => (
                    <div key={i} style={{ padding: '18px 20px', background: '#FFFFFF', border: `0.5px solid ${o.strong ? T.ox + '50' : T.rule}`, borderRadius: 14, display: 'flex', gap: 16, boxShadow: o.strong ? `0 1px 2px ${T.ink}08` : 'none' }}>
                      <div className="fb-serif fb-tight" style={{ fontSize: 28, color: o.tone, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1, width: 28, flexShrink: 0 }}>{o.n}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="fb-sans" style={{ fontSize: 15, color: T.ink, fontWeight: 600 }}>{o.t}</span>
                          {o.strong && <span className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: T.oxWash, padding: '3px 8px', borderRadius: 999 }}>Recommended</span>}
                        </div>
                        <div className="fb-sans" style={{ fontSize: 13, color: T.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{o.h}</div>
                      </div>
                      <PillButton tone={o.strong ? 'primary' : 'ghost'} size="sm" iconRight="m9 6 6 6-6 6">{o.cta}</PillButton>
                    </div>
                  ))}
                </div>

                {/* Inline evidence drill-down */}
                <div style={{ marginTop: 22, padding: '18px 20px', background: T.paperDeep + '80', borderRadius: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>The 3 denied visits I'm counting</div>
                    <span className="fb-sans" style={{ fontSize: 12, color: T.ox, fontWeight: 500 }}>Open in Evidence →</span>
                  </div>
                  {[
                    { d: 'Sat · Apr 11', meta: 'Denied weekend · unverified medical excuse', ent: '#00412' },
                    { d: 'Sat · Mar 28', meta: 'No-show pickup · witness M. Ortega', ent: '#00369' },
                    { d: 'Sat · Mar 14', meta: "Denied · claimed child 'didn't want to'", ent: '#00341' },
                  ].map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', alignItems: 'center' }}>
                      <EntryMark type="deny" size={24}/>
                      <div style={{ flex: 1 }}>
                        <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{e.d}</div>
                        <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>{e.meta}</div>
                      </div>
                      <span className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600 }}>{e.ent}</span>
                    </div>
                  ))}
                </div>

                <div className="fb-sans" style={{ fontSize: 12, color: T.inkFaint, marginTop: 16, fontStyle: 'italic', lineHeight: 1.5, maxWidth: 560 }}>
                  I'm not your lawyer. This is pattern-matching across your records and California Family Code — good to sanity-check, not a substitute for counsel in a close call.
                </div>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding: '18px 40px 24px', borderTop: `0.5px solid ${T.rule}` }}>
            <div style={{ padding: '14px 18px', background: T.paperDeep, borderRadius: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <Icon d={I.spark} size={14} stroke={T.inkMute}/>
              <span className="fb-sans" style={{ flex: 1, fontSize: 14, color: T.inkMute }}>Follow up on this, or ask something new…</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: '#FFFFFF', border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={I.paperclip} size={14} stroke={T.ink}/>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={I.mic} size={14} stroke={T.paper} sw={1.8}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail — case context */}
        <div style={{ padding: '24px 24px', borderLeft: `0.5px solid ${T.rule}`, background: T.paperDeep + '40', overflow: 'auto' }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Case context</div>

          <SoftCard p={16} style={{ marginBottom: 14 }}>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Current order</div>
            <div className="fb-serif" style={{ fontSize: 14, color: T.ink, marginTop: 4, fontStyle: 'italic', letterSpacing: '-0.005em' }}>50/50 week-on-week-off</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>Entered Jun 12, 2024</div>
            <Rule style={{ margin: '12px 0 10px' }}/>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actual (90 d)</div>
            <div className="fb-sans fb-tight fb-tnum" style={{ fontSize: 28, color: T.ox, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 2 }}>38%</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 500 }}>−12 overnights vs. order</div>
          </SoftCard>

          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Patterns I see</div>
          {[
            { t: 'Chronic late exchanges', n: '7 in 30 d', tone: T.ox },
            { t: 'Denied weekend visits', n: '3 in 30 d', tone: T.ox },
            { t: 'Hostile messaging', n: '12 flagged', tone: T.ox },
            { t: 'Income discrepancy', n: 'FL-150 vs. OFW',  tone: T.ox },
          ].map((p, i) => (
            <div key={i} style={{ padding: '10px 12px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: p.tone }}/>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{p.t}</div>
                <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 1 }}>{p.n}</div>
              </div>
              <Icon d={I.chevR} size={11} stroke={T.inkFaint}/>
            </div>
          ))}

          <Rule style={{ margin: '16px 0' }}/>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Upcoming</div>
          <SoftCard p={14}>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>14 days</div>
            <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600, marginTop: 2 }}>Hearing · May 5</div>
            <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>Dept. 24 · RFO-05</div>
          </SoftCard>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Desktop Evidence v2 — softened feed ────────────────
function DesktopEvidenceV2() {
  const T = window.FB;
  return (
    <DesktopShell active="evidence">
      <div style={{ padding: '28px 40px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `0.5px solid ${T.rule}` }}>
        <div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Evidence library</div>
          <div className="fb-sans fb-tight" style={{ fontSize: 30, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>Your case, one chronology.</div>
          <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>847 entries · sealed · searchable · admissibility pre-checked</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton tone="ghost" size="md" icon={I.filter}>Filter</PillButton>
          <PillButton tone="ghost" size="md" icon={I.upload}>Export</PillButton>
          <PillButton tone="primary" size="md" icon={I.mic}>Capture</PillButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 700 }}>
        {/* Filter rail */}
        <div style={{ padding: '24px 18px 24px 32px', borderRight: `0.5px solid ${T.rule}` }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Lenses</div>
          {[
            { l: 'All entries', n: 847, active: true },
            { l: 'By pattern', n: 4 },
            { l: 'Child statements', n: 42 },
            { l: 'Exchanges', n: 128 },
            { l: 'Communications', n: 319 },
            { l: 'Expenses', n: 67 },
            { l: 'Flagged for filing', n: 24, tone: T.ox },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: f.active ? '#FFFFFF' : 'transparent', border: f.active ? `0.5px solid ${T.rule}` : '0.5px solid transparent', marginBottom: 2 }}>
              <span className="fb-sans" style={{ fontSize: 13, color: f.tone || T.ink, fontWeight: f.active ? 600 : 500 }}>{f.l}</span>
              <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute }}>{f.n}</span>
            </div>
          ))}

          <Rule style={{ margin: '18px 0 14px' }}/>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Date range</div>
          <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: 8, border: `0.5px solid ${T.rule}` }}>
            <div className="fb-sans fb-tnum" style={{ fontSize: 12, color: T.ink }}>Jan 2024 — Apr 2026</div>
            <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 2 }}>847 of 847 · all time</div>
          </div>

          <Rule style={{ margin: '18px 0 14px' }}/>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Integrations</div>
          {[
            ['OurFamilyWizard', 319, true],
            ['Google Calendar', 142, true],
            ['Text messages',    94, true],
            ['Gmail',            88, true],
            ['Photos',           67, true],
            ['Manual entries',  137, null],
          ].map(([l, n, int], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {int && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.forest }}/>}
                {!int && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.inkFaint }}/>}
                <span className="fb-sans" style={{ fontSize: 12, color: T.ink }}>{l}</span>
              </div>
              <span className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Feed */}
        <div style={{ padding: '24px 40px 32px' }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12, marginBottom: 18 }}>
            <Icon d="M11 4a7 7 0 1 1-7 7m16 9-5-5" size={14} stroke={T.inkMute}/>
            <span className="fb-sans" style={{ flex: 1, fontSize: 13.5, color: T.inkMute }}>Search entries, patterns, statements, or ask a question…</span>
            <span className="fb-mono" style={{ fontSize: 10, color: T.inkMute, background: T.paperDeep, padding: '3px 7px', borderRadius: 4 }}>⌘K</span>
          </div>

          {/* Today group */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Today · Apr 21, 2026</div>
          <SoftCard p={0} style={{ marginBottom: 20 }}>
            {[
              { t: 'exchange', h: '3:45 PM', l: 'Late drop-off · 45 minutes', m: 'Linked · photo · witness', pattern: '3rd in 30 d', flag: true },
              { t: 'statement', h: '3:47 PM', l: 'Leonie: "Daddy said I have to keep my things…"', m: 'EC § 1240 candidate', flag: true },
              { t: 'comm', h: '11:12 AM', l: 'OFW · 4 messages · 1 flagged hostile', m: 'Auto-imported from OurFamilyWizard' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '14px 20px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span className="fb-mono fb-tnum" style={{ fontSize: 11, color: T.inkMute, width: 60, flexShrink: 0 }}>{r.h}</span>
                <EntryMark type={r.t} size={26}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{r.l}</span>
                    {r.pattern && <span className="fb-sans" style={{ fontSize: 10, color: T.ox, fontWeight: 600, background: T.oxWash, padding: '2px 7px', borderRadius: 999 }}>{r.pattern}</span>}
                  </div>
                  <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>{r.m}</div>
                </div>
                {r.flag && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.ox }}/>}
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </SoftCard>

          {/* Earlier */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Yesterday · 6 entries</div>
          <SoftCard p={0} style={{ marginBottom: 20 }}>
            {[
              { t: 'comm', h: 'Mon 4:02 PM', l: 'OFW · "You need to figure out a better system."', m: 'Flagged denigrating · Claude analysis' },
              { t: 'exchange', h: 'Mon 2:58 PM', l: 'On-time pickup', m: 'Photo · 0 delay' },
              { t: 'expense', h: 'Mon 10:14 AM', l: 'Receipt · Leonie\'s soccer · $245', m: 'Unreimbursed · 50% per order § 7' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '14px 20px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span className="fb-mono fb-tnum" style={{ fontSize: 11, color: T.inkMute, width: 90, flexShrink: 0 }}>{r.h}</span>
                <EntryMark type={r.t} size={26}/>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{r.l}</div>
                  <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>{r.m}</div>
                </div>
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </SoftCard>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Pattern detail view — desktop ──────────────────────
function DesktopPatternDetail() {
  const T = window.FB;
  return (
    <DesktopShell active="evidence">
      {/* Header */}
      <div style={{ padding: '20px 40px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Evidence</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Patterns</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-mono" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>P-03</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>Chronic late exchanges</span>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '18px 40px 24px', borderBottom: `0.5px solid ${T.rule}` }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pattern · detected automatically</div>
        <div className="fb-sans fb-tight" style={{ fontSize: 36, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.1 }}>
          Chronic late exchanges
        </div>
        <div className="fb-serif" style={{ fontSize: 17, color: T.inkSoft, marginTop: 8, fontStyle: 'italic', letterSpacing: '-0.005em', maxWidth: 720 }}>
          David has been late to pick up or drop off Leonie <em style={{ color: T.ox, fontStyle: 'normal', fontWeight: 600 }}>7 times in the last 30 days</em>, averaging 28 minutes. That's up from once per month in 2025.
        </div>
      </div>

      {/* Three-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 640 }}>
        {/* Main column */}
        <div style={{ padding: '28px 40px' }}>
          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              ['Events', '7', '/30d', T.ox],
              ['Average delay', '28', 'min', T.ox],
              ['Worst', '75', 'min · Mar 19'],
              ['Trend', '7×', 'last year'],
            ].map(([k, v, u, tone], i) => (
              <div key={i} style={{ padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12 }}>
                <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span className="fb-sans fb-tight fb-tnum" style={{ fontSize: 30, color: tone || T.ink, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>{v}</span>
                  <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 500 }}>{u}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Last 30 days · 7 events</div>
          <div style={{ position: 'relative', padding: '24px 20px 20px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14, marginBottom: 28 }}>
            {/* Baseline */}
            <div style={{ position: 'relative', height: 130 }}>
              {/* horizontal ticks */}
              <div style={{ position: 'absolute', bottom: 30, left: 40, right: 10, height: 1, background: T.rule }}/>
              <div style={{ position: 'absolute', bottom: 30, left: 40, right: 10, display: 'flex', justifyContent: 'space-between' }}>
                {['Mar 22','Mar 29','Apr 5','Apr 12','Apr 19'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', transform: 'translateX(-50%)' }}>
                    <div style={{ width: 1, height: 4, background: T.inkFaint, margin: '0 auto' }}/>
                    <div className="fb-mono" style={{ fontSize: 9.5, color: T.inkMute, marginTop: 4 }}>{d}</div>
                  </div>
                ))}
              </div>
              {/* Y label */}
              <div className="fb-mono" style={{ position: 'absolute', top: 0, left: 0, fontSize: 9, color: T.inkMute, transform: 'rotate(-90deg)', transformOrigin: 'left top', marginTop: 80 }}>delay · min</div>

              {/* Bars */}
              {[
                { x: 5,  h: 45, t: '15', d: 'Mar 22' },
                { x: 22, h: 75, t: '35', d: 'Mar 28' },
                { x: 35, h: 95, t: '75', d: 'Mar 19', worst: true },
                { x: 52, h: 35, t: '+10', d: 'Apr 5' },
                { x: 68, h: 55, t: '+25', d: 'Apr 11' },
                { x: 82, h: 40, t: '+15', d: 'Apr 16' },
                { x: 95, h: 85, t: '+45', d: 'Apr 21', today: true },
              ].map((b, i) => (
                <div key={i} style={{ position: 'absolute', bottom: 30, left: `calc(40px + ${b.x}%)`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="fb-mono fb-tnum" style={{ fontSize: 9, color: b.worst || b.today ? T.ox : T.inkMute, fontWeight: 600, marginBottom: 2 }}>{b.t}</div>
                  <div style={{ width: 10, height: b.h, background: b.worst || b.today ? T.ox : T.inkSoft, borderRadius: 2 }}/>
                </div>
              ))}

              {/* Avg line */}
              <div style={{ position: 'absolute', bottom: 30 + 56, left: 40, right: 10, height: 0, borderTop: `1px dashed ${T.ox}70` }}>
                <span className="fb-sans" style={{ position: 'absolute', right: 0, top: -16, fontSize: 10, color: T.ox, fontWeight: 600, background: '#FFFFFF', padding: '1px 4px' }}>avg 28 min</span>
              </div>
            </div>
          </div>

          {/* Events list */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>The 7 events</div>
          <SoftCard p={0} style={{ marginBottom: 28 }}>
            {[
              { d: 'Tue Apr 21 · 3:45 PM', delay: '+45', title: 'Drop-off · curbside', meta: 'Photo · M. Ortega witness · linked to child statement', ent: '#00418', today: true },
              { d: 'Thu Apr 16 · 3:15 PM', delay: '+15', title: 'Pickup · home', meta: 'No excuse given', ent: '#00401' },
              { d: 'Sat Apr 11 · 10:25 AM', delay: '+25', title: 'Weekend pickup · school', meta: 'OFW message · claimed traffic', ent: '#00394' },
              { d: 'Sun Apr 5 · 6:10 PM', delay: '+10', title: 'Drop-off', meta: 'Brief · within courtesy window', ent: '#00386' },
              { d: 'Wed Apr 2 · 3:35 PM', delay: '+35', title: 'Pickup · afterschool program', meta: 'Aftercare charged $25 late fee', ent: '#00378' },
              { d: 'Fri Mar 28 · 3:30 PM', delay: '+30', title: 'Pickup · home', meta: 'Photo · no OFW notice', ent: '#00369' },
              { d: 'Wed Mar 19 · 4:15 PM', delay: '+75', title: 'Pickup · worst event', meta: 'Leonie alone at school for 40 min · called mother', ent: '#00341', worst: true },
            ].map((e, i) => (
              <div key={i} style={{ padding: '14px 20px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 16, alignItems: 'center', background: e.today ? T.oxWash + '60' : e.worst ? T.oxWash + '40' : 'transparent' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: '#FFFFFF', border: `1.5px solid ${T.inkFaint}`, flexShrink: 0 }}/>
                <EntryMark type="exchange" size={24}/>
                <div style={{ minWidth: 140, flexShrink: 0 }}>
                  <div className="fb-sans fb-tnum" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{e.d}</div>
                </div>
                <div style={{ width: 60, flexShrink: 0 }}>
                  <span className="fb-sans fb-tnum" style={{ fontSize: 15, color: T.ox, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{e.delay}</span>
                  <span className="fb-sans" style={{ fontSize: 10, color: T.inkMute, marginLeft: 3 }}>min</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{e.title}</div>
                  <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>{e.meta}</div>
                </div>
                <span className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600 }}>{e.ent}</span>
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </SoftCard>
        </div>

        {/* Right rail — framing + action */}
        <div style={{ padding: '28px 28px', background: T.paperDeep + '60', borderLeft: `0.5px solid ${T.rule}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: T.oxWash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={I.spark} size={12} stroke={T.ox} sw={1.8}/>
            </div>
            <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Why this matters</span>
          </div>
          <div className="fb-serif" style={{ fontSize: 16, color: T.ink, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
            In California, chronic lateness is a <em style={{ color: T.ox }}>factor in best-interest analysis</em> under FC § 3011 — especially when it disrupts the child's routine.
          </div>
          <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, marginTop: 10 }}>
            7 events in 30 days, averaging 28 minutes, is well beyond the "occasional traffic" explanation. Courts tend to notice this kind of drift.
          </div>

          <Rule style={{ margin: '18px 0' }}/>

          {/* Suggested citation */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>How to cite this</div>
          <div style={{ background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, padding: '14px 16px' }}>
            <div className="fb-serif" style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.65, letterSpacing: '-0.003em' }}>
              Between <span style={{ background: T.oxWash, padding: '1px 3px', borderRadius: 3 }}>Mar 19 and Apr 21, 2026</span>, Respondent arrived late to seven (7) scheduled exchanges, averaging <span style={{ background: T.oxWash, padding: '1px 3px', borderRadius: 3 }}>28 minutes past the court-ordered time</span>, with the longest delay reaching 75 minutes. <em style={{ color: T.inkMute }}>(See Pattern P-03, Entries #00341 et seq.)</em>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <span className="fb-mono" style={{ fontSize: 9.5, color: T.ox, fontWeight: 600, padding: '3px 7px', background: T.oxWash, borderRadius: 4 }}>P-03</span>
              <span className="fb-mono" style={{ fontSize: 9.5, color: T.ink, fontWeight: 600, padding: '3px 7px', background: T.paperDeep, borderRadius: 4 }}>7 entries</span>
            </div>
          </div>

          <Rule style={{ margin: '18px 0' }}/>

          {/* Action */}
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>What you can do</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PillButton tone="primary" size="md" full iconRight="m9 6 6 6-6 6">Add pattern to RFO-05</PillButton>
            <PillButton tone="soft" size="md" full icon={I.chat}>Talk this through with Advisor</PillButton>
            <PillButton tone="ghost" size="md" full icon={I.upload}>Export as exhibit</PillButton>
          </div>

          <div style={{ marginTop: 20, padding: '12px 14px', background: T.forestWash, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: T.forest, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }} className="fb-sans">✓</div>
            <div>
              <div className="fb-sans" style={{ fontSize: 12, fontWeight: 600, color: T.forest }}>All 7 events verified</div>
              <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2, lineHeight: 1.5 }}>Sealed · photos match GPS · witnesses on record.</div>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ─── Mobile Pattern Detail ───────────────────────────────
function MobilePatternDetail() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '58px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={16} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600 }}>PATTERN · P-03</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.upload} size={14} stroke={T.ink} sw={1.6}/>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 30px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pattern</div>
        <div className="fb-sans fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4, lineHeight: 1.15 }}>Chronic late exchanges</div>
        <div className="fb-serif" style={{ fontSize: 14.5, color: T.inkSoft, marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
          <em style={{ color: T.ox, fontStyle: 'normal', fontWeight: 600 }}>7 events in 30 days</em>, averaging 28 minutes late. Worst was 75 minutes — Leonie waited alone at school.
        </div>

        {/* Stats */}
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Events', '7', T.ox],
            ['Avg delay', '28 min', T.ox],
            ['Worst', '75 min'],
            ['Trend vs 2025', '7× more'],
          ].map(([k, v, tone], i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 12 }}>
              <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
              <div className="fb-sans fb-tight fb-tnum" style={{ fontSize: 22, color: tone || T.ink, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Why */}
        <div style={{ marginTop: 18, padding: '14px 16px', background: T.oxWash, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Icon d={I.spark} size={12} stroke={T.ox} sw={1.8}/>
            <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Why this matters</span>
          </div>
          <div className="fb-serif" style={{ fontSize: 14, color: T.ink, lineHeight: 1.5, fontStyle: 'italic' }}>
            Chronic lateness is a <em style={{ color: T.ox }}>best-interest factor</em> under FC § 3011 when it disrupts routine. Seven in 30 days is well past "traffic."
          </div>
        </div>

        {/* Mini timeline */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22, marginBottom: 10 }}>Last 30 days</div>
        <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 12, border: `0.5px solid ${T.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {[15, 35, 75, 10, 25, 15, 45].map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className="fb-mono fb-tnum" style={{ fontSize: 8.5, color: v > 30 ? T.ox : T.inkMute, fontWeight: 600 }}>{v}</div>
                <div style={{ width: '100%', height: v, background: v > 30 ? T.ox : T.inkSoft, borderRadius: 2 }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="fb-mono" style={{ fontSize: 9, color: T.inkMute }}>Mar 19</span>
            <span className="fb-mono" style={{ fontSize: 9, color: T.inkMute }}>Today</span>
          </div>
        </div>

        {/* Events */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22, marginBottom: 10 }}>7 events</div>
        <SoftCard p={0}>
          {[
            { d: 'Apr 21', delay: '+45', title: 'Drop-off curbside', today: true },
            { d: 'Apr 16', delay: '+15', title: 'Pickup · home' },
            { d: 'Apr 11', delay: '+25', title: 'Weekend pickup' },
            { d: 'Apr 5',  delay: '+10', title: 'Drop-off' },
            { d: 'Apr 2',  delay: '+35', title: 'Afterschool · $25 fee' },
            { d: 'Mar 28', delay: '+30', title: 'Pickup · home' },
            { d: 'Mar 19', delay: '+75', title: 'Leonie alone 40 min', worst: true },
          ].map((e, i) => (
            <div key={i} style={{ padding: '12px 16px', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none', display: 'flex', gap: 12, alignItems: 'center', background: e.today ? T.oxWash + '50' : e.worst ? T.oxWash + '30' : 'transparent' }}>
              <EntryMark type="exchange" size={22}/>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{e.title}</div>
                <div className="fb-sans fb-tnum" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>{e.d}</div>
              </div>
              <span className="fb-sans fb-tnum" style={{ fontSize: 13, color: T.ox, fontWeight: 700 }}>{e.delay}</span>
              <Icon d={I.chevR} size={11} stroke={T.inkFaint}/>
            </div>
          ))}
        </SoftCard>

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PillButton tone="primary" size="lg" full iconRight="m9 6 6 6-6 6">Add pattern to RFO-05</PillButton>
          <PillButton tone="soft" size="md" full icon={I.chat}>Talk through with Advisor</PillButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MobileAdvisorV2, DesktopAdvisorV2, DesktopEvidenceV2, DesktopPatternDetail, MobilePatternDetail });
