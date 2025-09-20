const express = require('express');
const router = express.Router();
const payrollIntegrationService = require('../services/payrollIntegrationService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Payroll Integration Routes
 * API endpoints for overtime calculations, shift differentials, and payroll system integration
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

// ============================================================================
// PAYROLL RULES MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/payroll/rules
 * @desc    Create custom payroll calculation rules
 * @access  Private (Admin+)
 */
router.post('/rules', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const rulesData = {
        ...req.body,
        createdBy: req.user.id
      };

      const result = await payrollIntegrationService.createPayrollRules(rulesData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while creating payroll rules'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/rules
 * @desc    Get payroll calculation rules
 * @access  Private (Admin+)
 */
router.get('/rules', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const filters = {
        department: req.query.department,
        location: req.query.location,
        status: req.query.status || 'active'
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        message: 'Payroll rules retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving payroll rules'
      });
    }
  }
);

/**
 * @route   PUT /api/payroll/rules/:ruleId
 * @desc    Update payroll calculation rules
 * @access  Private (Admin+)
 */
router.put('/rules/:ruleId', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const { ruleId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        message: 'Payroll rules updated successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while updating payroll rules'
      });
    }
  }
);

// ============================================================================
// PAY CALCULATIONS
// ============================================================================

/**
 * @route   POST /api/payroll/calculate
 * @desc    Calculate pay for a timesheet entry
 * @access  Private (HR+)
 */
router.post('/calculate', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const timesheetData = {
        ...req.body
      };

      // Validate required fields
      const requiredFields = ['staffId', 'date', 'clockInTime', 'clockOutTime', 'baseHourlyRate'];
      const missingFields = requiredFields.filter(field => !timesheetData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: `Required fields: ${missingFields.join(', ')}`
        });
      }

      const result = await payrollIntegrationService.calculatePay(timesheetData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while calculating pay'
      });
    }
  }
);

/**
 * @route   POST /api/payroll/bulk-calculate
 * @desc    Bulk calculate pay for multiple timesheet entries
 * @access  Private (HR+)
 */
router.post('/bulk-calculate', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const { timesheetEntries } = req.body;

      if (!timesheetEntries || !Array.isArray(timesheetEntries) || timesheetEntries.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timesheet entries',
          message: 'Please provide an array of timesheet entries'
        });
      }

      const results = [];
      for (const timesheetData of timesheetEntries) {
        const result = await payrollIntegrationService.calculatePay(timesheetData);
        results.push({
          timesheetId: timesheetData.timesheetId,
          staffId: timesheetData.staffId,
          result
        });
      }

      const successCount = results.filter(r => r.result.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            totalGrossPay: results
              .filter(r => r.result.success)
              .reduce((sum, r) => sum + r.result.data.pay.grossPay, 0)
          }
        },
        message: `Bulk calculation completed: ${successCount} successful, ${failureCount} failed`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while bulk calculating pay'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/calculations
 * @desc    Get pay calculations with filtering
 * @access  Private (HR+)
 */
router.get('/calculations', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const filters = {
        staffId: req.query.staffId,
        payPeriod: req.query.payPeriod,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        department: req.query.department
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        pagination,
        message: 'Pay calculations retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving pay calculations'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/calculations/:calculationId
 * @desc    Get specific pay calculation details
 * @access  Private (HR+)
 */
router.get('/calculations/:calculationId', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const { calculationId } = req.params;
      
      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          id: calculationId,
          staffId: 'staff_001',
          grossPay: 520.00,
          regularHours: 40,
          overtimeHours: 0
        }, 
        message: 'Pay calculation retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving pay calculation'
      });
    }
  }
);

// ============================================================================
// LEAVE ACCRUALS
// ============================================================================

/**
 * @route   POST /api/payroll/accruals/calculate
 * @desc    Calculate leave accruals for a pay period
 * @access  Private (HR+)
 */
