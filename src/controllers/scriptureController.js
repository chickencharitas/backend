const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Complete scripture data - all 66 books of the Bible
const SCRIPTURE_BOOKS = [
  // Old Testament - Books of the Law
  { book: 'Genesis', abbreviation: 'Gen', chapters: 50 },
  { book: 'Exodus', abbreviation: 'Exo', chapters: 40 },
  { book: 'Leviticus', abbreviation: 'Lev', chapters: 27 },
  { book: 'Numbers', abbreviation: 'Num', chapters: 36 },
  { book: 'Deuteronomy', abbreviation: 'Deu', chapters: 34 },
  
  // Old Testament - Historical Books
  { book: 'Joshua', abbreviation: 'Jos', chapters: 24 },
  { book: 'Judges', abbreviation: 'Jdg', chapters: 21 },
  { book: 'Ruth', abbreviation: 'Rut', chapters: 4 },
  { book: '1 Samuel', abbreviation: '1Sa', chapters: 31 },
  { book: '2 Samuel', abbreviation: '2Sa', chapters: 24 },
  { book: '1 Kings', abbreviation: '1Ki', chapters: 22 },
  { book: '2 Kings', abbreviation: '2Ki', chapters: 25 },
  { book: '1 Chronicles', abbreviation: '1Ch', chapters: 29 },
  { book: '2 Chronicles', abbreviation: '2Ch', chapters: 36 },
  { book: 'Ezra', abbreviation: 'Ezr', chapters: 10 },
  { book: 'Nehemiah', abbreviation: 'Neh', chapters: 13 },
  { book: 'Esther', abbreviation: 'Est', chapters: 10 },
  
  // Old Testament - Wisdom Books
  { book: 'Job', abbreviation: 'Job', chapters: 42 },
  { book: 'Psalms', abbreviation: 'Psa', chapters: 150 },
  { book: 'Proverbs', abbreviation: 'Pro', chapters: 31 },
  { book: 'Ecclesiastes', abbreviation: 'Ecc', chapters: 12 },
  { book: 'Song of Solomon', abbreviation: 'Son', chapters: 8 },
  
  // Old Testament - Major Prophets
  { book: 'Isaiah', abbreviation: 'Isa', chapters: 66 },
  { book: 'Jeremiah', abbreviation: 'Jer', chapters: 52 },
  { book: 'Lamentations', abbreviation: 'Lam', chapters: 5 },
  { book: 'Ezekiel', abbreviation: 'Eze', chapters: 48 },
  { book: 'Daniel', abbreviation: 'Dan', chapters: 12 },
  
  // Old Testament - Minor Prophets
  { book: 'Hosea', abbreviation: 'Hos', chapters: 14 },
  { book: 'Joel', abbreviation: 'Joe', chapters: 3 },
  { book: 'Amos', abbreviation: 'Amo', chapters: 9 },
  { book: 'Obadiah', abbreviation: 'Oba', chapters: 1 },
  { book: 'Jonah', abbreviation: 'Jon', chapters: 4 },
  { book: 'Micah', abbreviation: 'Mic', chapters: 7 },
  { book: 'Nahum', abbreviation: 'Nah', chapters: 3 },
  { book: 'Habakkuk', abbreviation: 'Hab', chapters: 3 },
  { book: 'Zephaniah', abbreviation: 'Zep', chapters: 3 },
  { book: 'Haggai', abbreviation: 'Hag', chapters: 2 },
  { book: 'Zechariah', abbreviation: 'Zec', chapters: 14 },
  { book: 'Malachi', abbreviation: 'Mal', chapters: 4 },
  
  // New Testament - Gospels
  { book: 'Matthew', abbreviation: 'Mat', chapters: 28 },
  { book: 'Mark', abbreviation: 'Mar', chapters: 16 },
  { book: 'Luke', abbreviation: 'Luk', chapters: 24 },
  { book: 'John', abbreviation: 'Joh', chapters: 21 },
  
  // New Testament - Acts
  { book: 'Acts', abbreviation: 'Act', chapters: 28 },
  
  // New Testament - Paul's Epistles
  { book: 'Romans', abbreviation: 'Rom', chapters: 16 },
  { book: '1 Corinthians', abbreviation: '1Co', chapters: 16 },
  { book: '2 Corinthians', abbreviation: '2Co', chapters: 13 },
  { book: 'Galatians', abbreviation: 'Gal', chapters: 6 },
  { book: 'Ephesians', abbreviation: 'Eph', chapters: 6 },
  { book: 'Philippians', abbreviation: 'Php', chapters: 4 },
  { book: 'Colossians', abbreviation: 'Col', chapters: 4 },
  { book: '1 Thessalonians', abbreviation: '1Th', chapters: 5 },
  { book: '2 Thessalonians', abbreviation: '2Th', chapters: 3 },
  { book: '1 Timothy', abbreviation: '1Ti', chapters: 6 },
  { book: '2 Timothy', abbreviation: '2Ti', chapters: 4 },
  { book: 'Titus', abbreviation: 'Tit', chapters: 3 },
  { book: 'Philemon', abbreviation: 'Phm', chapters: 1 },
  
  // New Testament - Hebrews
  { book: 'Hebrews', abbreviation: 'Heb', chapters: 13 },
  
  // New Testament - James & Peter
  { book: 'James', abbreviation: 'Jas', chapters: 5 },
  { book: '1 Peter', abbreviation: '1Pe', chapters: 5 },
  { book: '2 Peter', abbreviation: '2Pe', chapters: 3 },
  
  // New Testament - John's Epistles
  { book: '1 John', abbreviation: '1Jo', chapters: 5 },
  { book: '2 John', abbreviation: '2Jo', chapters: 1 },
  { book: '3 John', abbreviation: '3Jo', chapters: 1 },
  
  // New Testament - Jude
  { book: 'Jude', abbreviation: 'Jud', chapters: 1 },
  
  // New Testament - Revelation
  { book: 'Revelation', abbreviation: 'Rev', chapters: 22 }
];

