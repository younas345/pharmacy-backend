create table public.product_list_items (
  id uuid not null default gen_random_uuid (),
  ndc character varying(50) not null,
  product_name character varying(500) null,
  quantity integer null,
  lot_number character varying(100) null,
  expiration_date date null,
  notes text null,
  added_at timestamp with time zone null default now(),
  added_by uuid null,
  constraint product_list_items_pkey primary key (id),
  constraint product_list_items_added_by_fkey foreign KEY (added_by) references auth.users (id)
) TABLESPACE pg_default;