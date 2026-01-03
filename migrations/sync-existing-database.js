const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function syncExistingDatabase() {
  try {
    console.log('🔄 Syncing existing database with migration tracking...');

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

    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);

    // Mark migrations as executed based on existing tables
    if (existingTables.includes('organizations')) {
      await pool.query(`
        INSERT INTO migrations (filename) VALUES ('001-initial-schema.sql')
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log('✅ Marked 001-initial-schema.sql as executed');
    }

    if (existingTables.includes('calendar_events')) {
      await pool.query(`
        INSERT INTO migrations (filename) VALUES ('002-calendar-schema.sql')
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log('✅ Marked 002-calendar-schema.sql as executed');
    }

    if (existingTables.includes('presentation_templates')) {
      await pool.query(`
        INSERT INTO migrations (filename) VALUES ('003-propresenter-features.sql')
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log('✅ Marked 003-propresenter-features.sql as executed');
    }

    if (existingTables.includes('bible_books')) {
      await pool.query(`
        INSERT INTO migrations (filename) VALUES ('004-offline-bibles.sql')
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log('✅ Marked 004-offline-bibles.sql as executed');
    }

    if (existingTables.includes('presentation_audit')) {
      await pool.query(`
        INSERT INTO migrations (filename) VALUES ('005-add-presentation-audit.sql')
        ON CONFLICT (filename) DO NOTHING
      `);
      console.log('✅ Marked 005-add-presentation-audit.sql as executed');
    }

    // Now run any remaining migrations
    const executedResult = await pool.query('SELECT filename FROM migrations');
    const executedFiles = executedResult.rows.map(row => row.filename);

    console.log('Executed migrations:', executedFiles);

    for (const file of files) {
      if (!executedFiles.includes(file)) {
        console.log(`🚀 Running new migration: ${file}`);
        
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
      }
    }

    console.log('✅ Database sync completed!');
    
    // Show final status
    const finalResult = await pool.query('SELECT filename, executed_at FROM migrations ORDER BY filename');
    console.log('\n📋 Migration Status:');
    finalResult.rows.forEach(row => {
      console.log(`  ✅ ${row.filename} - ${row.executed_at.toLocaleString()}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  }
}

syncExistingDatabase();
