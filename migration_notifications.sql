-- Upgrading Trigger to handle INSERT (New Inquiries) and UPDATE
-- FIX: Changed 'assigned_to' to 'user_id' to match actual table schema

CREATE OR REPLACE FUNCTION public.handle_new_inquiry_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic for INSERT: If user_id is present
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.user_id IS NOT NULL) THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                NEW.user_id,
                'assignment',
                'Novo Inquérito Atribuído',
                'Foi-lhe atribuído um novo inquérito (NUIPC: ' || COALESCE(NEW.nuipc, 'N/A') || ')',
                '/inqueritos/' || NEW.id
            );
        END IF;
    
    -- Logic for UPDATE: If user_id changed
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.user_id IS DISTINCT FROM NEW.user_id) AND (NEW.user_id IS NOT NULL) THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                NEW.user_id,
                'assignment',
                'Novo Inquérito Atribuído',
                'Foi-lhe atribuído o inquérito NUIPC: ' || COALESCE(NEW.nuipc, 'N/A'),
                '/inqueritos/' || NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger to fire on INSERT and UPDATE
DROP TRIGGER IF EXISTS on_inquerito_assignment ON public.inqueritos;

CREATE TRIGGER on_inquerito_assignment
AFTER INSERT OR UPDATE ON public.inqueritos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_inquiry_assignment();
