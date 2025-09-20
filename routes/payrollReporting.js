const express = require('express');
const router = express.Router();
const payrollReportingService = require('../services/payrollReportingService');
const authMiddleware = require('../middleware/auth');

// Get payroll summary reports
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { period, department, employeeGroup } = req.query;
    const summary = await payrollReportingService.getPayrollSummary({
      period,
      department,
      employeeGroup
    });
    res.json(summary);
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

// Generate detailed payroll reports
router.post('/detailed', authMiddleware, async (req, res) => {
  try {
    const { reportType, filters, format, includeCharts } = req.body;
    const report = await payrollReportingService.generateDetailedReport({
      reportType,
      filters,
      format,
      includeCharts
    });
    res.json(report);
  } catch (error) {
    console.error('Error generating detailed report:', error);
    res.status(500).json({ error: 'Failed to generate detailed report' });
  }
});

// Get employee pay statements
router.get('/paystubs', authMiddleware, async (req, res) => {
  try {
    const { employeeId, payPeriod, year } = req.query;
    const payStubs = await payrollReportingService.getPayStubs({
      employeeId,
      payPeriod,
      year
    });
    res.json(payStubs);
  } catch (error) {
    console.error('Error fetching pay stubs:', error);
    res.status(500).json({ error: 'Failed to fetch pay stubs' });
  }
});

// Generate pay stub for specific employee and period
router.post('/paystubs/generate', authMiddleware, async (req, res) => {
  try {
    const { employeeId, payPeriodId, format, delivery } = req.body;
    const payStub = await payrollReportingService.generatePayStub({
      employeeId,
      payPeriodId,
      format,
      delivery
    });
    res.json(payStub);
  } catch (error) {
    console.error('Error generating pay stub:', error);
    res.status(500).json({ error: 'Failed to generate pay stub' });
  }
});

// Get cost center reports
router.get('/cost-centers', authMiddleware, async (req, res) => {
  try {
    const { period, costCenterId, includeSubCenters } = req.query;
    const reports = await payrollReportingService.getCostCenterReports({
      period,
      costCenterId,
      includeSubCenters: includeSubCenters === 'true'
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching cost center reports:', error);
    res.status(500).json({ error: 'Failed to fetch cost center reports' });
  }
});

// Get labor distribution reports
router.get('/labor-distribution', authMiddleware, async (req, res) => {
  try {
    const { period, department, projectId, groupBy } = req.query;
    const distribution = await payrollReportingService.getLaborDistribution({
      period,
      department,
      projectId,
      groupBy
    });
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching labor distribution:', error);
    res.status(500).json({ error: 'Failed to fetch labor distribution' });
  }
});

// Get tax liability reports
router.get('/tax-liability', authMiddleware, async (req, res) => {
  try {
    const { period, taxType, jurisdiction } = req.query;
    const liability = await payrollReportingService.getTaxLiabilityReport({
      period,
      taxType,
      jurisdiction
    });
    res.json(liability);
  } catch (error) {
    console.error('Error fetching tax liability report:', error);
    res.status(500).json({ error: 'Failed to fetch tax liability report' });
  }
});

// Get benefits utilization reports
router.get('/benefits-utilization', authMiddleware, async (req, res) => {
  try {
    const { period, benefitType, department } = req.query;
    const utilization = await payrollReportingService.getBenefitsUtilization({
      period,
      benefitType,
      department
    });
    res.json(utilization);
  } catch (error) {
    console.error('Error fetching benefits utilization:', error);
    res.status(500).json({ error: 'Failed to fetch benefits utilization' });
  }
});

// Get compliance reports
router.get('/compliance', authMiddleware, async (req, res) => {
  try {
    const { reportType, period, jurisdiction } = req.query;
    const reports = await payrollReportingService.getComplianceReports({
      reportType,
      period,
      jurisdiction
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({ error: 'Failed to fetch compliance reports' });
  }
});

// Export reports in various formats
router.post('/export', authMiddleware, async (req, res) => {
  try {
    const { reportId, format, filters, customFields } = req.body;
    const exportedReport = await payrollReportingService.exportReport({
      reportId,
      format,
      filters,
      customFields
    });
    res.json(exportedReport);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Schedule recurring reports
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const { reportType, schedule, recipients, parameters } = req.body;
    const scheduledReport = await payrollReportingService.scheduleReport({
      reportType,
      schedule,
      recipients,
      parameters
    });
    res.json(scheduledReport);
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

// Get scheduled reports
router.get('/scheduled', authMiddleware, async (req, res) => {
  try {
    const { status, reportType } = req.query;
    const scheduledReports = await payrollReportingService.getScheduledReports({
      status,
      reportType
    });
    res.json(scheduledReports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled reports' });
  }
});

// Update scheduled report
router.put('/scheduled/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updatedSchedule = await payrollReportingService.updateScheduledReport(
      scheduleId,
      req.body
    );
    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    res.status(500).json({ error: 'Failed to update scheduled report' });
  }
});

// Delete scheduled report
router.delete('/scheduled/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    await payrollReportingService.deleteScheduledReport(scheduleId);
    res.json({ message: 'Scheduled report deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({ error: 'Failed to delete scheduled report' });
  }
});

// Get audit trail for payroll data
router.get('/audit-trail', authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId, dateRange, userId } = req.query;
    const auditTrail = await payrollReportingService.getAuditTrail({
      entityType,
      entityId,
      dateRange,
      userId
    });
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Get analytics and insights
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { metricType, period, comparison, groupBy } = req.query;
    const analytics = await payrollReportingService.getPayrollAnalytics({
      metricType,
      period,
      comparison,
      groupBy
    });
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching payroll analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payroll analytics' });
  }
});

module.exports = router;