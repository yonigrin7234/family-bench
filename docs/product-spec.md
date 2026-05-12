# FAMILY BENCH — PRODUCT SPECIFICATION

A complete, design-free specification of Family Bench as a product and system. This document defines what the product is, what it does, what it knows, who it serves, and what governs its behavior. It contains zero references to visual design, typography, color, layout, or style.

---

## 1. PRODUCT IDENTITY

### 1.1 What it is
Family Bench is a legal-technology product that turns the lived experience of co-parenting in a family-court case into court-ready evidence, filings, and strategic guidance. It captures real-time parenting events, organizes them with forensic-grade metadata, generates official court documents, and submits them to the appropriate filing system.

### 1.2 Who it serves
Self-represented parents in active or imminent family-court proceedings. The majority of family-court litigants are pro se because attorneys are unaffordable; this product is built for that audience. Secondary users include attorneys, custody evaluators, mediators, and household members granted access to a primary user's case.

### 1.3 Problem it solves
Existing tools fall into two categories: attorney-facing software that organizes an existing paper trail, and consumer journaling apps with no legal structure. Neither closes the loop from real-time parenting evidence to court-submittable documents. Self-represented parents must currently use a patchwork of notes apps, spreadsheets, screenshot folders, calendar reminders, and free-text declarations — at high cognitive cost and with low evidentiary credibility. Family Bench replaces all of those tools with one purpose-built system.

### 1.4 Initial jurisdiction
California, with a state-configurable architecture from inception so the product can expand to other states without core rewrites.

### 1.5 Mission boundary
The product equips a self-represented parent to document, organize, and file with the rigor a lawyer would bring. It is not a substitute for a lawyer, never gives legal advice, and never replaces professional judgment in matters of legal strategy.

---

## 2. CORE PRINCIPLES

### 2.1 Evidence integrity is non-negotiable
Every entry, every attached file, every edit must carry forensic metadata sufficient to establish admissibility. The product never sacrifices evidence integrity for convenience.

### 2.2 The product never asks the user to re-explain their case
Once data exists in the system, every feature has access to it. Users are not asked to repeat case numbers, party names, child information, court orders, or prior context.

### 2.3 Output is factual, never inflammatory
Every piece of generated text — entries, reports, declarations, AI responses — uses neutral, court-appropriate language. The product does not produce content that prejudices a judge against the opposing party through tone alone.

### 2.4 Legal information, never legal advice
AI outputs are framed as legal information or research, never as advice. Every statute-adjacent surface includes an unauthorized practice of law disclaimer. The product never instructs a user what to do in their case.

### 2.5 Citations must be grounded
The product never fabricates statute citations. Every cited authority is sourced from a vetted legal knowledge base via retrieval-augmented generation, not from model hallucination.

### 2.6 The user's data is the user's data
Encryption at rest, encryption in transit, row-level access control on every record, full export at any time, full deletion at any time, no sale to third parties, no advertising.

### 2.7 The product never replaces human connection
The product is a documentation and filing tool. It does not substitute for an attorney, a therapist, a co-parent communication channel, or a trusted human in the user's life.

---

## 3. USER PERSONAS

### 3.1 Primary persona: Pro se parent in active litigation
Demographics span widely; common attributes: limited budget, limited legal knowledge, high emotional load, time-constrained (often with custodial responsibilities while building filings), often dealing with a represented opposing party, frequently using mobile while away from a desk.

### 3.2 Lifecycle stages
The product behaves differently for users at different stages:
- **Pre-filing** — anticipating litigation, gathering evidence
- **Just filed** — initial case mechanics, learning the system
- **Responding** — opposing party filed, deadlines pressing
- **Active litigation** — ongoing case management
- **Post-judgment** — enforcement, modification, monitoring

### 3.3 Conflict-level dimensions
- **Low conflict** — documentation-light, schedule-tracking-heavy
- **Medium conflict** — selective documentation, occasional incidents
- **High conflict** — comprehensive documentation, frequent disputes
- **Safety concerns** — DV/protective layer engaged

### 3.4 Representation status
- Has an attorney
- Had an attorney (now self-rep)
- Self-rep against opposing counsel
- Both parties self-represented

### 3.5 Secondary personas
- **Attorney** granted access by a client to specific entries or filings
- **Custody evaluator** granted access by both parents (consent gated)
- **Mediator** granted access during a mediation engagement
- **Household member** granted read-only access by the primary user
- **Therapist or counselor** granted limited safety-gated access
- **Judge** never accesses raw evidence; only formally submitted packets

---

## 4. THE FIVE CORE USER MOMENTS

The entire product is organized around five distinct moments in a self-represented parent's day. Every feature serves one of these moments.

### 4.1 Capture
"Something just happened, log it now." Duration: 30 seconds. Context: hands often full, often stressed, often mid-event. Captures: voice, photo, exchange timer, quick text.

### 4.2 Check
"Where do I stand?" Duration: 30 seconds. Context: morning coffee, between tasks. Surfaces: next hearing countdown, custody compliance, urgent items, recent activity.

### 4.3 Browse
"Find that thing from February." Duration: 5 minutes. Context: reviewing evidence, preparing for a conversation. Tools: search, filter, calendar view, timeline view.

### 4.4 Think
"What should I do about this?" Duration: 10 minutes. Context: evening, processing the day's events. Tools: AI Advisor with full case context, case diagnostic flow.

### 4.5 Build
"Prepare for court." Duration: 30–60 minutes, often a weekend. Context: focused work session before a hearing or filing deadline. Tools: filing packages, court forms, declarations, exhibits, e-filing.

---

## 5. DATA MODEL

### 5.1 Cases
A case is a single legal matter. A user may have multiple cases (custody and DV restraining order, or separate cases with different ex-partners). Case attributes: case number, court name, department, judge name, filing date, jurisdiction, case stage, status.

### 5.2 Parties
Per-case roles: self, other parent, attorney (own and opposing), custody evaluator, mediator, guardian ad litem, witness. Each party has name, role, contact information, and (for legal professionals) firm name and bar number.

### 5.3 Children
Per-user records: name, date of birth, schools, medical providers. Each child can be referenced by entries, exchanges, compliance checks, expense records.

### 5.4 Entries
The core unit. Every captured event is an entry. Ten entry types (Section 6). Entries belong to a case and reference one or more children.

### 5.5 Court orders
Per-case records of issued orders. Each order has provisions extracted as discrete checkable items. Orders have status (active, superseded), expiration dates, and link to compliance records.

### 5.6 Filings
A filing is a package of court documents intended to be submitted together. Filings reference entries (as exhibits) via a join relationship that preserves entry independence.

### 5.7 Case documents
External documents the user uploads: opposing party filings, minute orders, custody evaluations, mediation agreements. Each is OCR'd and structured by AI extraction.

### 5.8 Reports
Generated documents derived from entries. Eight standard report types (Section 14).

### 5.9 Communications
Imported message records (OFW, text, email, WhatsApp). Stored as entries of type Communication with platform-specific metadata.

### 5.10 Patterns
AI-detected behavioral patterns across entries. Each pattern has supporting entries, a category, a strength score, and surfaces in relevant contexts.

### 5.11 Conversations
Persistent AI Advisor chat threads. Each conversation has full case context and survives across sessions.

### 5.12 Diagnostic results
Outputs of the case diagnostic flow. Each result has the input situation, the legal options produced, and the supporting evidence assessment.

---

## 6. ENTRY SYSTEM

### 6.1 Universal fields (every entry)
- Date and time (defaults to capture moment, editable)
- Case (active case)
- Child (selector when more than one)
- Custody period (my time, their time, transition, neutral)
- Body text (free-form)
- Attachments (photos, voice memos, documents)
- Location (auto-captured GPS with accuracy and source)
- People present (selectable from parties + free-text)
- Flag toggle with severity (low, medium, high, emergency)
- Flag category
- Capture method (auto-detected and recorded)

### 6.2 Entry types and their type-specific fields

**6.2.1 Journal**
- Child mood
- Activity tags
- Developmental milestone flag

**6.2.2 Pickup/Dropoff (Exchange)**
- Exchange type (pickup or dropoff)
- Transfer method (in-person, school, third-party)
- Scheduled time
- Actual time
- Auto-calculated late minutes
- Who picked up / who dropped off
- Child condition at exchange
- Optional active timer mode with GPS breadcrumb during exchange

**6.2.3 Visit Denied**
- Scheduled start datetime
- Scheduled end datetime
- Reason given (or "no reason given" toggle)
- Actions taken (multi-select: called police, texted, contacted attorney, documented on OFW, none)
- Auto-calculated hours lost
- Witnesses
- Auto-flag as high severity
- Prompt to document on OFW if not yet done

**6.2.4 Expense**
- Amount
- Category
- Paid by (me, other parent, split)
- Receipt photo with EXIF preservation
- Reimbursement requested flag
- Reimbursement received flag
- Description
- AI line-item extraction from receipt photo
- Linked to specific child
- Linked to court order provision if applicable

**6.2.5 Medical**
- Provider name
- Visit type (routine, urgent, emergency, dental, therapy, specialist)
- Both parents notified flag
- Consent given by (both, me only, other parent only, neither)
- Diagnosis notes
- Next appointment (auto-creates a key date)
- Prescription tracking
- Provider contact information

**6.2.6 Child Statement (Evidence Code § 1240 admissible)**
- Verbatim quote (entered in quotation marks, enforced)
- Context (spontaneous, in response, during activity, at bedtime, during transition)
- Emotional state
- Auto-classification for EC 1240 admissibility
- Inline guidance to record exact words and avoid leading prompts
- Warning if leading language is detected
- Optional audio recording with consent flag

**6.2.7 Communication**
- Platform (OFW, text, email, WhatsApp, phone, other)
- Direction (sent, received)
- Message content (text or screenshot upload)
- Auto-calculated response time
- Tone flags (hostile, threatening, manipulative, involves children, refuses to respond, normal)
- AI screenshot reader for image content
- Link to full conversation thread
- Recurring topic detection (money, scheduling, child welfare)

**6.2.8 Incident**
- Severity (low, medium, high, emergency)
- Category (late, denied visit, safety, verbal, substance, property, child endangerment, order violation, other)
- Description
- Immediate action taken
- Witnesses with contact information
- Related court order provision
- Police report filed flag and report number
- Follow-up required flag
- Emergency resources surfaced when severity is emergency

**6.2.9 Compliance**
- Court order selector
- Provision selector
- Compliant yes/no
- Compliance notes
- Aggregated pattern tracking per provision

**6.2.10 Witness**
- Witness name
- Relationship (parent, family, friend, professional, neighbor, teacher, other)
- Observation
- Date observed
- Willingness to testify (yes, no, unknown)
- Encrypted contact information
- Witness statement document upload

### 6.3 Entry lifecycle
- Create (from any capture method)
- Edit (creates immutable audit record)
- Soft delete (recoverable for 30 days)
- Permanent delete (after export confirmation)
- Archive
- Duplicate as template
- Link to other entries (for pattern threads)
- Flag or unflag
- Change entry type (with audit trail)
- Bulk operations (flag, delete, export, assign to filing)
- Print as PDF
- Share (email, export with metadata)
- Export with full metadata as JSON

