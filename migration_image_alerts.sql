-- Function to check for expiring image deadlines and insert notifications
CREATE OR REPLACE FUNCTION check_and_insert_image_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure it can read all necessary rows and insert notifications
AS $$
DECLARE
    processo RECORD;
    alert_type TEXT := 'image_alert';
    alert_title TEXT := 'Prazo de Imagens';
    days_remaining INT;
BEGIN
    -- Iterate over processes where images are associated, notification not yet sent/marked,
    -- and the due date (data_factos + 30 days) is within the next 5 days OR already passed.
    -- We assume 'data_factos' is the starting point.
    
    FOR processo IN
        SELECT 
            id, 
            nuipc_completo, 
            data_factos, 
            user_id
        FROM sp_processos_crime
        WHERE 
            imagens_associadas = TRUE
            AND notificacao_imagens = FALSE
            AND data_factos IS NOT NULL
            -- Check if 30 days from data_factos is less than or equal to 5 days from now
            -- i.e., data_factos + 30 days <= now() + 5 days
            AND (data_factos + INTERVAL '30 days') <= (NOW() + INTERVAL '5 days')
    LOOP
        -- Calculate accurate days remaining or overdue
        days_remaining := EXTRACT(DAY FROM (processo.data_factos + INTERVAL '30 days' - NOW()));

        -- Double check if a notification of this type/link already exists and is unread to avoid spamming
        -- We construct a unique link or reference. 
        -- Here we use the link as a unique key per process for this alert type.
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = alert_type 
            AND link LIKE '%/sp/imagens?search=' || processo.nuipc_completo || '%'
            AND read = FALSE
        ) THEN
            -- Insert Notification
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                link,
                read,
                created_at
            ) VALUES (
                processo.user_id, -- Notify the assigned user
                alert_type,
                alert_title,
                FORMAT('O prazo de 30 dias para as imagens do processo %s está a terminar (%s dias) ou expirou.', processo.nuipc_completo, days_remaining),
                '/sp/imagens?search=' || processo.nuipc_completo,
                FALSE,
                NOW()
            );

            -- UPDATE the process record to mark notification as potentially "handled" or just to track
            -- If we want to alert ONLY ONCE per process cycle, we should set notificacao_imagens = TRUE.
            -- However, the user might want a reminder every day? 
            -- The plan says "notificacao_imagens is FALSE" in the WHERE clause, implying we set it to TRUE here to stop checking.
            
            UPDATE sp_processos_crime
            SET notificacao_imagens = TRUE
            WHERE id = processo.id;
            
        END IF;
    END LOOP;
END;
$$;
