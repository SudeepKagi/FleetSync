const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not set in server/.env');
  process.exit(1);
}

const isSsl = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || process.env.NODE_ENV === 'production';

async function runMigration() {
  console.log(`🔌 Connecting to PostgreSQL at: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  const client = new Client({
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL!');

    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = [
      '001_init_schema.sql',
      '002_triggers_and_procedures.sql',
      '003_seed.sql',
    ];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📦 Running ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`  └─ ✅ Successfully applied ${file}`);
    }

    console.log('\n🎉 Database setup & migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
