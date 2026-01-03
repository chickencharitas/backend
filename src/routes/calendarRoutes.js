const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  // Calendar operations
  createCalendar,
  getCalendars,
  updateCalendar,
  deleteCalendar,
  
  // Event operations
  addEvent,
  getEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  
  // Attendee operations
  addAttendees,
  updateAttendeeStatus,
  getAttendees,
  
  // Recurring events
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
  
  // Activity log
  getCalendarActivityLog
} = require('../controllers/calendarController');

const router = express.Router();

// Middleware
router.use(authenticate);

/* ============================================================
   CALENDAR MANAGEMENT
============================================================ */

// Create calendar
router.post('/calendars', createCalendar);

// Get all calendars for organization
router.get('/calendars', getCalendars);

// Update calendar
router.put('/calendars/:calendarId', updateCalendar);

// Delete calendar
router.delete('/calendars/:calendarId', deleteCalendar);

/* ============================================================
   EVENT MANAGEMENT
============================================================ */

// Create event
router.post('/calendars/:calendarId/events', addEvent);

// Get events for calendar (with filtering)
router.get('/calendars/:calendarId/events', getEvents);

// Get event details
router.get('/events/:eventId', getEventDetails);

// Update event
router.put('/events/:eventId', updateEvent);

// Delete event
router.delete('/events/:eventId', deleteEvent);

/* ============================================================
   RECURRING EVENTS
============================================================ */

// Create recurring event series
router.post('/events/:eventId/recurrence', createRecurringEvents);

/* ============================================================
   EVENT ATTENDEES
============================================================ */

// Add attendees to event
router.post('/events/:eventId/attendees', addAttendees);

// Get event attendees
router.get('/events/:eventId/attendees', getAttendees);

// Update attendee RSVP status
router.put('/attendees/:attendeeId/status', updateAttendeeStatus);

/* ============================================================
   EVENT CATEGORIES
============================================================ */

// Get all categories for organization
router.get('/categories', getEventCategories);

// Create new category
router.post('/categories', authorize('admin', 'organizer'), addEventCategory);

/* ============================================================
   EVENT COMMENTS
============================================================ */

// Add comment to event
router.post('/events/:eventId/comments', addEventComment);

// Get event comments
router.get('/events/:eventId/comments', getEventComments);

/* ============================================================
   EVENT ATTACHMENTS
============================================================ */

// Upload attachment to event
router.post('/events/:eventId/attachments', uploadEventAttachment);

// Get event attachments
router.get('/events/:eventId/attachments', getEventAttachments);

// Delete attachment
router.delete('/attachments/:attachmentId', deleteEventAttachment);

/* ============================================================
   CALENDAR SHARING
============================================================ */

// Share calendar with user
router.post('/calendars/:calendarId/share', authorize('admin', 'organizer'), shareCalendar);

// Get calendars shared with user
router.get('/shared-calendars', getSharedCalendars);

// Update calendar share permissions
router.put('/shares/:shareId', authorize('admin', 'organizer'), updateCalendarShare);

// Remove calendar share
router.delete('/shares/:shareId', authorize('admin', 'organizer'), removeCalendarShare);

/* ============================================================
   CALENDAR PREFERENCES
============================================================ */

// Set user preferences for calendar
router.post('/calendars/:calendarId/preferences', setCalendarPreferences);

// Get user preferences for calendar
router.get('/calendars/:calendarId/preferences', getCalendarPreferences);

/* ============================================================
   ACTIVITY LOG
============================================================ */

// Get calendar activity log
router.get('/calendars/:calendarId/activity', authorize('admin', 'organizer'), getCalendarActivityLog);

module.exports = router;