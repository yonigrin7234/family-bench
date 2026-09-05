// Family Bench — guided event-capture flow (mobile).
// TurboTax-style interview mode for logging a pickup/dropoff/incident.
// 6 screens + mood picker + review + detail. Each is a full iOS device.

// ─── Shared shell for wizard screens ─────────────────────
function WizShell({ step, total, title, kicker, children, onBack, onNext, nextLabel = 'Continue', canNext = true, skip }) {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      {/* Header */}
      <div style={{ padding: '58px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d="m15 6-6 6 6 6" size={16} stroke={T.ink} sw={1.8}/>
          </div>
          <span className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 500, letterSpacing: '0.02em' }}>
            Step <span className="fb-tnum" style={{ color: T.ink, fontWeight: 600 }}>{step}</span> of {total}
          </span>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="fb-sans" style={{ fontSize: 11, color: T.ink, fontWeight: 600 }}>Save</span>
          </div>
        </div>
        <ProgressBar pct={Math.round(step / total * 100)}/>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 110px' }}>
        <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{kicker}</div>
        <div className="fb-sans fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 18 }}>{title}</div>
        {children}
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FFFFFFEE', backdropFilter: 'blur(8px)', borderTop: `0.5px solid ${T.rule}`, padding: '14px 20px 30px', display: 'flex', gap: 10 }}>
        {skip && <PillButton tone="ghost" size="lg" style={{ flex: 1 }}>Skip</PillButton>}
        <PillButton tone="primary" size="lg" full iconRight="m9 6 6 6-6 6" style={{ opacity: canNext ? 1 : 0.4 }}>{nextLabel}</PillButton>
      </div>
    </div>
  );
}

// ─── 1) Who was involved ─────────────────────────────────
function CapWho() {
  const T = window.FB;
  return (
    <WizShell step={1} total={6} kicker="New journal entry" title="Who was involved?">
      <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 18, lineHeight: 1.5 }}>
        We'll use this to match the entry to the right custody order and child.
      </div>

      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Child</div>
      <BigChoice label="Leonie Chen" hint="7 years · subject of order · Jun 12 2024" selected icon={I.dot}/>

      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>What kind of event?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BigChoice label="Exchange · pickup or dropoff" hint="A scheduled custody transition" selected icon={I.clock}/>
        <BigChoice label="Denied visit" hint="Exchange didn't happen" icon={I.x}/>
        <BigChoice label="Child statement" hint="Something your child said" icon={I.chat}/>
        <BigChoice label="Communication" hint="Text, email, OFW message" icon={I.receipt}/>
        <BigChoice label="Expense" hint="Medical, school, unreimbursed" icon={I.doc}/>
        <BigChoice label="Something else" hint="Incident, witness, medical…" icon={I.plus}/>
      </div>

      <InfoCallout title="Why we ask" tone="ink">
        Events of the same type aggregate into patterns — three late exchanges in 30 days carries more weight than three disconnected notes.
      </InfoCallout>
    </WizShell>
  );
}

