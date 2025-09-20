const mongoose = require('mongoose');

// Payroll Processing Service
// Handles comprehensive payroll processing, deductions, taxes, and compliance
class PayrollProcessingService {
  constructor() {
    this.payrollStatuses = {
      DRAFT: 'draft',
      PENDING_APPROVAL: 'pending_approval',
      APPROVED: 'approved',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    };

    this.payrollTypes = {
      REGULAR: 'regular',
      BONUS: 'bonus',
      COMMISSION: 'commission',
      ADJUSTMENT: 'adjustment',
      FINAL: 'final',
      OFF_CYCLE: 'off_cycle'
    };

    this.deductionTypes = {
      PRE_TAX: 'pre_tax',
      POST_TAX: 'post_tax',
      TAX: 'tax',
      GARNISHMENT: 'garnishment',
      LOAN: 'loan'
    };

    // Tax rates and thresholds (2025 tax year)
    this.taxRates = {
      federal: {
        income: [
          { min: 0, max: 11000, rate: 0.10 },
          { min: 11000, max: 44725, rate: 0.12 },
          { min: 44725, max: 95375, rate: 0.22 },
          { min: 95375, max: 182050, rate: 0.24 },
          { min: 182050, max: 231250, rate: 0.32 },
          { min: 231250, max: 578125, rate: 0.35 },
          { min: 578125, max: Infinity, rate: 0.37 }
        ],
        socialSecurity: { rate: 0.062, wageBase: 147000 },
        medicare: { rate: 0.0145, additionalRate: 0.009, threshold: 200000 },
        unemployment: { rate: 0.006, wageBase: 7000 }
      },
      state: {
        // State-specific rates (example for California)
        CA: {
          income: [
            { min: 0, max: 8932, rate: 0.01 },
            { min: 8932, max: 21175, rate: 0.02 },
            { min: 21175, max: 33421, rate: 0.04 },
            { min: 33421, max: 46394, rate: 0.06 },
            { min: 46394, max: 58634, rate: 0.08 },
            { min: 58634, max: 299508, rate: 0.093 },
            { min: 299508, max: 359407, rate: 0.103 },
            { min: 359407, max: 599012, rate: 0.113 },
            { min: 599012, max: Infinity, rate: 0.123 }
          ],
          sdi: { rate: 0.009, wageBase: 145600 },
          unemployment: { rate: 0.034, wageBase: 7000 }
        }
      }
    };
  }

  // Process payroll for a pay period
  async processPayroll(params) {
    try {
      const {
        payrollId,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        payrollType = this.payrollTypes.REGULAR,
        employees = [],
        approverUserId
      } = params;

      const payrollResults = [];
      let totalGrossPay = 0;
      let totalNetPay = 0;
      let totalTaxes = 0;
      let totalDeductions = 0;

      // Process each employee
      for (let employee of employees) {
        const employeePayroll = await this.processEmployeePayroll({
          employeeId: employee.employeeId,
          payPeriodStart,
          payPeriodEnd,
          payDate,
          payrollType,
          hoursWorked: employee.hoursWorked,
          overtimeHours: employee.overtimeHours,
          bonusAmount: employee.bonusAmount,
          commissionAmount: employee.commissionAmount,
          adjustments: employee.adjustments || []
        });

        payrollResults.push(employeePayroll);
        totalGrossPay += employeePayroll.grossPay;
        totalNetPay += employeePayroll.netPay;
        totalTaxes += employeePayroll.totalTaxes;
        totalDeductions += employeePayroll.totalDeductions;
      }

      const payrollRecord = {
        payrollId,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        payrollType,
        status: this.payrollStatuses.DRAFT,
        employeeCount: employees.length,
        totals: {
          grossPay: totalGrossPay,
          netPay: totalNetPay,
          taxes: totalTaxes,
          deductions: totalDeductions
        },
        employees: payrollResults,
        createdDate: new Date(),
        approverUserId
      };

      return payrollRecord;
    } catch (error) {
      throw new Error(`Payroll processing failed: ${error.message}`);
    }
  }

