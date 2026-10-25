-- ==============================================================================
-- ACHIEVEMENT HUB: SUPABASE DATABASE SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  year_of_study text not null,
  branch text not null,
  state text not null,
  district text not null,
  city text not null,
  college text not null,
  custom_college text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies: Each user can read and update only their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- 2. ACHIEVEMENTS TABLE
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on achievements
alter table public.achievements enable row level security;

-- Achievements Policies: Each user can only view, create, edit, and delete their own achievements
create policy "Users can view their own achievements"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own achievements"
  on public.achievements for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own achievements"
  on public.achievements for update
  using (auth.uid() = user_id);

create policy "Users can delete their own achievements"
  on public.achievements for delete
  using (auth.uid() = user_id);


-- 3. PLATFORM PROFILES TABLE
create table if not exists public.platform_profiles (
  user_id uuid references auth.users on delete cascade primary key,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on platform profiles
alter table public.platform_profiles enable row level security;

create policy "Users can view their own platform stats"
  on public.platform_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert or update their own platform stats"
  on public.platform_profiles for all
  using (auth.uid() = user_id);


-- 4. PRIVATE CERTIFICATES STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

create policy "Users can upload their own certificates"
  on storage.objects for insert
  with check (bucket_id = 'certificates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own certificates"
  on storage.objects for select
  using (bucket_id = 'certificates' and auth.uid()::text = (storage.foldername(name))[1]);
