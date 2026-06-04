create table if not exists public.seller_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  full_name text not null default '',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_profiles add column if not exists username text;
alter table public.seller_profiles add column if not exists email text;
alter table public.seller_profiles add column if not exists full_name text not null default '';
alter table public.seller_profiles add column if not exists is_active boolean not null default true;
alter table public.seller_profiles add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.seller_profiles add column if not exists created_at timestamptz not null default now();
alter table public.seller_profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists seller_profiles_username_key on public.seller_profiles (username);
create unique index if not exists seller_profiles_email_key on public.seller_profiles (email);

create table if not exists public.seller_contacts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  operation text not null default 'alquilar',
  zone text not null default '',
  budget text not null default '',
  rooms text not null default '',
  status text not null default 'nuevo',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_contacts_operation_check check (operation in ('comprar', 'alquilar')),
  constraint seller_contacts_status_check check (status in ('nuevo', 'contactado', 'visitando', 'cerrado', 'pausado'))
);

alter table public.seller_contacts add column if not exists created_by uuid references auth.users(id) on delete restrict;
alter table public.seller_contacts add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.seller_contacts add column if not exists full_name text;
alter table public.seller_contacts add column if not exists phone text not null default '';
alter table public.seller_contacts add column if not exists email text not null default '';
alter table public.seller_contacts add column if not exists operation text not null default 'alquilar';
alter table public.seller_contacts add column if not exists zone text not null default '';
alter table public.seller_contacts add column if not exists budget text not null default '';
alter table public.seller_contacts add column if not exists rooms text not null default '';
alter table public.seller_contacts add column if not exists status text not null default 'nuevo';
alter table public.seller_contacts add column if not exists notes text not null default '';
alter table public.seller_contacts add column if not exists created_at timestamptz not null default now();
alter table public.seller_contacts add column if not exists updated_at timestamptz not null default now();

alter table public.seller_contacts
  drop constraint if exists seller_contacts_operation_check;

alter table public.seller_contacts
  add constraint seller_contacts_operation_check
  check (operation in ('comprar', 'alquilar'));

alter table public.seller_contacts
  drop constraint if exists seller_contacts_status_check;

alter table public.seller_contacts
  add constraint seller_contacts_status_check
  check (status in ('nuevo', 'contactado', 'visitando', 'cerrado', 'pausado'));

create index if not exists seller_contacts_created_at_idx on public.seller_contacts (created_at desc);
create index if not exists seller_contacts_status_operation_idx on public.seller_contacts (status, operation, updated_at desc);
create index if not exists seller_contacts_created_by_idx on public.seller_contacts (created_by);

drop trigger if exists seller_profiles_set_updated_at on public.seller_profiles;
create trigger seller_profiles_set_updated_at
before update on public.seller_profiles
for each row execute function public.set_updated_at();

drop trigger if exists seller_contacts_set_updated_at on public.seller_contacts;
create trigger seller_contacts_set_updated_at
before update on public.seller_contacts
for each row execute function public.set_updated_at();

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.seller_profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

grant execute on function public.is_seller() to anon, authenticated;

alter table public.seller_profiles enable row level security;
alter table public.seller_contacts enable row level security;

revoke all on public.seller_profiles from anon;
revoke all on public.seller_contacts from anon;

grant select on public.seller_profiles to authenticated;
grant select, insert, update on public.seller_contacts to authenticated;

drop policy if exists "Admins can read seller profiles" on public.seller_profiles;
create policy "Admins can read seller profiles"
on public.seller_profiles
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Sellers can read own active profile" on public.seller_profiles;
create policy "Sellers can read own active profile"
on public.seller_profiles
for select
to authenticated
using (id = (select auth.uid()) and is_active = true);

drop policy if exists "Internal users can read seller contacts" on public.seller_contacts;
create policy "Internal users can read seller contacts"
on public.seller_contacts
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

drop policy if exists "Internal users can create seller contacts" on public.seller_contacts;
create policy "Internal users can create seller contacts"
on public.seller_contacts
for insert
to authenticated
with check (
  ((select public.is_admin()) or (select public.is_seller()))
  and created_by = (select auth.uid())
);

drop policy if exists "Internal users can update seller contacts" on public.seller_contacts;
create policy "Internal users can update seller contacts"
on public.seller_contacts
for update
to authenticated
using ((select public.is_admin()) or (select public.is_seller()))
with check ((select public.is_admin()) or (select public.is_seller()));
