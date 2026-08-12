/* Regenerates supabase/migrations/0001_init.sql from the live database.
   Usage: SUPABASE_DB_URL=postgres://... node scripts/dump-migration.mjs   */
console.log('Use: pg_dump --schema=analytics --schema-only "$SUPABASE_DB_URL" > supabase/migrations/0001_init.sql');
