const fs = require('fs');
const { pool } = require('../src/config/database');

async function run004Migration() {
  try {
    console.log('🚀 Running 004-offline-bibles migration...');
    
    const sql = fs.readFileSync('004-offline-bibles.sql', 'utf8');
    
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (filename) VALUES ($1)', ['004-offline-bibles.sql']);
      await pool.query('COMMIT');
      console.log('✅ 004-offline-bibles.sql completed successfully');
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('❌ Migration failed:', err.message);
      throw err;
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run004Migration();
