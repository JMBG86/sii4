/* RLS Policies for Global Read Access (Search Feature) */

/* 1. INQUERITOS */
-- Drop old SELECT policy
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.inqueritos;
-- Create new GLOBAL SELECT policy
CREATE POLICY "Enable global select for authenticated users" 
ON public.inqueritos FOR SELECT 
USING (auth.role() = 'authenticated');

/* Keep INSERT/UPDATE/DELETE strict (owned by user_id) */


/* 2. DILIGENCIAS */
-- Drop old Access policy
DROP POLICY IF EXISTS "Diligence Access" ON public.diligencias;
-- Create split policies:
-- GLOBAL SELECT
CREATE POLICY "Enable global select for authenticated users" 
ON public.diligencias FOR SELECT 
USING (auth.role() = 'authenticated');

-- STRICT WRITE
CREATE POLICY "Enable write for inquiry owners" 
ON public.diligencias FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.inqueritos
    WHERE public.inqueritos.id = public.diligencias.inquerito_id
    AND public.inqueritos.user_id = auth.uid()
  )
);


/* 3. HISTORICO ESTADOS */
DROP POLICY IF EXISTS "History Access" ON public.historico_estados;
-- GLOBAL SELECT
CREATE POLICY "Enable global select for authenticated users" 
ON public.historico_estados FOR SELECT 
USING (auth.role() = 'authenticated');
-- STRICT WRITE
CREATE POLICY "Enable write for inquiry owners" 
ON public.historico_estados FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inqueritos
    WHERE public.inqueritos.id = public.historico_estados.inquerito_id
    AND public.inqueritos.user_id = auth.uid()
  )
);


/* 4. LIGACOES */
DROP POLICY IF EXISTS "Links Access" ON public.ligacoes;
-- GLOBAL SELECT
CREATE POLICY "Enable global select for authenticated users" 
ON public.ligacoes FOR SELECT 
USING (auth.role() = 'authenticated');
-- STRICT WRITE
CREATE POLICY "Enable write for inquiry owners" 
ON public.ligacoes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.inqueritos i
    WHERE (i.id = public.ligacoes.inquerito_a OR i.id = public.ligacoes.inquerito_b)
    AND i.user_id = auth.uid()
  )
);
