const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gdprService = require('../services/gdprService');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for GDPR requests to prevent abuse
const gdprRequestLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Maximum 5 requests per day per IP
  message: {
    success: false,
    message: 'Too many GDPR requests. Please try again tomorrow.'
  }
});

// Record consent
router.post('/consent',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('type').isIn(['data_processing', 'marketing_communications', 'analytics_tracking', 'third_party_sharing', 'automated_profiling'])
      .withMessage('Valid consent type is required'),
    body('granted').isBoolean().withMessage('Granted status must be a boolean'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('lawfulBasis').optional().isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'])
      .withMessage('Valid lawful basis is required'),
    body('dataCategories').optional().isArray().withMessage('Data categories must be an array'),
    body('ipAddress').optional().isIP().withMessage('Valid IP address is required'),
    body('userAgent').optional().isString().withMessage('User agent must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const consent = await gdprService.recordConsent(req.body.userId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Consent recorded successfully',
        consent: {
          id: consent.id,
          type: consent.consentType,
          granted: consent.granted,
          grantedAt: consent.grantedAt,
          withdrawnAt: consent.withdrawnAt
        }
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record consent',
        error: error.message
      });
    }
  }
);

// Withdraw consent
router.post('/consent/:userId/withdraw',
  [
    body('consentType').isIn(['data_processing', 'marketing_communications', 'analytics_tracking', 'third_party_sharing', 'automated_profiling'])
      .withMessage('Valid consent type is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { consentType } = req.body;
      
      const withdrawal = await gdprService.withdrawConsent(userId, consentType);
      
      res.json({
        success: true,
        message: 'Consent withdrawn successfully',
        withdrawal
      });
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw consent',
        error: error.message
      });
    }
  }
);

// Data export request (Right of Access - Article 15)
router.post('/export/:userId', 
  gdprRequestLimit,
  [
    body('requestReason').optional().isString().withMessage('Request reason must be a string'),
    body('requestedBy').notEmpty().withMessage('Requester information is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const exportResult = await gdprService.generateDataExport(userId);
      
      res.json({
        success: true,
        message: 'Data export request processed successfully',
        exportId: exportResult.exportId,
        downloadUrl: exportResult.downloadUrl,
        expiresAt: exportResult.expiresAt,
        note: 'Your data export will be available for download for 30 days'
      });
    } catch (error) {
      console.error('Failed to process data export request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process data export request',
        error: error.message
      });
    }
  }
);

// Download data export
router.get('/export/:exportId/download', async (req, res) => {
  try {
    const { exportId } = req.params;
    
    // Verify export exists and is not expired
    // In production, check database and file system
    const exportPath = `/path/to/exports/data_export_${exportId}.json`;
    
    res.download(exportPath, `data_export_${exportId}.json`, (err) => {
      if (err) {
        console.error('Failed to download export:', err);
        res.status(404).json({
          success: false,
          message: 'Export file not found or has expired'
        });
      }
    });
  } catch (error) {
    console.error('Failed to download data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download data export',
      error: error.message
    });
  }
});

// Data rectification request (Right to Rectification - Article 16)
router.post('/rectification/:userId',
  gdprRequestLimit,
  [
    body('updates').isObject().withMessage('Updates must be an object'),
    body('requestReason').notEmpty().withMessage('Request reason is required'),
    body('requestedBy').notEmpty().withMessage('Requester information is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { updates, requestReason } = req.body;
      
      const rectification = await gdprService.rectifyData(userId, updates, requestReason);
      
      res.json({
        success: true,
        message: 'Data rectification request processed successfully',
        rectificationId: rectification.id,
        status: rectification.status,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      console.error('Failed to process rectification request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process rectification request',
        error: error.message
      });
    }
  }
);

// Data erasure request (Right to Erasure - Article 17)
router.post('/erasure/:userId',
  gdprRequestLimit,
  [
    body('erasureReason').isIn(['consent_withdrawn', 'no_longer_necessary', 'unlawful_processing', 'legal_obligation'])
      .withMessage('Valid erasure reason is required'),
    body('specificData').optional().isObject().withMessage('Specific data must be an object'),
    body('requestedBy').notEmpty().withMessage('Requester information is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { erasureReason, specificData } = req.body;
      
      const erasure = await gdprService.eraseData(userId, erasureReason, specificData);
      
      res.json({
        success: true,
        message: 'Data erasure request processed successfully',
        erasureId: erasure.id,
        status: erasure.status,
        note: erasure.status === 'rejected' ? erasure.rejectionReason : 'Data erasure completed'
      });
    } catch (error) {
      console.error('Failed to process erasure request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process erasure request',
        error: error.message
      });
    }
  }
);

// Restrict processing request (Right to Restrict Processing - Article 18)
router.post('/restrict/:userId',
  gdprRequestLimit,
  [
    body('restrictionReason').isIn(['accuracy_contested', 'unlawful_processing', 'no_longer_needed', 'objection_pending'])
      .withMessage('Valid restriction reason is required'),
    body('requestedBy').notEmpty().withMessage('Requester information is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { restrictionReason } = req.body;
      
      const restriction = await gdprService.restrictProcessing(userId, restrictionReason);
      
      res.json({
        success: true,
        message: 'Processing restriction applied successfully',
        restrictionId: restriction.id,
        restrictedAt: restriction.restrictedAt,
        reason: restriction.reason
      });
    } catch (error) {
      console.error('Failed to apply processing restriction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply processing restriction',
        error: error.message
      });
    }
  }
);