  // Process individual employee payroll
  async processEmployeePayroll(params) {
    try {
      const {
        employeeId,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        payrollType,
        hoursWorked = 0,
        overtimeHours = 0,
        bonusAmount = 0,
        commissionAmount = 0,
        adjustments = []
      } = params;

      // Get employee information
      const employee = await this.getEmployeePayrollInfo(employeeId);
      
      // Calculate gross pay
      const grossPayCalculation = await this.calculateGrossPay({
        employee,
        hoursWorked,
        overtimeHours,
        bonusAmount,
        commissionAmount,
        adjustments
      });

      // Calculate pre-tax deductions
      const preTaxDeductions = await this.calculatePreTaxDeductions(employee);

      // Calculate taxable income
      const taxableIncome = grossPayCalculation.totalGrossPay - preTaxDeductions.totalPreTax;

      // Calculate taxes
      const taxCalculations = await this.calculateTaxes({
        employee,
        taxableIncome,
        grossPay: grossPayCalculation.totalGrossPay
      });

      // Calculate post-tax deductions
      const postTaxDeductions = await this.calculatePostTaxDeductions(employee);

      // Calculate garnishments
      const garnishments = await this.calculateGarnishments(employee, taxableIncome);

      // Calculate net pay
      const netPay = taxableIncome - taxCalculations.totalTaxes - postTaxDeductions.totalPostTax - garnishments.totalGarnishments;

      return {
        employeeId,
        employeeName: employee.name,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        payrollType,
        
        // Gross pay breakdown
        regularPay: grossPayCalculation.regularPay,
        overtimePay: grossPayCalculation.overtimePay,
        bonusPay: bonusAmount,
        commissionPay: commissionAmount,
        adjustments: grossPayCalculation.adjustments,
        grossPay: grossPayCalculation.totalGrossPay,

        // Deductions
        preTaxDeductions: preTaxDeductions.deductions,
        totalPreTaxDeductions: preTaxDeductions.totalPreTax,
        
        taxableIncome,
        
        // Taxes
        taxes: taxCalculations.taxes,
        totalTaxes: taxCalculations.totalTaxes,
        
        // Post-tax deductions
        postTaxDeductions: postTaxDeductions.deductions,
        totalPostTaxDeductions: postTaxDeductions.totalPostTax,
        
        // Garnishments
        garnishments: garnishments.garnishments,
        totalGarnishments: garnishments.totalGarnishments,
        
        // Net pay
        netPay,
        
        // Year-to-date totals
        ytdTotals: await this.calculateYTDTotals(employeeId, payDate)
      };
    } catch (error) {
      throw new Error(`Employee payroll processing failed: ${error.message}`);
    }
  }

  // Calculate gross pay components
  async calculateGrossPay(params) {
    try {
      const {
        employee,
        hoursWorked,
        overtimeHours,
        bonusAmount,
        commissionAmount,
        adjustments
      } = params;

      const regularHours = Math.max(0, hoursWorked - overtimeHours);
      const regularPay = regularHours * employee.hourlyRate;
      const overtimePay = overtimeHours * employee.hourlyRate * 1.5;
      
      const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
      
      const totalGrossPay = regularPay + overtimePay + bonusAmount + commissionAmount + adjustmentTotal;

      return {
        regularPay,
        overtimePay,
        bonusAmount,
        commissionAmount,
        adjustments,
        totalGrossPay
      };
    } catch (error) {
      throw new Error(`Gross pay calculation failed: ${error.message}`);
    }
  }

