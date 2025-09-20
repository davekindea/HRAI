const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const scheduledReportingService = require('../services/scheduledReportingService');

const router = express.Router();

// Get scheduled reports
router.get('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { search, is_active, page, limit } = req.query;
    
    const filters = {
      search: search || null,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const scheduledReports = await scheduledReportingService.getScheduledReports(req.user.id, filters);
    
    res.json({
      success: true,
      data: scheduledReports,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: scheduledReports.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create scheduled report
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const scheduleConfig = req.body;
    
    // Validate required fields
    if (!scheduleConfig.name || !scheduleConfig.reportId || !scheduleConfig.schedule) {
      return res.status(400).json({
        success: false,
        error: 'Name, report ID, and schedule are required'
      });
    }

    // Add user context
    scheduleConfig.createdBy = req.user.id;
    
    const scheduledReport = await scheduledReportingService.createScheduledReport(scheduleConfig);
    
    res.status(201).json({
      success: true,
      data: {
        id: scheduledReport.id,
        name: scheduledReport.name,
        reportId: scheduledReport.reportId,
        schedule: scheduledReport.schedule,
        nextExecution: scheduledReport.nextExecution,
        isActive: scheduledReport.isActive,
        createdAt: scheduledReport.createdAt
      },
      message: 'Scheduled report created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific scheduled report
router.get('/:scheduleId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const scheduledJob = scheduledReportingService.scheduledJobs.get(scheduleId);
    
    if (!scheduledJob) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    // Check permissions
    if (!scheduledReportingService.canUserAccessSchedule(scheduledJob, req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to access this scheduled report'
      });
    }

    res.json({
      success: true,
      data: {
        id: scheduledJob.id,
        name: scheduledJob.name,
        reportId: scheduledJob.reportId,
        schedule: scheduledJob.schedule,
        recipients: scheduledJob.recipients,
        distributionLists: scheduledJob.distributionLists,
        format: scheduledJob.format,
        template: scheduledJob.template,
        filters: scheduledJob.filters,
        options: scheduledJob.options,
        isActive: scheduledJob.isActive,
        nextExecution: scheduledJob.nextExecution,
        lastExecuted: scheduledJob.lastExecuted,
        executionCount: scheduledJob.executionCount,
        failureCount: scheduledJob.failureCount,
        createdAt: scheduledJob.createdAt,
        createdBy: scheduledJob.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update scheduled report
router.put('/:scheduleId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;
    
    const updatedSchedule = await scheduledReportingService.updateScheduledReport(
      scheduleId, 
      updates, 
      req.user.id
    );
    
    res.json({
      success: true,
      data: {
        id: updatedSchedule.id,
        name: updatedSchedule.name,
        schedule: updatedSchedule.schedule,
        isActive: updatedSchedule.isActive,
        nextExecution: updatedSchedule.nextExecution,
        updatedAt: updatedSchedule.updatedAt
      },
      message: 'Scheduled report updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete scheduled report
router.delete('/:scheduleId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    await scheduledReportingService.deleteScheduledReport(scheduleId, req.user.id);
    
    res.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute scheduled report immediately
router.post('/:scheduleId/execute', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const scheduledJob = scheduledReportingService.scheduledJobs.get(scheduleId);
    
    if (!scheduledJob) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    // Check permissions
    if (!scheduledReportingService.canUserModifySchedule(scheduledJob, req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to execute this scheduled report'
      });
    }

    // Execute immediately
    await scheduledReportingService.executeScheduledReport(scheduleId);
    
    res.json({
      success: true,
      message: 'Scheduled report executed successfully',
      data: {
        executedAt: new Date().toISOString(),
        executionCount: scheduledJob.executionCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pause scheduled report
router.post('/:scheduleId/pause', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const updatedSchedule = await scheduledReportingService.updateScheduledReport(
      scheduleId, 
      { isActive: false }, 
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Scheduled report paused successfully',
      data: {
        id: scheduleId,
        isActive: false,
        updatedAt: updatedSchedule.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resume scheduled report
router.post('/:scheduleId/resume', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const updatedSchedule = await scheduledReportingService.updateScheduledReport(
      scheduleId, 
      { isActive: true }, 
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Scheduled report resumed successfully',
      data: {
        id: scheduleId,
        isActive: true,
        nextExecution: updatedSchedule.nextExecution,
        updatedAt: updatedSchedule.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get execution history for a scheduled report
router.get('/:scheduleId/history', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { limit } = req.query;
    
    const scheduledJob = scheduledReportingService.scheduledJobs.get(scheduleId);
    
    if (!scheduledJob) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    // Check permissions
    if (!scheduledReportingService.canUserAccessSchedule(scheduledJob, req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to access this scheduled report'
      });
    }

    // Mock execution history - in a real implementation this would come from a database
    const history = [
      {
        executedAt: scheduledJob.lastExecuted,
        status: 'success',
        recipientCount: scheduledJob.recipients.length,
        recordCount: Math.floor(Math.random() * 1000) + 100,
        duration: Math.floor(Math.random() * 60) + 10
      }
    ];
    
    res.json({
      success: true,
      data: {
        scheduleId,
        totalExecutions: scheduledJob.executionCount,
        successfulExecutions: scheduledJob.executionCount - scheduledJob.failureCount,
        failedExecutions: scheduledJob.failureCount,
        history: history.slice(0, parseInt(limit) || 50)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test scheduled report (validate configuration without saving)
router.post('/test', authenticateToken, requireManager, async (req, res) => {
  try {
    const testConfig = req.body;
    
    // Validate cron expression
    const cron = require('node-cron');
    if (!cron.validate(testConfig.schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron expression'
      });
    }

    // Validate report exists
    const reportBuilderService = require('../services/reportBuilderService');
    const report = reportBuilderService.savedReports.get(testConfig.reportId) || 
                   reportBuilderService.reportTemplates.get(testConfig.reportId);
    
    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Validate recipients
    if (!testConfig.recipients || testConfig.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one recipient is required'
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = testConfig.recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid email addresses: ${invalidEmails.join(', ')}`
      });
    }

    // Calculate next execution times
    const nextExecutions = [];
    const currentDate = new Date();
    
    // This is a simplified calculation - use a proper cron parser in production
    for (let i = 0; i < 5; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + i + 1);
      nextExecutions.push(nextDate.toISOString());
    }

    res.json({
      success: true,
      message: 'Scheduled report configuration is valid',
      data: {
        valid: true,
        reportName: report.name,
        recipientCount: testConfig.recipients.length,
        nextExecutions: nextExecutions,
        estimatedReportSize: 'Medium (< 1MB)',
        estimatedExecutionTime: '2-5 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available email templates
router.get('/templates/email', authenticateToken, requireManager, async (req, res) => {
  try {
    const templates = Array.from(scheduledReportingService.emailTemplates.entries()).map(([id, template]) => ({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subject: template.subject,
      description: `Template for ${id.replace(/_/g, ' ')} emails`
    }));
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get schedule configuration options
router.get('/config/schedules', authenticateToken, requireManager, async (req, res) => {
  try {
    const scheduleOptions = {
      presets: [
        {
          id: 'daily_weekdays',
          name: 'Daily (Weekdays)',
          description: 'Monday through Friday at 9:00 AM',
          cron: '0 9 * * 1-5'
        },
        {
          id: 'weekly_monday',
          name: 'Weekly (Monday)',
          description: 'Every Monday at 9:00 AM',
          cron: '0 9 * * 1'
        },
        {
          id: 'monthly_first',
          name: 'Monthly (1st)',
          description: 'First day of every month at 9:00 AM',
          cron: '0 9 1 * *'
        },
        {
          id: 'quarterly',
          name: 'Quarterly',
          description: 'First day of quarter at 9:00 AM',
          cron: '0 9 1 1,4,7,10 *'
        }
      ],
      supportedFormats: Object.keys(scheduledReportingService.reportFormats),
      deliveryMethods: Object.keys(scheduledReportingService.deliveryMethods),
      timezone: process.env.TIMEZONE || 'UTC',
      maxRecipients: 100
    };
    
    res.json({
      success: true,
      data: scheduleOptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system status
router.get('/system/status', authenticateToken, requireManager, async (req, res) => {
  try {
    const activeSchedules = Array.from(scheduledReportingService.scheduledJobs.values());
    
    const status = {
      totalSchedules: activeSchedules.length,
      activeSchedules: activeSchedules.filter(job => job.isActive).length,
      pausedSchedules: activeSchedules.filter(job => !job.isActive).length,
      totalExecutions: activeSchedules.reduce((sum, job) => sum + job.executionCount, 0),
      totalFailures: activeSchedules.reduce((sum, job) => sum + job.failureCount, 0),
      successRate: activeSchedules.length > 0 ? 
        ((activeSchedules.reduce((sum, job) => sum + job.executionCount, 0) - 
          activeSchedules.reduce((sum, job) => sum + job.failureCount, 0)) / 
         activeSchedules.reduce((sum, job) => sum + job.executionCount, 0) * 100).toFixed(2) : 100,
      nextExecution: activeSchedules
        .filter(job => job.isActive && job.nextExecution)
        .sort((a, b) => new Date(a.nextExecution) - new Date(b.nextExecution))[0]?.nextExecution || null,
      systemHealth: 'healthy'
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk operations
router.post('/bulk/pause', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleIds } = req.body;
    
    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      return res.status(400).json({
        success: false,
        error: 'Schedule IDs array is required'
      });
    }

    const results = [];
    
    for (const scheduleId of scheduleIds) {
      try {
        await scheduledReportingService.updateScheduledReport(
          scheduleId, 
          { isActive: false }, 
          req.user.id
        );
        results.push({ scheduleId, status: 'success' });
      } catch (error) {
        results.push({ scheduleId, status: 'error', error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk pause operation completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/bulk/resume', authenticateToken, requireManager, async (req, res) => {
  try {
    const { scheduleIds } = req.body;
    
    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      return res.status(400).json({
        success: false,
        error: 'Schedule IDs array is required'
      });
    }

    const results = [];
    
    for (const scheduleId of scheduleIds) {
      try {
        await scheduledReportingService.updateScheduledReport(
          scheduleId, 
          { isActive: true }, 
          req.user.id
        );
        results.push({ scheduleId, status: 'success' });
      } catch (error) {
        results.push({ scheduleId, status: 'error', error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk resume operation completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
