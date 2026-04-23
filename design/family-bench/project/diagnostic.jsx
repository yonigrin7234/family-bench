// Family Bench — Case Diagnostic Flow
// Branching intake ("tell us what's happening") → 2-3 legal options with statute basis,
// evidence required, gaps in your case, timeline.
// This is the "should I file for contempt or modify custody?" flow.

// ─── Mobile: opener ──────────────────────────────────────────────
function DiagOpenerMobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m18 6-12 12M6 6l12 12" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Diagnose</div>
        <div style={{ width: 32 }}/>
      </div>

      <div style={{ flex: 1, padding: '32px 28px 120px', display: 'flex', flexDirection: 'column' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Case Diagnostic</div>
        <div className="fb-serif fb-tight" style={{ fontSize: 40, color: T.ink, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 16, lineHeight: 1.05 }}>
          Tell me what's happening.
        </div>
        <div className="fb-serif" style={{ fontSize: 17, color: T.inkSoft, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: '-0.005em' }}>
          I'll walk you through a few questions about your situation, then I'll show you the two or three paths the law actually gives you — and what each one needs from your evidence.
        </div>

        <div style={{ marginTop: 32, padding: '16px 18px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14 }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>What you'll get</div>
          {[
            ['The filings that fit', 'Each with statute, burden, timeline'],
            ['What your evidence actually proves', 'Specific entries mapped to elements'],
            ["The gaps you'd need to close", 'Missing declarations, witnesses, receipts'],
          ].map(([h, s], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <div className="fb-serif fb-tight" style={{ fontSize: 18, color: T.ox, fontWeight: 500, fontStyle: 'italic', width: 18, lineHeight: 1, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{h}</div>
                <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2, lineHeight: 1.45 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '12px 14px', background: T.paperDeep, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon d={I.lock} size={13} stroke={T.inkSoft} sw={1.8}/>
          <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5, flex: 1 }}>
            This is legal <em>information</em>, not advice. Nothing you say here leaves your case.
          </div>
        </div>

        <div style={{ flex: 1 }}/>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 24px 34px', background: T.paper }}>
        <PillButton tone="primary" size="lg" full iconRight="m9 6 6 6-6 6">Start · 6 questions, 4 min</PillButton>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Or ask Advisor directly</span>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: question 1 of 6 — what's the situation ─────────────
function DiagQ1Mobile() {
  const T = window.FB;
  const options = [
    { k: 'denied',    t: 'The other parent keeps denying my time', s: '3 events / 30 d detected in your log', hit: true },
    { k: 'late',      t: 'Chronic lateness at exchanges', s: '7 events / 30 d detected', hit: true },
    { k: 'unilateral',t: 'They made a big decision without me', s: 'Medical, school, religion, relocation' },
    { k: 'safety',    t: "I'm worried about my child's safety",  s: 'Substance use, new partner, neglect' },
    { k: 'money',     t: 'Support or expenses are off',          s: 'Unpaid, unreimbursed, underreported income' },
    { k: 'violation', t: 'They broke a specific court order',    s: 'Communication, firearms, exchange rules' },
    { k: 'modify',    t: 'I want to change the custody schedule',s: 'Changed circumstances, growth, relocation' },
    { k: 'respond',   t: "They filed something — I'm responding", s: 'RFO, OSC, contempt filed against me' },
  ];
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <DiagMobileHeader step={1} total={6}/>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 140px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question 1 of 6</div>
        <div className="fb-serif fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15 }}>
          What's the main thing on your mind right now?
        </div>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 8, lineHeight: 1.5 }}>
          Pick one. You can add others on the next screen. I'll match this against the 847 entries in your case.
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((o, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              background: o.hit ? T.oxWash + '40' : '#FFFFFF',
              border: `0.5px solid ${o.hit ? T.ox + '40' : T.rule}`,
              borderRadius: 12,
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                border: `1.5px solid ${o.hit ? T.ox : T.inkFaint}`, flexShrink: 0,
              }}/>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{o.t}</div>
                <div className="fb-sans" style={{ fontSize: 11.5, color: o.hit ? T.ox : T.inkMute, marginTop: 2, fontWeight: o.hit ? 600 : 400 }}>
                  {o.hit && '● '}{o.s}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '14px 16px', background: T.paperDeep, borderRadius: 12 }}>
          <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Why I ask</div>
          <div className="fb-serif" style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
            The law treats "they're denying my time" and "I want to move" as <em>totally different</em> motions — different forms, different burdens, different timelines. Getting this right saves you months.
          </div>
        </div>
      </div>

      <DiagMobileFooter current={1} total={6} enabled/>
    </div>
  );
}

// ─── Mobile: question 3 of 6 — how often ────────────────────────
function DiagQ3Mobile() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <DiagMobileHeader step={3} total={6}/>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 140px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question 3 of 6</div>
        <div className="fb-serif fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15 }}>
          How often has this been happening?
        </div>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 8, lineHeight: 1.5 }}>
          I'll double-check with what's in your log.
        </div>

        {/* Auto-detected card */}
        <div style={{ marginTop: 18, padding: '16px 18px', background: T.forestWash, borderRadius: 14, border: `0.5px solid ${T.forest}30` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Icon d="m6 12 4 4 8-8" size={14} stroke={T.forest} sw={2}/>
            <span className="fb-sans" style={{ fontSize: 11, color: T.forest, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>From your entries</span>
          </div>
          <div className="fb-serif fb-tight" style={{ fontSize: 22, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            3 denied visits in the last 30 days. 5 in the last 90.
          </div>
          <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 6 }}>Mar 14 · Mar 28 · Apr 11</div>
          <div style={{ marginTop: 10 }}>
            <PillButton tone="soft" size="sm" iconRight="m9 6 6 6-6 6">See the entries</PillButton>
          </div>
        </div>

        {/* Confirm options */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 22, marginBottom: 10 }}>Does that sound right?</div>
        {[
          { t: "Yes, those three are the ones", selected: true },
          { t: "Yes, and there are more I didn't log" },
          { t: 'Some of those weren\'t really "denials"' },
          { t: 'This has been going on for much longer' },
        ].map((o, i) => (
          <div key={i} style={{
            padding: '14px 16px',
            background: o.selected ? T.ink : '#FFFFFF',
            color: o.selected ? T.paper : T.ink,
            border: `0.5px solid ${o.selected ? T.ink : T.rule}`,
            borderRadius: 12, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, border: `1.5px solid ${o.selected ? T.paper : T.inkFaint}`, flexShrink: 0, position: 'relative' }}>
              {o.selected && <div style={{ position: 'absolute', inset: 3, background: T.paper, borderRadius: 999 }}/>}
            </div>
            <div className="fb-sans" style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{o.t}</div>
          </div>
        ))}
      </div>

      <DiagMobileFooter current={3} total={6} enabled/>
    </div>
  );
}

// ─── Shared mobile header + footer ─────────────────────────────
function DiagMobileHeader({ step, total }) {
  const T = window.FB;
  return (
    <div style={{ padding: '56px 20px 14px', borderBottom: `0.5px solid ${T.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Case Diagnostic</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Step {step} of {total}</div>
        </div>
        <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>Save · exit</span>
      </div>
      <div style={{ marginTop: 12, height: 3, background: T.paperDeep, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(step / total) * 100}%`, height: '100%', background: T.ox }}/>
      </div>
    </div>
  );
}
function DiagMobileFooter({ current, total, enabled }) {
  const T = window.FB;
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px 30px', background: '#FFFFFFEE', backdropFilter: 'blur(8px)', borderTop: `0.5px solid ${T.rule}`, display: 'flex', gap: 8 }}>
      {current > 1 && <PillButton tone="ghost" size="lg" icon="m15 6-6 6 6 6">Back</PillButton>}
      <div style={{ flex: 1 }}/>
      <PillButton tone={enabled ? 'primary' : 'soft'} size="lg" iconRight="m9 6 6 6-6 6" full={current === 1}>Continue</PillButton>
    </div>
  );
}

