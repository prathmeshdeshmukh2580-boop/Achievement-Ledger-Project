-- ==============================================================================
-- ACHIEVEMENT HUB: COMPLETE BACKEND MIGRATION
-- Compatible with Supabase SQL Editor
-- Tables: profiles, achievements, platform_links, platform_stats
-- Storage: certificates (private bucket with per-user folder isolation)
-- Auth: Automatic profile creation trigger on signup
-- Row Level Security (RLS) on all tables (SELECT, INSERT, UPDATE, DELETE)
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  user_id uuid references auth.users on delete cascade,
  email text not null,
  "fullName" text,
  full_name text,
  "yearOfStudy" text,
  year_of_study text,
  branch text,
  state text,
  district text,
  city text,
  college text,
  "customCollege" text,
  custom_college text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to synchronize camelCase and snake_case columns automatically
create or replace function public.sync_profile_columns()
returns trigger as $$
begin
  NEW.user_id := coalesce(NEW.user_id, NEW.id, auth.uid());
  NEW.id := coalesce(NEW.id, NEW.user_id, auth.uid());
  NEW.full_name := coalesce(NEW.full_name, NEW."fullName");
  NEW."fullName" := coalesce(NEW."fullName", NEW.full_name);
  NEW.year_of_study := coalesce(NEW.year_of_study, NEW."yearOfStudy");
  NEW."yearOfStudy" := coalesce(NEW."yearOfStudy", NEW.year_of_study);
  NEW.custom_college := coalesce(NEW.custom_college, NEW."customCollege");
  NEW."customCollege" := coalesce(NEW."customCollege", NEW.custom_college);
  NEW.updated_at := timezone('utc'::text, now());
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists tr_sync_profile_columns on public.profiles;
create trigger tr_sync_profile_columns
  before insert or update on public.profiles
  for each row execute function public.sync_profile_columns();

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Profiles SELECT policy" on public.profiles;
drop policy if exists "Profiles INSERT policy" on public.profiles;
drop policy if exists "Profiles UPDATE policy" on public.profiles;
drop policy if exists "Profiles DELETE policy" on public.profiles;

create policy "Profiles SELECT policy"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() = user_id);

create policy "Profiles INSERT policy"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() = user_id);

create policy "Profiles UPDATE policy"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() = user_id);

create policy "Profiles DELETE policy"
  on public.profiles for delete
  using (auth.uid() = id or auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 2. ACHIEVEMENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.achievements (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  achievement_title text not null,
  event_name text not null,
  issuer text not null,
  category text not null,
  achievement_type text not null,
  position text,
  date text not null,
  recipient_name text,
  credential_id text,
  platform text,
  verification_url text,
  summary text not null,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on achievements
alter table public.achievements enable row level security;

-- Drop existing policies if any
drop policy if exists "Achievements SELECT policy" on public.achievements;
drop policy if exists "Achievements INSERT policy" on public.achievements;
drop policy if exists "Achievements UPDATE policy" on public.achievements;
drop policy if exists "Achievements DELETE policy" on public.achievements;

create policy "Achievements SELECT policy"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "Achievements INSERT policy"
  on public.achievements for insert
  with check (auth.uid() = user_id);

create policy "Achievements UPDATE policy"
  on public.achievements for update
  using (auth.uid() = user_id);

create policy "Achievements DELETE policy"
  on public.achievements for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 3. PLATFORM_LINKS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.platform_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  platform text not null,
  username text not null,
  profile_url text,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, platform)
);

-- Enable RLS on platform_links
alter table public.platform_links enable row level security;

-- Drop existing policies if any
drop policy if exists "Platform_links SELECT policy" on public.platform_links;
drop policy if exists "Platform_links INSERT policy" on public.platform_links;
drop policy if exists "Platform_links UPDATE policy" on public.platform_links;
drop policy if exists "Platform_links DELETE policy" on public.platform_links;

create policy "Platform_links SELECT policy"
  on public.platform_links for select
  using (auth.uid() = user_id);

create policy "Platform_links INSERT policy"
  on public.platform_links for insert
  with check (auth.uid() = user_id);

