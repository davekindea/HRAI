const express = require('express');
const router = express.Router();
const complianceService = require('../services/complianceService');
const multer = require('multer');

// Configure multer for secure document uploads
const upload = multer({
  dest: 'tmp/uploads/compliance',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for compliance documents
  },
  fileFilter: (req, file, cb) => {
    // Allow various document types for compliance
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed for compliance storage.'));
    }
  }
});

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

// Store compliance document
router.post('/documents', upload.single('document'), async (req, res) => {
  try {
    const documentData = {
      name: req.body.name,
      type: req.body.type,
      category: req.body.category,
      employee_id: req.body.employee_id,
      candidate_id: req.body.candidate_id,
      original_filename: req.file ? req.file.originalname : req.body.original_filename,
      file_size: req.file ? req.file.size : req.body.file_size,
      mime_type: req.file ? req.file.mimetype : req.body.mime_type,
      content: req.file ? req.file.buffer : req.body.content,
      uploaded_by: req.body.uploaded_by,
      classification: req.body.classification,
      retention_policy_id: req.body.retention_policy_id,
      authorized_roles: req.body.authorized_roles ? JSON.parse(req.body.authorized_roles) : undefined,
      authorized_users: req.body.authorized_users ? JSON.parse(req.body.authorized_users) : undefined,
      access_level: req.body.access_level,
      compliance_tags: req.body.compliance_tags ? JSON.parse(req.body.compliance_tags) : undefined,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
      trigger_date: req.body.trigger_date
    };

    // Validate required fields
    if (!documentData.name || !documentData.type || !documentData.category) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, category'
      });
    }

    if (!documentData.content && !req.file) {
      return res.status(400).json({
        error: 'Document content or file is required'
      });
    }

    // Read file content if uploaded
    if (req.file) {
      const fs = require('fs').promises;
      documentData.content = await fs.readFile(req.file.path);
    }

    const result = await complianceService.storeDocument(documentData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error storing compliance document:', error);
    res.status(500).json({ error: 'Failed to store compliance document' });
  }
});

// Retrieve compliance document
router.get('/documents/:documentId', async (req, res) => {
  try {
    const requestData = {
      user_id: req.body.user_id || req.query.user_id,
      user_role: req.body.user_role || req.query.user_role,
      access_method: 'api_download'
    };

    // Validate access credentials
    if (!requestData.user_id || !requestData.user_role) {
      return res.status(400).json({
        error: 'User ID and role are required for document access'
      });
    }

    const result = await complianceService.retrieveDocument(req.params.documentId, requestData);
    
    if (result.success) {
      // In production, this would handle secure file streaming
      res.json({
        success: true,
        document: {
          ...result.document,
          content: undefined // Don't include content in JSON response
        },
        download_available: true,
        access_logged: true
      });
    } else {
      if (result.error === 'Access denied') {
        res.status(403).json(result);
      } else if (result.error === 'Document not found') {
        res.status(404).json(result);
      } else {
        res.status(400).json(result);
      }
    }
  } catch (error) {
    console.error('Error retrieving compliance document:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance document' });
  }
});

