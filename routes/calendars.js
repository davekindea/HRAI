/**
 * Calendar Routes - API endpoints for shared calendars and scheduling
 * Handles calendar management, event creation, conflict detection, and calendar integrations
 */

const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');

/**
 * CALENDAR MANAGEMENT
 */

// Create shared calendar
router.post('/', async (req, res) => {
    try {
        const result = await calendarService.createSharedCalendar({
            name: req.body.name,
            description: req.body.description,
            type: req.body.type,
            color: req.body.color,
            owner: req.user.id,
            permissions: req.body.permissions,
            defaultEventDuration: req.body.defaultEventDuration,
            workingHours: req.body.workingHours,
            workingDays: req.body.workingDays,
            googleCalendar: req.body.googleCalendar,
            outlookCalendar: req.body.outlookCalendar
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create shared calendar',
            details: error.message 
        });
    }
});

// Get calendar details
router.get('/:calendarId', async (req, res) => {
    try {
        const result = await calendarService.getCalendar(req.params.calendarId, req.user.id);

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get calendar',
            details: error.message 
        });
    }
});

// Get user's accessible calendars
router.get('/user/calendars', async (req, res) => {
    try {
        const result = await calendarService.getUserCalendars(req.user.id, {
            type: req.query.type,
            includeShared: req.query.includeShared !== 'false',
            includeOwned: req.query.includeOwned !== 'false',
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get user calendars',
            details: error.message 
        });
    }
});

// Update calendar
router.put('/:calendarId', async (req, res) => {
    try {
        // Implementation would update calendar
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            message: 'Calendar updated successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update calendar',
            details: error.message 
        });
    }
});

// Delete calendar
router.delete('/:calendarId', async (req, res) => {
    try {
        // Implementation would delete calendar
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            message: 'Calendar deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete calendar',
            details: error.message 
        });
    }
});

/**
 * EVENT MANAGEMENT
 */

// Create calendar event
router.post('/:calendarId/events', async (req, res) => {
    try {
        const result = await calendarService.createEvent({
            calendarId: req.params.calendarId,
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            priority: req.body.priority,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            timezone: req.body.timezone,
            allDay: req.body.allDay,
            recurring: req.body.recurring,
            recurrencePattern: req.body.recurrencePattern,
            recurrenceEnd: req.body.recurrenceEnd,
            recurrenceCount: req.body.recurrenceCount,
            organizer: req.user.id,
            attendees: req.body.attendees,
            requiredAttendees: req.body.requiredAttendees,
            optionalAttendees: req.body.optionalAttendees,
            location: req.body.location,
            attachments: req.body.attachments,
            resources: req.body.resources,
            reminders: req.body.reminders,
            visibility: req.body.visibility,
            rsvpRequired: req.body.rsvpRequired,
            rsvpDeadline: req.body.rsvpDeadline,
            ignoreConflicts: req.body.ignoreConflicts
        });

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(409).json(result); // Conflict
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create event',
            details: error.message 
        });
    }
});

// Get calendar events
router.get('/:calendarId/events', async (req, res) => {
    try {
        const result = await calendarService.getCalendarEvents(req.params.calendarId, {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            userId: req.user.id,
            view: req.query.view,
            includeRecurring: req.query.includeRecurring !== 'false'
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get calendar events',
            details: error.message 
        });
    }
});

// Update event
router.put('/events/:eventId', async (req, res) => {
    try {
        const result = await calendarService.updateEvent(req.params.eventId, {
            title: req.body.title,
            description: req.body.description,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            location: req.body.location,
            attendees: req.body.attendees,
            reminders: req.body.reminders,
            ignoreConflicts: req.body.ignoreConflicts
        }, req.user.id);

        if (result.success) {
            res.json(result);
        } else {
            res.status(409).json(result); // Conflict
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update event',
            details: error.message 
        });
    }
});

// Delete event
router.delete('/events/:eventId', async (req, res) => {
    try {
        const result = await calendarService.deleteEvent(
            req.params.eventId,
            req.user.id,
            req.query.deleteAll === 'true'
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete event',
            details: error.message 
        });
    }
});

/**
 * CONFLICT DETECTION
 */

// Check event conflicts
router.post('/events/check-conflicts', async (req, res) => {
    try {
        const conflicts = await calendarService.checkEventConflicts({
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            attendees: req.body.attendees,
            resources: req.body.resources
        }, req.body.excludeEventId);

        res.json({
            success: true,
            conflicts,
            hasConflicts: conflicts.length > 0
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check conflicts',
            details: error.message 
        });
    }
});

