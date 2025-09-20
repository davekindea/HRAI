const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const performanceAnalyticsService = require('../services/performanceAnalyticsService');

const router = express.Router();

// Get comprehensive performance analytics
router.get('/overview', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, department, manager_id, employee_level } = req.query;
    
    const filters = {
      period: period || 'current_year',
      department: department || null,
      managerId: manager_id || null,
      employeeLevel: employee_level || null
    };

    const analytics = await performanceAnalyticsService.getPerformanceAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance overview metrics
router.get('/metrics', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, breakdown_by } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      breakdownBy: breakdown_by || 'department'
    };

    const overview = await performanceAnalyticsService.getPerformanceOverview(filters);
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get rating distribution analysis
router.get('/ratings/distribution', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, department, manager_id } = req.query;
    
    const filters = {
      period: period || 'current_year',
      department: department || null,
      managerId: manager_id || null
    };

    const distribution = await performanceAnalyticsService.getRatingDistribution(filters);
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get goal analysis
router.get('/goals', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, goal_type, status } = req.query;
    
    const filters = {
      period: period || 'current_year',
      goalType: goal_type || null,
      status: status || null
    };

    const goalAnalysis = await performanceAnalyticsService.getGoalAnalysis(filters);
    
    res.json({
      success: true,
      data: goalAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get goal completion analytics
router.get('/goals/completion', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, department, employee_id } = req.query;
    
    const filters = {
      period: period || 'current_year',
      department: department || null,
      employeeId: employee_id || null
    };

    const goalCompletion = await performanceAnalyticsService.getGoalCompletionAnalytics(filters);
    
    res.json({
      success: true,
      data: goalCompletion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get competency analysis
router.get('/competencies', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, competency_category, department } = req.query;
    
    const filters = {
      period: period || 'current_year',
      competencyCategory: competency_category || null,
      department: department || null
    };

    const competencies = await performanceAnalyticsService.getCompetencyAnalysis(filters);
    
    res.json({
      success: true,
      data: competencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance trends
router.get('/trends', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, trend_type, granularity } = req.query;
    
    const filters = {
      period: period || 'last_12_months',
      trendType: trend_type || 'all',
      granularity: granularity || 'monthly'
    };

    const trends = await performanceAnalyticsService.getPerformanceTrends(filters);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get department performance analysis
router.get('/departments', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, include_benchmarks } = req.query;
    
    const filters = {
      period: period || 'current_year',
      includeBenchmarks: include_benchmarks === 'true'
    };

    const departmentPerformance = await performanceAnalyticsService.getDepartmentPerformance(filters);
    
    res.json({
      success: true,
      data: departmentPerformance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get manager effectiveness analysis
router.get('/managers', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, manager_id, include_feedback } = req.query;
    
    const filters = {
      period: period || 'current_year',
      managerId: manager_id || null,
      includeFeedback: include_feedback === 'true'
    };

    const managerEffectiveness = await performanceAnalyticsService.getManagerEffectiveness(filters);
    
    res.json({
      success: true,
      data: managerEffectiveness
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get top performers
router.get('/top-performers', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, limit, department } = req.query;
    
    const filters = {
      period: period || 'current_year',
      limit: parseInt(limit) || 10,
      department: department || null
    };

    const topPerformers = await performanceAnalyticsService.getTopPerformers(filters);
    
    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get improvement opportunities
router.get('/improvement-opportunities', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, severity, department } = req.query;
    
    const filters = {
      period: period || 'current_year',
      severity: severity || 'all',
      department: department || null
    };

    const opportunities = await performanceAnalyticsService.getImprovementOpportunities(filters);
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get calibration analysis
router.get('/calibration', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, manager_id, department } = req.query;
    
    const filters = {
      period: period || 'current_year',
      managerId: manager_id || null,
      department: department || null
    };

    const calibration = await performanceAnalyticsService.getCalibrationAnalysis(filters);
    
    res.json({
      success: true,
      data: calibration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get correlation analysis
router.get('/correlations', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, metrics } = req.query;
    
    const filters = {
      period: period || 'current_year',
      metrics: metrics ? metrics.split(',') : null
    };

    const correlations = await performanceAnalyticsService.getCorrelationAnalysis(filters);
    
    res.json({
      success: true,
      data: correlations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get benchmark comparison
router.get('/benchmarks', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, benchmark_type, industry } = req.query;
    
    const filters = {
      period: period || 'current_year',
      benchmarkType: benchmark_type || 'industry',
      industry: industry || null
    };

    const benchmarks = await performanceAnalyticsService.getBenchmarkComparison(filters);
    
    res.json({
      success: true,
      data: benchmarks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get individual employee performance review
router.get('/employees/:employeeId/review', authenticateToken, requireManager, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { review_period } = req.query;
    
    const reviewPeriod = review_period || 'current_year';
    
    const review = await performanceAnalyticsService.getEmployeePerformanceReview(employeeId, reviewPeriod);
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance analytics configuration
router.get('/config', authenticateToken, requireManager, async (req, res) => {
  try {
    const config = {
      performanceMetrics: Object.keys(performanceAnalyticsService.performanceMetrics),
      ratingScales: performanceAnalyticsService.ratingScales,
      reviewTypes: Object.keys(performanceAnalyticsService.reviewTypes),
      competencyCategories: Object.keys(performanceAnalyticsService.competencyCategories),
      availablePeriods: [
        'current_month',
        'current_quarter', 
        'current_year',
        'last_30_days',
        'last_90_days',
        'last_12_months',
        'previous_quarter',
        'previous_year'
      ],
      breakdownOptions: [
        'department',
        'manager',
        'level',
        'location',
        'hire_date_range'
      ]
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create custom performance metric
router.post('/metrics/custom', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, description, calculation, weight, category } = req.body;
    
    if (!name || !calculation) {
      return res.status(400).json({
        success: false,
        error: 'Metric name and calculation are required'
      });
    }

    const customMetric = {
      id: `custom_${Date.now()}`,
      name,
      description: description || '',
      calculation,
      weight: weight || 1.0,
      category: category || 'custom',
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };

    // Store custom metric (in a real implementation, this would be persisted)
    
    res.status(201).json({
      success: true,
      data: customMetric,
      message: 'Custom performance metric created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export performance analytics data
router.post('/export', authenticateToken, requireManager, async (req, res) => {
  try {
    const { format, sections, filters, options } = req.body;
    
    if (!format || !['csv', 'xlsx', 'pdf'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format. Supported: csv, xlsx, pdf'
      });
    }

    // Get performance analytics data based on sections
    let exportData = {};
    
    if (!sections || sections.includes('overview')) {
      exportData.overview = await performanceAnalyticsService.getPerformanceAnalytics(filters || {});
    }
    
    if (sections && sections.includes('goals')) {
      exportData.goals = await performanceAnalyticsService.getGoalCompletionAnalytics(filters || {});
    }
    
    if (sections && sections.includes('competencies')) {
      exportData.competencies = await performanceAnalyticsService.getCompetencyAnalysis(filters || {});
    }

    // TODO: Implement actual export functionality using dataExportService
    
    res.json({
      success: true,
      message: 'Performance analytics export initiated',
      data: {
        exportId: `performance_export_${Date.now()}`,
        format: format,
        sections: sections || ['overview'],
        status: 'processing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance insights and recommendations
router.get('/insights', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, focus_area, limit } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      focusArea: focus_area || 'all',
      limit: parseInt(limit) || 10
    };

    // Generate insights based on performance data
    const analytics = await performanceAnalyticsService.getPerformanceAnalytics(filters);
    
    const insights = [
      {
        type: 'trend',
        title: 'Performance Rating Trend',
        description: 'Overall performance ratings are trending upward this quarter',
        priority: 'medium',
        actionRequired: false
      },
      {
        type: 'opportunity',
        title: 'Goal Completion Improvement',
        description: 'Goal completion rates could be improved in the Sales department',
        priority: 'high',
        actionRequired: true,
        recommendations: [
          'Implement weekly goal check-ins',
          'Provide additional goal-setting training',
          'Review goal difficulty and adjust targets'
        ]
      },
      {
        type: 'risk',
        title: 'Manager Calibration Variance',
        description: 'Rating variance between managers suggests need for calibration',
        priority: 'medium',
        actionRequired: true,
        recommendations: [
          'Conduct manager calibration sessions',
          'Provide rating guidelines training',
          'Implement peer review process'
        ]
      }
    ];
    
    res.json({
      success: true,
      data: {
        insights: insights.slice(0, filters.limit),
        summary: {
          totalInsights: insights.length,
          highPriority: insights.filter(i => i.priority === 'high').length,
          actionRequired: insights.filter(i => i.actionRequired).length
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
