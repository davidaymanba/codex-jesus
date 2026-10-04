-- The app role receives SELECT/INSERT/UPDATE/DELETE on every table through default privileges
-- (docker/postgres/init/01-app-role.sh). Two tables need less:
--   - audit_logs is append-only: the app may insert and read entries, never change or erase them.
--   - _prisma_migrations is migration history: only the owner (who runs migrations) touches it.
-- Role names differ per environment, so privileges are revoked from every grantee except the
-- table owner instead of naming the app role.
DO $$
DECLARE
  grant_row record;
BEGIN
  FOR grant_row IN
    SELECT DISTINCT c.relname AS table_name, acl.grantee::regrole AS grantee
    FROM pg_class c
    CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relname IN ('audit_logs', '_prisma_migrations')
      AND acl.grantee <> c.relowner
      AND acl.grantee <> 0
  LOOP
    IF grant_row.table_name = 'audit_logs' THEN
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM %s', grant_row.grantee);
    ELSE
      EXECUTE format('REVOKE ALL ON _prisma_migrations FROM %s', grant_row.grantee);
    END IF;
  END LOOP;
END
$$;
