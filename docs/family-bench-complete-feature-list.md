# Family Bench — Complete Feature List

> **Canonical product spec is now `docs/product-spec.md` (Parts I and II,
> 79 sections).** This shorter feature list (51 sections) predates the
> full spec and remains useful as a flat "what does the product do"
> inventory. For product behaviors, flows, state machines, error
> handling, and edge cases, always read `docs/product-spec.md` first.

This document describes the complete long-term Family Bench product scope. Not all features are currently implemented.

Current implemented MVP includes:
- onboarding and local case setup
- durable local persistence
- entry capture
- timeline
- entry review
- local attachments
- local audio recording
- case map
- reports preview
- advisor placeholder

Future work should be implemented incrementally and must preserve:
- Family Bench design-system guardrails
- local-first/offline-first architecture
- evidence provenance separation
- legal-information-not-advice positioning
- calm, factual, child-centered tone

# FAMILY BENCH — COMPLETE FEATURE LIST

Every feature the product does. No design, no architecture, no tech stack.

---

## 1. ACCOUNT AND ONBOARDING

1.1. Sign up with email and password
1.2. Sign up with Google (OAuth)
1.3. Sign up with Apple (OAuth)
1.4. Password reset via email
1.5. Email verification
1.6. Biometric unlock (Face ID, Touch ID, fingerprint)
1.7. PIN fallback for biometric
1.8. Auto-lock after configurable idle time
1.9. Session management across devices
1.10. Sign out from one device or all devices
1.11. Account deletion with full data export option
1.12. Two-factor authentication (optional)
1.13. Emergency contact designation (for account recovery)

### Guided onboarding (4 steps)
1.14. Step 1: Where are you in your case? (pre-filing / just filed / responding / active litigation / post-judgment)
1.15. Step 2: Conflict level (low / medium / high / safety concerns)
1.16. Step 3: Legal representation (attorney / had one / self-rep against their attorney / both self-rep)
1.17. Step 4: What do you need right now? (document / file / track compliance / prep for hearing / track expenses)
1.18. Customized home screen based on answers
1.19. Prompt to upload existing court documents on first use
1.20. Skip onboarding option with ability to complete later
1.21. Different onboarding paths for DV survivors, post-judgment users, new separations

---

## 2. CASE SETUP

2.1. Create a case (case number, court, department, judge, filing date)
2.2. Multiple cases per user (custody + DVRO, different ex-partners)
2.3. Switch between active cases
2.4. Archive a case
2.5. Add parties (self, other parent, attorneys, evaluators, mediators, guardian ad litem)
2.6. Each party has role, name, email, phone, firm name, bar number
2.7. Add children (name, date of birth, photo)
2.8. Per-child data throughout the app
2.9. Set custody schedule (recurring weekly pattern or custom)
2.10. Set court jurisdiction (state, county, courthouse)
2.11. Set hearing dates
2.12. Set case-specific deadlines
2.13. Set trial date if scheduled
2.14. Import case from opposing counsel's filing (if provided)

---

## 3. ENTRY CAPTURE — 10 ENTRY TYPES

### Common fields on every entry
3.1. Date and time (auto-now, editable)
3.2. Case selector
3.3. Child selector
3.4. Custody period (my time / their time / transition / neutral)
3.5. Body text
3.6. Attachments (photos, voice memo, document)
3.7. GPS location with accuracy and source
3.8. People present (quick-tap chips)
3.9. Flag toggle with severity (low / medium / high / emergency)
3.10. Flag category
3.11. Auto-detected capture method tagging

### Journal entries
3.12. General daily observations
3.13. Child mood selector
3.14. Activities tags
3.15. Developmental milestones

### Pickup/Dropoff (Exchange) entries
3.16. Exchange type (pickup / dropoff)
3.17. Transfer method (in-person / school / third-party)
3.18. Scheduled time
3.19. Actual time
3.20. Auto-calculated late minutes
3.21. Who picked up / who dropped off
3.22. Child condition at exchange
3.23. Timer mode for active exchange (start timer on departure, stop on arrival)
3.24. GPS breadcrumb trail during timer mode

### Visit Denied entries
3.25. Scheduled start datetime
3.26. Scheduled end datetime
3.27. Reason given
3.28. "No reason given" toggle
3.29. Actions taken (called police, texted, contacted attorney, documented on OFW, none)
3.30. Auto-calculated hours lost
3.31. Witnesses list
3.32. Auto-flag as high severity
3.33. Prompt to document on OFW if not done

### Expense entries
3.34. Amount
3.35. Category
3.36. Paid by (me / other parent / split)
3.37. Receipt photo with EXIF preservation
3.38. Reimbursement requested flag
3.39. Reimbursement received flag
3.40. Description
3.41. Receipt scan with AI line-item extraction
3.42. Linked to child
3.43. Linked to court order provision if applicable

### Medical entries
3.44. Provider name
3.45. Visit type (routine / urgent / emergency / dental / therapy / specialist)
3.46. Both parents notified (yes/no/na)
3.47. Consent given by (both / me only / other parent only / neither)
3.48. Diagnosis notes
3.49. Next appointment (auto-creates key date)
3.50. Prescription tracking
3.51. Provider contact info

