import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, ".env.local"), "utf8");
for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)="?([^"\n]+)"?$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL, { fullResults: true });

const statements = [
    `ALTER TABLE IF EXISTS public.buyers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE IF EXISTS public.buyers ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP`,
    `UPDATE public.buyers SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`,
    `ALTER TABLE IF EXISTS public.deposits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE IF EXISTS public.deposits ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP`,
    `UPDATE public.deposits SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`,
    `CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql`,
    `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'buyers_set_updated_at'
  ) THEN
    CREATE TRIGGER buyers_set_updated_at
    BEFORE UPDATE ON public.buyers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'deposits' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'deposits_set_updated_at'
  ) THEN
    CREATE TRIGGER deposits_set_updated_at
    BEFORE UPDATE ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END
$$`,
];

async function run() {
    console.log("Starting migration transaction...");
    try {
        await sql.transaction(statements.map((s) => sql.query(s)));
        console.log(`Transaction committed: ${statements.length} statements applied.`);
    } catch (err) {
        console.error("Transaction rolled back:", err.message);
        process.exit(1);
    }
}

run();
