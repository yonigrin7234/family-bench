# Preserved migration inputs

These SQL files are historical source inputs, not pending deployable migrations.
Their exact contents were combined, in filename order, into the single active
`*_authenticated_case_foundation.sql` migration. Only the hardened input's outer
BEGIN/COMMIT were removed when nesting its body in the composite transaction.
The composite also revokes API-role execution of the existing managed RLS event
function when present, preserving the event trigger itself.

The two May files were tracked locally but were absent from the restored target's
44 migration records. Keeping them outside `supabase/migrations` preserves their
review history without representing them as separately pending deployments. No
existing remote ledger entries are inserted, removed, or rewritten by this change.
Do not execute these files independently or move them back into active migrations.

See [the migration notes](../../docs/authenticated-case-sync.md) for deployment and
verification limits. The active composite's filename must match the actual version
recorded by the migration tool after application.