### Child Statement entries (Evidence Code § 1240)
3.52. Verbatim quote (enforced in quotes)
3.53. Context (spontaneous / in response / during activity / at bedtime / during transition)
3.54. Emotional state
3.55. Auto-classification for EC 1240 admissibility
3.56. Inline legal guidance on capture
3.57. Warning if leading language detected
3.58. Option to record audio of statement (with consent flag)

### Communication entries
3.59. Platform (OFW / text / email / WhatsApp / phone / other)
3.60. Direction (sent / received)
3.61. Message content (text or screenshot)
3.62. Auto-calculated response time
3.63. Tone flags (hostile / threatening / manipulative / involves children / refuses to respond / normal)
3.64. AI screenshot reader for text content
3.65. Link to full conversation thread
3.66. Detection of recurring topics (money, scheduling, child)

### Incident entries
3.67. Severity (low / medium / high / emergency)
3.68. Category (late / denied visit / safety / verbal / substance / property / child endangerment / violation / other)
3.69. Description
3.70. Immediate action taken
3.71. Witnesses with contact info
3.72. Related court order provision
3.73. Police report filed flag
3.74. Police report number
3.75. Follow-up required flag
3.76. Emergency resources surfaced if severity = emergency

### Compliance entries
3.77. Court order selector
3.78. Provision selector
3.79. Compliant yes/no
3.80. Compliance notes
3.81. Pattern tracking per provision

### Witness entries
3.82. Witness name
3.83. Relationship (parent / family / friend / professional / neighbor / teacher / other)
3.84. Observation
3.85. Date observed
3.86. Willing to testify (yes / no / unknown)
3.87. Encrypted contact info
3.88. Witness statement document upload

---

## 4. CAPTURE METHODS

4.1. Manual text entry
4.2. Voice dictation (AI fills all fields)
4.3. Voice dictation mid-entry (AI fills only empty fields)
4.4. Exchange voice mode (hands-free during pickup/dropoff)
4.5. Camera photo with EXIF preservation
4.6. Gallery import with EXIF preservation
4.7. Receipt scanner with AI extraction
4.8. Screenshot reader (any platform)
4.9. Document upload (PDF, Word, image)
4.10. Voice memo attachment
4.11. Siri Shortcut trigger (iOS)
4.12. Quick-capture widget (home screen)
4.13. Apple Watch quick capture
4.14. Forward-to-email capture
4.15. Share sheet integration (from other apps)
4.16. Bulk import from prior tools (CSV, JSON)

---

## 5. VOICE-TO-ENTRY

5.1. Tap mic, speak 10-60 seconds, AI structures entry
5.2. Side-by-side reveal of raw transcript vs structured entry
5.3. AI auto-detects entry type from speech
5.4. AI extracts all type-specific fields
5.5. AI writes factual, court-appropriate body text (never emotional)
5.6. Live waveform during recording
5.7. Timer during recording
5.8. Pause and resume recording
5.9. Edit any field before saving
5.10. Re-record option
5.11. Reject and start over option
5.12. Voice entry works offline (queued for AI processing)
5.13. Multi-language support (English + Spanish at minimum)
5.14. Background noise detection warning

---

## 6. FORENSIC EVIDENCE METADATA

### Captured automatically on every entry
6.1. Server timestamp (authoritative)
6.2. Device timestamp
6.3. Device timezone
6.4. Device ID (hashed)
6.5. Device model
6.6. Device OS version
6.7. App version
6.8. Capture method
6.9. IP address hash
6.10. GPS latitude and longitude
6.11. GPS accuracy
6.12. GPS altitude
6.13. GPS source (gps / wifi / cell / manual / none)
6.14. Reverse-geocoded address
6.15. SHA-256 content hash
6.16. SHA-256 metadata hash
6.17. Timestamp consistency check

### On photo/video attachments
6.18. EXIF timestamp
6.19. EXIF GPS coordinates
6.20. EXIF device make, model, software
6.21. Original filename
6.22. SHA-256 file hash
6.23. Edit detection flag
6.24. Preserved original hash

### Edit audit trail
6.25. Every edit creates append-only record
6.26. Field name, old value, new value captured
6.27. Old and new content hashes preserved
6.28. Optional edit reason
6.29. Device ID and IP hash per edit
6.30. Edit timestamp
6.31. Original content hash preserved forever

### Chain of custody
6.32. Chain of custody certificate auto-generated per exhibit
6.33. Public verification endpoint (QR code → verify hash)
6.34. Anyone (judge, attorney) can verify no tampering
6.35. Chain of custody page in every filing PDF

---

## 7. ENTRY MANAGEMENT

7.1. Edit any entry (creates audit trail)
7.2. Soft delete (recoverable for 30 days)
7.3. Permanent delete after export confirmation
7.4. Undo after delete
7.5. Archive entry
7.6. Duplicate entry as template
7.7. Link entries together (pattern threads)
7.8. Flag or unflag entry
7.9. Change entry type (with audit trail)
7.10. Bulk actions (flag, delete, export, assign to filing)
7.11. Print single entry as PDF
7.12. Share single entry (email, export)
7.13. Export entry with full metadata (JSON)
7.14. Entry history view (all versions)

---

## 8. EVIDENCE ORGANIZATION

