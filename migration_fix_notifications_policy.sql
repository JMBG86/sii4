-- Allow anyone logged in to insert notifications (e.g. Admin notifying User, or User notifying User)
CREATE POLICY "Enable insert for authenticated users" ON public.notifications 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update the limit function to be SECURITY DEFINER
-- This ensures that when an Admin triggers it (by inserting for another user), 
-- the function has permissions to DELETE the old notifications for that user,
-- bypassing RLS checks that might restrict the Admin from deleting User's data.
CREATE OR REPLACE FUNCTION public.maintain_notification_limit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE id IN (
        SELECT id FROM public.notifications
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        OFFSET 9
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
