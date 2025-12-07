alter table public.inqueritos add column if not exists user_id uuid references auth.users(id) default auth.uid();

drop policy if exists "Allow all for authenticated users" on public.inqueritos;
create policy "Enable insert for authenticated users only" on public.inqueritos for insert with check (auth.uid() = user_id);
create policy "Enable select for users based on user_id" on public.inqueritos for select using (auth.uid() = user_id);
create policy "Enable update for users based on user_id" on public.inqueritos for update using (auth.uid() = user_id);
create policy "Enable delete for users based on user_id" on public.inqueritos for delete using (auth.uid() = user_id);

drop policy if exists "Allow all for authenticated users" on public.diligencias;
create policy "Diligence Access" on public.diligencias for all using (
  exists (
    select 1 from public.inqueritos
    where public.inqueritos.id = public.diligencias.inquerito_id
    and public.inqueritos.user_id = auth.uid()
  )
);

drop policy if exists "Allow all for authenticated users" on public.historico_estados;
create policy "History Access" on public.historico_estados for all using (
  exists (
    select 1 from public.inqueritos
    where public.inqueritos.id = public.historico_estados.inquerito_id
    and public.inqueritos.user_id = auth.uid()
  )
);

drop policy if exists "Allow all for authenticated users" on public.ligacoes;
create policy "Links Access" on public.ligacoes for all using (
  exists (
    select 1 from public.inqueritos i
    where (i.id = public.ligacoes.inquerito_a or i.id = public.ligacoes.inquerito_b)
    and i.user_id = auth.uid()
  )
);
