const express = require('express');
const router = express.Router();
const benefitsManagementService = require('../services/benefitsManagementService');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get available benefits for an employee
router.get('/available/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { department, level, location, enrollmentPeriod, effectiveDate } = req.query;

    const params = {
      employeeId,
      department,
      level,
      location,
      enrollmentPeriod,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
    };

    const result = await benefitsManagementService.getAvailableBenefits(params);
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

// Enroll employee in benefits
router.post('/enroll', async (req, res) => {
  try {
    const result = await benefitsManagementService.enrollInBenefits(req.body);
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

// Get employee's current benefits
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await benefitsManagementService.getEmployeeBenefits(employeeId);
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

// Process life event
router.post('/life-event', async (req, res) => {
  try {
    const result = await benefitsManagementService.processLifeEvent(req.body);
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

// Generate benefits statement
router.post('/statement/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { statementYear, includeProjections } = req.body;

    const params = {
      employeeId,
      statementYear,
      includeProjections
    };

    const result = await benefitsManagementService.generateBenefitsStatement(params);
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

// Process COBRA event
router.post('/cobra', async (req, res) => {
  try {
    const result = await benefitsManagementService.processCOBRAEvent(req.body);
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

// Get benefits catalog
router.get('/catalog', async (req, res) => {
  try {
    const { category, provider, employeeType } = req.query;

    // Mock benefits catalog
    const catalog = {
      medical: [
        {
          id: 'health_ppo_premium',
          name: 'Premium PPO Health Plan',
          provider: 'Blue Cross Blue Shield',
          category: 'Medical',
          description: 'Comprehensive health coverage with nationwide network',
          features: ['$20 copay primary care', 'No referrals needed', 'Preventive care 100%'],
          tiers: {
            employee_only: { premium: 450, deductible: 500 },
            family: { premium: 1200, deductible: 1000 }
          }
        }
      ],
      dental: [
        {
          id: 'dental_comprehensive',
          name: 'Comprehensive Dental Plan',
          provider: 'Delta Dental',
          category: 'Dental',
          description: 'Full dental coverage including orthodontics',
          features: ['100% preventive', '80% basic', '50% major', 'Orthodontic coverage'],
          tiers: {
            employee_only: { premium: 25 },
            family: { premium: 75 }
          }
        }
      ],
      retirement: [
        {
          id: 'retirement_401k',
          name: '401(k) Retirement Plan',
          provider: 'Fidelity',
          category: 'Retirement',
          description: 'Tax-advantaged retirement savings with company match',
          features: ['6% company match', 'Immediate vesting', 'Loan provisions'],
          employerMatch: '100% of first 6%'
        }
      ]
    };

    let filteredCatalog = catalog;
    if (category) {
      filteredCatalog = { [category]: catalog[category] || [] };
    }

    res.json({
      success: true,
      data: {
        catalog: filteredCatalog,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate benefits costs
router.post('/calculate-costs', async (req, res) => {
  try {
    const { benefitSelections, employeeInfo } = req.body;
    
    let totalMonthlyCost = 0;
    let totalAnnualValue = 0;
    const costBreakdown = [];

    benefitSelections.forEach(selection => {
      // Mock cost calculation
      let monthlyCost = 0;
      let annualValue = 0;

      switch (selection.benefitId) {
        case 'health_ppo_premium':
          monthlyCost = selection.planTier === 'family' ? 300 : 150; // Employee portion
          annualValue = selection.planTier === 'family' ? 14400 : 5400; // Total value
          break;
        case 'dental_comprehensive':
          monthlyCost = selection.planTier === 'family' ? 75 : 25;
          annualValue = selection.planTier === 'family' ? 900 : 300;
          break;
        case 'retirement_401k':
          monthlyCost = (employeeInfo.monthlySalary || 5000) * (selection.contributionPercent / 100);
          annualValue = monthlyCost * 12;
          break;
      }

      totalMonthlyCost += monthlyCost;
      totalAnnualValue += annualValue;

      costBreakdown.push({
        benefitId: selection.benefitId,
        planTier: selection.planTier,
        monthlyCost,
        annualValue
      });
    });

    res.json({
      success: true,
      data: {
        totalMonthlyCost,
        totalAnnualValue,
        costBreakdown,
        payrollDeduction: totalMonthlyCost
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Validate benefit selection
router.post('/validate-selection', async (req, res) => {
  try {
    const { benefitId, planTier, employeeId, dependents } = req.body;
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic validation rules
    if (!benefitId) {
      validation.isValid = false;
      validation.errors.push('Benefit ID is required');
    }

    if (planTier && planTier.includes('family') && (!dependents || dependents.length === 0)) {
      validation.isValid = false;
      validation.errors.push('Family tier requires at least one dependent');
    }

    if (planTier === 'employee_spouse' && (!dependents || !dependents.some(d => d.relationship === 'spouse'))) {
      validation.isValid = false;
      validation.errors.push('Employee + Spouse tier requires spouse dependent');
    }

    // Add warnings for cost considerations
    if (planTier === 'family') {
      validation.warnings.push('Family coverage will result in higher payroll deductions');
    }

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

// Get enrollment periods
router.get('/enrollment-periods', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const enrollmentPeriods = {
      openEnrollment: {
        period: 'open_enrollment',
        name: 'Open Enrollment',
        startDate: `${currentYear}-11-01`,
        endDate: `${currentYear}-11-30`,
        effectiveDate: `${currentYear + 1}-01-01`,
        description: 'Annual open enrollment period for all benefits'
      },
      newHire: {
        period: 'new_hire',
        name: 'New Hire Enrollment',
        enrollmentWindow: 30, // days
        description: 'Enrollment window for newly hired employees'
      },
      qualifyingEvent: {
        period: 'qualifying_event',
        name: 'Qualifying Life Event',
        enrollmentWindow: 30, // days
        description: 'Special enrollment due to qualifying life events',
        qualifyingEvents: [
          'marriage',
          'divorce',
          'birth',
          'adoption',
          'death_of_spouse',
          'loss_of_coverage',
          'change_in_residence'
        ]
      }
    };

    res.json({
      success: true,
      data: enrollmentPeriods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get benefit summaries for dashboard
router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Mock summary data
    const summary = {
      employeeId,
      activeBenefits: 5,
      monthlyDeductions: 425,
      annualBenefitValue: 18500,
      employerContributions: 12750,
      upcomingDeadlines: [
        {
          type: 'open_enrollment',
          deadline: `${new Date().getFullYear()}-11-30`,
          description: 'Open enrollment deadline'
        }
      ],
      recentActivity: [
        {
          date: new Date().toISOString(),
          action: 'Updated 401(k) contribution',
          description: 'Increased contribution to 8%'
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

// Get benefits history
router.get('/history/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, benefitType } = req.query;

    // Mock benefits history
    const history = [
      {
        id: 'hist_001',
        date: '2025-01-01',
        action: 'enrolled',
        benefitName: 'Premium PPO Health Plan',
        planTier: 'family',
        effectiveDate: '2025-01-01',
        status: 'active'
      },
      {
        id: 'hist_002', 
        date: '2025-06-15',
        action: 'updated',
        benefitName: '401(k) Retirement Plan',
        description: 'Increased contribution from 6% to 8%',
        effectiveDate: '2025-07-01',
        status: 'active'
      }
    ];

    let filteredHistory = history;
    if (year) {
      filteredHistory = history.filter(h => h.date.startsWith(year));
    }
    if (benefitType) {
      filteredHistory = filteredHistory.filter(h => 
        h.benefitName.toLowerCase().includes(benefitType.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        employeeId,
        history: filteredHistory,
        totalRecords: filteredHistory.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Export benefits data
router.post('/export/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', includeHistory = false } = req.body;

    const exportData = {
      exportId: `export_${Date.now()}`,
      employeeId,
      format,
      status: 'processing',
      createdDate: new Date().toISOString(),
      downloadUrl: null
    };

    // In real implementation, would queue export job
    setTimeout(() => {
      exportData.status = 'completed';
      exportData.downloadUrl = `/api/benefits/download/${exportData.exportId}`;
    }, 2000);

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
