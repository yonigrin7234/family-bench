// Family Bench — mobile screens (iOS device, 402×874)
// Reuses FB tokens + primitives. Every screen is a full device.

const { useState: mUseState } = React;

// ─── Reusable mobile chrome ───────────────────────────
function FBStatusBar() {
  const T = window.FB;
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px 0', color: T.ink, fontFamily: T.sans, fontWeight: 600, fontSize: 15,
    }}>
      <span className="fb-tnum">9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="10" viewBox="0 0 16 10"><path d="M0 7.5h3v2.5H0zM4.5 5h3v5h-3zM9 2.5h3V10H9zM13.5 0h3v10h-3z" fill={T.ink}/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke={T.ink} strokeWidth="1.2"><path d="M1 4c1.8-2 4.2-3 6-3s4.2 1 6 3M3 6c1.2-1 2.8-1.6 4-1.6S9.8 5 11 6"/><circle cx="7" cy="8.5" r="1" fill={T.ink}/></svg>
        <div style={{ width: 22, height: 10, border: `1px solid ${T.ink}`, borderRadius: 2, padding: 1.5, display: 'flex' }}>
          <div style={{ flex: 1, background: T.ink, borderRadius: 0.5 }}/>
        </div>
      </div>
    </div>
  );
}

function FBTabBar({ active = 'home' }) {
  const T = window.FB;
  const tabs = [
    { id: 'home', label: 'Home', d: I.home },
    { id: 'evidence', label: 'Evidence', d: I.folder },
    { id: 'capture', label: '', d: I.plus, big: true },
    { id: 'filings', label: 'Filings', d: I.scales },
    { id: 'advisor', label: 'Advisor', d: I.chat },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
      background: '#FFFFFF', borderTop: `0.5px solid ${T.rule}`,
      paddingBottom: 28, paddingTop: 10, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          color: t.id === active ? T.ink : T.inkMute, position: 'relative',
        }}>
          {t.big ? (
            <div style={{ width: 48, height: 48, background: T.ink, color: T.paper, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -16, boxShadow: `0 4px 12px ${T.ink}40` }}>
              <Icon d={I.mic} size={22} stroke={T.paper} sw={1.8}/>
            </div>
          ) : (
            <>
              <Icon d={t.d} size={20} stroke={t.id === active ? T.ink : T.inkMute} sw={1.5}/>
              <div className="fb-sans" style={{ fontSize: 10, fontWeight: t.id === active ? 600 : 500, letterSpacing: '0.02em' }}>{t.label}</div>
              {t.id === active && <div style={{ position: 'absolute', top: -10, width: 18, height: 2, background: T.ox }}/>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 1) Home — case overview ──────────────────────────
function MobileHome() {
  const T = window.FB;
  const C = window.FB_CASE;
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', paddingTop: 56, paddingBottom: 100 }}>
        {/* Letterhead */}
        <div style={{ padding: '8px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Label>Good morning, Sarah</Label>
              <Display size={28} style={{ marginTop: 6 }}>In re: Marriage<br/>of Chen</Display>
              <Mono size={10} dim style={{ marginTop: 6, display: 'block' }}>No. {C.caseNo} · {C.dept}</Mono>
            </div>
            <Seal size={44} label="FB"/>
          </div>
        </div>
        <Rule color={T.ink} style={{ margin: '0 24px', height: 2 }}/>
        <Rule style={{ margin: '3px 24px' }}/>

        {/* Hearing countdown — the thing that matters most */}
        <div style={{ padding: '22px 24px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label color={T.ox}>Next Hearing</Label>
            <Mono size={10} dim>{C.hearing.date.toUpperCase()}</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
            <Display size={72} weight={500} style={{ color: T.ox, lineHeight: 0.9, letterSpacing: '-0.04em' }}>14</Display>
            <div style={{ paddingBottom: 8 }}>
              <div className="fb-sans" style={{ fontSize: 17, color: T.ink }}>days to serve</div>
              <Mono size={10} dim>RFO · Custody Modification</Mono>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <Chip tone="ox">○ Forms 3 of 4</Chip>
            <Chip tone="forest">✓ Evidence ready</Chip>
          </div>
        </div>

        {/* Custody split glance */}
        <div style={{ padding: '18px 24px' }}>
          <Rule style={{ marginBottom: 14 }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Label>Custody · Last 90 Days</Label>
            <Mono size={10} dim>Leonie, 7</Mono>
          </div>
          <BarCompare scheduled={50} actual={38} w={230}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="fb-sans" style={{ fontSize: 13, color: T.ox }}>Shortfall · 12 overnights</span>
            <Mono size={10} dim>→ detail</Mono>
          </div>
        </div>

        {/* Needs attention */}
        <div style={{ padding: '6px 24px 20px' }}>
          <Rule style={{ marginBottom: 14 }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label color={T.ox}>Needs Attention</Label>
            <Mono size={10} dim>3</Mono>
          </div>
          {[
            { s: 'high', t: 'Pattern detected', b: '3rd denied visit in 30 days', c: 'FC § 3048' },
            { s: 'med',  t: 'Missing evidence', b: 'Income & Expense Decl. not yet filed', c: 'FL-150' },
            { s: 'med',  t: 'Discrepancy',       b: 'His declared income vs. documented spend', c: 'cross-ref' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: i < 2 ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
              <FlagDot sev={r.s}/>
              <div style={{ flex: 1 }}>
                <div className="fb-sans" style={{ fontSize: 15, color: T.ink, fontWeight: 500 }}>{r.t}</div>
                <div className="fb-sans" style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{r.b}</div>
                <Mono size={9} dim style={{ marginTop: 3, display: 'block' }}>{r.c.toUpperCase()}</Mono>
              </div>
              <Icon d={I.chevR} size={14} stroke={T.inkFaint}/>
            </div>
          ))}
        </div>

        {/* Recent entries */}
        <div style={{ padding: '4px 24px 20px' }}>
          <Rule style={{ marginBottom: 14 }}/>
          <Label>Recent · 5 entries today</Label>
          <div style={{ marginTop: 12 }}>
            {[
              { t: 'denied', ts: '08:04', title: 'Denied weekend exchange', body: 'D. failed to appear at 5:00 PM drop-off. 48 hr lost.', flag: 'high' },
              { t: 'statement', ts: 'Yesterday', title: '"Mommy, why does Daddy say we can\'t come home?"', body: 'Verbatim · EC § 1240 candidate', flag: 'med' },
              { t: 'comm', ts: 'Yesterday', title: 'OFW · 4 messages', body: 'Avg response 18h · 1 hostile flagged', flag: 'low' },
              { t: 'expense', ts: 'Apr 18', title: 'Dental · Leonie', body: '$240 · unreimbursed', flag: null },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `0.5px solid ${T.ruleSoft}` : 'none' }}>
                <EntryMark type={e.t} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>{e.title}</div>
                    <Mono size={9} dim>{e.ts}</Mono>
                  </div>
                  <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>{e.body}</div>
                </div>
                {e.flag && <FlagDot sev={e.flag}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <FBTabBar active="home"/>
    </div>
  );
}

// ─── 2) Voice capture — recording state ───────────────
function MobileVoiceRecord() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: '#1A2431', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', color: T.paper }}>
      <div style={{ padding: '58px 24px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="fb-mono fb-tnum" style={{ fontSize: 15, color: T.paper }}>9:41</span>
        <span className="fb-mono fb-smallcaps" style={{ fontSize: 10, color: T.sand, letterSpacing: '0.18em' }}>● RECORDING</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 36px' }}>
        <Label color={T.sand}>Capture</Label>
        <Display size={30} style={{ color: T.paper, marginTop: 8 }}>"Tell me what<br/>just happened."</Display>
        <div className="fb-sans" style={{ fontSize: 15, color: 'rgba(246,242,234,0.5)', marginTop: 12, lineHeight: 1.5 }}>
          Speak naturally. I'll structure the entry, flag anything relevant, and log forensic metadata.
        </div>

        {/* waveform */}
        <div style={{ marginTop: 40, height: 72, display: 'flex', alignItems: 'center', gap: 3 }}>
          {Array.from({ length: 52 }).map((_, i) => {
            const h = 8 + Math.abs(Math.sin(i * 0.6 + Math.cos(i))) * 58;
            const active = i < 38;
            return <div key={i} style={{ flex: 1, height: h, background: active ? T.sand : 'rgba(201,184,146,0.18)', borderRadius: 1 }}/>;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <Mono size={11} style={{ color: T.sand }}>00:37</Mono>
          <Mono size={11} style={{ color: 'rgba(246,242,234,0.4)' }}>PCM 48KHZ · SHA-256 LIVE</Mono>
        </div>

        {/* live transcript preview */}
        <div style={{ marginTop: 36, padding: '14px 0', borderTop: `0.5px solid rgba(201,184,146,0.2)`, borderBottom: `0.5px solid rgba(201,184,146,0.2)` }}>
          <Label color={T.sand}>Live transcript</Label>
          <div className="fb-sans" style={{ fontSize: 15, color: T.paper, marginTop: 8, lineHeight: 1.5 }}>
            So David was forty-five minutes late again today for the three o'clock drop-off, and when Leonie got out of the car she told me, "Mommy, Daddy said I have to keep my things at his house"—<span style={{ color: T.sand }}>|</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '0 32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, border: `0.5px solid rgba(246,242,234,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.x} size={20} stroke={T.paper} sw={1.6}/>
        </div>
        <div style={{ width: 88, height: 88, borderRadius: 44, background: T.ox, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 6px rgba(139,58,46,0.25), 0 0 0 14px rgba(139,58,46,0.12)` }}>
          <div style={{ width: 28, height: 28, background: T.paper, borderRadius: 4 }}/>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 28, border: `0.5px solid rgba(246,242,234,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={I.paperclip} size={20} stroke={T.paper} sw={1.6}/>
        </div>
      </div>
    </div>
  );
}

// ─── 3) Voice → Entry reveal (HERO) ───────────────────
function MobileVoiceReveal() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      {/* Header */}
      <div style={{ padding: '58px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon d={I.x} size={22} stroke={T.ink}/>
        <Label>Review & Confirm</Label>
        <div style={{ width: 22 }}/>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px' }}>
        {/* Raw transcript — muted above */}
        <div style={{ background: T.paperDeep, padding: '12px 14px', borderLeft: `2px solid ${T.sand}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Label>Raw transcript · 00:47</Label>
            <Icon d={I.wave} size={14} stroke={T.sandDeep}/>
          </div>
          <div className="fb-sans" style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>
            "So David was forty-five minutes late again today for the three o'clock drop-off, and when Leonie got out of the car she told me, <span style={{ background: T.sandWash, fontStyle: 'normal' }}>Mommy, Daddy said I have to keep my things at his house</span>, she was crying, um, and this is the third time this month…"
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
          <Icon d={I.sparkle} size={14} stroke={T.ox} sw={1.8}/>
          <Label color={T.ox}>Structured as · 2 linked entries</Label>
        </div>

        {/* Entry 1 — Pickup/Dropoff */}
        <div style={{ background: '#FFFFFF', border: `0.5px solid ${T.ink}`, borderTop: `2px solid ${T.ink}`, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <EntryMark type="exchange" size={28}/>
              <div>
                <div className="fb-sans" style={{ fontSize: 17, color: T.ink, fontWeight: 500 }}>Pickup / Dropoff</div>
                <Mono size={9} dim>ENTRY #00418 · APR 21, 15:45</Mono>
              </div>
            </div>
            <Stamp tone="sand">AI · 97%</Stamp>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {[
              ['Scheduled', '3:00 PM'],
              ['Actual', '3:45 PM'],
              ['Late minutes', <span style={{ color: T.ox }}>+ 45 min</span>],
              ['Transfer method', 'Curbside'],
              ['Custody period', 'Transition'],
              ['Location', <span className="fb-mono" style={{ fontSize: 11 }}>37.810° GPS</span>],
            ].map(([k, v], i) => (
              <div key={i}>
                <Label style={{ fontSize: 9 }}>{k}</Label>
                <div className="fb-sans" style={{ fontSize: 14, color: T.ink, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          <Rule style={{ margin: '12px 0' }}/>
          <Label style={{ fontSize: 9 }}>Body · factual rewrite</Label>
          <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, marginTop: 4, lineHeight: 1.55 }}>
            Respondent arrived at the 3:00 PM drop-off location at 3:45 PM, 45 minutes after the scheduled transfer time. Leonie was returned to Petitioner's custody without incident.
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <Chip tone="ox">3rd late in 30 d</Chip>
            <Chip tone="sand">FC § 3048 flag</Chip>
          </div>
        </div>

        {/* Entry 2 — Child Statement */}
        <div style={{ background: '#FFFFFF', border: `0.5px solid ${T.ox}`, borderTop: `2px solid ${T.ox}`, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <EntryMark type="statement" size={28}/>
              <div>
                <div className="fb-sans" style={{ fontSize: 17, color: T.ink, fontWeight: 500 }}>Child Statement</div>
                <Mono size={9} dim>ENTRY #00419 · LINKED TO #00418</Mono>
              </div>
            </div>
            <Stamp tone="ox">EC § 1240</Stamp>
          </div>

          <Label style={{ fontSize: 9 }}>Verbatim quote</Label>
          <div className="fb-sans" style={{ fontSize: 17, color: T.ink, marginTop: 6, lineHeight: 1.45, padding: '0 4px', borderLeft: `2px solid ${T.ox}`, paddingLeft: 10 }}>
            "Mommy, Daddy said I have to keep my things at his house."
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 12 }}>
            <div><Label style={{ fontSize: 9 }}>Emotional state</Label><div className="fb-sans" style={{ fontSize: 14, color: T.ink, marginTop: 2 }}>Distressed (crying)</div></div>
            <div><Label style={{ fontSize: 9 }}>Spontaneous?</Label><div className="fb-sans" style={{ fontSize: 14, color: T.ink, marginTop: 2 }}>Yes · unprompted</div></div>
          </div>

          <Rule style={{ margin: '12px 0' }}/>
          <div className="fb-sans" style={{ fontSize: 11, color: T.inkMute }}>
            Classified as a spontaneous statement by the child made under the stress of a startling event — admissible under Evidence Code § 1240.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', border: `0.5px solid ${T.ink}`, color: T.ink, fontFamily: T.sans, fontSize: 13, fontWeight: 500 }}>Edit fields</div>
          <div style={{ flex: 1.4, padding: '14px 0', textAlign: 'center', background: T.ink, color: T.paper, fontFamily: T.sans, fontSize: 13, fontWeight: 600 }}>Save 2 entries</div>
        </div>
        <div className="fb-sans" style={{ fontSize: 10, color: T.inkFaint, textAlign: 'center', marginTop: 10 }}>
          AI provides legal information, not advice. Subject to UPL disclosure.
        </div>
      </div>
    </div>
  );
}

// ─── 4) Evidence feed ───────────────────────────────
function MobileEvidence() {
  const T = window.FB;
  const entries = [
    { t: 'denied', d: 'APR 21', time: '15:45', title: 'Denied weekend exchange', body: 'Respondent failed to appear at scheduled 5:00 PM drop-off location. 48 hrs custodial time lost.', tags: ['RFO-05'], flag: 'high' },
    { t: 'statement', d: 'APR 20', time: '18:02', title: '"Daddy said I have to keep my things at his house."', body: 'Verbatim · spontaneous · distressed.', tags: ['EC § 1240', 'RFO-05'], flag: 'high' },
    { t: 'exchange', d: 'APR 20', time: '15:45', title: 'Late drop-off · 45 min', body: 'Scheduled 3:00 PM · Actual 3:45 PM. 3rd occurrence in 30 days.', tags: ['RFO-05'], flag: 'med' },
    { t: 'comm', d: 'APR 19', time: '09:12', title: 'OFW message · Respondent', body: '"I\'ll bring her back when I feel like it." Tone: hostile, refuses_to_respond.', tags: ['FC § 271'], flag: 'high' },
    { t: 'expense', d: 'APR 18', time: '14:30', title: 'Dental · Dr. Okafor', body: '$240.00 · paid Petitioner · receipt attached. Unreimbursed.', tags: ['FL-150'], flag: null },
    { t: 'medical', d: 'APR 15', time: '10:00', title: 'Well-child visit · Leonie', body: 'Resp not notified. Consent by Pet. Next appt May 12.', tags: [], flag: 'low' },
    { t: 'witness', d: 'APR 14', time: '17:20', title: 'M. Ortega (neighbor)', body: 'Observed raised voices at exchange. Willing to testify.', tags: [], flag: null },
  ];
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      <div style={{ padding: '58px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Label>Archive · 847 entries</Label>
            <Display size={28} style={{ marginTop: 4 }}>Evidence</Display>
          </div>
          <Icon d={I.filter} size={20} stroke={T.ink}/>
        </div>
      </div>
      <Rule style={{ margin: '0 20px' }}/>

      {/* Search + filter */}
      <div style={{ padding: '12px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.paperDeep, border: `0.5px solid ${T.rule}` }}>
          <Icon d={I.search} size={14} stroke={T.inkMute}/>
          <span className="fb-sans" style={{ fontSize: 13, color: T.inkMute }}>Search entries, hashes, exhibits…</span>
        </div>
        <div className="fb-scroll" style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
          {[['All', 847, true], ['Flagged', 23], ['Unassigned', 11], ['Exchange', 42], ['Denied', 6], ['Statement', 9]].map(([l, n, a], i) => (
            <div key={i} style={{ flexShrink: 0, padding: '5px 11px', border: `0.5px solid ${a ? T.ink : T.rule}`, background: a ? T.ink : 'transparent', color: a ? T.paper : T.ink, fontFamily: T.sans, fontSize: 11, fontWeight: 500, display: 'flex', gap: 6, alignItems: 'center' }}>
              {l}<span className="fb-tnum" style={{ opacity: 0.6 }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Date header */}
        <div style={{ padding: '12px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `0.5px solid ${T.ruleSoft}`, background: T.paperDeep }}>
          <Display size={15} style={{ fontWeight: 500 }}>Tuesday · April 21</Display>
          <Mono size={9} dim>3 ENTRIES</Mono>
        </div>

        {entries.slice(0, 3).map((e, i) => <EntryRow key={i} e={e}/>)}

        <div style={{ padding: '12px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `0.5px solid ${T.ruleSoft}`, background: T.paperDeep }}>
          <Display size={15} style={{ fontWeight: 500 }}>Monday · April 20</Display>
          <Mono size={9} dim>4 ENTRIES</Mono>
        </div>
        {entries.slice(3).map((e, i) => <EntryRow key={i} e={e}/>)}
      </div>

      <FBTabBar active="evidence"/>
    </div>
  );
}

function EntryRow({ e }) {
  const T = window.FB;
  return (
    <div style={{ padding: '12px 20px', borderBottom: `0.5px solid ${T.ruleSoft}`, display: 'flex', gap: 12, background: '#FFFFFF' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 32 }}>
        <EntryMark type={e.t} size={28}/>
        <Mono size={8} dim>{e.time}</Mono>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="fb-sans" style={{ fontSize: 14, color: T.ink, fontWeight: 500, lineHeight: 1.3 }}>{e.title}</div>
          {e.flag && <FlagDot sev={e.flag}/>}
        </div>
        <div className="fb-sans" style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3, lineHeight: 1.45 }}>{e.body}</div>
        {e.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {e.tags.map((t, i) => <Mono key={i} size={9} style={{ color: t.startsWith('RFO') ? T.ox : T.sandDeep, padding: '1px 5px', border: `0.5px solid ${t.startsWith('RFO') ? T.ox : T.sandDeep}55` }}>{t}</Mono>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5) Advisor chat ──────────────────────────────────
function MobileAdvisor() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      <div style={{ padding: '58px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Label>Advisor · grounded in your case</Label>
          <Display size={24} style={{ marginTop: 2 }}>Strategic chat</Display>
        </div>
        <Seal size={36} label="FB"/>
      </div>
      <Rule color={T.ink} style={{ margin: '0 20px', height: 1 }}/>
      <Rule style={{ margin: '3px 20px' }}/>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
        {/* User question */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ maxWidth: '80%', padding: '10px 14px', background: T.ink, color: T.paper }} className="fb-sans">
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>Is 3 late pickups and 2 denied visits enough to file for contempt?</div>
          </div>
        </div>

        {/* Assistant */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Seal size={20} label="FB"/>
            <Label>Advisor</Label>
            <Mono size={9} dim>09:42 · grounded · 4 sources</Mono>
          </div>
          <div className="fb-sans" style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            Based on your case file, the pattern may support either a <span style={{ background: T.oxWash, padding: '0 2px' }}>contempt action (CCP § 1218)</span> or a <span style={{ background: T.oxWash, padding: '0 2px' }}>request for sanctions under FC § 271</span>. Both require different evidentiary thresholds:
          </div>

          {/* Grounded source cards */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { n: '1', type: 'exchange', id: '#00418', note: '45 min late · Apr 21 · GPS verified' },
              { n: '2', type: 'denied', id: '#00412', note: 'No-show exchange · Apr 14 · witness present' },
              { n: '3', type: 'denied', id: '#00398', note: 'Weekend denied · Apr 7 · OFW hostile response' },
              { n: '4', type: 'doc',   id: 'ORD-2024-11', note: 'Custody order provision § 4(c)' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', border: `0.5px solid ${T.rule}`, background: '#FFFFFF', alignItems: 'center' }}>
                <span className="fb-mono" style={{ fontSize: 10, color: T.ox, fontWeight: 600, width: 14 }}>[{s.n}]</span>
                {s.type !== 'doc' ? <EntryMark type={s.type} size={20}/> : <Icon d={I.doc} size={16} stroke={T.ink}/>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Mono size={10}>{s.id}</Mono>
                  <div className="fb-sans" style={{ fontSize: 11, color: T.inkSoft }}>{s.note}</div>
                </div>
                <Icon d={I.chevR} size={12} stroke={T.inkFaint}/>
              </div>
            ))}
          </div>

          <div className="fb-sans" style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, marginTop: 14 }}>
            Contempt requires proof beyond a reasonable doubt of a willful violation [1][2][3]. Your documentation shows <em style={{ color: T.ox }}>three verified incidents</em> within 30 days — a pattern consistent with willfulness. However, contempt carries criminal-adjacent penalties and is procedurally complex.
          </div>

          {/* Options */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { l: 'Draft FC § 271 sanctions motion', tone: 'ink' },
              { l: 'Add these 3 entries to RFO-05', tone: 'sand' },
              { l: 'Show me the contempt pathway', tone: 'sand' },
            ].map((b, i) => (
              <div key={i} style={{ padding: '10px 12px', border: `0.5px solid ${b.tone === 'ink' ? T.ink : T.rule}`, background: b.tone === 'ink' ? T.ink : '#FFFFFF', color: b.tone === 'ink' ? T.paper : T.ink, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="fb-sans" style={{ fontSize: 12.5, fontWeight: 500 }}>{b.l}</span>
                <Icon d={I.chevR} size={12} stroke={b.tone === 'ink' ? T.paper : T.inkMute}/>
              </div>
            ))}
          </div>

          <Mono size={9} dim style={{ marginTop: 12, display: 'block' }}>
            Legal information, not legal advice. Consult an attorney before filing.
          </Mono>
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 16px 16px', borderTop: `0.5px solid ${T.rule}`, background: T.paperDeep }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#FFFFFF', border: `0.5px solid ${T.rule}` }}>
          <span className="fb-sans" style={{ flex: 1, fontSize: 13, color: T.inkMute, fontWeight: 400 }}>Ask about a strategy, a statute, an entry…</span>
          <Icon d={I.mic} size={16} stroke={T.ox}/>
        </div>
      </div>
      <FBTabBar active="advisor"/>
    </div>
  );
}

// ─── 6) Filing builder (mobile) ───────────────────────
function MobileFiling() {
  const T = window.FB;
  return (
    <div style={{ height: '100%', background: T.paper, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <FBStatusBar/>
      <div style={{ padding: '58px 20px 10px' }}>
        <Label>Filing Package · RFO-05</Label>
        <Display size={24} style={{ marginTop: 3 }}>Custody<br/>Modification</Display>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Mono size={10} dim>HEARING MAY 5 · 14 DAYS</Mono>
          <Chip tone="ox">Draft</Chip>
        </div>
      </div>
      <Rule color={T.ink} style={{ margin: '0 20px', height: 1 }}/>
      <Rule style={{ margin: '3px 20px' }}/>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 20px 0' }}>
        {['Documents', 'Evidence', 'Checklist'].map((t, i) => (
          <div key={t} style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderBottom: i === 1 ? `2px solid ${T.ox}` : `0.5px solid ${T.rule}`, color: i === 1 ? T.ink : T.inkMute, fontFamily: T.sans, fontSize: 12, fontWeight: i === 1 ? 600 : 500 }}>{t}</div>
        ))}
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px' }}>
        {/* AI suggestion banner */}
        <div style={{ padding: '12px 14px', background: T.oxWash, border: `0.5px solid ${T.ox}50`, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon d={I.sparkle} size={14} stroke={T.ox} sw={1.8}/>
            <Label color={T.ox}>AI Suggestions</Label>
          </div>
          <div className="fb-sans" style={{ fontSize: 13.5, color: T.ink, marginTop: 6, lineHeight: 1.45 }}>
            <strong>12 entries match this filing.</strong> 6 not yet included, including the Apr 20 child statement (EC § 1240) — highly relevant.
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <div style={{ padding: '5px 10px', background: T.ink, color: T.paper, fontFamily: T.sans, fontSize: 11, fontWeight: 600 }}>Review 6 matches</div>
            <div style={{ padding: '5px 10px', border: `0.5px solid ${T.ink}`, color: T.ink, fontFamily: T.sans, fontSize: 11, fontWeight: 500 }}>Dismiss</div>
          </div>
        </div>

        {/* Exhibit A */}
        {[
          { letter: 'A', title: 'Custody Interference', count: 6, entries: [
            { t: 'denied', id: '#00412', label: 'No-show · Apr 14', meta: '48 hrs lost · witness' },
            { t: 'denied', id: '#00398', label: 'Weekend denied · Apr 7', meta: 'OFW msg attached' },
            { t: 'exchange', id: '#00418', label: 'Late 45 min · Apr 21', meta: 'GPS verified' },
          ]},
          { letter: 'B', title: 'Child Statements', count: 2, entries: [
            { t: 'statement', id: '#00419', label: '"I have to keep my things…"', meta: 'EC § 1240 · verified' },
          ]},
          { letter: 'C', title: 'Communications', count: 4, entries: [
            { t: 'comm', id: '#00411', label: 'OFW · hostile tone', meta: 'FC § 271 basis' },
          ]},
        ].map((ex, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <Display size={22}>Exhibit {ex.letter}</Display>
              <Mono size={10} dim>· {ex.count} entries</Mono>
              <div style={{ flex: 1 }}/>
              <Icon d={I.plus} size={14} stroke={T.ink}/>
            </div>
            <div className="fb-sans" style={{ fontSize: 13, color: T.inkMute, marginBottom: 8 }}>{ex.title}</div>
            {ex.entries.map((e, j) => (
              <div key={j} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#FFFFFF', border: `0.5px solid ${T.rule}`, marginBottom: 4, alignItems: 'center' }}>
                <Icon d={I.grip} size={14} stroke={T.inkFaint}/>
                <EntryMark type={e.t} size={22}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fb-sans" style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{e.label}</div>
                  <Mono size={9} dim>{e.id} · {e.meta}</Mono>
                </div>
                <Mono size={10} style={{ color: T.ox }}>{ex.letter}-{j + 1}</Mono>
              </div>
            ))}
          </div>
        ))}
      </div>
      <FBTabBar active="filings"/>
    </div>
  );
}

Object.assign(window, { MobileHome, MobileVoiceRecord, MobileVoiceReveal, MobileEvidence, MobileAdvisor, MobileFiling });
