alter table public.properties
  drop constraint if exists properties_category_check;

alter table public.properties
  add constraint properties_category_check
  check (category in ('venta', 'alquiler_turistico', 'alquiler_permanente', 'vendido', 'proceso'));
