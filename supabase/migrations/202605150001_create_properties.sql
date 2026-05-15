create extension if not exists postgis;
create extension if not exists unaccent;

create table if not exists public.properties (
  id bigint generated always as identity primary key,
  external_id text unique,
  title text not null,
  slug text generated always as (
    regexp_replace(lower(unaccent(title)), '[^a-z0-9]+', '-', 'g')
  ) stored,
  description_html text not null default '',
  description_text text not null default '',
  latitude double precision,
  longitude double precision,
  altitude_m double precision,
  location geography(point, 4326) generated always as (
    case
      when latitude is null or longitude is null then null
      else st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_slug_idx on public.properties(slug);
create index if not exists properties_location_idx on public.properties using gist(location);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute procedure public.set_updated_at();