// ─── Mobile: results — 2-3 options ──────────────────────────────
function DiagResultsMobile() {
  const T = window.FB;
  const opts = [
    {
      tag: 'Recommended',
      tone: T.ox,
      title: 'Request for Order — Custody Modification',
      form: 'FL-300 + FL-311',
      burden: 'Preponderance of evidence',
      why: 'Three denied visits in 30 days plus chronic lateness establishes a changed circumstance. You\'re asking the court to modify — not punish.',
      strength: 'Strong',
      timeline: '6–10 weeks to hearing',
      your: [
        { n: '12 entries', s: 'Denied visits + lateness pattern, GPS & photo-verified' },
        { n: 'Custody order', s: 'Current 50/50 on file, violation language § 4(c)' },
        { n: 'Witness', s: 'M. Ortega on record Mar 28' },
      ],
      gaps: [
        'Missing: FL-150 Income & Expense (required)',
        'Missing: Declaration re: child impact',
      ],
    },
    {
      tag: 'Also available',
      title: 'Order to Show Cause — Contempt',
      form: 'FL-410 + FL-412',
      burden: 'Beyond a reasonable doubt',
      why: 'Higher bar — you have to prove willful violation. Powerful if granted, harder to win. Usually paired with modification, not instead of.',
      strength: 'Weaker on its own',
      timeline: '10–14 weeks to hearing',
      your: [
        { n: '3 entries', s: 'Denied visits — witness on one' },
      ],
      gaps: [
        'Missing: 30-day written warning to opposing party',
        'Missing: Direct evidence of willfulness',
      ],
    },
    {
      tag: 'Cheapest first step',
      title: 'Meet & Confer letter — via attorney',
      form: 'No filing',
      burden: 'None — pre-litigation',
      why: 'Formal letter documents the problem and demands resolution. Sometimes just doing this changes behavior. Costs you nothing but a week.',
      strength: 'Creates evidence either way',
      timeline: '7–14 days',
      your: [
        { n: 'Ready now', s: 'I can draft the letter from your entries' },
      ],
      gaps: [],
    },
  ];
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 14px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={14} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>Your options</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Based on 6 answers + 847 entries</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.upload} size={13} stroke={T.ink} sw={1.8}/>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 30px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diagnostic result</div>
        <div className="fb-serif fb-tight" style={{ fontSize: 28, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.1 }}>
          Here are your three paths.
        </div>
        <div className="fb-serif" style={{ fontSize: 15, color: T.inkSoft, marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
          Ordered by what I think fits your case best. Tap any to see the full plan.
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {opts.map((o, i) => (
            <div key={i} style={{
              background: '#FFFFFF',
              border: `0.5px solid ${i === 0 ? T.ox + '50' : T.rule}`,
              borderRadius: 16, padding: 18,
              boxShadow: i === 0 ? `0 1px 2px ${T.ink}08` : 'none',
            }}>
              {/* Tag row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="fb-sans" style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: i === 0 ? T.ox : T.inkMute,
                  background: i === 0 ? T.oxWash : T.paperDeep,
                  padding: '3px 8px', borderRadius: 999,
                }}>{o.tag}</span>
                <span className="fb-mono" style={{ fontSize: 10, color: T.inkMute }}>{o.form}</span>
              </div>

              {/* Title */}
              <div className="fb-serif fb-tight" style={{ fontSize: 20, color: T.ink, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {o.title}
              </div>

              {/* Why */}
              <div className="fb-serif" style={{ fontSize: 14, color: T.inkSoft, marginTop: 8, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
                {o.why}
              </div>

              {/* Stats */}
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Burden</div>
                  <div className="fb-sans" style={{ fontSize: 12, color: T.ink, marginTop: 2, fontWeight: 500 }}>{o.burden}</div>
                </div>
                <div>
                  <div className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Timeline</div>
                  <div className="fb-sans" style={{ fontSize: 12, color: T.ink, marginTop: 2, fontWeight: 500 }}>{o.timeline}</div>
                </div>
              </div>

              {/* Your evidence */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: T.paperDeep + '80', borderRadius: 10 }}>
                <div className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>What you have</div>
                {o.your.map((y, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: j ? 8 : 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: T.forest, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</div>
                    <div>
                      <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{y.n}</span>
                      <span className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginLeft: 6 }}>{y.s}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gaps */}
              {o.gaps.length > 0 && (
                <div style={{ marginTop: 8, padding: '12px 14px', background: T.oxWash + '60', borderRadius: 10 }}>
                  <div className="fb-sans" style={{ fontSize: 9.5, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Gaps to close</div>
                  {o.gaps.map((g, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: j ? 6 : 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: T.ox, marginTop: 6, flexShrink: 0 }}/>
                      <span className="fb-sans" style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>{g}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <PillButton tone={i === 0 ? 'primary' : 'ghost'} size="md" iconRight="m9 6 6 6-6 6">Start this filing</PillButton>
                <PillButton tone="soft" size="md" icon={I.chat}>Talk it through</PillButton>
              </div>
            </div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <div style={{ marginTop: 20, padding: '14px 16px', background: T.paperDeep, borderRadius: 12 }}>
          <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>One more thing</div>
          <div className="fb-serif" style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
            This is <em>legal information</em> based on California Family Code + your own records. A self-rep parent can file any of these. An attorney can tell you which is strongest for a judge who's seen thousands.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop: full diagnostic results with side-by-side comparison ────
function DesktopDiagnosticResults() {
  const T = window.FB;
  const opts = [
    { tag: 'Recommended', color: T.ox, title: 'Custody Modification', form: 'FL-300 + FL-311', burden: 'Preponderance', fit: 92, elements: [
        { el: 'Changed circumstance', status: 'strong', note: '3 denials + 7 late in 30d' },
        { el: 'Best interest of child', status: 'strong', note: 'Child statement EC §1240' },
        { el: 'Material change', status: 'ok',     note: 'Pattern vs. pre-order history' },
        { el: 'Proposed schedule', status: 'gap',   note: "You haven't drafted this yet" },
      ], timeline: [
        ['Week 1', 'Draft FL-300 + FL-311'],
        ['Week 2', 'Serve opposing party'],
        ['Week 3', 'File response'],
        ['Week 6–10', 'Hearing in Dept. 24'],
    ] },
    { tag: 'Secondary', color: T.inkSoft, title: 'Contempt (OSC)', form: 'FL-410 + FL-412', burden: 'Beyond a reasonable doubt', fit: 54, elements: [
        { el: 'Valid order', status: 'strong', note: 'On file Jun 2024' },
        { el: 'Knowledge', status: 'strong', note: 'Served + OFW receipts' },
        { el: 'Ability to comply', status: 'ok', note: 'No hardship in record' },
        { el: 'Willful violation', status: 'gap', note: 'Need direct evidence' },
      ], timeline: [
        ['Week 1', 'Draft OSC + supporting dec'],
        ['Week 2', 'Service (personal required)'],
        ['Week 3', 'Response'],
        ['Week 10–14', 'Hearing'],
    ] },
    { tag: 'Preparatory', color: T.forest, title: 'Meet & Confer', form: 'No filing', burden: 'None', fit: 100, elements: [
        { el: 'Pre-litigation demand', status: 'strong', note: 'Ready to draft' },
        { el: 'Proposed cure', status: 'strong', note: 'Specific asks in your log' },
        { el: 'Deadline for response', status: 'strong', note: '14 days is standard' },
        { el: 'No court action yet', status: 'ok', note: 'Intentional - preserves rights' },
      ], timeline: [
        ['Day 1', 'Send formal letter'],
        ['Day 2–14', 'Await response'],
        ['Day 15', 'Escalate or not'],
    ] },
  ];

  const elementStatus = {
    strong: { tone: T.forest, label: '✓ Have it', bg: T.forestWash + '80' },
    ok:     { tone: T.ink, label: '○ Partial', bg: T.paperDeep },
    gap:    { tone: T.ox, label: '! Gap', bg: T.oxWash + '80' },
  };

  return (
    <DesktopShell active="diagnose">
      <div style={{ padding: '28px 40px 20px', borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Case Diagnostic</span>
          <Icon d={I.chevR} size={10} stroke={T.inkFaint}/>
          <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>Results</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Based on your intake + 847 entries</div>
            <div className="fb-serif fb-tight" style={{ fontSize: 40, color: T.ink, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1.05 }}>
              Three paths the law gives you.
            </div>
            <div className="fb-serif" style={{ fontSize: 17, color: T.inkSoft, marginTop: 10, fontStyle: 'italic', letterSpacing: '-0.005em', maxWidth: 680 }}>
              I've mapped each against the elements California requires, scored the fit against your evidence, and flagged the gaps you'd need to close.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <PillButton tone="ghost" size="md" icon={I.upload}>Save as PDF</PillButton>
            <PillButton tone="ghost" size="md" icon={I.folder}>Revisit answers</PillButton>
          </div>
        </div>
      </div>

      {/* Three-column comparison */}
      <div style={{ padding: '28px 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {opts.map((o, i) => (
          <div key={i} style={{
            background: i === 0 ? '#FFFFFF' : T.paper,
            border: `0.5px solid ${i === 0 ? o.color + '50' : T.rule}`,
            borderRadius: 16, padding: 22,
            boxShadow: i === 0 ? `0 1px 3px ${T.ink}10` : 'none',
            position: 'relative',
          }}>
            {i === 0 && <div style={{ position: 'absolute', top: -10, left: 22, background: T.ox, color: T.paper, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999 }} className="fb-sans">★ Best fit</div>}

            <div className="fb-sans" style={{ fontSize: 10, color: o.color, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{o.tag}</div>
            <div className="fb-serif fb-tight" style={{ fontSize: 24, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.15 }}>{o.title}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <span className="fb-mono" style={{ fontSize: 10, color: T.ink, fontWeight: 600, padding: '3px 8px', background: T.paperDeep, borderRadius: 4 }}>{o.form}</span>
              <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, padding: '3px 0' }}>{o.burden}</span>
            </div>

            {/* Fit gauge */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Evidence fit</span>
                <span className="fb-sans fb-tnum" style={{ fontSize: 18, color: o.color, fontWeight: 600, letterSpacing: '-0.02em' }}>{o.fit}%</span>
              </div>
              <div style={{ height: 4, background: T.paperDeep, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${o.fit}%`, height: '100%', background: o.color }}/>
              </div>
            </div>

            {/* Elements */}
            <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Required elements</div>
            {o.elements.map((e, j) => {
              const s = elementStatus[e.status];
              return (
                <div key={j} style={{ padding: '10px 12px', background: s.bg, borderRadius: 8, marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{e.el}</div>
                    <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 1 }}>{e.note}</div>
                  </div>
                  <span className="fb-sans" style={{ fontSize: 10, color: s.tone, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              );
            })}

            {/* Timeline */}
            <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Timeline</div>
            <div style={{ position: 'relative', paddingLeft: 18 }}>
              <div style={{ position: 'absolute', left: 4, top: 5, bottom: 5, width: 1, background: T.rule }}/>
              {o.timeline.map(([w, t], j) => (
                <div key={j} style={{ marginBottom: 8, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -18, top: 5, width: 9, height: 9, borderRadius: 5, background: '#FFFFFF', border: `1.5px solid ${j === 0 ? o.color : T.inkFaint}` }}/>
                  <div className="fb-mono" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{w}</div>
                  <div className="fb-sans" style={{ fontSize: 12, color: T.ink, marginTop: 1 }}>{t}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <PillButton tone={i === 0 ? 'primary' : 'ghost'} size="md" full iconRight="m9 6 6 6-6 6">Start this filing</PillButton>
              <PillButton tone="soft" size="sm" full>See statute basis</PillButton>
            </div>
          </div>
        ))}
      </div>

      {/* Footer reasoning */}
      <div style={{ padding: '0 40px 32px' }}>
        <div style={{ padding: '20px 24px', background: T.paperDeep + '80', borderRadius: 14, display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: T.oxWash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={I.spark} size={14} stroke={T.ox} sw={1.8}/>
          </div>
          <div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Why I ranked it this way</div>
            <div className="fb-serif" style={{ fontSize: 15.5, color: T.ink, lineHeight: 1.55, marginTop: 6, letterSpacing: '-0.005em', maxWidth: 780 }}>
              Your pattern is <em style={{ color: T.ox }}>consistent but not yet willful-by-a-reasonable-doubt</em>. Modification wants a pattern that's here. Contempt wants willfulness I can't confirm from your log alone. Meet & Confer is free and sometimes ends the whole thing — worth 14 days before you escalate. This is <em>legal information, not advice</em>. A California family lawyer would refine this further in an hour.
            </div>
          </div>
          <PillButton tone="soft" size="md" icon={I.chat}>Ask Advisor</PillButton>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { DiagOpenerMobile, DiagQ1Mobile, DiagQ3Mobile, DiagResultsMobile, DesktopDiagnosticResults });
