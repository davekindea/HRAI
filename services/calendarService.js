/**
 * Calendar Service - Shared calendars and scheduling
 * Handles shared calendars, event management, scheduling conflicts, and calendar integrations
 */

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const ical = require('ical-generator');

class CalendarService {
    constructor() {
        this.calendarSubscriptions = new Map();
        this.recurringEvents = new Map();
        this.conflictRules = new Map();
    }

    /**
     * CALENDAR MANAGEMENT
     */

    // Create a shared calendar
    async createSharedCalendar(data) {
        try {
            const calendar = {
                id: uuidv4(),
                name: data.name,
                description: data.description || '',
                type: data.type, // team, department, project, resource, interview
                color: data.color || '#007bff',
                
                // Access control
                owner: data.owner,
                permissions: {
                    public: data.permissions?.public || false,
                    viewOnly: data.permissions?.viewOnly || [],
                    contributors: data.permissions?.contributors || [],
                    administrators: data.permissions?.administrators || [data.owner]
                },
                
                // Settings
                defaultEventDuration: data.defaultEventDuration || 60, // minutes
                workingHours: data.workingHours || {
                    start: '09:00',
                    end: '17:00',
                    timezone: 'UTC'
                },
                workingDays: data.workingDays || [1, 2, 3, 4, 5], // Monday-Friday
                
                // Integration
                externalIntegrations: {
                    googleCalendar: data.googleCalendar || null,
                    outlookCalendar: data.outlookCalendar || null,
                    icalUrl: null // Generated later
                },
                
                // Metadata
                createdAt: moment().toISOString(),
                createdBy: data.owner,
                updatedAt: moment().toISOString(),
                isActive: true,
                
                // Statistics
                eventCount: 0,
                subscriberCount: 0
            };

            // Generate iCal URL
            calendar.externalIntegrations.icalUrl = `/api/calendars/${calendar.id}/ical`;

            return {
                success: true,
                calendarId: calendar.id,
                icalUrl: calendar.externalIntegrations.icalUrl,
                permissions: calendar.permissions
            };
        } catch (error) {
            throw new Error(`Failed to create shared calendar: ${error.message}`);
        }
    }

    // Get calendar details
    async getCalendar(calendarId, userId) {
        try {
            // Database query logic would go here
            const calendar = {}; // await this.queryCalendar(calendarId);
            
            // Check user permissions
            if (!this.canUserViewCalendar(userId, calendar)) {
                throw new Error('Insufficient permissions to view calendar');
            }

            return {
                success: true,
                calendar
            };
        } catch (error) {
            throw new Error(`Failed to get calendar: ${error.message}`);
        }
    }

    // List user's accessible calendars
    async getUserCalendars(userId, options = {}) {
        try {
            const {
                type,
                includeShared = true,
                includeOwned = true,
                page = 1,
                limit = 20
            } = options;

            // Database query logic would go here
            const calendars = []; // await this.queryUserCalendars(userId, options);

            return {
                success: true,
                calendars,
                pagination: {
                    page,
                    limit,
                    total: calendars.length
                }
            };
        } catch (error) {
            throw new Error(`Failed to get user calendars: ${error.message}`);
        }
    }

    /**
     * EVENT MANAGEMENT
     */

