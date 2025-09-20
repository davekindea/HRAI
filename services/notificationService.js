/**
 * Notification Service - Alerts, notifications, and escalation workflows
 * Handles deadline alerts, interview stage notifications, status changes, and system notifications
 */

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

class NotificationService {
    constructor() {
        this.activeSubscriptions = new Map();
        this.scheduledNotifications = new Map();
        this.escalationRules = new Map();
        this.notificationChannels = ['email', 'sms', 'push', 'in_app', 'webhook'];
        this.initializeScheduler();
    }

    /**
     * NOTIFICATION MANAGEMENT
     */

    // Create a new notification
    async createNotification(data) {
        try {
            const notification = {
                id: uuidv4(),
                type: data.type, // deadline, interview_stage, status_change, system, escalation
                priority: data.priority || 'normal', // low, normal, high, urgent, critical
                category: data.category, // recruitment, scheduling, payroll, system
                title: data.title,
                message: data.message,
                entityType: data.entityType, // job, candidate, client, application, interview
                entityId: data.entityId,
                
                // Recipients
                recipients: data.recipients || [],
                recipientGroups: data.recipientGroups || [], // team, department, role
                
                // Delivery
                channels: data.channels || ['in_app'], // email, sms, push, in_app, webhook
                scheduleType: data.scheduleType || 'immediate', // immediate, scheduled, recurring
                scheduledFor: data.scheduledFor || null,
                recurringPattern: data.recurringPattern || null, // daily, weekly, monthly
                
                // Content
                actionUrl: data.actionUrl || null,
                actionButton: data.actionButton || null,
                attachments: data.attachments || [],
                
                // Metadata
                createdBy: data.createdBy,
                createdAt: moment().toISOString(),
                status: 'pending', // pending, sent, delivered, failed, cancelled
                deliveryAttempts: 0,
                maxRetries: data.maxRetries || 3,
                
                // Tracking
                readBy: new Map(),
                clickedBy: new Map(),
                dismissedBy: new Map(),
                
                // Escalation
                escalationEnabled: data.escalationEnabled || false,
                escalationDelay: data.escalationDelay || 60, // minutes
                escalationRecipients: data.escalationRecipients || [],
                
                // Expiration
                expiresAt: data.expiresAt || null,
                autoArchive: data.autoArchive || false
            };

            // Schedule notification
            if (notification.scheduleType === 'immediate') {
                await this.sendNotification(notification);
            } else if (notification.scheduleType === 'scheduled') {
                await this.scheduleNotification(notification);
            } else if (notification.scheduleType === 'recurring') {
                await this.setupRecurringNotification(notification);
            }

            return {
                success: true,
                notificationId: notification.id,
                scheduleType: notification.scheduleType,
                recipientCount: notification.recipients.length
            };
        } catch (error) {
            throw new Error(`Failed to create notification: ${error.message}`);
        }
    }

    // Send notification immediately
    async sendNotification(notification) {
        try {
            notification.status = 'sending';
            notification.sentAt = moment().toISOString();

            // Resolve recipient groups to individual users
            const allRecipients = await this.resolveRecipients(notification);

            // Send via each requested channel
            const deliveryResults = {};
            
            for (const channel of notification.channels) {
                try {
                    switch (channel) {
                        case 'email':
                            deliveryResults.email = await this.sendEmailNotification(notification, allRecipients);
                            break;
                        case 'sms':
                            deliveryResults.sms = await this.sendSMSNotification(notification, allRecipients);
                            break;
                        case 'push':
                            deliveryResults.push = await this.sendPushNotification(notification, allRecipients);
                            break;
                        case 'in_app':
                            deliveryResults.in_app = await this.sendInAppNotification(notification, allRecipients);
                            break;
                        case 'webhook':
                            deliveryResults.webhook = await this.sendWebhookNotification(notification, allRecipients);
                            break;
                    }
                } catch (channelError) {
                    deliveryResults[channel] = { success: false, error: channelError.message };
                }
            }

            // Update status based on delivery results
            const hasSuccessfulDelivery = Object.values(deliveryResults).some(result => result.success);
            notification.status = hasSuccessfulDelivery ? 'sent' : 'failed';
            notification.deliveryResults = deliveryResults;

            // Setup escalation if enabled and delivery failed
            if (!hasSuccessfulDelivery && notification.escalationEnabled) {
                await this.setupEscalation(notification);
            }

            return {
                success: hasSuccessfulDelivery,
                notificationId: notification.id,
                deliveryResults,
                recipientCount: allRecipients.length
            };
        } catch (error) {
            notification.status = 'failed';
            throw new Error(`Failed to send notification: ${error.message}`);
        }
    }

