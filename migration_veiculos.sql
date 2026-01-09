create table if not exists sp_apreensoes_veiculos (
    id uuid primary key default gen_random_uuid(),
    matricula text,
    marca_modelo text,
    nuipc text,
    data_nuipc date,
    chave_existente boolean default false,
    entregue boolean default false,
    deposito_sdter boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indices for search
create index if not exists idx_veiculos_matricula on sp_apreensoes_veiculos(matricula);
create index if not exists idx_veiculos_nuipc on sp_apreensoes_veiculos(nuipc);

-- RLS Policies (Open for internal use as requested generally, but good practice to add)
alter table sp_apreensoes_veiculos enable row level security;

create policy "Enable read access for authenticated users" on sp_apreensoes_veiculos
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on sp_apreensoes_veiculos
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on sp_apreensoes_veiculos
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on sp_apreensoes_veiculos
  for delete using (auth.role() = 'authenticated');
