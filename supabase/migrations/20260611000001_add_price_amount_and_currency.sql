alter table public.properties add column if not exists price_amount integer;
alter table public.properties add column if not exists currency text not null default 'USD';