    // Create calendar event
    async createEvent(data) {
        try {
            const event = {
                id: uuidv4(),
                calendarId: data.calendarId,
                
                // Basic info
                title: data.title,
                description: data.description || '',
                type: data.type, // meeting, interview, task, deadline, break, training
                priority: data.priority || 'normal', // low, normal, high, urgent
                
                // Timing
                startTime: moment(data.startTime).toISOString(),
                endTime: moment(data.endTime).toISOString(),
                timezone: data.timezone || 'UTC',
                allDay: data.allDay || false,
                
                // Recurrence
                recurring: data.recurring || false,
                recurrencePattern: data.recurrencePattern || null, // daily, weekly, monthly, yearly, custom
                recurrenceEnd: data.recurrenceEnd || null,
                recurrenceCount: data.recurrenceCount || null,
                
                // Participants
                organizer: data.organizer,
                attendees: data.attendees || [],
                requiredAttendees: data.requiredAttendees || [],
                optionalAttendees: data.optionalAttendees || [],
                
                // Location
                location: {
                    type: data.location?.type || 'in_person', // in_person, virtual, hybrid
                    address: data.location?.address || '',
                    room: data.location?.room || '',
                    virtualLink: data.location?.virtualLink || '',
                    instructions: data.location?.instructions || ''
                },
                
                // Attachments and resources
                attachments: data.attachments || [],
                resources: data.resources || [], // meeting rooms, equipment
                
                // Reminders
                reminders: data.reminders || [
                    { type: 'email', minutes: 60 },
                    { type: 'push', minutes: 15 }
                ],
                
                // Status
                status: 'confirmed', // tentative, confirmed, cancelled
                visibility: data.visibility || 'default', // private, default, public
                
                // RSVP
                rsvpRequired: data.rsvpRequired || false,
                rsvpDeadline: data.rsvpDeadline || null,
                responses: new Map(),
                
                // Metadata
                createdAt: moment().toISOString(),
                createdBy: data.organizer,
                updatedAt: moment().toISOString(),
                
                // Integration
                externalEventIds: {
                    googleCalendar: null,
                    outlookCalendar: null
                }
            };

            // Check for conflicts
            const conflicts = await this.checkEventConflicts(event);
            if (conflicts.length > 0 && !data.ignoreConflicts) {
                return {
                    success: false,
                    conflicts,
                    suggestedTimes: await this.suggestAlternativeTimes(event)
                };
            }

            // Create recurring events if needed
            if (event.recurring) {
                const recurringEvents = await this.createRecurringEvents(event);
                event.recurringEventIds = recurringEvents.map(e => e.id);
            }

            // Send calendar invitations
            if (event.attendees.length > 0) {
                await this.sendCalendarInvitations(event);
            }

            // Schedule reminders
            await this.scheduleEventReminders(event);

            return {
                success: true,
                eventId: event.id,
                conflicts: conflicts.length,
                attendeeCount: event.attendees.length,
                recurringEventCount: event.recurringEventIds?.length || 0
            };
        } catch (error) {
            throw new Error(`Failed to create event: ${error.message}`);
        }
    }

    // Update calendar event
    async updateEvent(eventId, updates, userId) {
        try {
            // Database query logic would go here
            const event = {}; // await this.queryEvent(eventId);
            
            if (!this.canUserEditEvent(userId, event)) {
                throw new Error('Insufficient permissions to edit event');
            }

            // Check if time changed and conflicts exist
            if (updates.startTime || updates.endTime) {
                const updatedEvent = { ...event, ...updates };
                const conflicts = await this.checkEventConflicts(updatedEvent, eventId);
                
                if (conflicts.length > 0 && !updates.ignoreConflicts) {
                    return {
                        success: false,
                        conflicts,
                        suggestedTimes: await this.suggestAlternativeTimes(updatedEvent)
                    };
                }
            }

            // Apply updates
            const updatedEvent = {
                ...event,
                ...updates,
                updatedAt: moment().toISOString(),
                updatedBy: userId
            };

            // Notify attendees of changes
            if (this.hasSignificantChanges(event, updates)) {
                await this.notifyEventUpdate(updatedEvent, updates);
            }

            return {
                success: true,
                eventId,
                updatedFields: Object.keys(updates)
            };
        } catch (error) {
            throw new Error(`Failed to update event: ${error.message}`);
        }
    }

    // Delete calendar event
    async deleteEvent(eventId, userId, deleteAll = false) {
        try {
            // Database query logic would go here
            const event = {}; // await this.queryEvent(eventId);
            
            if (!this.canUserEditEvent(userId, event)) {
                throw new Error('Insufficient permissions to delete event');
            }

            // Handle recurring events
            if (event.recurring && deleteAll) {
                // Delete all instances
                for (const recurringEventId of event.recurringEventIds || []) {
                    // Delete recurring event
                }
            }

            // Notify attendees
            await this.notifyEventCancellation(event);

            return {
                success: true,
                eventId,
                deletedRecurringEvents: deleteAll ? (event.recurringEventIds?.length || 0) : 0
            };
        } catch (error) {
            throw new Error(`Failed to delete event: ${error.message}`);
        }
    }