8.1. Global evidence pool (one camera roll for all entries)
8.2. Entries link to filings via join relationship
8.3. Same entry in multiple filings with different labels
8.4. Evidence tab shows all entries
8.5. Filing-specific evidence view (inside a filing)
8.6. Unassigned filter (evidence not in any filing)
8.7. Drag-to-reorder within exhibit groups
8.8. Drag-between exhibit groups
8.9. Exhibit group labels (A, B, C, etc.)
8.10. Exhibit display order control
8.11. Exhibit usage note per filing
8.12. Per-filing declaration paragraph linking

---

## 9. SEARCH AND FILTER

9.1. Full-text search across entry body
9.2. Search across type-specific fields
9.3. Search within attachments (OCR content)
9.4. Filter by entry type
9.5. Filter by flagged status
9.6. Filter by severity
9.7. Filter by date range
9.8. Filter by child
9.9. Filter by case
9.10. Filter by filing linkage
9.11. Filter by person present
9.12. Filter by location
9.13. Filter by compliance status
9.14. Filter unassigned entries
9.15. Saved search presets
9.16. Recent searches
9.17. Search suggestions

---

## 10. VIEWS

10.1. Feed view (reverse chronological)
10.2. Calendar view (month heatmap with entry indicators)
10.3. Timeline view (chronological with visual events)
10.4. Per-child view
10.5. Per-case view
10.6. Pattern view (AI-grouped by recurring theme)
10.7. Group by day / week / month
10.8. Compact vs expanded card view
10.9. Toggle between views with saved preference

---

## 11. FILING SYSTEM

### Filing packages
11.1. Create filing package
11.2. Pick filing type (attorney fees, custody modification, contempt, fee waiver, RFO, response, etc.)
11.3. Auto-determine required forms by filing type
11.4. Add documents to package
11.5. Reorder documents
11.6. Remove documents
11.7. Link evidence to filing
11.8. Organize evidence by exhibit group
11.9. Progress tracking (% complete)
11.10. Service deadline auto-calculated
11.11. Status tracking (draft / ready / filed / served)
11.12. Filing version history
11.13. Clone existing filing as template
11.14. Multi-filing hearing support (different filings for same hearing)
11.15. Exhibit checklist per filing
11.16. Total page count
11.17. Total file size
11.18. Preview full PDF package
11.19. Mark ready to file (locks package)
11.20. Generate final PDF
11.21. Revert to draft

### Filing three sub-views
11.22. Documents tab (ordered form list)
11.23. Evidence tab (linked entries by exhibit group)
11.24. Checklist tab (completion status)

### AI filing suggestions
11.25. Strong evidence matches with statute citations
11.26. Possible evidence matches
11.27. Cross-references with opposing party's filings
11.28. Missing required documents alert
11.29. Deadline warnings
11.30. Pattern-based evidence recommendations
11.31. Dismiss suggestion
11.32. Accept suggestion (auto-adds to filing)

---

## 12. COURT FORMS

12.1. Form library by state and county
12.2. Form selector within filing
12.3. TurboTax-style step-by-step wizard
12.4. Auto-populated headers (case number, parties, court)
12.5. Editable fields per form
12.6. AI-drafted narrative sections from entries
12.7. Preview filled form before generating
12.8. Generate pixel-perfect PDF
12.9. Save form draft
12.10. Multi-step save progress
12.11. Form validation (required fields)
12.12. Guidance tooltips per field
12.13. Link form field to source entry
12.14. Form template updates when state forms change

### Declarations (MC-031 style)
12.15. AI drafts numbered paragraphs from entries
12.16. Pleading paper format (28-line with line numbers)
12.17. Statute citations inserted
12.18. Exhibit references auto-linked
12.19. Header with case name, number, document title
12.20. Signature block
12.21. Penalty-of-perjury verification
12.22. Manual paragraph editing
12.23. Add custom paragraphs
12.24. Delete paragraphs with audit trail
12.25. Supplemental declaration (adds to existing)
12.26. Print preview
12.27. Generate final PDF

---

## 13. REPORTS (8 TYPES)

13.1. Custody Time-Share Analysis
13.2. Late Incident Report
13.3. Expense Report (by category, month, with receipts)
13.4. Flagged Incidents Report
13.5. Compliance Summary
13.6. Communication Summary
13.7. Full Journal Export
13.8. Bench Brief (one-page case overview)

### All reports support
13.9. Date range selector
13.10. Child selector
13.11. Entry filter (all / flagged / custom selection)
13.12. Preview before generating
13.13. Download as PDF
13.14. Add to filing package
13.15. Share via email, AirDrop, print
13.16. Save report version
13.17. Report history view

---

## 14. CUSTODY CALCULATOR

14.1. Pulls actual exchange times from entries
14.2. Compares to scheduled custody pattern
14.3. Calculates time-share percentage
14.4. Per-child calculation
14.5. Selectable date range
14.6. Scheduled vs actual bar chart
14.7. Weekly breakdown
14.8. Monthly breakdown
14.9. Discrepancy identification per week
14.10. Each discrepancy links to source entry
14.11. Cumulative shortfall tracking
14.12. Court-ready citation paragraph
14.13. Compliance score calculation
14.14. Export to filing
14.15. Export to spreadsheet

