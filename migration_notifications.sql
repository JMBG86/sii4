CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    link text, -- optional link to navigate to
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to limit to 10 notifications
CREATE OR REPLACE FUNCTION public.maintain_notification_limit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE id IN (
        SELECT id FROM public.notifications
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        OFFSET 9 -- Keep 9 (existing) + new one = 10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS limit_notifications_trigger ON public.notifications;
CREATE TRIGGER limit_notifications_trigger
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.maintain_notification_limit();
