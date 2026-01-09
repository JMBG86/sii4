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
                '/inqueritos/detalhe?id=' || NEW.id
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
                '/inqueritos/detalhe?id=' || NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
