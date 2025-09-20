const express = require('express');
const router = express.Router();
const backgroundCheckService = require('../services/backgroundCheckService');

// ============================================================================
// BACKGROUND CHECK TEMPLATES
// ============================================================================

// Get all background check templates
router.get('/templates', async (req, res) => {
  try {
    const result = await backgroundCheckService.getCheckTemplates();
    res.json(result);
  } catch (error) {
    console.error('Error fetching background check templates:', error);
    res.status(500).json({ error: 'Failed to fetch background check templates' });
  }
});

// Get background check providers
router.get('/providers', async (req, res) => {
  try {
    const result = await backgroundCheckService.getProviders();
    res.json(result);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// ============================================================================
// BACKGROUND CHECK INITIATION
// ============================================================================

// Initiate background check
router.post('/', async (req, res) => {
  try {
    const checkData = {
      candidate_id: req.body.candidate_id,
      employee_id: req.body.employee_id,
      job_id: req.body.job_id,
      template_id: req.body.template_id,
      provider_id: req.body.provider_id,
      created_by: req.body.created_by,
      candidate_info: {
        first_name: req.body.candidate_info.first_name,
        last_name: req.body.candidate_info.last_name,
        email: req.body.candidate_info.email,
        phone: req.body.candidate_info.phone,
        ssn: req.body.candidate_info.ssn,
        date_of_birth: req.body.candidate_info.date_of_birth,
        address: req.body.candidate_info.address,
        previous_addresses: req.body.candidate_info.previous_addresses
      },
      consent_provided: req.body.consent_provided,
      consent_timestamp: req.body.consent_timestamp,
      consent_ip: req.body.consent_ip || req.ip,
      electronic_signature: req.body.electronic_signature
    };

    // Validate required fields
    if (!checkData.candidate_id || !checkData.template_id) {
      return res.status(400).json({
        error: 'Missing required fields: candidate_id, template_id'
      });
    }

    if (!checkData.candidate_info.first_name || !checkData.candidate_info.last_name) {
      return res.status(400).json({
        error: 'Missing required candidate information: first_name, last_name'
      });
    }

    if (!checkData.consent_provided) {
      return res.status(400).json({
        error: 'Candidate consent is required for background checks'
      });
    }

    const result = await backgroundCheckService.initiateBackgroundCheck(checkData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error initiating background check:', error);
    res.status(500).json({ error: 'Failed to initiate background check' });
  }
});

// Get all background checks
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      candidate_id: req.query.candidate_id,
      template_id: req.query.template_id,
      provider_id: req.query.provider_id,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined
    };

    const result = await backgroundCheckService.getAllBackgroundChecks(filters);
    
    if (result.success) {
      let filteredChecks = result.background_checks;

      // Apply filters
      if (filters.status) {
        filteredChecks = filteredChecks.filter(check => check.status === filters.status);
      }

      if (filters.candidate_id) {
        filteredChecks = filteredChecks.filter(check => check.candidate_id === filters.candidate_id);
      }

      if (filters.template_id) {
        filteredChecks = filteredChecks.filter(check => check.template_id === filters.template_id);
      }

      if (filters.provider_id) {
        filteredChecks = filteredChecks.filter(check => check.provider_id === filters.provider_id);
      }

      if (filters.date_range) {
        filteredChecks = filteredChecks.filter(check => {
          const checkDate = new Date(check.created_at);
          return checkDate >= new Date(filters.date_range.start_date) && 
                 checkDate <= new Date(filters.date_range.end_date);
        });
      }

      res.json({
        success: true,
        background_checks: filteredChecks,
        count: filteredChecks.length
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error fetching background checks:', error);
    res.status(500).json({ error: 'Failed to fetch background checks' });
  }
});

// Get specific background check
router.get('/:checkId', async (req, res) => {
  try {
    const result = await backgroundCheckService.getBackgroundCheck(req.params.checkId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching background check:', error);
    res.status(500).json({ error: 'Failed to fetch background check' });
  }
});

// ============================================================================
// PROVIDER WEBHOOKS
// ============================================================================

// Process provider webhook/results
router.post('/:checkId/webhook', async (req, res) => {
  try {
    const providerData = {
      status: req.body.status,
      check_results: req.body.check_results,
      provider_reference: req.body.provider_reference,
      completed_at: req.body.completed_at
    };

    const result = await backgroundCheckService.processProviderResult(req.params.checkId, providerData);
    
    if (result.success) {
      res.json({
        status: 'processed',
        requires_review: result.requires_review
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing provider webhook:', error);
    res.status(500).json({ error: 'Failed to process provider webhook' });
  }
});

// Manual result update (for testing/demo)
router.put('/:checkId/results', async (req, res) => {
  try {
    const providerData = {
      status: 'completed',
      check_results: req.body.check_results,
      completed_at: new Date().toISOString()
    };

    const result = await backgroundCheckService.processProviderResult(req.params.checkId, providerData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating background check results:', error);
    res.status(500).json({ error: 'Failed to update background check results' });
  }
});

// ============================================================================
// ADJUDICATION
// ============================================================================

// Perform manual adjudication
router.post('/:checkId/adjudicate', async (req, res) => {
  try {
    const adjudicationData = {
      decision: req.body.decision, // 'approved', 'denied', 'conditional'
      adjudicator: req.body.adjudicator,
      notes: req.body.notes,
      override: req.body.override,
      adverse_action_reason: req.body.adverse_action_reason
    };

    // Validate decision
    const validDecisions = ['approved', 'denied', 'conditional'];
    if (!validDecisions.includes(adjudicationData.decision)) {
      return res.status(400).json({
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const result = await backgroundCheckService.performManualAdjudication(req.params.checkId, adjudicationData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error performing manual adjudication:', error);
    res.status(500).json({ error: 'Failed to perform manual adjudication' });
  }
});

// Get checks requiring review
router.get('/adjudication/pending', async (req, res) => {
  try {
    const allChecks = await backgroundCheckService.getAllBackgroundChecks();
    
    if (allChecks.success) {
      const pendingReview = allChecks.background_checks.filter(check => 
        check.adjudication.status === 'review_required'
      );

      res.json({
        success: true,
        pending_reviews: pendingReview,
        count: pendingReview.length
      });
    } else {
      res.status(400).json(allChecks);
    }
  } catch (error) {
    console.error('Error fetching pending adjudications:', error);
    res.status(500).json({ error: 'Failed to fetch pending adjudications' });
  }
});

// ============================================================================
// REFERENCE CHECKS
// ============================================================================

// Initiate reference check
router.post('/references', async (req, res) => {
  try {
    const referenceData = {
      candidate_id: req.body.candidate_id,
      background_check_id: req.body.background_check_id,
      created_by: req.body.created_by,
      references: req.body.references, // Array of reference objects
      survey_template: req.body.survey_template,
      provider_id: req.body.provider_id
    };

    // Validate required fields
    if (!referenceData.candidate_id || !referenceData.references || !Array.isArray(referenceData.references)) {
      return res.status(400).json({
        error: 'Missing required fields: candidate_id, references (array)'
      });
    }

    // Validate reference objects
    for (const ref of referenceData.references) {
      if (!ref.name || !ref.email || !ref.relationship) {
        return res.status(400).json({
          error: 'Each reference must have: name, email, relationship'
        });
      }
    }

    const result = await backgroundCheckService.initiateReferenceCheck(referenceData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error initiating reference check:', error);
    res.status(500).json({ error: 'Failed to initiate reference check' });
  }
});

// Get reference check details
router.get('/references/:referenceId', async (req, res) => {
  try {
    const result = await backgroundCheckService.getReferenceCheck(req.params.referenceId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching reference check:', error);
    res.status(500).json({ error: 'Failed to fetch reference check' });
  }
});

// Process reference survey response
router.post('/references/:referenceId/response/:referencePersonId', async (req, res) => {
  try {
    const responses = req.body.responses;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        error: 'Survey responses are required'
      });
    }

    const result = await backgroundCheckService.processReferenceSurveyResponse(
      req.params.referenceId,
      req.params.referencePersonId,
      responses
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing reference survey response:', error);
    res.status(500).json({ error: 'Failed to process reference survey response' });
  }
});

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

// Get background check analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const filters = {
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      provider_id: req.query.provider_id,
      template_id: req.query.template_id
    };

    const result = await backgroundCheckService.getBackgroundCheckAnalytics(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error generating background check analytics:', error);
    res.status(500).json({ error: 'Failed to generate background check analytics' });
  }
});

// Get turnaround time analysis
router.get('/analytics/turnaround', async (req, res) => {
  try {
    const analytics = await backgroundCheckService.getBackgroundCheckAnalytics();
    
    if (analytics.success) {
      const turnaroundAnalysis = {
        avg_turnaround_days: analytics.analytics.summary.avg_turnaround_days,
        provider_performance: analytics.analytics.provider_performance,
        template_performance: {},
        sla_compliance: {
          within_sla: 0,
          overdue: 0,
          sla_percentage: 0
        }
      };

      // Calculate template performance (simplified)
      const templateUsage = analytics.analytics.template_usage;
      Object.keys(templateUsage).forEach(template => {
        turnaroundAnalysis.template_performance[template] = {
          count: templateUsage[template],
          avg_days: analytics.analytics.summary.avg_turnaround_days // Simplified
        };
      });

      res.json({
        success: true,
        turnaround_analysis: turnaroundAnalysis,
        generated_at: analytics.analytics.generated_at
      });
    } else {
      res.status(400).json(analytics);
    }
  } catch (error) {
    console.error('Error generating turnaround analysis:', error);
    res.status(500).json({ error: 'Failed to generate turnaround analysis' });
  }
});

// Get compliance metrics
router.get('/analytics/compliance', async (req, res) => {
  try {
    const analytics = await backgroundCheckService.getBackgroundCheckAnalytics();
    
    if (analytics.success) {
      res.json({
        success: true,
        compliance_metrics: analytics.analytics.compliance_metrics,
        generated_at: analytics.analytics.generated_at
      });
    } else {
      res.status(400).json(analytics);
    }
  } catch (error) {
    console.error('Error generating compliance metrics:', error);
    res.status(500).json({ error: 'Failed to generate compliance metrics' });
  }
});

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

// Search background checks
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      candidate_name: req.query.candidate_name,
      ssn: req.query.ssn,
      status: req.query.status,
      adjudication_status: req.query.adjudication_status,
      provider: req.query.provider,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined
    };

    const allChecks = await backgroundCheckService.getAllBackgroundChecks();
    
    if (allChecks.success) {
      let filteredChecks = allChecks.background_checks;

      // Apply search filters
      if (searchParams.candidate_name) {
        const searchName = searchParams.candidate_name.toLowerCase();
        filteredChecks = filteredChecks.filter(check => 
          `${check.candidate_info.first_name} ${check.candidate_info.last_name}`
            .toLowerCase().includes(searchName)
        );
      }

      if (searchParams.status) {
        filteredChecks = filteredChecks.filter(check => check.status === searchParams.status);
      }

      if (searchParams.adjudication_status) {
        filteredChecks = filteredChecks.filter(check => 
          check.adjudication.status === searchParams.adjudication_status
        );
      }

      if (searchParams.provider) {
        filteredChecks = filteredChecks.filter(check => 
          check.provider_name.toLowerCase().includes(searchParams.provider.toLowerCase())
        );
      }

      if (searchParams.date_range) {
        filteredChecks = filteredChecks.filter(check => {
          const checkDate = new Date(check.created_at);
          return checkDate >= new Date(searchParams.date_range.start_date) && 
                 checkDate <= new Date(searchParams.date_range.end_date);
        });
      }

      res.json({
        success: true,
        background_checks: filteredChecks,
        count: filteredChecks.length,
        search_params: searchParams
      });
    } else {
      res.status(400).json(allChecks);
    }
  } catch (error) {
    console.error('Error searching background checks:', error);
    res.status(500).json({ error: 'Failed to search background checks' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk adjudication
router.post('/bulk/adjudicate', async (req, res) => {
  try {
    const { check_ids, decision, adjudicator, notes } = req.body;

    if (!check_ids || !Array.isArray(check_ids) || check_ids.length === 0) {
      return res.status(400).json({ error: 'check_ids array is required' });
    }

    const validDecisions = ['approved', 'denied', 'conditional'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const results = [];
    const errors = [];

    for (const checkId of check_ids) {
      try {
        const result = await backgroundCheckService.performManualAdjudication(checkId, {
          decision,
          adjudicator,
          notes
        });
        
        if (result.success) {
          results.push({ check_id: checkId, success: true });
        } else {
          errors.push({ check_id: checkId, error: result.error });
        }
      } catch (error) {
        errors.push({ check_id: checkId, error: error.message });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results: results,
      errors_detail: errors
    });
  } catch (error) {
    console.error('Error performing bulk adjudication:', error);
    res.status(500).json({ error: 'Failed to perform bulk adjudication' });
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

// Get background check dashboard
router.get('/dashboard/summary', async (req, res) => {
  try {
    const analytics = await backgroundCheckService.getBackgroundCheckAnalytics();
    const allChecks = await backgroundCheckService.getAllBackgroundChecks();

    if (analytics.success && allChecks.success) {
      const today = new Date().toDateString();
      const recentChecks = allChecks.background_checks.filter(check => 
        new Date(check.created_at).toDateString() === today
      );

      const pendingReviews = allChecks.background_checks.filter(check => 
        check.adjudication.status === 'review_required'
      );

      const dashboardData = {
        summary: analytics.analytics.summary,
        daily_metrics: {
          initiated_today: recentChecks.length,
          completed_today: recentChecks.filter(c => c.status === 'completed').length,
          pending_reviews: pendingReviews.length
        },
        recent_completions: allChecks.background_checks
          .filter(c => c.status === 'completed')
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
          .slice(0, 5),
        urgent_reviews: pendingReviews.slice(0, 10),
        provider_status: analytics.analytics.provider_performance
      };

      res.json({
        success: true,
        dashboard: dashboardData,
        generated_at: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Failed to fetch dashboard data' });
    }
  } catch (error) {
    console.error('Error generating background check dashboard:', error);
    res.status(500).json({ error: 'Failed to generate background check dashboard' });
  }
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate check ID parameter
router.param('checkId', async (req, res, next, checkId) => {
  if (!checkId || typeof checkId !== 'string') {
    return res.status(400).json({ error: 'Invalid background check ID' });
  }
  next();
});

// Middleware to validate reference ID parameter
router.param('referenceId', async (req, res, next, referenceId) => {
  if (!referenceId || typeof referenceId !== 'string') {
    return res.status(400).json({ error: 'Invalid reference check ID' });
  }
  next();
});

module.exports = router;