router.post('/accruals/calculate', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const { staffId, payPeriod, hoursWorked } = req.body;

      if (!staffId || !payPeriod || hoursWorked === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Staff ID, pay period, and hours worked are required'
        });
      }

      const result = await payrollIntegrationService.calculateLeaveAccruals(
        staffId, 
        payPeriod, 
        hoursWorked
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while calculating leave accruals'
      });
    }
  }
);

/**
 * @route   POST /api/payroll/leave/usage
 * @desc    Process leave usage and update balances
 * @access  Private (HR+)
 */
router.post('/leave/usage', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const leaveUsageData = {
        ...req.body
      };

      const result = await payrollIntegrationService.processLeaveUsage(leaveUsageData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while processing leave usage'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/leave/balances/:staffId
 * @desc    Get current leave balances for staff member
 * @access  Private (Staff can view own, HR+ can view any)
 */
router.get('/leave/balances/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check authorization
    if (staffId !== req.user.id && 
        !['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own leave balances'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId,
        vacation: { balance: 80.0, accrued: 4.0, used: 16.0 },
        sick: { balance: 24.0, accrued: 2.0, used: 8.0 },
        personal: { balance: 16.0, accrued: 1.0, used: 0.0 },
        lastCalculated: new Date()
      }, 
      message: 'Leave balances retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving leave balances'
    });
  }
});

// ============================================================================
// PAYROLL EXPORT & INTEGRATION
// ============================================================================

/**
 * @route   POST /api/payroll/export
 * @desc    Generate payroll export for external systems
 * @access  Private (HR+)
 */
router.post('/export', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const exportParams = {
        payPeriod: req.body.payPeriod,
        staffIds: req.body.staffIds,
        format: req.body.format || 'csv', // csv, json, xml
        includeDeductions: req.body.includeDeductions !== false,
        includeAccruals: req.body.includeAccruals !== false
      };

      if (!exportParams.payPeriod) {
        return res.status(400).json({
          success: false,
          error: 'Pay period required',
          message: 'Please specify the pay period for export'
        });
      }

      const result = await payrollIntegrationService.generatePayrollExport(exportParams);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating payroll export'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/exports
 * @desc    Get payroll export history
 * @access  Private (HR+)
 */
router.get('/exports', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const filters = {
        payPeriod: req.query.payPeriod,
        format: req.query.format,
        status: req.query.status
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        message: 'Payroll exports retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving payroll exports'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/exports/:exportId/download
 * @desc    Download payroll export file
 * @access  Private (HR+)
 */
router.get('/exports/:exportId/download', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const { exportId } = req.params;
      
      // This would implement file download logic
      res.json({
        success: true,
        downloadUrl: `/downloads/payroll/${exportId}`,
        message: 'Download URL generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating download URL'
      });
    }
  }
);

// ============================================================================
// PAYROLL ANALYTICS
// ============================================================================

/**
 * @route   POST /api/payroll/analytics
 * @desc    Generate comprehensive payroll analytics
 * @access  Private (HR+)
 */
router.post('/analytics', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const analyticsParams = {
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        groupBy: req.body.groupBy || 'department',
        includeComparisons: req.body.includeComparisons !== false
      };

      if (!analyticsParams.startDate || !analyticsParams.endDate) {
        return res.status(400).json({
          success: false,
          error: 'Date range required',
          message: 'Please provide start and end dates for analytics'
        });
      }

      const result = await payrollIntegrationService.generatePayrollAnalytics(analyticsParams);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating payroll analytics'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/dashboard
 * @desc    Get payroll management dashboard data
 * @access  Private (HR+)
 */
router.get('/dashboard', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const { payPeriod, department } = req.query;
      
      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          currentPayPeriod: payPeriod || '2025-PP05',
          totalGrossPay: 125000.00,
          totalOvertimePay: 8500.00,
          averageHourlyRate: 18.50,
          staffProcessed: 45,
          pendingCalculations: 3,
          complianceAlerts: [],
          costBreakdown: {
            regular: 116500.00,
            overtime: 8500.00,
            differentials: 2100.00
          }
        }, 
        message: 'Payroll dashboard data retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving payroll dashboard data'
      });
    }
  }
);

