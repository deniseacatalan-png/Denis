alter table public.clients
add column if not exists is_owner boolean not null default false;
