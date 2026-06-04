create table if not exists public.property_notes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  body text not null check (btrim(body) <> ''),
  created_by uuid not null references auth.users(id) on delete restrict,
  author_role text not null check (author_role in ('admin', 'seller')),
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  body text not null check (btrim(body) <> ''),
  created_by uuid not null references auth.users(id) on delete restrict,
  author_role text not null check (author_role in ('admin', 'seller')),
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  file_name text not null check (btrim(file_name) <> ''),
  file_url text not null check (btrim(file_url) <> ''),
  file_type text not null default '',
  file_size bigint not null default 0 check (file_size >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  author_role text not null check (author_role in ('admin', 'seller')),
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_name text not null check (btrim(file_name) <> ''),
  file_url text not null check (btrim(file_url) <> ''),
  file_type text not null default '',
  file_size bigint not null default 0 check (file_size >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  author_role text not null check (author_role in ('admin', 'seller')),
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists property_notes_property_created_at_idx
on public.property_notes (property_id, created_at desc);

create index if not exists client_notes_client_created_at_idx
on public.client_notes (client_id, created_at desc);

create index if not exists property_documents_property_created_at_idx
on public.property_documents (property_id, created_at desc);

create index if not exists client_documents_client_created_at_idx
on public.client_documents (client_id, created_at desc);

alter table public.property_notes enable row level security;
alter table public.client_notes enable row level security;
alter table public.property_documents enable row level security;
alter table public.client_documents enable row level security;

revoke all on public.property_notes from anon;
revoke all on public.client_notes from anon;
revoke all on public.property_documents from anon;
revoke all on public.client_documents from anon;

revoke all on public.property_notes from authenticated;
revoke all on public.client_notes from authenticated;
revoke all on public.property_documents from authenticated;
revoke all on public.client_documents from authenticated;

grant select, insert on public.property_notes to authenticated;
grant select, insert on public.client_notes to authenticated;
grant select, insert on public.property_documents to authenticated;
grant select, insert on public.client_documents to authenticated;

drop policy if exists "Admins can read property notes" on public.property_notes;
create policy "Admins can read property notes"
on public.property_notes
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can create property notes" on public.property_notes;
create policy "Admins can create property notes"
on public.property_notes
for insert
to authenticated
with check (
  (select public.is_admin())
  and created_by = (select auth.uid())
  and author_role = 'admin'
);

drop policy if exists "Internal users can read client notes" on public.client_notes;
create policy "Internal users can read client notes"
on public.client_notes
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

drop policy if exists "Internal users can create client notes" on public.client_notes;
create policy "Internal users can create client notes"
on public.client_notes
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    ((select public.is_admin()) and author_role = 'admin')
    or ((select public.is_seller()) and author_role = 'seller')
  )
);

drop policy if exists "Admins can read property documents" on public.property_documents;
create policy "Admins can read property documents"
on public.property_documents
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can create property documents" on public.property_documents;
create policy "Admins can create property documents"
on public.property_documents
for insert
to authenticated
with check (
  (select public.is_admin())
  and created_by = (select auth.uid())
  and author_role = 'admin'
);

drop policy if exists "Internal users can read client documents" on public.client_documents;
create policy "Internal users can read client documents"
on public.client_documents
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

drop policy if exists "Internal users can create client documents" on public.client_documents;
create policy "Internal users can create client documents"
on public.client_documents
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    ((select public.is_admin()) and author_role = 'admin')
    or ((select public.is_seller()) and author_role = 'seller')
  )
);