---

## 15. AUTOMATED CALCULATIONS

15.1. Late minutes (scheduled vs actual)
15.2. Hours lost (from denied visit times)
15.3. Expense totals (by category, month, YTD)
15.4. Custody time-share percentage
15.5. Compliance score (% provisions met)
15.6. Response time (between sent/received messages)
15.7. Pattern counts ("3 denied visits in 30 days")
15.8. Deadline countdowns
15.9. Service deadlines
15.10. Statute-of-limitations warnings
15.11. Reimbursement owed running total
15.12. Time elapsed since last entry (for inactivity alerts)

---

## 16. AI CASE ADVISOR

16.1. Full chat interface
16.2. Grounded in complete case context
16.3. References specific entries by ID (clickable)
16.4. Cites statutes from knowledge base
16.5. Knows all deadlines
16.6. Knows all court orders and provisions
16.7. Knows opposing party's filings
16.8. Suggests actionable next steps
16.9. One-tap buttons (add to filing, draft paragraph, set reminder)
16.10. Conversation history across sessions
16.11. Multiple conversation threads
16.12. Conversation search
16.13. Voice input
16.14. Voice output (read aloud)
16.15. Proactive suggestions on open
16.16. UPL disclaimer on every response
16.17. Factual tone enforcement
16.18. No fabricated citations (RAG-enforced)
16.19. Share advisor response (with disclaimers)
16.20. Export conversation as PDF

---

## 17. CASE DIAGNOSTIC FLOW

17.1. Branching guided questions
17.2. "Do you have a court order?" with upload flow
17.3. Situation type identification
17.4. Evidence strength assessment
17.5. Self-audit prompts ("did you do anything wrong?")
17.6. Cross-reference user's entries and case documents
17.7. Produces 2-3 legal options
17.8. Each option: what the filing does, statute basis, required forms, evidence, gaps, timeline
17.9. One-tap "Start this filing"
17.10. Save diagnostic result
17.11. Return to saved diagnostic
17.12. UPL disclaimer on output
17.13. Available per state jurisdiction

---

## 18. CASE DOCUMENT INTAKE

18.1. Upload court orders
18.2. Upload filed motions
18.3. Upload opposing filings
18.4. Upload minute orders
18.5. Upload custody evaluations
18.6. Upload mediation agreements
18.7. Upload trial briefs
18.8. OCR reads full text
18.9. AI extracts structured data (provisions, claims, dates)
18.10. AI generates plain-language summary
18.11. Identifies parties and roles
18.12. Extracts deadlines automatically
18.13. Flags urgent items
18.14. Links to related entries
18.15. Links to related filings
18.16. Searchable document library

### Case map
18.17. Visual timeline of all court events
18.18. Every court order with extracted provisions
18.19. Every filed motion with status
18.20. Every hearing with outcome
18.21. Every opposing filing with claims
18.22. Active issues identified
18.23. Auto-calculated deadlines
18.24. Tap any item to see source document
18.25. Zoom in / out on timeline
18.26. Export case map as PDF

---

## 19. COURT ORDERS

19.1. Add court order manually
19.2. Upload court order PDF
19.3. OCR extracts provisions
19.4. Edit provisions
19.5. Tag provision category (custody, support, communication, medical, etc.)
19.6. Mark provision as active / superseded
19.7. Link entries to specific provisions
19.8. Compliance tracking per provision
19.9. Provision violation count
19.10. Order hierarchy (which supersedes which)
19.11. Expiration dates on provisions
19.12. Countdown to expiration
19.13. Auto-alerts when provision expiring

---

## 20. KEY DATES

20.1. Add hearings
20.2. Add deadlines
20.3. Add mediation sessions
20.4. Add filing deadlines
20.5. Add appointments (medical, custody exchange, etc.)
20.6. Auto-calculated deadlines from filings
20.7. Countdown on home screen
20.8. Push notification reminders
20.9. Sync to external calendar (iOS Calendar, Google Calendar)
20.10. Recurring date support
20.11. Link date to filing
20.12. Link date to court order
20.13. Color-coded by category
20.14. Priority flag
20.15. Notes per date

---

## 21. NOTIFICATIONS

21.1. Deadline reminders (configurable: 30/14/7/3/1 days out)
21.2. Pattern alerts ("3rd denied visit in 30 days")
21.3. Missing evidence warnings before hearing
21.4. AI suggestions when new entries match filings
21.5. Integration sync status
21.6. Docket update alerts
21.7. Service deadline approaching
21.8. Court order provision expiring
21.9. Subscription renewal
21.10. New message from practitioner
21.11. Weekly summary (optional)
21.12. Monthly case report (optional)
21.13. Push notifications
21.14. Email notifications
21.15. SMS notifications (critical only)
21.16. In-app notification center
21.17. Mark as read / unread
21.18. Snooze notifications
21.19. Notification history (30+ days)
21.20. Per-category notification preferences

---

## 22. INTEGRATIONS (CONNECTOR HUB)

