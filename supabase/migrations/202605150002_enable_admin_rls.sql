alter table public.properties enable row level security;

create policy if not exists "public_read_properties"
on public.properties
for select
to anon, authenticated
using (true);

create policy if not exists "authenticated_insert_properties"
on public.properties
for insert
to authenticated
with check (true);

create policy if not exists "authenticated_update_properties"
on public.properties
for update
to authenticated
using (true)
with check (true);

create policy if not exists "authenticated_delete_properties"
on public.properties
for delete
to authenticated
using (true);
