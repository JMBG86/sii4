-- Add tipo column to diligencias
alter table public.diligencias add column if not exists tipo text default 'outro';
-- optional: update existing rows
update public.diligencias set tipo = 'outro' where tipo is null;
