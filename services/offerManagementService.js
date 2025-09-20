const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const moment = require('moment');

class OfferManagementService {
  constructor() {
    this.offerTemplates = new Map();
    this.activeOffers = new Map();
    this.offerHistory = new Map();
    this.signatures = new Map();
    this.initializeDefaultTemplates();
  }

  // Offer Templates Management
  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'standard-employee',
        name: 'Standard Employee Offer',
        type: 'full-time',
        sections: [
          'position_details',
          'compensation',
          'benefits',
          'start_date',
          'conditions',
          'at_will_employment',
          'confidentiality'
        ],
        required_fields: ['position', 'salary', 'start_date', 'manager'],
        variables: {
          position: '{POSITION_TITLE}',
          salary: '{ANNUAL_SALARY}',
          start_date: '{START_DATE}',
          manager: '{REPORTING_MANAGER}',
          company: '{COMPANY_NAME}',
          benefits_start: '{BENEFITS_START_DATE}'
        }
      },
      {
        id: 'contractor-offer',
        name: 'Contractor/Consultant Offer',
        type: 'contract',
        sections: [
          'project_details',
          'rate_structure',
          'duration',
          'deliverables',
          'payment_terms',
          'intellectual_property'
        ],
        required_fields: ['project', 'rate', 'duration', 'deliverables'],
        variables: {
          project: '{PROJECT_NAME}',
          rate: '{HOURLY_RATE}',
          duration: '{CONTRACT_DURATION}',
          deliverables: '{KEY_DELIVERABLES}'
        }
      },
      {
        id: 'executive-offer',
        name: 'Executive Level Offer',
        type: 'executive',
        sections: [
          'position_details',
          'compensation_package',
          'equity_participation',
          'benefits_premium',
          'severance_terms',
          'non_compete',
          'relocation_assistance'
        ],
        required_fields: ['position', 'base_salary', 'bonus_target', 'equity'],
        variables: {
          position: '{EXECUTIVE_TITLE}',
          base_salary: '{BASE_SALARY}',
          bonus_target: '{TARGET_BONUS}',
          equity: '{EQUITY_PERCENTAGE}',
          severance: '{SEVERANCE_MONTHS}'
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.offerTemplates.set(template.id, template);
    });
  }

  async createOfferTemplate(templateData) {
    try {
      const templateId = crypto.randomUUID();
      const template = {
        id: templateId,
        name: templateData.name,
        type: templateData.type,
        sections: templateData.sections || [],
        required_fields: templateData.required_fields || [],
        variables: templateData.variables || {},
        custom_fields: templateData.custom_fields || {},
        approval_workflow: templateData.approval_workflow || false,
        created_at: new Date().toISOString(),
        created_by: templateData.created_by,
        version: '1.0'
      };

      this.offerTemplates.set(templateId, template);

      return {
        success: true,
        template_id: templateId,
        template: template
      };
    } catch (error) {
      console.error('Error creating offer template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateOffer(offerData) {
    try {
      const offerId = crypto.randomUUID();
      const template = this.offerTemplates.get(offerData.template_id);
      
      if (!template) {
        throw new Error('Offer template not found');
      }

      // Validate required fields
      const missingFields = template.required_fields.filter(
        field => !offerData.variables || !offerData.variables[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const offer = {
        id: offerId,
        candidate_id: offerData.candidate_id,
        job_id: offerData.job_id,
        template_id: offerData.template_id,
        template_name: template.name,
        status: 'draft',
        variables: offerData.variables,
        custom_data: offerData.custom_data || {},
        created_at: new Date().toISOString(),
        created_by: offerData.created_by,
        expiry_date: offerData.expiry_date || moment().add(7, 'days').toISOString(),
        version: 1,
        workflow_stage: 'creation',
        approvals: [],
        documents: [],
        notifications: {
          candidate_notified: false,
          manager_notified: false,
          hr_notified: false
        }
      };

      // Generate offer document
      const documentResult = await this.generateOfferDocument(offer, template);
      offer.documents.push(documentResult.document);

      this.activeOffers.set(offerId, offer);

      return {
        success: true,
        offer_id: offerId,
        offer: offer,
        document_url: documentResult.document_url
      };
    } catch (error) {
      console.error('Error generating offer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateOfferDocument(offer, template) {
    try {
      const doc = new PDFDocument();
      const fileName = `offer_${offer.id}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../uploads/documents', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('EMPLOYMENT OFFER LETTER', { align: 'center' });
      doc.moveDown(2);

      // Offer details
      doc.fontSize(12);
      doc.text(`Offer ID: ${offer.id}`);
      doc.text(`Date: ${moment(offer.created_at).format('MMMM DD, YYYY')}`);
      doc.text(`Valid Until: ${moment(offer.expiry_date).format('MMMM DD, YYYY')}`);
      doc.moveDown();

      // Process template sections with variables
      template.sections.forEach(section => {
        this.addSectionToDocument(doc, section, offer.variables, template.variables);
      });

      // Signature section
      doc.moveDown(2);
      doc.text('ACCEPTANCE', { underline: true });
      doc.moveDown();
      doc.text('By signing below, you accept this offer of employment:');
      doc.moveDown(2);
      doc.text('Candidate Signature: _________________________________ Date: __________');
      doc.moveDown();
      doc.text('Company Representative: _________________________________ Date: __________');

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            document: {
              id: crypto.randomUUID(),
              type: 'offer_letter',
              filename: fileName,
              path: filePath,
              url: `/uploads/documents/${fileName}`,
              created_at: new Date().toISOString()
            },
            document_url: `/uploads/documents/${fileName}`
          });
        });

        stream.on('error', reject);
      });

    } catch (error) {
      console.error('Error generating offer document:', error);
      throw error;
    }
  }

  addSectionToDocument(doc, sectionType, offerVariables, templateVariables) {
    const sectionContent = this.getSectionContent(sectionType, offerVariables, templateVariables);
    
    doc.text(sectionContent.title, { underline: true });
    doc.moveDown(0.5);
    doc.text(sectionContent.content);
    doc.moveDown();
  }

  getSectionContent(sectionType, offerVariables, templateVariables) {
    const sections = {
      position_details: {
        title: 'POSITION DETAILS',
        content: `We are pleased to offer you the position of ${offerVariables.position || '{POSITION_TITLE}'} reporting to ${offerVariables.manager || '{REPORTING_MANAGER}'}. Your start date will be ${offerVariables.start_date || '{START_DATE}'}.`
      },
      compensation: {
        title: 'COMPENSATION',
        content: `Your annual salary will be ${offerVariables.salary || '{ANNUAL_SALARY}'}, paid bi-weekly. This salary is subject to applicable tax withholdings and deductions.`
      },
      benefits: {
        title: 'BENEFITS',
        content: `You will be eligible for our comprehensive benefits package starting ${offerVariables.benefits_start || '{BENEFITS_START_DATE}'}, including health insurance, dental coverage, vision coverage, 401(k) with company matching, and paid time off.`
      },
      start_date: {
        title: 'START DATE',
        content: `Your employment will commence on ${offerVariables.start_date || '{START_DATE}'}. Please confirm your availability for this date.`
      },
      conditions: {
        title: 'CONDITIONS OF EMPLOYMENT',
        content: 'This offer is contingent upon successful completion of background checks, reference verification, and any required pre-employment testing or medical examinations.'
      }
    };

    return sections[sectionType] || { title: 'SECTION', content: 'Content not defined' };
  }

  // Offer Tracking
  async trackOfferStatus(offerId, statusUpdate) {
    try {
      const offer = this.activeOffers.get(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const previousStatus = offer.status;
      offer.status = statusUpdate.status;
      offer.updated_at = new Date().toISOString();
      offer.updated_by = statusUpdate.updated_by;

      // Add status history
      if (!offer.status_history) offer.status_history = [];
      offer.status_history.push({
        from_status: previousStatus,
        to_status: statusUpdate.status,
        timestamp: new Date().toISOString(),
        updated_by: statusUpdate.updated_by,
        notes: statusUpdate.notes || ''
      });

      // Handle status-specific actions
      await this.handleStatusChange(offer, statusUpdate);

      return {
        success: true,
        offer: offer,
        status_change: {
          from: previousStatus,
          to: statusUpdate.status
        }
      };
    } catch (error) {
      console.error('Error tracking offer status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleStatusChange(offer, statusUpdate) {
    switch (statusUpdate.status) {
      case 'sent':
        offer.sent_at = new Date().toISOString();
        offer.notifications.candidate_notified = true;
        break;
      
      case 'accepted':
        offer.accepted_at = new Date().toISOString();
        offer.candidate_response = statusUpdate.candidate_response || {};
        // Move to offer history
        this.offerHistory.set(offer.id, { ...offer, final_status: 'accepted' });
        break;
      
      case 'rejected':
        offer.rejected_at = new Date().toISOString();
        offer.rejection_reason = statusUpdate.rejection_reason || '';
        // Move to offer history
        this.offerHistory.set(offer.id, { ...offer, final_status: 'rejected' });
        break;
      
      case 'expired':
        offer.expired_at = new Date().toISOString();
        // Move to offer history
        this.offerHistory.set(offer.id, { ...offer, final_status: 'expired' });
        break;
      
      case 'withdrawn':
        offer.withdrawn_at = new Date().toISOString();
        offer.withdrawal_reason = statusUpdate.withdrawal_reason || '';
        // Move to offer history
        this.offerHistory.set(offer.id, { ...offer, final_status: 'withdrawn' });
        break;
    }
  }

  // E-Signature Integration
  async initializeESignature(offerId, signingData) {
    try {
      const offer = this.activeOffers.get(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const signatureId = crypto.randomUUID();
      const signatureRequest = {
        id: signatureId,
        offer_id: offerId,
        status: 'pending',
        signers: [
          {
            role: 'candidate',
            email: signingData.candidate_email,
            name: signingData.candidate_name,
            signed: false,
            signed_at: null
          },
          {
            role: 'company_representative',
            email: signingData.company_email,
            name: signingData.company_name,
            signed: false,
            signed_at: null
          }
        ],
        document_url: offer.documents[0]?.url,
        created_at: new Date().toISOString(),
        expires_at: moment().add(30, 'days').toISOString(),
        signing_url: `${process.env.FRONTEND_URL}/sign/${signatureId}`,
        webhook_url: `${process.env.BACKEND_URL}/api/offers/signature-webhook`
      };

      this.signatures.set(signatureId, signatureRequest);
      
      // Update offer with signature request
      offer.signature_request_id = signatureId;
      offer.status = 'awaiting_signature';

      return {
        success: true,
        signature_id: signatureId,
        signing_url: signatureRequest.signing_url,
        signature_request: signatureRequest
      };
    } catch (error) {
      console.error('Error initializing e-signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processSignature(signatureId, signerData) {
    try {
      const signatureRequest = this.signatures.get(signatureId);
      if (!signatureRequest) {
        throw new Error('Signature request not found');
      }

      // Find and update signer
      const signer = signatureRequest.signers.find(s => s.email === signerData.email);
      if (!signer) {
        throw new Error('Signer not found');
      }

      signer.signed = true;
      signer.signed_at = new Date().toISOString();
      signer.signature_data = signerData.signature_data;
      signer.ip_address = signerData.ip_address;

      // Check if all signers have signed
      const allSigned = signatureRequest.signers.every(s => s.signed);
      if (allSigned) {
        signatureRequest.status = 'completed';
        signatureRequest.completed_at = new Date().toISOString();

        // Update offer status
        const offer = this.activeOffers.get(signatureRequest.offer_id);
        if (offer) {
          offer.status = 'signed';
          offer.fully_executed_at = new Date().toISOString();
        }
      }

      return {
        success: true,
        signature_request: signatureRequest,
        all_signed: allSigned
      };
    } catch (error) {
      console.error('Error processing signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analytics and Reporting
  async getOfferAnalytics(filters = {}) {
    try {
      const allOffers = [
        ...Array.from(this.activeOffers.values()),
        ...Array.from(this.offerHistory.values())
      ];

      // Apply filters
      let filteredOffers = allOffers;
      if (filters.date_range) {
        const { start_date, end_date } = filters.date_range;
        filteredOffers = filteredOffers.filter(offer => {
          const offerDate = new Date(offer.created_at);
          return offerDate >= new Date(start_date) && offerDate <= new Date(end_date);
        });
      }

      if (filters.status) {
        filteredOffers = filteredOffers.filter(offer => offer.status === filters.status);
      }

      if (filters.template_id) {
        filteredOffers = filteredOffers.filter(offer => offer.template_id === filters.template_id);
      }

      // Calculate metrics
      const totalOffers = filteredOffers.length;
      const acceptedOffers = filteredOffers.filter(o => o.status === 'accepted').length;
      const rejectedOffers = filteredOffers.filter(o => o.status === 'rejected').length;
      const pendingOffers = filteredOffers.filter(o => ['sent', 'awaiting_signature'].includes(o.status)).length;
      const expiredOffers = filteredOffers.filter(o => o.status === 'expired').length;

      const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers * 100).toFixed(2) : 0;
      const rejectionRate = totalOffers > 0 ? (rejectedOffers / totalOffers * 100).toFixed(2) : 0;

      // Calculate average time to decision
      const decidedOffers = filteredOffers.filter(o => ['accepted', 'rejected'].includes(o.status));
      const avgTimeToDecision = this.calculateAverageTimeToDecision(decidedOffers);

      // Template usage
      const templateUsage = this.calculateTemplateUsage(filteredOffers);

      return {
        success: true,
        analytics: {
          summary: {
            total_offers: totalOffers,
            accepted_offers: acceptedOffers,
            rejected_offers: rejectedOffers,
            pending_offers: pendingOffers,
            expired_offers: expiredOffers,
            acceptance_rate: `${acceptanceRate}%`,
            rejection_rate: `${rejectionRate}%`,
            avg_time_to_decision_days: avgTimeToDecision
          },
          template_usage: templateUsage,
          status_breakdown: {
            draft: filteredOffers.filter(o => o.status === 'draft').length,
            sent: filteredOffers.filter(o => o.status === 'sent').length,
            awaiting_signature: filteredOffers.filter(o => o.status === 'awaiting_signature').length,
            signed: filteredOffers.filter(o => o.status === 'signed').length,
            accepted: acceptedOffers,
            rejected: rejectedOffers,
            expired: expiredOffers,
            withdrawn: filteredOffers.filter(o => o.status === 'withdrawn').length
          },
          trends: this.calculateOfferTrends(filteredOffers),
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating offer analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateAverageTimeToDecision(decidedOffers) {
    if (decidedOffers.length === 0) return 0;

    const totalDays = decidedOffers.reduce((sum, offer) => {
      const sentDate = new Date(offer.sent_at || offer.created_at);
      const decisionDate = new Date(offer.accepted_at || offer.rejected_at);
      const daysDiff = Math.ceil((decisionDate - sentDate) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);

    return Math.round(totalDays / decidedOffers.length * 10) / 10;
  }

  calculateTemplateUsage(offers) {
    const usage = {};
    offers.forEach(offer => {
      const templateName = offer.template_name || 'Unknown';
      usage[templateName] = (usage[templateName] || 0) + 1;
    });
    return usage;
  }

  calculateOfferTrends(offers) {
    // Group offers by month
    const monthlyData = {};
    offers.forEach(offer => {
      const month = moment(offer.created_at).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, accepted: 0, rejected: 0 };
      }
      monthlyData[month].total++;
      if (offer.status === 'accepted') monthlyData[month].accepted++;
      if (offer.status === 'rejected') monthlyData[month].rejected++;
    });

    return Object.keys(monthlyData).map(month => ({
      month,
      ...monthlyData[month],
      acceptance_rate: monthlyData[month].total > 0 ? 
        (monthlyData[month].accepted / monthlyData[month].total * 100).toFixed(2) : 0
    }));
  }

  // Utility methods
  async getAllOffers(filters = {}) {
    const allOffers = [
      ...Array.from(this.activeOffers.values()),
      ...Array.from(this.offerHistory.values())
    ];

    return {
      success: true,
      offers: allOffers,
      count: allOffers.length
    };
  }

  async getOfferById(offerId) {
    const offer = this.activeOffers.get(offerId) || this.offerHistory.get(offerId);
    
    if (!offer) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }

    return {
      success: true,
      offer: offer
    };
  }

  async getOfferTemplates() {
    return {
      success: true,
      templates: Array.from(this.offerTemplates.values())
    };
  }
}

module.exports = new OfferManagementService();
