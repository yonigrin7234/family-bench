# Official California templates

The app currently fills MC-031 (revision July 1, 2005, one page) and selected FL-300 fields (revision July 1, 2025, four pages). The official form pages and current revision dates were checked September 5, 2026:

- [MC-031 official information](https://selfhelp.courts.ca.gov/jcc-form/MC-031) and [official PDF](https://www.courts.ca.gov/documents/mc031.pdf).
- [FL-300 official information](https://selfhelp.courts.ca.gov/jcc-form/FL-300) and [July 2025 official PDF](https://courts.ca.gov/system/files?file=2025-07%2Ffl300.pdf). The older `/documents/fl300.pdf` URL can resolve to an obsolete revision; it is not used here.

`originals/` contains the untouched downloads. `manifest.json` pins their SHA-256 hashes, source URLs, revision dates, page counts, and the derived working-copy hashes. The PDFs are bundled, so private case values are not sent to the court website during generation.

Both official downloads have permission encryption. `scripts/prepare-court-forms.py` uses PDFium's supported removal of that encryption, then removes XFA, active JavaScript actions and Adobe Reader usage-rights data from working copies. It preserves the editable AcroForm field tree and static official artwork. All five blank pages were rendered at 1.5× and had identical original/derived pixel hashes in PDFium's AcroForm renderer; that renderer does not execute XFA. The app verifies the derived hash before filling anything.

Filling preserves the complete form and interactive fields, embeds the existing Inter font, checks actual glyph geometry, and creates visible X appearances for mapped checkboxes. It fills every repeated caption explicitly and makes those copied captions editable independently, since automatic JavaScript propagation is disabled. Canonical values and appearances are verified after saving. No signature or court-assigned field is filled. Text that exceeds a field stops generation; it is not truncated or reduced to a tiny font. Unsupported font characters also stop generation. Template Save/Print/Clear toolbar scripts are inactive; use PDF viewer controls and do not rely on the visible Clear button to erase copies.

The FL-300 guide covers caption/contact, court information, notice recipients, existing restraining-order facts, up to four child rows, custody/parenting-time requests and changes, other orders, and supporting facts. Support, property, fees, emergency requests, additional attachments, hearing assignment, signing, service, e-filing, and acceptance are outside this initial workflow. MC-031 must be attached to another form or court paper. The user selects requests and reviews/edits factual inputs; generation provides no legal determination.

Validation commands, from the repository root:

```sh
node --import tsx --test lib/forms/__tests__/forms.test.ts
node --import tsx scripts/render-court-form-fixtures.ts /private/tmp/family-bench-form-qa
python3 scripts/prepare-court-forms.py
```

The preparation script requires `pypdfium2` and `pypdf`; it re-creates the working copies and updates their hashes. Rebuilding templates is an intentional artifact change requiring review, field tests and all-page rendering. The fixture command writes only conspicuously marked synthetic PDFs. Render every page of both fixture PDFs after changing geometry, field mappings, appearances, font behavior or templates. Tests cover source hashes, field mapping/types, canonical values and checkbox appearance states, unchanged court sections, real dates, contradictory inputs, overflow, unsupported characters, stale context, and source privacy/case/owner filtering. Browser/native form-editor compatibility and live device sharing still require their separate end-to-end checks.
