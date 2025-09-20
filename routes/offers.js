const express = require('express');
const router = express.Router();
const offerManagementService = require('../services/offerManagementService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  dest: 'tmp/uploads',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ============================================================================
// OFFER TEMPLATES
// ============================================================================

// Get all offer templates
router.get('/templates', async (req, res) => {
  try {
    const result = await offerManagementService.getOfferTemplates();
    res.json(result);
  } catch (error) {
    console.error('Error fetching offer templates:', error);
    res.status(500).json({ error: 'Failed to fetch offer templates' });
  }
});

// Create new offer template
router.post('/templates', async (req, res) => {
  try {
    const templateData = {
      name: req.body.name,
      type: req.body.type,
      sections: req.body.sections,
      required_fields: req.body.required_fields,
      variables: req.body.variables,
      custom_fields: req.body.custom_fields,
      approval_workflow: req.body.approval_workflow,
      created_by: req.body.created_by
    };

    const result = await offerManagementService.createOfferTemplate(templateData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating offer template:', error);
    res.status(500).json({ error: 'Failed to create offer template' });
  }
});

// ============================================================================
// OFFER GENERATION
// ============================================================================

// Generate new offer
router.post('/generate', async (req, res) => {
  try {
    const offerData = {
      candidate_id: req.body.candidate_id,
      job_id: req.body.job_id,
      template_id: req.body.template_id,
      variables: req.body.variables,
      custom_data: req.body.custom_data,
      created_by: req.body.created_by,
      expiry_date: req.body.expiry_date
    };

    // Validate required fields
    if (!offerData.candidate_id || !offerData.template_id) {
      return res.status(400).json({
        error: 'Missing required fields: candidate_id, template_id'
      });
    }

    const result = await offerManagementService.generateOffer(offerData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error generating offer:', error);
    res.status(500).json({ error: 'Failed to generate offer' });
  }
});

// Get all offers
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      candidate_id: req.query.candidate_id,
      job_id: req.query.job_id,
      template_id: req.query.template_id
    };

    const result = await offerManagementService.getAllOffers(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Get specific offer
router.get('/:offerId', async (req, res) => {
  try {
    const result = await offerManagementService.getOfferById(req.params.offerId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

// ============================================================================
// OFFER STATUS TRACKING
// ============================================================================

// Update offer status
router.put('/:offerId/status', async (req, res) => {
  try {
    const statusUpdate = {
      status: req.body.status,
      updated_by: req.body.updated_by,
      notes: req.body.notes,
      candidate_response: req.body.candidate_response,
      rejection_reason: req.body.rejection_reason,
      withdrawal_reason: req.body.withdrawal_reason
    };

    // Validate status
    const validStatuses = ['draft', 'sent', 'awaiting_signature', 'signed', 'accepted', 'rejected', 'expired', 'withdrawn'];
    if (!validStatuses.includes(statusUpdate.status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await offerManagementService.trackOfferStatus(req.params.offerId, statusUpdate);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ error: 'Failed to update offer status' });
  }
});

// ============================================================================
// E-SIGNATURE INTEGRATION
// ============================================================================

// Initialize e-signature process
router.post('/:offerId/signature/initialize', async (req, res) => {
  try {
    const signingData = {
      candidate_email: req.body.candidate_email,
      candidate_name: req.body.candidate_name,
      company_email: req.body.company_email,
      company_name: req.body.company_name
    };

    // Validate required fields
    if (!signingData.candidate_email || !signingData.candidate_name) {
      return res.status(400).json({
        error: 'Missing required fields: candidate_email, candidate_name'
      });
    }

    const result = await offerManagementService.initializeESignature(req.params.offerId, signingData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error initializing e-signature:', error);
    res.status(500).json({ error: 'Failed to initialize e-signature' });
  }
});

// Process signature (webhook endpoint)
router.post('/signature-webhook', async (req, res) => {
  try {
    const { signature_id, signer_email, signature_data, ip_address } = req.body;

    const signerData = {
      email: signer_email,
      signature_data: signature_data,
      ip_address: ip_address
    };

    const result = await offerManagementService.processSignature(signature_id, signerData);
    
    if (result.success) {
      res.json({ status: 'processed', all_signed: result.all_signed });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing signature webhook:', error);
    res.status(500).json({ error: 'Failed to process signature' });
  }
});

// Manual signature completion (for testing/demo)
router.post('/:signatureId/sign', async (req, res) => {
  try {
    const signerData = {
      email: req.body.email,
      signature_data: req.body.signature_data || 'manual_signature',
      ip_address: req.ip || '127.0.0.1'
    };

    const result = await offerManagementService.processSignature(req.params.signatureId, signerData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing manual signature:', error);
    res.status(500).json({ error: 'Failed to process signature' });
  }
});

// ============================================================================
// OFFER ANALYTICS
// ============================================================================

// Get offer analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const filters = {
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      status: req.query.status,
      template_id: req.query.template_id
    };

    const result = await offerManagementService.getOfferAnalytics(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error generating offer analytics:', error);
    res.status(500).json({ error: 'Failed to generate offer analytics' });
  }
});

// Get offer conversion funnel
router.get('/analytics/funnel', async (req, res) => {
  try {
    const filters = {
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined
    };

    const analytics = await offerManagementService.getOfferAnalytics(filters);
    
    if (analytics.success) {
      const funnelData = {
        generated: analytics.analytics.summary.total_offers,
        sent: analytics.analytics.status_breakdown.sent + 
              analytics.analytics.status_breakdown.awaiting_signature +
              analytics.analytics.status_breakdown.signed +
              analytics.analytics.status_breakdown.accepted,
        signed: analytics.analytics.status_breakdown.signed + 
                analytics.analytics.status_breakdown.accepted,
        accepted: analytics.analytics.status_breakdown.accepted,
        conversion_rates: {
          sent_rate: analytics.analytics.summary.total_offers > 0 ? 
            (((analytics.analytics.status_breakdown.sent + 
               analytics.analytics.status_breakdown.awaiting_signature +
               analytics.analytics.status_breakdown.signed +
               analytics.analytics.status_breakdown.accepted) / 
              analytics.analytics.summary.total_offers) * 100).toFixed(2) : 0,
          acceptance_rate: analytics.analytics.summary.acceptance_rate
        }
      };

      res.json({
        success: true,
        funnel: funnelData,
        generated_at: analytics.analytics.generated_at
      });
    } else {
      res.status(400).json(analytics);
    }
  } catch (error) {
    console.error('Error generating offer funnel analytics:', error);
    res.status(500).json({ error: 'Failed to generate offer funnel analytics' });
  }
});

// ============================================================================
// OFFER DOCUMENT MANAGEMENT
// ============================================================================

// Download offer document
router.get('/:offerId/document/:documentId', async (req, res) => {
  try {
    const offer = await offerManagementService.getOfferById(req.params.offerId);
    
    if (!offer.success) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const document = offer.offer.documents.find(d => d.id === req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // In production, this would handle secure file serving
    res.json({
      success: true,
      document: document,
      download_url: document.url
    });
  } catch (error) {
    console.error('Error accessing offer document:', error);
    res.status(500).json({ error: 'Failed to access offer document' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk status update
router.put('/bulk/status', async (req, res) => {
  try {
    const { offer_ids, status, updated_by, notes } = req.body;

    if (!offer_ids || !Array.isArray(offer_ids) || offer_ids.length === 0) {
      return res.status(400).json({ error: 'offer_ids array is required' });
    }

    const results = [];
    const errors = [];

    for (const offerId of offer_ids) {
      try {
        const result = await offerManagementService.trackOfferStatus(offerId, {
          status,
          updated_by,
          notes
        });
        
        if (result.success) {
          results.push({ offer_id: offerId, success: true });
        } else {
          errors.push({ offer_id: offerId, error: result.error });
        }
      } catch (error) {
        errors.push({ offer_id: offerId, error: error.message });
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
    console.error('Error performing bulk status update:', error);
    res.status(500).json({ error: 'Failed to perform bulk status update' });
  }
});

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

// Search offers
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      candidate_name: req.query.candidate_name,
      position: req.query.position,
      status: req.query.status,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      salary_range: req.query.min_salary && req.query.max_salary ? {
        min: parseFloat(req.query.min_salary),
        max: parseFloat(req.query.max_salary)
      } : undefined
    };

    // This would implement more sophisticated search logic
    const allOffers = await offerManagementService.getAllOffers();
    
    if (allOffers.success) {
      let filteredOffers = allOffers.offers;

      // Apply search filters
      if (searchParams.status) {
        filteredOffers = filteredOffers.filter(offer => offer.status === searchParams.status);
      }

      if (searchParams.date_range) {
        filteredOffers = filteredOffers.filter(offer => {
          const offerDate = new Date(offer.created_at);
          return offerDate >= new Date(searchParams.date_range.start_date) && 
                 offerDate <= new Date(searchParams.date_range.end_date);
        });
      }

      res.json({
        success: true,
        offers: filteredOffers,
        count: filteredOffers.length,
        search_params: searchParams
      });
    } else {
      res.status(400).json(allOffers);
    }
  } catch (error) {
    console.error('Error searching offers:', error);
    res.status(500).json({ error: 'Failed to search offers' });
  }
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate offer ID parameter
router.param('offerId', async (req, res, next, offerId) => {
  if (!offerId || typeof offerId !== 'string') {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }
  next();
});

// Middleware to validate signature ID parameter
router.param('signatureId', async (req, res, next, signatureId) => {
  if (!signatureId || typeof signatureId !== 'string') {
    return res.status(400).json({ error: 'Invalid signature ID' });
  }
  next();
});

module.exports = router;
