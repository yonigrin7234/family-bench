# Evidence Storage Plan

This is a planning document only. Do not create buckets or storage policies until the Supabase project, RLS posture, and evidence write flow are verified.

## Buckets

Proposed buckets:

- `evidence-originals`
- `evidence-previews` optional

`evidence-originals` stores the captured source file. `evidence-previews` stores thumbnails, redactions, lightweight image previews, OCR renderings, or other derived files.

## Object Paths

Original evidence path convention:

```text
{user_id}/{case_id}/{entry_id}/{attachment_id}/original
```

Derived preview path convention:

```text
{user_id}/{case_id}/{entry_id}/{attachment_id}/preview-{variant}
```

Examples of `preview-{variant}`:

- `preview-thumbnail`
- `preview-redacted`
- `preview-ocr-page-1`

## Database Linkage

Evidence metadata stays in `public.attachments`.

Required linkage fields:

- `attachments.storage_bucket`
- `attachments.storage_path`

`storage_bucket` should be `evidence-originals` for immutable originals. `storage_path` should contain the object path inside that bucket.

Preview and derived file linkage can use a future derived-evidence table or explicit preview columns after the capture and review flow is designed. Do not overload the immutable original row with mutable preview semantics.

## Immutable Original Rule

Original evidence objects are append-only from the product perspective.

Do not overwrite an object in `evidence-originals`. Corrections, replacements, redactions, compression, OCR outputs, or court-ready exports should create separate derived files and preserve the original hash/provenance record.

The `attachments` row for an original should preserve:

- source bucket and path
- file hash
- hash algorithm
- captured timestamp when known
- device/source metadata when available
- immutable evidence identity

## Preview / Derived File Rule

Derived files may be regenerated, but they must not replace the original object.

Derived files should include enough metadata to trace back to the original `attachments.id`, including the transform type and generated timestamp once that table exists.

## Policy Notes

Storage policies should be owner-scoped and path-aware. They should not rely on user-controlled metadata for authorization.

Before creating buckets or policies, inspect:

- existing storage buckets
- existing storage policies
- whether the app will upload directly from Expo or through a server/edge function
- whether originals need stricter write-once behavior enforced outside the client
