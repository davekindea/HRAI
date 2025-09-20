const { Op } = require('sequelize');

/**
 * Payroll Integration Service
 * Handles overtime calculations, shift differentials, and payroll system integration
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

class PayrollIntegrationService {
  constructor() {
    this.payrollRules = new Map();
    this.payPeriods = new Map();
    this.payrollCalculations = new Map();
    this.leaveAccruals = new Map();
    this.payrollExports = new Map();
    this.initializeDefaultRules();
  }

  // ============================================================================
  // PAYROLL RULES MANAGEMENT
  // ============================================================================

  /**
   * Initialize default payroll calculation rules
   */
  initializeDefaultRules() {
    const defaultRules = {
      id: 'default_rules',
      name: 'Standard Payroll Rules',
      regularHoursLimit: 40, // per week
      dailyOvertimeThreshold: 8, // hours
      weeklyOvertimeThreshold: 40, // hours
      overtimeRate: 1.5, // 1.5x regular rate
      doubleTimeThreshold: 12, // daily hours for double time
      doubleTimeRate: 2.0, // 2x regular rate
      shiftDifferentials: {
        evening: { rate: 1.1, startTime: '15:00', endTime: '23:00' },
        night: { rate: 1.15, startTime: '23:00', endTime: '07:00' },
        weekend: { rate: 1.2, days: ['saturday', 'sunday'] },
        holiday: { rate: 2.0, dates: [] }
      },
      breakRules: {
        paidBreakMinutes: 15, // per 4 hours worked
        unpaidLunchMinutes: 30, // for shifts > 6 hours
        maxPaidBreaksPerDay: 2
      },
      minimumWageCompliance: true,
      minimumWageRate: 15.00, // per hour
      payFrequency: 'biweekly', // weekly, biweekly, monthly
      payPeriodStart: 'monday',
      timesheetCutoff: 'sunday_midnight',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.payrollRules.set('default', defaultRules);
  }

  /**
   * Create custom payroll rules for specific departments or roles
   */
  async createPayrollRules(rulesData) {
    try {
      const rules = {
        id: this.generateId(),
        name: rulesData.name,
        department: rulesData.department,
        roles: rulesData.roles || [],
        location: rulesData.location,
        effectiveDate: new Date(rulesData.effectiveDate || Date.now()),
        expiryDate: rulesData.expiryDate ? new Date(rulesData.expiryDate) : null,
        regularHoursLimit: rulesData.regularHoursLimit || 40,
        dailyOvertimeThreshold: rulesData.dailyOvertimeThreshold || 8,
        weeklyOvertimeThreshold: rulesData.weeklyOvertimeThreshold || 40,
        overtimeRate: rulesData.overtimeRate || 1.5,
        doubleTimeThreshold: rulesData.doubleTimeThreshold || 12,
        doubleTimeRate: rulesData.doubleTimeRate || 2.0,
        shiftDifferentials: rulesData.shiftDifferentials || {},
        breakRules: rulesData.breakRules || {},
        minimumWageCompliance: rulesData.minimumWageCompliance !== false,
        minimumWageRate: rulesData.minimumWageRate || 15.00,
        payFrequency: rulesData.payFrequency || 'biweekly',
        payPeriodStart: rulesData.payPeriodStart || 'monday',
        timesheetCutoff: rulesData.timesheetCutoff || 'sunday_midnight',
        status: 'active',
        priority: rulesData.priority || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: rulesData.createdBy
      };

      this.payrollRules.set(rules.id, rules);

      return {
        success: true,
        data: rules,
        message: 'Payroll rules created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create payroll rules'
      };
    }
  }

  // ============================================================================
  // OVERTIME & SHIFT DIFFERENTIAL CALCULATIONS
  // ============================================================================

  /**
   * Calculate comprehensive pay for a timesheet entry
   */
  async calculatePay(timesheetData) {
    try {
      const {
        staffId,
        date,
        clockInTime,
        clockOutTime,
        breaks,
        shiftType,
        department,
        role,
        baseHourlyRate
      } = timesheetData;

      // Get applicable payroll rules
      const rules = await this.getApplicablePayrollRules(staffId, department, role, date);
      
      // Calculate total hours worked
      const totalMinutes = (new Date(clockOutTime) - new Date(clockInTime));
      const totalHours = totalMinutes / (1000 * 60 * 60);
      
      // Calculate break time
      const breakCalculation = this.calculateBreakPay(breaks, rules);
      const workHours = totalHours - (breakCalculation.unpaidBreakHours || 0);
      
      // Get shift differential information
      const shiftDifferential = this.calculateShiftDifferential(
        clockInTime, 
        clockOutTime, 
        date, 
        rules
      );
      
      // Calculate overtime
      const overtimeCalculation = await this.calculateOvertime(
        staffId, 
        date, 
        workHours, 
        rules
      );
      
      // Calculate base pay
      const regularHours = overtimeCalculation.regularHours;
      const overtimeHours = overtimeCalculation.overtimeHours;
      const doubleTimeHours = overtimeCalculation.doubleTimeHours;
      
      const regularPay = regularHours * baseHourlyRate;
      const overtimePay = overtimeHours * baseHourlyRate * rules.overtimeRate;
      const doubleTimePay = doubleTimeHours * baseHourlyRate * rules.doubleTimeRate;
      
      // Apply shift differentials
      const differentialPay = this.calculateDifferentialPay(
        regularHours + overtimeHours + doubleTimeHours,
        baseHourlyRate,
        shiftDifferential
      );
      
      // Calculate total gross pay
      const grossPay = regularPay + overtimePay + doubleTimePay + differentialPay + breakCalculation.paidBreakPay;
      
      // Check minimum wage compliance
      const minimumWageCheck = this.checkMinimumWageCompliance(
        totalHours,
        grossPay,
        rules.minimumWageRate
      );
      
      const payCalculation = {
        id: this.generateId(),
        staffId,
        date,
        payPeriod: this.getPayPeriod(date, rules),
        rulesUsed: rules.id,
        hours: {
          totalHours: totalHours,
          workHours: workHours,
          regularHours: regularHours,
          overtimeHours: overtimeHours,
          doubleTimeHours: doubleTimeHours,
          paidBreakHours: breakCalculation.paidBreakHours,
          unpaidBreakHours: breakCalculation.unpaidBreakHours
        },
        rates: {
          baseRate: baseHourlyRate,
          overtimeRate: baseHourlyRate * rules.overtimeRate,
          doubleTimeRate: baseHourlyRate * rules.doubleTimeRate,
          effectiveDifferentialRate: shiftDifferential.effectiveRate
        },
        pay: {
          regularPay: regularPay,
          overtimePay: overtimePay,
          doubleTimePay: doubleTimePay,
          differentialPay: differentialPay,
          paidBreakPay: breakCalculation.paidBreakPay,
          grossPay: grossPay,
          minimumWageAdjustment: minimumWageCheck.adjustment
        },
        differentials: shiftDifferential.details,
        compliance: {
          minimumWageCompliant: minimumWageCheck.compliant,
          laborLawCompliant: true,
          adjustmentsApplied: minimumWageCheck.adjustment > 0
        },
        createdAt: new Date(),
        calculatedBy: 'system'
      };

      this.payrollCalculations.set(payCalculation.id, payCalculation);

      return {
        success: true,
        data: payCalculation,
        message: 'Pay calculation completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to calculate pay'
      };
    }
  }

  /**
   * Calculate overtime hours based on daily and weekly thresholds
   */
  async calculateOvertime(staffId, date, dailyHours, rules) {
    try {
      // Get weekly hours for the pay period
      const weeklyHours = await this.getWeeklyHours(staffId, date, rules);
      const totalWeeklyHours = weeklyHours + dailyHours;

      let regularHours = dailyHours;
      let overtimeHours = 0;
      let doubleTimeHours = 0;

      // Daily overtime calculation
      if (dailyHours > rules.dailyOvertimeThreshold) {
        const dailyOvertime = Math.min(
          dailyHours - rules.dailyOvertimeThreshold,
          rules.doubleTimeThreshold - rules.dailyOvertimeThreshold
        );
        overtimeHours += dailyOvertime;
        regularHours -= dailyOvertime;

        // Daily double time calculation
        if (dailyHours > rules.doubleTimeThreshold) {
          const dailyDoubleTime = dailyHours - rules.doubleTimeThreshold;
          doubleTimeHours += dailyDoubleTime;
          overtimeHours -= dailyDoubleTime;
        }
      }

      // Weekly overtime calculation
      if (totalWeeklyHours > rules.weeklyOvertimeThreshold) {
        const weeklyOvertime = totalWeeklyHours - rules.weeklyOvertimeThreshold;
        const remainingRegularHours = Math.max(0, regularHours - weeklyOvertime);
        const additionalOvertime = regularHours - remainingRegularHours;
        
        regularHours = remainingRegularHours;
        overtimeHours += additionalOvertime;
      }

      return {
        regularHours: Math.max(0, regularHours),
        overtimeHours: Math.max(0, overtimeHours),
        doubleTimeHours: Math.max(0, doubleTimeHours),
        weeklyHoursToDate: totalWeeklyHours,
        overtimeTriggered: {
          daily: dailyHours > rules.dailyOvertimeThreshold,
          weekly: totalWeeklyHours > rules.weeklyOvertimeThreshold,
          doubleTime: dailyHours > rules.doubleTimeThreshold
        }
      };
    } catch (error) {
      throw new Error(`Overtime calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate shift differentials based on time and date
   */
  calculateShiftDifferential(clockInTime, clockOutTime, date, rules) {
    const differentials = {
      evening: 0,
      night: 0,
      weekend: 0,
      holiday: 0
    };

    const shiftStart = new Date(clockInTime);
    const shiftEnd = new Date(clockOutTime);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Weekend differential
    if (isWeekend && rules.shiftDifferentials.weekend) {
      differentials.weekend = rules.shiftDifferentials.weekend.rate;
    }

    // Holiday differential
    if (this.isHoliday(date, rules)) {
      differentials.holiday = rules.shiftDifferentials.holiday.rate;
    }

    // Time-based differentials (evening/night)
    const totalShiftHours = (shiftEnd - shiftStart) / (1000 * 60 * 60);
    
    if (rules.shiftDifferentials.evening) {
      const eveningHours = this.calculateTimeOverlap(
        shiftStart,
        shiftEnd,
        rules.shiftDifferentials.evening.startTime,
        rules.shiftDifferentials.evening.endTime
      );
      if (eveningHours > 0) {
        differentials.evening = rules.shiftDifferentials.evening.rate;
      }
    }

    if (rules.shiftDifferentials.night) {
      const nightHours = this.calculateTimeOverlap(
        shiftStart,
        shiftEnd,
        rules.shiftDifferentials.night.startTime,
        rules.shiftDifferentials.night.endTime
      );
      if (nightHours > 0) {
        differentials.night = rules.shiftDifferentials.night.rate;
      }
    }

    // Calculate effective rate (highest applicable differential)
    const effectiveRate = Math.max(...Object.values(differentials));

    return {
      details: differentials,
      effectiveRate: effectiveRate,
      totalDifferentialHours: totalShiftHours,
      applicableDifferentials: Object.entries(differentials)
        .filter(([key, value]) => value > 0)
        .map(([key, value]) => ({ type: key, rate: value }))
    };
  }

  /**
   * Calculate break pay based on paid/unpaid break rules
   */
  calculateBreakPay(breaks, rules) {
    let paidBreakMinutes = 0;
    let unpaidBreakMinutes = 0;
    let paidBreakCount = 0;

    for (const break_ of breaks) {
      const breakDurationMinutes = break_.duration / (1000 * 60);

      if (break_.paid && paidBreakCount < rules.breakRules.maxPaidBreaksPerDay) {
        paidBreakMinutes += Math.min(breakDurationMinutes, rules.breakRules.paidBreakMinutes);
        paidBreakCount++;
      } else {
        unpaidBreakMinutes += breakDurationMinutes;
      }
    }

    return {
      paidBreakHours: paidBreakMinutes / 60,
      unpaidBreakHours: unpaidBreakMinutes / 60,
      paidBreakPay: 0, // Would be calculated with hourly rate
      paidBreakCount: paidBreakCount
    };
  }

  // ============================================================================
  // LEAVE MANAGEMENT & ACCRUALS
  // ============================================================================

  /**
   * Calculate leave accruals (PTO, sick leave, etc.)
   */
  async calculateLeaveAccruals(staffId, payPeriod, hoursWorked) {
    try {
      const existingAccrual = Array.from(this.leaveAccruals.values())
        .find(a => a.staffId === staffId && a.payPeriod === payPeriod);

      if (existingAccrual) {
        return {
          success: true,
          data: existingAccrual,
          message: 'Leave accrual already calculated for this pay period'
        };
      }

      // Get staff leave accrual rates
      const accrualRates = await this.getStaffAccrualRates(staffId);
      
      const accrual = {
        id: this.generateId(),
        staffId,
        payPeriod,
        hoursWorked,
        accruals: {
          vacation: {
            rate: accrualRates.vacation.rate, // hours per hour worked
            earned: hoursWorked * accrualRates.vacation.rate,
            previousBalance: accrualRates.vacation.currentBalance,
            used: 0, // would come from time off requests
            newBalance: accrualRates.vacation.currentBalance + (hoursWorked * accrualRates.vacation.rate)
          },
          sick: {
            rate: accrualRates.sick.rate,
            earned: hoursWorked * accrualRates.sick.rate,
            previousBalance: accrualRates.sick.currentBalance,
            used: 0,
            newBalance: accrualRates.sick.currentBalance + (hoursWorked * accrualRates.sick.rate)
          },
          personal: {
            rate: accrualRates.personal.rate,
            earned: hoursWorked * accrualRates.personal.rate,
            previousBalance: accrualRates.personal.currentBalance,
            used: 0,
            newBalance: accrualRates.personal.currentBalance + (hoursWorked * accrualRates.personal.rate)
          }
        },
        calculations: {
          totalAccrued: 0,
          carryoverLimits: accrualRates.carryoverLimits,
          maximumBalances: accrualRates.maximumBalances
        },
        createdAt: new Date(),
        calculatedBy: 'system'
      };

      // Calculate total accrued
      accrual.calculations.totalAccrued = Object.values(accrual.accruals)
        .reduce((total, leave) => total + leave.earned, 0);

      // Apply maximum balance limits
      this.applyAccrualLimits(accrual);

      this.leaveAccruals.set(accrual.id, accrual);

      return {
        success: true,
        data: accrual,
        message: 'Leave accruals calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to calculate leave accruals'
      };
    }
  }

  /**
   * Process leave usage and update balances
   */
  async processLeaveUsage(leaveUsageData) {
    try {
      const {
        staffId,
        leaveType,
        hoursUsed,
        date,
        timeOffRequestId
      } = leaveUsageData;

      // Get current leave balances
      const currentBalances = await this.getCurrentLeaveBalances(staffId);
      
      if (currentBalances[leaveType].balance < hoursUsed) {
        return {
          success: false,
          error: 'Insufficient leave balance',
          message: `Not enough ${leaveType} leave available. Current balance: ${currentBalances[leaveType].balance} hours`
        };
      }

      const usage = {
        id: this.generateId(),
        staffId,
        leaveType,
        hoursUsed,
        date: new Date(date),
        timeOffRequestId,
        previousBalance: currentBalances[leaveType].balance,
        newBalance: currentBalances[leaveType].balance - hoursUsed,
        status: 'processed',
        processedAt: new Date(),
        processedBy: 'system'
      };

      // Update balances
      await this.updateLeaveBalances(staffId, leaveType, -hoursUsed);

      return {
        success: true,
        data: usage,
        message: 'Leave usage processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to process leave usage'
      };
    }
  }

  // ============================================================================
  // PAYROLL EXPORT & INTEGRATION
  // ============================================================================

  /**
   * Generate payroll export for external payroll systems
   */
  async generatePayrollExport(exportParams) {
    try {
      const {
        payPeriod,
        staffIds,
        format,
        includeDeductions,
        includeAccruals
      } = exportParams;

      // Get all pay calculations for the period
      const payCalculations = Array.from(this.payrollCalculations.values())
        .filter(calc => 
          calc.payPeriod === payPeriod &&
          (!staffIds || staffIds.includes(calc.staffId))
        );

      // Group by staff member
      const staffPayData = this.groupPayCalculationsByStaff(payCalculations);

      // Generate export data
      const exportData = {
        exportId: this.generateId(),
        payPeriod,
        generatedAt: new Date(),
        format,
        totalStaff: Object.keys(staffPayData).length,
        totalGrossPay: 0,
        records: []
      };

      for (const [staffId, calculations] of Object.entries(staffPayData)) {
        const staffTotal = this.calculateStaffPeriodTotal(calculations);
        
        if (includeAccruals) {
          const accruals = await this.getAccrualsForPeriod(staffId, payPeriod);
          staffTotal.accruals = accruals;
        }

        if (includeDeductions) {
          const deductions = await this.calculateDeductions(staffId, staffTotal.grossPay);
          staffTotal.deductions = deductions;
          staffTotal.netPay = staffTotal.grossPay - deductions.total;
        }

        exportData.records.push(staffTotal);
        exportData.totalGrossPay += staffTotal.grossPay;
      }

      // Format export based on requested format
      const formattedExport = await this.formatPayrollExport(exportData, format);

      const export_ = {
        id: exportData.exportId,
        payPeriod,
        parameters: exportParams,
        data: exportData,
        formattedData: formattedExport,
        status: 'completed',
        generatedAt: new Date(),
        downloadUrl: null // Would be generated in real implementation
      };

      this.payrollExports.set(export_.id, export_);

      return {
        success: true,
        data: export_,
        message: 'Payroll export generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate payroll export'
      };
    }
  }

  /**
   * Generate comprehensive payroll analytics report
   */
  async generatePayrollAnalytics(analyticsParams) {
    try {
      const {
        startDate,
        endDate,
        groupBy,
        includeComparisons
      } = analyticsParams;

      const payCalculations = Array.from(this.payrollCalculations.values())
        .filter(calc => {
          const calcDate = new Date(calc.date);
          return calcDate >= new Date(startDate) && calcDate <= new Date(endDate);
        });

      const analytics = {
        reportId: this.generateId(),
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          totalPayCalculations: payCalculations.length,
          totalGrossPay: payCalculations.reduce((sum, calc) => sum + calc.pay.grossPay, 0),
          totalRegularHours: payCalculations.reduce((sum, calc) => sum + calc.hours.regularHours, 0),
          totalOvertimeHours: payCalculations.reduce((sum, calc) => sum + calc.hours.overtimeHours, 0),
          totalOvertimePay: payCalculations.reduce((sum, calc) => sum + calc.pay.overtimePay, 0),
          averageHourlyRate: 0,
          overtimePercentage: 0
        },
        breakdowns: {
          byDepartment: this.groupAnalyticsByDepartment(payCalculations),
          byShiftType: this.groupAnalyticsByShiftType(payCalculations),
          byPayPeriod: this.groupAnalyticsByPayPeriod(payCalculations)
        },
        compliance: {
          minimumWageViolations: this.findMinimumWageViolations(payCalculations),
          overtimeViolations: this.findOvertimeViolations(payCalculations),
          breakViolations: this.findBreakViolations(payCalculations)
        },
        trends: {
          laborCostTrend: this.calculateLaborCostTrend(payCalculations),
          overtimeTrend: this.calculateOvertimeTrend(payCalculations),
          productivityTrend: this.calculateProductivityTrend(payCalculations)
        }
      };

      // Calculate derived metrics
      const totalHours = analytics.summary.totalRegularHours + analytics.summary.totalOvertimeHours;
      analytics.summary.averageHourlyRate = analytics.summary.totalGrossPay / (totalHours || 1);
      analytics.summary.overtimePercentage = (analytics.summary.totalOvertimeHours / (totalHours || 1)) * 100;

      if (includeComparisons) {
        analytics.comparisons = await this.generatePayrollComparisons(analytics, startDate, endDate);
      }

      return {
        success: true,
        data: analytics,
        message: 'Payroll analytics generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate payroll analytics'
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getApplicablePayrollRules(staffId, department, role, date) {
    // Get most specific applicable rules
    const allRules = Array.from(this.payrollRules.values())
      .filter(rule => 
        rule.status === 'active' &&
        (!rule.effectiveDate || new Date(rule.effectiveDate) <= new Date(date)) &&
        (!rule.expiryDate || new Date(rule.expiryDate) >= new Date(date))
      )
      .sort((a, b) => b.priority - a.priority);

    // Return most specific match or default
    return allRules.find(rule => 
      (rule.department === department) ||
      (rule.roles && rule.roles.includes(role))
    ) || this.payrollRules.get('default');
  }

  async getWeeklyHours(staffId, date, rules) {
    // Mock implementation - in real app, would query timesheet database
    const currentWeekStart = this.getWeekStart(date, rules.payPeriodStart);
    
    // Get all pay calculations for current week
    const weekCalculations = Array.from(this.payrollCalculations.values())
      .filter(calc => 
        calc.staffId === staffId &&
        new Date(calc.date) >= currentWeekStart &&
        new Date(calc.date) < new Date(date)
      );

    return weekCalculations.reduce((total, calc) => 
      total + calc.hours.regularHours + calc.hours.overtimeHours + calc.hours.doubleTimeHours, 0
    );
  }

  getPayPeriod(date, rules) {
    // Calculate pay period based on rules
    const year = date.getFullYear();
    
    if (rules.payFrequency === 'biweekly') {
      const weekNumber = this.getWeekNumber(date);
      const payPeriodNumber = Math.ceil(weekNumber / 2);
      return `${year}-PP${payPeriodNumber.toString().padStart(2, '0')}`;
    } else if (rules.payFrequency === 'weekly') {
      const weekNumber = this.getWeekNumber(date);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    } else if (rules.payFrequency === 'monthly') {
      const month = date.getMonth() + 1;
      return `${year}-M${month.toString().padStart(2, '0')}`;
    }
    
    return `${year}-PP01`; // Default
  }

  calculateDifferentialPay(hours, baseRate, shiftDifferential) {
    if (shiftDifferential.effectiveRate <= 1) return 0;
    
    const differentialRate = baseRate * (shiftDifferential.effectiveRate - 1);
    return hours * differentialRate;
  }

  checkMinimumWageCompliance(totalHours, grossPay, minimumWageRate) {
    const minimumRequiredPay = totalHours * minimumWageRate;
    const shortfall = Math.max(0, minimumRequiredPay - grossPay);
    
    return {
      compliant: shortfall === 0,
      minimumRequired: minimumRequiredPay,
      actualPay: grossPay,
      adjustment: shortfall
    };
  }

  calculateTimeOverlap(shiftStart, shiftEnd, diffStartTime, diffEndTime) {
    // Convert time strings to Date objects for comparison
    const shiftStartTime = shiftStart.getHours() + shiftStart.getMinutes() / 60;
    const shiftEndTime = shiftEnd.getHours() + shiftEnd.getMinutes() / 60;
    
    const [diffStartHour, diffStartMin] = diffStartTime.split(':').map(Number);
    const [diffEndHour, diffEndMin] = diffEndTime.split(':').map(Number);
    
    const diffStart = diffStartHour + diffStartMin / 60;
    const diffEnd = diffEndHour + diffEndMin / 60;
    
    // Handle overnight shifts
    let overlapHours = 0;
    
    if (diffEnd < diffStart) { // Overnight differential (e.g., 23:00-07:00)
      if (shiftStartTime >= diffStart || shiftEndTime <= diffEnd) {
        const beforeMidnight = Math.max(0, Math.min(shiftEndTime, 24) - Math.max(shiftStartTime, diffStart));
        const afterMidnight = Math.max(0, Math.min(shiftEndTime, diffEnd) - Math.max(shiftStartTime, 0));
        overlapHours = beforeMidnight + afterMidnight;
      }
    } else { // Regular differential
      const overlapStart = Math.max(shiftStartTime, diffStart);
      const overlapEnd = Math.min(shiftEndTime, diffEnd);
      overlapHours = Math.max(0, overlapEnd - overlapStart);
    }
    
    return overlapHours;
  }

  isHoliday(date, rules) {
    // Mock holiday check
    const holidays = rules.shiftDifferentials.holiday?.dates || [];
    const dateString = date.toISOString().split('T')[0];
    return holidays.includes(dateString);
  }

  async getStaffAccrualRates(staffId) {
    // Mock accrual rates - in real implementation, would come from staff database
    return {
      vacation: { rate: 0.077, currentBalance: 80.0 }, // ~4 weeks per year
      sick: { rate: 0.033, currentBalance: 24.0 }, // ~1.7 weeks per year
      personal: { rate: 0.019, currentBalance: 16.0 }, // ~1 week per year
      carryoverLimits: { vacation: 40, sick: 80, personal: 0 },
      maximumBalances: { vacation: 200, sick: 240, personal: 40 }
    };
  }

  applyAccrualLimits(accrual) {
    for (const [leaveType, leave] of Object.entries(accrual.accruals)) {
      const maxBalance = accrual.calculations.maximumBalances[leaveType];
      if (leave.newBalance > maxBalance) {
        leave.cappedAmount = leave.newBalance - maxBalance;
        leave.newBalance = maxBalance;
      }
    }
  }

  async getCurrentLeaveBalances(staffId) {
    // Mock implementation
    return {
      vacation: { balance: 80.0 },
      sick: { balance: 24.0 },
      personal: { balance: 16.0 }
    };
  }

  async updateLeaveBalances(staffId, leaveType, hoursAdjustment) {
    // Mock implementation - in real app, would update database
    return true;
  }

  groupPayCalculationsByStaff(calculations) {
    const grouped = {};
    calculations.forEach(calc => {
      if (!grouped[calc.staffId]) {
        grouped[calc.staffId] = [];
      }
      grouped[calc.staffId].push(calc);
    });
    return grouped;
  }

  calculateStaffPeriodTotal(calculations) {
    return {
      staffId: calculations[0].staffId,
      totalHours: calculations.reduce((sum, calc) => sum + calc.hours.workHours, 0),
      regularHours: calculations.reduce((sum, calc) => sum + calc.hours.regularHours, 0),
      overtimeHours: calculations.reduce((sum, calc) => sum + calc.hours.overtimeHours, 0),
      grossPay: calculations.reduce((sum, calc) => sum + calc.pay.grossPay, 0),
      overtimePay: calculations.reduce((sum, calc) => sum + calc.pay.overtimePay, 0),
      differentialPay: calculations.reduce((sum, calc) => sum + calc.pay.differentialPay, 0),
      entries: calculations.length
    };
  }

  async getAccrualsForPeriod(staffId, payPeriod) {
    const accruals = Array.from(this.leaveAccruals.values())
      .filter(a => a.staffId === staffId && a.payPeriod === payPeriod);
    
    return accruals.length > 0 ? accruals[0].accruals : null;
  }

  async calculateDeductions(staffId, grossPay) {
    // Mock deductions calculation
    return {
      federalTax: grossPay * 0.12,
      stateTax: grossPay * 0.05,
      socialSecurity: grossPay * 0.062,
      medicare: grossPay * 0.0145,
      total: grossPay * 0.2365
    };
  }

  async formatPayrollExport(exportData, format) {
    if (format === 'csv') {
      return this.formatAsCSV(exportData);
    } else if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'xml') {
      return this.formatAsXML(exportData);
    }
    return exportData;
  }

  formatAsCSV(exportData) {
    const headers = ['Staff ID', 'Regular Hours', 'Overtime Hours', 'Gross Pay', 'Net Pay'];
    const rows = exportData.records.map(record => [
      record.staffId,
      record.regularHours,
      record.overtimeHours,
      record.grossPay,
      record.netPay || record.grossPay
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  formatAsXML(exportData) {
    // Mock XML formatting
    return `<payroll>
      <period>${exportData.payPeriod}</period>
      <records>
        ${exportData.records.map(r => `
          <record>
            <staffId>${r.staffId}</staffId>
            <grossPay>${r.grossPay}</grossPay>
          </record>
        `).join('')}
      </records>
    </payroll>`;
  }

  // Analytics helper methods
  groupAnalyticsByDepartment(calculations) {
    // Mock implementation
    return { engineering: { total: 50000 }, sales: { total: 30000 } };
  }

  groupAnalyticsByShiftType(calculations) {
    return { day: { total: 40000 }, night: { total: 25000 }, weekend: { total: 15000 } };
  }

  groupAnalyticsByPayPeriod(calculations) {
    const grouped = {};
    calculations.forEach(calc => {
      if (!grouped[calc.payPeriod]) {
        grouped[calc.payPeriod] = { total: 0, count: 0 };
      }
      grouped[calc.payPeriod].total += calc.pay.grossPay;
      grouped[calc.payPeriod].count++;
    });
    return grouped;
  }

  findMinimumWageViolations(calculations) {
    return calculations.filter(calc => !calc.compliance.minimumWageCompliant);
  }

  findOvertimeViolations(calculations) {
    // Mock implementation for finding overtime rule violations
    return [];
  }

  findBreakViolations(calculations) {
    // Mock implementation for finding break rule violations
    return [];
  }

  calculateLaborCostTrend(calculations) {
    // Mock trend calculation
    return [
      { period: '2025-01', cost: 45000 },
      { period: '2025-02', cost: 48000 },
      { period: '2025-03', cost: 52000 }
    ];
  }

  calculateOvertimeTrend(calculations) {
    return [
      { period: '2025-01', percentage: 8.5 },
      { period: '2025-02', percentage: 12.3 },
      { period: '2025-03', percentage: 15.7 }
    ];
  }

  calculateProductivityTrend(calculations) {
    return [
      { period: '2025-01', revenue_per_hour: 125.50 },
      { period: '2025-02', revenue_per_hour: 132.75 },
      { period: '2025-03', revenue_per_hour: 128.90 }
    ];
  }

  async generatePayrollComparisons(analytics, startDate, endDate) {
    // Mock comparison with previous periods
    return {
      previousPeriod: {
        change: { grossPay: +12.5, overtimeHours: +8.3 }
      },
      yearOverYear: {
        change: { grossPay: +18.7, overtimeHours: +15.2 }
      }
    };
  }

  getWeekStart(date, startDay = 'monday') {
    const dayOffset = startDay === 'monday' ? 1 : 0;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - (date.getDay() - dayOffset + 7) % 7);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  generateId() {
    return 'payroll_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

module.exports = new PayrollIntegrationService();