create table public.reverse_distributors (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  code character varying(50) not null,
  contact_email character varying(255) null,
  contact_phone character varying(20) null,
  address jsonb null,
  portal_url text null,
  supported_formats text[] null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint reverse_distributors_pkey primary key (id),
  constraint reverse_distributors_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_reverse_distributors_name on public.reverse_distributors using btree (name) TABLESPACE pg_default;

create index IF not exists idx_reverse_distributors_code on public.reverse_distributors using btree (code) TABLESPACE pg_default;

create index IF not exists idx_reverse_distributors_active on public.reverse_distributors using btree (is_active) TABLESPACE pg_default;