const searchScripture = async (req, res, next) => {
  try {
    const { query, translation = 'kjv' } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const result = await pool.query(
      `SELECT * FROM scripture_verses 
       WHERE (content ILIKE $1 OR reference ILIKE $1)
       AND translation = $2
       LIMIT 20`,
      [`%${query}%`, translation]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getVerses = async (req, res, next) => {
  try {
    const { book, chapter } = req.params;
    const { translation = 'kjv' } = req.query;

    const result = await pool.query(
      `SELECT * FROM scripture_verses 
       WHERE book = $1 AND chapter = $2 AND translation = $3
       ORDER BY verse ASC`,
      [book, chapter, translation]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getScriptureBooks = async (req, res, next) => {
  try {
    res.json(SCRIPTURE_BOOKS);
  } catch (err) {
    next(err);
  }
};

const getScriptureTranslations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT translation FROM scripture_verses ORDER BY translation ASC`
    );

    const translations = result.rows.map(r => ({
      code: r.translation,
      name: r.translation.toUpperCase()
    }));

    res.json(translations);
  } catch (err) {
    next(err);
  }
};

const addCustomVerse = async (req, res, next) => {
  try {
    const { reference, content, translation } = req.body;
    const verseId = uuidv4();

    if (!reference || !content) {
      return res.status(400).json({ error: 'Reference and content required' });
    }

    const userResult = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const organizationId = userResult.rows[0].organization_id;

    const result = await pool.query(
      `INSERT INTO scripture_verses (id, reference, content, translation, organization_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [verseId, reference, content, translation || 'custom', organizationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const setDefaultTranslation = async (req, res, next) => {
  try {
    const { translation } = req.body;

    await pool.query(
      `UPDATE user_settings 
       SET default_scripture_translation = $1
       WHERE user_id = $2`,
      [translation, req.user.id]
    );

    res.json({ message: 'Default translation updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchScripture,
  getVerses,
  getScriptureBooks,
  addCustomVerse,
  getScriptureTranslations,
  setDefaultTranslation
};