    /**
     * CONFLICT DETECTION AND RESOLUTION
     */

    // Check for event conflicts
    async checkEventConflicts(event, excludeEventId = null) {
        try {
            const conflicts = [];
            const eventStart = moment(event.startTime);
            const eventEnd = moment(event.endTime);

            // Check attendee conflicts
            for (const attendeeId of event.attendees) {
                const attendeeEvents = await this.getUserEvents(attendeeId, {
                    startDate: eventStart.toISOString(),
                    endDate: eventEnd.toISOString()
                });

                for (const existingEvent of attendeeEvents) {
                    if (existingEvent.id === excludeEventId) continue;

                    const existingStart = moment(existingEvent.startTime);
                    const existingEnd = moment(existingEvent.endTime);

                    if (this.doEventsOverlap(eventStart, eventEnd, existingStart, existingEnd)) {
                        conflicts.push({
                            type: 'attendee_conflict',
                            attendeeId,
                            conflictingEvent: existingEvent,
                            overlapStart: moment.max(eventStart, existingStart).toISOString(),
                            overlapEnd: moment.min(eventEnd, existingEnd).toISOString()
                        });
                    }
                }
            }

            // Check resource conflicts
            for (const resourceId of event.resources) {
                const resourceEvents = await this.getResourceEvents(resourceId, {
                    startDate: eventStart.toISOString(),
                    endDate: eventEnd.toISOString()
                });

                for (const existingEvent of resourceEvents) {
                    if (existingEvent.id === excludeEventId) continue;

                    const existingStart = moment(existingEvent.startTime);
                    const existingEnd = moment(existingEvent.endTime);

                    if (this.doEventsOverlap(eventStart, eventEnd, existingStart, existingEnd)) {
                        conflicts.push({
                            type: 'resource_conflict',
                            resourceId,
                            conflictingEvent: existingEvent,
                            overlapStart: moment.max(eventStart, existingStart).toISOString(),
                            overlapEnd: moment.min(eventEnd, existingEnd).toISOString()
                        });
                    }
                }
            }

            return conflicts;
        } catch (error) {
            throw new Error(`Failed to check event conflicts: ${error.message}`);
        }
    }

    // Suggest alternative times
    async suggestAlternativeTimes(event, options = {}) {
        try {
            const {
                maxSuggestions = 5,
                searchDays = 7,
                preferredHours = [9, 10, 11, 14, 15, 16], // 9 AM - 4 PM
                duration = moment(event.endTime).diff(moment(event.startTime), 'minutes')
            } = options;

            const suggestions = [];
            const eventStart = moment(event.startTime);
            
            // Search for available slots
            for (let day = 0; day < searchDays && suggestions.length < maxSuggestions; day++) {
                const searchDate = eventStart.clone().add(day, 'days');
                
                for (const hour of preferredHours) {
                    if (suggestions.length >= maxSuggestions) break;
                    
                    const suggestedStart = searchDate.clone().hour(hour).minute(0).second(0);
                    const suggestedEnd = suggestedStart.clone().add(duration, 'minutes');
                    
                    // Skip weekends if not specified
                    if (!event.includeWeekends && [0, 6].includes(suggestedStart.day())) {
                        continue;
                    }
                    
                    const testEvent = {
                        ...event,
                        startTime: suggestedStart.toISOString(),
                        endTime: suggestedEnd.toISOString()
                    };
                    
                    const conflicts = await this.checkEventConflicts(testEvent);
                    
                    if (conflicts.length === 0) {
                        suggestions.push({
                            startTime: suggestedStart.toISOString(),
                            endTime: suggestedEnd.toISOString(),
                            confidence: this.calculateTimeConfidence(suggestedStart, preferredHours),
                            attendeeAvailability: await this.getAttendeeAvailability(event.attendees, suggestedStart, suggestedEnd)
                        });
                    }
                }
            }

            return suggestions.sort((a, b) => b.confidence - a.confidence);
        } catch (error) {
            throw new Error(`Failed to suggest alternative times: ${error.message}`);
        }
    }

