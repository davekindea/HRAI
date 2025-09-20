const express = require('express');
const router = express.Router();
const compensationManagementService = require('../services/compensationManagementService');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create compensation adjustment request
router.post('/adjustments', async (req, res) => {
  try {
    const result = await compensationManagementService.createCompensationAdjustment(req.body);
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

// Get compensation adjustment requests
router.get('/adjustments', async (req, res) => {
  try {
    const { 
      status, 
      employeeId, 
      requestedBy, 
      adjustmentType,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Mock adjustment requests
    const adjustments = [
      {
        id: 'adj_001',
        employeeId: 'EMP123',
        employeeName: 'John Doe',
        adjustmentType: 'merit_increase',
        currentCompensation: 120000,
        proposedCompensation: 132000,
        adjustmentAmount: 12000,
        adjustmentPercentage: 10,
        requestedBy: 'manager_001',
        requestedDate: '2025-09-15T10:00:00Z',
        effectiveDate: '2025-10-01',
        status: 'pending',
        justification: 'Excellent performance review and increased responsibilities'
      },
      {
        id: 'adj_002',
        employeeId: 'EMP456',
        employeeName: 'Jane Smith',
        adjustmentType: 'promotion',
        currentCompensation: 95000,
        proposedCompensation: 115000,
        adjustmentAmount: 20000,
        adjustmentPercentage: 21.05,
        requestedBy: 'manager_002',
        requestedDate: '2025-09-10T14:30:00Z',
        effectiveDate: '2025-10-01',
        status: 'approved',
        justification: 'Promotion to Senior Developer'
      }
    ];

    let filteredAdjustments = adjustments;

    if (status) {
      filteredAdjustments = filteredAdjustments.filter(adj => adj.status === status);
    }
    if (employeeId) {
      filteredAdjustments = filteredAdjustments.filter(adj => adj.employeeId === employeeId);
    }
    if (adjustmentType) {
      filteredAdjustments = filteredAdjustments.filter(adj => adj.adjustmentType === adjustmentType);
    }

    const total = filteredAdjustments.length;
    const startIndex = (page - 1) * limit;
    const paginatedAdjustments = filteredAdjustments.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        adjustments: paginatedAdjustments,
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

// Approve compensation change
router.post('/adjustments/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approverUserId, approvalLevel, approved, comments, conditions } = req.body;

    const params = {
      requestId,
      approverUserId,
      approvalLevel,
      approved,
      comments,
      conditions
    };

    const result = await compensationManagementService.approveCompensationChange(params);
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

// Process bonus payment
router.post('/bonuses', async (req, res) => {
  try {
    const result = await compensationManagementService.processBonusPayment(req.body);
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

// Get bonus history
router.get('/bonuses', async (req, res) => {
  try {
    const { employeeId, bonusType, year, page = 1, limit = 20 } = req.query;

    // Mock bonus history
    const bonuses = [
      {
        id: 'bonus_001',
        employeeId: 'EMP123',
        employeeName: 'John Doe',
        bonusType: 'performance',
        amount: 15000,
        performancePeriod: 'Q3 2025',
        performanceRating: 4.5,
        paymentDate: '2025-10-15',
        status: 'paid'
      },
      {
        id: 'bonus_002',
        employeeId: 'EMP123',
        employeeName: 'John Doe',
        bonusType: 'spot',
        amount: 2500,
        justification: 'Exceptional project delivery',
        paymentDate: '2025-08-30',
        status: 'paid'
      }
    ];

    let filteredBonuses = bonuses;
    if (employeeId) {
      filteredBonuses = filteredBonuses.filter(b => b.employeeId === employeeId);
    }
    if (bonusType) {
      filteredBonuses = filteredBonuses.filter(b => b.bonusType === bonusType);
    }

    res.json({
      success: true,
      data: {
        bonuses: filteredBonuses,
        totalAmount: filteredBonuses.reduce((sum, b) => sum + b.amount, 0)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Manage equity grants
router.post('/equity/grants', async (req, res) => {
  try {
    const result = await compensationManagementService.manageEquityGrant(req.body);
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

// Get equity grants
router.get('/equity/grants', async (req, res) => {
  try {
    const { employeeId, equityType, status } = req.query;

    // Mock equity grants
    const grants = [
      {
        id: 'equity_001',
        employeeId: 'EMP123',
        employeeName: 'John Doe',
        equityType: 'stock_options',
        grantDate: '2023-06-01',
        grantAmount: 2000,
        strikePrice: 25.00,
        currentValuation: 45.00,
        vestedAmount: 500,
        unvestedAmount: 1500,
        currentValue: 40000,
        status: 'active'
      }
    ];

    let filteredGrants = grants;
    if (employeeId) {
      filteredGrants = filteredGrants.filter(g => g.employeeId === employeeId);
    }
    if (equityType) {
      filteredGrants = filteredGrants.filter(g => g.equityType === equityType);
    }

    res.json({
      success: true,
      data: {
        grants: filteredGrants,
        totalCurrentValue: filteredGrants.reduce((sum, g) => sum + g.currentValue, 0)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Process commissions
router.post('/commissions', async (req, res) => {
  try {
    const result = await compensationManagementService.processCommissions(req.body);
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

// Get commission history
router.get('/commissions', async (req, res) => {
  try {
    const { employeeId, period, year } = req.query;

    // Mock commission history
    const commissions = [
      {
        id: 'comm_001',
        employeeId: 'EMP789',
        employeeName: 'Sales Rep',
        period: 'Q3 2025',
        totalSales: 500000,
        qualifyingSales: 450000,
        commissionRate: 0.05,
        totalCommission: 22500,
        status: 'paid',
        paymentDate: '2025-10-15'
      }
    ];

    let filteredCommissions = commissions;
    if (employeeId) {
      filteredCommissions = filteredCommissions.filter(c => c.employeeId === employeeId);
    }

    res.json({
      success: true,
      data: {
        commissions: filteredCommissions,
        totalCommission: filteredCommissions.reduce((sum, c) => sum + c.totalCommission, 0)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Conduct compensation analysis
router.post('/analysis/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { analysisType, includeMarketData, includePeerComparison, includeProjections } = req.body;

    const params = {
      employeeId,
      analysisType,
      includeMarketData,
      includePeerComparison,
      includeProjections
    };

    const result = await compensationManagementService.conductCompensationAnalysis(params);
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

// Generate compensation statement
router.post('/statement/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { statementYear, includeProjections, includeEquityDetails } = req.body;

    const params = {
      employeeId,
      statementYear,
      includeProjections,
      includeEquityDetails
    };

    const result = await compensationManagementService.generateCompensationStatement(params);
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

// Get compensation summary
router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Mock compensation summary
    const summary = {
      employeeId,
      employeeName: 'John Doe',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      
      currentCompensation: {
        baseSalary: 145000,
        targetBonus: 25000,
        totalCash: 170000,
        equityValue: 75000,
        totalCompensation: 245000
      },
      
      lastReview: {
        date: '2025-06-01',
        rating: 4.5,
        increase: 8.5,
        nextReview: '2026-06-01'
      },
      
      marketPosition: {
        baseSalaryPercentile: 65,
        totalCompPercentile: 70,
        marketGap: -5000
      },
      
      upcomingActions: [
        {
          type: 'salary_review',
          dueDate: '2026-06-01',
          description: 'Annual salary review due'
        }
      ]
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get compensation budget
router.get('/budget', async (req, res) => {
  try {
    const { department, year = new Date().getFullYear() } = req.query;

    // Mock budget data
    const budget = {
      year,
      department: department || 'All',
      
      salaryBudget: {
        allocated: 15000000,
        utilized: 12750000,
        remaining: 2250000,
        utilizationRate: 85
      },
      
      bonusBudget: {
        allocated: 2250000,
        utilized: 1800000,
        remaining: 450000,
        utilizationRate: 80
      },
      
      equityBudget: {
        allocated: 1000000,
        utilized: 750000,
        remaining: 250000,
        utilizationRate: 75
      },
      
      monthlySpend: [
        { month: 'Jan', salary: 1062500, bonus: 150000, equity: 62500 },
        { month: 'Feb', salary: 1062500, bonus: 150000, equity: 62500 },
        { month: 'Mar', salary: 1062500, bonus: 150000, equity: 62500 }
      ],
      
      projectedYearEnd: {
        salary: 14500000,
        bonus: 2100000,
        equity: 900000,
        total: 17500000
      }
    };

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get pay equity analysis
router.get('/pay-equity', async (req, res) => {
  try {
    const { department, jobTitle, analysisType = 'gender' } = req.query;

    // Mock pay equity analysis
    const analysis = {
      analysisType,
      analysisDate: new Date().toISOString(),
      department: department || 'All',
      jobTitle: jobTitle || 'All',
      
      summary: {
        totalEmployees: 500,
        payGap: 2.3, // percentage
        adjustedPayGap: 1.1, // percentage after controlling for variables
        statisticalSignificance: 'not_significant'
      },
      
      breakdown: {
        male: {
          count: 275,
          avgSalary: 125000,
          medianSalary: 120000
        },
        female: {
          count: 200,
          avgSalary: 122000,
          medianSalary: 118000
        },
        nonBinary: {
          count: 25,
          avgSalary: 123000,
          medianSalary: 119000
        }
      },
      
      recommendations: [
        {
          priority: 'medium',
          action: 'Review compensation for identified outliers',
          affectedEmployees: 12
        },
        {
          priority: 'low',
          action: 'Continue monitoring pay equity trends',
          affectedEmployees: 0
        }
      ]
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate retention risk
router.get('/retention-risk', async (req, res) => {
  try {
    const { department, riskLevel } = req.query;

    // Mock retention risk analysis
    const riskAnalysis = {
      analysisDate: new Date().toISOString(),
      department: department || 'All',
      
      summary: {
        highRisk: 25,
        mediumRisk: 75,
        lowRisk: 400,
        totalEmployees: 500
      },
      
      riskFactors: [
        { factor: 'Below market compensation', weight: 0.35, employees: 45 },
        { factor: 'No recent promotion', weight: 0.25, employees: 120 },
        { factor: 'Long tenure without raise', weight: 0.20, employees: 35 },
        { factor: 'Poor performance review', weight: 0.20, employees: 15 }
      ],
      
      atRiskEmployees: [
        {
          employeeId: 'EMP001',
          name: 'John Doe',
          riskLevel: 'high',
          riskScore: 85,
          primaryFactors: ['below_market_comp', 'no_promotion'],
          recommendations: ['Market adjustment', 'Career development plan']
        }
      ].filter(emp => !riskLevel || emp.riskLevel === riskLevel),
      
      retentionActions: [
        {
          action: 'Market adjustment reviews',
          targetEmployees: 45,
          estimatedCost: 2250000,
          priority: 'high'
        },
        {
          action: 'Promotion planning',
          targetEmployees: 120,
          estimatedCost: 1800000,
          priority: 'medium'
        }
      ]
    };

    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Export compensation data
router.post('/export', async (req, res) => {
  try {
    const { 
      exportType = 'compensation_summary',
      format = 'excel',
      filters = {},
      includePersonalInfo = false
    } = req.body;

    const exportData = {
      exportId: `comp_export_${Date.now()}`,
      exportType,
      format,
      filters,
      includePersonalInfo,
      status: 'processing',
      createdDate: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      downloadUrl: null
    };

    // Mock processing completion
    setTimeout(() => {
      exportData.status = 'completed';
      exportData.downloadUrl = `/api/compensation/download/${exportData.exportId}`;
    }, 3000);

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
