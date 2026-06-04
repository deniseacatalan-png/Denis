alter table if exists public.clients
  drop constraint if exists clients_operation_check;

alter table if exists public.clients
  drop constraint if exists seller_contacts_operation_check;

alter table if exists public.clients
  add constraint clients_operation_check
  check (operation in ('comprar', 'alquilar', 'temporada'));
