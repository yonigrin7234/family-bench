# Browser workflow checks — September 5, 2026

These checks used a temporary RN Web component fixture outside the repository. It rendered real application screens, the real workspace store and pure validators with an invented account and two invented cases. Authentication, durable I/O, cloud transport and original-file retrieval were simulated. Every screen showed a visible **SYNTHETIC UI FIXTURE** banner. This fixture is not part of a deployment.

The fixture is not the Expo production runtime: native permissions, routing lifecycle, encrypted persistence, managed Auth/Storage and second-device recovery remain separate release checks. A successful simulated save means only that the application's state transition accepted the fixture's durable-write receipt.

## Observed outcomes

| Flow | Result |
| --- | --- |
| Phone Welcome → child-specific expense capture | Correct case/child shown through all six steps. Missing amount and payer kept the user on the relevant step with a validation message. |
| Empty account → Welcome → case setup → capture | Created an invented case and child from the first-run action. Setup preserved the requested next step and opened Capture with that case and child available. |
| CSV validation and retry | Invalid date and unknown entry type rejected the entire selection with zero writes. The valid three-row file preserved Unicode, quoted commas and multiline text, disclosed one repeat, then recovered from an injected source-save failure with two new private entries and one verified original CSV. |
| CSV source privacy | The original source remained permanently private with no Court-ready control. Private imported rows and the complete CSV were unavailable to form source insertion and blocked from filing package links. |
| Form draft save and retry | An incomplete MC-031 draft retained its entered name after a save failure. Save and close succeeded on retry, showing exactly one saved draft; reopening restored its inputs. |
| Form source and PDF generation | Only the two shareable case entries appeared for insertion. After fixing the sync guard described below, a reviewed synthetic MC-031 generated successfully with an explicit editable/unsigned completion notice. |
| Filing package failure and selected export | Failed package creation retained its title; retry created one package. Linking one original selected its parent entry. The package export preview contained exactly one entry/one original reference, then generated the evidence ZIP with a completion notice. |
| Expense save failure and retry | Draft and private note remained visible after the injected failure. Retry returned to the timeline with exactly one new entry. |
| Failed case switch | The previous case remained selected; the save error stayed visible. |
| Successful case switch | The second case timeline showed only its one record. The primary case record and private note were absent. Switching back restored its separate records. |
| Briefcase private search | Searching the private fixture entry's unique text produced zero shareable results. |
| Missing original check | The selected original showed “Needs attention,” zero verified and one failure. Restoring the fixture bytes and retrying produced one verified/zero failures using actual SHA-256/size checks. |
| Briefcase → export review | Only the selected order-source entry appeared in the report preview, with its one original-file reference. Other entries remained unselected. |
| Explicit custody interval | Saving 08:00–20:00 at the recorded offset created one source entry. The selected child showed 12 covered hours, 108 unknown hours and a 120-hour period. The percentage denominator was the 12 unambiguous recorded hours. |
| Responsive layout | Welcome/capture/calculator at 375 px and Briefcase at 1024 px remained readable and reachable. No document-level horizontal overflow was observed in the inspected screens. Full-page screenshots were visually inspected. |
| Runtime errors | The inspected browser's error log was empty at the custody-check checkpoint. This is not an assertion about every route or deployment. |

## Defects identified during verification

- Blank optional expense reimbursements had become `USD 0.00`. The capture model now preserves `null`, shows “Not recorded,” reports amount coverage and computes balances only from records with both amounts present. A regression test distinguishes unknown, confirmed zero and incomplete pairs.
- Review found a native sharing race after the asynchronous availability check. The delivery helper now rechecks the account/case guard before creating or sharing a plaintext artifact. Native-port regression tests verify cancellation before file creation and temporary-file removal after sharing success/failure.
- Rendered official forms showed checked field values without visible check marks in some viewers. The PDF generator now supplies explicit visible appearances and embeds the text font. All five generated pages were rendered and visually reviewed, with repeated captions and final-text sentinels checked separately.
- The fixture's empty-account reset control canceled its own navigation by immediately reloading. Its corrected control was exercised successfully through first-case setup and capture.
- Form PDF generation rejected its own save/sync because it compared object references. Preparation now pins the selected draft and source content, permits unchanged sync receipts, and still rejects actual edits, privacy changes and account/case changes. The failed browser flow was repeated successfully after this correction; regression tests include sync reference replacement during PDF generation.
- Native review found incorrect Web Locks detection under React Native's `window` alias and an older snapshot loading during a pending save. Platform-specific detection and serialized same-account reads/writes now have native-port regression coverage.
- Temporary native selections and exports now register app-cache paths before use and retain failed cleanup for startup retry with a global notice. Tests cover cancellation, interrupted work, registration failures and protected active selections. No native hardware cleanup claim is made.

## Required release checks

Separately, the final actual Expo export was served locally on port 8790 with its configured clean URLs and entry rewrite. Sign-in rendered, empty email input was rejected, and signed-out `/forms` and a direct `/entry/:id` navigation redirected to `/auth`. No browser errors were observed in that check. All exported file bytes and referenced assets passed the local artifact audit. No authenticated production journey or hosted-CDN behavior was exercised.

Run the account → case → capture with original → reload → review → PDF/ZIP flow on the actual Expo export and managed project. Include a second account, second-device recovery, interruption/retry, native cancellation/file cleanup, camera/microphone, native sharing and PDF-editor compatibility. Verify deep-link reloads and Auth confirmation/reset redirects on the chosen hostname. The temporary browser fixture cannot establish those results.