  // Calculate pre-tax deductions
  async calculatePreTaxDeductions(employee) {
    try {
      const deductions = [];
      let totalPreTax = 0;

      // Health insurance
      if (employee.benefits.healthInsurance) {
        const healthPremium = employee.benefits.healthInsurance.employeeContribution || 0;
        deductions.push({
          type: 'health_insurance',
          description: 'Health Insurance Premium',
          amount: healthPremium
        });
        totalPreTax += healthPremium;
      }

      // Dental insurance
      if (employee.benefits.dentalInsurance) {
        const dentalPremium = employee.benefits.dentalInsurance.employeeContribution || 0;
        deductions.push({
          type: 'dental_insurance',
          description: 'Dental Insurance Premium',
          amount: dentalPremium
        });
        totalPreTax += dentalPremium;
      }

      // Vision insurance
      if (employee.benefits.visionInsurance) {
        const visionPremium = employee.benefits.visionInsurance.employeeContribution || 0;
        deductions.push({
          type: 'vision_insurance',
          description: 'Vision Insurance Premium',
          amount: visionPremium
        });
        totalPreTax += visionPremium;
      }

      // 401(k) contribution
      if (employee.benefits.retirement401k) {
        const contribution401k = employee.benefits.retirement401k.employeeContribution || 0;
        deductions.push({
          type: 'retirement_401k',
          description: '401(k) Contribution',
          amount: contribution401k
        });
        totalPreTax += contribution401k;
      }

      // Flexible Spending Account
      if (employee.benefits.fsaHealthcare) {
        const fsaContribution = employee.benefits.fsaHealthcare.payrollDeduction || 0;
        deductions.push({
          type: 'fsa_healthcare',
          description: 'Healthcare FSA',
          amount: fsaContribution
        });
        totalPreTax += fsaContribution;
      }

      // Dependent Care FSA
      if (employee.benefits.fsaDependentCare) {
        const fsaDepCareContribution = employee.benefits.fsaDependentCare.payrollDeduction || 0;
        deductions.push({
          type: 'fsa_dependent_care',
          description: 'Dependent Care FSA',
          amount: fsaDepCareContribution
        });
        totalPreTax += fsaDepCareContribution;
      }

      // Transit benefits
      if (employee.benefits.transitBenefit) {
        const transitAmount = employee.benefits.transitBenefit.monthlyAmount || 0;
        deductions.push({
          type: 'transit_benefit',
          description: 'Transit Benefit',
          amount: transitAmount
        });
        totalPreTax += transitAmount;
      }

      return {
        deductions,
        totalPreTax
      };
    } catch (error) {
      throw new Error(`Pre-tax deduction calculation failed: ${error.message}`);
    }
  }

  // Calculate taxes
  async calculateTaxes(params) {
    try {
      const { employee, taxableIncome, grossPay } = params;
      const taxes = [];
      let totalTaxes = 0;

      // Federal income tax
      const federalIncomeTax = this.calculateFederalIncomeTax(
        taxableIncome, 
        employee.taxInfo.filingStatus, 
        employee.taxInfo.allowances || 0
      );
      taxes.push({
        type: 'federal_income',
        description: 'Federal Income Tax',
        amount: federalIncomeTax
      });
      totalTaxes += federalIncomeTax;

      // State income tax
      const stateIncomeTax = this.calculateStateIncomeTax(
        taxableIncome, 
        employee.workState || 'CA'
      );
      taxes.push({
        type: 'state_income',
        description: 'State Income Tax',
        amount: stateIncomeTax
      });
      totalTaxes += stateIncomeTax;

      // Social Security tax
      const socialSecurityTax = Math.min(
        grossPay * this.taxRates.federal.socialSecurity.rate,
        this.taxRates.federal.socialSecurity.wageBase * this.taxRates.federal.socialSecurity.rate
      );
      taxes.push({
        type: 'social_security',
        description: 'Social Security Tax',
        amount: socialSecurityTax
      });
      totalTaxes += socialSecurityTax;

      // Medicare tax
      let medicareTax = grossPay * this.taxRates.federal.medicare.rate;
      
      // Additional Medicare tax for high earners
      if (grossPay > this.taxRates.federal.medicare.threshold) {
        const additionalMedicare = (grossPay - this.taxRates.federal.medicare.threshold) * 
          this.taxRates.federal.medicare.additionalRate;
        medicareTax += additionalMedicare;
      }
      
      taxes.push({
        type: 'medicare',
        description: 'Medicare Tax',
        amount: medicareTax
      });
      totalTaxes += medicareTax;

      // State Disability Insurance (SDI) - for applicable states
      if (employee.workState === 'CA') {
        const sdiTax = Math.min(
          grossPay * this.taxRates.state.CA.sdi.rate,
          this.taxRates.state.CA.sdi.wageBase * this.taxRates.state.CA.sdi.rate
        );
        taxes.push({
          type: 'state_disability',
          description: 'State Disability Insurance',
          amount: sdiTax
        });
        totalTaxes += sdiTax;
      }

      return {
        taxes,
        totalTaxes
      };
    } catch (error) {
      throw new Error(`Tax calculation failed: ${error.message}`);
    }
  }

