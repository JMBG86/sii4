-- Migration: Add Latitude and Longitude to Inqueritos
-- Description: Adds columns to store coordinates for crime location mapping.

ALTER TABLE "public"."inqueritos" 
ADD COLUMN IF NOT EXISTS "latitude" double precision,
ADD COLUMN IF NOT EXISTS "longitude" double precision;

COMMENT ON COLUMN "public"."inqueritos"."latitude" IS 'Latitude of the crime location (WGS84)';
COMMENT ON COLUMN "public"."inqueritos"."longitude" IS 'Longitude of the crime location (WGS84)';
