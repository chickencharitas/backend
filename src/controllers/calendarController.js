const { pool } = require('../config/database');
const nodemailer = require('nodemailer');

// ============================================================
// CALENDAR MANAGEMENT
// ============================================================

const createCalendar = async (req, res) => {
  try {
    const { name, description, color = '#1976d2', timezone = 'UTC' } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO team_calendars (organization_id, name, description, color, timezone, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, name, description, color, timezone, createdBy]
    );

    // Log activity
    await logCalendarActivity(result.rows[0].id, null, createdBy, 'created', `Calendar created: ${name}`);

    res.json({
      success: true,
      calendar: result.rows[0],
      message: 'Calendar created successfully'
    });
  } catch (err) {
    console.error('Error creating calendar:', err);
    res.status(500).json({ error: err.message });
  }
};

const getCalendars = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT tc.*, COUNT(DISTINCT ce.id) as event_count
       FROM team_calendars tc
       LEFT JOIN calendar_events ce ON tc.id = ce.calendar_id
       WHERE tc.organization_id = $1 AND tc.is_active = true
       GROUP BY tc.id
       ORDER BY tc.created_at DESC`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching calendars:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateCalendar = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { name, description, color, timezone } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Get old values
    const oldResult = await pool.query(
      'SELECT * FROM team_calendars WHERE id = $1 AND organization_id = $2',
      [calendarId, organizationId]
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const oldValues = oldResult.rows[0];

    const result = await pool.query(
      `UPDATE team_calendars 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           timezone = COALESCE($4, timezone),
           updated_at = NOW()
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      [name, description, color, timezone, calendarId, organizationId]
    );

    // Log activity
    await logCalendarActivity(calendarId, null, userId, 'updated', 'Calendar updated', oldValues, result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating calendar:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteCalendar = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify calendar exists
    const calendarCheck = await pool.query(
      'SELECT * FROM team_calendars WHERE id = $1 AND organization_id = $2',
      [calendarId, organizationId]
    );

    if (calendarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const calendar = calendarCheck.rows[0];

    // Delete all related data
    await pool.query('DELETE FROM calendar_reminders WHERE event_id IN (SELECT id FROM calendar_events WHERE calendar_id = $1)', [calendarId]);
    await pool.query('DELETE FROM event_attendees WHERE event_id IN (SELECT id FROM calendar_events WHERE calendar_id = $1)', [calendarId]);
    await pool.query('DELETE FROM event_comments WHERE event_id IN (SELECT id FROM calendar_events WHERE calendar_id = $1)', [calendarId]);
    await pool.query('DELETE FROM event_attachments WHERE event_id IN (SELECT id FROM calendar_events WHERE calendar_id = $1)', [calendarId]);
    await pool.query('DELETE FROM event_category_mappings WHERE event_id IN (SELECT id FROM calendar_events WHERE calendar_id = $1)', [calendarId]);
    await pool.query('DELETE FROM calendar_events WHERE calendar_id = $1', [calendarId]);
    await pool.query('DELETE FROM calendar_shares WHERE calendar_id = $1', [calendarId]);
    await pool.query('DELETE FROM calendar_preferences WHERE calendar_id = $1', [calendarId]);
    await pool.query('DELETE FROM calendar_syncs WHERE calendar_id = $1', [calendarId]);

    // Delete calendar
    const result = await pool.query(
      'DELETE FROM team_calendars WHERE id = $1 AND organization_id = $2 RETURNING *',
      [calendarId, organizationId]
    );

    // Log activity
    await logCalendarActivity(calendarId, null, userId, 'deleted', `Calendar deleted: ${calendar.name}`);

    res.json({ success: true, message: 'Calendar deleted successfully' });
  } catch (err) {
    console.error('Error deleting calendar:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// EVENT MANAGEMENT
// ============================================================

const addEvent = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      attendees = [],
      recurrence = 'none',
      reminderMinutes = 15,
      eventType = 'meeting',
      isAllDay = false,
      categoryIds = []
    } = req.body;
    const createdBy = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate calendar ownership
    const calendarCheck = await pool.query(
      'SELECT id FROM team_calendars WHERE id = $1 AND organization_id = $2',
      [calendarId, organizationId]
    );

    if (calendarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const result = await pool.query(
      `INSERT INTO calendar_events 
       (calendar_id, title, description, start_time, end_time, location, event_type, recurrence, reminder_minutes, is_all_day, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [calendarId, title, description, startTime, endTime, location, eventType, recurrence, reminderMinutes, isAllDay, createdBy]
    );

    const event = result.rows[0];

    // Add attendees
    if (attendees.length > 0) {
      for (const attendeeId of attendees) {
        await pool.query(
          `INSERT INTO event_attendees (event_id, user_id, status, is_organizer)
           VALUES ($1, $2, 'invited', false)
           ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'invited'`,
          [event.id, attendeeId]
        );
      }
    }

    // Add as organizer
    await pool.query(
      `INSERT INTO event_attendees (event_id, user_id, status, is_organizer)
       VALUES ($1, $2, 'accepted', true)
       ON CONFLICT (event_id, user_id) DO UPDATE SET is_organizer = true`,
      [event.id, createdBy]
    );

    // Add categories
    if (categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await pool.query(
          `INSERT INTO event_category_mappings (event_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [event.id, categoryId]
        );
      }
    }

    // Create reminders
    if (reminderMinutes > 0) {
      const reminderTime = new Date(new Date(startTime).getTime() - reminderMinutes * 60000);
      await pool.query(
        `INSERT INTO calendar_reminders (event_id, user_id, reminder_time, reminder_type)
         VALUES ($1, $2, $3, 'email')`,
        [event.id, createdBy, reminderTime]
      );
    }

    // Log activity
    await logCalendarActivity(calendarId, event.id, createdBy, 'created', `Event created: ${title}`);

    // Send notifications
    await sendEventNotification(event, createdBy, organizationId, 'created');

    res.json({
      success: true,
      event,
      message: 'Event created successfully'
    });
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: err.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { startDate, endDate, eventType, searchQuery } = req.query;
    const organizationId = req.user.organizationId;

    let query = `
      SELECT ce.*, u.first_name, u.last_name, tc.color, tc.name as calendar_name,
             COUNT(DISTINCT ea.id) as attendee_count
      FROM calendar_events ce
      JOIN team_calendars tc ON ce.calendar_id = tc.id
      LEFT JOIN users u ON ce.created_by = u.id
      LEFT JOIN event_attendees ea ON ce.id = ea.event_id
      WHERE ce.calendar_id = $1 AND tc.organization_id = $2 AND ce.is_cancelled = false
    `;

    const params = [calendarId, organizationId];
    let paramCount = 2;

    if (startDate) {
      paramCount++;
      query += ` AND ce.start_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND ce.end_time <= $${paramCount}`;
      params.push(endDate);
    }

    if (eventType) {
      paramCount++;
      query += ` AND ce.event_type = $${paramCount}`;
      params.push(eventType);
    }

    if (searchQuery) {
      paramCount++;
      query += ` AND (ce.title ILIKE $${paramCount} OR ce.description ILIKE $${paramCount})`;
      params.push(`%${searchQuery}%`);
    }

    query += ` GROUP BY ce.id, u.id, tc.id ORDER BY ce.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
};

const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizationId = req.user.organizationId;

    const eventResult = await pool.query(
      `SELECT ce.*, tc.color, tc.name as calendar_name, u.first_name, u.last_name, u.email as creator_email
       FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       LEFT JOIN users u ON ce.created_by = u.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Get attendees
    const attendeesResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.profile_image, ea.status, ea.responded_at, ea.is_organizer
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = $1
       ORDER BY ea.is_organizer DESC, ea.status DESC`,
      [eventId]
    );

    // Get categories
    const categoriesResult = await pool.query(
      `SELECT ec.id, ec.name, ec.color, ec.icon
       FROM event_category_mappings ecm
       JOIN event_categories ec ON ecm.category_id = ec.id
       WHERE ecm.event_id = $1`,
      [eventId]
    );

    // Get comments
    const commentsResult = await pool.query(
      `SELECT ec.id, ec.comment_text, ec.created_at, u.first_name, u.last_name, u.profile_image
       FROM event_comments ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.event_id = $1
       ORDER BY ec.created_at DESC`,
      [eventId]
    );

    // Get attachments
    const attachmentsResult = await pool.query(
      `SELECT id, file_name, file_path, file_size, file_type, created_at
       FROM event_attachments
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId]
    );

    res.json({
      ...event,
      attendees: attendeesResult.rows,
      categories: categoriesResult.rows,
      comments: commentsResult.rows,
      attachments: attachmentsResult.rows
    });
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      eventType,
      recurrence,
      reminderMinutes,
      isAllDay
    } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify event exists and user has permission
    const eventCheck = await pool.query(
      `SELECT ce.*, ce.created_by FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const oldValues = eventCheck.rows[0];

    const result = await pool.query(
      `UPDATE calendar_events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           location = COALESCE($5, location),
           event_type = COALESCE($6, event_type),
           recurrence = COALESCE($7, recurrence),
           reminder_minutes = COALESCE($8, reminder_minutes),
           is_all_day = COALESCE($9, is_all_day),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [title, description, startTime, endTime, location, eventType, recurrence, reminderMinutes, isAllDay, eventId]
    );

    // Log activity
    await logCalendarActivity(
      result.rows[0].calendar_id,
      eventId,
      userId,
      'updated',
      'Event updated',
      oldValues,
      result.rows[0]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify event exists
    const eventCheck = await pool.query(
      `SELECT ce.*, ce.calendar_id FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventCheck.rows[0];

    // Delete all related data
    await pool.query('DELETE FROM calendar_reminders WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM event_attendees WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM event_comments WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM event_attachments WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM event_category_mappings WHERE event_id = $1', [eventId]);

    // Delete event
    const result = await pool.query(
      `DELETE FROM calendar_events WHERE id = $1 RETURNING *`,
      [eventId]
    );

    // Log activity
    await logCalendarActivity(event.calendar_id, eventId, userId, 'deleted', `Event deleted: ${event.title}`);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ATTENDEE MANAGEMENT
// ============================================================

const addAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendeeIds } = req.body;
    const organizationId = req.user.organizationId;

    // Verify event ownership
    const eventCheck = await pool.query(
      `SELECT ce.id FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const results = [];
    for (const attendeeId of attendeeIds) {
      const result = await pool.query(
        `INSERT INTO event_attendees (event_id, user_id, status)
         VALUES ($1, $2, 'invited')
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'invited'
         RETURNING *`,
        [eventId, attendeeId]
      );
      results.push(result.rows[0]);
    }

    res.json({
      success: true,
      attendees: results,
      message: `${results.length} attendees added`
    });
  } catch (err) {
    console.error('Error adding attendees:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateAttendeeStatus = async (req, res) => {
  try {
    const { attendeeId } = req.params;
    const { status, responseNotes } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE event_attendees
       SET status = $1, response_notes = $2, responded_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, responseNotes || null, attendeeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendee record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating attendee status:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.profile_image, 
              ea.id as attendee_id, ea.status, ea.responded_at, ea.is_organizer
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = $1
       ORDER BY ea.is_organizer DESC, ea.status DESC`,
      [eventId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendees:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// RECURRING EVENTS
// ============================================================

const createRecurringEvents = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { recurrencePattern, endDate, occurrences } = req.body;
    const organizationId = req.user.organizationId;

    // Get base event
    const eventResult = await pool.query(
      `SELECT ce.* FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const baseEvent = eventResult.rows[0];
    const events = [];
    let currentDate = new Date(baseEvent.start_time);
    let count = 0;
    const maxDate = endDate ? new Date(endDate) : null;

    while ((maxDate === null || currentDate <= maxDate) && (occurrences === null || count < occurrences)) {
      const duration = new Date(baseEvent.end_time) - new Date(baseEvent.start_time);
      const newEndTime = new Date(currentDate.getTime() + duration);

      const result = await pool.query(
        `INSERT INTO calendar_events 
         (calendar_id, title, description, start_time, end_time, location, event_type, recurrence, reminder_minutes, created_by, recurring_event_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [baseEvent.calendar_id, baseEvent.title, baseEvent.description, currentDate, newEndTime, baseEvent.location, baseEvent.event_type, 'recurring', baseEvent.reminder_minutes, baseEvent.created_by, eventId]
      );

      events.push(result.rows[0]);

      // Add recurring dates based on pattern
      switch (recurrencePattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }

      count++;
    }

    res.json({
      success: true,
      eventsCreated: events.length,
      events
    });
  } catch (err) {
    console.error('Error creating recurring events:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// EVENT CATEGORIES
// ============================================================

const getEventCategories = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT * FROM event_categories 
       WHERE organization_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message });
  }
};

const addEventCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO event_categories (organization_id, name, description, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organizationId, name, description, color || '#1976d2', icon]
    );

    res.json({
      success: true,
      category: result.rows[0],
      message: 'Category created successfully'
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// EVENT COMMENTS
// ============================================================

const addEventComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Verify event exists
    const eventCheck = await pool.query(
      `SELECT ce.id FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await pool.query(
      `INSERT INTO event_comments (event_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, userId, commentText]
    );

    res.json({
      success: true,
      comment: result.rows[0],
      message: 'Comment added successfully'
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: err.message });
  }
};

const getEventComments = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `SELECT ec.id, ec.comment_text, ec.created_at, u.first_name, u.last_name, u.profile_image
       FROM event_comments ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.event_id = $1
       ORDER BY ec.created_at DESC`,
      [eventId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// EVENT ATTACHMENTS
// ============================================================

const uploadEventAttachment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fileName, filePath, fileSize, fileType } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Verify event exists
    const eventCheck = await pool.query(
      `SELECT ce.id FROM calendar_events ce
       JOIN team_calendars tc ON ce.calendar_id = tc.id
       WHERE ce.id = $1 AND tc.organization_id = $2`,
      [eventId, organizationId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await pool.query(
      `INSERT INTO event_attachments (event_id, file_name, file_path, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [eventId, fileName, filePath, fileSize, fileType, userId]
    );

    res.json({
      success: true,
      attachment: result.rows[0],
      message: 'Attachment uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading attachment:', err);
    res.status(500).json({ error: err.message });
  }
};

const getEventAttachments = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `SELECT id, file_name, file_path, file_size, file_type, created_at
       FROM event_attachments
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attachments:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteEventAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.id;

    // Verify user uploaded this attachment
    const result = await pool.query(
      `DELETE FROM event_attachments WHERE id = $1 AND uploaded_by = $2 RETURNING *`,
      [attachmentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error('Error deleting attachment:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CALENDAR SHARING
// ============================================================

const shareCalendar = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { sharedWithUserId, permissionLevel = 'view' } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify calendar exists
    const calendarCheck = await pool.query(
      'SELECT id FROM team_calendars WHERE id = $1 AND organization_id = $2',
      [calendarId, organizationId]
    );

    if (calendarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const result = await pool.query(
      `INSERT INTO calendar_shares (calendar_id, shared_with_user_id, permission_level, shared_by_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (calendar_id, shared_with_user_id) DO UPDATE SET permission_level = $3
       RETURNING *`,
      [calendarId, sharedWithUserId, permissionLevel, userId]
    );

    res.json({
      success: true,
      share: result.rows[0],
      message: 'Calendar shared successfully'
    });
  } catch (err) {
    console.error('Error sharing calendar:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSharedCalendars = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT tc.*, cs.permission_level, cs.created_at as shared_at,
              u.first_name, u.last_name
       FROM calendar_shares cs
       JOIN team_calendars tc ON cs.calendar_id = tc.id
       JOIN users u ON cs.shared_by_user_id = u.id
       WHERE cs.shared_with_user_id = $1
       ORDER BY cs.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shared calendars:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateCalendarShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { permissionLevel } = req.body;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `UPDATE calendar_shares cs
       SET permission_level = $1, updated_at = NOW()
       WHERE cs.id = $2 AND cs.calendar_id IN (
         SELECT id FROM team_calendars WHERE organization_id = $3
       )
       RETURNING *`,
      [permissionLevel, shareId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Share not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating share:', err);
    res.status(500).json({ error: err.message });
  }
};

const removeCalendarShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `DELETE FROM calendar_shares cs
       WHERE cs.id = $1 AND cs.calendar_id IN (
         SELECT id FROM team_calendars WHERE organization_id = $2
       )
       RETURNING *`,
      [shareId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Share not found' });
    }

    res.json({ success: true, message: 'Calendar share removed successfully' });
  } catch (err) {
    console.error('Error removing share:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CALENDAR PREFERENCES
// ============================================================

const setCalendarPreferences = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { isHidden, notificationEnabled, notificationType, reminderMinutes, colorOverride, displayOrder } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO calendar_preferences (user_id, calendar_id, is_hidden, notification_enabled, notification_type, reminder_minutes, color_override, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, calendar_id) DO UPDATE SET
         is_hidden = COALESCE($3, calendar_preferences.is_hidden),
         notification_enabled = COALESCE($4, calendar_preferences.notification_enabled),
         notification_type = COALESCE($5, calendar_preferences.notification_type),
         reminder_minutes = COALESCE($6, calendar_preferences.reminder_minutes),
         color_override = COALESCE($7, calendar_preferences.color_override),
         display_order = COALESCE($8, calendar_preferences.display_order),
         updated_at = NOW()
       RETURNING *`,
      [userId, calendarId, isHidden, notificationEnabled, notificationType, reminderMinutes, colorOverride, displayOrder]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error setting preferences:', err);
    res.status(500).json({ error: err.message });
  }
};

const getCalendarPreferences = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM calendar_preferences WHERE user_id = $1 AND calendar_id = $2`,
      [userId, calendarId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        isHidden: false, 
        notificationEnabled: true, 
        notificationType: 'email',
        reminderMinutes: 15 
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ACTIVITY LOG
// ============================================================

const getCalendarActivityLog = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const organizationId = req.user.organizationId;

    // Verify calendar ownership
    const calendarCheck = await pool.query(
      'SELECT id FROM team_calendars WHERE id = $1 AND organization_id = $2',
      [calendarId, organizationId]
    );

    if (calendarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const result = await pool.query(
      `SELECT cal.id, cal.activity_type, cal.description, cal.created_at,
              u.first_name, u.last_name, u.profile_image
       FROM calendar_activity_logs cal
       LEFT JOIN users u ON cal.user_id = u.id
       WHERE cal.calendar_id = $1
       ORDER BY cal.created_at DESC
       LIMIT $2 OFFSET $3`,
      [calendarId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM calendar_activity_logs WHERE calendar_id = $1',
      [calendarId]
    );

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function logCalendarActivity(calendarId, eventId, userId, activityType, description, oldValues = null, newValues = null) {
  try {
    await pool.query(
      `INSERT INTO calendar_activity_logs (calendar_id, event_id, user_id, activity_type, description, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [calendarId, eventId, userId, activityType, description, JSON.stringify(oldValues), JSON.stringify(newValues)]
    );
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

async function sendEventNotification(event, userId, organizationId, action) {
  try {
    const userResult = await pool.query('SELECT email, first_name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const subject = `Event ${action}: ${event.title}`;
    const message = `
      Event: ${event.title}
      Time: ${event.start_time} - ${event.end_time}
      Location: ${event.location || 'Not specified'}
      Description: ${event.description || 'No description'}
    `;

    // TODO: Integrate with email service (nodemailer)
    console.log(`Email sent to ${user.email}: ${subject}`);

    // Save notification to database
    await pool.query(
      `INSERT INTO notifications (user_id, organization_id, title, message, type, related_event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, organizationId, subject, message, 'event', event.id]
    );
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Calendar
  createCalendar,
  getCalendars,
  updateCalendar,
  deleteCalendar,
  
  // Events
  addEvent,
  getEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  
  // Attendees
  addAttendees,
  updateAttendeeStatus,
  getAttendees,
  
  // Recurring
  createRecurringEvents,
  
  // Categories
  getEventCategories,
  addEventCategory,
  
  // Comments
  addEventComment,
  getEventComments,
  
  // Attachments
  uploadEventAttachment,
  getEventAttachments,
  deleteEventAttachment,
  
  // Sharing
  shareCalendar,
  getSharedCalendars,
  updateCalendarShare,
  removeCalendarShare,
  
  // Preferences
  setCalendarPreferences,
  getCalendarPreferences,
  
  // Activity
  getCalendarActivityLog,
  
  // Helpers
  sendEventNotification
};