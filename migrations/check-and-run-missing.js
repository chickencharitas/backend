const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function checkAndRunMissingMigrations() {
  try {
    console.log('🔍 Checking migration status...');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('00'))
      .sort();

    // Get executed migrations
    const executedResult = await pool.query('SELECT filename FROM migrations');
    const executedFiles = executedResult.rows.map(row => row.filename);

    console.log('Already executed:', executedFiles);
    console.log('Available files:', files);

    // Run missing migrations
    for (const file of files) {
      if (!executedFiles.includes(file)) {
        console.log(`🚀 Running missing migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await pool.query('BEGIN');
        try {
          await pool.query(sql);
          await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
          await pool.query('COMMIT');
          console.log(`✅ Completed: ${file}`);
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`❌ Failed ${file}:`, err.message);
          throw err;
        }
      } else {
        console.log(`⏭️  Skipping ${file} (already executed)`);
      }
    }

    console.log('✅ All migrations are up to date!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration process failed:', err);
    process.exit(1);
  }
}

checkAndRunMissingMigrations();
