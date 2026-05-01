
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL);

async function runSqlMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sqlText = readFileSync(path.join(migrationsDir, file), 'utf8');
    if (!sqlText.trim()) continue;
    console.log(`Running migration: ${file}`);
    try {
      await sql.unsafe(sqlText);
      console.log(`✔ Migration applied: ${file}`);
    } catch (err) {
      console.error(`✖ Migration failed: ${file}`);
      console.error(err);
      process.exit(1);
    }
  }
}

async function migrate() {
  await runSqlMigrations();
  // Optionally, run JS migrations here if needed
  console.log('All migrations complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