    /**
     * DEADLINE ALERTS
     */

    // Create deadline alert
    async createDeadlineAlert(data) {
        try {
            const alert = {
                id: uuidv4(),
                type: 'deadline',
                entityType: data.entityType, // application, interview, contract, task
                entityId: data.entityId,
                deadline: data.deadline,
                title: data.title,
                description: data.description,
                recipients: data.recipients,
                
                // Alert schedule
                alertSchedule: {
                    immediate: data.alertOnCreate || false,
                    beforeDeadline: [
                        { time: 24, unit: 'hours' },
                        { time: 2, unit: 'hours' },
                        { time: 30, unit: 'minutes' }
                    ],
                    onOverdue: true,
                    overdueInterval: { time: 1, unit: 'hour' }
                },
                
                createdAt: moment().toISOString(),
                status: 'active' // active, completed, cancelled
            };

            // Schedule all alerts
            await this.scheduleDeadlineAlerts(alert);

            return {
                success: true,
                alertId: alert.id,
                scheduledAlerts: alert.alertSchedule.beforeDeadline.length + 2 // +immediate +overdue
            };
        } catch (error) {
            throw new Error(`Failed to create deadline alert: ${error.message}`);
        }
    }

    // Schedule deadline alerts
    async scheduleDeadlineAlerts(alert) {
        try {
            const deadline = moment(alert.deadline);
            
            // Schedule before-deadline alerts
            for (const schedule of alert.alertSchedule.beforeDeadline) {
                const alertTime = deadline.clone().subtract(schedule.time, schedule.unit);
                
                if (alertTime.isAfter(moment())) {
                    await this.createNotification({
                        type: 'deadline',
                        priority: this.getDeadlinePriority(schedule.time, schedule.unit),
                        title: `Deadline Reminder: ${alert.title}`,
                        message: `${alert.description} - Due in ${schedule.time} ${schedule.unit}`,
                        recipients: alert.recipients,
                        scheduleType: 'scheduled',
                        scheduledFor: alertTime.toISOString(),
                        entityType: alert.entityType,
                        entityId: alert.entityId,
                        actionUrl: `/app/${alert.entityType}/${alert.entityId}`,
                        channels: ['email', 'in_app', 'push']
                    });
                }
            }

            // Schedule overdue alert
            if (alert.alertSchedule.onOverdue) {
                await this.createNotification({
                    type: 'deadline',
                    priority: 'urgent',
                    title: `OVERDUE: ${alert.title}`,
                    message: `${alert.description} - This deadline has passed`,
                    recipients: alert.recipients,
                    scheduleType: 'scheduled',
                    scheduledFor: deadline.toISOString(),
                    entityType: alert.entityType,
                    entityId: alert.entityId,
                    channels: ['email', 'in_app', 'push', 'sms'],
                    escalationEnabled: true,
                    escalationDelay: 30
                });
            }
        } catch (error) {
            throw new Error(`Failed to schedule deadline alerts: ${error.message}`);
        }
    }

    /**
     * INTERVIEW STAGE NOTIFICATIONS
     */

