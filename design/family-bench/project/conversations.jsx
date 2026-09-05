// Family Bench — Conversations (Advisor thread history)
// Claude-style list of past Advisor conversations, grouped by time.
// Each thread can be scoped to a legal issue, produce filings, and be revisited.

// Sample conversation data — each represents a real legal strategy thread
const CONVOS = [
  // Today
  { id: 'c01', title: "How should I respond to the Apr 16 RFO?", topic: 'Response', scope: 'Opposing RFO-04', last: "You: 'So if I file a written response vs appearing only…'", when: '2:14 PM', t: 'today', active: true, msgs: 23, pinned: true },
  { id: 'c02', title: "Reading the custody evaluation (pg 14–22)", topic: 'Evaluation', scope: 'Dr. Williams report', last: 'Bench: The evaluator\'s framing on § III is favorable…', when: '11:02 AM', t: 'today', msgs: 8 },

  // This week
  { id: 'c03', title: "Which motion: modification or contempt?", topic: 'Strategy', scope: 'Custody modification', last: 'Bench recommends Modification (RFO-05) based on your pattern…', when: 'Yesterday', t: 'week', msgs: 47, producedFiling: 'RFO-05', pinned: true },
  { id: 'c04', title: "Makeup time — how much is reasonable to ask for?", topic: 'Remedy', scope: 'Custody modification', last: 'Based on 3 denied weekends, asking for 4 replacement days is…', when: '2 d ago', t: 'week', msgs: 14 },
  { id: 'c05', title: "Is a § 4(c) curbside violation enforceable?", topic: 'Interpretation', scope: 'June 2024 order', last: 'The "15-min grace" language means courts usually won\'t…', when: '3 d ago', t: 'week', msgs: 11 },
  { id: 'c06', title: "Prepping the Apr 25 meet-and-confer", topic: 'Negotiation', scope: 'Opposing counsel', last: 'Opening offer: propose the schedule tweak but hold back on…', when: '4 d ago', t: 'week', msgs: 19 },

  // Earlier this month
  { id: 'c07', title: "Do I need to disclose the nanny cam?", topic: 'Evidence', scope: 'Ring + Nest footage', last: 'California two-party consent only applies to audio…', when: 'Apr 12', t: 'month', msgs: 9 },
  { id: 'c08', title: "What does 'best interests' actually mean?", topic: 'Research', scope: 'CA Fam Code § 3011', last: 'The seven factors under § 3011 are…', when: 'Apr 8', t: 'month', msgs: 22 },
  { id: 'c09', title: "Attorney fee request — when does it work?", topic: 'Strategy', scope: 'RFO-05 attached', last: 'Fees under § 2030 require a needs-and-ability showing…', when: 'Apr 5', t: 'month', msgs: 6 },

  // Older
  { id: 'c10', title: "Reviewing the contempt denial (minute order)", topic: 'Post-ruling', scope: 'Jan 2, 2026', last: 'Judge Tanaka\'s finding of "no willfulness" narrows…', when: 'Mar 18', t: 'earlier', msgs: 12 },
  { id: 'c11', title: "Setting up OFW import + tone-analysis", topic: 'Setup', scope: 'OurFamilyWizard', last: 'ToneMeter flags 3 threads where the language shifted…', when: 'Feb 22', t: 'earlier', msgs: 5 },
  { id: 'c12', title: "First thread — explaining my situation", topic: 'Intake', scope: 'Case opened', last: 'I\'m sorry you\'re dealing with this. Let\'s start by…', when: 'Feb 8', t: 'earlier', msgs: 34, first: true },
];

// Topic color map
function topicColor(topic) {
  const T = window.FB;
  const map = {
    Strategy: T.ox, Response: T.ox, Remedy: T.ox,
    Evidence: T.forest, Setup: T.forest, Research: T.forest,
    Evaluation: T.inkSoft, Interpretation: T.inkSoft, 'Post-ruling': T.inkSoft,
    Negotiation: '#8A6B2F', Intake: T.inkMute,
  };
  return map[topic] || T.inkMute;
}

