/**
 * FleetSync — Seed Runner
 * Run: node scripts/seed.js
 * Executes the seed SQL file.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runSeed() {
  const seedFile = path.join(__dirname, '../migrations/003_seed.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');

  console.log('\n🌱 FleetSync Seed Runner');
  console.log('  ▶ Running: 003_seed.sql');

  try {
    await pool.query(sql);
    console.log('  ✅ Seed data inserted successfully.');
    console.log('\n  Demo credentials (password: Password123!):');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │ admin@fleetsync.com      → Admin            │');
    console.log('  │ manager@fleetsync.com    → Fleet Manager     │');
    console.log('  │ james@fleetsync.com      → Driver (Vehicle 1)│');
    console.log('  │ maria@fleetsync.com      → Driver (Vehicle 2)│');
    console.log('  │ liam@fleetsync.com       → Driver (Vehicle 3)│');
    console.log('  │ sara@fleetsync.com       → Driver (Vehicle 4)│');
    console.log('  │ ben@fleetsync.com        → Driver (Vehicle 5)│');
    console.log('  │ anya@fleetsync.com       → Driver (Vehicle 6)│');
    console.log('  └─────────────────────────────────────────────┘\n');
  } catch (err) {
    console.error('  ❌ Seed error:', err.message);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

runSeed().catch(err => {
  console.error('Seed runner error:', err);
  process.exit(1);
});
