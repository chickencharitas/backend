const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const getServiceHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    let query = `SELECT * FROM playlist_history 
                 WHERE organization_id = $1`;
    const params = [req.user.organizationId];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getMediaAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `SELECT 
                   m.id, m.title, COUNT(sm.slide_id) as usage_count
                 FROM media m
                 LEFT JOIN slide_media sm ON m.id = sm.media_id
                 WHERE m.organization_id = $1`;
    const params = [req.user.organizationId];

    if (startDate) {
      query += ` AND m.created_at >= $${params.length + 1}`;
      params. push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND m.created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY m.id ORDER BY usage_count DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getUsageAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `SELECT 
                   DATE(p.created_at) as date,
                   COUNT(p.id) as presentations_created,
                   COUNT(DISTINCT p.created_by) as active_users
                 FROM presentations p
                 WHERE p.organization_id = $1`;
    const params = [req. user.organizationId];

    if (startDate) {
      query += ` AND p.created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND p.created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY DATE(p.created_at) ORDER BY date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getAuditLog = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req. query;

    const result = await pool.query(
      `SELECT * FROM audit_log 
       WHERE organization_id = $1
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.organizationId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.body;
    const reportId = uuidv4();

    let data = {};

    if (type === 'service-summary') {
      const serviceResult = await pool.query(
        `SELECT COUNT(*) as total_services, 
                COUNT(DISTINCT service_date) as unique_dates
         FROM playlists 
         WHERE organization_id = $1 AND status = 'completed'`,
        [req.user.organizationId]
      );
      data.services = serviceResult.rows[0];
    }

    if (type === 'media-usage') {
      const mediaResult = await pool.query(
        `SELECT m.title, COUNT(sm.slide_id) as usage
         FROM media m
         LEFT JOIN slide_media sm ON m.id = sm.media_id
         WHERE m.organization_id = $1
         GROUP BY m.id
         ORDER BY usage DESC`,
        [req.user.organizationId]
      );
      data. media = mediaResult.rows;
    }

    if (type === 'user-activity') {
      const userResult = await pool.query(
        `SELECT u.first_name, u.last_name, COUNT(p.id) as presentations_created
         FROM users u
         LEFT JOIN presentations p ON u.id = p.created_by
         WHERE u.organization_id = $1
         GROUP BY u.id`,
        [req.user.organizationId]
      );
      data.users = userResult.rows;
    }

    // Store report in database
    const reportResult = await pool.query(
      `INSERT INTO reports (id, organization_id, report_type, data, format, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [reportId, req.user.organizationId, type, JSON.stringify(data), format, req.user.userId]
    );

    res. status(201).json(reportResult.rows[0]);
  } catch (err) {
    next(err);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { reportId, format = 'pdf' } = req.body;

    const reportResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1 AND organization_id = $2',
      [reportId, req. user.organizationId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportResult.rows[0];

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.csv"`);
      // Convert to CSV
      res.send(convertToCSV(report. data));
    } else if (format === 'json') {
      res.json(report.data);
    }
  } catch (err) {
    next(err);
  }
};

const getCCLIReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req. query;

    // Get CCLI credentials
    const credResult = await pool.query(
      `SELECT credentials FROM integration_credentials 
       WHERE organization_id = $1 AND integration_type = 'ccli'`,
      [req.user. organizationId]
    );

    if (credResult.rows. length === 0) {
      return res.status(400).json({ error: 'CCLI not configured' });
    }

    // Get songs used in services
    const songsResult = await pool.query(
      `SELECT s.title, COUNT(pi.id) as usage_count
       FROM songs s
       LEFT JOIN playlist_items pi ON s.id = pi. song_id
       LEFT JOIN playlists p ON pi.playlist_id = p.id
       WHERE p.organization_id = $1
       AND p.status = 'completed'
       GROUP BY s.id
       ORDER BY usage_count DESC`,
      [req.user.organizationId]
    );

    res.json({
      reportType: 'ccli',
      generatedAt: new Date(),
      songs: songsResult.rows
    });
  } catch (err) {
    next(err);
  }
};

const convertToCSV = (data) => {
  // Helper function to convert JSON to CSV
  let csv = '';
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0]);
    csv = headers.join(',') + '\n';
    data.forEach(row => {
      csv += Object.values(row).join(',') + '\n';
    });
  }
  return csv;
};

module.exports = {
  getServiceHistory,
  getMediaAnalytics,
  getUsageAnalytics,
  getAuditLog,
  generateReport,
  exportReport,
  getCCLIReport
};