---

## 7. CAPTURE METHODS

The product supports 16 distinct ways to create an entry. The user chooses the method that fits the moment.

### 7.1 Manual text entry
### 7.2 Voice dictation (entire entry filled from speech)
### 7.3 Voice mid-entry (fills only empty fields, respects user input)
### 7.4 Exchange voice mode (hands-free during pickup or dropoff)
### 7.5 Camera photo with EXIF preservation
### 7.6 Gallery import with EXIF preservation
### 7.7 Receipt scanner with AI line-item extraction
### 7.8 Screenshot reader (parses message screenshots from any platform)
### 7.9 Document upload (PDF, Word, image)
### 7.10 Voice memo attachment (audio attached to a typed entry)
### 7.11 Siri Shortcut trigger (iOS)
### 7.12 Quick-capture widget (home screen)
### 7.13 Apple Watch quick capture
### 7.14 Forward-to-email capture (capture@familybench.com)
### 7.15 Share sheet integration (from any other app)
### 7.16 Bulk import from prior tools (CSV, JSON)

### 7.17 Universal capture pipeline
Regardless of capture method, every entry passes through the same pipeline: identify entry type, extract or accept fields, capture forensic metadata, hash content, persist locally, queue for sync, run downstream AI (pattern detection, advisor context update), notify any matching filings.

---

## 8. VOICE-TO-ENTRY

### 8.1 Flow
User taps the mic. Audio waveform and timer appear. User speaks for 10–60 seconds, taps stop. Brief processing. The raw transcript and the structured entry appear together. User reviews, edits any field if needed, confirms. Entry is saved with full forensic metadata and the voice recording itself archived.

### 8.2 What the AI extracts
- Entry type (determined from speech content)
- Date and time (from context)
- Location (from current GPS or referenced location)
- Body text (rewritten in factual, non-emotional language)
- Type-specific fields per entry type
- Mood or emotional state
- People present
- Severity and flag category based on content
- Links to prior related entries (pattern threads)

### 8.3 Field-aware extraction
If the user invokes voice while editing a partially-filled entry form, the AI fills only fields that are empty. The user's existing input is never overwritten.

### 8.4 Multi-language support
At launch: English and Spanish. Speech-to-text and structuring both operate in either language, with consistent output formatting in the user's preferred language.

### 8.5 What the AI must never do
- Use emotional or legally prejudicial language
- Provide legal advice
- Fabricate facts the user did not state
- Cite statutes not present in the legal knowledge base
- Speak in first person about the case as if the AI is a party

### 8.6 Validation gate
Every AI response passes schema validation before reaching the user. Validation failure falls back to manual entry rather than producing malformed output.

---

## 9. FORENSIC EVIDENCE LAYER

