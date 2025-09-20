const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const dataExportService = require('../services/dataExportService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Request data export
router.post('/request', authenticateToken, requireManager, async (req, res) => {
  try {
    const exportRequest = req.body;
    
    // Validate required fields
    if (!exportRequest.dataSource || !exportRequest.format) {
      return res.status(400).json({
        success: false,
        error: 'Data source and format are required'
      });
    }

    // Validate format
    if (!Object.values(dataExportService.supportedFormats).includes(exportRequest.format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported format. Supported formats: ${Object.values(dataExportService.supportedFormats).join(', ')}`
      });
    }

    // Validate data source
    if (!Object.keys(dataExportService.dataSourceMappings).includes(exportRequest.dataSource)) {
      return res.status(400).json({
        success: false,
        error: `Invalid data source. Available sources: ${Object.keys(dataExportService.dataSourceMappings).join(', ')}`
      });
    }

    const result = await dataExportService.exportData(req.user.id, exportRequest);
    
    res.status(202).json({
      success: true,
      data: result,
      message: 'Export request queued successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get export status
router.get('/status/:exportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    const status = await dataExportService.getExportStatus(exportId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// Get export history
router.get('/history', authenticateToken, requireManager, async (req, res) => {
  try {
    const { status, data_source, format, limit, page } = req.query;
    
    const filters = {
      status: status || null,
      dataSource: data_source || null,
      format: format || null,
      limit: parseInt(limit) || 50,
      page: parseInt(page) || 1
    };

    const history = await dataExportService.getExportHistory(req.user.id, filters);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download exported file
router.get('/download/:exportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    const downloadInfo = await dataExportService.downloadExport(exportId, req.user.id);
    
    // Set appropriate headers
    res.setHeader('Content-Type', downloadInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadInfo.filename}"`);
    res.setHeader('Content-Length', downloadInfo.fileSize);
    
    // Stream the file
    const fileStream = fs.createReadStream(downloadInfo.filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('expired')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else if (error.message.includes('Unauthorized')) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    } else if (error.message.includes('not ready')) {
      res.status(202).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// Get available data sources for export
router.get('/data-sources', authenticateToken, requireManager, async (req, res) => {
  try {
    const dataSources = Object.keys(dataExportService.dataSourceMappings).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      description: `Export ${key.replace(/_/g, ' ')} data`,
      recordLimit: dataExportService.exportLimits.csv, // Default to CSV limit
      availableFields: dataExportService.getDefaultFields ? dataExportService.getDefaultFields(key) : []
    }));
    
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

// Get supported export formats
router.get('/formats', authenticateToken, requireManager, async (req, res) => {
  try {
    const formats = Object.entries(dataExportService.supportedFormats).map(([key, value]) => ({
      id: value,
      name: key.toUpperCase(),
      description: `Export data in ${key.toUpperCase()} format`,
      mimeType: dataExportService.getMimeType(value),
      maxRecords: dataExportService.exportLimits[value] || 1000000
    }));
    
    res.json({
      success: true,
      data: formats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fields for a specific data source
router.get('/data-sources/:dataSource/fields', authenticateToken, requireManager, async (req, res) => {
  try {
    const { dataSource } = req.params;
    
    if (!Object.keys(dataExportService.dataSourceMappings).includes(dataSource)) {
      return res.status(404).json({
        success: false,
        error: 'Data source not found'
      });
    }

    const fields = dataExportService.getDefaultFields(dataSource);
    
    const fieldDefinitions = fields.map(field => ({
      name: field,
      label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: this.inferFieldType(field),
      required: ['id'].includes(field),
      sortable: true,
      filterable: true
    }));
    
    res.json({
      success: true,
      data: {
        dataSource,
        fields: fieldDefinitions,
        totalFields: fieldDefinitions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel export
router.delete('/:exportId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    const exportJob = dataExportService.activeExports.get(exportId);
    
    if (!exportJob) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }

    if (exportJob.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to cancel this export'
      });
    }

    if (exportJob.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed export'
      });
    }

    // Cancel the export
    exportJob.status = 'cancelled';
    exportJob.completedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Export cancelled successfully',
      data: {
        exportId,
        status: 'cancelled'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk export multiple data sources
router.post('/bulk', authenticateToken, requireManager, async (req, res) => {
  try {
    const { exports, format, options } = req.body;
    
    if (!exports || !Array.isArray(exports) || exports.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Exports array is required and must not be empty'
      });
    }

    if (exports.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 exports allowed per bulk request'
      });
    }

    const bulkExportId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results = [];
    
    for (const exportRequest of exports) {
      try {
        const result = await dataExportService.exportData(req.user.id, {
          ...exportRequest,
          format: format || exportRequest.format || 'csv',
          options: { ...options, ...exportRequest.options }
        });
        
        results.push({
          dataSource: exportRequest.dataSource,
          exportId: result.exportId,
          status: 'queued'
        });
      } catch (error) {
        results.push({
          dataSource: exportRequest.dataSource,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    res.status(202).json({
      success: true,
      data: {
        bulkExportId,
        exports: results,
        totalRequested: exports.length,
        successful: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length
      },
      message: 'Bulk export request processed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export preview (limited rows)
router.post('/preview', authenticateToken, requireManager, async (req, res) => {
  try {
    const { dataSource, filters, fields, limit } = req.body;
    
    if (!dataSource) {
      return res.status(400).json({
        success: false,
        error: 'Data source is required'
      });
    }

    // Create preview export request
    const previewRequest = {
      dataSource,
      format: 'json', // Always use JSON for preview
      filters: filters || {},
      fields: fields || [],
      options: {
        limit: Math.min(parseInt(limit) || 100, 1000), // Max 1000 for preview
        preview: true
      }
    };

    const result = await dataExportService.exportData(req.user.id, previewRequest);
    
    // For preview, wait for completion and return data directly
    // In a real implementation, you might poll the status or use a different approach
    
    res.json({
      success: true,
      data: {
        dataSource,
        previewData: [], // Mock preview data
        totalRecords: Math.floor(Math.random() * 10000) + 1000,
        previewLimit: previewRequest.options.limit,
        message: 'This is a preview of the data that will be exported'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get export queue status
router.get('/queue/status', authenticateToken, requireManager, async (req, res) => {
  try {
    const queueStatus = {
      totalInQueue: dataExportService.exportQueue.length,
      currentlyProcessing: Array.from(dataExportService.activeExports.values())
        .filter(job => job.status === 'processing').length,
      maxConcurrent: dataExportService.maxConcurrentExports,
      userExports: Array.from(dataExportService.activeExports.values())
        .filter(job => job.userId === req.user.id).length,
      estimatedWaitTime: Math.max(0, dataExportService.exportQueue.length * 30) // seconds
    };
    
    res.json({
      success: true,
      data: queueStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get export statistics
router.get('/statistics', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period } = req.query;
    
    // Mock statistics - in a real implementation, this would come from database
    const statistics = {
      period: period || 'last_30_days',
      totalExports: Math.floor(Math.random() * 500) + 100,
      successfulExports: Math.floor(Math.random() * 450) + 80,
      failedExports: Math.floor(Math.random() * 50) + 5,
      totalDataExported: `${(Math.random() * 100 + 50).toFixed(2)} GB`,
      averageExportTime: `${Math.floor(Math.random() * 120) + 30} seconds`,
      popularFormats: [
        { format: 'csv', count: Math.floor(Math.random() * 200) + 50 },
        { format: 'xlsx', count: Math.floor(Math.random() * 150) + 30 },
        { format: 'pdf', count: Math.floor(Math.random() * 100) + 20 },
        { format: 'json', count: Math.floor(Math.random() * 80) + 15 }
      ],
      popularDataSources: [
        { dataSource: 'employees', count: Math.floor(Math.random() * 150) + 40 },
        { dataSource: 'applications', count: Math.floor(Math.random() * 120) + 35 },
        { dataSource: 'performance', count: Math.floor(Math.random() * 100) + 25 },
        { dataSource: 'attendance', count: Math.floor(Math.random() * 80) + 20 }
      ]
    };
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clean up expired exports
router.post('/cleanup', authenticateToken, requireManager, async (req, res) => {
  try {
    // Only allow admin users to trigger cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can trigger cleanup'
      });
    }

    dataExportService.cleanupExpiredExports();
    
    res.json({
      success: true,
      message: 'Expired exports cleaned up successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get export configuration
router.get('/config', authenticateToken, requireManager, async (req, res) => {
  try {
    const config = {
      supportedFormats: Object.values(dataExportService.supportedFormats),
      supportedDataSources: Object.keys(dataExportService.dataSourceMappings),
      exportLimits: dataExportService.exportLimits,
      maxConcurrentExports: dataExportService.maxConcurrentExports,
      exportTimeoutMs: dataExportService.exportTimeoutMs,
      retentionDays: 7, // Files kept for 7 days
      maxFileSize: '100MB',
      supportedFilters: [
        'equals', 'not_equals', 'contains', 'not_contains',
        'greater_than', 'less_than', 'between',
        'in_list', 'not_in_list',
        'date_range', 'last_n_days'
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

// Helper function to infer field type
function inferFieldType(fieldName) {
  if (fieldName.includes('date') || fieldName.includes('_at')) {
    return 'date';
  } else if (fieldName.includes('count') || fieldName.includes('amount') || fieldName.includes('salary')) {
    return 'number';
  } else if (fieldName.includes('email')) {
    return 'email';
  } else if (fieldName.includes('phone')) {
    return 'phone';
  } else {
    return 'text';
  }
}

module.exports = router;