    // Notify interview stage change
    async notifyInterviewStageChange(data) {
        try {
            const {
                candidateId,
                jobId,
                interviewId,
                fromStage,
                toStage,
                scheduledBy,
                scheduledFor,
                interviewType,
                interviewers,
                notes
            } = data;

            // Notify candidate
            await this.createNotification({
                type: 'interview_stage',
                priority: 'high',
                title: `Interview Update - ${toStage}`,
                message: `Your interview stage has been updated to: ${toStage}`,
                recipients: [candidateId],
                channels: ['email', 'push'],
                entityType: 'interview',
                entityId: interviewId,
                actionUrl: `/candidate-portal/interview/${interviewId}`
            });

            // Notify interviewers
            if (interviewers && interviewers.length > 0) {
                await this.createNotification({
                    type: 'interview_stage',
                    priority: 'normal',
                    title: `Interview Scheduled - ${interviewType}`,
                    message: `New ${interviewType} scheduled for ${moment(scheduledFor).format('MMMM Do, YYYY at h:mm A')}`,
                    recipients: interviewers,
                    channels: ['email', 'in_app'],
                    entityType: 'interview',
                    entityId: interviewId,
                    actionUrl: `/app/interviews/${interviewId}`
                });
            }

            // Notify hiring manager
            await this.createNotification({
                type: 'interview_stage',
                priority: 'normal',
                title: `Interview Stage Updated`,
                message: `Candidate moved from ${fromStage} to ${toStage}`,
                recipients: [scheduledBy],
                channels: ['in_app'],
                entityType: 'interview',
                entityId: interviewId
            });

            return {
                success: true,
                notificationsSent: 2 + (interviewers ? interviewers.length : 0)
            };
        } catch (error) {
            throw new Error(`Failed to notify interview stage change: ${error.message}`);
        }
    }

    /**
     * STATUS CHANGE NOTIFICATIONS
     */

    // Notify application status change
    async notifyStatusChange(data) {
        try {
            const {
                entityType, // application, job, candidate, client
                entityId,
                fromStatus,
                toStatus,
                changedBy,
                reason,
                recipients,
                additionalData
            } = data;

            const notification = {
                type: 'status_change',
                priority: this.getStatusChangePriority(toStatus),
                title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Status Updated`,
                message: `Status changed from "${fromStatus}" to "${toStatus}"${reason ? ` - ${reason}` : ''}`,
                recipients: recipients,
                channels: this.getChannelsForStatusChange(toStatus),
                entityType,
                entityId,
                actionUrl: `/app/${entityType}/${entityId}`,
                createdBy: changedBy,
                metadata: {
                    fromStatus,
                    toStatus,
                    reason,
                    ...additionalData
                }
            };

            await this.createNotification(notification);

            return {
                success: true,
                notificationId: notification.id,
                statusChange: `${fromStatus} → ${toStatus}`
            };
        } catch (error) {
            throw new Error(`Failed to notify status change: ${error.message}`);
        }
    }

    /**
     * ESCALATION WORKFLOWS
     */

    // Setup escalation rule
    async createEscalationRule(data) {
        try {
            const rule = {
                id: uuidv4(),
                name: data.name,
                description: data.description,
                triggerConditions: {
                    entityType: data.entityType,
                    eventType: data.eventType, // deadline_missed, no_response, status_unchanged
                    priority: data.triggerPriority || 'high',
                    timeThreshold: data.timeThreshold // minutes
                },
                escalationLevels: data.escalationLevels || [
                    {
                        level: 1,
                        delay: 30, // minutes
                        recipients: data.level1Recipients || [],
                        channels: ['email', 'in_app']
                    },
                    {
                        level: 2,
                        delay: 60,
                        recipients: data.level2Recipients || [],
                        channels: ['email', 'in_app', 'sms']
                    },
                    {
                        level: 3,
                        delay: 120,
                        recipients: data.level3Recipients || [],
                        channels: ['email', 'in_app', 'sms', 'webhook']
                    }
                ],
                isActive: data.isActive !== false,
                createdAt: moment().toISOString(),
                createdBy: data.createdBy
            };

            this.escalationRules.set(rule.id, rule);

            return {
                success: true,
                ruleId: rule.id,
                escalationLevels: rule.escalationLevels.length
            };
        } catch (error) {
            throw new Error(`Failed to create escalation rule: ${error.message}`);
        }
    }

    // Setup escalation for notification
    async setupEscalation(notification) {
        try {
            if (!notification.escalationEnabled) return;

            const escalationId = uuidv4();
            const escalateAt = moment().add(notification.escalationDelay, 'minutes');

            // Schedule escalation
            setTimeout(async () => {
                await this.executeEscalation(notification, escalationId);
            }, notification.escalationDelay * 60 * 1000);

            return {
                success: true,
                escalationId,
                escalateAt: escalateAt.toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to setup escalation: ${error.message}`);
        }
    }

