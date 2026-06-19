create table if not exists public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.property_videos add column if not exists sort_order integer not null default 0;
alter table public.property_videos add column if not exists created_at timestamptz not null default now();

create index if not exists property_videos_property_idx on public.property_videos (property_id, sort_order);

alter table public.property_videos enable row level security;

drop policy if exists "Public can read published property videos" on public.property_videos;
create policy "Public can read published property videos"
on public.property_videos
for select
using (
  exists (
    select 1
    from public.properties
    where properties.id = property_videos.property_id
      and properties.is_published = true
  )
);

drop policy if exists "Admins can manage property videos" on public.property_videos;
create policy "Admins can manage property videos"
on public.property_videos
for all
using (public.is_admin())
with check (public.is_admin());
