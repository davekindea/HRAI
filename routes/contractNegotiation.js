const express = require('express');
const router = express.Router();
const ContractNegotiationService = require('../services/contractNegotiationService');

// Contract Management Routes
router.post('/contracts', async (req, res) => {
  try {
    const { clientId } = req.body;
    const result = await ContractNegotiationService.createContract(clientId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/contracts', async (req, res) => {
  try {
    const { clientId, status, type } = req.query;
    
    // Simulate contract list
    const contracts = [
      {
        id: 'contract_1',
        contractNumber: 'CT-20250920001',
        clientId: 'client_1',
        type: 'master_service_agreement',
        status: 'active',
        effectiveDate: '2025-01-01',
        expirationDate: '2025-12-31',
        totalValue: 500000,
        createdAt: '2024-12-15T00:00:00Z'
      },
      {
        id: 'contract_2',
        contractNumber: 'CT-20250918002',
        clientId: 'client_2',
        type: 'project_specific',
        status: 'negotiation',
        effectiveDate: '2025-10-01',
        expirationDate: '2025-12-31',
        totalValue: 150000,
        createdAt: '2025-09-18T00:00:00Z'
      }
    ].filter(contract => {
      let matches = true;
      if (clientId) matches = matches && contract.clientId === clientId;
      if (status) matches = matches && contract.status === status;
      if (type) matches = matches && contract.type === type;
      return matches;
    });

    res.json({ success: true, contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/contracts/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Simulate detailed contract
    const contract = {
      id: contractId,
      contractNumber: 'CT-20250920001',
      clientId: 'client_1',
      contractType: 'master_service_agreement',
      
      parties: {
        agency: {
          name: 'Elite Recruitment Solutions',
          address: '123 Business Ave, Suite 100, San Francisco, CA 94105'
        },
        client: {
          name: 'TechCorp Solutions',
          address: '456 Tech Street, San Francisco, CA 94107'
        }
      },
      
      terms: {
        effectiveDate: '2025-01-01',
        expirationDate: '2025-12-31',
        autoRenewal: true,
        
        services: [
          {
            type: 'executive_search',
            description: 'Senior level recruitment services',
            scope: 'Technology and Leadership roles'
          },
          {
            type: 'contingency_search',
            description: 'Mid-level recruitment on success fee basis',
            scope: 'All departments as needed'
          }
        ],
        
        pricing: {
          feeStructure: 'percentage',
          rates: {
            executive_search: '25%',
            contingency_search: '20%',
            retained_search: '33%'
          },
          paymentSchedule: 'net_30',
          invoiceTerms: 'monthly'
        },
        
        guarantees: {
          replacementPeriod: 90,
          refundPolicy: 'Pro-rated if candidate leaves within guarantee period'
        }
      },
      
      status: 'active',
      currentVersion: '2.1',
      
      workflow: {
        currentStage: 'executed',
        lastModified: '2025-03-15T00:00:00Z',
        nextReview: '2025-11-01T00:00:00Z'
      }
    };

    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/contracts/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { updates, updatedBy } = req.body;
    const result = await ContractNegotiationService.updateContractTerms(contractId, updates, updatedBy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/contracts/:contractId/versions', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Simulate version history
    const versions = [
      {
        version: '1.0',
        createdAt: '2024-12-15T00:00:00Z',
        changes: 'Initial contract draft',
        createdBy: 'legal_team_1'
      },
      {
        version: '1.1',
        createdAt: '2025-01-05T00:00:00Z',
        changes: 'Updated fee structure per client request',
        createdBy: 'account_manager_1'
      },
      {
        version: '2.0',
        createdAt: '2025-02-10T00:00:00Z',
        changes: 'Added new service categories and updated terms',
        createdBy: 'legal_team_1'
      },
      {
        version: '2.1',
        createdAt: '2025-03-15T00:00:00Z',
        changes: 'Minor clarifications and typo corrections',
        createdBy: 'account_manager_1'
      }
    ];

    res.json({ success: true, contractId, versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Offer Management Routes
router.post('/offers', async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    const result = await ContractNegotiationService.createOffer(candidateId, jobId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/offers', async (req, res) => {
  try {
    const { clientId, candidateId, jobId, status } = req.query;
    
    // Simulate offer list
    const offers = [
      {
        id: 'offer_1',
        offerNumber: 'OF-20250920001',
        candidateId: 'candidate_1',
        jobId: 'job_1',
        clientId: 'client_1',
        position: 'Senior Software Engineer',
        baseSalary: 140000,
        status: 'pending_response',
        createdAt: '2025-09-20T10:00:00Z',
        expirationDate: '2025-09-27T23:59:59Z'
      },
      {
        id: 'offer_2',
        offerNumber: 'OF-20250918002',
        candidateId: 'candidate_2',
        jobId: 'job_2',
        clientId: 'client_1',
        position: 'Product Manager',
        baseSalary: 130000,
        status: 'negotiation',
        createdAt: '2025-09-18T14:30:00Z',
        expirationDate: '2025-09-25T23:59:59Z'
      }
    ].filter(offer => {
      let matches = true;
      if (clientId) matches = matches && offer.clientId === clientId;
      if (candidateId) matches = matches && offer.candidateId === candidateId;
      if (jobId) matches = matches && offer.jobId === jobId;
      if (status) matches = matches && offer.status === status;
      return matches;
    });

    res.json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/offers/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    // Simulate detailed offer
    const offer = {
      id: offerId,
      offerNumber: 'OF-20250920001',
      candidateId: 'candidate_1',
      jobId: 'job_1',
      clientId: 'client_1',
      
      position: {
        title: 'Senior Software Engineer',
        department: 'Technology',
        reportingTo: 'VP of Engineering',
        location: 'San Francisco, CA (Hybrid)',
        startDate: '2025-10-15',
        employmentType: 'full_time'
      },
      
      compensation: {
        baseSalary: 140000,
        currency: 'USD',
        payFrequency: 'annual',
        
        bonus: {
          signing: 10000,
          annual: 20000,
          performance: 15000
        },
        
        equity: {
          hasEquity: true,
          equityType: 'RSUs',
          equityAmount: 50000,
          vestingSchedule: '4 years, 25% per year'
        }
      },
      
      benefits: {
        healthInsurance: true,
        dentalVision: true,
        retirement401k: true,
        paidTimeOff: 25,
        flexibleSchedule: true,
        remoteWork: true,
        professionalDevelopment: 3000,
        other: ['Gym membership', 'Commuter benefits', 'Free meals']
      },
      
      terms: {
        probationPeriod: 90,
        noticePeriod: 30,
        nonCompete: false,
        confidentiality: true,
        backgroundCheck: true,
        drugTest: false
      },
      
      negotiation: {
        status: 'pending_response',
        expirationDate: '2025-09-27T23:59:59Z',
        negotiationRounds: [],
        maxSalaryApproved: 150000,
        flexibleTerms: ['start_date', 'remote_work', 'professional_development']
      },
      
      timeline: {
        createdAt: '2025-09-20T10:00:00Z',
        sentAt: '2025-09-20T14:00:00Z',
        respondBy: '2025-09-27T23:59:59Z'
      },
      
      status: 'pending_response'
    };

    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/offers/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { updates, negotiationType } = req.body;
    const result = await ContractNegotiationService.updateOffer(offerId, updates, negotiationType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offers/:offerId/finalize', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { finalTerms, approvedBy } = req.body;
    const result = await ContractNegotiationService.finalizeOffer(offerId, finalTerms, approvedBy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/offers/:offerId/negotiation-history', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    // Simulate negotiation history
    const history = {
      offerId,
      totalRounds: 2,
      
      rounds: [
        {
          roundNumber: 1,
          type: 'candidate_counter',
          timestamp: '2025-09-21T09:00:00Z',
          requestedBy: 'candidate_1',
          changes: {
            baseSalary: { from: 140000, to: 150000 },
            remoteWork: { from: 'hybrid', to: 'fully_remote' }
          },
          reason: 'Salary below market rate, prefer remote work',
          status: 'client_review'
        },
        {
          roundNumber: 2,
          type: 'client_revision',
          timestamp: '2025-09-21T14:30:00Z',
          requestedBy: 'client_1',
          changes: {
            baseSalary: { from: 140000, to: 145000 },
            professionalDevelopment: { from: 2000, to: 3000 }
          },
          reason: 'Counter-offer with increased development budget',
          status: 'pending_candidate_response'
        }
      ],
      
      currentStatus: 'pending_candidate_response',
      nextAction: 'Await candidate response to revised offer'
    };

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Negotiation Analytics and Insights
router.get('/negotiation-insights', async (req, res) => {
  try {
    const { clientId, timeframe } = req.query;
    const result = await ContractNegotiationService.getNegotiationInsights(clientId, timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/contracts/:contractId/performance', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Simulate contract performance metrics
    const performance = {
      contractId,
      
      utilization: {
        servicesUsed: ['executive_search', 'contingency_search'],
        unusedServices: ['retained_search'],
        utilizationRate: 67
      },
      
      financial: {
        contractValue: 500000,
        actualSpend: 285000,
        remainingBudget: 215000,
        utilizationPercentage: 57
      },
      
      performance: {
        avgTimeToFill: 23,
        successRate: 85,
        clientSatisfaction: 4.6,
        contractCompliance: 95
      },
      
      projections: {
        estimatedAnnualSpend: 420000,
        renewalProbability: 'high',
        recommendedAdjustments: [
          'Consider adding retained search services',
          'Adjust fee structure for high-volume roles'
        ]
      }
    };

    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Document Generation
router.post('/contracts/:contractId/generate-document', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { documentType, format } = req.body;
    
    // Simulate document generation
    const document = {
      contractId,
      documentType, // contract_pdf, amendment, addendum
      format, // pdf, docx
      downloadUrl: `/api/documents/download/${contractId}_${documentType}.${format}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offers/:offerId/generate-document', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { documentType, format } = req.body;
    
    // Simulate offer document generation
    const document = {
      offerId,
      documentType, // offer_letter, employment_agreement, benefits_summary
      format, // pdf, docx
      downloadUrl: `/api/documents/download/${offerId}_${documentType}.${format}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;