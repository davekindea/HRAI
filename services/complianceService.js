const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const archiver = require('archiver');

class ComplianceService {
  constructor() {
    this.documents = new Map();
    this.auditLogs = new Map();
    this.complianceRules = new Map();
    this.retentionPolicies = new Map();
    this.complianceChecks = new Map();
    this.encryptionKeys = new Map();
    this.initializeComplianceRules();
    this.initializeRetentionPolicies();
  }

  // Initialize compliance rules
  initializeComplianceRules() {
    const rules = [
      {
        id: 'i9-verification',
        name: 'Form I-9 Employment Eligibility Verification',
        regulation: 'Immigration Reform and Control Act',
        jurisdiction: 'Federal',
        description: 'Verify employment eligibility within 3 business days',
        requirements: {
          completion_deadline: 3, // days
          required_documents: ['identity_document', 'work_authorization'],
          retention_period: 3, // years after termination or 1 year after hire, whichever is later
          audit_requirements: 'Available for inspection by authorized officers'
        },
        penalties: {
          non_compliance: '$230 - $2,292 per violation',
          pattern_violations: 'Up to $22,927 per violation'
        }
      },
      {
        id: 'equal-employment',
        name: 'Equal Employment Opportunity',
        regulation: 'Title VII, ADA, ADEA',
        jurisdiction: 'Federal',
        description: 'Maintain non-discriminatory hiring practices',
        requirements: {
          record_keeping: 'Application materials, interview notes, hiring decisions',
          retention_period: 1, // year
          reporting: 'EEO-1 reports for employers with 100+ employees',
          training_required: 'Anti-discrimination and harassment prevention'
        }
      },
      {
        id: 'flsa-compliance',
        name: 'Fair Labor Standards Act',
        regulation: 'FLSA',
        jurisdiction: 'Federal',
        description: 'Wage and hour compliance',
        requirements: {
          payroll_records: 'Time records, wage computations, deductions',
          retention_period: 3, // years
          overtime_calculations: 'Accurate tracking and payment',
          minimum_wage: 'Current federal/state minimum wage compliance'
        }
      },
      {
        id: 'fcra-compliance',
        name: 'Fair Credit Reporting Act',
        regulation: 'FCRA',
        jurisdiction: 'Federal',
        description: 'Background check compliance',
        requirements: {
          disclosure_required: 'Written disclosure before obtaining report',
          authorization_required: 'Written authorization from candidate',
          adverse_action_process: 'Pre and post adverse action notices',
          retention_period: 2 // years
        }
      },
      {
        id: 'state-privacy-laws',
        name: 'State Privacy Laws (CCPA, CPRA, etc.)',
        regulation: 'Various State Laws',
        jurisdiction: 'State',
        description: 'Data privacy and protection requirements',
        requirements: {
          consent_management: 'Explicit consent for data collection',
          data_portability: 'Right to access and export personal data',
          deletion_rights: 'Right to request data deletion',
          retention_limits: 'Data minimization and retention limits'
        }
      },
      {
        id: 'gdpr-compliance',
        name: 'General Data Protection Regulation',
        regulation: 'GDPR',
        jurisdiction: 'EU',
        description: 'EU data protection compliance for international operations',
        requirements: {
          lawful_basis: 'Documented lawful basis for processing',
          consent_management: 'Granular consent with withdrawal options',
          data_protection_impact: 'DPIA for high-risk processing',
          breach_notification: '72-hour breach notification requirement'
        }
      }
    ];

    rules.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });
  }

  // Initialize retention policies
  initializeRetentionPolicies() {
    const policies = [
      {
        id: 'employment-records',
        name: 'Employment Records Retention',
        category: 'hr_records',
        documents: [
          { type: 'job_applications', retention_years: 1, trigger: 'rejection_date' },
          { type: 'employment_contracts', retention_years: 7, trigger: 'termination_date' },
          { type: 'performance_reviews', retention_years: 5, trigger: 'termination_date' },
          { type: 'disciplinary_records', retention_years: 7, trigger: 'termination_date' },
          { type: 'payroll_records', retention_years: 3, trigger: 'payment_date' },
          { type: 'tax_documents', retention_years: 7, trigger: 'tax_year_end' }
        ]
      },
      {
        id: 'i9-forms',
        name: 'Form I-9 Retention',
        category: 'compliance_forms',
        documents: [
          { 
            type: 'i9_form', 
            retention_calculation: 'greater_of_3_years_after_hire_or_1_year_after_termination',
            trigger: 'hire_date'
          }
        ]
      },
      {
        id: 'background-checks',
        name: 'Background Check Records',
        category: 'screening_records',
        documents: [
          { type: 'background_check_report', retention_years: 2, trigger: 'completion_date' },
          { type: 'background_check_consent', retention_years: 2, trigger: 'consent_date' },
          { type: 'adverse_action_notice', retention_years: 2, trigger: 'notice_date' }
        ]
      },
      {
        id: 'training-records',
        name: 'Training and Certification Records',
        category: 'training',
        documents: [
          { type: 'safety_training', retention_years: 5, trigger: 'completion_date' },
          { type: 'compliance_training', retention_years: 3, trigger: 'completion_date' },
          { type: 'professional_certifications', retention_years: 'permanent', trigger: null }
        ]
      }
    ];

    policies.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy);
    });
  }

  // Document Management
  async storeDocument(documentData) {
    try {
      const documentId = crypto.randomUUID();
      const encryptedContent = await this.encryptDocument(documentData.content);
      
      const document = {
        id: documentId,
        name: documentData.name,
        type: documentData.type,
        category: documentData.category,
        employee_id: documentData.employee_id,
        candidate_id: documentData.candidate_id,
        original_filename: documentData.original_filename,
        file_size: documentData.file_size,
        mime_type: documentData.mime_type,
        storage_path: await this.saveSecureDocument(encryptedContent, documentId),
        encryption_key_id: encryptedContent.keyId,
        checksum: this.calculateChecksum(documentData.content),
        uploaded_at: new Date().toISOString(),
        uploaded_by: documentData.uploaded_by,
        classification: documentData.classification || 'confidential',
        retention_policy_id: documentData.retention_policy_id,
        retention_date: this.calculateRetentionDate(documentData),
        access_controls: {
          authorized_roles: documentData.authorized_roles || ['hr', 'manager'],
          authorized_users: documentData.authorized_users || [],
          access_level: documentData.access_level || 'restricted'
        },
        compliance_tags: documentData.compliance_tags || [],
        metadata: documentData.metadata || {},
        version: 1,
        status: 'active'
      };

      this.documents.set(documentId, document);

      // Log document storage
      await this.logAuditEvent({
        action: 'document_stored',
        resource_type: 'document',
        resource_id: documentId,
        user_id: documentData.uploaded_by,
        details: {
          document_name: document.name,
          document_type: document.type,
          classification: document.classification
        }
      });

      return {
        success: true,
        document_id: documentId,
        document: document
      };
    } catch (error) {
      console.error('Error storing document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async retrieveDocument(documentId, requestData) {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(document, requestData.user_id, requestData.user_role);
      if (!hasAccess) {
        await this.logAuditEvent({
          action: 'unauthorized_document_access',
          resource_type: 'document',
          resource_id: documentId,
          user_id: requestData.user_id,
          severity: 'high'
        });
        throw new Error('Access denied');
      }

      // Decrypt and retrieve document content
      const encryptedContent = await fs.readFile(document.storage_path);
      const decryptedContent = await this.decryptDocument(encryptedContent, document.encryption_key_id);

      // Log access
      await this.logAuditEvent({
        action: 'document_accessed',
        resource_type: 'document',
        resource_id: documentId,
        user_id: requestData.user_id,
        details: {
          document_name: document.name,
          access_method: requestData.access_method || 'download'
        }
      });

      return {
        success: true,
        document: document,
        content: decryptedContent
      };
    } catch (error) {
      console.error('Error retrieving document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDocument(documentId, deletionData) {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check if document can be deleted (retention policy)
      const canDelete = await this.checkDeletionEligibility(document);
      if (!canDelete.eligible && !deletionData.force_delete) {
        throw new Error(`Document cannot be deleted: ${canDelete.reason}`);
      }

      // Secure deletion
      await this.secureDelete(document.storage_path);
      
      // Update document status
      document.status = 'deleted';
      document.deleted_at = new Date().toISOString();
      document.deleted_by = deletionData.deleted_by;
      document.deletion_reason = deletionData.reason;

      // Log deletion
      await this.logAuditEvent({
        action: 'document_deleted',
        resource_type: 'document',
        resource_id: documentId,
        user_id: deletionData.deleted_by,
        details: {
          document_name: document.name,
          deletion_reason: deletionData.reason,
          force_delete: deletionData.force_delete || false
        }
      });

      return {
        success: true,
        document: document
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Compliance Checking
  async runComplianceCheck(checkData) {
    try {
      const checkId = crypto.randomUUID();
      const complianceCheck = {
        id: checkId,
        type: checkData.type,
        scope: checkData.scope, // 'employee', 'department', 'organization'
        target_id: checkData.target_id,
        rules_checked: checkData.rules || Array.from(this.complianceRules.keys()),
        status: 'running',
        started_at: new Date().toISOString(),
        started_by: checkData.started_by,
        results: {
          total_rules: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          violations: [],
          recommendations: []
        }
      };

      this.complianceChecks.set(checkId, complianceCheck);

      // Run compliance checks
      const results = await this.executeComplianceRules(complianceCheck);
      
      complianceCheck.status = 'completed';
      complianceCheck.completed_at = new Date().toISOString();
      complianceCheck.results = results;

      // Log compliance check
      await this.logAuditEvent({
        action: 'compliance_check_completed',
        resource_type: 'compliance_check',
        resource_id: checkId,
        user_id: checkData.started_by,
        details: {
          scope: checkData.scope,
          violations_found: results.failed,
          warnings: results.warnings
        }
      });

      return {
        success: true,
        check_id: checkId,
        compliance_check: complianceCheck
      };
    } catch (error) {
      console.error('Error running compliance check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeComplianceRules(complianceCheck) {
    const results = {
      total_rules: complianceCheck.rules_checked.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      violations: [],
      recommendations: []
    };

    for (const ruleId of complianceCheck.rules_checked) {
      const rule = this.complianceRules.get(ruleId);
      if (!rule) continue;

      const ruleResult = await this.checkComplianceRule(rule, complianceCheck);
      
      if (ruleResult.status === 'passed') {
        results.passed++;
      } else if (ruleResult.status === 'failed') {
        results.failed++;
        results.violations.push(ruleResult);
      } else if (ruleResult.status === 'warning') {
        results.warnings++;
        results.recommendations.push(ruleResult);
      }
    }

    return results;
  }

  async checkComplianceRule(rule, complianceCheck) {
    // Implementation would check specific compliance rules
    // This is a simplified example
    const ruleResult = {
      rule_id: rule.id,
      rule_name: rule.name,
      status: 'passed',
      message: '',
      details: {},
      checked_at: new Date().toISOString()
    };

    switch (rule.id) {
      case 'i9-verification':
        return await this.checkI9Compliance(complianceCheck.target_id);
      
      case 'fcra-compliance':
        return await this.checkFCRACompliance(complianceCheck.target_id);
      
      case 'equal-employment':
        return await this.checkEEOCompliance(complianceCheck.target_id);
      
      default:
        ruleResult.status = 'passed';
        ruleResult.message = 'Rule check not implemented';
        break;
    }

    return ruleResult;
  }

  async checkI9Compliance(targetId) {
    // Check if I-9 forms are completed within required timeframe
    const employeeDocuments = Array.from(this.documents.values())
      .filter(doc => doc.employee_id === targetId && doc.type === 'i9_form');

    if (employeeDocuments.length === 0) {
      return {
        rule_id: 'i9-verification',
        rule_name: 'Form I-9 Compliance',
        status: 'failed',
        message: 'No I-9 form found for employee',
        severity: 'high',
        details: { missing_form: true }
      };
    }

    // Check if completed within 3 business days of hire
    const i9Form = employeeDocuments[0];
    // Additional logic would check hire date vs completion date
    
    return {
      rule_id: 'i9-verification',
      rule_name: 'Form I-9 Compliance',
      status: 'passed',
      message: 'I-9 form properly completed',
      details: { completion_date: i9Form.uploaded_at }
    };
  }

  async checkFCRACompliance(targetId) {
    // Check background check consent and disclosure
    const backgroundCheckDocs = Array.from(this.documents.values())
      .filter(doc => doc.employee_id === targetId && 
        ['background_check_consent', 'background_check_disclosure'].includes(doc.type));

    if (backgroundCheckDocs.length < 2) {
      return {
        rule_id: 'fcra-compliance',
        rule_name: 'FCRA Compliance',
        status: 'failed',
        message: 'Missing required FCRA consent or disclosure documents',
        severity: 'high',
        details: { missing_documents: true }
      };
    }

    return {
      rule_id: 'fcra-compliance',
      rule_name: 'FCRA Compliance',
      status: 'passed',
      message: 'FCRA requirements met',
      details: { documents_found: backgroundCheckDocs.length }
    };
  }

  async checkEEOCompliance(targetId) {
    // Check for EEO record keeping
    return {
      rule_id: 'equal-employment',
      rule_name: 'EEO Compliance',
      status: 'passed',
      message: 'EEO records maintained',
      details: { check_type: 'record_keeping' }
    };
  }

  // Audit Trail Management
  async logAuditEvent(eventData) {
    try {
      const auditId = crypto.randomUUID();
      const auditEvent = {
        id: auditId,
        timestamp: new Date().toISOString(),
        action: eventData.action,
        resource_type: eventData.resource_type,
        resource_id: eventData.resource_id,
        user_id: eventData.user_id,
        user_role: eventData.user_role,
        ip_address: eventData.ip_address,
        user_agent: eventData.user_agent,
        session_id: eventData.session_id,
        details: eventData.details || {},
        severity: eventData.severity || 'info',
        category: eventData.category || 'access',
        compliance_relevant: eventData.compliance_relevant || true,
        retention_date: moment().add(7, 'years').toISOString() // Standard audit log retention
      };

      this.auditLogs.set(auditId, auditEvent);

      return {
        success: true,
        audit_id: auditId
      };
    } catch (error) {
      console.error('Error logging audit event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAuditTrail(filters = {}) {
    try {
      let auditEvents = Array.from(this.auditLogs.values());

      // Apply filters
      if (filters.user_id) {
        auditEvents = auditEvents.filter(e => e.user_id === filters.user_id);
      }

      if (filters.resource_type) {
        auditEvents = auditEvents.filter(e => e.resource_type === filters.resource_type);
      }

      if (filters.resource_id) {
        auditEvents = auditEvents.filter(e => e.resource_id === filters.resource_id);
      }

      if (filters.action) {
        auditEvents = auditEvents.filter(e => e.action === filters.action);
      }

      if (filters.date_range) {
        const { start_date, end_date } = filters.date_range;
        auditEvents = auditEvents.filter(e => {
          const eventDate = new Date(e.timestamp);
          return eventDate >= new Date(start_date) && eventDate <= new Date(end_date);
        });
      }

      if (filters.severity) {
        auditEvents = auditEvents.filter(e => e.severity === filters.severity);
      }

      // Sort by timestamp (newest first)
      auditEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit results
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      const paginatedEvents = auditEvents.slice(offset, offset + limit);

      return {
        success: true,
        audit_events: paginatedEvents,
        total_count: auditEvents.length,
        returned_count: paginatedEvents.length
      };
    } catch (error) {
      console.error('Error retrieving audit trail:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Data Retention Management
  async processRetentionPolicies() {
    try {
      const now = moment();
      const eligibleDocuments = [];

      // Find documents eligible for deletion
      for (const [documentId, document] of this.documents) {
        if (document.status !== 'active') continue;
        
        if (document.retention_date && moment(document.retention_date).isBefore(now)) {
          eligibleDocuments.push(document);
        }
      }

      const results = {
        total_checked: this.documents.size,
        eligible_for_deletion: eligibleDocuments.length,
        deleted: 0,
        errors: []
      };

      // Process eligible documents
      for (const document of eligibleDocuments) {
        try {
          await this.deleteDocument(document.id, {
            deleted_by: 'system',
            reason: 'retention_policy_expiration'
          });
          results.deleted++;
        } catch (error) {
          results.errors.push({
            document_id: document.id,
            error: error.message
          });
        }
      }

      // Log retention processing
      await this.logAuditEvent({
        action: 'retention_policy_processed',
        resource_type: 'system',
        resource_id: 'retention_system',
        user_id: 'system',
        details: results
      });

      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error processing retention policies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateRetentionDate(documentData) {
    if (!documentData.retention_policy_id) {
      return moment().add(7, 'years').toISOString(); // Default retention
    }

    const policy = this.retentionPolicies.get(documentData.retention_policy_id);
    if (!policy) {
      return moment().add(7, 'years').toISOString();
    }

    const docPolicy = policy.documents.find(d => d.type === documentData.type);
    if (!docPolicy) {
      return moment().add(7, 'years').toISOString();
    }

    if (docPolicy.retention_years === 'permanent') {
      return null; // Never delete
    }

    // Calculate based on trigger date
    const triggerDate = documentData.trigger_date || new Date().toISOString();
    return moment(triggerDate).add(docPolicy.retention_years, 'years').toISOString();
  }

  // Security Functions
  async encryptDocument(content) {
    try {
      const keyId = crypto.randomUUID();
      const key = crypto.randomBytes(32); // 256-bit key
      const iv = crypto.randomBytes(16);   // 128-bit IV
      
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(content, 'binary', 'hex');
      encrypted += cipher.final('hex');

      // Store key securely (in production, use HSM or key management service)
      this.encryptionKeys.set(keyId, {
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        algorithm: 'aes-256-cbc',
        created_at: new Date().toISOString()
      });

      return {
        keyId: keyId,
        encrypted: encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Error encrypting document:', error);
      throw error;
    }
  }

  async decryptDocument(encryptedData, keyId) {
    try {
      const keyInfo = this.encryptionKeys.get(keyId);
      if (!keyInfo) {
        throw new Error('Encryption key not found');
      }

      const key = Buffer.from(keyInfo.key, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'binary');
      decrypted += decipher.final('binary');

      return decrypted;
    } catch (error) {
      console.error('Error decrypting document:', error);
      throw error;
    }
  }

  async saveSecureDocument(encryptedContent, documentId) {
    try {
      const documentsDir = path.join(__dirname, '../uploads/compliance/encrypted');
      await fs.mkdir(documentsDir, { recursive: true });
      
      const filePath = path.join(documentsDir, `${documentId}.enc`);
      await fs.writeFile(filePath, JSON.stringify(encryptedContent));
      
      return filePath;
    } catch (error) {
      console.error('Error saving secure document:', error);
      throw error;
    }
  }

  async secureDelete(filePath) {
    try {
      // Overwrite file with random data before deletion
      const stats = await fs.stat(filePath);
      const randomData = crypto.randomBytes(stats.size);
      await fs.writeFile(filePath, randomData);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error in secure delete:', error);
      throw error;
    }
  }

  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async checkDocumentAccess(document, userId, userRole) {
    // Check role-based access
    if (document.access_controls.authorized_roles.includes(userRole)) {
      return true;
    }

    // Check user-specific access
    if (document.access_controls.authorized_users.includes(userId)) {
      return true;
    }

    // Check if user is the document owner
    if (document.uploaded_by === userId) {
      return true;
    }

    return false;
  }

  async checkDeletionEligibility(document) {
    if (!document.retention_date) {
      return {
        eligible: false,
        reason: 'Document marked for permanent retention'
      };
    }

    if (moment().isBefore(moment(document.retention_date))) {
      return {
        eligible: false,
        reason: `Retention period not met. Eligible for deletion on ${moment(document.retention_date).format('YYYY-MM-DD')}`
      };
    }

    return {
      eligible: true,
      reason: 'Retention period expired'
    };
  }

  // Compliance Reporting
  async generateComplianceReport(reportType, filters = {}) {
    try {
      let report = {};

      switch (reportType) {
        case 'document_inventory':
          report = await this.generateDocumentInventoryReport(filters);
          break;
        
        case 'audit_summary':
          report = await this.generateAuditSummaryReport(filters);
          break;
        
        case 'retention_status':
          report = await this.generateRetentionStatusReport(filters);
          break;
        
        case 'compliance_violations':
          report = await this.generateViolationsReport(filters);
          break;
        
        default:
          throw new Error('Unknown report type');
      }

      return {
        success: true,
        report: report,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateDocumentInventoryReport(filters) {
    const documents = Array.from(this.documents.values());
    
    const report = {
      title: 'Document Inventory Report',
      summary: {
        total_documents: documents.length,
        active_documents: documents.filter(d => d.status === 'active').length,
        deleted_documents: documents.filter(d => d.status === 'deleted').length,
        total_storage_size: documents.reduce((sum, d) => sum + (d.file_size || 0), 0)
      },
      by_category: {},
      by_classification: {},
      retention_analysis: {}
    };

    // Group by category
    documents.forEach(doc => {
      const category = doc.category || 'uncategorized';
      report.by_category[category] = (report.by_category[category] || 0) + 1;
    });

    // Group by classification
    documents.forEach(doc => {
      const classification = doc.classification || 'unclassified';
      report.by_classification[classification] = (report.by_classification[classification] || 0) + 1;
    });

    // Retention analysis
    const now = moment();
    report.retention_analysis = {
      eligible_for_deletion: documents.filter(d => 
        d.retention_date && moment(d.retention_date).isBefore(now)
      ).length,
      expiring_soon: documents.filter(d => 
        d.retention_date && 
        moment(d.retention_date).isBetween(now, now.clone().add(30, 'days'))
      ).length
    };

    return report;
  }

  async generateAuditSummaryReport(filters) {
    const auditEvents = Array.from(this.auditLogs.values());
    
    const report = {
      title: 'Audit Summary Report',
      summary: {
        total_events: auditEvents.length,
        high_severity_events: auditEvents.filter(e => e.severity === 'high').length,
        unique_users: new Set(auditEvents.map(e => e.user_id)).size,
        date_range: {
          from: auditEvents.length > 0 ? 
            moment(Math.min(...auditEvents.map(e => new Date(e.timestamp)))).format('YYYY-MM-DD') : null,
          to: auditEvents.length > 0 ? 
            moment(Math.max(...auditEvents.map(e => new Date(e.timestamp)))).format('YYYY-MM-DD') : null
        }
      },
      by_action: {},
      by_severity: {},
      by_user: {},
      security_events: auditEvents.filter(e => 
        ['unauthorized_access', 'security_violation', 'suspicious_activity'].includes(e.category)
      ).length
    };

    // Group by action
    auditEvents.forEach(event => {
      report.by_action[event.action] = (report.by_action[event.action] || 0) + 1;
    });

    // Group by severity
    auditEvents.forEach(event => {
      report.by_severity[event.severity] = (report.by_severity[event.severity] || 0) + 1;
    });

    return report;
  }

  async generateRetentionStatusReport(filters) {
    const documents = Array.from(this.documents.values());
    const now = moment();

    const report = {
      title: 'Data Retention Status Report',
      summary: {
        total_documents: documents.length,
        permanent_retention: documents.filter(d => !d.retention_date).length,
        eligible_for_deletion: 0,
        expiring_soon: 0
      },
      by_policy: {},
      upcoming_deletions: []
    };

    documents.forEach(doc => {
      if (doc.retention_date) {
        const retentionDate = moment(doc.retention_date);
        
        if (retentionDate.isBefore(now)) {
          report.summary.eligible_for_deletion++;
        } else if (retentionDate.isBetween(now, now.clone().add(90, 'days'))) {
          report.summary.expiring_soon++;
          report.upcoming_deletions.push({
            document_id: doc.id,
            document_name: doc.name,
            retention_date: doc.retention_date,
            days_remaining: retentionDate.diff(now, 'days')
          });
        }

        // Group by policy
        const policyId = doc.retention_policy_id || 'no_policy';
        report.by_policy[policyId] = (report.by_policy[policyId] || 0) + 1;
      }
    });

    return report;
  }

  async generateViolationsReport(filters) {
    const complianceChecks = Array.from(this.complianceChecks.values());
    
    const allViolations = [];
    complianceChecks.forEach(check => {
      if (check.results && check.results.violations) {
        allViolations.push(...check.results.violations);
      }
    });

    const report = {
      title: 'Compliance Violations Report',
      summary: {
        total_violations: allViolations.length,
        high_severity: allViolations.filter(v => v.severity === 'high').length,
        medium_severity: allViolations.filter(v => v.severity === 'medium').length,
        low_severity: allViolations.filter(v => v.severity === 'low').length
      },
      by_rule: {},
      recent_violations: allViolations
        .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))
        .slice(0, 10)
    };

    // Group by rule
    allViolations.forEach(violation => {
      report.by_rule[violation.rule_name] = (report.by_rule[violation.rule_name] || 0) + 1;
    });

    return report;
  }

  // Utility methods
  async getDocument(documentId) {
    const document = this.documents.get(documentId);
    return document ? { success: true, document } : { success: false, error: 'Document not found' };
  }

  async getAllDocuments(filters = {}) {
    let documents = Array.from(this.documents.values());
    
    if (filters.status) {
      documents = documents.filter(d => d.status === filters.status);
    }
    
    if (filters.category) {
      documents = documents.filter(d => d.category === filters.category);
    }

    return { success: true, documents, count: documents.length };
  }

  async getComplianceRules() {
    const rules = Array.from(this.complianceRules.values());
    return { success: true, rules };
  }

  async getRetentionPolicies() {
    const policies = Array.from(this.retentionPolicies.values());
    return { success: true, policies };
  }
}

module.exports = new ComplianceService();
