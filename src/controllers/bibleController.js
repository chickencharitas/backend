// Install a Bible version (simulate install for premium)
exports.installVersion = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Version code required' });
    }
    const db = getDatabase();
    // Simulate install: set installed = 1 in bible_versions table
    db.prepare('UPDATE bible_versions SET installed = 1 WHERE code = ?').run(code);
    return res.json({ success: true, code });
  } catch (error) {
    console.error('Install version error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
/**
 * Bible Controller
 * Handles Bible verse lookups from offline database
 */

const { getDatabase } = require('../config/database');

// Version metadata (free vs paid)
const VERSION_METADATA = {
  'kjv': { free: true, category: 'Classic' },
  'niv': { free: true, category: 'Modern' },
  'nkjv': { free: true, category: 'Classic' },
  'esv': { free: true, category: 'Modern' },
  'nasb': { free: true, category: 'Modern' },
  'nrsv': { free: true, category: 'Academic' },
  'amp': { free: false, category: 'Amplified' },
  'nlt': { free: false, category: 'Thought-For-Thought' },
  'msg': { free: false, category: 'Paraphrase' },
  'tlb': { free: false, category: 'Paraphrase' },
  'gnt': { free: true, category: 'Modern' },
};

exports.searchVerse = async (req, res) => {
  try {
    const { query, version = 'kjv' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Bible reference required', success: false });
    }

    const db = getDatabase();

    // Parse reference (e.g., "John 3:16")
    const parseMatch = query.match(/^([A-Za-z\s0-9]+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!parseMatch) {
      return res.status(400).json({ 
        error: 'Invalid format. Use: "Book Chapter:Verse" (e.g., "John 3:16")',
        success: false 
      });
    }

    // Get book ID from name
    const bookName = parseMatch[1].trim().toLowerCase();
    const chapter = parseInt(parseMatch[2]);
    const startVerse = parseInt(parseMatch[3]);
    const endVerse = parseMatch[4] ? parseInt(parseMatch[4]) : startVerse;
    const versionCode = version.toLowerCase();

    // Find book ID
    const book = db.prepare(`
      SELECT book_id FROM bible_books WHERE LOWER(name) = ?
    `).get(bookName);

    if (!book) {
      return res.status(404).json({ 
        error: `Book not found: ${parseMatch[1]}`,
        success: false 
      });
    }

    // Get verses from database
    const verses = db.prepare(`
      SELECT book_id, chapter, verse, text 
      FROM bible_verses 
      WHERE version_code = ? AND book_id = ? AND chapter = ? AND verse BETWEEN ? AND ?
      ORDER BY verse ASC
    `).all(versionCode, book.book_id, chapter, startVerse, endVerse);

    if (verses.length === 0) {
      return res.status(404).json({ 
        error: 'Verse not found in database',
        success: false,
        detail: `No verses found for ${query} in ${versionCode}`
      });
    }

    // Get version name
    const versionInfo = db.prepare(`
      SELECT name FROM bible_versions WHERE code = ?
    `).get(versionCode);

    res.json({
      success: true,
      data: verses.map(v => ({
        book: parseMatch[1],
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        reference: `${parseMatch[1]} ${v.chapter}:${v.verse}`
      })),
      version: versionInfo ? versionInfo.name : versionCode.toUpperCase(),
      versionCode: versionCode,
      offline: true
    });
  } catch (error) {
    console.error('Bible search error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
};

exports.getVersions = (req, res) => {
  try {
    const db = getDatabase();
    
    const versions = db.prepare(`
      SELECT code, name, language FROM bible_versions ORDER BY name
    `).all();

    const versionMap = {};
    versions.forEach(v => {
      const metadata = VERSION_METADATA[v.code] || { free: true, category: 'Other' };
      versionMap[v.code] = {
        name: v.name,
        language: v.language || 'English',
        free: metadata.free,
        category: metadata.category,
        installed: true
      };
    });

    res.json({ 
      success: true,
      versions: versionMap,
      count: versions.length
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
};

exports.getBooks = (req, res) => {
  try {
    const db = getDatabase();
    
    const books = db.prepare(`
      SELECT book_id, name, abbreviation, testament FROM bible_books ORDER BY book_id
    `).all();

    res.json({ 
      success: true,
      books: books,
      count: books.length
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { bookId, chapter, verse, versionCode, notes } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!bookId || !chapter || !verse || !versionCode) {
      return res.status(400).json({ error: 'Missing required fields', success: false });
    }

    const db = getDatabase();
    
    const result = db.prepare(`
      INSERT INTO bible_favorites (user_id, version_code, book_id, chapter, verse, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, versionCode, bookId, chapter, verse, notes || null);

    res.json({ 
      success: true,
      id: result.lastInsertRowid,
      message: 'Verse added to favorites'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user ? req.user.id : null;

    const favorites = db.prepare(`
      SELECT * FROM bible_favorites WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId);

    res.json({ 
      success: true,
      favorites: favorites,
      count: favorites.length
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
};
