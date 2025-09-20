const moment = require('moment');
const winston = require('winston');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configure scheduled reporting logger
const scheduledReportLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/scheduled-reports.log' }),
    new winston.transports.Console()
  ]
});

class ScheduledReportingService {
  constructor() {
    this.scheduledJobs = new Map();
    this.reportQueue = [];
    this.emailTemplates = new Map();
    this.distributionLists = new Map();
    
    this.scheduleTypes = {
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
      quarterly: 'quarterly',
      annually: 'annually',
      custom: 'custom'
    };

    this.deliveryMethods = {
      email: 'email',
      download: 'download_link',
      ftp: 'ftp_upload',
      api: 'api_webhook',
      dashboard: 'dashboard_notification'
    };

    this.reportFormats = {
      pdf: 'pdf',
      csv: 'csv',
      excel: 'xlsx',
      json: 'json'
    };

    this.initializeEmailTemplates();
    this.initializeDefaultSchedules();
  }

  // Initialize email templates
  initializeEmailTemplates() {
    this.emailTemplates.set('standard_report', {
      subject: 'Scheduled Report: {{reportName}} - {{date}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            {{reportName}}
          </h2>
          <p>Dear {{recipientName}},</p>
          <p>Please find your scheduled report attached for the period: <strong>{{reportPeriod}}</strong></p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Report Summary</h3>
            <ul>
              <li><strong>Report Name:</strong> {{reportName}}</li>
              <li><strong>Generated:</strong> {{generatedAt}}</li>
              <li><strong>Period:</strong> {{reportPeriod}}</li>
              <li><strong>Records:</strong> {{recordCount}}</li>
              <li><strong>Format:</strong> {{format}}</li>
            </ul>
          </div>
          
          {{#if insights}}
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">Key Insights</h3>
            <ul>
              {{#each insights}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
          
          <p>If you have any questions about this report, please contact the HR Analytics team.</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d;">
            This is an automated message from the HR Analytics System. 
            To modify your report subscriptions, please log in to the HR portal.
          </p>
        </div>
      `
    });

    this.emailTemplates.set('executive_summary', {
      subject: 'Executive Summary: {{reportName}} - {{date}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h1 style="color: #2c3e50; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 15px;">
            Executive Summary
          </h1>
          <h2 style="color: #34495e;">{{reportName}}</h2>
          
          <div style="display: flex; justify-content: space-between; background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="text-align: center;">
              <h3 style="margin: 0; color: #2980b9;">{{primaryMetric}}</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #27ae60;">{{primaryValue}}</p>
              <p style="margin: 0; font-size: 12px; color: #7f8c8d;">{{primaryChange}}</p>
            </div>
            <div style="text-align: center;">
              <h3 style="margin: 0; color: #2980b9;">{{secondaryMetric}}</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #e74c3c;">{{secondaryValue}}</p>
              <p style="margin: 0; font-size: 12px; color: #7f8c8d;">{{secondaryChange}}</p>
            </div>
          </div>
          
          <div style="background-color: #fff; border-left: 4px solid #3498db; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Key Highlights</h3>
            {{#each highlights}}
            <p style="margin: 10px 0;">• {{this}}</p>
            {{/each}}
          </div>
          
          <p>Detailed report is attached. For questions, contact the analytics team.</p>
        </div>
      `
    });

    scheduledReportLogger.info('Email templates initialized');
  }

  // Initialize default report schedules
  initializeDefaultSchedules() {
    const defaultSchedules = [
      {
        id: 'daily_recruitment_summary',
        name: 'Daily Recruitment Summary',
        reportId: 'recruitment_summary',
        schedule: '0 8 * * 1-5', // 8 AM weekdays
        recipients: ['hr-team@company.com'],
        format: 'pdf',
        template: 'standard_report'
      },
      {
        id: 'weekly_performance_overview',
        name: 'Weekly Performance Overview',
        reportId: 'performance_overview',
        schedule: '0 9 * * 1', // 9 AM Mondays
        recipients: ['managers@company.com'],
        format: 'excel',
        template: 'standard_report'
      },
      {
        id: 'monthly_executive_summary',
        name: 'Monthly Executive Summary',
        reportId: 'executive_dashboard',
        schedule: '0 10 1 * *', // 10 AM first day of month
        recipients: ['executives@company.com'],
        format: 'pdf',
        template: 'executive_summary'
      }
    ];

    defaultSchedules.forEach(schedule => {
      this.createScheduledReport(schedule);
    });

    scheduledReportLogger.info('Default report schedules initialized');
  }

  // Create scheduled report
  async createScheduledReport(scheduleConfig) {
    try {
      scheduledReportLogger.info('Creating scheduled report', { scheduleConfig });

      const scheduleId = scheduleConfig.id || this.generateScheduleId();
      const cronExpression = scheduleConfig.schedule;

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      const scheduledJob = {
        id: scheduleId,
        name: scheduleConfig.name,
        reportId: scheduleConfig.reportId,
        schedule: cronExpression,
        recipients: scheduleConfig.recipients || [],
        distributionLists: scheduleConfig.distributionLists || [],
        format: scheduleConfig.format || 'pdf',
        template: scheduleConfig.template || 'standard_report',
        filters: scheduleConfig.filters || {},
        options: scheduleConfig.options || {},
        isActive: scheduleConfig.isActive !== false,
        createdAt: new Date().toISOString(),
        lastExecuted: null,
        nextExecution: this.getNextExecutionTime(cronExpression),
        executionCount: 0,
        failureCount: 0,
        createdBy: scheduleConfig.createdBy || 'system'
      };

      // Create cron job
      const task = cron.schedule(cronExpression, async () => {
        await this.executeScheduledReport(scheduleId);
      }, {
        scheduled: scheduleConfig.isActive !== false,
        timezone: process.env.TIMEZONE || 'UTC'
      });

      scheduledJob.task = task;
      this.scheduledJobs.set(scheduleId, scheduledJob);

      scheduledReportLogger.info('Scheduled report created successfully', { scheduleId });
      return scheduledJob;
    } catch (error) {
      scheduledReportLogger.error('Failed to create scheduled report', { 
        error: error.message, 
        scheduleConfig 
      });
      throw error;
    }
  }

  // Execute scheduled report
  async executeScheduledReport(scheduleId) {
    try {
      scheduledReportLogger.info('Executing scheduled report', { scheduleId });

      const scheduledJob = this.scheduledJobs.get(scheduleId);
      if (!scheduledJob) {
        throw new Error(`Scheduled job not found: ${scheduleId}`);
      }

      if (!scheduledJob.isActive) {
        scheduledReportLogger.info('Skipping inactive scheduled report', { scheduleId });
        return;
      }

      // Generate report
      const reportResult = await this.generateScheduledReport(scheduledJob);

      // Distribute report
      await this.distributeReport(scheduledJob, reportResult);

      // Update execution statistics
      scheduledJob.lastExecuted = new Date().toISOString();
      scheduledJob.executionCount++;
      scheduledJob.nextExecution = this.getNextExecutionTime(scheduledJob.schedule);

      scheduledReportLogger.info('Scheduled report executed successfully', { 
        scheduleId, 
        executionCount: scheduledJob.executionCount 
      });
    } catch (error) {
      scheduledReportLogger.error('Failed to execute scheduled report', { 
        error: error.message, 
        scheduleId 
      });

      const scheduledJob = this.scheduledJobs.get(scheduleId);
      if (scheduledJob) {
        scheduledJob.failureCount++;
        
        // Send failure notification if configured
        await this.sendFailureNotification(scheduledJob, error);
      }
    }
  }

  // Generate scheduled report
  async generateScheduledReport(scheduledJob) {
    const reportBuilderService = require('./reportBuilderService');
    
    const executeOptions = {
      forceRefresh: true,
      includeInsights: true,
      ...scheduledJob.options
    };

    const reportResult = await reportBuilderService.executeReport(
      scheduledJob.reportId,
      'system',
      executeOptions
    );

    // Export to specified format
    const exportResult = await reportBuilderService.exportReport(
      scheduledJob.reportId,
      'system',
      scheduledJob.format,
      {
        includeMetadata: true,
        includeVisualizations: scheduledJob.options.includeVisualizations
      }
    );

    return {
      reportResult,
      exportResult,
      insights: await this.generateReportInsights(reportResult),
      executedAt: new Date().toISOString()
    };
  }

  // Distribute report via configured methods
  async distributeReport(scheduledJob, generatedReport) {
    const distributionMethods = scheduledJob.distributionMethods || ['email'];

    for (const method of distributionMethods) {
      switch (method) {
        case 'email':
          await this.distributeViaEmail(scheduledJob, generatedReport);
          break;
        case 'ftp':
          await this.distributeViaFTP(scheduledJob, generatedReport);
          break;
        case 'api':
          await this.distributeViaAPI(scheduledJob, generatedReport);
          break;
        case 'dashboard':
          await this.distributeViaDashboard(scheduledJob, generatedReport);
          break;
        default:
          scheduledReportLogger.warn('Unknown distribution method', { 
            method, 
            scheduleId: scheduledJob.id 
          });
      }
    }
  }

  // Distribute via email
  async distributeViaEmail(scheduledJob, generatedReport) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const template = this.emailTemplates.get(scheduledJob.template);
      const templateData = {
        reportName: scheduledJob.name,
        date: moment().format('YYYY-MM-DD'),
        reportPeriod: this.getReportPeriod(scheduledJob),
        generatedAt: moment(generatedReport.executedAt).format('YYYY-MM-DD HH:mm:ss'),
        recordCount: generatedReport.reportResult.totalRecords,
        format: scheduledJob.format.toUpperCase(),
        insights: generatedReport.insights,
        recipientName: '{{recipientName}}' // Will be replaced per recipient
      };

      // Get all recipients
      const allRecipients = await this.getAllRecipients(scheduledJob);

      for (const recipient of allRecipients) {
        const personalizedTemplate = this.personalizeTemplate(template, {
          ...templateData,
          recipientName: recipient.name || recipient.email
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || 'hr-analytics@company.com',
          to: recipient.email,
          subject: personalizedTemplate.subject,
          html: personalizedTemplate.html,
          attachments: [
            {
              filename: generatedReport.exportResult.filename,
              path: generatedReport.exportResult.filepath
            }
          ]
        };

        await transporter.sendMail(mailOptions);
        
        scheduledReportLogger.info('Report email sent successfully', { 
          scheduleId: scheduledJob.id,
          recipient: recipient.email 
        });
      }
    } catch (error) {
      scheduledReportLogger.error('Failed to distribute report via email', { 
        error: error.message,
        scheduleId: scheduledJob.id 
      });
      throw error;
    }
  }

  // Get all recipients including distribution lists
  async getAllRecipients(scheduledJob) {
    const recipients = [];

    // Add direct recipients
    for (const recipientEmail of scheduledJob.recipients) {
      recipients.push({
        email: recipientEmail,
        name: recipientEmail.split('@')[0]
      });
    }

    // Add distribution list members
    for (const listId of scheduledJob.distributionLists || []) {
      const listMembers = this.distributionLists.get(listId) || [];
      recipients.push(...listMembers);
    }

    return recipients;
  }

  // Generate report insights
  async generateReportInsights(reportResult) {
    const insights = [];

    // Basic insights based on data
    if (reportResult.totalRecords > 0) {
      insights.push(`Report contains ${reportResult.totalRecords} records`);
    }

    // Add data source specific insights
    switch (reportResult.dataSource) {
      case 'applications':
        insights.push('Peak application times identified for optimization');
        insights.push('Top recruitment sources showing strong performance');
        break;
      case 'performance':
        insights.push('Performance ratings trending upward this quarter');
        insights.push('Goal completion rates exceed target by 5%');
        break;
      case 'attendance':
        insights.push('Attendance rates stable across all departments');
        insights.push('Remote work adoption continues to grow');
        break;
      default:
        insights.push('Data trends analyzed for actionable insights');
    }

    return insights;
  }

  // Get scheduled reports list
  async getScheduledReports(userId, filters = {}) {
    try {
      const scheduledReports = Array.from(this.scheduledJobs.values())
        .filter(job => {
          // Filter by user permissions
          return this.canUserAccessSchedule(job, userId);
        })
        .map(job => ({
          id: job.id,
          name: job.name,
          reportId: job.reportId,
          schedule: job.schedule,
          nextExecution: job.nextExecution,
          lastExecuted: job.lastExecuted,
          executionCount: job.executionCount,
          failureCount: job.failureCount,
          isActive: job.isActive,
          format: job.format,
          recipientCount: job.recipients.length + (job.distributionLists || []).length,
          createdAt: job.createdAt,
          createdBy: job.createdBy
        }));

      // Apply filters
      let filteredReports = scheduledReports;

      if (filters.search) {
        filteredReports = filteredReports.filter(report =>
          report.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.isActive !== undefined) {
        filteredReports = filteredReports.filter(report =>
          report.isActive === filters.isActive
        );
      }

      return filteredReports;
    } catch (error) {
      scheduledReportLogger.error('Failed to get scheduled reports', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  // Update scheduled report
  async updateScheduledReport(scheduleId, updates, userId) {
    try {
      scheduledReportLogger.info('Updating scheduled report', { scheduleId, updates, userId });

      const scheduledJob = this.scheduledJobs.get(scheduleId);
      if (!scheduledJob) {
        throw new Error(`Scheduled report not found: ${scheduleId}`);
      }

      // Check permissions
      if (!this.canUserModifySchedule(scheduledJob, userId)) {
        throw new Error('Insufficient permissions to modify this schedule');
      }

      // Stop current task if schedule is changing
      if (updates.schedule && updates.schedule !== scheduledJob.schedule) {
        scheduledJob.task.stop();
        
        // Create new task with updated schedule
        const newTask = cron.schedule(updates.schedule, async () => {
          await this.executeScheduledReport(scheduleId);
        }, {
          scheduled: updates.isActive !== undefined ? updates.isActive : scheduledJob.isActive,
          timezone: process.env.TIMEZONE || 'UTC'
        });
        
        scheduledJob.task = newTask;
        scheduledJob.nextExecution = this.getNextExecutionTime(updates.schedule);
      }

      // Update job properties
      Object.assign(scheduledJob, updates, {
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      });

      scheduledReportLogger.info('Scheduled report updated successfully', { scheduleId });
      return scheduledJob;
    } catch (error) {
      scheduledReportLogger.error('Failed to update scheduled report', { 
        error: error.message, 
        scheduleId, 
        userId 
      });
      throw error;
    }
  }

  // Delete scheduled report
  async deleteScheduledReport(scheduleId, userId) {
    try {
      scheduledReportLogger.info('Deleting scheduled report', { scheduleId, userId });

      const scheduledJob = this.scheduledJobs.get(scheduleId);
      if (!scheduledJob) {
        throw new Error(`Scheduled report not found: ${scheduleId}`);
      }

      // Check permissions
      if (!this.canUserModifySchedule(scheduledJob, userId)) {
        throw new Error('Insufficient permissions to delete this schedule');
      }

      // Stop and remove the cron task
      scheduledJob.task.stop();
      this.scheduledJobs.delete(scheduleId);

      scheduledReportLogger.info('Scheduled report deleted successfully', { scheduleId });
      return true;
    } catch (error) {
      scheduledReportLogger.error('Failed to delete scheduled report', { 
        error: error.message, 
        scheduleId, 
        userId 
      });
      throw error;
    }
  }

  // Send failure notification
  async sendFailureNotification(scheduledJob, error) {
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@company.com'];
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || 'hr-analytics@company.com',
        to: adminEmails.join(','),
        subject: `Scheduled Report Failure: ${scheduledJob.name}`,
        html: `
          <h2>Scheduled Report Execution Failed</h2>
          <p><strong>Report:</strong> ${scheduledJob.name}</p>
          <p><strong>Schedule ID:</strong> ${scheduledJob.id}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Failure Count:</strong> ${scheduledJob.failureCount}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          
          <p>Please check the system logs for more details.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      
      scheduledReportLogger.info('Failure notification sent', { 
        scheduleId: scheduledJob.id 
      });
    } catch (notificationError) {
      scheduledReportLogger.error('Failed to send failure notification', { 
        error: notificationError.message,
        scheduleId: scheduledJob.id 
      });
    }
  }

  // Utility methods
  generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getNextExecutionTime(cronExpression) {
    // Simple next execution calculation - in production use a proper cron parser
    return moment().add(1, 'day').toISOString();
  }

  getReportPeriod(scheduledJob) {
    const now = moment();
    if (scheduledJob.schedule.includes('* * 1 *')) {
      return now.format('MMMM YYYY');
    } else if (scheduledJob.schedule.includes('* * *')) {
      return now.format('YYYY-MM-DD');
    }
    return 'Current Period';
  }

  personalizeTemplate(template, data) {
    let subject = template.subject;
    let html = template.html;

    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, data[key] || '');
      html = html.replace(placeholder, data[key] || '');
    });

    return { subject, html };
  }

  canUserAccessSchedule(scheduledJob, userId) {
    // Simple permission check - enhance based on requirements
    return true;
  }

  canUserModifySchedule(scheduledJob, userId) {
    // Simple permission check - enhance based on requirements
    return scheduledJob.createdBy === userId || userId === 'admin';
  }

  // Stop all scheduled jobs
  stopAllSchedules() {
    this.scheduledJobs.forEach(job => {
      job.task.stop();
    });
    scheduledReportLogger.info('All scheduled reports stopped');
  }

  // Restart all active scheduled jobs
  restartActiveSchedules() {
    this.scheduledJobs.forEach(job => {
      if (job.isActive) {
        job.task.start();
      }
    });
    scheduledReportLogger.info('Active scheduled reports restarted');
  }
}

module.exports = new ScheduledReportingService();
