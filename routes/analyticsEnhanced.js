const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const { query, validationResult } = require('express-validator');

// Dashboard analytics
router.get('/dashboard',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('jobType').optional().isString().withMessage('Job type must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', department, jobType } = req.query;
      const filters = {};
      if (department) filters.department = department;
      if (jobType) filters.jobType = jobType;

      const analytics = await analyticsService.getDashboardAnalytics(timeframe, filters);
      
      res.json({
        success: true,
        timeframe,
        filters,
        analytics
      });
    } catch (error) {
      console.error('Failed to get dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard analytics',
        error: error.message
      });
    }
  }
);

// Candidate source analytics
router.get('/sources',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('sourceCategory').optional().isIn(['job_boards', 'social_media', 'referrals', 'direct', 'agencies', 'events', 'other'])
      .withMessage('Invalid source category')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', sourceCategory } = req.query;
      const filters = {};
      if (sourceCategory) filters.sourceCategory = sourceCategory;

      const sourceAnalytics = await analyticsService.getCandidateSourceAnalytics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        sourceAnalytics
      });
    } catch (error) {
      console.error('Failed to get source analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get candidate source analytics',
        error: error.message
      });
    }
  }
);

// Conversion funnel analytics
router.get('/funnel',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('jobId').optional().isUUID().withMessage('Invalid job ID'),
    query('department').optional().isString().withMessage('Department must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', jobId, department } = req.query;
      const filters = {};
      if (jobId) filters.jobId = jobId;
      if (department) filters.department = department;

      const funnelAnalytics = await analyticsService.getConversionFunnelAnalytics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        funnelAnalytics
      });
    } catch (error) {
      console.error('Failed to get funnel analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversion funnel analytics',
        error: error.message
      });
    }
  }
);

// Drop-off analysis
router.get('/dropoff',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('stage').optional().isIn(['applied', 'screening', 'assessment', 'phone_interview', 'video_interview', 'onsite_interview', 'final_interview', 'reference_check', 'offer_extended'])
      .withMessage('Invalid stage')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', stage } = req.query;
      const filters = {};
      if (stage) filters.stage = stage;

      const dropOffAnalysis = await analyticsService.getDropOffAnalysis(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        dropOffAnalysis
      });
    } catch (error) {
      console.error('Failed to get drop-off analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get drop-off analysis',
        error: error.message
      });
    }
  }
);

// Time-to-hire metrics
router.get('/time-metrics',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('position').optional().isString().withMessage('Position must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', department, position } = req.query;
      const filters = {};
      if (department) filters.department = department;
      if (position) filters.position = position;

      const timeMetrics = await analyticsService.getTimeMetrics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        timeMetrics
      });
    } catch (error) {
      console.error('Failed to get time metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get time metrics',
        error: error.message
      });
    }
  }
);

// Job performance analytics
router.get('/jobs',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('sortBy').optional().isIn(['applications', 'hires', 'conversionRate', 'timeToHire', 'costPerHire'])
      .withMessage('Invalid sort field')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', department, sortBy = 'conversionRate' } = req.query;
      const filters = {};
      if (department) filters.department = department;
      if (sortBy) filters.sortBy = sortBy;

      const jobAnalytics = await analyticsService.getJobPerformanceAnalytics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        jobAnalytics
      });
    } catch (error) {
      console.error('Failed to get job analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job performance analytics',
        error: error.message
      });
    }
  }
);

// Recruiter performance analytics
router.get('/recruiters',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('team').optional().isString().withMessage('Team must be a string'),
    query('recruiterId').optional().isUUID().withMessage('Invalid recruiter ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', team, recruiterId } = req.query;
      const filters = {};
      if (team) filters.team = team;
      if (recruiterId) filters.recruiterId = recruiterId;

      const recruiterAnalytics = await analyticsService.getRecruiterPerformanceAnalytics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        recruiterAnalytics
      });
    } catch (error) {
      console.error('Failed to get recruiter analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recruiter performance analytics',
        error: error.message
      });
    }
  }
);

// Diversity analytics
router.get('/diversity',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('level').optional().isIn(['entry', 'mid', 'senior', 'executive']).withMessage('Invalid level')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', department, level } = req.query;
      const filters = {};
      if (department) filters.department = department;
      if (level) filters.level = level;

      const diversityMetrics = await analyticsService.getDiversityMetrics(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        diversityMetrics
      });
    } catch (error) {
      console.error('Failed to get diversity analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get diversity analytics',
        error: error.message
      });
    }
  }
);

// Cost analysis
router.get('/costs',
  auth,
  [
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('costType').optional().isIn(['job_boards', 'agencies', 'assessments', 'interviews', 'onboarding', 'internal'])
      .withMessage('Invalid cost type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_30_days', department, costType } = req.query;
      const filters = {};
      if (department) filters.department = department;
      if (costType) filters.costType = costType;

      const costAnalysis = await analyticsService.getCostAnalysis(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        costAnalysis
      });
    } catch (error) {
      console.error('Failed to get cost analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cost analysis',
        error: error.message
      });
    }
  }
);