// ─── Desktop: conversations page · sidebar + detail ───────────────
function DesktopConversations() {
  const T = window.FB;
  const active = CONVOS.find(c => c.active);
  const byGroup = {
    today: CONVOS.filter(c => c.t === 'today'),
    week: CONVOS.filter(c => c.t === 'week'),
    month: CONVOS.filter(c => c.t === 'month'),
    earlier: CONVOS.filter(c => c.t === 'earlier'),
  };

  return (
    <DesktopShell active="advisor">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', minHeight: 840 }}>
        {/* Left: conversation list */}
        <div style={{ borderRight: `0.5px solid ${T.rule}`, display: 'flex', flexDirection: 'column', background: T.paperDeep + '40' }}>
          <div style={{ padding: '22px 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="fb-sans fb-tight" style={{ fontSize: 18, color: T.ink, fontWeight: 600, letterSpacing: '-0.015em' }}>Conversations</div>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: T.ink, border: 'none', color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon d={I.plus} size={13} stroke={T.paper} sw={2}/>
              </button>
            </div>
            {/* Search */}
            <div style={{ padding: '8px 10px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 9, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Icon d={I.search} size={13} stroke={T.inkMute} sw={1.8}/>
              <span className="fb-sans" style={{ fontSize: 12, color: T.inkMute }}>Search 12 conversations</span>
            </div>

            {/* Filter chips */}
            <div style={{ marginTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['All', 'Pinned', 'Produced filings', 'Strategy', 'Evidence'].map((f, i) => (
                <span key={i} className="fb-sans" style={{
                  fontSize: 10.5, padding: '4px 8px', borderRadius: 6, fontWeight: 500,
                  background: i === 0 ? T.ink : '#FFFFFF',
                  color: i === 0 ? T.paper : T.inkSoft,
                  border: `0.5px solid ${i === 0 ? T.ink : T.rule}`,
                }}>{f}</span>
              ))}
            </div>
          </div>

          <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 20px' }}>
            {/* Pinned */}
            <GroupLabel>Pinned</GroupLabel>
            {CONVOS.filter(c => c.pinned).map(c => <ConvoRow key={c.id} c={c} pinned/>)}

            <GroupLabel>Today</GroupLabel>
            {byGroup.today.map(c => <ConvoRow key={c.id} c={c}/>)}

            <GroupLabel>This week</GroupLabel>
            {byGroup.week.map(c => <ConvoRow key={c.id} c={c}/>)}

            <GroupLabel>Earlier this month</GroupLabel>
            {byGroup.month.map(c => <ConvoRow key={c.id} c={c}/>)}

            <GroupLabel>Older</GroupLabel>
            {byGroup.earlier.map(c => <ConvoRow key={c.id} c={c}/>)}
          </div>
        </div>

        {/* Right: active conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', background: T.paper, minHeight: 840 }}>
          {/* Thread header */}
          <div style={{ padding: '22px 36px 16px', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span className="fb-sans" style={{ fontSize: 10, color: topicColor(active.topic), fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{active.topic}</span>
                <span style={{ width: 3, height: 3, borderRadius: 2, background: T.inkFaint }}/>
                <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>Scope: {active.scope}</span>
                <span style={{ width: 3, height: 3, borderRadius: 2, background: T.inkFaint }}/>
                <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>{active.msgs} messages</span>
              </div>
              <div className="fb-serif fb-tight" style={{ fontSize: 26, color: T.ink, fontWeight: 500, letterSpacing: '-0.025em' }}>{active.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <PillButton tone="ghost" size="sm">Pin</PillButton>
              <PillButton tone="ghost" size="sm">Rename</PillButton>
              <PillButton tone="ghost" size="sm">Archive</PillButton>
              <PillButton tone="ghost" size="sm">Export</PillButton>
            </div>
          </div>

          {/* Context strip */}
          <div style={{ padding: '12px 36px', background: T.paperDeep + '50', borderBottom: `0.5px solid ${T.rule}`, display: 'flex', gap: 18, alignItems: 'center' }}>
            <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bench is referencing</span>
            {[
              { t: 'Opposing RFO-04', tag: 'file' },
              { t: 'Pattern P-03', tag: 'pattern' },
              { t: 'June 2024 order · § 6', tag: 'order' },
              { t: '3 OFW threads', tag: 'msgs' },
            ].map((ref, i) => (
              <div key={i} style={{ padding: '4px 10px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 5, height: 5, borderRadius: 3, background: T.ox }}/>
                <span className="fb-sans" style={{ fontSize: 11, color: T.ink, fontWeight: 500 }}>{ref.t}</span>
              </div>
            ))}
          </div>

          {/* Thread body */}
          <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 120px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {/* user message */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: T.ink, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }} className="fb-sans">S</div>
                  <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Sarah</span>
                  <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>2:02 PM</span>
                </div>
                <div className="fb-serif" style={{ fontSize: 15, color: T.ink, lineHeight: 1.6, letterSpacing: '-0.005em' }}>
                  The opposing RFO came in yesterday. He's claiming my OFW messages are "denigrating" and wants communication counseling. I read the 3 threads he flagged and I genuinely don't think they are. How do I respond? Do I write a declaration or just show up?
                </div>
              </div>

              {/* bench message */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: T.ox, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }} className="fb-sans">B</div>
                  <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Bench</span>
                  <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>2:02 PM</span>
                </div>
                <div className="fb-serif" style={{ fontSize: 15, color: T.ink, lineHeight: 1.65, letterSpacing: '-0.005em' }}>
                  <p style={{ margin: 0 }}>You should file a written response. Three reasons:</p>
                  <ol style={{ paddingLeft: 18, margin: '12px 0' }}>
                    <li style={{ marginBottom: 6 }}>A written declaration creates the record you want the court to see. Showing up alone leaves the judge with only his framing.</li>
                    <li style={{ marginBottom: 6 }}>His claim is relatively narrow ("denigrating comms") and has no monetary ask. That means you can respond narrowly too — you don't need to re-litigate the whole case.</li>
                    <li>I reviewed the three threads he flagged. In all three, you were reporting facts (a missed pickup, a medication question, a school note) in neutral language. I can help you quote the actual text in your declaration to let it speak for itself.</li>
                  </ol>
                  <p style={{ margin: '12px 0' }}>Your response is due <strong style={{ color: T.ox }}>Apr 30 · 9 days</strong>. The declaration should be 2-3 pages. Want me to draft an outline?</p>
                </div>

                {/* Inline suggestion card */}
                <div style={{ marginTop: 14, padding: '14px 16px', background: T.oxWash + '40', border: `0.5px solid ${T.ox}30`, borderRadius: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Icon d={I.spark} size={16} stroke={T.ox} sw={1.8}/>
                  <div style={{ flex: 1 }}>
                    <div className="fb-sans" style={{ fontSize: 12, color: T.ox, fontWeight: 600 }}>I can draft this</div>
                    <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>Declaration in response to RFO-04, quoting the three OFW threads verbatim</div>
                  </div>
                  <PillButton tone="primary" size="sm">Start draft</PillButton>
                </div>
              </div>

              {/* user */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: T.ink, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }} className="fb-sans">S</div>
                  <span className="fb-sans" style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Sarah</span>
                  <span className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>2:08 PM</span>
                </div>
                <div className="fb-serif" style={{ fontSize: 15, color: T.ink, lineHeight: 1.6, letterSpacing: '-0.005em' }}>
                  So if I file a written response vs appearing only — does he get to reply again before the hearing?
                </div>
              </div>

              {/* typing indicator */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: T.ox, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }} className="fb-sans">B</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: T.inkMute, opacity: 0.5, animation: `blink 1.4s infinite ${i * 0.2}s` }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '16px 36px 24px', borderTop: `0.5px solid ${T.rule}` }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <div style={{ padding: '12px 14px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14, boxShadow: `0 1px 3px ${T.ink}08` }}>
                <div className="fb-sans" style={{ fontSize: 14, color: T.inkMute, marginBottom: 30 }}>Ask Bench anything about this case…</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <PillButton tone="ghost" size="sm" icon={I.plus}>Attach</PillButton>
                  <PillButton tone="ghost" size="sm" icon={I.mic}>Voice</PillButton>
                  <div style={{ flex: 1 }}/>
                  <PillButton tone="primary" size="sm">Send</PillButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
      `}</style>
    </DesktopShell>
  );
}

function GroupLabel({ children }) {
  const T = window.FB;
  return (
    <div className="fb-sans" style={{ fontSize: 10, color: T.inkMute, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 6px 6px' }}>{children}</div>
  );
}

function ConvoRow({ c, pinned }) {
  const T = window.FB;
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10, marginBottom: 2, cursor: 'pointer',
      background: c.active ? '#FFFFFF' : 'transparent',
      border: `0.5px solid ${c.active ? T.rule : 'transparent'}`,
      boxShadow: c.active ? `0 1px 3px ${T.ink}10` : 'none',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        <div style={{ width: 5, height: 5, borderRadius: 3, background: topicColor(c.topic), flexShrink: 0 }}/>
        <span className="fb-sans" style={{ fontSize: 9.5, color: topicColor(c.topic), fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.topic}</span>
        {pinned && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2 }}>
            <path d="M12 2l2 6h6l-4 3 2 6-6-4-6 4 2-6-4-3h6z" fill={T.ox}/>
          </svg>
        )}
        <div style={{ flex: 1 }}/>
        <span className="fb-sans" style={{ fontSize: 10, color: T.inkMute }}>{c.when}</span>
      </div>
      <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{c.title}</div>
      <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last}</div>
      {c.producedFiling && (
        <div style={{ marginTop: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: T.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5"/></svg>
          </div>
          <span className="fb-sans" style={{ fontSize: 10, color: T.forest, fontWeight: 600 }}>Produced: {c.producedFiling}</span>
        </div>
      )}
    </div>
  );
}

// ─── Mobile: conversation list ────────────────────────────────────
function ConvosMobile() {
  const T = window.FB;

  const Row = ({ c }) => (
    <div style={{
      padding: '14px 20px', borderBottom: `0.5px solid ${T.ruleSoft}`,
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <div style={{ width: 5, height: 5, borderRadius: 3, background: topicColor(c.topic), flexShrink: 0 }}/>
        <span className="fb-sans" style={{ fontSize: 9.5, color: topicColor(c.topic), fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.topic}</span>
        {c.pinned && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2 }}>
            <path d="M12 2l2 6h6l-4 3 2 6-6-4-6 4 2-6-4-3h6z" fill={T.ox}/>
          </svg>
        )}
        <div style={{ flex: 1 }}/>
        <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute }}>{c.when}</span>
      </div>
      <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, fontWeight: 600, lineHeight: 1.3 }}>{c.title}</div>
      <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <span className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute }}>{c.msgs} messages</span>
        {c.producedFiling && (
          <>
            <span style={{ width: 2, height: 2, borderRadius: 1, background: T.inkFaint }}/>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 11, height: 11, borderRadius: 3, background: T.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5"/></svg>
              </div>
              <span className="fb-sans" style={{ fontSize: 10.5, color: T.forest, fontWeight: 600 }}>{c.producedFiling}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', background: T.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FBStatusBar/>
      <div style={{ padding: '56px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${T.rule}` }}>
        <div style={{ flex: 1 }}>
          <div className="fb-sans fb-tight" style={{ fontSize: 20, color: T.ink, fontWeight: 600, letterSpacing: '-0.02em' }}>Conversations</div>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>12 threads · 2 pinned</div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.plus} size={14} stroke={T.paper} sw={2}/>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ padding: '10px 12px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon d={I.search} size={14} stroke={T.inkMute} sw={1.8}/>
          <span className="fb-sans" style={{ fontSize: 13, color: T.inkMute }}>Search conversations</span>
        </div>

        {/* Filter chips */}
        <div style={{ marginTop: 10, display: 'flex', gap: 5, overflowX: 'auto' }}>
          {['All', 'Pinned', 'Strategy', 'Evidence', 'Research', 'With filings'].map((f, i) => (
            <span key={i} className="fb-sans" style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 7, fontWeight: 500,
              background: i === 0 ? T.ink : '#FFFFFF',
              color: i === 0 ? T.paper : T.inkSoft,
              border: `0.5px solid ${i === 0 ? T.ink : T.rule}`,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{f}</span>
          ))}
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        <GroupLabel>Pinned</GroupLabel>
        {CONVOS.filter(c => c.pinned).map(c => <Row key={c.id} c={c}/>)}

        <GroupLabel>Today</GroupLabel>
        {CONVOS.filter(c => c.t === 'today').map(c => <Row key={c.id} c={c}/>)}

        <GroupLabel>This week</GroupLabel>
        {CONVOS.filter(c => c.t === 'week').map(c => <Row key={c.id} c={c}/>)}

        <GroupLabel>Earlier this month</GroupLabel>
        {CONVOS.filter(c => c.t === 'month').map(c => <Row key={c.id} c={c}/>)}

        <GroupLabel>Older</GroupLabel>
        {CONVOS.filter(c => c.t === 'earlier').map(c => <Row key={c.id} c={c}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { DesktopConversations, ConvosMobile });
