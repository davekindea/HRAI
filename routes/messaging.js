/**
 * Messaging Routes - API endpoints for internal messaging and team collaboration
 * Handles direct messages, group messages, comments, and real-time communication
 */

const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');

/**
 * DIRECT MESSAGING
 */

// Send direct message
router.post('/direct', async (req, res) => {
    try {
        const result = await messagingService.sendDirectMessage({
            senderId: req.user.id,
            recipientId: req.body.recipientId,
            subject: req.body.subject,
            content: req.body.content,
            attachments: req.body.attachments,
            priority: req.body.priority,
            threadId: req.body.threadId,
            replyToId: req.body.replyToId,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send direct message',
            details: error.message 
        });
    }
});

// Get user inbox
router.get('/inbox', async (req, res) => {
    try {
        const result = await messagingService.getUserInbox(req.user.id, {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            filter: req.query.filter,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get inbox',
            details: error.message 
        });
    }
});

// Mark message as read
router.patch('/messages/:messageId/read', async (req, res) => {
    try {
        const result = await messagingService.markMessageAsRead(
            req.params.messageId,
            req.user.id
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark message as read',
            details: error.message 
        });
    }
});

// Archive message
router.patch('/messages/:messageId/archive', async (req, res) => {
    try {
        const result = await messagingService.archiveMessage(
            req.params.messageId,
            req.user.id
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to archive message',
            details: error.message 
        });
    }
});

// Search messages
router.get('/search', async (req, res) => {
    try {
        const result = await messagingService.searchMessages(req.user.id, req.query.q, {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            sender: req.query.sender,
            messageType: req.query.messageType,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search messages',
            details: error.message 
        });
    }
});

/**
 * GROUP MESSAGING
 */

// Send group message
router.post('/group', async (req, res) => {
    try {
        const result = await messagingService.sendGroupMessage({
            senderId: req.user.id,
            groupId: req.body.groupId,
            groupType: req.body.groupType,
            subject: req.body.subject,
            content: req.body.content,
            attachments: req.body.attachments,
            priority: req.body.priority,
            recipients: req.body.recipients,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send group message',
            details: error.message 
        });
    }
});

/**
 * COMMENTS AND COLLABORATION
 */

// Add comment to entity
router.post('/comments', async (req, res) => {
    try {
        const result = await messagingService.addComment({
            entityType: req.body.entityType,
            entityId: req.body.entityId,
            userId: req.user.id,
            content: req.body.content,
            attachments: req.body.attachments,
            mentions: req.body.mentions,
            tags: req.body.tags,
            visibility: req.body.visibility,
            threadId: req.body.threadId,
            parentCommentId: req.body.parentCommentId
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add comment',
            details: error.message 
        });
    }
});

// Get comments for entity
router.get('/comments/:entityType/:entityId', async (req, res) => {
    try {
        const result = await messagingService.getEntityComments(
            req.params.entityType,
            req.params.entityId,
            {
                userId: req.user.id,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            }
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get comments',
            details: error.message 
        });
    }
});

// Add feedback
router.post('/feedback', async (req, res) => {
    try {
        const result = await messagingService.addFeedback({
            type: req.body.type,
            entityType: req.body.entityType,
            entityId: req.body.entityId,
            fromUserId: req.user.id,
            toUserId: req.body.toUserId,
            rating: req.body.rating,
            content: req.body.content,
            categories: req.body.categories,
            isAnonymous: req.body.isAnonymous,
            visibility: req.body.visibility,
            followUpRequired: req.body.followUpRequired
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add feedback',
            details: error.message 
        });
    }
});

/**
 * REAL-TIME MESSAGING
 */

// Send typing indicator
router.post('/typing', async (req, res) => {
    try {
        await messagingService.sendTypingIndicator(
            req.user.id,
            req.body.recipientId,
            req.body.isTyping
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send typing indicator',
            details: error.message 
        });
    }
});

/**
 * STATISTICS AND ANALYTICS
 */

// Get messaging statistics
router.get('/stats', async (req, res) => {
    try {
        const result = await messagingService.getMessagingStats(
            req.user.id,
            req.query.period
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get messaging statistics',
            details: error.message 
        });
    }
});

module.exports = router;
