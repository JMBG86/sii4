-- Add subject column to oficios_templates
alter table public.oficio_templates add column if not exists subject text;
