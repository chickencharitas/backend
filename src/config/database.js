const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL for main app
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'worshipress'
});

// SQLite for Bible database
let bibleDb = null;

function getBibleDatabase() {
  if (!bibleDb) {
    const dbPath = path.join(__dirname, '../../data/bible.db');
    
    // Create data directory if it doesn't exist
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    bibleDb = new Database(dbPath);
    bibleDb.pragma('journal_mode = WAL');
    
    // Initialize schema if not exists
    initializeBibleSchema();
  }
  return bibleDb;
}

function initializeBibleSchema() {
  try {
    const schemaSQL = `
      -- Bible Versions/Translations table
      CREATE TABLE IF NOT EXISTS bible_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        name TEXT NOT NULL,
        full_name TEXT,
        language VARCHAR(50),
        year_published INTEGER,
        is_downloaded BOOLEAN DEFAULT 0,
        file_size_mb REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Bible Books table
      CREATE TABLE IF NOT EXISTS bible_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        abbreviation VARCHAR(10),
        testament VARCHAR(20),
        number_of_chapters INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Bible Chapters table
      CREATE TABLE IF NOT EXISTS bible_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES bible_books(book_id),
        UNIQUE(book_id, chapter_number)
      );

      -- Bible Verses table
      CREATE TABLE IF NOT EXISTS bible_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_code VARCHAR(20) NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (version_code) REFERENCES bible_versions(code),
        UNIQUE(version_code, book_id, chapter, verse)
      );

      -- Bible Favorites
      CREATE TABLE IF NOT EXISTS bible_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        version_code VARCHAR(20) NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (version_code) REFERENCES bible_versions(code)
      );

      -- Search indexes
      CREATE INDEX IF NOT EXISTS idx_verse_search 
      ON bible_verses(version_code, book_id, chapter, verse);

      CREATE INDEX IF NOT EXISTS idx_version_code 
      ON bible_verses(version_code);
    `;
    
    bibleDb.exec(schemaSQL);
    
    // Seed default versions if table is empty
    const versionCount = bibleDb.prepare('SELECT COUNT(*) as count FROM bible_versions').get().count;
    if (versionCount === 0) {
      const versions = {
        'kjv': 'King James Version',
        'niv': 'New International Version',
        'nkjv': 'New King James Version',
        'esv': 'English Standard Version',
        'nasb': 'New American Standard Bible',
        'nrsv': 'New Revised Standard Version',
        'amp': 'Amplified Bible',
        'nlt': 'New Living Translation',
        'msg': 'The Message',
        'tlb': 'The Living Bible',
      };
      
      const stmt = bibleDb.prepare(`
        INSERT INTO bible_versions (code, name, language) VALUES (?, ?, 'English')
      `);
      
      Object.entries(versions).forEach(([code, name]) => {
        stmt.run(code, name);
      });
    }
    
  } catch (error) {
    console.error('Failed to initialize Bible schema:', error);
  }
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function initializeDatabase() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    
    // Initialize Bible database
    getBibleDatabase();
    console.log('✅ Bible database initialized (SQLite)');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}

module.exports = {
  pool,
  getDatabase: getBibleDatabase,
  initializeDatabase,
  query: (text, params) => pool.query(text, params)
};