const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create necessary directories for enhanced features
const directories = [
  'logs',
  'tmp/calendars',
  'tmp/archival',
  'tmp/exports',
  'archives',
  'uploads/resumes',
  'uploads/documents',
  'uploads/onboarding',
  'uploads/compliance/encrypted',
  'exports',
  'exports/csv',
  'exports/excel',
  'exports/pdf',
  'exports/json',
  'exports/temp',
  'exports/bulk'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Import database setup
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const candidateRoutes = require('./routes/candidates');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

// Import enhanced routes
const interviewRoutes = require('./routes/interviews');
const assessmentRoutes = require('./routes/assessments');
const gdprRoutes = require('./routes/gdpr');
const analyticsEnhancedRoutes = require('./routes/analyticsEnhanced');

// Import job management routes
const jobManagementRoutes = require('./routes/jobManagement');
const clientPortalRoutes = require('./routes/clientPortal');
const jobReportingRoutes = require('./routes/jobReporting');

// Import client engagement routes
const clientEngagementRoutes = require('./routes/clientEngagement');
const contractNegotiationRoutes = require('./routes/contractNegotiation');
const communicationRoutes = require('./routes/communication');
const billingRoutes = require('./routes/billing');
const clientPerformanceRoutes = require('./routes/clientPerformance');

// Import onboarding and offers routes
const offersRoutes = require('./routes/offers');
const onboardingRoutes = require('./routes/onboarding');
const backgroundChecksRoutes = require('./routes/backgroundChecks');
const complianceRoutes = require('./routes/compliance');

// Import scheduling and shift management routes
const schedulesRoutes = require('./routes/schedules');
const timekeepingRoutes = require('./routes/timekeeping');
const availabilityRoutes = require('./routes/availability');
const payrollIntegrationRoutes = require('./routes/payrollIntegration');

// Import communication and collaboration routes
const messagingRoutes = require('./routes/messaging');
const notificationRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendars');
const portalRoutes = require('./routes/portals');
const auditRoutes = require('./routes/audit');
const templateRoutes = require('./routes/templates');
const privacyRoutes = require('./routes/privacy');
const integrationRoutes = require('./routes/integrations');

// Import advanced analytics and reporting routes
const hrDashboardRoutes = require('./routes/hrDashboard');
const reportBuilderRoutes = require('./routes/reportBuilder');
const performanceAnalyticsRoutes = require('./routes/performanceAnalytics');
const scheduledReportingRoutes = require('./routes/scheduledReporting');
const dataExportRoutes = require('./routes/dataExport');
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');

// Import payroll, compensation & benefits routes
const compensationCalculatorRoutes = require('./routes/compensationCalculator');
const benefitsManagementRoutes = require('./routes/benefitsManagement');
const payrollProcessingRoutes = require('./routes/payrollProcessing');
const compensationManagementRoutes = require('./routes/compensationManagement');
const taxComplianceRoutes = require('./routes/taxCompliance');
const payrollReportingRoutes = require('./routes/payrollReporting');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Enhanced API Routes
app.use('/api/interviews', interviewRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/analytics-enhanced', analyticsEnhancedRoutes);

// Job Management API Routes
app.use('/api/job-management', jobManagementRoutes);
app.use('/api/client-portal', clientPortalRoutes);
app.use('/api/job-reports', jobReportingRoutes);

// Client Engagement API Routes
app.use('/api/client-engagement', clientEngagementRoutes);
app.use('/api/contracts', contractNegotiationRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/client-performance', clientPerformanceRoutes);

// Onboarding and Offers API Routes
app.use('/api/offers', offersRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/background-checks', backgroundChecksRoutes);
app.use('/api/compliance', complianceRoutes);

// Scheduling and Shift Management API Routes
app.use('/api/schedules', schedulesRoutes);
app.use('/api/timekeeping', timekeepingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payroll', payrollIntegrationRoutes);

// Communication and Collaboration API Routes
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/portals', portalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/integrations', integrationRoutes);

// Advanced Analytics and Reporting API Routes
app.use('/api/hr-dashboard', hrDashboardRoutes);
app.use('/api/report-builder', reportBuilderRoutes);
app.use('/api/performance-analytics', performanceAnalyticsRoutes);
app.use('/api/scheduled-reports', scheduledReportingRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);

// Payroll, Compensation & Benefits API Routes
app.use('/api/compensation-calculator', compensationCalculatorRoutes);
app.use('/api/benefits-management', benefitsManagementRoutes);
app.use('/api/payroll-processing', payrollProcessingRoutes);
app.use('/api/compensation-management', compensationManagementRoutes);
app.use('/api/tax-compliance', taxComplianceRoutes);
app.use('/api/payroll-reporting', payrollReportingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI HR Management System is running',
    timestamp: new Date().toISOString(),
    version: '9.0.0',
    features: {
      core: ['jobs', 'applications', 'candidates', 'analytics'],
      enhanced: ['interviews', 'assessments', 'gdpr_compliance', 'advanced_analytics', 'job_distribution', 'notifications'],
      job_management: ['requisitions', 'templates', 'assignments', 'matching', 'feedback', 'workflow', 'versions', 'inventory'],
      client_portal: ['dashboard', 'job_status', 'feedback', 'notifications', 'profile', 'analytics'],
      reporting: ['fill_rates', 'time_in_stage', 'dropout_analysis', 'performance_metrics', 'executive_dashboard'],
      client_engagement: ['enhanced_dashboard', 'job_orders', 'quotes', 'evaluations', 'onboarding'],
      contract_negotiation: ['contracts', 'offers', 'negotiation_history', 'document_generation'],
      communication: ['email_templates', 'messaging', 'conversations', 'workflows', 'analytics'],
      billing: ['client_accounts', 'invoicing', 'payments', 'financial_reports', 'resource_utilization'],
      client_performance: ['performance_metrics', 'satisfaction_surveys', 'health_scores', 'benchmarking', 'risk_assessment'],
      offer_management: ['offer_generation', 'templates', 'e_signature', 'tracking', 'analytics'],
      onboarding: ['workflow_automation', 'document_collection', 'orientation_scheduling', 'task_management', 'communications'],
      background_checks: ['multi_provider_integration', 'automated_adjudication', 'reference_checks', 'compliance_tracking'],
      compliance: ['document_management', 'audit_trails', 'retention_policies', 'legal_compliance', 'data_protection'],
      scheduling: ['shift_planning', 'roster_building', 'auto_generation', 'conflict_detection', 'swap_requests', 'emergency_coverage'],
      timekeeping: ['time_clock', 'break_management', 'timesheet_approval', 'attendance_tracking', 'analytics'],
      availability: ['profile_management', 'time_off_requests', 'availability_overrides', 'staff_matching', 'leave_balances'],
      payroll_integration: ['overtime_calculation', 'shift_differentials', 'leave_accruals', 'payroll_export', 'compliance_checks'],
      messaging: ['direct_messages', 'group_messaging', 'comments', 'feedback', 'real_time_communication', 'typing_indicators'],
      notifications: ['deadline_alerts', 'interview_notifications', 'status_changes', 'escalation_workflows', 'user_preferences'],
      calendars: ['shared_calendars', 'event_management', 'conflict_detection', 'rsvp_system', 'external_integrations'],
      portals: ['client_portals', 'candidate_portals', 'mobile_access', 'branding', 'analytics', 'user_management'],
      audit: ['communication_logs', 'compliance_tracking', 'data_retention', 'security_monitoring', 'violation_detection'],
      templates: ['email_templates', 'message_templates', 'versioning', 'localization', 'dynamic_content', 'analytics'],
      privacy: ['access_control', 'data_classification', 'consent_management', 'data_subject_rights', 'compliance_reporting'],
      integrations: ['email_providers', 'slack_integration', 'crm_sync', 'webhook_management', 'sync_jobs', 'rate_limiting'],
      advanced_analytics: ['hr_dashboards', 'real_time_metrics', 'recruitment_analytics', 'performance_analytics', 'custom_reports', 'scheduled_reporting', 'data_export'],
      reporting: ['report_builder', 'custom_dashboards', 'kpi_tracking', 'predictive_analytics', 'benchmarking', 'insights_engine'],
      data_export: ['csv_export', 'excel_export', 'pdf_reports', 'bulk_export', 'scheduled_exports', 'data_visualization'],
      payroll_compensation_benefits: ['compensation_calculator', 'benefits_management', 'payroll_processing', 'compensation_management', 'tax_compliance', 'payroll_reporting']
    },
    services: {
      database: 'connected',
      notifications: 'active',
      archival: 'scheduled',
      analytics: 'processing',
      job_matching: 'active',
      workflow_engine: 'running',
      client_portal: 'active',
      billing_engine: 'active',
      communication_service: 'active',
      performance_monitoring: 'active',
      offer_generation: 'active',
      onboarding_automation: 'active',
      background_check_integration: 'active',
      compliance_monitoring: 'active',
      document_encryption: 'active',
      schedule_management: 'active',
      timekeeping_service: 'active',
      availability_engine: 'active',
      payroll_integration: 'active',
      messaging_service: 'active',
      notification_engine: 'active',
      calendar_service: 'active',
      portal_service: 'active',
      audit_service: 'active',
      template_engine: 'active',
      privacy_service: 'active',
      integration_service: 'active',
      hr_dashboard_service: 'active',
      report_builder_service: 'active',
      performance_analytics_service: 'active',
      scheduled_reporting_service: 'active',
      data_export_service: 'active',
      advanced_analytics_service: 'active',
      compensation_calculator_service: 'active',
      benefits_management_service: 'active',
      payroll_processing_service: 'active',
      compensation_management_service: 'active',
      tax_compliance_service: 'active',
      payroll_reporting_service: 'active'
    }
  });
});

// Enhanced system status endpoint
app.get('/api/system/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    uptime: {
      seconds: uptime,
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    directories: directories.map(dir => ({
      path: dir,
      exists: fs.existsSync(path.join(__dirname, dir))
    })),
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 AI HR Management Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DB_PATH}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;