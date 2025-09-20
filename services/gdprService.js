const crypto = require('crypto-js');
const winston = require('winston');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');

// Configure audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gdpr-audit.log' }),
    new winston.transports.Console()
  ]
});

class GDPRComplianceService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.dataRetentionPeriods = {
      candidates: 730, // 2 years in days
      applications: 1095, // 3 years
      interviews: 365, // 1 year
      assessments: 730, // 2 years
      communications: 365, // 1 year
      analytics: 1095 // 3 years
    };
    
    this.consentTypes = {
      DATA_PROCESSING: 'data_processing',
      MARKETING: 'marketing_communications',
      ANALYTICS: 'analytics_tracking',
      THIRD_PARTY: 'third_party_sharing',
      PROFILING: 'automated_profiling'
    };

    this.lawfulBases = {
      CONSENT: 'consent',
      CONTRACT: 'contract',
      LEGAL_OBLIGATION: 'legal_obligation',
      VITAL_INTERESTS: 'vital_interests',
      PUBLIC_TASK: 'public_task',
      LEGITIMATE_INTERESTS: 'legitimate_interests'
    };
  }

  // Data encryption utilities
  encryptData(data) {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }
      return crypto.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      auditLogger.error('Failed to encrypt data', { error: error.message });
      throw new Error('Encryption failed');
    }
  }

  decryptData(encryptedData) {
    try {
      const bytes = crypto.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedData = bytes.toString(crypto.enc.Utf8);
      
      try {
        return JSON.parse(decryptedData);
      } catch {
        return decryptedData;
      }
    } catch (error) {
      auditLogger.error('Failed to decrypt data', { error: error.message });
      throw new Error('Decryption failed');
    }
  }

  // Pseudonymization
  pseudonymizeData(data, fields = []) {
    const pseudonymized = { ...data };
    
    fields.forEach(field => {
      if (pseudonymized[field]) {
        pseudonymized[field] = this.generatePseudonym(pseudonymized[field]);
      }
    });

    return pseudonymized;
  }

  generatePseudonym(originalValue) {
    return crypto.SHA256(originalValue + this.encryptionKey).toString();
  }

  // Consent Management
  async recordConsent(userId, consentData) {
    try {
      const consent = {
        id: this.generateId(),
        userId,
        consentType: consentData.type,
        lawfulBasis: consentData.lawfulBasis || this.lawfulBases.CONSENT,
        purpose: consentData.purpose,
        dataCategories: consentData.dataCategories || [],
        granted: consentData.granted,
        grantedAt: consentData.granted ? new Date().toISOString() : null,
        withdrawnAt: !consentData.granted ? new Date().toISOString() : null,
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent,
        source: consentData.source || 'web_form',
        version: consentData.version || '1.0',
        expiresAt: consentData.expiresAt,
        createdAt: new Date().toISOString()
      };

      // Log consent action
      auditLogger.info('Consent recorded', {
        userId,
        consentType: consent.consentType,
        granted: consent.granted,
        source: consent.source,
        timestamp: consent.createdAt
      });

      return consent;
    } catch (error) {
      auditLogger.error('Failed to record consent', { userId, error: error.message });
      throw error;
    }
  }

  async withdrawConsent(userId, consentType) {
    try {
      const withdrawal = {
        userId,
        consentType,
        withdrawnAt: new Date().toISOString(),
        reason: 'user_request'
      };

      // Log consent withdrawal
      auditLogger.info('Consent withdrawn', {
        userId,
        consentType,
        withdrawnAt: withdrawal.withdrawnAt
      });

      // Trigger data processing changes based on withdrawal
      await this.handleConsentWithdrawal(userId, consentType);

      return withdrawal;
    } catch (error) {
      auditLogger.error('Failed to withdraw consent', { userId, consentType, error: error.message });
      throw error;
    }
  }

  async handleConsentWithdrawal(userId, consentType) {
    // Implementation would update data processing based on consent withdrawal
    switch (consentType) {
      case this.consentTypes.MARKETING:
        // Stop marketing communications
        await this.stopMarketingCommunications(userId);
        break;
      case this.consentTypes.ANALYTICS:
        // Stop analytics tracking
        await this.stopAnalyticsTracking(userId);
        break;
      case this.consentTypes.PROFILING:
        // Stop automated profiling
        await this.stopAutomatedProfiling(userId);
        break;
    }
  }

  // Data Subject Rights (GDPR Articles 15-22)
  
  // Right of Access (Article 15)
  async generateDataExport(userId) {
    try {
      auditLogger.info('Data export requested', { userId });

      const exportData = {
        exportId: this.generateId(),
        userId,
        exportedAt: new Date().toISOString(),
        data: {
          personalData: await this.getPersonalData(userId),
          applications: await this.getApplicationData(userId),
          communications: await this.getCommunicationData(userId),
          assessments: await this.getAssessmentData(userId),
          consents: await this.getConsentData(userId),
          processingActivities: await this.getProcessingActivities(userId)
        },
        metadata: {
          dataCategories: this.getDataCategories(),
          retentionPeriods: this.dataRetentionPeriods,
          lawfulBases: await this.getLawfulBases(userId),
          recipients: this.getDataRecipients(),
          transfers: this.getInternationalTransfers()
        }
      };

      // Create export file
      const exportPath = await this.createExportFile(exportData);
      
      auditLogger.info('Data export generated', { 
        userId, 
        exportId: exportData.exportId,
        exportPath 
      });

      return {
        exportId: exportData.exportId,
        downloadUrl: `/api/gdpr/export/${exportData.exportId}`,
        expiresAt: moment().add(30, 'days').toISOString()
      };
    } catch (error) {
      auditLogger.error('Failed to generate data export', { userId, error: error.message });
      throw error;
    }
  }

  // Right to Rectification (Article 16)
  async rectifyData(userId, updates, requestReason) {
    try {
      auditLogger.info('Data rectification requested', { 
        userId, 
        fields: Object.keys(updates),
        reason: requestReason 
      });

      const rectification = {
        id: this.generateId(),
        userId,
        updates,
        requestedAt: new Date().toISOString(),
        reason: requestReason,
        status: 'pending'
      };

      // Validate updates
      const validatedUpdates = await this.validateRectificationRequest(userId, updates);
      
      if (validatedUpdates.valid) {
        // Apply updates
        await this.applyDataUpdates(userId, validatedUpdates.data);
        rectification.status = 'completed';
        rectification.completedAt = new Date().toISOString();
      } else {
        rectification.status = 'rejected';
        rectification.rejectionReason = validatedUpdates.reason;
      }

      auditLogger.info('Data rectification processed', {
        userId,
        rectificationId: rectification.id,
        status: rectification.status
      });

      return rectification;
    } catch (error) {
      auditLogger.error('Failed to process rectification request', { userId, error: error.message });
      throw error;
    }
  }

  // Right to Erasure (Article 17)
  async eraseData(userId, erasureReason, specificData = null) {
    try {
      auditLogger.info('Data erasure requested', { 
        userId, 
        reason: erasureReason,
        specificData: specificData ? Object.keys(specificData) : 'all'
      });

      const erasure = {
        id: this.generateId(),
        userId,
        reason: erasureReason,
        requestedAt: new Date().toISOString(),
        specificData,
        status: 'pending'
      };

      // Check if erasure is permitted
      const canErase = await this.validateErasureRequest(userId, erasureReason);
      
      if (canErase.permitted) {
        if (specificData) {
          // Selective erasure
          await this.eraseSpecificData(userId, specificData);
        } else {
          // Complete erasure
          await this.eraseAllUserData(userId);
        }
        
        erasure.status = 'completed';
        erasure.completedAt = new Date().toISOString();
        erasure.erasedData = specificData || 'all_user_data';
      } else {
        erasure.status = 'rejected';
        erasure.rejectionReason = canErase.reason;
      }

      auditLogger.info('Data erasure processed', {
        userId,
        erasureId: erasure.id,
        status: erasure.status
      });

      return erasure;
    } catch (error) {
      auditLogger.error('Failed to process erasure request', { userId, error: error.message });
      throw error;
    }
  }

  // Right to Restrict Processing (Article 18)
  async restrictProcessing(userId, restrictionReason) {
    try {
      const restriction = {
        id: this.generateId(),
        userId,
        reason: restrictionReason,
        restrictedAt: new Date().toISOString(),
        status: 'active'
      };

      // Apply processing restrictions
      await this.applyProcessingRestrictions(userId, restrictionReason);

      auditLogger.info('Processing restriction applied', {
        userId,
        restrictionId: restriction.id,
        reason: restrictionReason
      });

      return restriction;
    } catch (error) {
      auditLogger.error('Failed to apply processing restriction', { userId, error: error.message });
      throw error;
    }
  }

  // Right to Data Portability (Article 20)
  async generatePortabilityExport(userId, format = 'json') {
    try {
      auditLogger.info('Data portability export requested', { userId, format });

      const portableData = {
        personalData: await this.getPortablePersonalData(userId),
        providedData: await this.getUserProvidedData(userId),
        generatedData: await this.getUserGeneratedData(userId)
      };

      const exportFile = await this.createPortabilityFile(portableData, format);

      auditLogger.info('Data portability export generated', { userId, format });

      return {
        downloadUrl: `/api/gdpr/portability/${exportFile.id}`,
        format,
        size: exportFile.size,
        expiresAt: moment().add(30, 'days').toISOString()
      };
    } catch (error) {
      auditLogger.error('Failed to generate portability export', { userId, error: error.message });
      throw error;
    }
  }

  // Data Retention Management
  async performDataRetentionCleanup() {
    try {
      auditLogger.info('Starting data retention cleanup');

      const cleanupResults = {};

      for (const [dataType, retentionDays] of Object.entries(this.dataRetentionPeriods)) {
        const cutoffDate = moment().subtract(retentionDays, 'days').toISOString();
        const deletedCount = await this.deleteExpiredData(dataType, cutoffDate);
        
        cleanupResults[dataType] = {
          deletedRecords: deletedCount,
          cutoffDate,
          retentionPeriod: `${retentionDays} days`
        };
      }

      auditLogger.info('Data retention cleanup completed', { results: cleanupResults });

      return cleanupResults;
    } catch (error) {
      auditLogger.error('Failed to perform data retention cleanup', { error: error.message });
      throw error;
    }
  }

  // Privacy Impact Assessment
  async generatePrivacyImpactAssessment(processingActivity) {
    try {
      const pia = {
        id: this.generateId(),
        processingActivity,
        assessedAt: new Date().toISOString(),
        riskLevel: 'medium', // This would be calculated based on various factors
        dataTypes: this.analyzeDataTypes(processingActivity),
        riskFactors: this.identifyRiskFactors(processingActivity),
        safeguards: this.recommendSafeguards(processingActivity),
        recommendations: this.generatePIARecommendations(processingActivity)
      };

      auditLogger.info('Privacy Impact Assessment generated', {
        piaId: pia.id,
        processingActivity: processingActivity.name,
        riskLevel: pia.riskLevel
      });

      return pia;
    } catch (error) {
      auditLogger.error('Failed to generate PIA', { error: error.message });
      throw error;
    }
  }

  // Utility methods for data operations
  async getPersonalData(userId) {
    // Mock implementation - would fetch from database
    return {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890',
      address: '123 Main St, City, Country'
    };
  }

  async createExportFile(exportData) {
    const filename = `data_export_${exportData.exportId}_${Date.now()}.json`;
    const filepath = path.join(__dirname, '../tmp/exports', filename);
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    
    return filepath;
  }

  async validateErasureRequest(userId, reason) {
    // Check if erasure is permitted based on legal grounds
    const restrictions = {
      active_legal_proceedings: false,
      tax_obligations: false,
      contract_performance: false
    };

    const hasRestrictions = Object.values(restrictions).some(restriction => restriction);

    return {
      permitted: !hasRestrictions,
      reason: hasRestrictions ? 'Legal obligations prevent erasure' : null
    };
  }

  async deleteExpiredData(dataType, cutoffDate) {
    // Mock implementation - would delete from database
    auditLogger.info(`Deleting expired ${dataType} data before ${cutoffDate}`);
    return Math.floor(Math.random() * 100); // Mock deletion count
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getDataCategories() {
    return [
      'Identity data',
      'Contact data',
      'Profile data',
      'Usage data',
      'Marketing data',
      'Communications data',
      'Technical data'
    ];
  }

  async getLawfulBases(userId) {
    return [
      {
        category: 'Personal data',
        lawfulBasis: this.lawfulBases.LEGITIMATE_INTERESTS,
        purpose: 'Recruitment process management'
      },
      {
        category: 'Marketing data',
        lawfulBasis: this.lawfulBases.CONSENT,
        purpose: 'Job opportunity notifications'
      }
    ];
  }

  getDataRecipients() {
    return [
      'HR Team',
      'Hiring Managers',
      'IT Support (limited access)',
      'Third-party assessment providers'
    ];
  }

  getInternationalTransfers() {
    return [
      {
        country: 'United States',
        safeguards: 'Standard Contractual Clauses',
        purpose: 'Cloud hosting services'
      }
    ];
  }

  // Placeholder methods for missing implementations
  async stopMarketingCommunications(userId) {
    auditLogger.info('Marketing communications stopped', { userId });
  }

  async stopAnalyticsTracking(userId) {
    auditLogger.info('Analytics tracking stopped', { userId });
  }

  async stopAutomatedProfiling(userId) {
    auditLogger.info('Automated profiling stopped', { userId });
  }

  async getApplicationData(userId) { return {}; }
  async getCommunicationData(userId) { return {}; }
  async getAssessmentData(userId) { return {}; }
  async getConsentData(userId) { return {}; }
  async getProcessingActivities(userId) { return {}; }
  async validateRectificationRequest(userId, updates) { return { valid: true, data: updates }; }
  async applyDataUpdates(userId, updates) { auditLogger.info('Data updated', { userId }); }
  async eraseSpecificData(userId, data) { auditLogger.info('Specific data erased', { userId }); }
  async eraseAllUserData(userId) { auditLogger.info('All user data erased', { userId }); }
  async applyProcessingRestrictions(userId, reason) { auditLogger.info('Processing restricted', { userId, reason }); }
  async getPortablePersonalData(userId) { return {}; }
  async getUserProvidedData(userId) { return {}; }
  async getUserGeneratedData(userId) { return {}; }
  async createPortabilityFile(data, format) { return { id: this.generateId(), size: 1024 }; }

  analyzeDataTypes(activity) { return ['personal', 'behavioral']; }
  identifyRiskFactors(activity) { return ['automated_decision_making']; }
  recommendSafeguards(activity) { return ['encryption', 'access_controls']; }
  generatePIARecommendations(activity) { return ['Regular review', 'Enhanced monitoring']; }
}

module.exports = new GDPRComplianceService();