    /**
     * CALENDAR VIEWS AND QUERIES
     */

    // Get calendar events for a time period
    async getCalendarEvents(calendarId, options = {}) {
        try {
            const {
                startDate,
                endDate,
                userId,
                view = 'month', // day, week, month, year
                includeRecurring = true
            } = options;

            // Check user permissions
            const calendar = {}; // await this.queryCalendar(calendarId);
            if (!this.canUserViewCalendar(userId, calendar)) {
                throw new Error('Insufficient permissions to view calendar');
            }

            // Query events
            const events = []; // await this.queryCalendarEvents(calendarId, options);

            // Expand recurring events if needed
            if (includeRecurring) {
                const expandedEvents = await this.expandRecurringEvents(events, startDate, endDate);
                events.push(...expandedEvents);
            }

            return {
                success: true,
                calendarId,
                events,
                view,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            };
        } catch (error) {
            throw new Error(`Failed to get calendar events: ${error.message}`);
        }
    }

    // Get user's events across all calendars
    async getUserEvents(userId, options = {}) {
        try {
            const {
                startDate,
                endDate,
                calendarTypes = [],
                includeDeclined = false
            } = options;

            // Get user's accessible calendars
            const userCalendars = await this.getUserCalendars(userId);
            const events = [];

            // Get events from each calendar
            for (const calendar of userCalendars.calendars) {
                if (calendarTypes.length > 0 && !calendarTypes.includes(calendar.type)) {
                    continue;
                }

                const calendarEvents = await this.getCalendarEvents(calendar.id, {
                    startDate,
                    endDate,
                    userId
                });

                // Filter events based on user's response
                const filteredEvents = calendarEvents.events.filter(event => {
                    if (!includeDeclined && event.responses.get(userId) === 'declined') {
                        return false;
                    }
                    return true;
                });

                events.push(...filteredEvents);
            }

            // Sort by start time
            events.sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));