create policy "Platform_links UPDATE policy"
  on public.platform_links for update
  using (auth.uid() = user_id);

create policy "Platform_links DELETE policy"
  on public.platform_links for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 4. PLATFORM_STATS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.platform_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  platform text,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on platform_stats
alter table public.platform_stats enable row level security;

-- Drop existing policies if any
drop policy if exists "Platform_stats SELECT policy" on public.platform_stats;
drop policy if exists "Platform_stats INSERT policy" on public.platform_stats;
drop policy if exists "Platform_stats UPDATE policy" on public.platform_stats;
drop policy if exists "Platform_stats DELETE policy" on public.platform_stats;

create policy "Platform_stats SELECT policy"
  on public.platform_stats for select
  using (auth.uid() = user_id);

create policy "Platform_stats INSERT policy"
  on public.platform_stats for insert
  with check (auth.uid() = user_id);

create policy "Platform_stats UPDATE policy"
  on public.platform_stats for update
  using (auth.uid() = user_id);

create policy "Platform_stats DELETE policy"
  on public.platform_stats for delete
  using (auth.uid() = user_id);

-- Backward compatibility view for any legacy query hitting platform_profiles
create or replace view public.platform_profiles as
  select user_id, stats, updated_at from public.platform_stats;


-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC PROFILE CREATION AT SIGNUP (TRIGGER)
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    user_id,
    email,
    "fullName",
    full_name,
    "yearOfStudy",
    year_of_study,
    branch,
    state,
    district,
    city,
    college,
    "customCollege",
    custom_college,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'yearOfStudy', new.raw_user_meta_data->>'year_of_study', '1st Year'),
    coalesce(new.raw_user_meta_data->>'yearOfStudy', new.raw_user_meta_data->>'year_of_study', '1st Year'),
    coalesce(new.raw_user_meta_data->>'branch', 'Engineering'),
    coalesce(new.raw_user_meta_data->>'state', ''),
    coalesce(new.raw_user_meta_data->>'district', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'college', ''),
    new.raw_user_meta_data->>'customCollege',
    new.raw_user_meta_data->>'custom_college',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (id) do update set
    email = excluded.email,
    "fullName" = coalesce(nullif(excluded."fullName", ''), public.profiles."fullName"),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    "yearOfStudy" = coalesce(nullif(excluded."yearOfStudy", ''), public.profiles."yearOfStudy"),
    year_of_study = coalesce(nullif(excluded.year_of_study, ''), public.profiles.year_of_study),
    branch = coalesce(nullif(excluded.branch, ''), public.profiles.branch),
    state = coalesce(nullif(excluded.state, ''), public.profiles.state),
    district = coalesce(nullif(excluded.district, ''), public.profiles.district),
    city = coalesce(nullif(excluded.city, ''), public.profiles.city),
    college = coalesce(nullif(excluded.college, ''), public.profiles.college),
    "customCollege" = coalesce(excluded."customCollege", public.profiles."customCollege"),
    custom_college = coalesce(excluded.custom_college, public.profiles.custom_college),
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ------------------------------------------------------------------------------
-- 6. PRIVATE STORAGE BUCKET "certificates"
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- Enable RLS policies on storage.objects for certificates bucket
drop policy if exists "Certificates INSERT policy" on storage.objects;
drop policy if exists "Certificates SELECT policy" on storage.objects;
drop policy if exists "Certificates UPDATE policy" on storage.objects;
drop policy if exists "Certificates DELETE policy" on storage.objects;

create policy "Certificates INSERT policy"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Certificates SELECT policy"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Certificates UPDATE policy"
  on storage.objects for update
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Certificates DELETE policy"
  on storage.objects for delete
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ------------------------------------------------------------------------------
-- 7. PERMISSIONS & GRANTS
-- ------------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant all on table public.profiles to anon, authenticated, service_role;
grant all on table public.achievements to anon, authenticated, service_role;
grant all on table public.platform_links to anon, authenticated, service_role;
grant all on table public.platform_stats to anon, authenticated, service_role;
grant all on table public.platform_profiles to anon, authenticated, service_role;

grant all on all sequences in schema public to anon, authenticated, service_role;
