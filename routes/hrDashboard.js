const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const hrDashboardService = require('../services/hrDashboardService');

const router = express.Router();

// Get real-time HR dashboard
router.get('/real-time', authenticateToken, requireManager, async (req, res) => {
  try {
    const { timeframe, department, location, include_alerts } = req.query;
    
    const filters = {
      timeframe: timeframe || 'current_month',
      department: department || null,
      location: location || null,
      includeAlerts: include_alerts === 'true'
    };

    const dashboard = await hrDashboardService.getRealTimeHRDashboard(req.user.id, filters);
    
    res.json({
      success: true,
      data: dashboard,
      cache_info: {
        cached: false,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get HR overview metrics
router.get('/overview', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, compare_to } = req.query;
    
    const filters = {
      period: period || 'last_30_days',
      compareTo: compare_to || 'previous_period'
    };

    const overview = await hrDashboardService.getHROverviewMetrics(filters);
    
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

// Get headcount metrics
router.get('/headcount', authenticateToken, requireManager, async (req, res) => {
  try {
    const { breakdown_by, include_trends } = req.query;
    
    const filters = {
      breakdownBy: breakdown_by || 'department',
      includeTrends: include_trends === 'true'
    };

    const headcount = await hrDashboardService.getHeadcountMetrics(filters);
    
    res.json({
      success: true,
      data: headcount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get turnover analysis
router.get('/turnover', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, include_predictions } = req.query;
    
    const filters = {
      period: period || 'last_12_months',
      includePredictions: include_predictions === 'true'
    };

    const turnover = await hrDashboardService.getTurnoverAnalysis(filters);
    
    res.json({
      success: true,
      data: turnover
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recruitment metrics for dashboard
router.get('/recruitment', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, include_pipeline } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      includePipeline: include_pipeline === 'true'
    };

    const recruitment = await hrDashboardService.getRecruitmentMetrics(filters);
    
    res.json({
      success: true,
      data: recruitment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance overview for dashboard
router.get('/performance', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, breakdown_by } = req.query;
    
    const filters = {
      period: period || 'current_year',
      breakdownBy: breakdown_by || 'department'
    };

    const performance = await hrDashboardService.getPerformanceOverview(filters);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get department metrics
router.get('/departments', authenticateToken, requireManager, async (req, res) => {
  try {
    const { include_efficiency, include_budgets } = req.query;
    
    const filters = {
      includeEfficiency: include_efficiency === 'true',
      includeBudgets: include_budgets === 'true'
    };

    const departments = await hrDashboardService.getDepartmentMetrics(filters);
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attendance metrics
router.get('/attendance', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, include_trends } = req.query;
    
    const filters = {
      period: period || 'last_30_days',
      includeTrends: include_trends === 'true'
    };

    const attendance = await hrDashboardService.getAttendanceMetrics(filters);
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get HR alerts and notifications
router.get('/alerts', authenticateToken, requireManager, async (req, res) => {
  try {
    const { severity, category, limit } = req.query;
    
    const filters = {
      severity: severity || 'all',
      category: category || 'all',
      limit: parseInt(limit) || 50
    };

    const alerts = await hrDashboardService.getHRAlerts(filters);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recent HR activity
router.get('/activity', authenticateToken, requireManager, async (req, res) => {
  try {
    const { limit, activity_type } = req.query;
    
    const filters = {
      limit: parseInt(limit) || 20,
      activityType: activity_type || 'all'
    };

    const activity = await hrDashboardService.getRecentHRActivity(filters);
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear dashboard cache
router.post('/cache/clear', authenticateToken, requireManager, async (req, res) => {
  try {
    hrDashboardService.clearCache();
    
    res.json({
      success: true,
      message: 'Dashboard cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update dashboard refresh interval
router.put('/settings/refresh-interval', authenticateToken, requireManager, async (req, res) => {
  try {
    const { interval } = req.body;
    
    if (!interval || interval < 5000) {
      return res.status(400).json({
        success: false,
        error: 'Refresh interval must be at least 5 seconds (5000ms)'
      });
    }

    hrDashboardService.setRefreshInterval(interval);
    
    res.json({
      success: true,
      message: 'Dashboard refresh interval updated successfully',
      data: { interval }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get dashboard configuration
router.get('/config', authenticateToken, requireManager, async (req, res) => {
  try {
    const config = {
      refreshInterval: hrDashboardService.refreshInterval,
      cacheDuration: hrDashboardService.cacheDuration,
      availableMetrics: Object.keys(hrDashboardService.metricTypes),
      quickActions: hrDashboardService.getQuickActions()
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

// Export dashboard data
router.post('/export', authenticateToken, requireManager, async (req, res) => {
  try {
    const { format, sections, filters } = req.body;
    
    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing export format. Supported: csv, excel, pdf'
      });
    }

    // Get dashboard data
    const dashboard = await hrDashboardService.getRealTimeHRDashboard(req.user.id, filters || {});
    
    // TODO: Implement export functionality
    // This would typically integrate with the dataExportService
    
    res.json({
      success: true,
      message: 'Dashboard export initiated',
      data: {
        exportId: `dashboard_export_${Date.now()}`,
        format: format,
        sections: sections || ['all'],
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

module.exports = router;
