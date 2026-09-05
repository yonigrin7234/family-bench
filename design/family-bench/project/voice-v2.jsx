// Voice capture — modernized to match the v2 Claude-soft vocabulary.
// Light paper, sans display, soft pill record button, evidence cards that match Evidence v2.

function VoiceRecordV2() {
  const T = window.FB;
  const [bars] = React.useState(() => Array.from({ length: 42 }, () => 0.25 + Math.random() * 0.75));
  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>

      {/* Top bar with cancel + recording pulse */}
      <div style={{ padding: '60px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 16, background: '#FFFFFF',
          border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: T.ox, opacity: 0.25 }}/>
            <div style={{ position: 'absolute', inset: 2, borderRadius: 2, background: T.ox }}/>
          </div>
          <span className="fb-sans" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Recording</span>
        </div>
        <div className="fb-mono fb-tnum" style={{ fontSize: 12, color: T.inkMute }}>00:37</div>
      </div>

      {/* Kicker + serif-italic prompt (the one soft serif moment allowed) */}
      <div style={{ padding: '48px 28px 0' }}>
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          Urgent capture
        </div>
        <div className="fb-sans fb-tight" style={{ fontSize: 30, fontWeight: 600, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
          Just tell me what happened.
        </div>
        <div className="fb-serif" style={{ fontSize: 15, color: T.inkMute, fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
          You don't need to be polished. I'll structure it, flag what's relevant, and seal the metadata.
        </div>
      </div>

      {/* Waveform */}
      <div style={{ padding: '32px 28px 0', display: 'flex', alignItems: 'center', gap: 3, height: 64 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            flex: 1, height: `${h * 100}%`, background: i < 24 ? T.ink : T.inkFaint,
            borderRadius: 1.5, opacity: i < 24 ? 1 : 0.5,
          }}/>
        ))}
      </div>
      <div style={{ padding: '8px 28px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span className="fb-mono" style={{ fontSize: 10, color: T.inkMute, letterSpacing: '0.08em' }}>PCM · 48 kHz</span>
        <span className="fb-mono" style={{ fontSize: 10, color: T.inkMute, letterSpacing: '0.08em' }}>SHA-256 · LIVE</span>
      </div>

      {/* Live transcript card */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14,
          padding: '16px 18px',
        }}>
          <div className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Live transcript
          </div>
          <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.55 }}>
            So David was forty-five minutes late again today for the three o'clock drop-off, and when Leonie got out of the car she told me, "Mommy, Daddy said I have to keep my things at his house"<span style={{ color: T.ox }}>│</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ flex: 1 }}/>
      <div style={{ padding: '20px 24px 110px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 22, background: '#FFFFFF',
          border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </div>
        <div style={{
          width: 76, height: 76, borderRadius: 38, background: T.ox,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 20px ${T.ox}40`,
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: '#FFFFFF' }}/>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 22, background: '#FFFFFF',
          border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function VoiceRevealV2() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>

      {/* Top bar */}
      <div style={{ padding: '60px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 16, background: '#FFFFFF',
          border: `0.5px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </div>
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Review & confirm
        </div>
        <div style={{ width: 32 }}/>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 110px' }}>
        {/* Raw transcript */}
        <div style={{
          background: T.paperDeep, borderRadius: 12, padding: '14px 16px', marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="fb-sans" style={{ fontSize: 9.5, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Raw transcript
            </div>
            <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute }}>00:47</div>
          </div>
          <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, fontStyle: 'italic' }}>
            "So David was forty-five minutes late again today for the three o'clock drop-off, and when Leonie got out of the car she told me, Mommy, Daddy said I have to keep my things at his house, she was crying, um, and this is the third time this month…"
          </div>
        </div>

        {/* Structured header */}
        <div className="fb-sans" style={{ fontSize: 10.5, color: T.ox, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Structured · 2 linked entries
        </div>

        {/* Entry 1 — Pickup/Dropoff */}
        <div style={{
          background: '#FFFFFF', border: `0.5px solid ${T.rule}`, borderRadius: 14,
          padding: '16px 18px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: T.paperDeep,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.mono, fontSize: 9, fontWeight: 600, color: T.ink, letterSpacing: '0.08em',
            }}>EX</div>
            <div className="fb-sans" style={{ fontSize: 15, fontWeight: 600, color: T.ink, flex: 1, letterSpacing: '-0.01em' }}>
              Pickup / Dropoff
            </div>
            <div style={{
              padding: '2px 8px', borderRadius: 999, background: T.forestWash,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.forest} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <span className="fb-sans" style={{ fontSize: 10, color: T.forest, fontWeight: 600 }}>97%</span>
            </div>
          </div>

          <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginBottom: 14 }}>
            #00418 · APR 21 · 3:45 PM
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Scheduled</div>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>3:00 PM</div>
            </div>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Actual</div>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>3:45 PM</div>
            </div>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Late</div>
              <div className="fb-sans" style={{ fontSize: 13, color: T.ox, fontWeight: 600 }}>+45 min</div>
            </div>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
              <div className="fb-mono" style={{ fontSize: 11.5, color: T.ink }}>37.810° GPS</div>
            </div>
          </div>

          <div style={{ height: 0.5, background: T.ruleSoft, marginBottom: 12 }}/>
          <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Factual rewrite
          </div>
          <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, marginBottom: 12 }}>
            Respondent arrived at the 3:00 PM drop-off location at 3:45 PM, 45 minutes after the scheduled transfer time. Leonie was returned to Petitioner's custody without incident.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, background: T.oxWash, color: T.oxDeep, fontSize: 10.5, fontWeight: 500 }}>3rd late in 30 d</span>
            <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, background: T.paperDeep, color: T.ink, fontSize: 10.5, fontWeight: 500 }}>FC § 3048</span>
          </div>
        </div>

        {/* Entry 2 — Child statement */}
        <div style={{
          background: '#FFFFFF', border: `0.5px solid ${T.ox}33`, borderRadius: 14,
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: T.oxWash,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.mono, fontSize: 9, fontWeight: 600, color: T.oxDeep, letterSpacing: '0.08em',
            }}>ST</div>
            <div className="fb-sans" style={{ fontSize: 15, fontWeight: 600, color: T.ink, flex: 1, letterSpacing: '-0.01em' }}>
              Child statement
            </div>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: T.oxWash, color: T.oxDeep, fontSize: 10, fontWeight: 600 }}>EC § 1240</span>
          </div>
          <div className="fb-mono" style={{ fontSize: 10, color: T.inkMute, marginBottom: 14 }}>
            #00419 · linked to #00418
          </div>

          <div className="fb-serif" style={{
            fontSize: 17, color: T.ink, lineHeight: 1.4, fontStyle: 'italic', letterSpacing: '-0.01em',
            padding: '10px 14px', borderLeft: `2px solid ${T.ox}`, marginBottom: 14,
          }}>
            "Mommy, Daddy said I have to keep my things at his house."
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Emotional state</div>
              <div className="fb-sans" style={{ fontSize: 12.5, color: T.ink, fontWeight: 500 }}>Distressed · crying</div>
            </div>
            <div>
              <div className="fb-sans" style={{ fontSize: 9, color: T.inkMute, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Spontaneous?</div>
              <div className="fb-sans" style={{ fontSize: 12.5, color: T.forest, fontWeight: 500 }}>Yes · unprompted</div>
            </div>
          </div>

          <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, lineHeight: 1.5 }}>
            Classified as a spontaneous statement by the child made under the stress of a startling event — admissible under Evidence Code § 1240.
          </div>
        </div>

        {/* Primary action */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '13px 16px', borderRadius: 999, background: '#FFFFFF', border: `0.5px solid ${T.rule}`, textAlign: 'center' }}>
            <span className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>Edit</span>
          </div>
          <div style={{ flex: 2, padding: '13px 16px', borderRadius: 999, background: T.ink, textAlign: 'center' }}>
            <span className="fb-sans" style={{ fontSize: 13, color: T.paper, fontWeight: 500 }}>Seal &amp; save · 2 entries</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VoiceRecordV2, VoiceRevealV2 });
