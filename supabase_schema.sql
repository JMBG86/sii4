-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2.1 Table: inqueritos
create table if not exists public.inqueritos (
  id uuid primary key default uuid_generate_v4(),
  nuipc text unique not null,
  data_ocorrencia date,
  data_participacao date,
  data_inicio_investigacao date,
  tipo_crime text,
  estado text not null default 'por_iniciar', -- por_iniciar, em_diligencias, tribunal, concluido, aguardando_resposta
  classificacao text default 'normal', -- normal, relevo
  localizacao text, -- equipa, tribunal
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 Table: diligencias
create table if not exists public.diligencias (
  id uuid primary key default uuid_generate_v4(),
  inquerito_id uuid references public.inqueritos(id) on delete cascade not null,
  descricao text not null,
  entidade text,
  data_solicitacao date,
  data_prevista date,
  estado text default 'pendente', -- pendente, respondida, recusada
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 Table: ligacoes (Many-to-Many between inqueritos)
create table if not exists public.ligacoes (
  id uuid primary key default uuid_generate_v4(),
  inquerito_a uuid references public.inqueritos(id) on delete cascade not null,
  inquerito_b uuid references public.inqueritos(id) on delete cascade not null,
  razao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_link unique (inquerito_a, inquerito_b)
);

-- 2.4 Table: historico_estados
create table if not exists public.historico_estados (
  id uuid primary key default uuid_generate_v4(),
  inquerito_id uuid references public.inqueritos(id) on delete cascade not null,
  estado_anterior text,
  estado_novo text not null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  utilizador text -- Store email or id
);

-- RLS Policies
alter table public.inqueritos enable row level security;
alter table public.diligencias enable row level security;
alter table public.ligacoes enable row level security;
alter table public.historico_estados enable row level security;

-- Allow read/write for authenticated users
create policy "Allow all for authenticated users" on public.inqueritos for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on public.diligencias for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on public.ligacoes for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on public.historico_estados for all using (auth.role() = 'authenticated');
