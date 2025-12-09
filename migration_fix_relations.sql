/* Fix Foreign Key Relationship for Inqueritos -> Profiles */
/* Required to allow Supabase Client to join tables (select(..., profiles(...))) */

/* 1. Inqueritos: Update user_id FK */
ALTER TABLE public.inqueritos 
  DROP CONSTRAINT IF EXISTS inqueritos_user_id_fkey; -- Drop old reference to auth.users

ALTER TABLE public.inqueritos
  ADD CONSTRAINT inqueritos_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL; -- If profile deleted, keep inquiry but nullify owner? Or Cascade? Usually User deletion implies heavy stuff. Set Null is safer for now.


/* Verify Profiles ID is PK */
/* (It should be, but just in case) */
/* ALTER TABLE public.profiles ADD PRIMARY KEY (id); */
