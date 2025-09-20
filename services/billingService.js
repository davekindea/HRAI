const BillingService = {
  // Client Database & Account Management
  async createClientAccount(clientData) {
    try {
      const account = {
        id: Date.now().toString(),
        accountNumber: `AC-${Date.now()}`,
        
        companyInfo: {
          name: clientData.companyInfo.name,
          legalName: clientData.companyInfo.legalName,
          industry: clientData.companyInfo.industry,
          size: clientData.companyInfo.size,
          website: clientData.companyInfo.website,
          taxId: clientData.companyInfo.taxId,
          
          addresses: {
            billing: clientData.companyInfo.addresses.billing,
            shipping: clientData.companyInfo.addresses.shipping || clientData.companyInfo.addresses.billing,
            headquarters: clientData.companyInfo.addresses.headquarters
          }
        },
        
        contacts: {
          primary: clientData.contacts.primary,
          billing: clientData.contacts.billing,
          hr: clientData.contacts.hr,
          emergency: clientData.contacts.emergency
        },
        
        financial: {
          creditLimit: clientData.financial.creditLimit || 100000,
          paymentTerms: clientData.financial.paymentTerms || 'net_30',
          currency: clientData.financial.currency || 'USD',
          taxExempt: clientData.financial.taxExempt || false,
          
          bankingInfo: {
            preferredPaymentMethod: clientData.financial.preferredPaymentMethod || 'wire_transfer',
            accountDetails: clientData.financial.accountDetails || {}
          }
        },
        
        serviceLevel: {
          tier: clientData.serviceLevel.tier, // basic, premium, enterprise
          dedicatedManager: clientData.serviceLevel.dedicatedManager || false,
          prioritySupport: clientData.serviceLevel.prioritySupport || false,
          customReporting: clientData.serviceLevel.customReporting || false
        },
        
        status: 'active',
        
        metrics: {
          totalRevenue: 0,
          outstandingBalance: 0,
          creditUtilization: 0,
          avgProjectValue: 0,
          totalProjects: 0
        },
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: clientData.createdBy
      };

      console.log(`Client account created: ${account.accountNumber}`);
      return { success: true, account };
    } catch (error) {
      console.error('Error creating client account:', error);
      return { success: false, error: error.message };
    }
  },

  async updateClientAccount(accountId, updates) {
    try {
      console.log(`Updating client account: ${accountId}`);
      
      const updateResult = {
        accountId,
        updates,
        updatedAt: new Date().toISOString(),
        changesSummary: Object.keys(updates).join(', '),
        version: '1.1' // Increment version for audit trail
      };

      return { success: true, updateResult };
    } catch (error) {
      console.error('Error updating client account:', error);
      return { success: false, error: error.message };
    }
  },

  // Invoicing System
  async createInvoice(invoiceData) {
    try {
      const invoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        clientId: invoiceData.clientId,
        
        invoiceDetails: {
          issueDate: new Date().toISOString(),
          dueDate: this.calculateDueDate(invoiceData.paymentTerms || 'net_30'),
          currency: invoiceData.currency || 'USD',
          paymentTerms: invoiceData.paymentTerms || 'net_30'
        },
        
        lineItems: invoiceData.lineItems.map(item => ({
          id: Date.now().toString() + Math.random(),
          type: item.type, // placement_fee, retainer, hourly_rate, expense
          description: item.description,
          candidateName: item.candidateName,
          jobTitle: item.jobTitle,
          projectId: item.projectId,
          
          pricing: {
            quantity: item.pricing.quantity || 1,
            rate: item.pricing.rate,
            amount: item.pricing.quantity * item.pricing.rate,
            taxable: item.pricing.taxable || true
          },
          
          details: {
            placementDate: item.details?.placementDate,
            startDate: item.details?.startDate,
            annualSalary: item.details?.annualSalary,
            feePercentage: item.details?.feePercentage
          }
        })),
        
        totals: {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: invoiceData.discountAmount || 0,
          totalAmount: 0,
          amountDue: 0
        },
        
        payment: {
          status: 'pending',
          method: null,
          paidAmount: 0,
          paidDate: null,
          transactionId: null,
          
          schedule: invoiceData.paymentSchedule || null // For installment payments
        },
        
        tax: {
          taxRate: invoiceData.taxRate || 0,
          taxExempt: invoiceData.taxExempt || false,
          taxId: invoiceData.taxId
        },
        
        notes: {
          publicNotes: invoiceData.publicNotes || '',
          privateNotes: invoiceData.privateNotes || '',
          termsAndConditions: invoiceData.termsAndConditions || this.getDefaultTerms()
        },
        
        status: 'draft',
        
        workflow: {
          createdBy: invoiceData.createdBy,
          approvedBy: null,
          sentDate: null,
          lastReminderSent: null
        },
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Calculate totals
      invoice.totals = this.calculateInvoiceTotals(invoice);

      console.log(`Invoice created: ${invoice.invoiceNumber}`);
      return { success: true, invoice };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  async updateInvoiceStatus(invoiceId, status, paymentData) {
    try {
      console.log(`Updating invoice ${invoiceId} status to ${status}`);
      
      const update = {
        invoiceId,
        previousStatus: 'pending',
        newStatus: status,
        updatedAt: new Date().toISOString(),
        
        paymentDetails: status === 'paid' ? {
          paidAmount: paymentData.amount,
          paidDate: new Date().toISOString(),
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId,
          processingFee: paymentData.processingFee || 0
        } : null,
        
        notifications: {
          sendClientNotification: true,
          sendAccountManagerNotification: true,
          updateCRM: true
        }
      };

      return { success: true, update };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: error.message };
    }
  },

  // Payment Tracking
  async recordPayment(paymentData) {
    try {
      const payment = {
        id: Date.now().toString(),
        paymentNumber: `PAY-${Date.now()}`,
        
        invoiceId: paymentData.invoiceId,
        clientId: paymentData.clientId,
        
        amount: {
          gross: paymentData.amount.gross,
          processingFee: paymentData.amount.processingFee || 0,
          net: paymentData.amount.gross - (paymentData.amount.processingFee || 0)
        },
        
        method: {
          type: paymentData.method.type, // wire_transfer, credit_card, ach, check
          details: paymentData.method.details,
          processor: paymentData.method.processor
        },
        
        transaction: {
          id: paymentData.transaction.id,
          reference: paymentData.transaction.reference,
          authorizationCode: paymentData.transaction.authorizationCode,
          processingDate: new Date().toISOString()
        },
        
        reconciliation: {
          status: 'pending',
          reconciledDate: null,
          bankStatement: null,
          differences: []
        },
        
        metadata: {
          receivedBy: paymentData.receivedBy,
          notes: paymentData.notes || '',
          attachments: paymentData.attachments || []
        },
        
        createdAt: new Date().toISOString()
      };

      console.log(`Payment recorded: ${payment.paymentNumber}`);
      return { success: true, payment };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    }
  },

  async getPaymentHistory(clientId, timeframe) {
    try {
      const history = {
        clientId,
        timeframe,
        
        summary: {
          totalPayments: 25,
          totalAmount: 125000,
          avgPaymentTime: 18, // days
          onTimePayments: 22,
          latePayments: 3,
          onTimePercentage: 88
        },
        
        payments: [
          {
            id: 'pay_1',
            invoiceNumber: 'INV-20250915001',
            amount: 15000,
            dueDate: '2025-09-30',
            paidDate: '2025-09-28',
            daysEarly: 2,
            method: 'wire_transfer',
            status: 'cleared'
          },
          {
            id: 'pay_2',
            invoiceNumber: 'INV-20250901002',
            amount: 8500,
            dueDate: '2025-09-15',
            paidDate: '2025-09-18',
            daysLate: 3,
            method: 'ach',
            status: 'cleared'
          }
        ],
        
        trends: {
          averageAmount: 5000,
          paymentFrequency: 'bi-weekly',
          preferredMethod: 'wire_transfer',
          seasonalPatterns: []
        }
      };

      return { success: true, history };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { success: false, error: error.message };
    }
  },

  // Financial Reporting
  async generateFinancialReport(reportType, parameters) {
    try {
      console.log(`Generating financial report: ${reportType}`);
      
      let report = {};
      
      switch (reportType) {
        case 'revenue_summary':
          report = await this.generateRevenueSummary(parameters);
          break;
        case 'outstanding_invoices':
          report = await this.generateOutstandingInvoicesReport(parameters);
          break;
        case 'client_profitability':
          report = await this.generateClientProfitabilityReport(parameters);
          break;
        case 'cash_flow':
          report = await this.generateCashFlowReport(parameters);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      return { success: true, report };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return { success: false, error: error.message };
    }
  },

  async generateRevenueSummary(parameters) {
    return {
      period: parameters.period || 'current_month',
      
      revenue: {
        totalRevenue: 485000,
        placementFees: 425000,
        retainerFees: 45000,
        hourlyBilling: 15000,
        
        breakdown: {
          technology: 285000,
          healthcare: 125000,
          finance: 75000
        }
      },
      
      growth: {
        monthOverMonth: 12.5,
        yearOverYear: 28.3,
        quarterOverQuarter: 8.7
      },
      
      projections: {
        nextMonth: 520000,
        nextQuarter: 1650000,
        yearEnd: 6200000
      }
    };
  },

  async generateOutstandingInvoicesReport(parameters) {
    return {
      summary: {
        totalOutstanding: 145000,
        invoiceCount: 15,
        averageAge: 22,
        
        aging: {
          current: 85000,
          thirtyDays: 35000,
          sixtyDays: 15000,
          ninetyDaysPlus: 10000
        }
      },
      
      riskAssessment: {
        lowRisk: 110000,
        mediumRisk: 25000,
        highRisk: 10000
      },
      
      topOutstanding: [
        {
          clientName: 'TechCorp Solutions',
          amount: 35000,
          daysOutstanding: 45,
          riskLevel: 'medium'
        },
        {
          clientName: 'Global Finance Inc',
          amount: 25000,
          daysOutstanding: 15,
          riskLevel: 'low'
        }
      ]
    };
  },

  // Contract Management Integration
  async linkInvoiceToContract(invoiceId, contractId, milestone) {
    try {
      const link = {
        invoiceId,
        contractId,
        milestone,
        linkedAt: new Date().toISOString(),
        
        contractDetails: {
          paymentSchedule: 'milestone_based',
          milestoneDescription: milestone.description,
          completionDate: milestone.completionDate,
          approvalRequired: milestone.approvalRequired
        }
      };

      console.log(`Invoice ${invoiceId} linked to contract ${contractId}`);
      return { success: true, link };
    } catch (error) {
      console.error('Error linking invoice to contract:', error);
      return { success: false, error: error.message };
    }
  },

  // Resource Utilization Reporting
  async getResourceUtilizationReport(timeframe) {
    try {
      const report = {
        timeframe,
        
        overview: {
          totalClients: 45,
          activeProjects: 28,
          totalCandidates: 1250,
          avgCandidatesPerClient: 28,
          totalRevenue: 1875000
        },
        
        clientMetrics: [
          {
            clientName: 'TechCorp Solutions',
            candidatesProcessed: 125,
            projectsCompleted: 8,
            revenue: 285000,
            profitMargin: 42,
            successRate: 85,
            resourceIntensity: 'high'
          },
          {
            clientName: 'Healthcare Plus',
            candidatesProcessed: 89,
            projectsCompleted: 5,
            revenue: 175000,
            profitMargin: 38,
            successRate: 78,
            resourceIntensity: 'medium'
          }
        ],
        
        efficiency: {
          avgCandidatesPerPlacement: 8.5,
          avgTimeToPlacement: 21,
          recruiterUtilization: 78,
          costPerPlacement: 3500
        },
        
        trends: {
          candidateVolumeGrowth: 15.2,
          clientRetentionRate: 92,
          avgProjectValue: 35000,
          revenuePer Candidate: 1500
        }
      };

      return { success: true, report };
    } catch (error) {
      console.error('Error generating resource utilization report:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper Methods
  calculateDueDate(paymentTerms) {
    const days = parseInt(paymentTerms.split('_')[1]) || 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  },

  calculateInvoiceTotals(invoice) {
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.pricing.amount, 0);
    const taxAmount = invoice.tax.taxExempt ? 0 : subtotal * (invoice.tax.taxRate || 0);
    const totalAmount = subtotal + taxAmount - (invoice.totals.discountAmount || 0);
    
    return {
      subtotal,
      taxAmount,
      discountAmount: invoice.totals.discountAmount || 0,
      totalAmount,
      amountDue: totalAmount
    };
  },

  getDefaultTerms() {
    return `Payment is due within 30 days of invoice date. Late payments subject to 1.5% monthly service charge. All fees are non-refundable once services are rendered.`;
  }
};

module.exports = BillingService;