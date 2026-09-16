-- Indépendant des comptes du budget et de la facturation. Rejouable sans perte.
CREATE TABLE IF NOT EXISTS prelaunch_reservations (
  email TEXT PRIMARY KEY,
  offer TEXT CHECK (offer IN ('manual', 'connected')),
  need TEXT,
  confirmed_at TIMESTAMPTZ,
  pending_offer TEXT NOT NULL CHECK (pending_offer IN ('manual', 'connected')),
  pending_need TEXT NOT NULL DEFAULT '',
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_requested_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prelaunch_request_limits (
  source_hash TEXT NOT NULL,
  bucket TIMESTAMPTZ NOT NULL,
  requests INTEGER NOT NULL,
  PRIMARY KEY (source_hash, bucket)
);
-- Aucun accès depuis les clients Supabase (anon/authenticated), ni budget_app.
-- Seul le propriétaire du schéma utilisé par le serveur peut accéder aux tables.
ALTER TABLE prelaunch_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prelaunch_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON prelaunch_reservations, prelaunch_request_limits FROM PUBLIC;
DO $$
DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'budget_app'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON prelaunch_reservations, prelaunch_request_limits FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