    // Execute escalation
    async executeEscalation(originalNotification, escalationId) {
        try {
            // Check if original notification was acknowledged
            if (originalNotification.readBy.size > 0) {
                return; // Escalation not needed
            }

            // Create escalated notification
            await this.createNotification({
                type: 'escalation',
                priority: 'urgent',
                title: `ESCALATED: ${originalNotification.title}`,
                message: `This notification requires immediate attention: ${originalNotification.message}`,
                recipients: originalNotification.escalationRecipients,
                channels: ['email', 'sms', 'push', 'in_app'],
                entityType: originalNotification.entityType,
                entityId: originalNotification.entityId,
                actionUrl: originalNotification.actionUrl,
                metadata: {
                    originalNotificationId: originalNotification.id,
                    escalationId,
                    escalationLevel: 1
                }
            });

            return {
                success: true,
                escalationId,
                escalatedAt: moment().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to execute escalation: ${error.message}`);
        }
    }

    /**
     * NOTIFICATION CHANNELS
     */

    // Send email notification
    async sendEmailNotification(notification, recipients) {
        try {
            // Email sending logic would go here
            // Integration with nodemailer, SendGrid, etc.
            
            return {
                success: true,
                channel: 'email',
                recipientCount: recipients.length,
                sentAt: moment().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                channel: 'email',
                error: error.message
            };
        }
    }

    // Send SMS notification
    async sendSMSNotification(notification, recipients) {
        try {
            // SMS sending logic would go here
            // Integration with Twilio, AWS SNS, etc.
            
            return {
                success: true,
                channel: 'sms',
                recipientCount: recipients.length,
                sentAt: moment().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                channel: 'sms',
                error: error.message
            };
        }
    }

    // Send push notification
    async sendPushNotification(notification, recipients) {
        try {
            // Push notification logic would go here
            // Integration with Firebase, OneSignal, etc.
            
            return {
                success: true,
                channel: 'push',
                recipientCount: recipients.length,
                sentAt: moment().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                channel: 'push',
                error: error.message
            };
        }
    }

    // Send in-app notification
    async sendInAppNotification(notification, recipients) {
        try {
            // Store in database for in-app display
            // Send via WebSocket for real-time display
            
            return {
                success: true,
                channel: 'in_app',
                recipientCount: recipients.length,
                sentAt: moment().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                channel: 'in_app',
                error: error.message
            };
        }
    }

    // Send webhook notification
    async sendWebhookNotification(notification, recipients) {
        try {
            // Webhook sending logic would go here
            // Integration with external systems
            
            return {
                success: true,
                channel: 'webhook',
                recipientCount: recipients.length,
                sentAt: moment().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                channel: 'webhook',
                error: error.message
            };
        }
    }

    /**
     * NOTIFICATION PREFERENCES
     */

    // Update user notification preferences
    async updateUserPreferences(userId, preferences) {
        try {
            const userPrefs = {
                userId,
                email: {
                    enabled: preferences.email?.enabled !== false,
                    frequency: preferences.email?.frequency || 'immediate', // immediate, hourly, daily
                    types: preferences.email?.types || ['deadline', 'interview_stage', 'escalation']
                },
                sms: {
                    enabled: preferences.sms?.enabled || false,
                    types: preferences.sms?.types || ['escalation']
                },
                push: {
                    enabled: preferences.push?.enabled !== false,
                    types: preferences.push?.types || ['deadline', 'interview_stage', 'status_change']
                },
                inApp: {
                    enabled: preferences.inApp?.enabled !== false,
                    types: preferences.inApp?.types || ['all']
                },
                quietHours: {
                    enabled: preferences.quietHours?.enabled || false,
                    start: preferences.quietHours?.start || '22:00',
                    end: preferences.quietHours?.end || '08:00',
                    timezone: preferences.quietHours?.timezone || 'UTC'
                },
                updatedAt: moment().toISOString()
            };

            // Store preferences (database logic would go here)
            
            return {
                success: true,
                userId,
                preferences: userPrefs
            };
        } catch (error) {
            throw new Error(`Failed to update user preferences: ${error.message}`);
        }
    }

    /**
     * UTILITY METHODS
     */

    // Resolve recipient groups to individual users
    async resolveRecipients(notification) {
        try {
            const allRecipients = [...notification.recipients];
            
            // Add users from recipient groups
            for (const group of notification.recipientGroups) {
                const groupUsers = await this.getUsersByGroup(group);
                allRecipients.push(...groupUsers);
            }

            // Remove duplicates
            return [...new Set(allRecipients)];
        } catch (error) {
            throw new Error(`Failed to resolve recipients: ${error.message}`);
        }
    }

    // Get users by group
    async getUsersByGroup(group) {
        try {
            // Database query logic would go here
            return []; // await this.queryUsersByGroup(group);
        } catch (error) {
            throw new Error(`Failed to get users by group: ${error.message}`);
        }
    }

    // Get deadline priority based on time remaining
    getDeadlinePriority(time, unit) {
        const minutes = moment.duration(time, unit).asMinutes();
        if (minutes <= 30) return 'urgent';
        if (minutes <= 120) return 'high';
        if (minutes <= 1440) return 'normal'; // 24 hours
        return 'low';
    }

    // Get status change priority
    getStatusChangePriority(status) {
        const urgentStatuses = ['rejected', 'hired', 'offer_extended'];
        const highStatuses = ['interview_scheduled', 'offer_negotiation'];
        
        if (urgentStatuses.includes(status.toLowerCase())) return 'urgent';
        if (highStatuses.includes(status.toLowerCase())) return 'high';
        return 'normal';
    }

    // Get channels for status change
    getChannelsForStatusChange(status) {
        const urgentStatuses = ['rejected', 'hired', 'offer_extended'];
        
        if (urgentStatuses.includes(status.toLowerCase())) {
            return ['email', 'push', 'in_app'];
        }
        return ['in_app', 'email'];
    }

    // Schedule notification
    async scheduleNotification(notification) {
        try {
            const scheduleTime = moment(notification.scheduledFor);
            const now = moment();
            
            if (scheduleTime.isBefore(now)) {
                throw new Error('Cannot schedule notification in the past');
            }

            const delay = scheduleTime.diff(now);
            
            setTimeout(async () => {
                await this.sendNotification(notification);
            }, delay);

            this.scheduledNotifications.set(notification.id, notification);

            return {
                success: true,
                notificationId: notification.id,
                scheduledFor: scheduleTime.toISOString(),
                delay: delay
            };
        } catch (error) {
            throw new Error(`Failed to schedule notification: ${error.message}`);
        }
    }

    // Setup recurring notification
    async setupRecurringNotification(notification) {
        try {
            const pattern = notification.recurringPattern;
            let cronPattern;

            switch (pattern) {
                case 'daily':
                    cronPattern = '0 9 * * *'; // 9 AM daily
                    break;
                case 'weekly':
                    cronPattern = '0 9 * * 1'; // 9 AM Monday
                    break;
                case 'monthly':
                    cronPattern = '0 9 1 * *'; // 9 AM 1st of month
                    break;
                default:
                    cronPattern = pattern; // Custom cron pattern
            }

            cron.schedule(cronPattern, async () => {
                await this.sendNotification(notification);
            });

            return {
                success: true,
                notificationId: notification.id,
                cronPattern,
                recurringPattern: pattern
            };
        } catch (error) {
            throw new Error(`Failed to setup recurring notification: ${error.message}`);
        }
    }

    // Initialize notification scheduler
    initializeScheduler() {
        // Daily cleanup of expired notifications
        cron.schedule('0 0 * * *', async () => {
            await this.cleanupExpiredNotifications();
        });

        // Hourly digest notifications
        cron.schedule('0 * * * *', async () => {
            await this.sendDigestNotifications();
        });
    }

    // Cleanup expired notifications
    async cleanupExpiredNotifications() {
        try {
            const now = moment();
            let cleanedCount = 0;

            for (const [id, notification] of this.scheduledNotifications) {
                if (notification.expiresAt && moment(notification.expiresAt).isBefore(now)) {
                    this.scheduledNotifications.delete(id);
                    cleanedCount++;
                }
            }

            return {
                success: true,
                cleanedCount,
                cleanedAt: now.toISOString()
            };
        } catch (error) {
            console.error(`Failed to cleanup expired notifications: ${error.message}`);
        }
    }

    // Send digest notifications
    async sendDigestNotifications() {
        try {
            // Logic for sending hourly/daily digest notifications
            // Group notifications by user and send summary
            console.log('Sending digest notifications...');
        } catch (error) {
            console.error(`Failed to send digest notifications: ${error.message}`);
        }
    }
}

module.exports = new NotificationService();