// Data portability request (Right to Data Portability - Article 20)
router.post('/portability/:userId',
  gdprRequestLimit,
  [
    body('format').optional().isIn(['json', 'csv', 'xml']).withMessage('Valid export format is required'),
    body('requestedBy').notEmpty().withMessage('Requester information is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { format = 'json' } = req.body;
      
      const portabilityExport = await gdprService.generatePortabilityExport(userId, format);
      
      res.json({
        success: true,
        message: 'Data portability export generated successfully',
        downloadUrl: portabilityExport.downloadUrl,
        format: portabilityExport.format,
        size: portabilityExport.size,
        expiresAt: portabilityExport.expiresAt
      });
    } catch (error) {
      console.error('Failed to generate portability export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate portability export',
        error: error.message
      });
    }
  }
);

// Get user's consent status
router.get('/consent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock consent data - in production, fetch from database
    const consents = [
      {
        type: 'data_processing',
        granted: true,
        grantedAt: '2024-01-01T00:00:00Z',
        purpose: 'Recruitment process management',
        lawfulBasis: 'legitimate_interests'
      },
      {
        type: 'marketing_communications',
        granted: false,
        withdrawnAt: '2024-01-15T00:00:00Z',
        purpose: 'Job opportunity notifications',
        lawfulBasis: 'consent'
      },
      {
        type: 'analytics_tracking',
        granted: true,
        grantedAt: '2024-01-01T00:00:00Z',
        purpose: 'Platform improvement and analytics',
        lawfulBasis: 'legitimate_interests'
      }
    ];

    res.json({
      success: true,
      userId,
      consents
    });
  } catch (error) {
    console.error('Failed to get consent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get consent status',
      error: error.message
    });
  }
});

// Privacy Impact Assessment (PIA) - Admin only
router.post('/pia', 
  auth,
  [
    body('processingActivity').isObject().withMessage('Processing activity details are required'),
    body('processingActivity.name').notEmpty().withMessage('Processing activity name is required'),
    body('processingActivity.description').notEmpty().withMessage('Processing activity description is required'),
    body('processingActivity.dataTypes').isArray().withMessage('Data types must be an array'),
    body('processingActivity.purposes').isArray().withMessage('Purposes must be an array')
  ],
  async (req, res) => {
    try {
      // Check if user has admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const pia = await gdprService.generatePrivacyImpactAssessment(req.body.processingActivity);
      
      res.json({
        success: true,
        message: 'Privacy Impact Assessment generated successfully',
        pia
      });
    } catch (error) {
      console.error('Failed to generate PIA:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Privacy Impact Assessment',
        error: error.message
      });
    }
  }
);

// Data retention cleanup - Admin only
router.post('/retention/cleanup', auth, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const cleanupResults = await gdprService.performDataRetentionCleanup();
    
    res.json({
      success: true,
      message: 'Data retention cleanup completed successfully',
      results: cleanupResults
    });
  } catch (error) {
    console.error('Failed to perform data retention cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform data retention cleanup',
      error: error.message
    });
  }
});

// GDPR compliance dashboard - Admin only
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Mock compliance dashboard data
    const dashboard = {
      overview: {
        totalDataSubjects: 1250,
        activeConsents: 980,
        withdrawnConsents: 270,
        pendingRequests: 15,
        completedRequests: 85
      },
      requests: {
        thisMonth: {
          access: 12,
          rectification: 3,
          erasure: 8,
          restriction: 2,
          portability: 5
        },
        trends: [
          { month: 'Jan', requests: 25 },
          { month: 'Feb', requests: 30 },
          { month: 'Mar', requests: 28 }
        ]
      },
      consent: {
        byType: {
          data_processing: { granted: 1200, withdrawn: 50 },
          marketing_communications: { granted: 800, withdrawn: 450 },
          analytics_tracking: { granted: 1000, withdrawn: 250 },
          third_party_sharing: { granted: 600, withdrawn: 650 },
          automated_profiling: { granted: 700, withdrawn: 550 }
        }
      },
      dataRetention: {
        upcomingDeletions: 45,
        recentCleanups: 3,
        storageUsed: '2.5 GB',
        oldestData: '2019-01-01'
      },
      compliance: {
        overallScore: 95,
        areas: {
          consent_management: 98,
          data_subject_rights: 92,
          data_protection: 97,
          breach_response: 90,
          documentation: 95
        }
      }
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Failed to get GDPR dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get GDPR compliance dashboard',
      error: error.message
    });
  }
});

// Privacy notice/policy endpoints
router.get('/privacy-notice', async (req, res) => {
  try {
    const privacyNotice = {
      lastUpdated: '2024-01-01T00:00:00Z',
      version: '2.0',
      dataController: {
        name: 'HR Platform Inc.',
        contact: 'privacy@hrplatform.com',
        address: '123 Business St, City, Country'
      },
      dataProtectionOfficer: {
        name: 'Jane Smith',
        email: 'dpo@hrplatform.com'
      },
      purposes: [
        {
          purpose: 'Recruitment process management',
          lawfulBasis: 'legitimate_interests',
          dataTypes: ['contact_information', 'cv_data', 'interview_notes'],
          retention: '3 years after recruitment process completion'
        },
        {
          purpose: 'Marketing communications',
          lawfulBasis: 'consent',
          dataTypes: ['contact_information', 'preferences'],
          retention: 'Until consent is withdrawn'
        }
      ],
      rights: [
        'Right of access (Article 15)',
        'Right to rectification (Article 16)',
        'Right to erasure (Article 17)',
        'Right to restrict processing (Article 18)',
        'Right to data portability (Article 20)',
        'Right to object (Article 21)'
      ],
      complaints: {
        internal: 'privacy@hrplatform.com',
        supervisoryAuthority: 'National Data Protection Authority'
      }
    };

    res.json({
      success: true,
      privacyNotice
    });
  } catch (error) {
    console.error('Failed to get privacy notice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get privacy notice',
      error: error.message
    });
  }
});

module.exports = router;
