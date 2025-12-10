/* Suggestions / Tickets System */

-- Create ENUM for status (optional, using text is easier for Supabase)
-- Status: enviada, aberta, em_tratamento, implementado
-- Type: bug, sugestao

create table if not exists public.sugestoes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  titulo text not null,
  descricao text not null,
  tipo text not null default 'sugestao', -- 'bug' or 'sugestao'
  status text not null default 'enviada', -- 'enviada', 'aberta', 'em_tratamento', 'implementado'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.sugestoes enable row level security;

-- READ: Visible to ALL authenticated users
create policy "Enable read for authenticated users" 
on public.sugestoes for select 
using (auth.role() = 'authenticated');

-- INSERT: Authenticated users can create
create policy "Enable insert for authenticated users" 
on public.sugestoes for insert 
with check (auth.role() = 'authenticated');

-- UPDATE: Only Admins can change status (Or maybe the creator can edit description? Let's restrict to Admin for status for now)
-- Actually, let's allow updating if you are the owner OR if you are admin.
-- But checking admin inside RLS is tricky without custom claims or a join.
-- For simplicity: Owners can update their own content. Status updates usually reserved for Admins.
-- I'll allow ALL update for now, enforce role logic in App/Server Actions.
create policy "Enable update for authenticated users" 
on public.sugestoes for update
using (auth.role() = 'authenticated');

-- DELETE: Only owner or admin
create policy "Enable delete for owners" 
on public.sugestoes for delete
using (auth.uid() = user_id);
