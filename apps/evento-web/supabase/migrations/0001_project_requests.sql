-- EVENTO web — project request intake.
--
-- STATUS: NOT APPLIED. This migration is source-controlled but has deliberately
-- not been run against any Supabase project. The EVENTO backend
-- (ref jaxhaiaftpegcodkzaus) is shared with the EVENTO Mobile product, so
-- applying it is a gated action that needs owner approval and a rollback plan.
-- See apps/evento-web/ARCHITECTURE.md, "Applying the migration".
--
-- Rollback: DROP TABLE public.project_requests;

create extension if not exists "pgcrypto";

create table if not exists public.project_requests (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Null for anonymous submissions from the public form. Set automatically to
  -- the caller when a signed-in client submits, which is what binds a request
  -- to the client portal.
  owner_id       uuid references auth.users (id) on delete set null,

  name           text not null check (char_length(name) between 2 and 120),
  email          text not null check (char_length(email) between 3 and 254),
  organization   text check (char_length(organization) <= 160),

  service_id     text not null,
  engagement_id  text not null,
  budget         text check (char_length(budget) <= 80),
  timeline       text check (char_length(timeline) <= 80),
  summary        text not null check (char_length(summary) between 40 and 4000),
  locale         text not null default 'ar' check (locale in ('ar', 'en')),

  -- Mirrors the published delivery pipeline in data/delivery-stages.json.
  stage          text not null default 'intake'
                 check (stage in ('intake','discovery','architecture','build',
                                  'verification','preview','release','operate'))
);

create index if not exists project_requests_owner_created_idx
  on public.project_requests (owner_id, created_at desc);

-- Bind ownership server-side. A client must not be able to claim another
-- account's request by posting an owner_id.
create or replace function public.set_project_request_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.owner_id := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_requests_set_owner on public.project_requests;
create trigger project_requests_set_owner
  before insert on public.project_requests
  for each row execute function public.set_project_request_owner();

create or replace function public.touch_project_request()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_requests_touch on public.project_requests;
create trigger project_requests_touch
  before update on public.project_requests
  for each row execute function public.touch_project_request();

-- Row level security -------------------------------------------------------

alter table public.project_requests enable row level security;

-- Anyone may submit. The trigger above decides ownership, so an anonymous
-- insert simply produces an unowned row.
drop policy if exists project_requests_insert_any on public.project_requests;
create policy project_requests_insert_any
  on public.project_requests
  for insert
  to anon, authenticated
  with check (true);

-- A signed-in client reads only their own requests. Anonymous callers read
-- nothing: the reference number is a support handle, not an access token.
drop policy if exists project_requests_select_own on public.project_requests;
create policy project_requests_select_own
  on public.project_requests
  for select
  to authenticated
  using (owner_id = auth.uid());

-- No update or delete policy exists, so clients cannot alter or remove a
-- submitted request. Stage transitions are performed by operators through the
-- service role outside this application.
