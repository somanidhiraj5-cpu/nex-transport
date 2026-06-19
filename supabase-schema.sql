-- Run this in your Supabase project → SQL Editor

create table if not exists cars (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  model text,
  driver_name text,
  driver_phone text,
  status text not null default 'Empty',
  capacity integer not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone text not null,
  notes text,
  has_arrival boolean not null default false,
  arrival_flight text,
  arrival_airline text,
  arrival_date date,
  arrival_time time,
  arrival_car_id uuid references cars(id) on delete set null,
  group_size integer not null default 1,
  table_name text,
  has_departure boolean not null default false,
  departure_flight text,
  departure_airline text,
  departure_date date,
  departure_time time,
  departure_car_id uuid references cars(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table guests enable row level security;
alter table cars enable row level security;

-- Guests: anyone (anon) can INSERT (public form), service role handles everything else
create policy "guests_anon_insert" on guests
  for insert to anon with check (true);

create policy "guests_service_all" on guests
  for all to service_role using (true) with check (true);

create policy "cars_service_all" on cars
  for all to service_role using (true) with check (true);

-- Enable Realtime on both tables (optional, for live dashboard updates)
-- You can enable this in Supabase Dashboard → Database → Replication → Tables
