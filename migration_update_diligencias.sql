/* Update Diligencias Table Schema */

/* 1. Rename data_prevista to data_enviado */
ALTER TABLE public.diligencias 
RENAME COLUMN data_prevista TO data_enviado;

/* 2. Add status column */
ALTER TABLE public.diligencias 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'a_realizar';

/* 3. Ensure RLS policies don't conflict (Optional cleanup) */
/* If "Allow all for authenticated users" exists, it might be too permissive. */
/* But first let's fix the columns. */
