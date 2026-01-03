const fs = require('fs');
const { pool } = require('../src/config/database');

async function runNewMigration() {
  try {
    console.log('🚀 Running ProPresenter features migration...');

    const sql = fs.readFileSync('migrations/003-propresenter-features.sql', 'utf8');

    console.log('Running: 003-propresenter-features.sql');
    await pool.query(sql);

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runNewMigration();