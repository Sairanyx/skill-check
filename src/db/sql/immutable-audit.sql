-- Make the audit trail tamper-proof: rows in audit_events and decisions can be added, never changed or removed.
-- Applied by: npm run db:audit
CREATE OR REPLACE FUNCTION forbid_audit_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit records are append-only (% on %)', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_immutable ON audit_events;
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_change();

DROP TRIGGER IF EXISTS decisions_immutable ON decisions;
CREATE TRIGGER decisions_immutable BEFORE UPDATE OR DELETE ON decisions
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_change();

-- TRUNCATE skips row triggers, so block it with a statement-level trigger too.
DROP TRIGGER IF EXISTS audit_events_no_truncate ON audit_events;
CREATE TRIGGER audit_events_no_truncate BEFORE TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_audit_change();

DROP TRIGGER IF EXISTS decisions_no_truncate ON decisions;
CREATE TRIGGER decisions_no_truncate BEFORE TRUNCATE ON decisions
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_audit_change();
