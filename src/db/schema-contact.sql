-- Compteurs anti-abus uniquement. Aucun message ni e-mail stocké ici.
CREATE TABLE IF NOT EXISTS contact_request_limits (
  key TEXT NOT NULL,
  bucket TIMESTAMPTZ NOT NULL,
  requests INTEGER NOT NULL,
  PRIMARY KEY (key, bucket)
);
ALTER TABLE contact_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON contact_request_limits FROM PUBLIC;
DO $$
DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'budget_app'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON contact_request_limits FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
