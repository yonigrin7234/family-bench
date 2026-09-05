"""Recreate inspected schema metadata in an isolated test cluster; no row data."""
import json
import sys
from pathlib import Path

metadata = json.loads(Path(__file__).with_name('inspected-schema.json').read_text())
tables = {}
for column in metadata['columns']:
    tables.setdefault(column['table'], []).append(column)

def identifier(value):
    return '"' + value.replace('"', '""') + '"'

sql = [
    '-- Generated from read-only catalog inspection of the restored target.',
    '-- Never run this fixture against an existing or remote database.',
    'create table public.voice_entries (id uuid primary key, user_id uuid, case_id uuid);',
    'alter table public.voice_entries enable row level security;',
]
for table, columns in tables.items():
    definitions = []
    for column in columns:
        line = identifier(column['column']) + ' ' + column['type']
        if column['default'] is not None:
            line += ' default ' + column['default']
        if column['not_null']:
            line += ' not null'
        definitions.append(line)
    sql.append('create table public.' + identifier(table) + ' (\n  ' + ',\n  '.join(definitions) + '\n);')
    sql.append('alter table public.' + identifier(table) + ' enable row level security;')

# Referenced primary keys exist before foreign keys are applied.
for constraint in sorted(metadata['constraints'], key=lambda item: item['definition'].startswith('FOREIGN KEY')):
    sql.append('alter table public.' + identifier(constraint['table']) + ' add constraint ' +
               identifier(constraint['name']) + ' ' + constraint['definition'] + ';')
sql.append('create policy "Users own profiles" on public.profiles for all to public using ((select auth.uid()) = id);')
sql.extend([
    'create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin null; end; $$;',
    'grant execute on function public.rls_auto_enable() to public, anon, authenticated;',
    'create event trigger fixture_rls_auto_enable on ddl_command_end execute function public.rls_auto_enable();',
])
Path(sys.argv[1]).write_text('\n'.join(sql) + '\n')