22.1. Gmail (OAuth) — auto-capture emails with other parent
22.2. Outlook/Microsoft 365 (OAuth)
22.3. Google Calendar (OAuth) — import schedules
22.4. Apple Calendar
22.5. Google Drive (OAuth) — shared docs
22.6. Dropbox
22.7. Our Family Wizard (export parser)
22.8. TalkingParents (export parser)
22.9. AppClose (export parser)
22.10. WhatsApp (export parser)
22.11. Instagram (data export parser)
22.12. Facebook Messenger (data export parser)
22.13. iMazing export parser (iMessage, call logs, WhatsApp from desktop)
22.14. Phone contacts (read-only, identify other parent)
22.15. Photo library (with filtering by date/location)
22.16. iMessage (via desktop companion)
22.17. Call log (via desktop companion)
22.18. Bank via Plaid (auto-categorize child expenses)
22.19. Venmo export
22.20. PayPal export
22.21. Zelle manual import
22.22. Medical portal (MyChart, Epic) where APIs allow
22.23. School portal (ParentSquare, Seesaw) where APIs allow
22.24. Docusign (OAuth)
22.25. Dropbox Sign
22.26. Ring / Nest (doorbell footage of exchanges)
22.27. Life360 (location data)

### Each integration has
22.28. Real service logo
22.29. Connect / disconnect toggle
22.30. Connection status
22.31. Other-parent identifier (email/phone to filter)
22.32. Items captured count
22.33. Last sync timestamp
22.34. Sync frequency setting
22.35. Filter rules
22.36. Error handling with retry
22.37. Privacy summary per integration

---

## 23. E-FILING

23.1. Mark filing package ready to file
23.2. Select e-filing provider by county
23.3. Filing fee calculation
23.4. Filing fee payment (credit card, ACH)
23.5. Fee waiver application (FW-001)
23.6. Submit package to e-filing API
23.7. Receive court-stamped confirmation
23.8. Confirmation copy archived
23.9. Court filing number captured
23.10. Service deadline auto-scheduled
23.11. E-filing status tracking
23.12. Rejection handling with reason
23.13. Re-submission flow
23.14. Print-ready package for counties without e-filing
23.15. Mail-ready envelope generation
23.16. Drop-box location finder

---

## 24. SERVICE OF PROCESS

24.1. Generate proof of service forms (FL-330, FL-335)
24.2. Track who was served (other party, attorney, etc.)
24.3. Track how (mail, personal service, electronic)
24.4. Track when (date and time)
24.5. Track by whom (self, server, sheriff)
24.6. Upload proof of service
24.7. Auto-attach proof of service to filing
24.8. Service deadline reminders
24.9. Electronic service via email (where allowed)
24.10. Service status per party

---

## 25. PRACTITIONER SHARING

25.1. Invite attorney, evaluator, mediator by email
25.2. Practitioner accepts and creates account
25.3. Grant access to specific entries
25.4. Grant access to specific filings
25.5. Time-limited access
25.6. Read-only or comment-able access
25.7. Require both-parent consent (for evaluators)
25.8. Practitioner comments on entries
25.9. Practitioner comments on filings
25.10. Private notes (only user + practitioner)
25.11. Full access audit log
25.12. Revoke access immediately
25.13. Export for practitioner (formatted for their workflow)
25.14. Practitioner dashboard view
25.15. Multiple practitioners per case

---

## 26. PATTERN DETECTION

26.1. Nightly batch analysis of all entries
26.2. Late pickup clustering by day, time, situation
26.3. Denied visit escalation after filings
26.4. Child mood correlations with exchange events
26.5. Non-response patterns in communications
26.6. Recurring incident themes
26.7. Discrepancy detection between opposing party's filings and user's evidence
26.8. Silent patterns (things user may not have noticed)
26.9. Seasonal patterns (holidays, school breaks)
26.10. Communication tone escalation
26.11. Expense pattern anomalies
26.12. Patterns surface on home screen
26.13. Patterns feed filing suggestions
26.14. Pattern detail view with supporting entries

---

## 27. DASHBOARD / HOME

27.1. Next hearing countdown
27.2. Custody split this month vs court order
27.3. Total entries count
27.4. Flagged entries count
27.5. Compliance score
27.6. Pattern alerts
27.7. Urgent deadlines
27.8. Missing evidence warnings
27.9. Recent entries
27.10. Pending filings progress
27.11. Unresolved issues
27.12. Quick capture access
27.13. Case advisor quick prompt
27.14. Customizable widgets
27.15. Widget ordering

---

## 28. MULTI-CHILD SUPPORT

28.1. Add multiple children
28.2. Per-child entry filtering
28.3. Per-child reports
28.4. Per-child custody calculator
28.5. Per-child compliance tracking
28.6. Per-child timeline
28.7. Per-child medical records
28.8. Per-child expenses
28.9. Different custody schedules per child
28.10. Child age-up (schedule changes at milestones)

---

## 29. MULTI-CASE SUPPORT

29.1. Multiple active cases
29.2. Switch between cases
29.3. Case-scoped entries (entries belong to one case)
29.4. Case-scoped reports
29.5. Case archive
29.6. Case-specific settings
29.7. Cross-case search (optional)
29.8. Copy entry to another case

---

## 30. SECURITY AND PRIVACY

