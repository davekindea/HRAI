const express = require('express');
const router = express.Router();
const JobManagementService = require('../services/jobManagementService');
const WorkflowService = require('../services/workflowService');

// Job Requisition Management Routes
router.post('/requisitions', async (req, res) => {
  try {
    const result = await JobManagementService.createJobRequisition(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/requisitions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approver, comments } = req.body;
    const result = await JobManagementService.updateRequisitionStatus(id, status, approver, comments);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Templates Routes
router.get('/templates', async (req, res) => {
  try {
    const result = await JobManagementService.getJobTemplates();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates/:templateId/jobs', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await JobManagementService.createJobFromTemplate(templateId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Assignment Scheduling Routes
router.post('/assignments', async (req, res) => {
  try {
    const result = await JobManagementService.scheduleJobAssignment(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Candidate-Job Matching Routes
router.get('/jobs/:jobId/matches', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { requirements } = req.query;
    const result = await JobManagementService.matchCandidatesToJob(jobId, requirements);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Feedback Collection Routes
router.post('/feedback', async (req, res) => {
  try {
    const result = await JobManagementService.collectFeedback(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Workflow and Permissions Routes
router.get('/workflow/rules', async (req, res) => {
  try {
    const result = await WorkflowService.getWorkflowRules();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/workflow/validate-permission', async (req, res) => {
  try {
    const { userId, userRole, action, resourceId } = req.body;
    const result = await WorkflowService.validatePermission(userId, userRole, action, resourceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Version Control Routes
router.post('/jobs/:jobId/versions', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { changes, userId } = req.body;
    const result = await WorkflowService.createJobVersion(jobId, changes, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/jobs/:jobId/versions', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await WorkflowService.getJobVersionHistory(jobId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Inventory Management Routes
router.get('/inventory', async (req, res) => {
  try {
    const filters = req.query;
    const result = await WorkflowService.getJobInventory(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Job Operations
router.post('/jobs/bulk-update', async (req, res) => {
  try {
    const { jobIds, updates } = req.body;
    // Simulate bulk update
    const results = jobIds.map(id => ({
      jobId: id,
      success: true,
      updated: updates
    }));
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/jobs/bulk-delete', async (req, res) => {
  try {
    const { jobIds } = req.body;
    // Simulate bulk delete
    const results = jobIds.map(id => ({
      jobId: id,
      success: true,
      deleted: true
    }));
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;