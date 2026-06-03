create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profiles add column if not exists username text;
alter table public.admin_profiles add column if not exists email text;
alter table public.admin_profiles add column if not exists is_active boolean not null default true;
alter table public.admin_profiles add column if not exists created_at timestamptz not null default now();
alter table public.admin_profiles add column if not exists updated_at timestamptz not null default now();

update public.admin_profiles
set username = coalesce(username, nullif(split_part(email, '@', 1), ''), id::text)
where username is null;

create unique index if not exists admin_profiles_username_key on public.admin_profiles (username);
create unique index if not exists admin_profiles_email_key on public.admin_profiles (email) where email is not null;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  kml_id text unique,
  title text not null,
  slug text not null unique,
  location text not null default '',
  price text not null default 'Consultar',
  area text not null default 'Superficie a confirmar',
  category text not null default 'venta' check (category in ('venta', 'alquiler_turistico', 'alquiler_permanente', 'vendido', 'proceso')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  style_color text not null default '',
  marker_color text not null default '#a65774',
  summary text not null default '',
  description_html text not null default '',
  raw_description text not null default '',
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties add column if not exists kml_id text;
alter table public.properties add column if not exists location text not null default '';
alter table public.properties add column if not exists price text not null default 'Consultar';
alter table public.properties add column if not exists area text not null default 'Superficie a confirmar';
alter table public.properties add column if not exists category text not null default 'venta';
alter table public.properties add column if not exists latitude double precision;
alter table public.properties add column if not exists longitude double precision;
alter table public.properties add column if not exists style_color text not null default '';
alter table public.properties add column if not exists marker_color text not null default '#a65774';
alter table public.properties add column if not exists summary text not null default '';
alter table public.properties add column if not exists description_html text not null default '';
alter table public.properties add column if not exists raw_description text not null default '';
alter table public.properties add column if not exists is_published boolean not null default true;
alter table public.properties add column if not exists display_order integer not null default 0;
alter table public.properties add column if not exists created_at timestamptz not null default now();
alter table public.properties add column if not exists updated_at timestamptz not null default now();

update public.properties
set kml_id = kml_placemark_id
where kml_id is null
  and kml_placemark_id is not null;

update public.properties
set is_published = false
where latitude is null
  or longitude is null;

alter table public.properties
  drop constraint if exists properties_category_check;

alter table public.properties
  add constraint properties_category_check
  check (category in ('venta', 'alquiler_turistico', 'alquiler_permanente', 'vendido', 'proceso'));

alter table public.properties
  drop constraint if exists properties_latitude_check;

alter table public.properties
  add constraint properties_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.properties
  drop constraint if exists properties_longitude_check;

alter table public.properties
  add constraint properties_longitude_check
  check (longitude is null or longitude between -180 and 180);

create unique index if not exists properties_kml_id_key on public.properties (kml_id);
create unique index if not exists properties_slug_key on public.properties (slug);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.property_images add column if not exists alt text not null default '';
alter table public.property_images add column if not exists sort_order integer not null default 0;
alter table public.property_images add column if not exists created_at timestamptz not null default now();

update public.property_images
set alt = coalesce(nullif(alt, ''), alt_text, '')
where alt = '';

update public.property_images
set sort_order = display_order
where sort_order = 0
  and display_order is not null;

create index if not exists properties_published_idx on public.properties (is_published, category, display_order, title);
create index if not exists properties_slug_idx on public.properties (slug);
create index if not exists property_images_property_idx on public.property_images (property_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;

drop policy if exists "Admins can read own profile" on public.admin_profiles;
create policy "Admins can read own profile"
on public.admin_profiles
for select
using (id = auth.uid() and is_active = true);

drop policy if exists "Public can read published properties" on public.properties;
create policy "Public can read published properties"
on public.properties
for select
using (is_published = true);

drop policy if exists "Admins can read all properties" on public.properties;
create policy "Admins can read all properties"
on public.properties
for select
using (public.is_admin());

drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties"
on public.properties
for insert
with check (public.is_admin());

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
on public.properties
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
on public.properties
for delete
using (public.is_admin());

drop policy if exists "Public can read published property images" on public.property_images;
create policy "Public can read published property images"
on public.property_images
for select
using (
  exists (
    select 1
    from public.properties
    where properties.id = property_images.property_id
      and properties.is_published = true
  )
);

drop policy if exists "Admins can manage property images" on public.property_images;
create policy "Admins can manage property images"
on public.property_images
for all
using (public.is_admin())
with check (public.is_admin());