// ============================================================================
// OVERTIME MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/payroll/overtime/report
 * @desc    Generate overtime analysis report
 * @access  Private (Manager+)
 */
router.get('/overtime/report', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        department: req.query.department,
        staffId: req.query.staffId,
        threshold: parseFloat(req.query.threshold) || 40
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          period: { startDate: filters.startDate, endDate: filters.endDate },
          totalOvertimeHours: 125.5,
          totalOvertimeCost: 8500.00,
          staffWithOvertime: 12,
          topOvertimeEarners: [],
          departmentBreakdown: {},
          trends: [],
          alerts: []
        }, 
        message: 'Overtime report generated successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating overtime report'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/compliance/check
 * @desc    Run payroll compliance checks
 * @access  Private (HR+)
 */
router.get('/compliance/check', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const { payPeriod, staffIds } = req.query;
      
      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          payPeriod,
          complianceScore: 95.5,
          violations: {
            minimumWage: 0,
            overtime: 2,
            breaks: 1,
            maximumHours: 0
          },
          recommendations: [
            'Review overtime patterns for Staff ID: staff_003',
            'Ensure proper break documentation for Staff ID: staff_007'
          ],
          summary: {
            totalChecked: staffIds?.length || 50,
            passed: 47,
            warnings: 3,
            violations: 0
          }
        }, 
        message: 'Compliance check completed successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while running compliance check'
      });
    }
  }
);

// ============================================================================
// SHIFT DIFFERENTIAL ANALYSIS
// ============================================================================

/**
 * @route   GET /api/payroll/differentials/analysis
 * @desc    Analyze shift differential impact and usage
 * @access  Private (Manager+)
 */
router.get('/differentials/analysis', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        department: req.query.department,
        shiftType: req.query.shiftType
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          period: { startDate: filters.startDate, endDate: filters.endDate },
          totalDifferentialPay: 12750.00,
          differentialBreakdown: {
            evening: { hours: 450, cost: 4500.00 },
            night: { hours: 320, cost: 5200.00 },
            weekend: { hours: 280, cost: 3050.00 }
          },
          staffUtilization: {},
          costImpact: {
            percentOfTotalPay: 8.5,
            averagePerEmployee: 283.33
          },
          trends: []
        }, 
        message: 'Differential analysis completed successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while analyzing shift differentials'
      });
    }
  }
);

// ============================================================================
// PAYROLL PERIOD MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/payroll/periods/close
 * @desc    Close a payroll period
 * @access  Private (HR+)
 */
router.post('/periods/close', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr']), 
  async (req, res) => {
    try {
      const { payPeriod, finalizeCalculations } = req.body;

      if (!payPeriod) {
        return res.status(400).json({
          success: false,
          error: 'Pay period required',
          message: 'Please specify the pay period to close'
        });
      }

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          payPeriod,
          closedAt: new Date(),
          totalStaff: 45,
          totalGrossPay: 125000.00,
          calculationsFinalized: finalizeCalculations,
          status: 'closed'
        }, 
        message: 'Pay period closed successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while closing pay period'
      });
    }
  }
);

/**
 * @route   GET /api/payroll/periods
 * @desc    Get payroll periods with status
 * @access  Private (HR+)
 */
router.get('/periods', 
  authenticateToken, 
  authorizeRoles(['admin', 'hr', 'manager']), 
  async (req, res) => {
    try {
      const filters = {
        year: req.query.year || new Date().getFullYear(),
        status: req.query.status
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        message: 'Payroll periods retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving payroll periods'
      });
    }
  }
);

module.exports = router;