  // Calculate post-tax deductions
  async calculatePostTaxDeductions(employee) {
    try {
      const deductions = [];
      let totalPostTax = 0;

      // Life insurance premiums (if employee-paid)
      if (employee.benefits.lifeInsurance && employee.benefits.lifeInsurance.employeePaid) {
        const lifePremium = employee.benefits.lifeInsurance.premium || 0;
        deductions.push({
          type: 'life_insurance',
          description: 'Life Insurance Premium',
          amount: lifePremium
        });
        totalPostTax += lifePremium;
      }

      // Disability insurance premiums (if employee-paid)
      if (employee.benefits.disabilityInsurance && employee.benefits.disabilityInsurance.employeePaid) {
        const disabilityPremium = employee.benefits.disabilityInsurance.premium || 0;
        deductions.push({
          type: 'disability_insurance',
          description: 'Disability Insurance Premium',
          amount: disabilityPremium
        });
        totalPostTax += disabilityPremium;
      }

      // Union dues
      if (employee.unionDues) {
        deductions.push({
          type: 'union_dues',
          description: 'Union Dues',
          amount: employee.unionDues.amount || 0
        });
        totalPostTax += employee.unionDues.amount || 0;
      }

      // Employee loans
      if (employee.loans && employee.loans.length > 0) {
        employee.loans.forEach(loan => {
          deductions.push({
            type: 'employee_loan',
            description: `Loan Payment - ${loan.id}`,
            amount: loan.paymentAmount || 0
          });
          totalPostTax += loan.paymentAmount || 0;
        });
      }

      return {
        deductions,
        totalPostTax
      };
    } catch (error) {
      throw new Error(`Post-tax deduction calculation failed: ${error.message}`);
    }
  }

  // Calculate garnishments
  async calculateGarnishments(employee, taxableIncome) {
    try {
      const garnishments = [];
      let totalGarnishments = 0;

      if (employee.garnishments && employee.garnishments.length > 0) {
        for (let garnishment of employee.garnishments) {
          let amount = 0;

          switch (garnishment.type) {
            case 'wage_garnishment':
              amount = Math.min(
                taxableIncome * garnishment.percentage,
                garnishment.maxAmount || Infinity
              );
              break;
            case 'child_support':
              amount = garnishment.fixedAmount || 0;
              break;
            case 'tax_levy':
              amount = Math.min(
                taxableIncome * garnishment.percentage,
                garnishment.maxAmount || Infinity
              );
              break;
            default:
              amount = garnishment.amount || 0;
          }

          garnishments.push({
            type: garnishment.type,
            description: garnishment.description,
            amount,
            caseNumber: garnishment.caseNumber
          });
          totalGarnishments += amount;
        }
      }

      return {
        garnishments,
        totalGarnishments
      };
    } catch (error) {
      throw new Error(`Garnishment calculation failed: ${error.message}`);
    }
  }

  // Calculate year-to-date totals
  async calculateYTDTotals(employeeId, currentPayDate) {
    try {
      // Mock YTD calculations (in real implementation, would query historical payroll records)
      return {
        grossPay: 125000,
        federalTaxes: 18750,
        stateTaxes: 6250,
        socialSecurityTax: 7750,
        medicareTax: 1812.50,
        netPay: 89437.50,
        retirement401k: 12500,
        healthInsurance: 3600
      };
    } catch (error) {
      throw new Error(`YTD calculation failed: ${error.message}`);
    }
  }

