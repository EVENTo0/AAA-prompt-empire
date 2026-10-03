-- EVENTO Memory v1 isolated security assertions.
-- Run after applying 20261001190000_evento_memory_v1.sql in a local/test Supabase database.

do $$
declare
  items_rls boolean;
  evidence_rls boolean;
begin
  select c.relrowsecurity into items_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'evento_memory_items';

  select c.relrowsecurity into evidence_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'evento_memory_evidence';

  if items_rls is distinct from true then
    raise exception 'evento_memory_items must have RLS enabled';
  end if;
  if evidence_rls is distinct from true then
    raise exception 'evento_memory_evidence must have RLS enabled';
  end if;

  if has_table_privilege('anon', 'public.evento_memory_items', 'SELECT')
     or has_table_privilege('anon', 'public.evento_memory_items', 'INSERT')
     or has_table_privilege('authenticated', 'public.evento_memory_items', 'SELECT')
     or has_table_privilege('authenticated', 'public.evento_memory_items', 'INSERT') then
    raise exception 'memory items must not expose broad anon/authenticated privileges in v1';
  end if;

  if has_table_privilege('anon', 'public.evento_memory_evidence', 'SELECT')
     or has_table_privilege('anon', 'public.evento_memory_evidence', 'INSERT')
     or has_table_privilege('authenticated', 'public.evento_memory_evidence', 'SELECT')
     or has_table_privilege('authenticated', 'public.evento_memory_evidence', 'INSERT') then
    raise exception 'memory evidence must not expose broad anon/authenticated privileges in v1';
  end if;
end
$$;