### 9.1 Per-entry metadata captured automatically
- Server timestamp (authoritative, cannot be faked)
- Device timestamp (the phone's clock at capture)
- Device timezone
- Hashed device identifier
- Device model and OS version
- App version
- Capture method
- Hashed IP address
- GPS coordinates with accuracy, altitude, source (gps, wifi, cell, manual, none)
- Reverse-geocoded address
- SHA-256 hash of entry body
- SHA-256 hash of metadata
- Timestamp consistency check (verified, minor drift, suspicious, offline capture)

### 9.2 Per-attachment metadata captured automatically
- EXIF timestamp
- EXIF GPS coordinates
- EXIF device make, model, software
- Original filename
- SHA-256 file hash
- Edit detection flag
- Preserved original file hash

### 9.3 Edit audit trail
Every edit creates an append-only record: field name changed, old value, new value, old content hash, new content hash, optional edit reason, hashed device identifier, hashed IP, edit timestamp. Original content hash is preserved permanently. Edits are never destructive.

### 9.4 Chain of custody certificate
Every generated filing PDF includes a per-exhibit certificate showing: creation timestamp, capture device, GPS accuracy, capture method, content SHA-256 hash, EXIF summary, edit history summary, and a QR code linking to a public verification endpoint where any party (judge, attorney, opposing counsel) can confirm the document has not been tampered with since generation.

### 9.5 Public verification endpoint
A web endpoint that accepts a hash and returns the verification status, capture timestamp, and signed proof. No PII is exposed at the endpoint; only hash-level verification.

---

## 10. EVIDENCE ORGANIZATION

### 10.1 Single global pool
All entries live in one pool. Entries do not belong to filings; filings reference entries.

### 10.2 Filing linkage via join
A join relationship connects entries to filings. The same entry can appear in multiple filings with different exhibit labels and notes per filing.

### 10.3 Three views of evidence
- **Global feed** — all entries, filterable across the full vault
- **Per-filing view** — entries linked to a specific filing, organized by exhibit group
- **Unassigned filter** — entries not yet linked to any filing (pre-hearing checklist tool)

### 10.4 Exhibit group structure
Within a filing, evidence is grouped into exhibit categories (Exhibit A, B, C, etc.). Order within and between groups is editable. Each evidence-to-filing reference can carry an exhibit label, a usage note, and a paragraph reference for inclusion in declarations.

---

## 11. SEARCH AND FILTER

### 11.1 Search scope
- Full-text search across entry body
- Search across type-specific fields
- Search across attachments (OCR content)

### 11.2 Filter dimensions
- Entry type
- Flagged status
- Severity
- Date range
- Child
- Case
- Filing linkage (linked to specific filing, unlinked, or any)
- Person present
- Location
- Compliance status

### 11.3 Saved searches and recent searches
User-defined search presets and a history of recent searches.

### 11.4 Search suggestions
Suggestions based on entry content and frequent search patterns.

---

## 12. VIEWS

### 12.1 Available views of the entry feed
- Reverse-chronological feed
- Calendar (with entry indicators per day)
- Timeline (chronological with visual events)
- Per-child filter
- Per-case filter
- Pattern view (AI-grouped by recurring theme)

### 12.2 Grouping
By day, week, or month.

### 12.3 Density
User-selectable: compact or expanded.

---

## 13. FILING SYSTEM

### 13.1 Filing package definition
A filing is a coordinated package: a filing type, a set of required forms, a set of linked entries organized into exhibit groups, an optional set of declarations, an exhibit checklist, a service deadline, and a status.

### 13.2 Filing types supported (initial)
- Request for Order (RFO)
- Response to Request for Order
- Custody Modification
- Contempt Application
- Attorney Fees Motion
- Fee Waiver
- Income and Expense Declaration
- Custody Stipulation
- Ex Parte Request

### 13.3 Filing creation paths
- "I know what to file" — user picks a type, the system loads required forms
- "I don't know what to file" — opens the case diagnostic flow

### 13.4 Filing workflow
- Add or remove documents
- Reorder documents
- Link evidence and organize into exhibit groups
- Drag to reorder evidence within or between groups
- Track completion via per-form checklist
- Auto-calculate service deadline from hearing date
- Track status: draft, ready, filed, served
- Version history of filing drafts
- Clone existing filing as template
- Multiple filings per hearing
- Per-filing exhibit checklist
- Total page count and file size
- Preview full PDF package before filing
- Lock package when ready to file
- Generate final submittable PDF

### 13.5 Three views within a filing
- **Documents** — ordered list of forms
- **Evidence** — entries grouped by exhibit
- **Checklist** — completion status, missing items, deadlines

### 13.6 AI filing suggestions
Per filing, the AI scans the global evidence pool and produces:
- Strong evidence matches with statute citations
- Possible evidence matches
- Cross-references with opposing party's filings (data discrepancies)
- Missing required document alerts
- Deadline warnings
- Pattern-based recommendations

User can dismiss or accept each suggestion. Accepted suggestions auto-link the relevant evidence.

---

## 14. COURT FORMS AND DECLARATIONS

### 14.1 Form library
Per-state form library indexed by form number, name, category, and which filing types require it. California launch set includes FL-300, FL-311, FL-341, FL-150, MC-031, FW-001, FL-330, FL-335, and others as needed by supported filing types.

### 14.2 Guided form fill
Each form is rendered as a step-by-step wizard. User fills substance fields (checkboxes, free text, narrative sections). Headers (case caption, party names, case number, court info) auto-populate from profile.

### 14.3 AI-assisted narrative drafting
For free-text narrative sections, the AI drafts paragraphs from linked entries. User reviews and edits.

### 14.4 Live preview
At any step, user can preview the filled PDF before completing the form.

### 14.5 Output fidelity
Output is a pixel-perfect rendering of the official court form, indistinguishable from a form filled by an attorney.

### 14.6 Form lifecycle
- Save draft at any step
- Progress persisted across sessions
- Validation before generation
- Per-field guidance tooltips
- Per-field link to source entry
- Form template updates when official forms change

### 14.7 Declarations (MC-031 and equivalents)
Declarations are free-text numbered paragraphs on pleading paper, not fillable forms.
- AI drafts numbered paragraphs from linked entries
- Pleading paper format with line numbers
- Statute citations inserted from knowledge base
- Exhibit references auto-linked
- Header with case name, number, and document title
- Signature block
- Penalty-of-perjury verification
- User can edit any paragraph manually
- User can add custom paragraphs
- Deletion of paragraphs creates audit trail
- Supplemental declaration option (extends an existing declaration)

---

## 15. REPORTS

Eight standard reports, all generated as court-ready PDFs.

### 15.1 Custody Time-Share Analysis
Scheduled vs. actual time, with charts and per-week breakdown.

### 15.2 Late Incident Report
Every late pickup or dropoff with times, minutes late, and patterns.

### 15.3 Expense Report
By category, by month, year-to-date, with attached receipts.

### 15.4 Flagged Incidents Report
All flagged entries with full detail and severity breakdown.

### 15.5 Compliance Summary
Per-provision compliance tracking against active court orders.

### 15.6 Communication Summary
Response time analysis, tone distribution, recurring topics.

### 15.7 Full Journal Export
Complete chronological record of all entries.

### 15.8 Bench Brief
One-page case overview formatted for a judge.

### 15.9 Per-report controls
- Date range selector
- Child selector
- Entry filter (all, flagged only, custom selection)
- Preview before generating
- Output as PDF
- Add to filing package
- Share via email, AirDrop, or print
- Save report version
- Report history view

---

## 16. CUSTODY CALCULATOR

### 16.1 Inputs
- Date range
- Child (per-child or aggregated)
- Schedule baseline (from case setup)
- Actual exchange records (from entries)

### 16.2 Outputs
- Scheduled vs. actual percentage
- Bar chart visualization (data, not visual style)
- Per-week breakdown
- Per-month breakdown
- Discrepancy identification with link to source entry
- Cumulative shortfall tracking
- Court-ready citation paragraph (pre-formatted text)
- Compliance score calculation
- Export to filing
- Export to spreadsheet

---

## 17. AUTOMATED CALCULATIONS

The product removes manual math wherever possible.

### 17.1 Standard calculations
- Late minutes (scheduled vs. actual)
- Hours lost (from denied visit times)
- Expense totals (by category, month, year-to-date)
- Custody time-share percentage
- Compliance score (percent of provisions met)
- Response time (between sent and received messages)
- Pattern counts ("3 denied visits in 30 days")
- Deadline countdowns
- Service deadlines
- Statute-of-limitations warnings
- Reimbursement-owed running total
- Time elapsed since last entry (for inactivity alerts)

### 17.2 Calculations are always live
When a user adds or edits an entry, all derived calculations update immediately across the product.

---

## 18. AI CASE ADVISOR

### 18.1 Interface
Persistent conversational interface. Accessible at any time. Survives across sessions and devices.

### 18.2 Context loaded
The Advisor has full case context every conversation:
- All entries
- All court orders and provisions
- All filings (drafts and submitted)
- All opposing party filings
- All key dates and hearings
- All parties
- All deadlines
- The user's communication preferences and prior conversations
- The full legal knowledge base for the user's jurisdiction

### 18.3 Capabilities
- Reference specific entries by ID with clickable resolution
- Cite statutes from the knowledge base
- Know all deadlines and hearing dates
- Suggest actionable next steps
- Provide one-tap actions (add to filing, draft paragraph, set reminder)
- Maintain conversation history
- Support multiple parallel conversation threads
- Conversation search
- Voice input
- Voice output (read aloud)
- Proactive surfacing of relevant events
- Export conversation as PDF

### 18.4 Guardrails
- UPL disclaimer on every response
- Factual tone enforcement
- No fabricated citations (RAG-enforced)
- Schema validation on every response
- Inappropriate content refusal

### 18.5 Multi-thread support
Users can maintain multiple parallel conversations (one per topic, one per filing, one for general strategy). Each thread carries its own context but draws from the same case data.

---

## 19. CASE DIAGNOSTIC FLOW

### 19.1 Trigger
User-invoked from filings tab, advisor, or home, when they don't know what to file.

### 19.2 Branching questions
- Do you have a court order? (If yes, upload or select existing.)
- What happened? (Free text or guided categories.)
- When did it happen? Is it recurring?
- What outcome do you want?
- Self-audit: have you complied with the order yourself? (Probes for clean hands.)
- Evidence assessment: what do you have to support your account?

### 19.3 Output
- 2 to 3 legal options ranked by likelihood of success
- Per-option: what the filing does, statute basis, required forms, supporting evidence pulled from user's data, evidence gaps, estimated timeline, one-tap "Start this filing"
- UPL disclaimer

### 19.4 Persistence
Diagnostic results are saved and resumable. User can revisit a diagnostic later, update with new evidence, or convert directly into a filing.

---

## 20. CASE DOCUMENT INTAKE AND CASE MAP

### 20.1 Intake flow
On first use and ongoing, user uploads existing court documents:
- Court orders
- Filed motions
- Opposing party filings
- Minute orders
- Custody evaluations
- Mediation agreements
- Trial briefs

### 20.2 Per-document processing
- Upload (file or photo)
- OCR full text extraction
- AI structured data extraction (provisions, claims, dates, parties)
- AI plain-language summary
- Auto-extracted deadlines
- Urgent-item flags
- Linkage to related entries
- Linkage to related filings

### 20.3 Case map
A timeline of every court event in the case:
- Each court order with extracted provisions
- Each filed motion with status
- Each hearing with outcome
- Each opposing filing with claims
- Active issues
- Auto-calculated deadlines

### 20.4 Case map operations
- Tap any item to see source document
- Zoom in or out on time scale
- Export case map as PDF

---

## 21. COURT ORDERS

### 21.1 Order management
- Add manually
- Upload PDF (auto-OCR'd)
- Edit extracted provisions
- Tag provision category (custody, support, communication, medical, education, etc.)
- Mark provision active or superseded
- Link entries to specific provisions

### 21.2 Compliance tracking
- Per-provision compliance records
- Provision violation count
- Order hierarchy (which order supersedes which)
- Provision expiration dates
- Countdown to expiration
- Auto-alerts when a provision is expiring

---

## 22. KEY DATES

### 22.1 Date types
- Hearings
- Filing deadlines
- Service deadlines
- Mediation sessions
- Appointments (medical, custody exchange, school events)

### 22.2 Date features
- Manual entry
- Auto-calculated from filings
- Countdown display
- Push notification reminders (configurable)
- External calendar sync (iOS Calendar, Google Calendar)
- Recurring date support
- Link date to filing
- Link date to court order
- Priority flag
- Notes

---

## 23. NOTIFICATIONS

### 23.1 Notification categories
- Deadline reminders (configurable: 30/14/7/3/1 days out)
- Pattern alerts ("3rd denied visit in 30 days")
- Missing evidence warnings before a hearing
- AI suggestions when new entries match existing filings
- Integration sync status
- Docket update alerts (where docket monitoring is active)
- Service deadline approaching
- Court order provision expiring
- Subscription renewal
- New message from a practitioner
- Weekly summary (optional)
- Monthly case report (optional)

### 23.2 Channels
- Push notifications
- Email notifications
- SMS notifications (critical only)
- In-app notification center

### 23.3 User control
- Per-category preferences
- Per-channel preferences
- Snooze
- Mark as read or unread
- Notification history (30+ days)

---

## 24. INTEGRATIONS HUB

### 24.1 Integration philosophy
Integrations are connectors that bring evidence INTO the product from external services. Each integration respects user privacy: only data matching specified filters (typically the other parent's identifier) is imported. User can disconnect any integration at any time.

### 24.2 Supported integrations
**Communication & co-parenting:** Our Family Wizard, TalkingParents, AppClose, WhatsApp, iMessage (via desktop companion), Instagram, Facebook Messenger, phone contacts, call log

**Email & calendar:** Gmail, Outlook/Microsoft 365, Google Calendar, Apple Calendar

**Storage:** Google Drive, Dropbox, iCloud

**Documents:** Docusign, Dropbox Sign

**Financial:** Bank via Plaid, Venmo, PayPal, Zelle, Stripe

**Photo & media:** Photo library, Ring, Nest

**Health & education:** Apple Health, medical portals (MyChart/Epic where APIs allow), school portals (ParentSquare, Seesaw)

**Location:** Life360

**Forensic backup:** iMazing export parser (iMessage, call logs, WhatsApp from desktop backup)

### 24.3 Per-integration capabilities
- Connect or disconnect (OAuth or export upload as appropriate)
- Connection status display
- Other-parent identifier (email or phone to filter by)
- Items captured count
- Last sync timestamp
- Sync frequency setting
- Filter rules per integration
- Error handling with retry
- Privacy summary per integration

### 24.4 Brand authenticity
Each integration displays the official brand logo from that brand's published asset library. Logos are licensed for integration display only, not for promotional use.

---

## 25. E-FILING

### 25.1 Submission flow
- User marks filing package ready to file
- System selects appropriate e-filing provider for the user's county
- Filing fee calculated
- Fee payment processed (credit card or ACH)
- Optional fee waiver application (FW-001)
- Package submitted via e-filing API
- Court-stamped confirmation received
- Confirmation copy archived in user's vault
- Court filing number captured
- Service deadline auto-scheduled
- E-filing status tracked (submitted, accepted, rejected)
- Rejection handling with reason and re-submission flow

### 25.2 Counties without e-filing
For counties that require paper filing:
- Print-ready package generation
- Mail-ready envelope generation
- Drop-box location finder

### 25.3 Provider strategy
The product integrates with established e-filing aggregator APIs (InfoTrack, One Legal, or equivalent) rather than pursuing direct EFSP certification per court. This is the "rent the rails" approach: lower cost, faster time to market, broad coverage.

---

## 26. SERVICE OF PROCESS

### 26.1 Service form generation
- FL-330 (Proof of Personal Service)
- FL-335 (Proof of Service by Mail)
- Auto-populated from filing data

### 26.2 Service tracking
- Who was served (each party)
- How served (mail, personal service, electronic)
- When served (date and time)
- By whom (self, registered server, sheriff)
- Proof of service uploaded
- Auto-attached to filing
- Service deadline reminders
- Electronic service via email (where allowed)
- Per-party service status

---

## 27. PRACTITIONER SHARING

### 27.1 Inviting a practitioner
- User invites attorney, evaluator, mediator by email
- Invitee creates an account
- User grants specific permissions

### 27.2 Permission granularity
- Specific entries
- Specific filings
- Time-limited access (auto-expires)
- Read-only or comment-able
- Both-parent consent gate (for evaluators)

### 27.3 Practitioner capabilities
- Comments on entries
- Comments on filings
- Private notes (visible only to user and practitioner)
- Multiple practitioners per case

### 27.4 Audit and revocation
- Full access log of every view, export, comment
- Revoke access immediately at any time
- Export formatted for practitioner workflow
- Practitioner-specific dashboard view

---

## 28. PATTERN DETECTION

### 28.1 Detection scope
A nightly batch process scans all entries and surfaces behavioral patterns:
- Late pickup clustering by day, time, situation
- Denied visit escalation following filings
- Child mood correlations with exchange events
- Non-response patterns in communications (FC § 271 evidence)
- Recurring incident themes
- Discrepancy detection between opposing party filings and user evidence
- Silent patterns the user may not have noticed
- Seasonal patterns (holidays, school breaks)
- Communication tone escalation
- Expense pattern anomalies

### 28.2 Where patterns surface
- Home/dashboard area under "needs attention"
- Filing suggestions
- Pattern detail view with supporting entries
- Pre-hearing preparation lists

### 28.3 Pattern persistence
Patterns are preserved over time. A pattern detected six months ago remains queryable. Patterns can be dismissed or acknowledged by the user.

---

## 29. MEMORY AND CONTEXT AWARENESS

### 29.1 Permanent memory
The product remembers across every session and every device:
- Full case identity
- All parties
- All children
- Custody schedule and historical changes
- Every court order with provisions
- Every entry ever captured
- Every filing drafted, filed, or abandoned
- Every case document uploaded
- Every Advisor conversation
- Every diagnostic result
- Every generated report and declaration
- All deadlines past and future
- All hearings with outcomes
- All service records
- All compliance checks
- All integration sync history
- All detected patterns
- All flags and severity history

### 29.2 Communication preference memory
- Preferred terminology (co-parent vs. ex vs. other parent)
- Tone preferences in AI drafting
- Preferred detail level
- Legal knowledge level (adjusts explanations)
- Language preference
- Formatting preferences in reports
- Notification thresholds
- Default views and filters
- Custom labels and tags
- Recent searches
- Frequently used quick captures

### 29.3 Implicit knowledge
The AI knows without being told:
- Children by name
- Co-parent by name
- Active custody schedule
- Active court orders
- Pending filings
- Next hearing date
- Upcoming deadlines
- Typical exchange times and locations
- Documented patterns
- Which evidence supports which arguments
- What the user asked yesterday, last week, last month
- What worked in prior filings
- The case's procedural posture
- Which statutes apply

### 29.4 Cross-device memory
- Memory syncs across all user devices
- Conversations resume on a different device
- Draft entries resume on a different device
- Filings in progress resume on a different device
- Settings and preferences sync

### 29.5 Memory over time
- Case timeline builds automatically from all inputs
- "This time last year" retrospectives
- Historical court orders remain searchable after superseded
- Archived cases remain queryable
- Soft-deleted entries recoverable for 30 days
- Edit history is permanent (forensic requirement)

### 29.6 User control of memory
- View memory index
- Delete specific memories
- Pause memory (incognito mode for sensitive topics)
- Export all remembered data
- Clear all memory (resets app, keeps evidence vault)
- Per-conversation memory isolation
- Practitioner-visible vs. private memory boundaries
- Memory correction (tell the AI when it got something wrong)

### 29.7 Privacy and memory
- Memory is user-scoped, never cross-user
- Memory never used to train AI models for other users
- Memory encrypted at rest
- Memory deletion is permanent
- Stealth mode hides sensitive memories
- Memory audit log

---

## 30. SECURITY, PRIVACY, COMPLIANCE

### 30.1 Encryption
- Encryption at rest for all data
- Encryption in transit for all communications
- Column-level encryption on sensitive fields (witness contact info, auth tokens for integrations, medical details, DV-related data)

### 30.2 Authentication
- Email and password
- Google OAuth
- Apple OAuth
- Two-factor authentication (optional)
- Biometric unlock (Face ID, Touch ID, fingerprint)
- PIN fallback for biometric
- Auto-lock after configurable idle time

### 30.3 Authorization
- Row-level security on every table
- A user can only access their own data
- Practitioner access is granted explicitly per record
- Append-only tables (audit logs, edit history) cannot be modified or deleted

### 30.4 Audit logging
- All data access by practitioners is logged
- All edits create audit records
- All security events (login, password change, MFA enable) are logged
- Append-only

### 30.5 Compliance posture
- CCPA-compliant data export (within 30 days of request)
- CCPA-compliant data deletion
- SOC 2 trajectory (target: SOC 2 Type II within 18 months of launch)
- HIPAA-adjacent practices for medical fields
- Per-jurisdiction privacy compliance for expanded states

### 30.6 Trust transparency
- A Trust Center accessible in settings displaying certifications, encryption status, retention policies, and user controls
- Public verification endpoint for every generated exhibit

### 30.7 Data sharing
- No data sold to third parties
- No data shared with advertisers
- No analytics on entry content
- No tracking of PII

---

## 31. DV/SAFETY LAYER

### 31.1 Panic mode
- Activatable with silent gesture (no visible UI change to bystander)
- Clears visible data on the active surface
- Encrypted backup preserved
- Optional automatic emergency contact notification
- Emergency services quick dial (911, local DV hotline)

### 31.2 Stealth mode
- Hidden app icon (appears as a different app or no icon)
- Disguised app name
- Decoy mode (shows fake content if someone unauthorized opens the app)

### 31.3 Emergency resources
- Hotlines (national and local)
- Shelters by location
- Legal aid by location
- Safety plan creation tool
- Restraining order tracking

### 31.4 Evidence preservation mode
- Three independent timestamping signatures per entry
- Extra-rigorous hashing
- Backup to secure cloud
- Marked entries are immutable

### 31.5 Confidential address option
- User's address is suppressed from all generated output
- Cannot be exported in any report
- Per-jurisdiction confidentiality compliance

### 31.6 Child safety escalation
- If AI detects disclosure of abuse in entries, surfaces appropriate resources
- Mandated-reporter resources surfaced where applicable
- Child Statement entries with abuse keywords trigger safety review

---

## 32. ACCESSIBILITY

### 32.1 Capabilities
- Screen reader support (VoiceOver, TalkBack)
- Font size scaling
- High-contrast option
- Reduced-motion option
- Dyslexia-friendly font option
- Voice control support
- Switch control support (iOS)
- Color-blind friendly modes
- Captions on all video content
- Audio descriptions
- Keyboard-only navigation (web and desktop)
- ARIA labels throughout

### 32.2 Touch target compliance
All interactive elements meet WCAG 2.1 AA minimum touch target sizes.

---

## 33. LOCALIZATION

### 33.1 Languages at launch
English and Spanish.

### 33.2 Localization scope
- All UI text
- AI responses (English and Spanish)
- Court terminology per language
- Bilingual document generation where court permits
- Number, date, currency formats per locale

### 33.3 Auto-detection and override
Language auto-detected from system; user can manually override at any time.

---

## 34. DATA MANAGEMENT

### 34.1 Export capabilities
- Full data export (entries, attachments, settings, conversations)
- Export as JSON
- Export as CSV (entries only)
- Export as PDF archive
- Export single filing package
- Export single entry
- Scheduled backups to user-controlled cloud (Google Drive, Dropbox, iCloud)
- Local backup to user's computer

### 34.2 Import capabilities
- Import from previous app version
- Import from competitor tools (Our Family Wizard, TalkingParents export formats)
- Import from CSV with mapping wizard

### 34.3 Retention
- Per-field retention rules displayed to user
- Right to be forgotten (within 30 days of request)
- Account transfer to new email address

---

## 35. OFFLINE BEHAVIOR

### 35.1 Offline capabilities
- All capture works offline
- Entries queue for sync when connection returns
- Attachments queue for upload
- Voice dictation queued for AI processing
- Existing entries readable while offline
- Manual sync trigger when online

### 35.2 Sync behavior
- Sync status indicator in UI
- Conflict resolution on sync (last-write wins for simple fields, merge for arrays)
- Retry failed syncs automatically
- Offline indicator visible when not connected

---

## 36. SUBSCRIPTION TIERS

### 36.1 Free tier
- Limited entries per month (target: 30)
- Basic journaling
- No AI features
- No filing generation
- No e-filing

### 36.2 Premium tier (~$15–20/month)
- Unlimited entries
- Full AI features (voice, advisor, diagnostic, pattern detection)
- Court document generation
- Filing packages
- All integrations
- All reports
- E-filing

### 36.3 Annual plan
Discount on annual prepayment.

### 36.4 Legal professional tier
Higher tier for practitioners managing multiple client cases.

### 36.5 Family plan
Bundle for partner accounts (e.g., new spouse helping with documentation).

### 36.6 Trial
7-day free trial of Premium for new users.

### 36.7 Subscription lifecycle
- Upgrade in-app
- Downgrade at period end
- Cancel anytime
- 90-day grace period after cancellation (data preserved, read-only)
- Reactivation restores full access
- Payment history accessible
- Invoice download
- Update payment method
- Promo codes
- Refund policy
- Subscription transfer to new account

---

## 37. ACCOUNT LIFECYCLE

### 37.1 Stages
- Sign up
- Email verification
- Onboarding
- Active use
- Subscription upgrade or downgrade
- Cancel subscription (grace period)
- Account pause (preserves data, stops billing)
- Account resume
- Data export before deletion
- Account deletion
- Account transfer to new email
- Merge duplicate accounts
- Deceased user handling (designated emergency contact can request data export and account closure with appropriate documentation)

---

## 38. IN-APP SUPPORT

### 38.1 Self-service
- Help center with searchable articles
- Video tutorials per feature
- Onboarding tours (skippable)
- Contextual help tooltips
- Glossary of legal terms
- State-specific guides

### 38.2 Assisted support
- In-app bug reporting
- Feature request submission
- Email support
- Live chat (Premium tier)
- Community forum

### 38.3 Escalation
- Legal aid referrals when user describes a situation beyond what the product can help with
- Crisis resources when safety concerns are detected

---

## 39. ANALYTICS AND CONSENT

### 39.1 What is tracked
- Crash reports (opt-in)
- Feature usage aggregates (opt-in)
- AI improvement signals (opt-in, anonymized)

### 39.2 What is never tracked
- Entry content
- Personally identifiable information
- Communications content
- Search queries
- Any data that could re-identify a user

### 39.3 User control
- Granular consent per analytics category
- Opt-in not opt-out
- Data deletion request removes analytics records
- Transparency report per user (what data we have)

---

## 40. MULTI-CHILD AND MULTI-CASE SUPPORT

### 40.1 Multi-child
- Add multiple children
- Per-child filtering of entries
- Per-child reports
- Per-child custody calculator
- Per-child compliance tracking
- Per-child timeline
- Per-child medical records
- Per-child expenses
- Different custody schedules per child
- Child age-up (schedule changes at developmental milestones)

### 40.2 Multi-case
- Multiple active cases per user
- Switch between cases
- Case-scoped entries (an entry belongs to one case)
- Case-scoped reports
- Case archive
- Case-specific settings
- Optional cross-case search
- Copy entry to another case

---

## 41. COURT-SPECIFIC WORKFLOWS

### 41.1 Per-jurisdiction configuration
- State-specific form library
- County-specific local rules
- County-specific e-filing systems
- Department-specific standing orders
- Judge-specific preferences (where public)
- Tentative ruling lookup (where published)
- Court holiday calendar
- Court closure alerts
- Emergency procedures per jurisdiction

### 41.2 Docket monitoring
- Configure case for monitoring
- Auto-detect new filings
- Auto-detect hearing changes
- Auto-detect orders issued
- Response deadline auto-calculation
- User notification on change
- Configurable check frequency

---

## 42. PLATFORMS

### 42.1 Primary platforms
- iOS (iPhone, iPad)
- Android
- Web (desktop browser)

### 42.2 Companion platforms
- Mac desktop companion (for iMessage import and call log access)
- Apple Watch (quick capture, exchange timer, deadline view, panic button)
- Browser extension (Chrome, Safari, Firefox, Edge — capture from email, OFW web, screenshot to entry)
- Siri Shortcuts (iOS)
- Google Assistant integration (Android)

---

## 43. AI CAPABILITIES INVENTORY

### 43.1 Where AI is used
- Voice-to-entry structuring
- Entry type detection
- Narrative drafting for declarations
- Evidence suggestion per filing
- Cross-reference detection across opposing filings
- Pattern analysis
- Communication tone analysis
- Screenshot OCR plus structuring
- Court document OCR plus extraction
- Receipt extraction
- Response drafting (suggestions for OFW replies)
- Legal research via knowledge base
- Statute citation retrieval
- Form narrative drafting
- Case strategy prompts
- Diagnostic branching
- Conversational advisor
- Proactive alerts
- Summarization (case, filing, entry)
- Translation between supported languages

### 43.2 What AI never does
- Provide legal advice
- Cite statutes outside the vetted knowledge base
- Use prejudicial or emotional language
- Make claims about facts the user did not state
- Override user-entered data
- Train cross-user models on a user's data
- Operate without schema validation on output
- Represent itself as a lawyer or substitute for one

---

## 44. TONE AND VOICE RULES (FUNCTIONAL)

### 44.1 Required tone of all generated text
- Factual, non-emotional
- Court-appropriate vocabulary
- Active voice
- Specific to the case
- Grounded in user data

### 44.2 Forbidden language
- Inflammatory descriptors ("hostile," "narcissistic," "abusive") — replaced with factual alternatives ("non-cooperative," "contrary to court order," "behavior inconsistent with the existing parenting plan")
- Advisory framing ("you should") — replaced with informational framing ("options include")
- Reassurance language ("you've got this," "don't worry")
- Speculative or invented facts
- Diagnoses (medical or psychological) of any party
- Direct accusations without supporting evidence

### 44.3 UPL boundary
Every output that touches statute or legal procedure includes the unauthorized practice of law disclaimer. The product positions itself as a documentation and filing tool, never as a legal practitioner.

---

## 45. LEGAL GROUNDING

### 45.1 California foundation (initial)
The product's logic and citations are grounded in:
- Family Code § 271 (sanctions for non-cooperation)
- Family Code § 3011 (best-interest factors)
- Family Code § 2030 (attorney-fee awards)
- Family Code § 3048 (custody-interference remedies)
- Code of Civil Procedure § 1218 (contempt penalties)
- Code of Civil Procedure § 367.3 (confidential address protections)
- Evidence Code § 1240 (spontaneous child statements)
- California Rules of Court 5.260 (income and expense declarations)

### 45.2 Knowledge base architecture
A vetted, versioned legal knowledge base stores statutes, court rules, local rules, form instructions, judicial council comments, and legal definitions. Each record has effective date, supersession links, topics, and a vector embedding for semantic search.

### 45.3 Per-state expansion
The product supports state-by-state expansion via configuration:
- Per-state terminology
- Per-state statutes
- Per-state forms
- Per-state filing systems
- Per-state local rules
- Per-state consent requirements
- Per-state available remedies
- Per-state filing-type-to-form mappings
- Per-state statute-reference structures

---

## 46. COLLABORATION

### 46.1 Collaboration modes
- Co-counsel mode (share case with attorney)
- Practitioner dashboard for firms
- Household member read-only access
- Therapist/counselor sharing (safety-gated)

### 46.2 Collaboration features
- Comment threads on entries
- @mention practitioners
- Resolution tracking on comments
- Shared document review

---

## 47. VERSIONING

### 47.1 Document version history
- Filing draft history
- Filing revision tracking
- Entry edit history
- Court order version tracking (when superseded)
- Named versions ("draft 1," "pre-hearing," "final")

### 47.2 Version operations
- Compare versions side by side
- Restore previous version
- Version comments

---

## 48. SCOPE BOUNDARIES (NOT IN THE PRODUCT)

### 48.1 The product does not
- Provide legal advice or representation
- File on the user's behalf without explicit confirmation
- Communicate with the opposing party
- Mediate or facilitate co-parenting communication
- Provide therapy or psychological evaluation
- Replace a custody evaluator's professional assessment
- Represent itself as an attorney
- Make decisions for the user
- Send messages to opposing counsel without user review
- Auto-approve filings without user confirmation

### 48.2 Adjacent products explicitly NOT being built
- Co-parenting communication platform (the product does not replace OFW or TalkingParents; it integrates with them)
- General legal-research tool (scope is family-court-specific)
- Therapy or mental-health platform
- Children's communication tool
- Court calendaring system for attorneys
- Document management system for law firms (this is consumer-facing)

---

## 49. BUILD ORDER PHILOSOPHY

### 49.1 Construction sequence
1. Capture and entry system (the foundation)
2. Forensic metadata layer (evidence integrity)
3. Voice-to-entry (the magic moment)
4. AI Advisor (the strategic layer)
5. Filing system (the core differentiator)
6. Court forms and declarations (the output)
7. Reports and calculator (the analytics)
8. Pattern detection (the intelligence)
9. Integrations (the data sources)
10. E-filing (the submission rail)
11. Practitioner sharing (the collaboration layer)
12. DV and safety (the protective layer)
13. Multi-jurisdiction expansion (the scale layer)

### 49.2 Quality gates
Each layer is built to production quality before the next layer begins. The product is not assembled from rough first passes; each system stands on a stable foundation.

---

## 50. SUCCESS DEFINITION

### 50.1 The product succeeds when
- A self-represented parent can document a custody event in under 30 seconds with full forensic metadata
- That same parent can produce a court-ready filing for a hearing in a single weekend afternoon
- The output is indistinguishable from what an attorney would produce
- A judge reading the output finds it credible, factual, and properly formatted
- The user never feels they have to re-explain their case to the product
- The user trusts the product enough to rely on it during the most stressful moments of their litigation

### 50.2 Anti-success
- The product is judged successful only if it raises the floor for self-represented litigants. If a user produces a worse outcome with the product than they would have without it, the product has failed regardless of feature count.

---

# PART II — SYSTEM BEHAVIOR

Part I defines what the product is. Part II defines how it behaves: the flows users move through, the events the system reacts to, the state transitions of every entity, the background processes, and the rules that govern edge cases. Where Part I says "the product captures forensic metadata," Part II says "metadata capture happens at exactly these moments, in exactly this order, with these fallback behaviors when capture fails."

---

## 51. ACCOUNT CREATION FLOW

### 51.1 Sign up sequence
1. User opens the product for the first time
2. Welcome screen offers three sign-up paths: email and password, Google OAuth, Apple OAuth
3. User selects a path
4. For email and password: user provides email, sets password (minimum strength enforced), receives verification email
5. For OAuth: user authorizes via provider; the product receives identity claims; account auto-created
6. Email verification required before any case data can be created
7. On verification, user enters guided onboarding

### 51.2 Onboarding sequence
1. **Question 1**: "Where are you in your case?" (pre-filing, just filed, responding, active litigation, post-judgment)
2. **Question 2**: "Conflict level?" (low, medium, high, safety concerns)
3. **Question 3**: "Legal representation?" (have an attorney, had one, self-rep against their attorney, both self-rep)
4. **Question 4**: "What do you need right now?" (document for court, generate filings, track compliance, prep for hearing, track expenses)
5. Profile customized based on answers (which features highlighted, which guidance surfaces, default tab, notification thresholds)
6. Prompt to upload existing court documents (skippable)
7. Prompt to add active case (skippable)
8. Prompt to add children (skippable)
9. First capture suggestion appears with explanatory tooltip

### 51.3 Safety detection during onboarding
If the user selects "safety concerns" in Question 2, the onboarding flow forks:
1. Resources for DV survivors are surfaced before any other prompts
2. Stealth mode and panic mode are explained
3. The user is offered evidence preservation mode opt-in immediately
4. The standard onboarding continues afterward
5. The DV escalation path is logged in the user's profile so future flows respect it

### 51.4 Skip behavior
Any onboarding step is skippable. Skipped steps remain accessible from settings as "complete your profile" prompts. The home surface shows a setup completion percentage until 100% reached, then the prompt disappears.

---

## 52. CASE SETUP FLOW

### 52.1 Manual case setup
1. User taps "Add case"
2. User enters case number, court name, department, judge name (autocomplete from court directory), filing date
3. User adds parties one by one: role (self, other parent, attorney, opposing attorney, evaluator, mediator), name, contact info
4. User adds children: name, date of birth
5. User defines custody schedule (recurring weekly pattern or custom)
6. User adds active court orders (manual entry or upload)
7. User adds known key dates (hearings, deadlines)
8. Setup complete; case becomes selectable from case switcher

### 52.2 Document-driven case setup
1. User taps "Add case" → "Upload existing court documents"
2. User uploads any combination of court orders, filings, minute orders
3. Each document is OCR'd and AI-extracted in parallel
4. AI proposes case data: case number, court, parties, children, schedule
5. User reviews proposed data and confirms or edits each field
6. Confirmed data populates the case
7. User is asked to add anything the documents didn't reveal

### 52.3 Multi-case handling
A user with multiple cases sees a case switcher. The active case scope is global: every screen reflects the currently-selected case. Switching cases re-scopes all data. Cross-case search is opt-in.

---

## 53. ENTRY CAPTURE FLOWS

### 53.1 Manual text entry flow
1. User invokes capture (any entry point: floating action button, quick-capture widget, voice trigger, web menu)
2. Entry-type picker appears with the 10 types
3. User selects type
4. Form for that type appears with universal fields plus type-specific fields
5. Date, time, location, child, custody period auto-populated from context
6. User fills body text and any required type-specific fields
7. User attaches photos, voice memo, or document (optional)
8. User flags entry if needed
9. User saves
10. System captures forensic metadata at moment of save
11. Entry persisted locally
12. Entry queued for sync
13. Pattern detection runs on the new entry (in background)
14. Memory layer updates
15. Any matching pending filings are notified (suggestion surfaces)

### 53.2 Photo capture flow
1. User invokes camera capture
2. System requests camera permission if not granted
3. User takes photo or selects from gallery
4. EXIF data preserved (timestamp, GPS, device)
5. Photo hashed (SHA-256)
6. Photo attached to a new entry; entry-type picker appears
7. AI suggests entry type based on photo content (receipt → expense, screenshot → communication, exchange location → exchange entry)
8. User confirms type and fills remaining fields
9. Standard save path executes

### 53.3 Receipt capture flow
1. User invokes receipt capture
2. Camera opens with receipt-mode framing guides
3. User photographs receipt
4. AI line-item extraction runs: vendor, date, total, line items
5. Expense entry pre-filled with extracted data
6. User reviews, edits if needed, confirms
7. Receipt photo attached with EXIF and hash preserved
8. Standard save path executes

### 53.4 Exchange timer flow
1. User taps "Start exchange timer"
2. System captures start GPS coordinates and timestamp
3. Timer runs in foreground or background (user can lock phone)
4. GPS breadcrumb captured every 30 seconds during timer
5. User taps "Stop" when exchange is complete
6. End GPS coordinates and timestamp captured
7. Pickup/dropoff entry pre-filled with start/end times, locations, calculated late minutes
8. User reviews and adds notes
9. Standard save path executes

### 53.5 Quick capture (any platform)
1. User invokes quick capture from home-screen widget, Apple Watch, Siri Shortcut, or browser extension
2. Voice or text input accepted
3. AI structures into an entry as in voice-to-entry flow
4. Entry queued; user notified when processing complete
5. User reviews and confirms or edits

---

## 54. VOICE-TO-ENTRY FLOW (DETAILED)

### 54.1 Recording phase
1. User taps mic
2. System requests microphone permission if not granted
3. Recording UI appears with waveform and timer
4. User speaks (target: 10–60 seconds)
5. Audio captured in lossless format
6. User taps stop, or recording auto-stops after 90 seconds

### 54.2 Processing phase
1. Audio uploaded to processing function (or queued if offline)
2. Speech-to-text transcribes
3. Raw transcript returned
4. Transcript passed to AI structuring function with user's case context
5. AI extracts entry type, all relevant fields, suggested links to prior entries
6. Output validated against schema
7. If validation fails, retry with stricter prompt (max 2 retries)
8. If still fails, fall back to manual entry with raw transcript pre-filled in body

### 54.3 Reveal phase
1. Raw transcript and structured entry presented together
2. User reviews structured entry
3. Each field is editable
4. User can re-record if entry is wrong
5. User confirms

### 54.4 Save phase
1. Forensic metadata captured (server timestamp authoritative)
2. Entry hashed, persisted, queued for sync
3. Audio file attached to entry, hashed, archived
4. Pattern detection runs
5. Memory updates
6. Filing match suggestions queued

### 54.5 Offline voice capture
1. Audio captured and persisted locally
2. Entry placeholder created with raw transcript
3. AI structuring queued for next online connection
4. User can manually edit the entry from raw transcript while offline
5. When online, queued AI structuring runs
6. User notified that processing is complete; reveal phase resumes

---

## 55. FILING PACKAGE ASSEMBLY FLOW

### 55.1 Initiate filing
1. User taps "New filing"
2. Two paths offered:
   a. **Known filing type**: user picks from list (RFO, contempt, fee waiver, etc.)
   b. **Don't know**: case diagnostic flow
3. For known filing type: required forms determined from state and filing type
4. Filing package created in draft state
5. User lands on filing detail with three sub-views (Documents, Evidence, Checklist)

### 55.2 Add documents
1. User adds required forms (auto-listed from filing type)
2. User adds optional forms or declarations
3. Each form has its own status (incomplete, draft, complete)
4. User taps a form to enter the guided form fill flow

### 55.3 Link evidence
1. User opens Evidence sub-view
2. AI suggestions appear at the top: "12 entries match this filing"
3. User reviews suggestions, accepts or dismisses each
4. User can also browse the global evidence pool and link manually
5. Linked entries are organized into exhibit groups (A, B, C)
6. User drags to reorder within or between groups
7. Per-link metadata: exhibit label, usage note, declaration paragraph reference

### 55.4 Track completion
1. Checklist sub-view shows: required forms (per status), exhibit verification (per hash status), total page count, file size, service deadline countdown
2. Missing items highlighted
3. "Preview all" renders the full PDF package
4. "Mark ready to file" only enabled when checklist is complete

### 55.5 Mark ready
1. User taps "Mark ready to file"
2. System runs final validation: all required forms complete, all exhibits verified, no expired data
3. Filing transitions from "draft" to "ready"
4. Package locks (further edits create a new version)
5. User taps "Generate final PDF" to produce the submittable document
6. User can either e-file directly or download for paper filing

---

## 56. COURT FORM FILL FLOW

### 56.1 Open form wizard
1. User taps a form within a filing
2. Wizard opens with step counter ("Step 3 of 8")
3. Step 1 shows form context: what this form does, why it's needed for this filing
4. User proceeds

### 56.2 Auto-population
1. Headers (case caption, party names, case number, court info) pre-populated from case data
2. User confirms or edits each header field

### 56.3 Substance fields
1. Each step covers one section of the form
2. Fields: checkboxes, free text, narrative paragraphs
3. Inline guidance per field
4. Per-field link to source entry where applicable

### 56.4 AI-assisted narrative
1. For free-text narrative sections, AI offers to draft from linked entries
2. User reviews AI draft
3. User edits as needed
4. Statute citations inserted from knowledge base where appropriate
5. Draft saved per step

### 56.5 Validation
1. At each step, required fields validated
2. User cannot proceed past a step with missing required fields without explicit override
3. Override creates a "needs review" flag on the filing

### 56.6 Preview and generate
1. After last step, preview shows the fully-rendered PDF
2. User reviews entire form
3. User can return to any step to edit
4. User taps "Generate" to produce final PDF
5. PDF attached to filing

---

## 57. DECLARATION DRAFTING FLOW

### 57.1 Open declaration
1. User adds a declaration document to a filing
2. Declaration editor opens
3. Standard pleading paper format with line numbers
4. Header pre-populated from case data
5. Signature block and penalty-of-perjury verification at bottom

### 57.2 AI-assisted drafting
1. User taps "Draft from entries"
2. User selects which entries to include
3. AI drafts numbered paragraphs from selected entries
4. Statute citations inserted where supported by knowledge base
5. Exhibit references auto-linked to filing's exhibit groups
6. User reviews each paragraph

### 57.3 Manual editing
1. Each paragraph is editable
2. Each paragraph carries an audit record (what changed, when, why)
3. User can reorder paragraphs
4. User can add custom paragraphs
5. User can delete paragraphs (audit recorded)
6. Tone validator runs continuously: prejudicial language flagged with suggested rewrites

### 57.4 Finalize
1. User reviews complete declaration
2. User signs (typed signature with verification)
3. PDF generated with proper formatting
4. PDF attached to filing
5. Declaration locks; further edits create a new version

---

## 58. E-FILING SUBMISSION FLOW

### 58.1 Pre-submission checks
1. User taps "Submit" on a filing in "ready" state
2. System runs final pre-submission validation:
   - All required forms complete
   - All exhibits verified
   - Signature blocks signed
   - Service deadline not yet missed
   - Filing fee calculated
3. User shown summary: filing type, document count, total fee, expected processing time

### 58.2 Fee handling
1. User confirms payment method (saved card or new)
2. For users eligible for fee waiver: option to attach FW-001
3. Fee processed (or held pending fee waiver review)
4. Receipt generated

### 58.3 Submission
1. Package transmitted to e-filing provider for the user's county
2. Provider returns submission confirmation
3. Filing transitions from "ready" to "submitted"
4. Court filing number captured when assigned
5. Service deadline auto-calculated from hearing date and submission date
6. Reminders scheduled

### 58.4 Acceptance or rejection
1. Court reviews submission (timing varies by court)
2. On acceptance: filing transitions to "filed"; court-stamped copy archived
3. On rejection: rejection reason displayed; filing returns to "draft" with notes
4. User can address rejection and resubmit

### 58.5 Paper filing fallback
1. For counties without e-filing, "Submit" generates a print-ready package
2. Mailing labels, envelope, court cover sheet included
3. Drop-box location finder displays nearest court drop-box
4. User marks "Filed" manually after physical submission and uploads court-stamped copy

---

## 59. SERVICE OF PROCESS FLOW

### 59.1 Generate proof of service
1. After filing accepted, user prompted to plan service
2. User selects parties to be served
3. System generates appropriate proof of service form (FL-330 or FL-335)
4. Form pre-populated with filing data and party info

### 59.2 Execute service
1. User chooses service method per party: personal service, mail, electronic
2. Personal service: user uploads signed proof of service after server completes
3. Mail: user prints addresses, mails packets, uploads certified mail receipt
4. Electronic: where party has consented, system can email package directly with delivery receipt

### 59.3 Track and verify
1. Per-party status tracked (not served, served, attempted, refused)
2. Service deadline countdown per party
3. Proof of service auto-attached to filing once uploaded
4. Filing's service status updates as parties are served
5. When all parties served, filing transitions to "served"

---

## 60. DOCUMENT INTAKE FLOW

### 60.1 Upload
1. User selects "Add case document"
2. Document type selected (court order, opposing filing, minute order, evaluation, etc.)
3. File uploaded (PDF, image, or DOCX)
4. File hashed (SHA-256)

### 60.2 Processing
1. OCR runs on document
2. AI extracts structured data based on document type:
   - Court order → provisions, parties, effective date
   - Opposing filing → claims, requested relief, supporting facts
   - Minute order → orders made, hearing date, judge
   - Evaluation → recommendations, key findings, evaluator name
3. AI generates plain-language summary
4. Deadlines auto-extracted
5. Urgent items flagged

### 60.3 Linkage
1. AI suggests links to existing entries (entries that support or contradict claims in the document)
2. User reviews suggestions
3. User accepts or dismisses

### 60.4 Case map update
1. Document added to the case map at the appropriate point in the timeline
2. Provisions extracted from court orders become checkable items in compliance tracking
3. New deadlines added to key dates

---

## 61. AI ADVISOR CONVERSATION FLOW

### 61.1 Open conversation
1. User taps Advisor
2. List of past conversations shown (with titles, dates)
3. User selects an existing conversation or starts a new one

### 61.2 Context loading
1. For new conversation: full case context loaded (entries, orders, filings, parties, deadlines, knowledge base)
2. For continuing conversation: prior conversation history plus current case state loaded
3. AI greets user with proactive observation if relevant ("I noticed you logged a denied visit yesterday — want to discuss?")

### 61.3 User asks a question
1. User types or speaks
2. AI processes against full context plus conversation history
3. AI generates response with:
   - Direct answer to the question
   - Specific entry references (clickable)
   - Statute citations from knowledge base
   - Suggested next steps with one-tap actions
4. Response validated against schema (factual, non-prejudicial, UPL-compliant)

### 61.4 User takes action
1. One-tap actions available in response: "Add this to my filing," "Draft a paragraph," "Set a reminder," "Open this entry"
2. Action executes immediately and the result is fed back into conversation
3. Conversation continues with updated context

### 61.5 Conversation persistence
1. Every message saved
2. Conversation accessible from any device
3. User can rename, archive, or delete conversations
4. Deleted conversations auto-purged after 30 days unless user pins them

---

## 62. CASE DIAGNOSTIC FLOW

### 62.1 Initiate
1. User taps "I don't know what to file" from Filings or Advisor
2. Diagnostic intro explains what the flow does and the UPL boundary
3. User proceeds

### 62.2 Branching questions
1. **Q1**: "Do you have a court order?" — If yes, upload or select existing
2. **Q2**: "What happened?" — free text or guided categories
3. **Q3**: "When? Recurring or one-time?"
4. **Q4**: "What outcome do you want?"
5. **Q5 (self-audit)**: "Have you complied with the order yourself? Any actions you've taken that the other party could raise?"
6. **Q6 (evidence inventory)**: "What evidence do you have? Photos, messages, witnesses?"

### 62.3 Assessment
1. AI cross-references the answers with the user's entries, court orders, and case documents
2. AI scores evidence strength against the desired outcome
3. AI identifies legal options that fit the situation
4. AI assesses each option's strength: required burden, evidence available, evidence gaps, estimated timeline

### 62.4 Output
1. 2 to 3 legal options displayed, ranked by likelihood of success
2. Per option:
   - What the filing does (plain language)
   - Statute basis (cited from knowledge base)
   - Required forms (auto-listed)
   - Supporting evidence (specific entries surfaced)
   - Evidence gaps (what's missing)
   - Estimated timeline
   - One-tap "Start this filing"
3. UPL disclaimer

### 62.5 Persistence
1. Diagnostic result saved
2. User can revisit later, update with new evidence
3. User can convert directly into a filing draft
4. Diagnostic result feeds into Advisor context

---

## 63. PATTERN DETECTION CYCLE

### 63.1 Trigger
1. Nightly batch process runs (typically 2:00 AM user local time)
2. New entries since last run are loaded
3. Full historical context also loaded for cross-time pattern analysis

### 63.2 Detection
1. AI scans for known pattern types:
   - Late pickup clustering
   - Denied visit escalation after filings
   - Child mood correlations with exchange events
   - Non-response patterns
   - Recurring incident themes
   - Cross-references between user's evidence and opposing party's filings
   - Seasonal patterns
   - Communication tone escalation
   - Expense anomalies
2. Each detected pattern includes: category, supporting entries, strength score, surfaced text

### 63.3 Surfacing
1. New patterns surface on home screen under "Needs attention"
2. New patterns appear as suggestions in any open filings they are relevant to
3. Critical patterns (denied visit clustering, communication escalation) trigger notifications
4. Patterns persist until dismissed or acknowledged

### 63.4 User actions on patterns
1. Tap pattern to see detail with all supporting entries
2. "Add to filing" — links pattern's supporting entries to a filing
3. "Dismiss" — removes from active surface (still queryable in pattern history)
4. "Acknowledge" — marks as seen but keeps active
5. "Discuss with Advisor" — opens Advisor conversation seeded with pattern context

### 63.5 Pattern lifecycle
1. New → surfaced → user-acknowledged or dismissed
2. Patterns can resurface if new evidence strengthens them
3. Pattern history is permanent

---

## 64. PRACTITIONER INVITATION FLOW

### 64.1 User invites practitioner
1. User goes to Sharing settings
2. User selects "Invite practitioner"
3. User enters practitioner email and role (attorney, evaluator, mediator)
4. User configures permissions:
   - Specific entries or all entries
   - Specific filings or all filings
   - Time-limited access (auto-expires)
   - Read-only or comment-able
   - For evaluators: requires both-parent consent gate
5. Invitation email sent

### 64.2 Practitioner accepts
1. Practitioner clicks invitation link
2. Practitioner signs up or logs in
3. Practitioner sees invitation summary
4. Practitioner accepts (or declines)

### 64.3 Active access
1. Practitioner sees only granted records
2. Practitioner can comment on entries (visible only to user and practitioner)
3. Practitioner can comment on filings (same visibility)
4. Practitioner can export evidence in their preferred format
5. Every access logged in audit trail

### 64.4 Both-parent consent (evaluators)
1. When user grants evaluator access requiring both-parent consent, evaluator's access is gated
2. System contacts other parent for consent (via email or other parent's own account if they use the product)
3. Access activates only after both consents recorded
4. Either party can revoke consent at any time

### 64.5 Revocation
1. User can revoke practitioner access at any time
2. Revocation immediate; practitioner sees access-revoked message
3. Audit trail preserved permanently
4. Practitioner's prior comments remain in audit; not deleted

---

## 65. SUBSCRIPTION LIFECYCLE FLOW

### 65.1 Free tier
1. New user defaults to free tier
2. Limits enforced: monthly entry count, no AI, no filing generation, no e-filing
3. UI shows entry counter and upgrade prompt when limit approached

### 65.2 Trial start
1. User taps "Start free trial"
2. Payment method captured but not charged
3. Trial begins (7 days)
4. All Premium features unlocked
5. Trial countdown visible in settings

### 65.3 Trial conversion
1. On trial day 6, user notified of upcoming charge
2. User can cancel trial without charge
3. On day 7, payment processed if user has not cancelled
4. Subscription transitions to "active"

### 65.4 Active subscription
1. Monthly or annual billing
2. Failed payment → grace period (7 days) → user notified to update payment
3. After grace period without resolution, subscription transitions to "past_due"
4. Past_due → continued grace (30 days) → user can still access data, write disabled

### 65.5 Cancellation
1. User cancels in settings
2. Cancellation takes effect at end of current billing period
3. After period end: subscription transitions to "cancelled"
4. Grace period of 90 days: data preserved, read-only access
5. After 90 days: data archived, account requires reactivation to restore

### 65.6 Reactivation
1. User reactivates within 90 days: full access restored, billing resumes
2. User reactivates after 90 days: data restoration request initiated, may take 24–48 hours

### 65.7 Plan changes
1. Upgrade: takes effect immediately, prorated billing
2. Downgrade: takes effect at end of current billing period
3. Plan transfer: user can move subscription to a new account email

---

## 66. ACCOUNT DELETION FLOW

### 66.1 Initiate deletion
1. User goes to Settings → Account → Delete account
2. Warning displayed: this is permanent, but data export is offered first
3. User confirms intent

### 66.2 Mandatory export prompt
1. User offered full data export before deletion
2. Formats offered: JSON archive, PDF archive, CSV archive
3. User can skip export with explicit acknowledgment

### 66.3 Deletion sequence
1. User enters password (or biometric) to confirm
2. Confirmation email sent with cancellation link
3. 7-day grace period: user can cancel deletion
4. After 7 days: deletion executes
5. All user data permanently deleted (entries, attachments, conversations, etc.)
6. Audit logs preserved per legal retention requirements (anonymized after retention period)
7. Account email released for reuse after 30 days

### 66.4 Deceased user handling
1. Designated emergency contact can request access for the purpose of data export
2. Documentation required (death certificate, identity verification)
3. Manual review by support team
4. On approval, emergency contact receives one-time export link
5. Account then proceeds through standard deletion

---

## 67. DV PANIC ACTIVATION FLOW

### 67.1 Activation triggers
1. Configured panic gesture (e.g., triple-tap, hardware button combo)
2. Panic button on Apple Watch
3. Panic button accessible from any screen via long-press

### 67.2 Silent execution
1. Activation produces no visible UI change to bystander
2. Active surface clears to a neutral decoy (calculator, weather)
3. Encrypted backup of active state preserved
4. Optional: location ping sent to designated emergency contact
5. Optional: audio recording starts in background
6. Optional: 911 call initiated (configurable)

### 67.3 Recovery
1. User-defined recovery gesture restores app
2. Panic mode session logged in security audit (with user-only visibility)
3. User can review what was captured during panic mode

### 67.4 Stealth mode (preventive)
1. User configures: hidden app icon (app appears as a different app or no icon)
2. User configures: disguised app name
3. User configures: decoy mode content
4. Stealth state survives reboots
5. User can disable stealth at any time

---

## 68. MEMORY FORMATION BEHAVIORS

### 68.1 Explicit memory formation
1. Every entry created → memory of that event
2. Every document uploaded → memory of that document and its extracted data
3. Every Advisor conversation → memory of the conversation thread
4. Every filing generated → memory of the filing context
5. Every user setting change → memory of the preference

### 68.2 Implicit memory formation
1. User searches → memory of search patterns
2. User views entries → memory of which entries are reviewed often
3. User edits entries → memory of editing patterns and preferences
4. User asks Advisor questions → memory of strategic concerns
5. User dismisses suggestions → memory of what's not relevant
6. User accepts suggestions → memory of what works

### 68.3 Memory retrieval
1. When AI is invoked anywhere in the product, memory is auto-loaded as context
2. Memory retrieval is scoped: case-specific memories for case-specific actions, global memories for cross-case patterns
3. Memory respects privacy boundaries: sensitive memories (DV-related, medical) are excluded from contexts where they don't belong

### 68.4 Memory updates
1. New information overwrites stale information (custody schedule changed → new schedule remembered, old one archived)
2. Conflicts trigger user confirmation ("You said X yesterday but Y today — which is correct?")
3. User can correct AI memory at any time

### 68.5 Memory privacy
1. Memory is user-scoped; never crosses users
2. Memory is never used to train cross-user models
3. User can pause memory (incognito mode for a session)
4. User can clear memory (resets app state, evidence vault preserved)

---

## 69. FORENSIC METADATA CAPTURE TIMING

### 69.1 At entry creation
1. **Server timestamp**: captured by server at moment entry record is created
2. **Device timestamp**: captured by app at moment user taps save
3. **Device metadata**: captured at app launch and refreshed on save
4. **GPS**: captured on save (with explicit user permission); cached briefly to avoid re-prompting
5. **Hashed IP**: captured by server at write
6. **Content hash**: computed at save, before persistence
7. **Metadata hash**: computed at save, after all metadata fields populated

### 69.2 At file attachment
1. **EXIF**: extracted from file at upload
2. **File hash**: computed at upload, before persistence
3. **Edit detection**: compared against EXIF-claimed creation device

### 69.3 At edit
1. **Edit record**: created at edit save, with old and new content hashes
2. **Edit metadata**: device, IP, timestamp, optional reason
3. **Edit history hash**: chained with prior edit hash for tamper-evidence

### 69.4 Failure handling
1. If server timestamp can't be obtained (offline): device timestamp used, marked "offline capture" in consistency check
2. If GPS denied: location field captured as "manual" with no coordinates; user can add address manually
3. If hash computation fails: entry save blocked, error surfaced to user

---

## 70. SYNC AND OFFLINE BEHAVIORS

### 70.1 Online behavior
1. Writes go to local store first (instant UI update)
2. Sync queue picks up write and submits to server
3. Server confirms; local store marked synced
4. Multi-device propagation via sync subscriptions

### 70.2 Offline behavior
1. Writes go to local store; sync queue accumulates
2. Reads served from local store
3. UI shows offline indicator
4. Voice transcription queued (audio kept locally)
5. AI features that require server return cached responses where possible, otherwise show "available when online"

### 70.3 Return to online
1. Sync queue auto-processes
2. Conflicts resolved by rules:
   - Simple field conflicts: last-write wins (timestamp-ordered)
   - Array conflicts: merge with order preserved by timestamp
   - Hash mismatches: server hash wins (forensic integrity)
3. User notified of any conflict resolutions that may need attention

### 70.4 Multi-device concurrent edits
1. Same entry edited on two devices while both offline
2. On reconnect, both edits sync
3. Last-write-wins for simple fields
4. Both edits preserved in audit trail
5. User notified if material conflict (one edit substantively contradicts another)

### 70.5 Conflict notification
1. UI shows "Conflicts to review" badge
2. User can inspect each conflict
3. User can accept resolution or manually override

---

## 71. AI VALIDATION PIPELINE

### 71.1 Response generation
1. AI is called with prompt + user context + knowledge base context
2. AI returns structured response

### 71.2 Schema validation
1. Response checked against schema for required fields, types, formats
2. Invalid responses rejected; retry with stricter prompt (max 2 retries)

### 71.3 Citation grounding check
1. Every statute citation in the response checked against the knowledge base
2. Citations not found in the knowledge base are stripped or response is rejected
3. Hallucinated citations never reach the user

### 71.4 Tone validation
1. Response scanned for prohibited language (inflammatory, advisory, diagnostic)
2. Detected violations either auto-corrected or response rejected
3. Persistent violations escalate to fallback content

### 71.5 UPL compliance check
1. Statute-adjacent responses must include UPL disclaimer
2. Missing disclaimer triggers re-generation with disclaimer-enforced prompt

### 71.6 Fallback behavior
1. Voice-to-entry fallback: raw transcript pre-fills body, user manually structures
2. Advisor fallback: "I'm having trouble responding right now — try rephrasing or contact support"
3. Filing draft fallback: declaration paragraphs not auto-drafted; user writes manually
4. Diagnostic fallback: "Diagnostic isn't available right now — would you like to talk to the Advisor about your situation instead?"

---

## 72. NOTIFICATION TRIGGERS

### 72.1 Deadline-based notifications
- 30, 14, 7, 3, 1 days before any tracked deadline (configurable per user)
- Same cadence for service deadlines once a filing is submitted

### 72.2 Pattern-based notifications
- 3rd or more occurrence of an entry type within a configurable window (e.g., 3 denied visits in 30 days)
- Cross-reference detected between opposing party's filing and user's evidence
- Communication tone escalation detected
- Expense anomaly detected

### 72.3 Workflow notifications
- Filing AI suggestion when new entry matches a pending filing
- Missing evidence warning surfaced 7 days before a hearing
- Form template updated for a filing the user is drafting
- Court order provision approaching expiration

### 72.4 System notifications
- Integration sync error
- Integration auth expired
- Subscription renewal upcoming
- Subscription payment failed
- Account security event (new login, password change)

### 72.5 Practitioner notifications
- Practitioner accepted invitation
- Practitioner left a comment
- Practitioner exported evidence

### 72.6 Docket notifications (where monitoring active)
- New filing detected on docket
- Hearing rescheduled
- Order issued

### 72.7 Per-user channel preferences
- Each notification category has independently configurable channels (push, email, SMS, in-app only)
- Critical safety notifications cannot be disabled

---

## 73. STATE MACHINES

### 73.1 Entry state machine
- **Created** → user fills and saves
- **Saved** → entry persisted with metadata
- **Edited** → audit record created; remains "Saved"
- **Soft-deleted** → recoverable for 30 days
- **Recovered** → returns to "Saved"
- **Permanently deleted** → archived in legal-retention store, then purged

### 73.2 Filing state machine
- **Draft** → editable, no validation gates
- **Ready** → all required fields complete, locks for review
- **Submitted** → sent to e-filing provider, awaiting court response
- **Filed** → court accepted, court filing number assigned
- **Served** → all required parties served and proof recorded
- **Rejected** → court rejected, reverts to Draft with reasons
- **Archived** → finalized and inactive

### 73.3 Court order state machine
- **Active** → currently in force
- **Superseded** → newer order replaced this one (visible in history)
- **Expired** → time-limited order has passed expiration
- **Archived** → no longer relevant, kept for record

### 73.4 Subscription state machine
- **Free** → default tier
- **Trial** → 7-day Premium access
- **Active** → paid Premium
- **Past-due** → payment failed, grace period
- **Cancelled** → user cancelled, grace period running
- **Expired** → grace period exhausted, archived

### 73.5 Practitioner access state machine
- **Invited** → invitation sent, not yet accepted
- **Accepted** → practitioner created account and accepted
- **Active** → access granted and within time limit
- **Expired** → time-limited access has passed
- **Revoked** → user revoked access
- **Pending consent** → second-parent consent required (evaluators)

### 73.6 Integration state machine
- **Disconnected** → not configured
- **Connecting** → OAuth flow in progress
- **Connected** → active and syncing
- **Syncing** → batch sync in progress
- **Error** → sync failed, retry pending
- **Auth expired** → token expired, requires re-authentication

### 73.7 Document intake state machine
- **Uploaded** → file received and hashed
- **Processing** → OCR and AI extraction running
- **Extracted** → structured data ready for review
- **Confirmed** → user confirmed extracted data
- **Linked** → connected to relevant entries

---

## 74. CALCULATION BEHAVIORS

### 74.1 Late minutes
- Calculated at entry save: actual time minus scheduled time
- Recalculated if either time is edited
- Stored as part of entry data; surfaced in late incident report

### 74.2 Hours lost
- Calculated at denied visit save: end time minus start time
- Recalculated if times edited
- Cumulative across denied visits in custody calculator

### 74.3 Custody time-share
- Recalculated daily at 2:00 AM user local time
- Inputs: scheduled custody pattern, actual exchange entries, denied visits
- Outputs: percentage scheduled, percentage actual, discrepancy
- Time range configurable

### 74.4 Compliance score
- Recalculated when any compliance entry is added or any court order provision changes
- Inputs: total provisions, provisions with compliance entries, compliance status per entry
- Output: percentage

### 74.5 Response time
- Calculated when communication entry pair is identified (sent followed by received from same party)
- Stored on the response message

### 74.6 Pattern counts
- Recalculated nightly during pattern detection
- Surfaced on home as needed

### 74.7 Reimbursement totals
- Recalculated when expense entry is added or marked reimbursed
- Per-category, per-month, year-to-date

### 74.8 All calculations propagate
When inputs change, all derived values recalculate. UI reflects updates within seconds.

---

## 75. ERROR HANDLING AND RECOVERY

### 75.1 Capture errors
- **Mic permission denied**: prompt to settings; voice unavailable until granted
- **Camera permission denied**: prompt to settings; photo capture unavailable
- **GPS denied**: location field marked manual; user can enter address
- **Storage full**: capture blocked with clear error; suggest export and delete
- **Photo too large**: auto-resize with EXIF preserved

### 75.2 AI errors
- **Voice transcription fails**: retry; fallback to manual entry with audio attached
- **AI extraction fails validation**: retry with stricter prompt; fallback to manual
- **Citation hallucinated**: stripped from response or response rejected
- **Tone violation**: auto-correct or reject
- **Schema validation fails**: retry; fallback content shown

### 75.3 Sync errors
- **Server unreachable**: queue locally, retry on reconnection
- **Sync conflict**: resolve by rules; notify user if material
- **Partial sync**: retry remaining items; log failure
- **Authentication expired**: prompt re-login; preserve unsynced data

### 75.4 E-filing errors
- **Provider API unavailable**: retry; offer paper filing as fallback
- **Filing rejected**: surface rejection reason; user can edit and resubmit
- **Payment failure**: retry with alternate method; hold filing in ready state
- **Court system maintenance**: schedule submission for after maintenance window

### 75.5 Integration errors
- **OAuth expired**: prompt re-authentication
- **API rate-limited**: backoff and retry; user notified if persistent
- **Service unavailable**: pause sync, retry later
- **Data format unexpected**: skip malformed records; log for review

### 75.6 Data integrity errors
- **Hash mismatch on attachment**: file marked "verification failed"; user notified; original preserved
- **Edit history corruption**: append-only protection prevents this; if detected, escalate to support
- **Concurrent edit conflict**: resolve by rules; both versions preserved in audit

### 75.7 User-reported errors
- In-app bug report flow
- System info and logs auto-attached (with user consent)
- Severity tagging
- Acknowledgment and tracking ID provided

---

## 76. BACKGROUND PROCESSES

### 76.1 Continuous
- Sync queue drains as connectivity allows
- Memory updates as user takes actions
- Notification scheduling as deadlines approach

### 76.2 Hourly
- Integration polling for services that don't push updates
- Sync conflict detection across devices
- AI advisor proactive surfacing checks

### 76.3 Daily (typically 2:00 AM local)
- Pattern detection batch
- Calculation refresh (custody time-share, compliance scores)
- Deadline countdown updates
- Inactive-entry inactivity alerts (no entries in N days)

### 76.4 Weekly
- Soft-delete cleanup (entries past 30-day recovery window)
- Stale notification cleanup
- Data integrity audit (hash verification across vault)

### 76.5 Monthly
- Subscription renewal processing
- Storage usage audit per user
- Engagement summary (opt-in)

### 76.6 Annually
- Audit log retention review
- Knowledge base citation verification
- Form template freshness check

---

## 77. CONCURRENCY AND CONFLICT RESOLUTION

### 77.1 Multi-device by same user
- Each device has its own sync queue
- Last-write wins for simple fields, ordered by server timestamp
- Array fields merge with item-level uniqueness
- Hashes recomputed server-side; client hashes treated as advisory

### 77.2 Multi-user (practitioner + user)
- Practitioner edits create separate audit records (visible to user)
- User can override practitioner edits
- Practitioner cannot delete user data (only annotate)

### 77.3 Race conditions
- Filing locked when transitioning to "ready" — concurrent edits to a ready filing rejected with merge prompt
- E-filing submission idempotent — duplicate submissions detected and rejected
- Integration sync re-entrancy guarded — concurrent syncs detected and serialized

### 77.4 Idempotency
- All write operations idempotent on the server
- Client retries safe to repeat
- Duplicate submissions detected by content hash

---

## 78. SECURITY EVENT HANDLING

### 78.1 Login events
- Successful login: audit record, device fingerprint stored
- Failed login: audit record; rate-limited after 5 failures
- Login from new device: notification to user via email
- Login from new geographic region: optional 2FA challenge

### 78.2 Session events
- Session created on login
- Session refreshed on activity
- Session expired after configurable idle time
- Session revoked: by user from settings, by system on password change

### 78.3 Sensitive operations
- Password change: re-authentication required, all sessions revoked except current
- Email change: confirmation required at both old and new email
- Account deletion: 7-day grace period, multiple confirmations
- Data export: user-initiated only, audit record per export

### 78.4 Anomaly detection
- Unusual access patterns detected (geographic, time-of-day, volume)
- User notified
- Optional account lock pending verification

### 78.5 Audit log integrity
- Append-only at the database level (no UPDATE or DELETE policies)
- Daily integrity checks
- Tamper detection alerts to system administrators

---

## 79. EDGE CASES

### 79.1 User has no internet at time of hearing
- Pre-hearing: user generates and downloads PDF package locally
- At hearing: user has offline copy on device
- Post-hearing: filing status updates when connectivity returns

### 79.2 User loses access to email associated with account
- Account recovery via emergency contact (if designated during onboarding)
- Manual support recovery with identity verification
- Recovery process logged in audit trail

### 79.3 User is a minor or under guardianship
- Product not designed for users under 18; sign-up gated by age verification
- For users with legal guardians: account can be jointly managed (not currently a launch feature; flagged for future)

### 79.4 Court order changes mid-filing
- User notified that an active court order has been superseded
- Pending filings flagged for review against new order
- Already-submitted filings unaffected (record of state at submission preserved)

### 79.5 Opposing party also uses the product
- Each user's data is private; the product never connects users to each other
- For court-mandated shared parenting platforms (OFW etc.), the product imports communication only

### 79.6 Case gets dismissed or settled mid-flow
- User can mark case as closed
- Active filings transitioned to "abandoned" with reason
- Data preserved indefinitely unless user deletes
- Notifications and reminders disabled for closed cases

### 79.7 User changes jurisdictions
- Active case retains its jurisdiction
- New case can be set up in new jurisdiction
- Per-state configurations (forms, statutes) apply per case, not per user

### 79.8 Data loss event
- All data backed up multiple times with point-in-time recovery
- User can request restoration to a specific point in time within retention window
- Restoration is read-only by default; user explicitly applies

### 79.9 Service outage
- Read-only fallback for critical features (view existing entries, drafted filings)
- Capture continues offline-only
- User notified via status page

### 79.10 Subpoena for user data
- Legal process required (subpoena, court order)
- User notified unless legally prohibited
- Only specifically requested data produced
- Audit record of disclosure

### 79.11 User deceased
- Designated emergency contact can request access
- Data preserved per retention policy
- After resolution, account deleted via standard flow

### 79.12 Product end-of-life (theoretical)
- Users notified at least 12 months before any sunset
- Data export tools provided
- Open data formats ensure portability
- No user is ever stranded with inaccessible data

---

This specification is the canonical definition of Family Bench as a product. Part I defines what the product IS — its identity, principles, data model, capabilities, and scope. Part II defines what the product DOES — its flows, behaviors, state transitions, and edge case handling. Together they form a complete description that is design-free, technology-agnostic, and intended to remain valid across visual redesigns, framework migrations, and platform expansions. All design decisions, technical architecture decisions, and implementation choices are downstream of this document and must be consistent with it.
