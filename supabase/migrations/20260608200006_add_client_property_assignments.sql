create table if not exists public.client_property_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  relationship text not null,
  notes text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_property_assignments_relationship_check
    check (relationship in ('propietario', 'comprador', 'interesado', 'inquilino'))
);

alter table public.client_property_assignments add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.client_property_assignments add column if not exists property_id uuid references public.properties(id) on delete cascade;
alter table public.client_property_assignments add column if not exists relationship text;
alter table public.client_property_assignments add column if not exists notes text not null default '';
alter table public.client_property_assignments add column if not exists created_by uuid references auth.users(id) on delete restrict;
alter table public.client_property_assignments add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.client_property_assignments add column if not exists created_at timestamptz not null default now();
alter table public.client_property_assignments add column if not exists updated_at timestamptz not null default now();

alter table public.client_property_assignments
  alter column client_id set not null,
  alter column property_id set not null,
  alter column relationship set not null,
  alter column created_by set not null;

alter table public.client_property_assignments
  drop constraint if exists client_property_assignments_relationship_check;

alter table public.client_property_assignments
  add constraint client_property_assignments_relationship_check
  check (relationship in ('propietario', 'comprador', 'interesado', 'inquilino'));

create unique index if not exists client_property_assignments_unique_role_idx
on public.client_property_assignments (client_id, property_id, relationship);

create index if not exists client_property_assignments_client_idx
on public.client_property_assignments (client_id, updated_at desc);

create index if not exists client_property_assignments_property_idx
on public.client_property_assignments (property_id, updated_at desc);

drop trigger if exists client_property_assignments_set_updated_at on public.client_property_assignments;
create trigger client_property_assignments_set_updated_at
before update on public.client_property_assignments
for each row execute function public.set_updated_at();

alter table public.client_property_assignments enable row level security;

revoke all on public.client_property_assignments from anon;
revoke all on public.client_property_assignments from authenticated;
grant select, insert, update, delete on public.client_property_assignments to authenticated;

drop policy if exists "Internal users can read client property assignments" on public.client_property_assignments;
create policy "Internal users can read client property assignments"
on public.client_property_assignments
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

drop policy if exists "Internal users can create client property assignments" on public.client_property_assignments;
create policy "Internal users can create client property assignments"
on public.client_property_assignments
for insert
to authenticated
with check (
  ((select public.is_admin()) or (select public.is_seller()))
  and created_by = (select auth.uid())
);

drop policy if exists "Internal users can update client property assignments" on public.client_property_assignments;
create policy "Internal users can update client property assignments"
on public.client_property_assignments
for update
to authenticated
using ((select public.is_admin()) or (select public.is_seller()))
with check ((select public.is_admin()) or (select public.is_seller()));

drop policy if exists "Internal users can delete client property assignments" on public.client_property_assignments;
create policy "Internal users can delete client property assignments"
on public.client_property_assignments
for delete
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));
