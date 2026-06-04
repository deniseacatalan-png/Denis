create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'admin' check (role in ('owner','admin','editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  operation_type text not null default 'sale',
  property_type text,
  status text not null default 'draft',
  short_description text,
  description text,
  location_name text,
  neighborhood text,
  city text not null default 'San Martín de los Andes',
  province text not null default 'Neuquén',
  country text not null default 'Argentina',
  price_amount numeric(14,2),
  price_currency text default 'USD',
  price_label text,
  total_area_m2 numeric(12,2),
  covered_area_m2 numeric(12,2),
  semi_covered_area_m2 numeric(12,2),
  rooms integer,
  bedrooms integer,
  bathrooms integer,
  garages integer,
  amenities text[] not null default '{}',
  services text[] not null default '{}',
  tags text[] not null default '{}',
  featured boolean not null default false,
  display_order integer not null default 0,
  tokko_code text,
  external_reference text,
  kml_placemark_id text,
  kml_folder text,
  kml_raw_description text,
  kml_raw_extended_data jsonb not null default '{}'::jsonb,
  imported_from_kml boolean not null default false,
  last_kml_sync_at timestamptz,
  meta_title text,
  meta_description text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_locations (
  property_id uuid primary key references public.properties(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  altitude double precision,
  address text,
  google_maps_url text,
  kml_geometry_type text,
  kml_coordinates jsonb not null default '[]'::jsonb,
  geojson jsonb,
  bounds jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  storage_path text,
  alt_text text,
  caption text,
  display_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.kml_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  source text default 'google_earth',
  storage_path text,
  status text not null default 'pending',
  imported_count integer not null default 0,
  updated_count integer not null default 0,
  error_message text,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.kml_placemarks (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.kml_imports(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  placemark_id text,
  name text,
  description text,
  folder_path text,
  geometry_type text,
  coordinates jsonb not null default '[]'::jsonb,
  extended_data jsonb not null default '{}'::jsonb,
  raw_placemark jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_slug_idx on public.properties(slug);
create index if not exists property_images_property_order_idx on public.property_images(property_id, display_order);

create or replace trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create or replace trigger property_locations_set_updated_at
before update on public.property_locations
for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_locations enable row level security;
alter table public.property_images enable row level security;
alter table public.kml_imports enable row level security;
alter table public.kml_placemarks enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
  );
$$;

DROP POLICY IF EXISTS "Public can read published properties" ON public.properties;
create policy "Public can read published properties"
on public.properties
for select
to anon, authenticated
using (status = 'published');

DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
create policy "Admins can manage properties"
on public.properties
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

DROP POLICY IF EXISTS "Public can read locations for published properties" ON public.property_locations;
create policy "Public can read locations for published properties"
on public.property_locations
for select
to anon, authenticated
using (exists (select 1 from public.properties p where p.id = property_id and p.status = 'published'));

DROP POLICY IF EXISTS "Admins can manage property locations" ON public.property_locations;
create policy "Admins can manage property locations"
on public.property_locations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

DROP POLICY IF EXISTS "Public can read images for published properties" ON public.property_images;
create policy "Public can read images for published properties"
on public.property_images
for select
to anon, authenticated
using (exists (select 1 from public.properties p where p.id = property_id and p.status = 'published'));

DROP POLICY IF EXISTS "Admins can manage property images" ON public.property_images;
create policy "Admins can manage property images"
on public.property_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

DROP POLICY IF EXISTS "Admins can read admin profiles" ON public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles
for select
to authenticated
using (public.is_admin() or id = auth.uid());

DROP POLICY IF EXISTS "Owners and admins can manage admin profiles" ON public.admin_profiles;
create policy "Owners and admins can manage admin profiles"
on public.admin_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage kml imports" ON public.kml_imports;
create policy "Admins can manage kml imports"
on public.kml_imports
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage kml placemarks" ON public.kml_placemarks;
create policy "Admins can manage kml placemarks"
on public.kml_placemarks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace view public.published_properties_with_location as
select
  p.*,
  l.latitude,
  l.longitude,
  l.google_maps_url,
  l.kml_geometry_type,
  l.kml_coordinates,
  l.geojson
from public.properties p
left join public.property_locations l on l.property_id = p.id
where p.status = 'published';;