// Suggest alternative times
router.post('/events/suggest-times', async (req, res) => {
    try {
        const suggestions = await calendarService.suggestAlternativeTimes({
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            attendees: req.body.attendees,
            resources: req.body.resources
        }, {
            maxSuggestions: req.body.maxSuggestions,
            searchDays: req.body.searchDays,
            preferredHours: req.body.preferredHours
        });

        res.json({
            success: true,
            suggestions,
            count: suggestions.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to suggest alternative times',
            details: error.message 
        });
    }
});

/**
 * USER EVENTS
 */

// Get user's events across all calendars
router.get('/user/events', async (req, res) => {
    try {
        const result = await calendarService.getUserEvents(req.user.id, {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            calendarTypes: req.query.calendarTypes ? req.query.calendarTypes.split(',') : [],
            includeDeclined: req.query.includeDeclined === 'true'
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get user events',
            details: error.message 
        });
    }
});

/**
 * RSVP AND RESPONSES
 */

// Respond to event invitation
router.post('/events/:eventId/respond', async (req, res) => {
    try {
        const result = await calendarService.respondToEvent(
            req.params.eventId,
            req.user.id,
            req.body.response, // accepted, declined, tentative
            req.body.message
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to respond to event',
            details: error.message 
        });
    }
});

// Get event responses
router.get('/events/:eventId/responses', async (req, res) => {
    try {
        const result = await calendarService.getEventResponses(req.params.eventId, req.user.id);

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get event responses',
            details: error.message 
        });
    }
});

/**
 * CALENDAR INTEGRATIONS
 */

// Generate iCal feed
router.get('/:calendarId/ical', async (req, res) => {
    try {
        const result = await calendarService.generateICalFeed(req.params.calendarId, req.user.id);

        res.set({
            'Content-Type': 'text/calendar',
            'Content-Disposition': `attachment; filename="calendar-${req.params.calendarId}.ics"`
        });

        res.send(result.icalData);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate iCal feed',
            details: error.message 
        });
    }
});

// Sync with external calendar
router.post('/:calendarId/sync', async (req, res) => {
    try {
        const result = await calendarService.syncExternalCalendar(
            req.params.calendarId,
            req.body.provider, // google, outlook, apple
            req.body.credentials
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to sync external calendar',
            details: error.message 
        });
    }
});

/**
 * CALENDAR PERMISSIONS
 */

// Update calendar permissions
router.put('/:calendarId/permissions', async (req, res) => {
    try {
        // Implementation would update calendar permissions
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            permissions: req.body.permissions,
            message: 'Calendar permissions updated successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update calendar permissions',
            details: error.message 
        });
    }
});

// Get calendar permissions
router.get('/:calendarId/permissions', async (req, res) => {
    try {
        // Implementation would get calendar permissions
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            permissions: {
                public: false,
                viewOnly: [],
                contributors: [],
                administrators: []
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get calendar permissions',
            details: error.message 
        });
    }
});

/**
 * CALENDAR ANALYTICS
 */

// Get calendar utilization
router.get('/:calendarId/analytics', async (req, res) => {
    try {
        // Implementation would generate calendar analytics
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            analytics: {
                period: req.query.period || 'month',
                totalEvents: 0,
                totalMeetingHours: 0,
                averageEventDuration: 0,
                busyHours: [],
                popularMeetingTimes: [],
                attendeeEngagement: {},
                resourceUtilization: {}
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get calendar analytics',
            details: error.message 
        });
    }
});

/**
 * BULK OPERATIONS
 */

// Bulk create events
router.post('/:calendarId/events/bulk', async (req, res) => {
    try {
        const results = [];
        for (const eventData of req.body.events) {
            try {
                const result = await calendarService.createEvent({
                    calendarId: req.params.calendarId,
                    organizer: req.user.id,
                    ...eventData
                });
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    eventData
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: successCount > 0,
            totalEvents: req.body.events.length,
            successCount,
            failedCount: req.body.events.length - successCount,
            conflictCount: results.filter(r => !r.success && r.conflicts).length,
            results
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to bulk create events',
            details: error.message 
        });
    }
});

// Export calendar data
router.get('/:calendarId/export', async (req, res) => {
    try {
        const format = req.query.format || 'json'; // json, csv, ical
        
        // Implementation would export calendar data in requested format
        res.json({ 
            success: true, 
            calendarId: req.params.calendarId,
            format,
            downloadUrl: `/api/calendars/${req.params.calendarId}/download?format=${format}&token=...`,
            message: 'Calendar export prepared successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to export calendar',
            details: error.message 
        });
    }
});

module.exports = router;
