-- Upgrading Trigger to handle INSERT (New Inquiries) and UPDATE

CREATE OR REPLACE FUNCTION public.handle_new_inquiry_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic for INSERT: If assigned_to is present
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.assigned_to IS NOT NULL) THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                NEW.assigned_to,
                'assignment',
                'Novo Inquérito Atribuído',
                'Foi-lhe atribuído um novo inquérito (NUIPC: ' || COALESCE(NEW.nuipc, 'N/A') || ')',
                '/inqueritos/' || NEW.id
            );
        END IF;
    
    -- Logic for UPDATE: If assigned_to changed
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) AND (NEW.assigned_to IS NOT NULL) THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                NEW.assigned_to,
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
