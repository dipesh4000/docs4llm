-- Enable RLS on MCP analytics / token tables (Supabase advisor CRITICAL).
-- App access uses the Postgres connection (service role / bypass). Deny anon
-- by default; allow authenticated owners where auth.uid() matches userId.

ALTER TABLE "McpHit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "McpAccessToken" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mcp_hit_service_all" ON "McpHit";
CREATE POLICY "mcp_hit_service_all"
  ON "McpHit"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mcp_access_token_service_all" ON "McpAccessToken";
CREATE POLICY "mcp_access_token_service_all"
  ON "McpAccessToken"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mcp_access_token_owner_select" ON "McpAccessToken";
CREATE POLICY "mcp_access_token_owner_select"
  ON "McpAccessToken"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "mcp_access_token_owner_write" ON "McpAccessToken";
CREATE POLICY "mcp_access_token_owner_write"
  ON "McpAccessToken"
  FOR ALL
  TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "mcp_hit_owner_select" ON "McpHit";
CREATE POLICY "mcp_hit_owner_select"
  ON "McpHit"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "PlatformProject" p
      WHERE p.id = "McpHit"."projectId"
        AND p."userId" = auth.uid()
    )
  );
