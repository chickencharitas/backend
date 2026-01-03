#!/usr/bin/env node

/**
 * Bible Database Populator
 * Downloads Bible verses from GetBible API and stores locally in SQLite
 * Run this once to build the offline Bible database
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Database = require('better-sqlite3');

const BIBLE_API_BASE = 'https://api.getbible.com/v1';
const DB_PATH = path.join(__dirname, '../config/database.js');

// Bible versions to download
const VERSIONS_TO_DOWNLOAD = [
  { code: 'kjv', name: 'King James Version' },
  { code: 'niv', name: 'New International Version' },
  { code: 'nkjv', name: 'New King James Version' },
  { code: 'esv', name: 'English Standard Version' },
  { code: 'nasb', name: 'New American Standard Bible' },
  { code: 'amp', name: 'Amplified Bible' },
  { code: 'nlt', name: 'New Living Translation' },
  { code: 'msg', name: 'The Message' },
  { code: 'tlb', name: 'The Living Bible' },
  { code: 'gnt', name: 'Good News Translation' },
];

// Bible books in order
const BIBLE_BOOKS = [
  { id: 1, name: 'Genesis', abbr: 'Gen', testament: 'OT' },
  { id: 2, name: 'Exodus', abbr: 'Exo', testament: 'OT' },
  { id: 3, name: 'Leviticus', abbr: 'Lev', testament: 'OT' },
  { id: 4, name: 'Numbers', abbr: 'Num', testament: 'OT' },
  { id: 5, name: 'Deuteronomy', abbr: 'Deu', testament: 'OT' },
  { id: 6, name: 'Joshua', abbr: 'Jos', testament: 'OT' },
  { id: 7, name: 'Judges', abbr: 'Jdg', testament: 'OT' },
  { id: 8, name: 'Ruth', abbr: 'Rut', testament: 'OT' },
  { id: 9, name: '1 Samuel', abbr: '1Sa', testament: 'OT' },
  { id: 10, name: '2 Samuel', abbr: '2Sa', testament: 'OT' },
  { id: 11, name: '1 Kings', abbr: '1Ki', testament: 'OT' },
  { id: 12, name: '2 Kings', abbr: '2Ki', testament: 'OT' },
  { id: 13, name: '1 Chronicles', abbr: '1Ch', testament: 'OT' },
  { id: 14, name: '2 Chronicles', abbr: '2Ch', testament: 'OT' },
  { id: 15, name: 'Ezra', abbr: 'Ezr', testament: 'OT' },
  { id: 16, name: 'Nehemiah', abbr: 'Neh', testament: 'OT' },
  { id: 17, name: 'Esther', abbr: 'Est', testament: 'OT' },
  { id: 18, name: 'Job', abbr: 'Job', testament: 'OT' },
  { id: 19, name: 'Psalms', abbr: 'Psa', testament: 'OT' },
  { id: 20, name: 'Proverbs', abbr: 'Pro', testament: 'OT' },
  { id: 21, name: 'Ecclesiastes', abbr: 'Ecc', testament: 'OT' },
  { id: 22, name: 'Song of Solomon', abbr: 'Sol', testament: 'OT' },
  { id: 23, name: 'Isaiah', abbr: 'Isa', testament: 'OT' },
  { id: 24, name: 'Jeremiah', abbr: 'Jer', testament: 'OT' },
  { id: 25, name: 'Lamentations', abbr: 'Lam', testament: 'OT' },
  { id: 26, name: 'Ezekiel', abbr: 'Eze', testament: 'OT' },
  { id: 27, name: 'Daniel', abbr: 'Dan', testament: 'OT' },
  { id: 28, name: 'Hosea', abbr: 'Hos', testament: 'OT' },
  { id: 29, name: 'Joel', abbr: 'Joe', testament: 'OT' },
  { id: 30, name: 'Amos', abbr: 'Amo', testament: 'OT' },
  { id: 31, name: 'Obadiah', abbr: 'Oba', testament: 'OT' },
  { id: 32, name: 'Jonah', abbr: 'Jon', testament: 'OT' },
  { id: 33, name: 'Micah', abbr: 'Mic', testament: 'OT' },
  { id: 34, name: 'Nahum', abbr: 'Nah', testament: 'OT' },
  { id: 35, name: 'Habakkuk', abbr: 'Hab', testament: 'OT' },
  { id: 36, name: 'Zephaniah', abbr: 'Zep', testament: 'OT' },
  { id: 37, name: 'Haggai', abbr: 'Hag', testament: 'OT' },
  { id: 38, name: 'Zechariah', abbr: 'Zac', testament: 'OT' },
  { id: 39, name: 'Malachi', abbr: 'Mal', testament: 'OT' },
  { id: 40, name: 'Matthew', abbr: 'Mat', testament: 'NT' },
  { id: 41, name: 'Mark', abbr: 'Mar', testament: 'NT' },
  { id: 42, name: 'Luke', abbr: 'Luk', testament: 'NT' },
  { id: 43, name: 'John', abbr: 'Joh', testament: 'NT' },
  { id: 44, name: 'Acts', abbr: 'Act', testament: 'NT' },
  { id: 45, name: 'Romans', abbr: 'Rom', testament: 'NT' },
  { id: 46, name: '1 Corinthians', abbr: '1Co', testament: 'NT' },
  { id: 47, name: '2 Corinthians', abbr: '2Co', testament: 'NT' },
  { id: 48, name: 'Galatians', abbr: 'Gal', testament: 'NT' },
  { id: 49, name: 'Ephesians', abbr: 'Eph', testament: 'NT' },
  { id: 50, name: 'Philippians', abbr: 'Phi', testament: 'NT' },
  { id: 51, name: 'Colossians', abbr: 'Col', testament: 'NT' },
  { id: 52, name: '1 Thessalonians', abbr: '1Th', testament: 'NT' },
  { id: 53, name: '2 Thessalonians', abbr: '2Th', testament: 'NT' },
  { id: 54, name: '1 Timothy', abbr: '1Ti', testament: 'NT' },
  { id: 55, name: '2 Timothy', abbr: '2Ti', testament: 'NT' },
  { id: 56, name: 'Titus', abbr: 'Tit', testament: 'NT' },
  { id: 57, name: 'Philemon', abbr: 'Phm', testament: 'NT' },
  { id: 58, name: 'Hebrews', abbr: 'Heb', testament: 'NT' },
  { id: 59, name: 'James', abbr: 'Jas', testament: 'NT' },
  { id: 60, name: '1 Peter', abbr: '1Pe', testament: 'NT' },
  { id: 61, name: '2 Peter', abbr: '2Pe', testament: 'NT' },
  { id: 62, name: '1 John', abbr: '1Jo', testament: 'NT' },
  { id: 63, name: '2 John', abbr: '2Jo', testament: 'NT' },
  { id: 64, name: '3 John', abbr: '3Jo', testament: 'NT' },
  { id: 65, name: 'Jude', abbr: 'Jud', testament: 'NT' },
  { id: 66, name: 'Revelation', abbr: 'Rev', testament: 'NT' },
];

let db;

function initDatabase() {
  try {
    const configPath = path.join(__dirname, '../config/database.js');
    const config = require(configPath);
    db = config.getDatabase();
    console.log('✓ Connected to database');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to database:', error.message);
    return false;
  }
}

function insertBooks() {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO bible_books (book_id, name, abbreviation, testament, number_of_chapters)
      VALUES (?, ?, ?, ?, ?)
    `);

    BIBLE_BOOKS.forEach(book => {
      stmt.run(book.id, book.name, book.abbr, book.testament, 0);
    });

    console.log(`✓ Inserted ${BIBLE_BOOKS.length} Bible books`);
  } catch (error) {
    console.error('✗ Failed to insert books:', error.message);
  }
}

async function downloadAndStoreVerses(versionCode) {
  console.log(`\n📥 Downloading ${versionCode.toUpperCase()} Bible verses...`);
  
  let verseCount = 0;
  const failedBooks = [];

  for (const book of BIBLE_BOOKS) {
    try {
      const bookPath = book.name.toLowerCase().replace(/\s+/g, '-');
      const url = `${BIBLE_API_BASE}/bibles/${versionCode}`;
      
      // Get book data
      const response = await axios.get(url, { timeout: 5000 });
      
      if (!response.data || !response.data.data) {
        console.log(`  ⚠ No data for ${book.name}`);
        continue;
      }

      const bookData = response.data.data[book.id];
      if (!bookData || !bookData.chapters) {
        continue;
      }

      // Store verses from each chapter
      const insertVerse = db.prepare(`
        INSERT OR IGNORE INTO bible_verses (version_code, book_id, chapter, verse, text)
        VALUES (?, ?, ?, ?, ?)
      `);

      Object.entries(bookData.chapters).forEach(([chapterNum, chapterData]) => {
        if (!chapterData.verses) return;

        Object.entries(chapterData.verses).forEach(([verseNum, verseText]) => {
          try {
            insertVerse.run(versionCode, book.id, parseInt(chapterNum), parseInt(verseNum), verseText);
            verseCount++;
          } catch (e) {
            // Duplicate verse, skip
          }
        });
      });

      if (verseCount % 1000 === 0) {
        process.stdout.write(`  Stored ${verseCount} verses...\r`);
      }
    } catch (error) {
      failedBooks.push(book.name);
    }
  }

  console.log(`✓ ${versionCode.toUpperCase()}: Stored ${verseCount} verses`);
  if (failedBooks.length > 0) {
    console.log(`  ⚠ Failed books: ${failedBooks.join(', ')}`);
  }

  return verseCount;
}

async function main() {
  console.log('🏗️  Building Offline Bible Database...\n');

  if (!initDatabase()) {
    process.exit(1);
  }

  // Run migration
  try {
    const migrationSQL = fs.readFileSync(path.join(__dirname, '004-offline-bibles.sql'), 'utf8');
    db.exec(migrationSQL);
    console.log('✓ Migration completed');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
  }

  insertBooks();

  // Download verses for each version
  console.log('\n📦 Downloading Bible translations...');
  for (const version of VERSIONS_TO_DOWNLOAD) {
    try {
      await downloadAndStoreVerses(version.code);
    } catch (error) {
      console.error(`✗ Failed to download ${version.code}:`, error.message);
    }
  }

  console.log('\n✅ Bible database population complete!');
  console.log('\n📊 Database Statistics:');
  
  const versionCount = db.prepare('SELECT COUNT(*) as count FROM bible_versions WHERE is_downloaded = 1').get();
  const verseCount = db.prepare('SELECT COUNT(*) as count FROM bible_verses').get();
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM bible_books').get();

  console.log(`  - Versions: ${versionCount.count}`);
  console.log(`  - Books: ${bookCount.count}`);
  console.log(`  - Total verses: ${verseCount.count}`);

  db.close();
}

main().catch(console.error);
