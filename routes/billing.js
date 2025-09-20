const express = require('express');
const router = express.Router();
const BillingService = require('../services/billingService');

// Client Account Management Routes
router.post('/client-accounts', async (req, res) => {
  try {
    const result = await BillingService.createClientAccount(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/client-accounts', async (req, res) => {
  try {
    const { status, tier, industry } = req.query;
    
    // Simulate client account list
    const accounts = [
      {
        id: 'account_1',
        accountNumber: 'AC-20250101001',
        companyName: 'TechCorp Solutions',
        industry: 'Technology',
        tier: 'Premium',
        status: 'active',
        totalRevenue: 485000,
        outstandingBalance: 25000,
        lastActivity: '2025-09-20T10:30:00Z'
      },
      {
        id: 'account_2',
        accountNumber: 'AC-20250115002',
        companyName: 'Healthcare Plus',
        industry: 'Healthcare',
        tier: 'Enterprise',
        status: 'active',
        totalRevenue: 325000,
        outstandingBalance: 0,
        lastActivity: '2025-09-19T14:15:00Z'
      }
    ].filter(account => {
      let matches = true;
      if (status) matches = matches && account.status === status;
      if (tier) matches = matches && account.tier === tier;
      if (industry) matches = matches && account.industry === industry;
      return matches;
    });

    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/client-accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Simulate detailed client account
    const account = {
      id: accountId,
      accountNumber: 'AC-20250101001',
      
      companyInfo: {
        name: 'TechCorp Solutions',
        legalName: 'TechCorp Solutions Inc.',
        industry: 'Technology',
        size: '500-1000 employees',
        website: 'https://techcorp.com',
        taxId: '12-3456789',
        
        addresses: {
          billing: {
            street: '123 Tech Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94107',
            country: 'USA'
          },
          headquarters: {
            street: '123 Tech Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94107',
            country: 'USA'
          }
        }
      },
      
      contacts: {
        primary: {
          name: 'Sarah Johnson',
          title: 'HR Director',
          email: 'sarah.johnson@techcorp.com',
          phone: '+1-555-0123'
        },
        billing: {
          name: 'Mike Finance',
          title: 'Controller',
          email: 'finance@techcorp.com',
          phone: '+1-555-0124'
        }
      },
      
      financial: {
        creditLimit: 100000,
        paymentTerms: 'net_30',
        currency: 'USD',
        taxExempt: false,
        
        bankingInfo: {
          preferredPaymentMethod: 'wire_transfer',
          accountDetails: {
            routingNumber: '123456789',
            accountNumber: '***7890'
          }
        }
      },
      
      serviceLevel: {
        tier: 'Premium',
        dedicatedManager: true,
        prioritySupport: true,
        customReporting: true
      },
      
      metrics: {
        totalRevenue: 485000,
        outstandingBalance: 25000,
        creditUtilization: 25,
        avgProjectValue: 32333,
        totalProjects: 15,
        onTimePaymentRate: 94
      },
      
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      lastUpdate: '2025-09-15T10:30:00Z'
    };

    res.json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/client-accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await BillingService.updateClientAccount(accountId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invoice Management Routes
router.post('/invoices', async (req, res) => {
  try {
    const result = await BillingService.createInvoice(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const { clientId, status, dateFrom, dateTo } = req.query;
    
    // Simulate invoice list
    const invoices = [
      {
        id: 'invoice_1',
        invoiceNumber: 'INV-20250920001',
        clientId: 'client_1',
        totalAmount: 25000,
        amountDue: 25000,
        status: 'pending',
        issueDate: '2025-09-20T00:00:00Z',
        dueDate: '2025-10-20T00:00:00Z'
      },
      {
        id: 'invoice_2',
        invoiceNumber: 'INV-20250915002',
        clientId: 'client_1',
        totalAmount: 15000,
        amountDue: 0,
        status: 'paid',
        issueDate: '2025-09-15T00:00:00Z',
        dueDate: '2025-10-15T00:00:00Z',
        paidDate: '2025-10-12T00:00:00Z'
      }
    ].filter(invoice => {
      let matches = true;
      if (clientId) matches = matches && invoice.clientId === clientId;
      if (status) matches = matches && invoice.status === status;
      // Date filtering logic would go here
      return matches;
    });

    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Simulate detailed invoice
    const invoice = {
      id: invoiceId,
      invoiceNumber: 'INV-20250920001',
      clientId: 'client_1',
      
      invoiceDetails: {
        issueDate: '2025-09-20T00:00:00Z',
        dueDate: '2025-10-20T00:00:00Z',
        currency: 'USD',
        paymentTerms: 'net_30'
      },
      
      lineItems: [
        {
          id: 'line_1',
          type: 'placement_fee',
          description: 'Senior Software Engineer placement - John Doe',
          candidateName: 'John Doe',
          jobTitle: 'Senior Software Engineer',
          projectId: 'proj_1',
          pricing: {
            quantity: 1,
            rate: 25000,
            amount: 25000,
            taxable: true
          },
          details: {
            placementDate: '2025-09-15T00:00:00Z',
            annualSalary: 140000,
            feePercentage: 17.86
          }
        }
      ],
      
      totals: {
        subtotal: 25000,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 25000,
        amountDue: 25000
      },
      
      payment: {
        status: 'pending',
        paidAmount: 0,
        schedule: null
      },
      
      notes: {
        publicNotes: 'Payment due within 30 days of placement start date.',
        privateNotes: 'Client requested expedited placement - bonus applicable.',
        termsAndConditions: 'Payment is due within 30 days of invoice date...'
      },
      
      status: 'pending',
      createdAt: '2025-09-20T10:00:00Z'
    };

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/invoices/:invoiceId/status', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status, paymentData } = req.body;
    const result = await BillingService.updateInvoiceStatus(invoiceId, status, paymentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment Management Routes
router.post('/payments', async (req, res) => {
  try {
    const result = await BillingService.recordPayment(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const { clientId, invoiceId, status } = req.query;
    
    // Simulate payment list
    const payments = [
      {
        id: 'payment_1',
        paymentNumber: 'PAY-20251012001',
        invoiceId: 'invoice_2',
        clientId: 'client_1',
        amount: 15000,
        method: 'wire_transfer',
        status: 'cleared',
        processingDate: '2025-10-12T00:00:00Z'
      },
      {
        id: 'payment_2',
        paymentNumber: 'PAY-20250928002',
        invoiceId: 'invoice_3',
        clientId: 'client_1',
        amount: 8500,
        method: 'ach',
        status: 'pending',
        processingDate: '2025-09-28T00:00:00Z'
      }
    ].filter(payment => {
      let matches = true;
      if (clientId) matches = matches && payment.clientId === clientId;
      if (invoiceId) matches = matches && payment.invoiceId === invoiceId;
      if (status) matches = matches && payment.status === status;
      return matches;
    });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Simulate detailed payment
    const payment = {
      id: paymentId,
      paymentNumber: 'PAY-20251012001',
      invoiceId: 'invoice_2',
      clientId: 'client_1',
      
      amount: {
        gross: 15000,
        processingFee: 45,
        net: 14955
      },
      
      method: {
        type: 'wire_transfer',
        details: {
          bankName: 'First National Bank',
          routingNumber: '123456789',
          accountNumber: '***7890'
        },
        processor: 'internal'
      },
      
      transaction: {
        id: 'txn_20251012001',
        reference: 'WR-TechCorp-20251012',
        authorizationCode: 'AUTH123456',
        processingDate: '2025-10-12T14:30:00Z'
      },
      
      reconciliation: {
        status: 'reconciled',
        reconciledDate: '2025-10-13T09:00:00Z',
        bankStatement: 'stmt_20251013.pdf',
        differences: []
      },
      
      metadata: {
        receivedBy: 'finance_team_1',
        notes: 'Payment received on time via wire transfer',
        attachments: ['wire_confirmation.pdf']
      },
      
      createdAt: '2025-10-12T14:30:00Z'
    };

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clients/:clientId/payment-history', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { timeframe } = req.query;
    const result = await BillingService.getPaymentHistory(clientId, timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Financial Reporting Routes
router.get('/reports/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const result = await BillingService.generateFinancialReport(reportType, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/revenue/summary', async (req, res) => {
  try {
    const { period, clientId, department } = req.query;
    
    // Simulate revenue summary
    const summary = {
      period: period || 'current_month',
      
      totalRevenue: 485000,
      breakdown: {
        placementFees: 425000,
        retainerFees: 45000,
        hourlyBilling: 15000
      },
      
      byClient: [
        { clientName: 'TechCorp Solutions', revenue: 285000, percentage: 58.8 },
        { clientName: 'Healthcare Plus', revenue: 125000, percentage: 25.8 },
        { clientName: 'Finance Corp', revenue: 75000, percentage: 15.5 }
      ],
      
      growth: {
        monthOverMonth: 12.5,
        yearOverYear: 28.3
      },
      
      projections: {
        nextMonth: 520000,
        nextQuarter: 1650000
      }
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/outstanding-invoices', async (req, res) => {
  try {
    const { clientId, aging } = req.query;
    
    // Simulate outstanding invoices report
    const report = {
      summary: {
        totalOutstanding: 145000,
        invoiceCount: 15,
        averageAge: 22
      },
      
      aging: {
        current: 85000,
        thirtyDays: 35000,
        sixtyDays: 15000,
        ninetyDaysPlus: 10000
      },
      
      byClient: [
        {
          clientName: 'TechCorp Solutions',
          outstanding: 35000,
          invoiceCount: 3,
          oldestInvoice: 45,
          riskLevel: 'medium'
        },
        {
          clientName: 'Global Finance',
          outstanding: 25000,
          invoiceCount: 2,
          oldestInvoice: 15,
          riskLevel: 'low'
        }
      ]
    };

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resource Utilization Reporting
router.get('/reports/resource-utilization', async (req, res) => {
  try {
    const { timeframe } = req.query;
    const result = await BillingService.getResourceUtilizationReport(timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contract Integration
router.post('/invoices/:invoiceId/link-contract', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { contractId, milestone } = req.body;
    const result = await BillingService.linkInvoiceToContract(invoiceId, contractId, milestone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Billing Analytics
router.get('/analytics/billing-performance', async (req, res) => {
  try {
    const { period, clientId } = req.query;
    
    // Simulate billing performance analytics
    const performance = {
      period: period || 'last_12_months',
      
      kpis: {
        totalBilled: 2850000,
        totalCollected: 2650000,
        collectionRate: 93,
        avgDaysToPayment: 18,
        badDebt: 15000,
        badDebtRate: 0.5
      },
      
      trends: {
        billingVolume: [
          { month: 'Jan', amount: 245000 },
          { month: 'Feb', amount: 285000 },
          { month: 'Mar', amount: 325000 }
        ],
        
        collectionTimes: [
          { month: 'Jan', days: 22 },
          { month: 'Feb', days: 19 },
          { month: 'Mar', days: 18 }
        ]
      },
      
      clientPerformance: [
        {
          clientName: 'TechCorp Solutions',
          billed: 485000,
          collected: 460000,
          avgPaymentTime: 18,
          rating: 'excellent'
        },
        {
          clientName: 'Healthcare Plus',
          billed: 325000,
          collected: 325000,
          avgPaymentTime: 15,
          rating: 'excellent'
        }
      ]
    };

    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export and Document Generation
router.post('/invoices/:invoiceId/generate-pdf', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Simulate PDF generation
    const document = {
      invoiceId,
      downloadUrl: `/api/documents/invoices/${invoiceId}.pdf`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reports/export', async (req, res) => {
  try {
    const { reportType, format, parameters } = req.body;
    
    // Simulate report export
    const export_ = {
      reportType,
      format, // csv, xlsx, pdf
      downloadUrl: `/api/documents/reports/${reportType}_${Date.now()}.${format}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, export: export_ });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;