-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'assignment', 'alert', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS (idempotent operation)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Safe handling: Drop first to ensure latest version is applied)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Function to handle New Inquiry Assignment
CREATE OR REPLACE FUNCTION public.handle_new_inquiry_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if assigned_to changed and is not null
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) AND (NEW.assigned_to IS NOT NULL) THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            NEW.assigned_to,
            'assignment',
            'Novo Inquérito Atribuído',
            'Foi-lhe atribuído o inquérito NUIPC: ' || NEW.nuipc,
            '/inqueritos/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger (Drop first to avoid errors)
DROP TRIGGER IF EXISTS on_inquerito_assignment ON public.inqueritos;

CREATE TRIGGER on_inquerito_assignment
AFTER UPDATE ON public.inqueritos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_inquiry_assignment();