  // Approve payroll
  async approvePayroll(params) {
    try {
      const {
        payrollId,
        approverUserId,
        approvalNotes,
        overrides = []
      } = params;

      // Validate payroll record exists and can be approved
      const payrollRecord = await this.getPayrollRecord(payrollId);
      
      if (payrollRecord.status !== this.payrollStatuses.PENDING_APPROVAL) {
        throw new Error('Payroll cannot be approved in current status');
      }

      // Apply any overrides
      if (overrides.length > 0) {
        await this.applyPayrollOverrides(payrollId, overrides);
      }

      // Update status and approval information
      const approvedPayroll = {
        ...payrollRecord,
        status: this.payrollStatuses.APPROVED,
        approvedBy: approverUserId,
        approvedDate: new Date(),
        approvalNotes
      };

      return approvedPayroll;
    } catch (error) {
      throw new Error(`Payroll approval failed: ${error.message}`);
    }
  }

  // Generate payroll reports
  async generatePayrollReports(params) {
    try {
      const {
        payrollId,
        reportTypes = ['summary', 'detailed', 'tax_liability', 'deduction_register']
      } = params;

      const reports = {};
      const payrollRecord = await this.getPayrollRecord(payrollId);

      if (reportTypes.includes('summary')) {
        reports.summary = await this.generatePayrollSummaryReport(payrollRecord);
      }

      if (reportTypes.includes('detailed')) {
        reports.detailed = await this.generateDetailedPayrollReport(payrollRecord);
      }

      if (reportTypes.includes('tax_liability')) {
        reports.taxLiability = await this.generateTaxLiabilityReport(payrollRecord);
      }

      if (reportTypes.includes('deduction_register')) {
        reports.deductionRegister = await this.generateDeductionRegisterReport(payrollRecord);
      }

      return {
        payrollId,
        generateDate: new Date(),
        reports
      };
    } catch (error) {
      throw new Error(`Payroll report generation failed: ${error.message}`);
    }
  }

  // Calculate employer taxes and contributions
  async calculateEmployerLiabilities(payrollRecord) {
    try {
      const liabilities = [];
      let totalLiabilities = 0;

      // Calculate employer taxes for each employee
      for (let employee of payrollRecord.employees) {
        // Employer Social Security match
        const employerSS = Math.min(
          employee.grossPay * this.taxRates.federal.socialSecurity.rate,
          this.taxRates.federal.socialSecurity.wageBase * this.taxRates.federal.socialSecurity.rate
        );

        // Employer Medicare match
        const employerMedicare = employee.grossPay * this.taxRates.federal.medicare.rate;

        // Federal unemployment tax
        const futa = Math.min(
          employee.grossPay * this.taxRates.federal.unemployment.rate,
          this.taxRates.federal.unemployment.wageBase * this.taxRates.federal.unemployment.rate
        );

        // State unemployment tax (example for CA)
        const suta = Math.min(
          employee.grossPay * (this.taxRates.state.CA?.unemployment?.rate || 0.034),
          (this.taxRates.state.CA?.unemployment?.wageBase || 7000) * (this.taxRates.state.CA?.unemployment?.rate || 0.034)
        );

        const employeeLiabilities = employerSS + employerMedicare + futa + suta;
        totalLiabilities += employeeLiabilities;

        liabilities.push({
          employeeId: employee.employeeId,
          employerSocialSecurity: employerSS,
          employerMedicare: employerMedicare,
          federalUnemployment: futa,
          stateUnemployment: suta,
          totalEmployerLiabilities: employeeLiabilities
        });
      }

      return {
        liabilities,
        totalLiabilities,
        summary: {
          totalEmployerSocialSecurity: liabilities.reduce((sum, l) => sum + l.employerSocialSecurity, 0),
          totalEmployerMedicare: liabilities.reduce((sum, l) => sum + l.employerMedicare, 0),
          totalFederalUnemployment: liabilities.reduce((sum, l) => sum + l.federalUnemployment, 0),
          totalStateUnemployment: liabilities.reduce((sum, l) => sum + l.stateUnemployment, 0)
        }
      };
    } catch (error) {
      throw new Error(`Employer liability calculation failed: ${error.message}`);
    }
  }

