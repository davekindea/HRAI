const express = require('express');
const router = express.Router();
const taxComplianceService = require('../services/taxComplianceService');
const authMiddleware = require('../middleware/auth');

// Get tax jurisdictions and rates
router.get('/jurisdictions', authMiddleware, async (req, res) => {
  try {
    const jurisdictions = await taxComplianceService.getTaxJurisdictions(req.query);
    res.json(jurisdictions);
  } catch (error) {
    console.error('Error fetching tax jurisdictions:', error);
    res.status(500).json({ error: 'Failed to fetch tax jurisdictions' });
  }
});

// Get tax rates for specific jurisdiction and period
router.get('/rates/:jurisdictionId', authMiddleware, async (req, res) => {
  try {
    const { jurisdictionId } = req.params;
    const { year, quarter } = req.query;
    const rates = await taxComplianceService.getTaxRates(jurisdictionId, { year, quarter });
    res.json(rates);
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

// Calculate tax withholdings for employee
router.post('/withholdings/calculate', authMiddleware, async (req, res) => {
  try {
    const { employeeId, payPeriod, grossPay, exemptions } = req.body;
    const withholdings = await taxComplianceService.calculateWithholdings({
      employeeId,
      payPeriod,
      grossPay,
      exemptions
    });
    res.json(withholdings);
  } catch (error) {
    console.error('Error calculating tax withholdings:', error);
    res.status(500).json({ error: 'Failed to calculate tax withholdings' });
  }
});

// Get tax forms and documents
router.get('/forms', authMiddleware, async (req, res) => {
  try {
    const { year, formType, employeeId } = req.query;
    const forms = await taxComplianceService.getTaxForms({ year, formType, employeeId });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching tax forms:', error);
    res.status(500).json({ error: 'Failed to fetch tax forms' });
  }
});

// Generate tax documents (W-2, 1099, etc.)
router.post('/forms/generate', authMiddleware, async (req, res) => {
  try {
    const { formType, year, employeeIds, options } = req.body;
    const documents = await taxComplianceService.generateTaxDocuments({
      formType,
      year,
      employeeIds,
      options
    });
    res.json(documents);
  } catch (error) {
    console.error('Error generating tax documents:', error);
    res.status(500).json({ error: 'Failed to generate tax documents' });
  }
});

// Submit tax filings
router.post('/filings/submit', authMiddleware, async (req, res) => {
  try {
    const { filingType, period, data, electronicFiling } = req.body;
    const submission = await taxComplianceService.submitTaxFiling({
      filingType,
      period,
      data,
      electronicFiling
    });
    res.json(submission);
  } catch (error) {
    console.error('Error submitting tax filing:', error);
    res.status(500).json({ error: 'Failed to submit tax filing' });
  }
});

// Get filing status and history
router.get('/filings', authMiddleware, async (req, res) => {
  try {
    const { year, quarter, status } = req.query;
    const filings = await taxComplianceService.getFilingHistory({ year, quarter, status });
    res.json(filings);
  } catch (error) {
    console.error('Error fetching filing history:', error);
    res.status(500).json({ error: 'Failed to fetch filing history' });
  }
});

// Get compliance alerts and notifications
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const { priority, acknowledged } = req.query;
    const alerts = await taxComplianceService.getComplianceAlerts({ priority, acknowledged });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching compliance alerts:', error);
    res.status(500).json({ error: 'Failed to fetch compliance alerts' });
  }
});

// Update compliance alert status
router.patch('/alerts/:alertId', authMiddleware, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, notes } = req.body;
    const updatedAlert = await taxComplianceService.updateAlertStatus(alertId, { status, notes });
    res.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Run compliance audit
router.post('/audit/run', authMiddleware, async (req, res) => {
  try {
    const { scope, period, checkTypes } = req.body;
    const auditResults = await taxComplianceService.runComplianceAudit({
      scope,
      period,
      checkTypes
    });
    res.json(auditResults);
  } catch (error) {
    console.error('Error running compliance audit:', error);
    res.status(500).json({ error: 'Failed to run compliance audit' });
  }
});

// Get audit results
router.get('/audit/results', authMiddleware, async (req, res) => {
  try {
    const { auditId, dateRange, status } = req.query;
    const results = await taxComplianceService.getAuditResults({ auditId, dateRange, status });
    res.json(results);
  } catch (error) {
    console.error('Error fetching audit results:', error);
    res.status(500).json({ error: 'Failed to fetch audit results' });
  }
});

// Get regulatory updates and changes
router.get('/regulatory-updates', authMiddleware, async (req, res) => {
  try {
    const { jurisdiction, category, dateRange } = req.query;
    const updates = await taxComplianceService.getRegulatoryUpdates({
      jurisdiction,
      category,
      dateRange
    });
    res.json(updates);
  } catch (error) {
    console.error('Error fetching regulatory updates:', error);
    res.status(500).json({ error: 'Failed to fetch regulatory updates' });
  }
});

// Configure tax settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await taxComplianceService.updateTaxSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({ error: 'Failed to update tax settings' });
  }
});

// Get tax settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await taxComplianceService.getTaxSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    res.status(500).json({ error: 'Failed to fetch tax settings' });
  }
});

module.exports = router;