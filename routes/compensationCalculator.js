const express = require('express');
const router = express.Router();
const compensationCalculatorService = require('../services/compensationCalculatorService');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Calculate base salary components
router.post('/calculate/base-salary', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateBaseSalary(req.body);
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

// Calculate tax deductions
router.post('/calculate/tax-deductions', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateTaxDeductions(req.body);
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

// Calculate benefits package value
router.post('/calculate/benefits-package', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateBenefitsPackage(req.body);
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

// Calculate total compensation package
router.post('/calculate/total-compensation', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateTotalCompensation(req.body);
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

// Compare multiple compensation offers
router.post('/compare-offers', async (req, res) => {
  try {
    const { offers } = req.body;
    const result = await compensationCalculatorService.compareOffers(offers);
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

// Calculate cost of living adjustment
router.post('/calculate/cola-adjustment', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateCOLAdjustment(req.body);
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

// Analyze salary bands
router.post('/analyze/salary-bands', async (req, res) => {
  try {
    const result = await compensationCalculatorService.analyzeSalaryBands(req.body);
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

// Calculate equity value
router.post('/calculate/equity-value', async (req, res) => {
  try {
    const result = await compensationCalculatorService.calculateEquityValue(req.body);
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

// Batch calculation endpoint for multiple compensation scenarios
router.post('/calculate/batch', async (req, res) => {
  try {
    const { calculations } = req.body;
    const results = [];

    for (const calc of calculations) {
      let result;
      switch (calc.type) {
        case 'base_salary':
          result = await compensationCalculatorService.calculateBaseSalary(calc.params);
          break;
        case 'total_compensation':
          result = await compensationCalculatorService.calculateTotalCompensation(calc.params);
          break;
        case 'tax_deductions':
          result = await compensationCalculatorService.calculateTaxDeductions(calc.params);
          break;
        default:
          result = { error: `Unknown calculation type: ${calc.type}` };
      }
      
      results.push({
        id: calc.id,
        type: calc.type,
        result
      });
    }

    res.json({
      success: true,
      data: {
        calculations: results
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get calculation templates
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      baseSalary: {
        name: 'Base Salary Calculator',
        description: 'Calculate base salary components',
        parameters: ['annualSalary', 'payFrequency', 'workingHours', 'overtimeEligible']
      },
      totalCompensation: {
        name: 'Total Compensation Calculator',
        description: 'Calculate complete compensation package',
        parameters: ['baseSalary', 'bonusTarget', 'equityValue', 'benefits', 'location']
      },
      colaAdjustment: {
        name: 'Cost of Living Adjustment',
        description: 'Calculate location-based salary adjustments',
        parameters: ['baseSalary', 'fromLocation', 'toLocation']
      }
    };

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get market data for salary analysis
router.get('/market-data/:jobTitle', async (req, res) => {
  try {
    const { jobTitle } = req.params;
    const { location, experience, level } = req.query;

    // Mock market data (in real implementation, would integrate with market data providers)
    const marketData = {
      jobTitle,
      location: location || 'National',
      experience: experience || 'all',
      level: level || 'all',
      data: {
        baseSalary: {
          p25: 85000,
          p50: 105000,
          p75: 125000,
          p90: 145000
        },
        totalCompensation: {
          p25: 110000,
          p50: 135000,
          p75: 165000,
          p90: 195000
        },
        lastUpdated: new Date().toISOString(),
        sampleSize: 1250
      }
    };

    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate calculation inputs
router.post('/validate', async (req, res) => {
  try {
    const { calculationType, parameters } = req.body;
    const validationRules = {
      base_salary: ['annualSalary', 'payFrequency'],
      total_compensation: ['baseSalary'],
      tax_deductions: ['annualSalary', 'state', 'filingStatus']
    };

    const requiredParams = validationRules[calculationType] || [];
    const missingParams = requiredParams.filter(param => !(param in parameters));

    const validation = {
      isValid: missingParams.length === 0,
      missingParameters: missingParams,
      warnings: []
    };

    // Add specific validations
    if (parameters.annualSalary && parameters.annualSalary < 0) {
      validation.isValid = false;
      validation.warnings.push('Annual salary cannot be negative');
    }

    if (parameters.payFrequency && !['weekly', 'biweekly', 'semimonthly', 'monthly'].includes(parameters.payFrequency)) {
      validation.isValid = false;
      validation.warnings.push('Invalid pay frequency');
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

module.exports = router;
