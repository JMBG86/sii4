-- Migrate/Fix Data: Update total_detidos based on sp_detidos_info
WITH totals AS (
    SELECT processo_id, SUM(quantidade) as total
    FROM sp_detidos_info
    GROUP BY processo_id
)
UPDATE sp_processos_crime
SET total_detidos = COALESCE(totals.total, 0)
FROM totals
WHERE sp_processos_crime.id = totals.processo_id;

-- Ensure those with no detainees are set to 0 (if null)
UPDATE sp_processos_crime SET total_detidos = 0 WHERE total_detidos IS NULL;
