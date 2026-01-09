-- Add columns to sp_processos_crime for finer notification tracking
alter table sp_processos_crime
add column if not exists notificacao_militar boolean default false,
add column if not exists data_ent_lpc timestamp with time zone,
add column if not exists data_devol_lpc timestamp with time zone;
