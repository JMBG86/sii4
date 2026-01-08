-- Add status tracking columns to sp_apreensoes_info
ALTER TABLE public.sp_apreensoes_info
ADD COLUMN IF NOT EXISTS remetido boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS local_remessa text,
ADD COLUMN IF NOT EXISTS local_deposito text;
