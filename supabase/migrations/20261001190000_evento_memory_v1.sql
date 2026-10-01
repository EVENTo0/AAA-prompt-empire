-- EVENTO Memory Architecture v1
create extension if not exists pgcrypto;

create table if not exists public.evento_memory_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  memory_type text not null check (memory_type in ('fact','decision','lesson','pattern','anti_pattern','rule','source_claim','asset_knowledge')),
  domain text not null,
  summary text not null,
  rule_text text,
  trigger_text text,
  project_id text,
  scope text not null check (scope in ('task','project','domain','evento_shared')),
  validation_state text not null default 'observed'
    check (validation_state in ('observed','proposed','supported','verified','active','deprecated','superseded')),
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  applies_to text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  superseded_by uuid references public.evento_memory_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at timestamptz
);

create table if not exists public.evento_memory_evidence (
  id uuid primary key default gen_random_uuid(),
  memory_item_id uuid not null references public.evento_memory_items(id) on delete cascade,
  kind text not null check (kind in ('url','document','commit','pr','ci','test','build','database_record','manual_review')),
  ref text not null,
  note text,
  created_at timestamptz not null default now(),
  unique(memory_item_id, kind, ref)
);

create index if not exists evento_memory_items_domain_idx on public.evento_memory_items(domain);
create index if not exists evento_memory_items_project_idx on public.evento_memory_items(project_id);
create index if not exists evento_memory_items_state_idx on public.evento_memory_items(validation_state);
create index if not exists evento_memory_items_type_idx on public.evento_memory_items(memory_type);
create index if not exists evento_memory_items_metadata_gin on public.evento_memory_items using gin(metadata);

alter table public.evento_memory_items enable row level security;
alter table public.evento_memory_evidence enable row level security;

-- Deliberately no broad client policies in v1.
-- Service-side tooling may access through a secured server boundary.
-- Read policies should be added only when a publication model is defined.