// Delete compliance document
router.delete('/documents/:documentId', async (req, res) => {
  try {
    const deletionData = {
      deleted_by: req.body.deleted_by,
      reason: req.body.reason,
      force_delete: req.body.force_delete || false
    };

    // Validate required fields
    if (!deletionData.deleted_by || !deletionData.reason) {
      return res.status(400).json({
        error: 'Missing required fields: deleted_by, reason'
      });
    }

    const result = await complianceService.deleteDocument(req.params.documentId, deletionData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting compliance document:', error);
    res.status(500).json({ error: 'Failed to delete compliance document' });
  }
});

// Get all compliance documents
router.get('/documents', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      classification: req.query.classification,
      employee_id: req.query.employee_id,
      type: req.query.type
    };

    const result = await complianceService.getAllDocuments(filters);
    
    if (result.success) {
      // Remove content from response for performance
      const documentsWithoutContent = result.documents.map(doc => ({
        ...doc,
        content: undefined
      }));

      res.json({
        success: true,
        documents: documentsWithoutContent,
        count: result.count
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error fetching compliance documents:', error);
    res.status(500).json({ error: 'Failed to fetch compliance documents' });
  }
});

// ============================================================================
// COMPLIANCE CHECKING
// ============================================================================

// Run compliance check
router.post('/checks', async (req, res) => {
  try {
    const checkData = {
      type: req.body.type,
      scope: req.body.scope, // 'employee', 'department', 'organization'
      target_id: req.body.target_id,
      rules: req.body.rules, // Array of rule IDs to check
      started_by: req.body.started_by
    };

    // Validate required fields
    if (!checkData.type || !checkData.scope || !checkData.started_by) {
      return res.status(400).json({
        error: 'Missing required fields: type, scope, started_by'
      });
    }

    const validScopes = ['employee', 'department', 'organization'];
    if (!validScopes.includes(checkData.scope)) {
      return res.status(400).json({
        error: `Invalid scope. Must be one of: ${validScopes.join(', ')}`
      });
    }

    const result = await complianceService.runComplianceCheck(checkData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error running compliance check:', error);
    res.status(500).json({ error: 'Failed to run compliance check' });
  }
});

// Get compliance rules
router.get('/rules', async (req, res) => {
  try {
    const result = await complianceService.getComplianceRules();
    res.json(result);
  } catch (error) {
    console.error('Error fetching compliance rules:', error);
    res.status(500).json({ error: 'Failed to fetch compliance rules' });
  }
});

// Get retention policies
router.get('/retention-policies', async (req, res) => {
  try {
    const result = await complianceService.getRetentionPolicies();
    res.json(result);
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    res.status(500).json({ error: 'Failed to fetch retention policies' });
  }
});

// ============================================================================
// AUDIT TRAIL
// ============================================================================

// Get audit trail
router.get('/audit-trail', async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      resource_type: req.query.resource_type,
      resource_id: req.query.resource_id,
      action: req.query.action,
      severity: req.query.severity,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const result = await complianceService.getAuditTrail(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Log custom audit event
router.post('/audit-trail', async (req, res) => {
  try {
    const eventData = {
      action: req.body.action,
      resource_type: req.body.resource_type,
      resource_id: req.body.resource_id,
      user_id: req.body.user_id,
      user_role: req.body.user_role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.body.session_id,
      details: req.body.details,
      severity: req.body.severity,
      category: req.body.category,
      compliance_relevant: req.body.compliance_relevant
    };

    // Validate required fields
    if (!eventData.action || !eventData.resource_type || !eventData.user_id) {
      return res.status(400).json({
        error: 'Missing required fields: action, resource_type, user_id'
      });
    }

    const result = await complianceService.logAuditEvent(eventData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
    res.status(500).json({ error: 'Failed to log audit event' });
  }
});

// ============================================================================
// DATA RETENTION
// ============================================================================

// Process retention policies
router.post('/retention/process', async (req, res) => {
  try {
    const result = await complianceService.processRetentionPolicies();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing retention policies:', error);
    res.status(500).json({ error: 'Failed to process retention policies' });
  }
});

// Get retention status summary
router.get('/retention/status', async (req, res) => {
  try {
    const documents = await complianceService.getAllDocuments();
    
    if (documents.success) {
      const now = new Date();
      const retentionStatus = {
        total_documents: documents.count,
        permanent_retention: 0,
        eligible_for_deletion: 0,
        expiring_soon: 0,
        upcoming_deletions: []
      };

      documents.documents.forEach(doc => {
        if (!doc.retention_date) {
          retentionStatus.permanent_retention++;
        } else {
          const retentionDate = new Date(doc.retention_date);
          const daysUntilExpiry = Math.ceil((retentionDate - now) / (1000 * 60 * 60 * 24));

          if (retentionDate <= now) {
            retentionStatus.eligible_for_deletion++;
          } else if (daysUntilExpiry <= 90) {
            retentionStatus.expiring_soon++;
            retentionStatus.upcoming_deletions.push({
              document_id: doc.id,
              document_name: doc.name,
              retention_date: doc.retention_date,
              days_remaining: daysUntilExpiry
            });
          }
        }
      });

      res.json({
        success: true,
        retention_status: retentionStatus,
        generated_at: new Date().toISOString()
      });
    } else {
      res.status(400).json(documents);
    }
  } catch (error) {
    console.error('Error fetching retention status:', error);
    res.status(500).json({ error: 'Failed to fetch retention status' });
  }
});

// ============================================================================
// COMPLIANCE REPORTING
// ============================================================================

// Generate compliance report
router.post('/reports', async (req, res) => {
  try {
    const reportType = req.body.report_type;
    const filters = req.body.filters || {};

    const validReportTypes = ['document_inventory', 'audit_summary', 'retention_status', 'compliance_violations'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        error: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`
      });
    }

    const result = await complianceService.generateComplianceReport(reportType, filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// Get compliance dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [documentsResult, auditResult, retentionResult] = await Promise.all([
      complianceService.getAllDocuments(),
      complianceService.getAuditTrail({ limit: 10 }),
      complianceService.processRetentionPolicies()
    ]);

    if (documentsResult.success && auditResult.success) {
      const dashboardData = {
        document_summary: {
          total_documents: documentsResult.count,
          active_documents: documentsResult.documents.filter(d => d.status === 'active').length,
          confidential_documents: documentsResult.documents.filter(d => d.classification === 'confidential').length,
          deleted_documents: documentsResult.documents.filter(d => d.status === 'deleted').length
        },
        recent_activity: auditResult.audit_events.slice(0, 5),
        security_alerts: auditResult.audit_events.filter(e => e.severity === 'high').slice(0, 3),
        retention_summary: retentionResult.success ? {
          processed_today: retentionResult.results.deleted,
          eligible_for_deletion: retentionResult.results.eligible_for_deletion,
          total_checked: retentionResult.results.total_checked
        } : null,
        compliance_status: {
          last_check: new Date().toISOString(),
          overall_status: 'compliant', // This would be calculated based on actual checks
          pending_actions: 0 // This would be calculated based on violations
        }
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
    console.error('Error generating compliance dashboard:', error);
    res.status(500).json({ error: 'Failed to generate compliance dashboard' });
  }
});

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

// Search documents
router.get('/documents/search', async (req, res) => {
  try {
    const searchParams = {
      query: req.query.q,
      category: req.query.category,
      classification: req.query.classification,
      employee_id: req.query.employee_id,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      compliance_tags: req.query.compliance_tags
    };

    const allDocuments = await complianceService.getAllDocuments();
    
    if (allDocuments.success) {
      let filteredDocuments = allDocuments.documents;

      // Apply search filters
      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          (doc.metadata && JSON.stringify(doc.metadata).toLowerCase().includes(query))
        );
      }

      if (searchParams.category) {
        filteredDocuments = filteredDocuments.filter(doc => doc.category === searchParams.category);
      }

      if (searchParams.classification) {
        filteredDocuments = filteredDocuments.filter(doc => doc.classification === searchParams.classification);
      }

      if (searchParams.employee_id) {
        filteredDocuments = filteredDocuments.filter(doc => doc.employee_id === searchParams.employee_id);
      }

      if (searchParams.date_range) {
        filteredDocuments = filteredDocuments.filter(doc => {
          const docDate = new Date(doc.uploaded_at);
          return docDate >= new Date(searchParams.date_range.start_date) && 
                 docDate <= new Date(searchParams.date_range.end_date);
        });
      }

      if (searchParams.compliance_tags) {
        const searchTags = searchParams.compliance_tags.split(',');
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.compliance_tags && searchTags.some(tag => doc.compliance_tags.includes(tag))
        );
      }

      // Remove content from response
      const documentsWithoutContent = filteredDocuments.map(doc => ({
        ...doc,
        content: undefined
      }));

      res.json({
        success: true,
        documents: documentsWithoutContent,
        count: documentsWithoutContent.length,
        search_params: searchParams
      });
    } else {
      res.status(400).json(allDocuments);
    }
  } catch (error) {
    console.error('Error searching compliance documents:', error);
    res.status(500).json({ error: 'Failed to search compliance documents' });
  }
});

// Search audit trail
router.get('/audit-trail/search', async (req, res) => {
  try {
    const searchParams = {
      action_query: req.query.action_query,
      user_query: req.query.user_query,
      resource_query: req.query.resource_query,
      severity: req.query.severity,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined
    };

    const auditResult = await complianceService.getAuditTrail({
      ...searchParams,
      limit: 1000 // Get more results for search
    });
    
    if (auditResult.success) {
      let filteredEvents = auditResult.audit_events;

      // Apply search filters
      if (searchParams.action_query) {
        const query = searchParams.action_query.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.action.toLowerCase().includes(query)
        );
      }

      if (searchParams.user_query) {
        const query = searchParams.user_query.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.user_id.toLowerCase().includes(query)
        );
      }

      if (searchParams.resource_query) {
        const query = searchParams.resource_query.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.resource_type.toLowerCase().includes(query) ||
          (event.resource_id && event.resource_id.toLowerCase().includes(query))
        );
      }

      res.json({
        success: true,
        audit_events: filteredEvents,
        count: filteredEvents.length,
        search_params: searchParams
      });
    } else {
      res.status(400).json(auditResult);
    }
  } catch (error) {
    console.error('Error searching audit trail:', error);
    res.status(500).json({ error: 'Failed to search audit trail' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk document classification update
router.put('/documents/bulk/classification', async (req, res) => {
  try {
    const { document_ids, classification, updated_by } = req.body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return res.status(400).json({ error: 'document_ids array is required' });
    }

    const validClassifications = ['public', 'internal', 'confidential', 'restricted'];
    if (!validClassifications.includes(classification)) {
      return res.status(400).json({
        error: `Invalid classification. Must be one of: ${validClassifications.join(', ')}`
      });
    }

    const results = [];
    const errors = [];

    for (const documentId of document_ids) {
      try {
        const document = await complianceService.getDocument(documentId);
        
        if (document.success) {
          document.document.classification = classification;
          
          // Log the classification change
          await complianceService.logAuditEvent({
            action: 'document_classification_updated',
            resource_type: 'document',
            resource_id: documentId,
            user_id: updated_by,
            details: {
              old_classification: document.document.classification,
              new_classification: classification
            }
          });

          results.push({ document_id: documentId, success: true });
        } else {
          errors.push({ document_id: documentId, error: 'Document not found' });
        }
      } catch (error) {
        errors.push({ document_id: documentId, error: error.message });
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
    console.error('Error performing bulk classification update:', error);
    res.status(500).json({ error: 'Failed to perform bulk classification update' });
  }
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate document ID parameter
router.param('documentId', async (req, res, next, documentId) => {
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }
  next();
});

module.exports = router;