            return {
                success: true,
                events,
                calendarCount: userCalendars.calendars.length
            };
        } catch (error) {
            throw new Error(`Failed to get user events: ${error.message}`);
        }
    }

    /**
     * RSVP AND RESPONSES
     */

    // Respond to event invitation
    async respondToEvent(eventId, userId, response, message = '') {
        try {
            const validResponses = ['accepted', 'declined', 'tentative'];
            if (!validResponses.includes(response)) {
                throw new Error('Invalid response. Must be: accepted, declined, or tentative');
            }

            // Database update logic would go here
            const event = {}; // await this.queryEvent(eventId);
            
            if (!event.attendees.includes(userId)) {
                throw new Error('User is not invited to this event');
            }

            // Update response
            event.responses.set(userId, {
                response,
                message,
                respondedAt: moment().toISOString()
            });

            // Notify organizer
            await this.notifyEventResponse(event, userId, response, message);

            return {
                success: true,
                eventId,
                response,
                responseCount: event.responses.size
            };
        } catch (error) {
            throw new Error(`Failed to respond to event: ${error.message}`);
        }
    }

    // Get event responses
    async getEventResponses(eventId, userId) {
        try {
            // Database query logic would go here
            const event = {}; // await this.queryEvent(eventId);
            
            if (!this.canUserViewEvent(userId, event)) {
                throw new Error('Insufficient permissions to view event responses');
            }

            const responses = Array.from(event.responses.entries()).map(([attendeeId, response]) => ({
                attendeeId,
                ...response
            }));

            const summary = {
                total: event.attendees.length,
                accepted: responses.filter(r => r.response === 'accepted').length,
                declined: responses.filter(r => r.response === 'declined').length,
                tentative: responses.filter(r => r.response === 'tentative').length,
                pending: event.attendees.length - responses.length
            };

            return {
                success: true,
                eventId,
                responses,
                summary
            };
        } catch (error) {
            throw new Error(`Failed to get event responses: ${error.message}`);
        }
    }

    /**
     * CALENDAR INTEGRATIONS
     */

    // Generate iCal feed
    async generateICalFeed(calendarId, userId) {
        try {
            // Check permissions
            const calendar = {}; // await this.queryCalendar(calendarId);
            if (!this.canUserViewCalendar(userId, calendar)) {
                throw new Error('Insufficient permissions to access calendar feed');
            }

            // Get events
            const events = await this.getCalendarEvents(calendarId, {
                startDate: moment().subtract(1, 'month').toISOString(),
                endDate: moment().add(6, 'months').toISOString(),
                userId
            });

            // Create iCal
            const cal = ical({
                domain: process.env.DOMAIN || 'localhost',
                name: calendar.name,
                description: calendar.description,
                timezone: 'UTC'
            });

            // Add events to iCal
            for (const event of events.events) {
                cal.createEvent({
                    start: moment(event.startTime).toDate(),
                    end: moment(event.endTime).toDate(),
                    summary: event.title,
                    description: event.description,
                    location: event.location?.address || event.location?.virtualLink,
                    uid: event.id,
                    organizer: {
                        name: 'HR System',
                        email: process.env.SYSTEM_EMAIL || 'noreply@company.com'
                    }
                });
            }

            return {
                success: true,
                icalData: cal.toString(),
                eventCount: events.events.length
            };
        } catch (error) {
            throw new Error(`Failed to generate iCal feed: ${error.message}`);
        }
    }

    // Sync with external calendar
    async syncExternalCalendar(calendarId, provider, credentials) {
        try {
            const validProviders = ['google', 'outlook', 'apple'];
            if (!validProviders.includes(provider)) {
                throw new Error('Invalid calendar provider');
            }

            // Provider-specific sync logic would go here
            switch (provider) {
                case 'google':
                    return await this.syncGoogleCalendar(calendarId, credentials);
                case 'outlook':
                    return await this.syncOutlookCalendar(calendarId, credentials);
                case 'apple':
                    return await this.syncAppleCalendar(calendarId, credentials);
            }
        } catch (error) {
            throw new Error(`Failed to sync external calendar: ${error.message}`);
        }
    }

    /**
     * UTILITY METHODS
     */

    // Check if two events overlap
    doEventsOverlap(start1, end1, start2, end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    // Check if user can view calendar
    canUserViewCalendar(userId, calendar) {
        return calendar.permissions.public ||
               calendar.permissions.viewOnly.includes(userId) ||
               calendar.permissions.contributors.includes(userId) ||
               calendar.permissions.administrators.includes(userId) ||
               calendar.owner === userId;
    }

    // Check if user can edit event
    canUserEditEvent(userId, event) {
        return event.organizer === userId ||
               event.createdBy === userId ||
               this.isCalendarAdmin(userId, event.calendarId);
    }

    // Check if user can view event
    canUserViewEvent(userId, event) {
        return event.attendees.includes(userId) ||
               event.organizer === userId ||
               this.canUserViewCalendar(userId, event.calendar);
    }

    // Check if user is calendar admin
    isCalendarAdmin(userId, calendarId) {
        // Database query logic would go here
        return false; // Simplified for now
    }

    // Check if updates are significant enough to notify attendees
    hasSignificantChanges(originalEvent, updates) {
        const significantFields = ['startTime', 'endTime', 'location', 'title'];
        return significantFields.some(field => updates.hasOwnProperty(field));
    }

    // Calculate confidence score for suggested time
    calculateTimeConfidence(suggestedTime, preferredHours) {
        const hour = suggestedTime.hour();
        const isPreferredHour = preferredHours.includes(hour);
        const isWeekday = ![0, 6].includes(suggestedTime.day());
        
        let confidence = 0.5; // Base confidence
        
        if (isPreferredHour) confidence += 0.3;
        if (isWeekday) confidence += 0.2;
        
        return Math.min(confidence, 1.0);
    }

    // Get attendee availability for a time slot
    async getAttendeeAvailability(attendees, startTime, endTime) {
        try {
            const availability = {};
            
            for (const attendeeId of attendees) {
                const userEvents = await this.getUserEvents(attendeeId, {
                    startDate: startTime.toISOString(),
                    endDate: endTime.toISOString()
                });
                
                availability[attendeeId] = {
                    available: userEvents.events.length === 0,
                    conflictCount: userEvents.events.length
                };
            }
            
            return availability;
        } catch (error) {
            throw new Error(`Failed to get attendee availability: ${error.message}`);
        }
    }

    // Send calendar invitations
    async sendCalendarInvitations(event) {
        try {
            // Email invitation logic would go here
            console.log(`Sending calendar invitations for event ${event.id}`);
        } catch (error) {
            console.error(`Failed to send calendar invitations: ${error.message}`);
        }
    }

    // Schedule event reminders
    async scheduleEventReminders(event) {
        try {
            for (const reminder of event.reminders) {
                const reminderTime = moment(event.startTime).subtract(reminder.minutes, 'minutes');
                
                if (reminderTime.isAfter(moment())) {
                    // Schedule reminder logic would go here
                    console.log(`Scheduling ${reminder.type} reminder for ${reminderTime.toISOString()}`);
                }
            }
        } catch (error) {
            console.error(`Failed to schedule event reminders: ${error.message}`);
        }
    }

    // Notify attendees of event updates
    async notifyEventUpdate(event, updates) {
        try {
            // Notification logic would go here
            console.log(`Notifying attendees of event update: ${event.id}`);
        } catch (error) {
            console.error(`Failed to notify event update: ${error.message}`);
        }
    }

    // Notify attendees of event cancellation
    async notifyEventCancellation(event) {
        try {
            // Notification logic would go here
            console.log(`Notifying attendees of event cancellation: ${event.id}`);
        } catch (error) {
            console.error(`Failed to notify event cancellation: ${error.message}`);
        }
    }

    // Notify organizer of event response
    async notifyEventResponse(event, userId, response, message) {
        try {
            // Notification logic would go here
            console.log(`Notifying organizer of event response: ${response} from ${userId}`);
        } catch (error) {
            console.error(`Failed to notify event response: ${error.message}`);
        }
    }

    // Create recurring events
    async createRecurringEvents(masterEvent) {
        try {
            const recurringEvents = [];
            // Recurring event creation logic would go here
            return recurringEvents;
        } catch (error) {
            throw new Error(`Failed to create recurring events: ${error.message}`);
        }
    }

    // Expand recurring events for a date range
    async expandRecurringEvents(events, startDate, endDate) {
        try {
            const expandedEvents = [];
            // Recurring event expansion logic would go here
            return expandedEvents;
        } catch (error) {
            throw new Error(`Failed to expand recurring events: ${error.message}`);
        }
    }

    // Get resource events
    async getResourceEvents(resourceId, options) {
        try {
            // Database query logic would go here
            return []; // await this.queryResourceEvents(resourceId, options);
        } catch (error) {
            throw new Error(`Failed to get resource events: ${error.message}`);
        }
    }

    // Sync with Google Calendar
    async syncGoogleCalendar(calendarId, credentials) {
        try {
            // Google Calendar API integration would go here
            return {
                success: true,
                provider: 'google',
                syncedEvents: 0
            };
        } catch (error) {
            throw new Error(`Failed to sync Google Calendar: ${error.message}`);
        }
    }

    // Sync with Outlook Calendar
    async syncOutlookCalendar(calendarId, credentials) {
        try {
            // Outlook Calendar API integration would go here
            return {
                success: true,
                provider: 'outlook',
                syncedEvents: 0
            };
        } catch (error) {
            throw new Error(`Failed to sync Outlook Calendar: ${error.message}`);
        }
    }

    // Sync with Apple Calendar
    async syncAppleCalendar(calendarId, credentials) {
        try {
            // Apple Calendar integration would go here
            return {
                success: true,
                provider: 'apple',
                syncedEvents: 0
            };
        } catch (error) {
            throw new Error(`Failed to sync Apple Calendar: ${error.message}`);
        }
    }
}

module.exports = new CalendarService();
