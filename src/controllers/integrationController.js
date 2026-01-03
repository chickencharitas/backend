const { pool } = require('../config/database');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// OBS Integration
const connectOBS = async (req, res, next) => {
  try {
    const { host, port, password } = req.body;
    const integrationId = uuidv4();

    if (!host || !port) {
      return res.status(400).json({ error: 'Host and port required' });
    }

    // Test connection
    try {
      await axios.get(`http://${host}:${port}/api`);
    } catch (err) {
      return res.status(400).json({ error: 'Cannot connect to OBS' });
    }

    const result = await pool.query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req.user.organizationId,
        'obs',
        JSON. stringify({ host, port, password }),
        true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// vMix Integration
const connectVMix = async (req, res, next) => {
  try {
    const { host, port } = req.body;
    const integrationId = uuidv4();

    if (!host || ! port) {
      return res. status(400).json({ error: 'Host and port required' });
    }

    const result = await pool.query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req.user.organizationId,
        'vmix',
        JSON.stringify({ host, port }),
        true
      ]
    );

    res. status(201).json(result. rows[0]);
  } catch (err) {
    next(err);
  }
};

// Stream Deck Integration
const connectStreamDeck = async (req, res, next) => {
  try {
    const { deviceId, buttonLayout } = req.body;
    const integrationId = uuidv4();

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    const result = await pool. query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req. user.organizationId,
        'stream_deck',
        JSON.stringify({ deviceId, buttonLayout }),
        true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// MIDI Integration
const connectMIDI = async (req, res, next) => {
  try {
    const { inputDevice, outputDevice, mappings } = req.body;
    const integrationId = uuidv4();

    const result = await pool.query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req.user.organizationId,
        'midi',
        JSON.stringify({ inputDevice, outputDevice, mappings }),
        true
      ]
    );

    res.status(201). json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// NDI Integration
const connectNDI = async (req, res, next) => {
  try {
    const { enabled, outputNames } = req.body;
    const integrationId = uuidv4();

    const result = await pool.query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req.user.organizationId,
        'ndi',
        JSON.stringify({ outputNames }),
        enabled
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// CCLI Integration
const connectCCLI = async (req, res, next) => {
  try {
    const { accountNumber, password } = req.body;
    const integrationId = uuidv4();

    if (! accountNumber || !password) {
      return res.status(400). json({ error: 'Account number and password required' });
    }

    const result = await pool. query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (organization_id, integration_type)
       DO UPDATE SET credentials = $4, enabled = $5
       RETURNING *`,
      [
        integrationId,
        req. user.organizationId,
        'ccli',
        JSON. stringify({ accountNumber, password }),
        true
      ]
    );

    res.status(201). json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getIntegrationStatus = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT integration_type, enabled, last_tested_at, last_error
       FROM integration_credentials 
       WHERE organization_id = $1`,
      [req.user.organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const testIntegration = async (req, res, next) => {
  try {
    const { type, credentials } = req.body;

    let isConnected = false;
    let error = null;

    try {
      // Test based on type
      if (type === 'obs' && credentials.host) {
        const response = await axios.get(`http://${credentials.host}:${credentials.port}/api`, {
          timeout: 5000
        });
        isConnected = response.status === 200;
      }
      // Add other integration tests here
    } catch (err) {
      error = err. message;
    }

    const result = await pool.query(
      `UPDATE integration_credentials 
       SET last_tested_at = NOW(), last_error = $1
       WHERE organization_id = $2 AND integration_type = $3
       RETURNING *`,
      [error, req. user.organizationId, type]
    );

    res.json({
      connected: isConnected,
      error,
      lastTested: new Date()
    });
  } catch (err) {
    next(err);
  }
};

const sendCommand = async (req, res, next) => {
  try {
    const { integrationType, command, parameters } = req.body;

    // Get integration credentials
    const credResult = await pool.query(
      `SELECT credentials FROM integration_credentials 
       WHERE organization_id = $1 AND integration_type = $2 AND enabled = true`,
      [req.user.organizationId, integrationType]
    );

    if (credResult.rows.length === 0) {
      return res.status(400).json({ error: 'Integration not configured' });
    }

    const credentials = credResult.rows[0].credentials;
    let response;

    // Execute command based on integration type
    if (integrationType === 'obs' && credentials.host) {
      response = await axios.post(
        `http://${credentials.host}:${credentials.port}/api/command`,
        { command, parameters }
      );
    }
    // Add other integration commands here

    res.json(response.data);
  } catch (err) {
    next(err);
  }
};

const disconnectIntegration = async (req, res, next) => {
  try {
    const { type } = req.params;

    await pool.query(
      `UPDATE integration_credentials 
       SET enabled = false
       WHERE organization_id = $1 AND integration_type = $2`,
      [req.user.organizationId, type]
    );

    res. json({ message: `${type} integration disconnected` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  connectOBS,
  connectVMix,
  connectStreamDeck,
  connectMIDI,
  connectNDI,
  connectCCLI,
  getIntegrationStatus,
  testIntegration,
  sendCommand,
  disconnectIntegration
};