-- Migration: Add latitude and longitude to sp_processos_crime

ALTER TABLE sp_processos_crime
ADD COLUMN IF NOT EXISTS latitude float,
ADD COLUMN IF NOT EXISTS longitude float;