// ─── 2) Scheduled time + actual time ─────────────────────
function CapTimes() {
  const T = window.FB;
  return (
    <WizShell step={2} total={6} kicker="Pickup / Dropoff" title="When was it supposed to happen? When did it actually happen?">
      <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 18, lineHeight: 1.5 }}>
        The gap between scheduled and actual is what courts care about.
      </div>

      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Date</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FFFFFF', border: `1px solid ${T.rule}`, borderRadius: 12 }}>
          <Icon d={I.clock} size={16} stroke={T.ink} sw={1.6}/>
          <span className="fb-sans" style={{ fontSize: 15, color: T.ink, fontWeight: 500 }}>Tuesday · April 21, 2026</span>
          <div style={{ flex: 1 }}/>
          <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, background: T.oxWash, padding: '3px 8px', borderRadius: 999 }}>TODAY</span>
        </div>
      </div>

      {/* Scheduled / actual */}
      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Scheduled time</div>
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: `1px solid ${T.rule}`, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} className="fb-sans fb-tight">
          <span style={{ fontSize: 44, fontWeight: 600, color: T.ink, letterSpacing: '-0.04em' }}>3:00</span>
          <span style={{ fontSize: 18, color: T.inkMute, fontWeight: 500 }}>PM</span>
        </div>
        <div className="fb-sans" style={{ fontSize: 12, color: T.inkMute, marginTop: 4 }}>Per custody order § 4(c) · weekday pickup</div>
      </div>

      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Actual time</div>
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: `1px solid ${T.ox}`, padding: '16px 18px', boxShadow: `0 0 0 3px ${T.ox}12` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} className="fb-sans fb-tight">
          <span style={{ fontSize: 44, fontWeight: 600, color: T.ox, letterSpacing: '-0.04em' }}>3:45</span>
          <span style={{ fontSize: 18, color: T.inkMute, fontWeight: 500 }}>PM</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {['+10', '+15', '+30', '+45', '+60', 'No-show'].map((q, i) => (
            <div key={i} className="fb-sans fb-tnum" style={{ padding: '6px 12px', borderRadius: 999, background: q === '+45' ? T.ink : T.paperDeep, color: q === '+45' ? T.paper : T.ink, fontSize: 12, fontWeight: 500 }}>{q}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '14px 16px', background: T.oxWash, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="fb-sans fb-tight fb-tnum" style={{ fontSize: 32, fontWeight: 600, color: T.ox, letterSpacing: '-0.03em' }}>+45</span>
        <div>
          <div className="fb-sans" style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>45 minutes late</div>
          <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>Third late exchange this month</div>
        </div>
      </div>
    </WizShell>
  );
}

// ─── 3) Child's mood ─────────────────────────────────────
function CapMood() {
  const T = window.FB;
  return (
    <WizShell step={3} total={6} kicker="Pickup / Dropoff · Apr 21" title="How did Leonie seem?" skip>
      <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 18, lineHeight: 1.5 }}>
        Pick the closest match. Emotional state is relevant to best-interest determinations under FC § 3011.
      </div>

      <MoodPicker value="distressed"/>

      <div style={{ marginTop: 20 }}>
        <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Observations (optional)</div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${T.rule}`, borderRadius: 12, padding: 14 }}>
          <div className="fb-sans" style={{ fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
            Crying when she got out of the car. Held my hand tight. Said "Mommy, Daddy said I have to keep my things at his house."
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {['Tearful', 'Clingy', 'Quiet', 'Spoke up'].map((t, i) => (
              <span key={i} className="fb-sans" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: i < 3 ? T.ink : T.paperDeep, color: i < 3 ? T.paper : T.ink, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <InfoCallout title="What makes this admissible" tone="ox">
        A child's <HelpTip term="spontaneous statement"/> made during emotional stress can be admitted under <HelpTip term="Evidence Code § 1240"/>, even though it's hearsay. Your note captures both conditions.
      </InfoCallout>
    </WizShell>
  );
}

// ─── 4) Location + witnesses ─────────────────────────────
function CapWhereWho() {
  const T = window.FB;
  return (
    <WizShell step={4} total={6} kicker="Pickup / Dropoff · Apr 21" title="Where did it happen? Who else was there?" skip>
      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Location</div>
      <div style={{ background: '#FFFFFF', border: `1px solid ${T.rule}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.pin} size={18} stroke={T.ink} sw={1.6}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>1425 Park Blvd, Oakland</div>
          <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>
            <span className="fb-mono">37.8100° N · 122.2720° W</span> · auto-captured · GPS ± 5m
          </div>
        </div>
        <span className="fb-sans" style={{ fontSize: 10, fontWeight: 600, color: T.forest, background: T.forestWash, padding: '3px 8px', borderRadius: 999 }}>VERIFIED</span>
      </div>

      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 }}>Witnesses</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '14px 16px', background: '#FFFFFF', border: `1px solid ${T.ink}`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', boxShadow: `0 0 0 3px ${T.ink}10` }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: T.ink }}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>M. Ortega</div>
            <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>Neighbor · previously testified · willing</div>
          </div>
          <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>+ add</span>
        </div>
        <div style={{ padding: '14px 16px', background: '#FFFFFF', border: `1px dashed ${T.rule}`, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon d={I.plus} size={16} stroke={T.inkMute} sw={1.6}/>
          <span className="fb-sans" style={{ fontSize: 13.5, color: T.inkMute }}>Add another witness</span>
        </div>
      </div>

      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 }}>Other party</div>
      <BigChoice label="David Chen" hint="Respondent · arrived alone" selected icon={I.dot}/>
    </WizShell>
  );
}

