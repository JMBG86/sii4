-- Add user_id column if it doesn't exist
alter table public.inqueritos add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- RLS Policies for Inqueritos
-- DROP existing policies first to ensure idempotency
drop policy if exists "Enable insert for authenticated users only" on public.inqueritos;
drop policy if exists "Enable select for users based on user_id" on public.inqueritos;
drop policy if exists "Enable update for users based on user_id" on public.inqueritos;
drop policy if exists "Enable delete for users based on user_id" on public.inqueritos;
drop policy if exists "Allow all for authenticated users" on public.inqueritos; -- Dropping the old broad policy if it exists

create policy "Enable insert for authenticated users only" on public.inqueritos for insert with check (auth.uid() = user_id);
create policy "Enable select for users based on user_id" on public.inqueritos for select using (auth.uid() = user_id);
create policy "Enable update for users based on user_id" on public.inqueritos for update using (auth.uid() = user_id);
create policy "Enable delete for users based on user_id" on public.inqueritos for delete using (auth.uid() = user_id);

-- RLS Policies for Diligencias
drop policy if exists "Allow all for authenticated users" on public.diligencias;
drop policy if exists "Diligence Access" on public.diligencias;

create policy "Diligence Access" on public.diligencias for all using (
  exists (
    select 1 from public.inqueritos
    where public.inqueritos.id = public.diligencias.inquerito_id
    and public.inqueritos.user_id = auth.uid()
  )
);

-- RLS Policies for Historico Estados
drop policy if exists "Allow all for authenticated users" on public.historico_estados;
drop policy if exists "History Access" on public.historico_estados;

create policy "History Access" on public.historico_estados for all using (
  exists (
    select 1 from public.inqueritos
    where public.inqueritos.id = public.historico_estados.inquerito_id
    and public.inqueritos.user_id = auth.uid()
  )
);

-- RLS Policies for Ligacoes
drop policy if exists "Allow all for authenticated users" on public.ligacoes;
drop policy if exists "Links Access" on public.ligacoes;

create policy "Links Access" on public.ligacoes for all using (
  exists (
    select 1 from public.inqueritos i
    where (i.id = public.ligacoes.inquerito_a or i.id = public.ligacoes.inquerito_b)
    and i.user_id = auth.uid()
  )
);
