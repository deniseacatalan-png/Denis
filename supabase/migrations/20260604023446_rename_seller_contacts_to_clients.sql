alter table if exists public.seller_contacts rename to clients;

alter table if exists public.clients rename constraint seller_contacts_pkey to clients_pkey;
alter table if exists public.clients rename constraint seller_contacts_created_by_fkey to clients_created_by_fkey;
alter table if exists public.clients rename constraint seller_contacts_updated_by_fkey to clients_updated_by_fkey;
alter table if exists public.clients rename constraint seller_contacts_operation_check to clients_operation_check;
alter table if exists public.clients rename constraint seller_contacts_status_check to clients_status_check;

alter index if exists public.seller_contacts_created_at_idx rename to clients_created_at_idx;
alter index if exists public.seller_contacts_status_operation_idx rename to clients_status_operation_idx;
alter index if exists public.seller_contacts_created_by_idx rename to clients_created_by_idx;

alter trigger seller_contacts_set_updated_at on public.clients rename to clients_set_updated_at;

drop policy if exists "Internal users can read seller contacts" on public.clients;
drop policy if exists "Internal users can create seller contacts" on public.clients;
drop policy if exists "Internal users can update seller contacts" on public.clients;
drop policy if exists "Internal users can read clients" on public.clients;
drop policy if exists "Internal users can create clients" on public.clients;
drop policy if exists "Internal users can update clients" on public.clients;

alter table public.clients enable row level security;

revoke all on public.clients from anon;
revoke all on public.clients from authenticated;
grant select, insert, update on public.clients to authenticated;

create policy "Internal users can read clients"
on public.clients
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

create policy "Internal users can create clients"
on public.clients
for insert
to authenticated
with check (
  ((select public.is_admin()) or (select public.is_seller()))
  and created_by = (select auth.uid())
);

create policy "Internal users can update clients"
on public.clients
for update
to authenticated
using ((select public.is_admin()) or (select public.is_seller()))
with check ((select public.is_admin()) or (select public.is_seller()));