// ─── 5) Attach evidence ──────────────────────────────────
function CapAttach() {
  const T = window.FB;
  return (
    <WizShell step={5} total={6} kicker="Pickup / Dropoff · Apr 21" title="Anything to attach?" skip>
      <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 18, lineHeight: 1.5 }}>
        Photos, messages, receipts. Every attachment gets its own hash and timestamp.
      </div>

      {/* Attached items */}
      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>2 attached</div>
      {[
        { type: 'photo', label: 'Timestamped drop-off photo', meta: '3:47 PM · 1.8 MB · SHA a8f3c2…', icon: I.camera },
        { type: 'msg',   label: 'OFW message thread',        meta: '4 messages · Apr 19–21 · imported', icon: I.chat },
      ].map((a, i) => (
        <div key={i} style={{ padding: '12px 14px', background: '#FFFFFF', border: `1px solid ${T.rule}`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={a.icon} size={18} stroke={T.ink} sw={1.6}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{a.label}</div>
            <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginTop: 2 }}>{a.meta}</div>
          </div>
          <Icon d={I.x} size={14} stroke={T.inkMute}/>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
        {[['Photo', I.camera], ['Message', I.chat], ['Receipt', I.receipt], ['Document', I.doc]].map(([l, i], k) => (
          <div key={k} style={{ padding: '16px 12px', background: '#FFFFFF', border: `1px dashed ${T.rule}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon d={i} size={18} stroke={T.inkMute} sw={1.6}/>
            <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>{l}</span>
          </div>
        ))}
      </div>
    </WizShell>
  );
}

// ─── 6) Review ───────────────────────────────────────────
function CapReview() {
  const T = window.FB;
  return (
    <WizShell step={6} total={6} kicker="Almost done" title="Does this look right?" nextLabel="Save & seal entry">
      <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 20, lineHeight: 1.5 }}>
        We'll structure this as two linked entries. Review now — edits are tracked after sealing.
      </div>

      {/* Entry summary card */}
      <SoftCard p={0} style={{ overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${T.ruleSoft}`, display: 'flex', gap: 12, alignItems: 'center', background: T.paperDeep }}>
          <EntryMark type="exchange" size={28}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Pickup / Dropoff</div>
            <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginTop: 1 }}>ENTRY · 45 MIN LATE</div>
          </div>
          <span className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600 }}>Edit</span>
        </div>
        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
          {[
            ['Date', 'Tue Apr 21'],
            ['Child', 'Leonie, 7'],
            ['Scheduled', '3:00 PM'],
            ['Actual', <span style={{ color: T.ox }}>3:45 PM</span>],
            ['Location', '1425 Park Blvd'],
            ['Witness', 'M. Ortega'],
          ].map(([k, v], i) => (
            <div key={i}>
              <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</div>
              <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 500, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </SoftCard>

      <SoftCard p={0} style={{ overflow: 'hidden', marginBottom: 16, borderTop: `3px solid ${T.ox}`, borderRadius: '3px 3px 16px 16px' }}>
        <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${T.ruleSoft}`, display: 'flex', gap: 12, alignItems: 'center' }}>
          <EntryMark type="statement" size={28}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Child Statement</div>
            <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginTop: 1 }}>LINKED · EC § 1240 candidate</div>
          </div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div className="fb-serif" style={{ fontSize: 16, color: T.ink, fontStyle: 'italic', lineHeight: 1.45, paddingLeft: 12, borderLeft: `2px solid ${T.ox}` }}>
            "Mommy, Daddy said I have to keep my things at his house."
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
            <div><div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mood</div><div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500, marginTop: 3 }}>Distressed</div></div>
            <div><div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Spontaneous</div><div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500, marginTop: 3 }}>Yes · unprompted</div></div>
          </div>
        </div>
      </SoftCard>

      <InfoCallout title="What happens when you save" tone="ink">
        Content + metadata is hashed, timestamped, and written to your tamper-evident vault. You can still edit — edits are logged, originals preserved.
      </InfoCallout>
    </WizShell>
  );
}

// ─── Journal detail — after-save view of one incident ────
function MobileJournalDetail() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      {/* Header */}
      <div style={{ padding: '58px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d="m15 6-6 6 6 6" size={16} stroke={T.ink} sw={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Entry #00418</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.upload} size={15} stroke={T.ink} sw={1.6}/>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 30px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <EntryMark type="exchange" size={32}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 11, color: T.ox, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pickup / Dropoff</div>
          </div>
        </div>
        <div className="fb-sans fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15 }}>Late drop-off, 45 minutes</div>
        <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginTop: 6 }}>Tuesday · April 21, 2026 · 3:45 PM</div>

        {/* Linked banner */}
        <div style={{ marginTop: 16, padding: '12px 14px', background: T.oxWash, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon d={I.link} size={14} stroke={T.ox}/>
          <div style={{ flex: 1 }}>
            <div className="fb-sans" style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>Linked to Child Statement #00419</div>
            <div className="fb-sans" style={{ fontSize: 11, color: T.inkSoft, marginTop: 1 }}>EC § 1240 candidate · highly relevant</div>
          </div>
          <Icon d={I.chevR} size={12} stroke={T.ox}/>
        </div>

        {/* Facts */}
        <SoftCard title="The facts" style={{ marginTop: 16 }} p={16}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            {[
              ['Scheduled', '3:00 PM', null],
              ['Actual', '3:45 PM', T.ox],
              ['Delay', '+45 min', T.ox],
              ['Pattern', '3rd in 30 d', T.ox],
              ['Child', 'Leonie, 7', null],
              ['Transfer', 'Curbside', null],
            ].map(([k, v, c], i) => (
              <div key={i}>
                <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</div>
                <div className="fb-sans" style={{ fontSize: 15, color: c || T.ink, fontWeight: 600, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </SoftCard>

        {/* Mood */}
        <SoftCard title="How Leonie seemed" style={{ marginTop: 12 }} p={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: '#B44028' }}/>
            <span className="fb-sans" style={{ fontSize: 15, color: T.ink, fontWeight: 600 }}>Distressed</span>
            <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>· crying · clingy</span>
          </div>
          <div className="fb-sans" style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.55 }}>
            Crying when she got out of the car. Held my hand tight. Said "Mommy, Daddy said I have to keep my things at his house."
          </div>
        </SoftCard>

        {/* Location & people */}
        <SoftCard title="Where & who" style={{ marginTop: 12 }} p={16}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon d={I.pin} size={14} stroke={T.ink}/>
            <span className="fb-sans" style={{ fontSize: 13, color: T.ink }}>1425 Park Blvd, Oakland</span>
          </div>
          <div className="fb-mono" style={{ fontSize: 10.5, color: T.inkMute, marginTop: 4, paddingLeft: 24 }}>37.8100° N · 122.2720° W · ± 5m</div>
          <Rule style={{ margin: '12px 0' }}/>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Witness</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: T.paperDeep, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }} className="fb-sans">MO</div>
            <div style={{ flex: 1 }}>
              <div className="fb-sans" style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>M. Ortega</div>
              <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>Neighbor · willing to testify</div>
            </div>
          </div>
        </SoftCard>

        {/* Attachments */}
        <SoftCard title="Attachments" subtitle="2 files · all sealed" style={{ marginTop: 12 }} p={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Timestamped photo', '1.8 MB · SHA a8f3c2', I.camera], ['OFW message thread', '4 msgs · Apr 19–21', I.chat]].map(([l, m, ic], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.paperDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={ic} size={14} stroke={T.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fb-sans" style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{l}</div>
                  <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginTop: 1 }}>{m}</div>
                </div>
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </div>
        </SoftCard>

        {/* Chain of custody */}
        <SoftCard title="Chain of custody" subtitle="Sealed · verified" right={<span className="fb-sans" style={{ fontSize: 10, fontWeight: 600, color: T.forest, background: T.forestWash, padding: '3px 8px', borderRadius: 999 }}>VERIFIED</span>} style={{ marginTop: 12 }} p={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Captured', '2026-04-21T15:48:09Z'],
              ['Method',   'Guided interview'],
              ['Device',   'iPhone · iOS 26.2'],
              ['Content',  'SHA-256 a8f3c24d…9b1e'],
              ['Edits',    'None'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 4 ? 6 : 0, borderBottom: i < 4 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <span className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 500 }}>{k}</span>
                <span className="fb-mono" style={{ fontSize: 10.5, color: T.ink }}>{v}</span>
              </div>
            ))}
          </div>
        </SoftCard>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          <PillButton tone="soft" size="md" icon={I.scales}>Add to filing</PillButton>
          <PillButton tone="soft" size="md" icon={I.chat}>Ask advisor</PillButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CapWho, CapTimes, CapMood, CapWhereWho, CapAttach, CapReview, MobileJournalDetail });
