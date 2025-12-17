-- Function to find inquiry owner with fuzzy NUIPC matching (ignoring leading zeros)
CREATE OR REPLACE FUNCTION find_owner_by_fuzzy_nuipc(search_nuipc text)
RETURNS text -- Returns the full name of the owner
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (ensure logic is safe)
AS $$
DECLARE
    clean_search text;
    owner_name text;
BEGIN
    -- Normalize the search input: remove leading zeros
    -- e.g. '00500/25...' -> '500/25...'
    clean_search := ltrim(search_nuipc, '0');

    SELECT p.full_name
    INTO owner_name
    FROM inqueritos i
    JOIN profiles p ON i.user_id = p.id
    WHERE ltrim(i.nuipc, '0') = clean_search
    LIMIT 1;

    RETURN owner_name;
END;
$$;