30.1. Encryption at rest
30.2. Encryption in transit
30.3. Row-level security (user sees only own data)
30.4. SHA-256 hashing on all files
30.5. Biometric unlock
30.6. Auto-lock
30.7. Session timeout
30.8. Append-only audit logs
30.9. Column-level encryption on sensitive fields (witness contacts, medical details, auth tokens)
30.10. CCPA data export
30.11. CCPA data deletion
30.12. Public verification endpoint
30.13. Trust Center in app
30.14. Privacy policy in-app
30.15. Terms of service in-app
30.16. Stealth mode (hide app from home screen)
30.17. Panic button (clears visible data, keeps encrypted backup)
30.18. Disguised app icon option
30.19. Two-factor authentication
30.20. Session management (view and revoke active sessions)
30.21. Data export in standard formats (JSON, CSV, PDF)
30.22. Per-field privacy controls
30.23. No data sharing with advertisers
30.24. No data sold to third parties

---

## 31. DV / SAFETY FEATURES

31.1. Panic mode activation
31.2. Silent activation (no screen change)
31.3. Emergency contact auto-notify
31.4. Emergency services quick dial (911, local DV hotline)
31.5. Decoy mode (shows fake content if someone opens)
31.6. Hidden app icon
31.7. Disguised app name
31.8. Emergency resources tab (hotlines, shelters, legal aid by location)
31.9. Safety plan creation
31.10. Restraining order tracking
31.11. Violation documentation flow
31.12. Evidence preservation mode (extra hashing, backup, timestamping)
31.13. Confidential address option (suppressed from all outputs)
31.14. Child safety escalation flow if abuse disclosed
31.15. Mandated reporter resources

---

## 32. ACCESSIBILITY

32.1. Screen reader support (VoiceOver, TalkBack)
32.2. Font size scaling
32.3. High contrast mode
32.4. Reduced motion mode
32.5. Dyslexia-friendly font option
32.6. Voice control support
32.7. Switch control support (iOS)
32.8. Color-blind friendly palettes
32.9. Captions on all video content
32.10. Audio descriptions
32.11. Keyboard-only navigation (web and desktop)
32.12. ARIA labels throughout

---

## 33. LOCALIZATION

33.1. English
33.2. Spanish (California priority)
33.3. Auto-detect system language
33.4. Manual language switch
33.5. Translated AI responses
33.6. Translated court terminology
33.7. Translated UI
33.8. Bilingual document generation (where court permits)
33.9. Number and date format localization
33.10. Currency localization

---

## 34. DATA MANAGEMENT

34.1. Full data export (all entries, attachments, settings)
34.2. Export as JSON
34.3. Export as CSV (entries)
34.4. Export as PDF archive
34.5. Export single filing package
34.6. Export single entry
34.7. Scheduled backups to user's cloud (Google Drive, Dropbox, iCloud)
34.8. Local backup to computer
34.9. Import from previous app version
34.10. Import from competitor tools
34.11. Data retention policy display
34.12. Per-field retention rules
34.13. Right to be forgotten
34.14. Data download request fulfilled within 30 days
34.15. Account transfer to new email

---

## 35. OFFLINE BEHAVIOR

35.1. All capture works offline
35.2. Entries queue for sync
35.3. Attachments queue for upload
35.4. Voice dictation queued for AI processing
35.5. Sync status indicator
35.6. Conflict resolution on sync
35.7. Retry failed syncs automatically
35.8. Manual sync trigger
35.9. Offline indicator in UI
35.10. Offline-safe reading (existing entries accessible)

---

## 36. SUBSCRIPTION AND BILLING

36.1. Free tier (limited entries per month, no AI)
36.2. Premium tier ($15-20/month)
36.3. Annual plan discount
36.4. Legal professional tier (for practitioners)
36.5. Family plan (partner accounts)
36.6. Referral credits
36.7. 7-day free trial of Premium
36.8. Upgrade in-app
36.9. Downgrade at period end
36.10. Cancel anytime
36.11. Grace period (data preserved 90 days after cancel)
36.12. Reactivate subscription
36.13. Payment history
36.14. Invoice download
36.15. Update payment method
36.16. Promo codes
36.17. Refund policy
36.18. Subscription transfer to new account

---

## 37. IN-APP SUPPORT

37.1. Help center with articles
37.2. Searchable knowledge base
37.3. Video tutorials per feature
37.4. Live chat support (Premium)
37.5. Email support
37.6. In-app bug reporting
37.7. Feature request submission
37.8. Community forum
37.9. Onboarding tours
37.10. Contextual help tooltips
37.11. Glossary of legal terms
37.12. State-specific guides
37.13. Escalation to legal aid referrals

---

## 38. TONE AND PRINCIPLES (ENFORCED)

38.1. AI outputs only factual, non-emotional language
38.2. No inflammatory terms ("hostile," "narcissistic," "abusive")
38.3. Factual alternatives ("non-cooperative," "contrary to court order")
38.4. No legal advice framing ("legal information" / "options include")
38.5. No "you should" language
38.6. UPL disclaimer on every AI output
38.7. Citation grounding (RAG) prevents hallucination
38.8. Zod validation on every AI response
38.9. Fallback to manual if AI validation fails
38.10. Tone audit before publishing any filing
38.11. Opposing-party-charitable framing
38.12. Child-centered language

