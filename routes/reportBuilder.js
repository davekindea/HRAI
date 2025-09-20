const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const reportBuilderService = require('../services/reportBuilderService');

const router = express.Router();

// Get available data sources
router.get('/data-sources', authenticateToken, requireManager, async (req, res) => {
  try {
    const dataSources = await reportBuilderService.getAvailableDataSources(req.user.id);
    
    res.json({
      success: true,
      data: dataSources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get saved reports
router.get('/reports', authenticateToken, requireManager, async (req, res) => {
  try {
    const { search, data_source, tags, sort_by, page, limit } = req.query;
    
    const filters = {
      search: search || null,
      dataSource: data_source || null,
      tags: tags ? tags.split(',') : [],
      sortBy: sort_by || 'updated',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const reports = await reportBuilderService.getSavedReports(req.user.id, filters);
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: reports.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create custom report
router.post('/reports', authenticateToken, requireManager, async (req, res) => {
  try {
    const reportConfig = req.body;
    
    // Validate required fields
    if (!reportConfig.name || !reportConfig.dataSource) {
      return res.status(400).json({
        success: false,
        error: 'Report name and data source are required'
      });
    }

    const report = await reportBuilderService.createCustomReport(req.user.id, reportConfig);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Custom report created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific report configuration
router.get('/reports/:reportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = reportBuilderService.savedReports.get(reportId) || 
                   reportBuilderService.reportTemplates.get(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check permissions
    if (report.createdBy && report.createdBy !== req.user.id && !report.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to access this report'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute report
router.post('/reports/:reportId/execute', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { force_refresh, include_insights, custom_filters } = req.body;
    
    const executeOptions = {
      forceRefresh: force_refresh === true,
      includeInsights: include_insights !== false,
      customFilters: custom_filters || {}
    };

    const result = await reportBuilderService.executeReport(reportId, req.user.id, executeOptions);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export report
router.post('/reports/:reportId/export', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format, options } = req.body;
    
    if (!format || !['csv', 'xlsx', 'pdf', 'json'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format. Supported: csv, xlsx, pdf, json'
      });
    }

    const exportResult = await reportBuilderService.exportReport(
      reportId, 
      req.user.id, 
      format, 
      options || {}
    );
    
    res.json({
      success: true,
      data: exportResult,
      message: 'Report exported successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download exported report
router.get('/reports/:reportId/download/:filename', authenticateToken, requireManager, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found or expired'
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).json({
          success: false,
          error: 'Failed to download file'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update report
router.put('/reports/:reportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    
    const report = reportBuilderService.savedReports.get(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check permissions
    if (report.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update this report'
      });
    }

    // Update report
    Object.assign(report, updates, {
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    });

    reportBuilderService.savedReports.set(reportId, report);
    
    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete report
router.delete('/reports/:reportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = reportBuilderService.savedReports.get(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check permissions
    if (report.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete this report'
      });
    }

    reportBuilderService.savedReports.delete(reportId);
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clone report
router.post('/reports/:reportId/clone', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { new_name } = req.body;
    
    const originalReport = reportBuilderService.savedReports.get(reportId) || 
                          reportBuilderService.reportTemplates.get(reportId);
    
    if (!originalReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const clonedReportConfig = {
      ...originalReport,
      name: new_name || `${originalReport.name} (Copy)`,
      id: undefined, // Will be generated
      createdBy: req.user.id,
      createdAt: undefined, // Will be generated
      isPublic: false
    };

    const clonedReport = await reportBuilderService.createCustomReport(req.user.id, clonedReportConfig);
    
    res.status(201).json({
      success: true,
      data: clonedReport,
      message: 'Report cloned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get report templates
router.get('/templates', authenticateToken, requireManager, async (req, res) => {
  try {
    const templates = Array.from(reportBuilderService.reportTemplates.values());
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create report from template
router.post('/templates/:templateId/create', authenticateToken, requireManager, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, customizations } = req.body;
    
    const template = reportBuilderService.reportTemplates.get(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const reportConfig = {
      ...template,
      name: name || `${template.name} - ${new Date().toLocaleDateString()}`,
      id: undefined, // Will be generated
      createdBy: req.user.id,
      isPublic: false,
      ...customizations
    };

    const report = await reportBuilderService.createCustomReport(req.user.id, reportConfig);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report created from template successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get field definitions for data source
router.get('/data-sources/:dataSource/fields', authenticateToken, requireManager, async (req, res) => {
  try {
    const { dataSource } = req.params;
    
    const fields = await reportBuilderService.getDataSourceFields(dataSource);
    
    if (!fields || fields.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Data source not found or has no fields'
      });
    }

    res.json({
      success: true,
      data: {
        dataSource,
        fields: fields.map(field => ({
          name: field,
          type: reportBuilderService.inferFieldType(field),
          label: reportBuilderService.generateFieldLabel(field)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Preview report (limited results)
router.post('/reports/:reportId/preview', authenticateToken, requireManager, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { filters, limit } = req.body;
    
    const previewOptions = {
      forceRefresh: true,
      limit: Math.min(parseInt(limit) || 100, 1000), // Max 1000 for preview
      customFilters: filters || {}
    };

    const result = await reportBuilderService.executeReport(reportId, req.user.id, previewOptions);
    
    // Limit the data for preview
    const previewResult = {
      ...result,
      data: result.data.slice(0, previewOptions.limit),
      isPreview: true,
      previewLimit: previewOptions.limit,
      totalRecords: result.totalRecords
    };
    
    res.json({
      success: true,
      data: previewResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get report builder configuration
router.get('/config', authenticateToken, requireManager, async (req, res) => {
  try {
    const config = {
      supportedFormats: Object.keys(reportBuilderService.exportFormats),
      supportedDataSources: Object.keys(reportBuilderService.dataSourceTypes),
      fieldTypes: Object.keys(reportBuilderService.fieldTypes),
      aggregationTypes: Object.keys(reportBuilderService.aggregationTypes),
      visualizationTypes: Object.keys(reportBuilderService.visualizationTypes),
      maxRecordsPerReport: 1000000,
      supportedFilters: [
        'equals', 'not_equals', 'contains', 'not_contains',
        'greater_than', 'less_than', 'between',
        'in_list', 'not_in_list',
        'is_null', 'is_not_null',
        'last_7_days', 'last_30_days', 'last_90_days',
        'current_month', 'current_quarter', 'current_year'
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

module.exports = router;
