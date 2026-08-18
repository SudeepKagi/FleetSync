/**
 * FleetSync — Migration Runner
 * Run: node scripts/migrate.js
 * Executes all SQL migration files in order.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function runMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.includes('seed'))
    .sort();

  console.log(`\n🗄️  FleetSync Migration Runner`);
  console.log(`Found ${files.length} migration file(s):\n`);

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`  ▶ Running: ${file}`);
    try {
      await pool.query(sql);
      console.log(`  ✅ Done: ${file}`);
    } catch (err) {
      console.error(`  ❌ Error in ${file}:`, err.message);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully.\n');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
