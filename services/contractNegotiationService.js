const ContractNegotiationService = {
  // Contract Management
  async createContract(clientId, contractData) {
    try {
      const contract = {
        id: Date.now().toString(),
        contractNumber: `CT-${Date.now()}`,
        clientId,
        
        contractType: contractData.type, // master_service_agreement, project_specific, retained_search, contingency
        
        parties: {
          agency: {
            name: 'Elite Recruitment Solutions',
            address: contractData.agencyAddress,
            contact: contractData.agencyContact
          },
          client: {
            name: contractData.clientName,
            address: contractData.clientAddress,
            contact: contractData.clientContact,
            signatoryName: contractData.signatoryName,
            signatoryTitle: contractData.signatoryTitle
          }
        },
        
        terms: {
          effectiveDate: contractData.effectiveDate,
          expirationDate: contractData.expirationDate,
          autoRenewal: contractData.autoRenewal || false,
          renewalTerms: contractData.renewalTerms,
          
          services: contractData.services.map(service => ({
            type: service.type,
            description: service.description,
            scope: service.scope,
            deliverables: service.deliverables
          })),
          
          pricing: {
            feeStructure: contractData.pricing.feeStructure, // percentage, fixed_fee, retainer, hybrid
            rates: contractData.pricing.rates,
            paymentSchedule: contractData.pricing.paymentSchedule,
            invoiceTerms: contractData.pricing.invoiceTerms,
            expenses: contractData.pricing.expenses
          },
          
          guarantees: {
            replacementPeriod: contractData.guarantees.replacementPeriod || 90,
            refundPolicy: contractData.guarantees.refundPolicy,
            qualityStandards: contractData.guarantees.qualityStandards
          },
          
          liability: {
            limitation: contractData.liability.limitation,
            insurance: contractData.liability.insurance,
            indemnification: contractData.liability.indemnification
          }
        },
        
        clauses: {
          confidentiality: true,
          nonSolicitation: contractData.clauses.nonSolicitation || true,
          exclusivity: contractData.clauses.exclusivity || false,
          terminationClause: contractData.clauses.terminationClause,
          disputeResolution: contractData.clauses.disputeResolution || 'arbitration'
        },
        
        status: 'draft',
        workflow: {
          currentStage: 'legal_review',
          stages: ['legal_review', 'client_review', 'negotiation', 'approval', 'execution'],
          draftedBy: contractData.draftedBy,
          reviewers: contractData.reviewers || []
        },
        
        versions: [{
          version: '1.0',
          createdAt: new Date().toISOString(),
          changes: 'Initial draft',
          createdBy: contractData.draftedBy
        }],
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Contract created: ${contract.contractNumber}`);
      return { success: true, contract };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { success: false, error: error.message };
    }
  },

  async updateContractTerms(contractId, updates, updatedBy) {
    try {
      console.log(`Updating contract ${contractId} terms`);
      
      const contractUpdate = {
        contractId,
        updates,
        updatedBy,
        version: '1.1', // Increment version
        updatedAt: new Date().toISOString(),
        changesSummary: this.summarizeChanges(updates),
        approvalRequired: this.requiresApproval(updates)
      };

      return { success: true, contractUpdate };
    } catch (error) {
      console.error('Error updating contract terms:', error);
      return { success: false, error: error.message };
    }
  },

  // Offer Negotiation Tools
  async createOffer(candidateId, jobId, offerData) {
    try {
      const offer = {
        id: Date.now().toString(),
        offerNumber: `OF-${Date.now()}`,
        candidateId,
        jobId,
        clientId: offerData.clientId,
        
        position: {
          title: offerData.position.title,
          department: offerData.position.department,
          reportingTo: offerData.position.reportingTo,
          location: offerData.position.location,
          startDate: offerData.position.startDate,
          employmentType: offerData.position.employmentType // full_time, part_time, contract
        },
        
        compensation: {
          baseSalary: offerData.compensation.baseSalary,
          currency: offerData.compensation.currency || 'USD',
          payFrequency: offerData.compensation.payFrequency || 'annual',
          
          bonus: {
            signing: offerData.compensation.bonus?.signing || 0,
            annual: offerData.compensation.bonus?.annual || 0,
            performance: offerData.compensation.bonus?.performance || 0
          },
          
          equity: {
            hasEquity: offerData.compensation.equity?.hasEquity || false,
            equityType: offerData.compensation.equity?.equityType,
            vestingSchedule: offerData.compensation.equity?.vestingSchedule,
            equityAmount: offerData.compensation.equity?.equityAmount || 0
          }
        },
        
        benefits: {
          healthInsurance: offerData.benefits.healthInsurance || true,
          dentalVision: offerData.benefits.dentalVision || true,
          retirement401k: offerData.benefits.retirement401k || true,
          paidTimeOff: offerData.benefits.paidTimeOff || 25,
          flexibleSchedule: offerData.benefits.flexibleSchedule || false,
          remoteWork: offerData.benefits.remoteWork || false,
          professionalDevelopment: offerData.benefits.professionalDevelopment || 2000,
          other: offerData.benefits.other || []
        },
        
        terms: {
          probationPeriod: offerData.terms.probationPeriod || 90,
          noticePeriod: offerData.terms.noticePeriod || 30,
          nonCompete: offerData.terms.nonCompete || false,
          confidentiality: offerData.terms.confidentiality || true,
          backgroundCheck: offerData.terms.backgroundCheck || true,
          drugTest: offerData.terms.drugTest || false
        },
        
        negotiation: {
          status: 'initial_offer',
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          negotiationRounds: [],
          clientApprovalRequired: true,
          maxSalaryApproved: offerData.negotiation.maxSalaryApproved,
          flexibleTerms: offerData.negotiation.flexibleTerms || []
        },
        
        documents: {
          offerLetter: null,
          employmentAgreement: null,
          jobDescription: null,
          benefitsSummary: null
        },
        
        timeline: {
          createdAt: new Date().toISOString(),
          sentAt: null,
          respondBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: null,
          declinedAt: null
        },
        
        createdBy: offerData.createdBy,
        approvedBy: null,
        status: 'draft'
      };

      console.log(`Offer created: ${offer.offerNumber}`);
      return { success: true, offer };
    } catch (error) {
      console.error('Error creating offer:', error);
      return { success: false, error: error.message };
    }
  },

  async updateOffer(offerId, updates, negotiationType) {
    try {
      console.log(`Updating offer ${offerId} - ${negotiationType}`);
      
      const negotiationRound = {
        roundNumber: 1, // Will be incremented based on existing rounds
        type: negotiationType, // candidate_counter, client_revision, final_offer
        updates,
        requestedBy: updates.requestedBy,
        reason: updates.reason,
        timestamp: new Date().toISOString(),
        
        changes: {
          compensation: updates.compensation || {},
          benefits: updates.benefits || {},
          terms: updates.terms || {},
          startDate: updates.startDate
        },
        
        status: 'pending_review',
        approvalRequired: this.requiresClientApproval(updates)
      };

      return { success: true, negotiationRound };
    } catch (error) {
      console.error('Error updating offer:', error);
      return { success: false, error: error.message };
    }
  },

  async finalizeOffer(offerId, finalTerms, approvedBy) {
    try {
      console.log(`Finalizing offer ${offerId}`);
      
      const finalOffer = {
        offerId,
        status: 'finalized',
        finalTerms,
        approvedBy,
        approvedAt: new Date().toISOString(),
        
        deliverables: {
          offerLetter: `offer_letter_${offerId}.pdf`,
          employmentAgreement: `employment_agreement_${offerId}.pdf`,
          benefitsSummary: `benefits_summary_${offerId}.pdf`
        },
        
        nextSteps: [
          'Send final offer package to candidate',
          'Schedule offer discussion call',
          'Set acceptance deadline',
          'Prepare onboarding materials'
        ]
      };

      return { success: true, finalOffer };
    } catch (error) {
      console.error('Error finalizing offer:', error);
      return { success: false, error: error.message };
    }
  },

  // Negotiation Analytics
  async getNegotiationInsights(clientId, timeframe) {
    try {
      const insights = {
        clientId,
        timeframe,
        
        offerMetrics: {
          totalOffers: 25,
          acceptedOffers: 18,
          declinedOffers: 5,
          pendingOffers: 2,
          acceptanceRate: 72,
          avgNegotiationRounds: 2.3,
          avgTimeToAcceptance: 4.8
        },
        
        negotiationPatterns: {
          mostNegotiatedItems: [
            { item: 'Base Salary', frequency: 85 },
            { item: 'Start Date', frequency: 45 },
            { item: 'Remote Work', frequency: 38 },
            { item: 'Vacation Days', frequency: 22 },
            { item: 'Signing Bonus', frequency: 18 }
          ],
          
          successfulNegotiationStrategies: [
            'Flexible start date options',
            'Professional development budget',
            'Hybrid work arrangements',
            'Performance-based bonuses'
          ]
        },
        
        compensationTrends: {
          avgSalaryIncrease: 12.5,
          salaryRangeByRole: [
            { role: 'Software Engineer', min: 85000, max: 140000, avg: 115000 },
            { role: 'Product Manager', min: 95000, max: 160000, avg: 125000 },
            { role: 'Data Scientist', min: 90000, max: 150000, avg: 120000 }
          ]
        },
        
        declineReasons: [
          { reason: 'Salary below expectations', percentage: 45 },
          { reason: 'Better competing offer', percentage: 30 },
          { reason: 'Location/remote work issues', percentage: 15 },
          { reason: 'Company culture concerns', percentage: 10 }
        ]
      };

      return { success: true, insights };
    } catch (error) {
      console.error('Error generating negotiation insights:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper Methods
  summarizeChanges(updates) {
    const changes = [];
    if (updates.pricing) changes.push('Pricing structure modified');
    if (updates.terms) changes.push('Contract terms updated');
    if (updates.services) changes.push('Service scope adjusted');
    return changes.join(', ');
  },

  requiresApproval(updates) {
    // Define which changes require additional approval
    const significantChanges = ['pricing', 'liability', 'termination'];
    return significantChanges.some(change => updates[change]);
  },

  requiresClientApproval(updates) {
    // Define which offer changes require client approval
    const clientApprovalRequired = ['compensation', 'benefits', 'terms'];
    return clientApprovalRequired.some(change => updates[change]);
  }
};

module.exports = ContractNegotiationService;