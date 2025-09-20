const express = require('express');
const router = express.Router();
const payrollProcessingService = require('../services/payrollProcessingService');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Process payroll for a pay period
router.post('/process', async (req, res) => {
  try {
    const result = await payrollProcessingService.processPayroll(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Process individual employee payroll
router.post('/process-employee', async (req, res) => {
  try {
    const result = await payrollProcessingService.processEmployeePayroll(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Approve payroll
router.post('/approve/:payrollId', async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { approverUserId, approvalNotes, overrides } = req.body;

    const params = {
      payrollId,
      approverUserId,
      approvalNotes,
      overrides
    };

    const result = await payrollProcessingService.approvePayroll(params);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get payroll status
router.get('/status/:payrollId', async (req, res) => {
  try {
    const { payrollId } = req.params;
    
    // Mock payroll status
    const status = {
      payrollId,
      status: 'processing',
      payPeriodStart: '2025-09-01',
      payPeriodEnd: '2025-09-15',
      payDate: '2025-09-20',
      employeeCount: 150,
      totalGrossPay: 750000,
      totalNetPay: 540000,
      processingSteps: [
        { step: 'data_validation', status: 'completed', timestamp: '2025-09-18T10:00:00Z' },
        { step: 'tax_calculations', status: 'completed', timestamp: '2025-09-18T10:15:00Z' },
        { step: 'deductions_processing', status: 'in_progress', timestamp: '2025-09-18T10:30:00Z' },
        { step: 'net_pay_calculation', status: 'pending', timestamp: null },
        { step: 'approval', status: 'pending', timestamp: null },
        { step: 'payment_processing', status: 'pending', timestamp: null }
      ],
      estimatedCompletion: '2025-09-18T16:00:00Z'
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Generate payroll reports
router.post('/reports/:payrollId', async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { reportTypes } = req.body;

    const params = {
      payrollId,
      reportTypes
    };

    const result = await payrollProcessingService.generatePayrollReports(params);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate employer liabilities
router.post('/employer-liabilities/:payrollId', async (req, res) => {
  try {
    const { payrollId } = req.params;
    const payrollRecord = await payrollProcessingService.getPayrollRecord(payrollId);
    const result = await payrollProcessingService.calculateEmployerLiabilities(payrollRecord);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get payroll history
router.get('/history', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      department,
      page = 1,
      limit = 20
    } = req.query;

    // Mock payroll history
    const history = [
      {
        payrollId: 'PAY_2025_18',
        payPeriodStart: '2025-09-01',
        payPeriodEnd: '2025-09-15',
        payDate: '2025-09-20',
        status: 'completed',
        employeeCount: 150,
        totalGrossPay: 750000,
        totalNetPay: 540000,
        processedBy: 'payroll_admin',
        processedDate: '2025-09-18T14:30:00Z'
      },
      {
        payrollId: 'PAY_2025_17',
        payPeriodStart: '2025-08-16',
        payPeriodEnd: '2025-08-31',
        payDate: '2025-09-05',
        status: 'completed',
        employeeCount: 148,
        totalGrossPay: 740000,
        totalNetPay: 533200,
        processedBy: 'payroll_admin',
        processedDate: '2025-09-03T14:30:00Z'
      }
    ];

    let filteredHistory = history;
    
    if (status) {
      filteredHistory = filteredHistory.filter(p => p.status === status);
    }

    if (startDate && endDate) {
      filteredHistory = filteredHistory.filter(p => 
        p.payDate >= startDate && p.payDate <= endDate
      );
    }

    const total = filteredHistory.length;
    const startIndex = (page - 1) * limit;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        payrolls: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get employee payroll details
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { payrollId, year } = req.query;

    if (payrollId) {
      // Get specific payroll details for employee
      const payrollDetails = {
        employeeId,
        payrollId,
        payPeriodStart: '2025-09-01',
        payPeriodEnd: '2025-09-15',
        payDate: '2025-09-20',
        grossPay: 5000,
        netPay: 3600,
        taxes: {
          federalIncome: 750,
          stateIncome: 250,
          socialSecurity: 310,
          medicare: 72.50
        },
        deductions: {
          healthInsurance: 200,
          dental: 25,
          retirement401k: 400,
          total: 625
        },
        ytdTotals: {
          grossPay: 90000,
          netPay: 64800,
          federalTax: 13500,
          stateTax: 4500,
          socialSecurity: 5580,
          medicare: 1305
        }
      };

      res.json({
        success: true,
        data: payrollDetails
      });
    } else {
      // Get employee's payroll summary
      const summary = {
        employeeId,
        year: year || new Date().getFullYear(),
        payrollCount: 18,
        ytdGrossPay: 90000,
        ytdNetPay: 64800,
        ytdTaxes: 24885,
        ytdDeductions: 11250,
        lastPayDate: '2025-09-20',
        lastPayAmount: 3600,
        avgPayAmount: 3600
      };

      res.json({
        success: true,
        data: summary
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Validate payroll data
router.post('/validate', async (req, res) => {
  try {
    const { payrollData } = req.body;
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      employeeValidations: []
    };

    // Validate payroll data structure
    if (!payrollData.payPeriodStart || !payrollData.payPeriodEnd) {
      validation.isValid = false;
      validation.errors.push('Pay period dates are required');
    }

    if (!payrollData.employees || payrollData.employees.length === 0) {
      validation.isValid = false;
      validation.errors.push('No employees found in payroll data');
    }

    // Validate each employee
    payrollData.employees?.forEach(employee => {
      const empValidation = {
        employeeId: employee.employeeId,
        isValid: true,
        errors: [],
        warnings: []
      };

      if (!employee.employeeId) {
        empValidation.isValid = false;
        empValidation.errors.push('Employee ID is required');
      }

      if (employee.hoursWorked < 0) {
        empValidation.isValid = false;
        empValidation.errors.push('Hours worked cannot be negative');
      }

      if (employee.hoursWorked > 80) {
        empValidation.warnings.push('Excessive hours worked (>80)');
      }

      if (employee.overtimeHours > 20) {
        empValidation.warnings.push('Excessive overtime hours (>20)');
      }

      if (!empValidation.isValid) {
        validation.isValid = false;
      }

      validation.employeeValidations.push(empValidation);
    });

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate payroll preview
router.post('/preview', async (req, res) => {
  try {
    const { payrollData } = req.body;
    
    // Generate preview calculations without saving
    const preview = {
      payPeriod: {
        start: payrollData.payPeriodStart,
        end: payrollData.payPeriodEnd,
        payDate: payrollData.payDate
      },
      employeeCount: payrollData.employees?.length || 0,
      estimatedTotals: {
        grossPay: 750000,
        netPay: 540000,
        taxes: 165000,
        deductions: 45000
      },
      warnings: [
        'Review overtime calculations for 5 employees',
        'Tax rates updated for current year'
      ],
      processingTime: '15-20 minutes estimated'
    };

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get tax calculation details
router.post('/tax-calculation', async (req, res) => {
  try {
    const { employeeId, grossWages, payPeriod } = req.body;
    
    // Mock tax calculation
    const taxCalculation = {
      employeeId,
      grossWages,
      payPeriod,
      taxes: {
        federal: {
          incomeTax: grossWages * 0.15,
          socialSecurity: grossWages * 0.062,
          medicare: grossWages * 0.0145
        },
        state: {
          incomeTax: grossWages * 0.05,
          sdi: grossWages * 0.009
        },
        local: {
          cityTax: grossWages * 0.01
        }
      },
      totalTaxes: grossWages * 0.2735,
      netPay: grossWages * 0.7265,
      calculationDate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: taxCalculation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Void/reverse payroll
router.post('/void/:payrollId', async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { reason, approverUserId } = req.body;

    // Mock void operation
    const voidResult = {
      payrollId,
      originalStatus: 'completed',
      newStatus: 'voided',
      voidReason: reason,
      voidedBy: approverUserId,
      voidedDate: new Date().toISOString(),
      affectedEmployees: 150,
      totalVoidedAmount: 540000,
      reversalTransactions: [
        {
          type: 'payroll_reversal',
          amount: 540000,
          status: 'pending'
        },
        {
          type: 'tax_reversal',
          amount: 165000,
          status: 'pending'
        }
      ]
    };

    res.json({
      success: true,
      data: voidResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get payroll configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      payFrequencies: ['weekly', 'biweekly', 'semimonthly', 'monthly'],
      payrollStatuses: ['draft', 'pending_approval', 'approved', 'processing', 'completed', 'failed'],
      maxOvertimeHours: 20,
      defaultTaxRates: {
        federal: {
          incomeTax: 0.15,
          socialSecurity: 0.062,
          medicare: 0.0145
        },
        state: {
          CA: { incomeTax: 0.05, sdi: 0.009 },
          TX: { incomeTax: 0.0 },
          NY: { incomeTax: 0.045, sdi: 0.005 }
        }
      },
      approvalWorkflow: {
        required: true,
        levels: ['manager', 'hr', 'finance'],
        thresholds: {
          manager: { amount: 100000 },
          hr: { amount: 500000 },
          finance: { amount: 1000000 }
        }
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
