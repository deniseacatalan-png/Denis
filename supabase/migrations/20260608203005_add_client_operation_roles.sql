alter table public.clients
  drop constraint if exists clients_operation_check;

alter table public.clients
  alter column operation set default 'comprador';

update public.clients
set
  operation = case
    when operation in ('comprador', 'vendedor', 'locador', 'inquilino') then operation
    when operation = 'comprar' and is_owner then 'vendedor'
    when operation = 'comprar' then 'comprador'
    when operation in ('alquilar', 'temporada') and is_owner then 'locador'
    when operation in ('alquilar', 'temporada') then 'inquilino'
    when is_owner then 'vendedor'
    else 'comprador'
  end,
  is_owner = case
    when operation in ('vendedor', 'locador') then true
    when operation in ('comprador', 'inquilino') then false
    when operation = 'comprar' then is_owner
    when operation in ('alquilar', 'temporada') then is_owner
    else is_owner
  end;

alter table public.clients
  add constraint clients_operation_check
  check (operation in ('comprador', 'vendedor', 'locador', 'inquilino'));