  // Helper methods
  async getEmployeePayrollInfo(employeeId) {
    // Mock employee data (in real implementation, would fetch from database)
    return {
      employeeId,
      name: 'John Doe',
      hourlyRate: 35.00,
      salaryType: 'hourly', // hourly, salary, commission
      annualSalary: 72800,
      payFrequency: 'biweekly',
      workState: 'CA',
      taxInfo: {
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0
      },
      benefits: {
        healthInsurance: { employeeContribution: 150 },
        dentalInsurance: { employeeContribution: 25 },
        visionInsurance: { employeeContribution: 10 },
        retirement401k: { employeeContribution: 280 },
        fsaHealthcare: { payrollDeduction: 125 }
      },
      garnishments: []
    };
  }

  calculateFederalIncomeTax(taxableIncome, filingStatus, allowances) {
    // Simplified federal tax calculation
    const standardDeduction = filingStatus === 'married' ? 27700 : 13850;
    const exemptionAmount = allowances * 4000;
    const adjustedIncome = Math.max(0, taxableIncome - standardDeduction - exemptionAmount);
    
    let tax = 0;
    let remaining = adjustedIncome;
    
    for (let bracket of this.taxRates.federal.income) {
      if (remaining <= 0) break;
      
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
    
    return tax;
  }

  calculateStateIncomeTax(taxableIncome, state) {
    const stateRates = this.taxRates.state[state];
    if (!stateRates || !stateRates.income) return 0;
    
    let tax = 0;
    let remaining = taxableIncome;
    
    for (let bracket of stateRates.income) {
      if (remaining <= 0) break;
      
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
    
    return tax;
  }

  async getPayrollRecord(payrollId) {
    // Mock payroll record retrieval
    return {
      payrollId,
      status: this.payrollStatuses.PENDING_APPROVAL,
      employees: []
    };
  }

  async applyPayrollOverrides(payrollId, overrides) {
    // Apply manual overrides to payroll calculations
    return overrides;
  }

  async generatePayrollSummaryReport(payrollRecord) {
    return {
      reportType: 'summary',
      payrollPeriod: `${payrollRecord.payPeriodStart} - ${payrollRecord.payPeriodEnd}`,
      employeeCount: payrollRecord.employeeCount,
      totalGrossPay: payrollRecord.totals.grossPay,
      totalNetPay: payrollRecord.totals.netPay,
      totalTaxes: payrollRecord.totals.taxes,
      totalDeductions: payrollRecord.totals.deductions
    };
  }

  async generateDetailedPayrollReport(payrollRecord) {
    return {
      reportType: 'detailed',
      employees: payrollRecord.employees.map(emp => ({
        employeeId: emp.employeeId,
        name: emp.employeeName,
        grossPay: emp.grossPay,
        netPay: emp.netPay,
        taxes: emp.totalTaxes,
        deductions: emp.totalPreTaxDeductions + emp.totalPostTaxDeductions
      }))
    };
  }

  async generateTaxLiabilityReport(payrollRecord) {
    const employerLiabilities = await this.calculateEmployerLiabilities(payrollRecord);
    
    return {
      reportType: 'tax_liability',
      employeeTaxes: payrollRecord.totals.taxes,
      employerLiabilities: employerLiabilities.totalLiabilities,
      totalTaxLiability: payrollRecord.totals.taxes + employerLiabilities.totalLiabilities
    };
  }

  async generateDeductionRegisterReport(payrollRecord) {
    const deductionSummary = {};
    
    payrollRecord.employees.forEach(emp => {
      emp.preTaxDeductions.forEach(ded => {
        if (!deductionSummary[ded.type]) {
          deductionSummary[ded.type] = { total: 0, count: 0 };
        }
        deductionSummary[ded.type].total += ded.amount;
        deductionSummary[ded.type].count += 1;
      });
    });
    
    return {
      reportType: 'deduction_register',
      deductionSummary
    };
  }
}

module.exports = new PayrollProcessingService();