// Trends analysis
router.get('/trends',
  auth,
  [
    query('timeframe').optional().isIn(['last_6_months', 'last_year', 'last_2_years'])
      .withMessage('Invalid timeframe'),
    query('metric').optional().isIn(['applications', 'hires', 'time_to_hire', 'conversion_rate', 'cost_per_hire'])
      .withMessage('Invalid metric'),
    query('granularity').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid granularity')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'last_year', metric = 'applications', granularity = 'monthly' } = req.query;
      const filters = { metric, granularity };

      const trendsAnalysis = await analyticsService.getTrendsAnalysis(
        analyticsService.getDateRange(timeframe), 
        filters
      );
      
      res.json({
        success: true,
        timeframe,
        filters,
        trendsAnalysis
      });
    } catch (error) {
      console.error('Failed to get trends analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trends analysis',
        error: error.message
      });
    }
  }
);

// Predictive insights
router.get('/predictions',
  auth,
  [
    query('timeframe').optional().isIn(['next_30_days', 'next_90_days', 'next_6_months', 'next_year'])
      .withMessage('Invalid timeframe'),
    query('department').optional().isString().withMessage('Department must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timeframe = 'next_90_days', department } = req.query;
      const filters = {};
      if (department) filters.department = department;

      const predictiveInsights = await analyticsService.getPredictiveInsights(
        analyticsService.getDateRange('last_year'), // Use historical data for predictions
        filters
      );
      
      res.json({
        success: true,
        predictionTimeframe: timeframe,
        filters,
        predictiveInsights
      });
    } catch (error) {
      console.error('Failed to get predictive insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get predictive insights',
        error: error.message
      });
    }
  }
);

// Custom analytics report
router.post('/reports/custom',
  auth,
  [
    query('name').notEmpty().withMessage('Report name is required'),
    query('metrics').isArray().withMessage('Metrics must be an array'),
    query('dimensions').isArray().withMessage('Dimensions must be an array'),
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, metrics, dimensions, timeframe = 'last_30_days', filters = {} } = req.body;
      
      // Mock custom report generation
      const customReport = {
        id: `report_${Date.now()}`,
        name,
        metrics,
        dimensions,
        timeframe,
        filters,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.id,
        data: {
          summary: {
            totalRecords: Math.floor(Math.random() * 1000) + 100,
            dateRange: analyticsService.getDateRange(timeframe)
          },
          results: metrics.map(metric => ({
            metric,
            value: Math.floor(Math.random() * 1000),
            change: Math.floor(Math.random() * 20) - 10
          })),
          breakdown: dimensions.map(dimension => ({
            dimension,
            values: Array.from({ length: 5 }, (_, i) => ({
              category: `Category ${i + 1}`,
              value: Math.floor(Math.random() * 100)
            }))
          }))
        }
      };

      res.json({
        success: true,
        message: 'Custom report generated successfully',
        report: customReport
      });
    } catch (error) {
      console.error('Failed to generate custom report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate custom report',
        error: error.message
      });
    }
  }
);

// Export analytics data
router.post('/export',
  auth,
  [
    query('type').isIn(['dashboard', 'sources', 'funnel', 'diversity', 'costs']).withMessage('Invalid export type'),
    query('format').isIn(['csv', 'xlsx', 'json']).withMessage('Invalid export format'),
    query('timeframe').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year'])
      .withMessage('Invalid timeframe')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, format, timeframe = 'last_30_days', filters = {} } = req.body;
      
      // Mock export generation
      const exportFile = {
        id: `export_${Date.now()}`,
        type,
        format,
        timeframe,
        filename: `${type}_analytics_${timeframe}.${format}`,
        downloadUrl: `/api/analytics/exports/${Date.now()}/download`,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        size: '2.5 MB'
      };

      res.json({
        success: true,
        message: 'Analytics export generated successfully',
        export: exportFile
      });
    } catch (error) {
      console.error('Failed to export analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: error.message
      });
    }
  }
);

// Download export file
router.get('/exports/:exportId/download', auth, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    // Mock file download
    const filename = `analytics_export_${exportId}.csv`;
    const filePath = `/path/to/exports/${filename}`;
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Failed to download export:', err);
        res.status(404).json({
          success: false,
          message: 'Export file not found or has expired'
        });
      }
    });
  } catch (error) {
    console.error('Failed to download analytics export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download export file',
      error: error.message
    });
  }
});

// Real-time analytics (WebSocket endpoint would be better for this)
router.get('/realtime', auth, async (req, res) => {
  try {
    const realtimeData = {
      timestamp: new Date().toISOString(),
      activeUsers: Math.floor(Math.random() * 100) + 20,
      newApplications: {
        today: Math.floor(Math.random() * 50) + 10,
        thisHour: Math.floor(Math.random() * 10) + 1
      },
      ongoingInterviews: Math.floor(Math.random() * 15) + 2,
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: Math.floor(Math.random() * 100) + 50
      },
      alerts: [
        {
          type: 'warning',
          message: 'High drop-off rate detected in screening stage',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    res.json({
      success: true,
      realtimeData
    });
  } catch (error) {
    console.error('Failed to get real-time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time analytics',
      error: error.message
    });
  }
});

module.exports = router;
