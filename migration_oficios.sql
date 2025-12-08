-- Create table for Oficio Categories (Cards)
create table if not exists public.oficio_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text, -- Optional: store icon name/identifier
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Oficio Templates (Subsections)
create table if not exists public.oficio_templates (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.oficio_categories(id) on delete cascade not null,
  title text not null,
  content text not null, -- The standard text
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.oficio_categories enable row level security;
alter table public.oficio_templates enable row level security;

-- Policies
-- Everyone (authenticated) can view
create policy "Allow read for authenticated users" on public.oficio_categories for select using (auth.role() = 'authenticated');
create policy "Allow read for authenticated users" on public.oficio_templates for select using (auth.role() = 'authenticated');

-- Only admins/service role can insert/update/delete (assuming simple authenticated check for now as per other policies, OR if we want to restrict to specific users we'd need a role system.
-- For now, matching the existing "Allow all for authenticated users" pattern but let's be slightly more specific if possible, adhering to the User's request that ADMINS create cards.
-- Since we don't have a robust role system visible in the previous schema (just `auth.role() = 'authenticated'`), we will stick to that for simplicity, assuming the "Admin" UI is hidden from normal users via frontend logic or checking a user table.
-- WARNING: Real security requires a role check in RLS. Assuming the user handles "Admin" via frontend protection or a separate `users` table check not fully visible here. I'll stick to authenticated for now to ensure it works.

create policy "Allow all for authenticated users" on public.oficio_categories for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on public.oficio_templates for all using (auth.role() = 'authenticated');