---

## 39. ANALYTICS AND CONSENT

39.1. User sees what app tracks
39.2. Analytics opt-in (not opt-out)
39.3. Granular consent per category (crash reports, feature usage, AI improvement)
39.4. No tracking of entry content
39.5. No tracking of PII
39.6. Anonymized aggregate data only
39.7. Data deletion request removes analytics records
39.8. Transparency report per user (what data we have)

---

## 40. INTEGRATIONS WITH EXTERNAL LEGAL TOOLS

40.1. Docusign for signing declarations
40.2. Court case lookup (PACER, state-specific)
40.3. Docket monitoring
40.4. Bar association referral networks
40.5. Legal aid organizations directory
40.6. Expert witness directory
40.7. Process server booking
40.8. Courtroom reservation systems (where available)

---

## 41. APPLE WATCH / WEARABLE

41.1. Quick capture (voice memo)
41.2. Exchange timer start/stop
41.3. View next deadline
41.4. Receive critical notifications
41.5. Set quick reminder
41.6. View today's entries
41.7. Panic button

---

## 42. BROWSER EXTENSION

42.1. Capture from email (Gmail, Outlook web)
42.2. Capture from OFW web
42.3. Capture from WhatsApp Web
42.4. Screenshot to entry with AI parsing
42.5. One-click save entire thread
42.6. Quick add entry from any page

---

## 43. PRINT AND PHYSICAL

43.1. Print single entry
43.2. Print filing package
43.3. Print exhibit binder (tab dividers, cover page)
43.4. Print with line numbers (pleading paper)
43.5. Print chain of custody certificates
43.6. Print service envelopes
43.7. Print court cover sheet
43.8. Print to physical mailing labels
43.9. Print-to-PDF fallback

---

## 44. COURT-SPECIFIC WORKFLOWS

44.1. State-specific form library
44.2. County-specific local rules
44.3. County-specific e-filing systems
44.4. Department-specific standing orders
44.5. Judge-specific preferences (where public)
44.6. Tentative ruling lookup (where published)
44.7. Court holiday calendar
44.8. Court closure alerts
44.9. Emergency procedures per jurisdiction

---

## 45. DOCKET MONITORING

45.1. Configure case for monitoring
45.2. Auto-detect new filings
45.3. Auto-detect hearing changes
45.4. Auto-detect orders issued
45.5. Response deadline auto-calculation
45.6. Linked filing log
45.7. User notification on change
45.8. Check frequency setting

---

## 46. COLLABORATION

46.1. Co-counsel mode (share case with attorney)
46.2. Practitioner dashboard for firms
46.3. Household member read-only access
46.4. Therapist / counselor sharing (safety-gated)
46.5. Comment threads on entries
46.6. @ mention practitioners
46.7. Resolution tracking on comments

---

## 47. ACCOUNT LIFECYCLE

47.1. Sign up
47.2. Email verification
47.3. Onboarding
47.4. Active use
47.5. Subscription upgrade
47.6. Subscription downgrade
47.7. Cancel subscription (grace period)
47.8. Account pause (keep data, stop billing)
47.9. Account resume
47.10. Data export before deletion
47.11. Account deletion
47.12. Deceased user handling (designated contact)
47.13. Account transfer to new email
47.14. Merge duplicate accounts

---

## 48. VERSIONING

48.1. Document draft history
48.2. Filing revision tracking
48.3. Entry edit history
48.4. Court order version tracking (when superseded)
48.5. Named versions ("draft 1," "pre-hearing," "final")
48.6. Compare versions side by side
48.7. Restore previous version
48.8. Version comments

---

## 49. AI CAPABILITIES

49.1. Voice-to-entry structuring
49.2. Entry type detection
49.3. Narrative drafting for declarations
49.4. Evidence suggestion per filing
49.5. Cross-reference detection
49.6. Pattern analysis
49.7. Communication tone analysis
49.8. Screenshot OCR + structuring
49.9. Court document OCR + extraction
49.10. Receipt extraction
49.11. Response drafting (reply suggestions for OFW messages)
49.12. Legal research via knowledge base
49.13. Statute citation retrieval
49.14. Form narrative drafting
49.15. Case strategy prompts
49.16. Diagnostic branching
49.17. Conversational advisor
49.18. Proactive alerts
49.19. Summarization (case, filing, entry)
49.20. Translation (between supported languages)

---

## 50. PLATFORMS

50.1. iOS app (iPhone, iPad)
50.2. Android app
50.3. Web app (desktop browser)
50.4. Mac desktop companion (for iMessage, call logs)
50.5. Apple Watch
50.6. Browser extension (Chrome, Safari, Firefox, Edge)
50.7. Siri Shortcuts
50.8. Google Assistant integration
50.9. Apple HomeKit (critical alerts on displays)

---

## 51. MEMORY (APP-WIDE CONTEXT AWARENESS)

The app remembers everything across every screen, every session, every device. No feature requires the user to re-explain their case. Modeled on the way Claude maintains context, but extended to cover legal evidence management.

