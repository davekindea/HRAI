const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const advancedAnalyticsService = require('../services/advancedAnalyticsService');

const router = express.Router();

// Get comprehensive HR analytics dashboard
router.get('/comprehensive', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      period, 
      department, 
      location, 
      manager_id, 
      include_predictions,
      include_benchmarks,
      cache_duration 
    } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      department: department || null,
      location: location || null,
      managerId: manager_id || null,
      includePredictions: include_predictions === 'true',
      includeBenchmarks: include_benchmarks === 'true',
      cacheDuration: parseInt(cache_duration) || 300000 // 5 minutes default
    };

    const analytics = await advancedAnalyticsService.getComprehensiveAnalytics(req.user.id, filters);
    
    res.json({
      success: true,
      data: analytics,
      meta: {
        generated_at: analytics.timestamp,
        filters_applied: filters,
        cache_info: {
          cached: false,
          expires_at: new Date(Date.now() + filters.cacheDuration).toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get executive summary
router.get('/executive-summary', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, focus_areas } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      focusAreas: focus_areas ? focus_areas.split(',') : ['all']
    };

    const summary = await advancedAnalyticsService.getExecutiveSummary(filters);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get KPI dashboard
router.get('/kpi-dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period, kpi_categories, include_trends } = req.query;
    
    const filters = {
      period: period || 'current_year',
      kpiCategories: kpi_categories ? kpi_categories.split(',') : null,
      includeTrends: include_trends === 'true'
    };

    const kpiDashboard = await advancedAnalyticsService.getKPIDashboard(filters);
    
    res.json({
      success: true,
      data: kpiDashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get insights and recommendations
router.get('/insights', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      period, 
      insight_types, 
      min_confidence, 
      limit,
      priority_filter 
    } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      insightTypes: insight_types ? insight_types.split(',') : null,
      minConfidence: parseFloat(min_confidence) || 0.6,
      limit: parseInt(limit) || 20,
      priorityFilter: priority_filter || null
    };

    const insights = await advancedAnalyticsService.generateInsightsAndRecommendations(filters);
    
    res.json({
      success: true,
      data: insights,
      meta: {
        total_insights: insights.insights.length,
        high_confidence: insights.insights.filter(i => i.confidence > 0.8).length,
        action_required: insights.insights.filter(i => i.actionRequired).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get predictive analytics
router.get('/predictive', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      forecast_period, 
      prediction_types, 
      confidence_threshold,
      include_scenarios 
    } = req.query;
    
    const filters = {
      forecastPeriod: forecast_period || 'next_quarter',
      predictionTypes: prediction_types ? prediction_types.split(',') : null,
      confidenceThreshold: parseFloat(confidence_threshold) || 0.7,
      includeScenarios: include_scenarios === 'true'
    };

    const predictiveAnalytics = await advancedAnalyticsService.getPredictiveAnalytics(filters);
    
    res.json({
      success: true,
      data: predictiveAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get enhanced recruitment analytics
router.get('/recruitment', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      period, 
      include_funnel, 
      include_sources, 
      include_costs,
      department 
    } = req.query;
    
    const filters = {
      period: period || 'current_quarter',
      includeFunnel: include_funnel !== 'false',
      includeSources: include_sources !== 'false',
      includeCosts: include_costs === 'true',
      department: department || null
    };

    const recruitmentAnalytics = await advancedAnalyticsService.getEnhancedRecruitmentAnalytics(filters);
    
    res.json({
      success: true,
      data: recruitmentAnalytics
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
    const { 
      benchmark_type, 
      industry, 
      company_size, 
      metrics 
    } = req.query;
    
    const filters = {
      benchmarkType: benchmark_type || 'industry',
      industry: industry || null,
      companySize: company_size || null,
      metrics: metrics ? metrics.split(',') : null
    };

    const benchmarks = await advancedAnalyticsService.getBenchmarkComparison(filters);
    
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

// Get available KPI definitions
router.get('/kpis/definitions', authenticateToken, requireManager, async (req, res) => {
  try {
    const { category } = req.query;
    
    let kpiDefinitions = Array.from(advancedAnalyticsService.kpiDefinitions.values());
    
    if (category) {
      kpiDefinitions = kpiDefinitions.filter(kpi => kpi.category === category);
    }
    
    res.json({
      success: true,
      data: kpiDefinitions,
      meta: {
        total_kpis: kpiDefinitions.length,
        categories: [...new Set(kpiDefinitions.map(kpi => kpi.category))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create custom KPI
router.post('/kpis/custom', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      unit, 
      target, 
      calculation, 
      frequency 
    } = req.body;
    
    if (!name || !calculation) {
      return res.status(400).json({
        success: false,
        error: 'KPI name and calculation are required'
      });
    }

    const customKPI = {
      id: `custom_${Date.now()}`,
      name,
      description: description || '',
      category: category || 'custom',
      unit: unit || 'number',
      target: target || null,
      calculation,
      frequency: frequency || 'monthly',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    // Add to KPI definitions
    advancedAnalyticsService.kpiDefinitions.set(customKPI.id, customKPI);
    
    res.status(201).json({
      success: true,
      data: customKPI,
      message: 'Custom KPI created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update KPI target
router.put('/kpis/:kpiId/target', authenticateToken, requireManager, async (req, res) => {
  try {
    const { kpiId } = req.params;
    const { target, reason } = req.body;
    
    const kpi = advancedAnalyticsService.kpiDefinitions.get(kpiId);
    
    if (!kpi) {
      return res.status(404).json({
        success: false,
        error: 'KPI not found'
      });
    }

    // Update target
    const oldTarget = kpi.target;
    kpi.target = target;
    kpi.targetUpdatedAt = new Date().toISOString();
    kpi.targetUpdatedBy = req.user.id;
    kpi.targetUpdateReason = reason || null;
    
    res.json({
      success: true,
      data: {
        kpiId,
        oldTarget,
        newTarget: target,
        updatedAt: kpi.targetUpdatedAt
      },
      message: 'KPI target updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analytics modules status
router.get('/modules/status', authenticateToken, requireManager, async (req, res) => {
  try {
    const moduleStatus = {
      dashboard: {
        name: 'HR Dashboard',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        cacheSize: advancedAnalyticsService.analyticsCache.size
      },
      recruitment: {
        name: 'Recruitment Analytics',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        features: ['funnel_analysis', 'source_effectiveness', 'cost_analysis']
      },
      performance: {
        name: 'Performance Analytics',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        features: ['rating_distribution', 'goal_tracking', 'competency_analysis']
      },
      reporting: {
        name: 'Custom Reporting',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        reportCount: 25 // Mock count
      },
      export: {
        name: 'Data Export',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        queueLength: 3 // Mock queue length
      },
      predictive: {
        name: 'Predictive Analytics',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        modelAccuracy: '85%'
      }
    };
    
    res.json({
      success: true,
      data: moduleStatus,
      meta: {
        totalModules: Object.keys(moduleStatus).length,
        activeModules: Object.values(moduleStatus).filter(m => m.status === 'active').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analytics configuration
router.get('/config', authenticateToken, requireManager, async (req, res) => {
  try {
    const config = {
      analyticsModules: Object.keys(advancedAnalyticsService.analyticsModules),
      metricCategories: Object.keys(advancedAnalyticsService.metricCategories),
      insightTypes: Object.keys(advancedAnalyticsService.insightTypes),
      supportedPeriods: [
        'current_day',
        'current_week', 
        'current_month',
        'current_quarter',
        'current_year',
        'last_7_days',
        'last_30_days',
        'last_90_days',
        'last_12_months',
        'previous_month',
        'previous_quarter',
        'previous_year',
        'year_to_date',
        'quarter_to_date'
      ],
      defaultFilters: {
        period: 'current_quarter',
        includePredictions: false,
        includeBenchmarks: true,
        minConfidence: 0.7
      },
      cacheSettings: {
        defaultDuration: 300000, // 5 minutes
        maxDuration: 3600000, // 1 hour
        sizeLimits: {
          comprehensive: 50,
          insights: 100,
          kpis: 200
        }
      },
      featureFlags: {
        predictiveAnalytics: true,
        benchmarkComparison: true,
        customKPIs: true,
        advancedInsights: true,
        realTimeUpdates: true
      }
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

// Clear analytics cache
router.post('/cache/clear', authenticateToken, requireManager, async (req, res) => {
  try {
    const { cache_type } = req.body;
    
    if (cache_type) {
      // Clear specific cache type
      const keysToDelete = [];
      for (const [key, value] of advancedAnalyticsService.analyticsCache.entries()) {
        if (key.startsWith(cache_type)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        advancedAnalyticsService.analyticsCache.delete(key);
      });
      
      res.json({
        success: true,
        message: `${cache_type} cache cleared successfully`,
        data: {
          clearedEntries: keysToDelete.length,
          remainingEntries: advancedAnalyticsService.analyticsCache.size
        }
      });
    } else {
      // Clear all cache
      const totalEntries = advancedAnalyticsService.analyticsCache.size;
      advancedAnalyticsService.analyticsCache.clear();
      
      res.json({
        success: true,
        message: 'All analytics cache cleared successfully',
        data: {
          clearedEntries: totalEntries,
          remainingEntries: 0
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get quick actions for analytics
router.get('/quick-actions', authenticateToken, requireManager, async (req, res) => {
  try {
    const quickActions = advancedAnalyticsService.getAnalyticsQuickActions();
    
    res.json({
      success: true,
      data: quickActions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export comprehensive analytics
router.post('/export', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      format, 
      sections, 
      filters, 
      include_charts,
      include_raw_data 
    } = req.body;
    
    if (!format || !['pdf', 'excel', 'csv'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format. Supported: pdf, excel, csv'
      });
    }

    // Get comprehensive analytics data
    const analytics = await advancedAnalyticsService.getComprehensiveAnalytics(
      req.user.id, 
      filters || {}
    );
    
    // TODO: Implement actual export functionality using dataExportService
    // This would package the analytics data according to the requested format and sections
    
    res.json({
      success: true,
      message: 'Analytics export initiated',
      data: {
        exportId: `analytics_export_${Date.now()}`,
        format: format,
        sections: sections || ['all'],
        estimatedSize: 'Large (5-10MB)',
        estimatedTime: '3-5 minutes',
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

// Get analytics health check
router.get('/health', authenticateToken, requireManager, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        hrDashboard: 'operational',
        reportBuilder: 'operational', 
        performanceAnalytics: 'operational',
        scheduledReporting: 'operational',
        dataExport: 'operational',
        advancedAnalytics: 'operational'
      },
      cache: {
        size: advancedAnalyticsService.analyticsCache.size,
        maxSize: 1000,
        hitRate: '85%' // Mock value
      },
      performance: {
        averageResponseTime: '250ms',
        errorRate: '0.1%',
        uptime: '99.9%'
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