### What the app permanently remembers
51.1. Full case identity (case number, court, department, judge, courthouse)
51.2. All parties (self, other parent, attorneys, evaluators, mediators, guardian ad litem)
51.3. All children (names, DOBs, schools, medical providers)
51.4. Custody schedule (recurring pattern, exceptions, changes over time)
51.5. Every court order ever issued with full provisions
51.6. Order hierarchy (which supersedes which, which are active)
51.7. Every entry ever captured (the evidence vault)
51.8. Every filing drafted, filed, or abandoned
51.9. Every case document uploaded (opposing filings, minute orders, evaluations)
51.10. Every Advisor conversation (threaded, searchable, resumable)
51.11. Every diagnostic result
51.12. Every generated report and declaration
51.13. All deadlines (past, present, future)
51.14. All hearings (past outcomes, upcoming prep)
51.15. All service records
51.16. All compliance checks
51.17. All integration sync history
51.18. All patterns the AI has detected
51.19. All flags and severity history

### What the app remembers about how the user communicates
51.20. Preferred terminology (e.g., "co-parent" vs "ex" vs "the other parent")
51.21. Tone preferences in AI drafting
51.22. Preferred detail level in suggestions
51.23. Level of legal knowledge (adjusts explanations accordingly)
51.24. Language preference (English, Spanish)
51.25. Formatting preferences in reports
51.26. Notification thresholds and cadence
51.27. Default views and filters
51.28. Custom labels and tags
51.29. Recent searches
51.30. Frequently used quick captures

### What the AI "just knows" without being told
51.31. Your children by name
51.32. Your co-parent by name
51.33. Your custody schedule
51.34. Your active court orders
51.35. Your pending filings
51.36. Your next hearing date
51.37. Your upcoming deadlines
51.38. Your typical exchange times and locations
51.39. Your documented patterns (e.g., "frequent late pickups")
51.40. Which evidence supports which legal arguments
51.41. What you asked the Advisor yesterday, last week, last month
51.42. What worked in prior filings
51.43. Your case's procedural posture
51.44. Which statutes apply to your case
51.45. What you're currently working on

### Contextual memory in conversation
51.46. Advisor conversations continue across sessions
51.47. Advisor remembers prior questions and answers
51.48. Advisor references prior conversations ("as we discussed last week")
51.49. Advisor knows what filings are in progress
51.50. Advisor knows what evidence has been added recently
51.51. Advisor proactively flags relevant events ("I notice a new denied visit matches a pattern from March")
51.52. Pronouns resolve correctly ("the late pickup" refers to the most recent one)
51.53. "That entry," "last hearing," "the denial" all resolve without clarification
51.54. Advisor maintains persona consistency across conversations

### Memory across the app (not just Advisor)
51.55. Home screen adapts based on recent activity and upcoming events
51.56. Capture form pre-fills based on context (location, time, likely entry type)
51.57. Filing suggestions reference prior patterns
51.58. Voice-to-entry uses case vocabulary (knows your children's names, locations)
51.59. Reports reference prior reports ("this is your 3rd custody analysis")
51.60. Search surfaces relevant results based on what you've been working on
51.61. Notifications reference specific entries and filings by context
51.62. Onboarding never repeats (unless user resets)

### Cross-device memory
51.63. Memory syncs across all user devices (phone, tablet, web, watch)
51.64. Conversations resume on a different device
51.65. Draft entries resume on a different device
51.66. Filings in progress resume on a different device
51.67. Settings and preferences sync across devices

### Memory over time
51.68. Case timeline builds automatically from all inputs
51.69. "This time last year" retrospectives surface in relevant contexts
51.70. Patterns detected over months or years are preserved
51.71. Historical court orders remain searchable after superseded
51.72. Archived cases remain queryable
51.73. Deleted entries remain in soft-delete recovery window (30 days)
51.74. Edit history is permanent (forensic requirement)

### User control over memory
51.75. View what the app remembers (memory index)
51.76. Delete specific memories (entries, conversations, preferences)
51.77. Pause memory (temporary incognito mode for sensitive topics)
51.78. Export all remembered data
51.79. Clear all memory (resets app, keeps evidence vault)
51.80. Per-conversation memory isolation (Advisor thread stays in its thread)
51.81. Memory privacy controls (what practitioners can see, what stays private)
51.82. Memory correction (tell the AI when it got something wrong)

### Memory and privacy
51.83. Memory is user-scoped (never cross-user)
51.84. Memory never trained on / used for other users' AI
51.85. Encrypted at rest like all other data
51.86. Memory deletion is permanent (right to be forgotten)
51.87. Stealth mode hides sensitive memories (DV scenarios)
51.88. Memory audit log (what was remembered, when, from what source)

### How memory is formed
51.89. Explicit capture (entries, uploads, edits)
51.90. Implicit learning (what you search, view, generate, ask)
51.91. Conversational extraction (Advisor learns from your questions)
51.92. Document processing (case documents contribute memory)
51.93. Integration data (synced communications contribute memory)
51.94. User feedback (thumbs up/down on AI responses refines memory)
51.95. Pattern detection (new patterns become remembered facts)

### How memory is surfaced
51.96. Passively in the UI (home screen widgets, suggestions)
51.97. Actively in conversation (Advisor references it naturally)
51.98. Proactively in notifications (relevant memories trigger alerts)
51.99. On-demand via search
51.100. Through the "memory index" settings view
