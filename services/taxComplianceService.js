const mongoose = require('mongoose');

// Tax Compliance Service
// Handles tax regulations, compliance reporting, and regulatory requirements
class TaxComplianceService {
  constructor() {
    this.taxForms = {
      W2: 'w2',
      W4: 'w4',
      I9: 'i9',
      FORM_941: 'form_941',
      FORM_940: 'form_940',
      FORM_944: 'form_944',
      STATE_QUARTERLY: 'state_quarterly',
      LOCAL_QUARTERLY: 'local_quarterly',
      ACA_1095C: 'aca_1095c'
    };

    this.complianceTypes = {
      FEDERAL: 'federal',
      STATE: 'state',
      LOCAL: 'local',
      ACA: 'aca',
      WORKERS_COMP: 'workers_comp',
      UNEMPLOYMENT: 'unemployment'
    };

    this.filingFrequencies = {
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      ANNUALLY: 'annually',
      SEMIANNUALLY: 'semiannually'
    };

    this.taxYearData = {
      2025: {
        standardDeduction: {
          single: 13850,
          marriedFilingJointly: 27700,
          marriedFilingSeparately: 13850,
          headOfHousehold: 20800
        },
        socialSecurityWageBase: 147000,
        medicareAdditionalTaxThreshold: 200000,
        federalUnemploymentWageBase: 7000
      }
    };

    this.stateRequirements = {
      CA: {
        stateCode: 'CA',
        hasIncomeTax: true,
        hasSDI: true,
        hasUnemployment: true,
        filingThresholds: { annual: 600 },
        specialRequirements: ['PFL', 'ETT']
      },
      TX: {
        stateCode: 'TX',
        hasIncomeTax: false,
        hasSDI: false,
        hasUnemployment: true,
        specialRequirements: []
      },
      NY: {
        stateCode: 'NY',
        hasIncomeTax: true,
        hasSDI: true,
        hasUnemployment: true,
        specialRequirements: ['NYFML']
      }
    };
  }

  // Generate tax compliance calendar
  async generateComplianceCalendar(params) {
    try {
      const {
        taxYear = new Date().getFullYear(),
        states = ['CA', 'TX', 'NY'],
        localities = [],
        employeeCount,
        includeACA = true
      } = params;

      const calendar = [];
      const quarters = [
        { quarter: 'Q1', months: [1, 2, 3], dueDate: '04-30' },
        { quarter: 'Q2', months: [4, 5, 6], dueDate: '07-31' },
        { quarter: 'Q3', months: [7, 8, 9], dueDate: '10-31' },
        { quarter: 'Q4', months: [10, 11, 12], dueDate: '01-31' }
      ];

      // Federal compliance requirements
      calendar.push(...this.generateFederalComplianceItems(taxYear, employeeCount));

      // State compliance requirements
      for (let state of states) {
        calendar.push(...this.generateStateComplianceItems(taxYear, state, employeeCount));
      }

      // ACA compliance (if applicable)
      if (includeACA && employeeCount >= 50) {
        calendar.push(...this.generateACAComplianceItems(taxYear));
      }

      // Local compliance requirements
      for (let locality of localities) {
        calendar.push(...this.generateLocalComplianceItems(taxYear, locality));
      }

      // Sort by due date
      calendar.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      return {
        taxYear,
        totalItems: calendar.length,
        upcomingDeadlines: calendar.filter(item => {
          const dueDate = new Date(item.dueDate);
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
          return dueDate >= now && dueDate <= thirtyDaysFromNow;
        }),
        calendar
      };
    } catch (error) {
      throw new Error(`Compliance calendar generation failed: ${error.message}`);
    }
  }

  // Process tax withholdings
  async processTaxWithholdings(params) {
    try {
      const {
        employeeId,
        grossWages,
        payPeriod,
        taxYear = new Date().getFullYear(),
        state,
        localJurisdictions = []
      } = params;

      const employee = await this.getEmployeeTaxInfo(employeeId);
      const annualizedWages = this.annualizeWages(grossWages, payPeriod);

      const withholdings = {
        federal: {},
        state: {},
        local: {},
        fica: {},
        totals: {}
      };

      // Federal income tax withholding
      withholdings.federal.incomeTax = this.calculateFederalWithholding({
        grossWages,
        annualizedWages,
        filingStatus: employee.filingStatus,
        allowances: employee.allowances,
        additionalWithholding: employee.additionalWithholding,
        payPeriod
      });

      // FICA taxes
      withholdings.fica.socialSecurity = this.calculateSocialSecurityTax(grossWages, employee.ytdWages);
      withholdings.fica.medicare = this.calculateMedicareTax(grossWages, employee.ytdWages);

      // State taxes
      if (this.stateRequirements[state]?.hasIncomeTax) {
        withholdings.state.incomeTax = this.calculateStateWithholding({
          grossWages,
          annualizedWages,
          state,
          filingStatus: employee.filingStatus,
          allowances: employee.stateAllowances || employee.allowances
        });
      }

      // State disability insurance
      if (this.stateRequirements[state]?.hasSDI) {
        withholdings.state.sdi = this.calculateSDITax(grossWages, state, employee.ytdWages);
      }

      // Local taxes
      for (let jurisdiction of localJurisdictions) {
        withholdings.local[jurisdiction.code] = this.calculateLocalTax({
          grossWages,
          jurisdiction,
          employee
        });
      }

      // Calculate totals
      withholdings.totals = this.calculateWithholdingTotals(withholdings);

      return {
        employeeId,
        payPeriod,
        grossWages,
        withholdings,
        netPay: grossWages - withholdings.totals.totalWithholding,
        calculationDate: new Date()
      };
    } catch (error) {
      throw new Error(`Tax withholding processing failed: ${error.message}`);
    }
  }

  // Generate quarterly tax reports
  async generateQuarterlyReports(params) {
    try {
      const {
        quarter, // Q1, Q2, Q3, Q4
        taxYear,
        jurisdiction = 'federal', // federal, state, local
        reportTypes = ['941', 'unemployment']
      } = params;

      const reports = {};
      const quarterData = await this.getQuarterlyData(quarter, taxYear);

      // Federal Form 941 (Quarterly)
      if (reportTypes.includes('941') && jurisdiction === 'federal') {
        reports.form941 = await this.generateForm941(quarterData);
      }

      // State quarterly reports
      if (jurisdiction !== 'federal') {
        reports.stateQuarterly = await this.generateStateQuarterlyReport(quarterData, jurisdiction);
      }

      // Unemployment reports
      if (reportTypes.includes('unemployment')) {
        reports.unemploymentReport = await this.generateUnemploymentReport(quarterData, jurisdiction);
      }

      return {
        quarter,
        taxYear,
        jurisdiction,
        generatedDate: new Date(),
        reports
      };
    } catch (error) {
      throw new Error(`Quarterly report generation failed: ${error.message}`);
    }
  }

  // Generate annual tax documents
  async generateAnnualTaxDocuments(params) {
    try {
      const {
        taxYear,
        employees = [],
        documentTypes = ['w2', 'w3', '940', 'aca']
      } = params;

      const documents = {};

      // W-2 forms for employees
      if (documentTypes.includes('w2')) {
        documents.w2Forms = [];
        for (let employeeId of employees) {
          const w2 = await this.generateW2Form(employeeId, taxYear);
          documents.w2Forms.push(w2);
        }
      }

      // W-3 summary form
      if (documentTypes.includes('w3')) {
        documents.w3Form = await this.generateW3Form(taxYear);
      }

      // Form 940 (Annual Federal Unemployment)
      if (documentTypes.includes('940')) {
        documents.form940 = await this.generateForm940(taxYear);
      }

      // ACA forms (1094-C and 1095-C)
      if (documentTypes.includes('aca')) {
        documents.acaForms = await this.generateACAForms(taxYear, employees);
      }

      return {
        taxYear,
        generatedDate: new Date(),
        employeeCount: employees.length,
        documents
      };
    } catch (error) {
      throw new Error(`Annual tax document generation failed: ${error.message}`);
    }
  }

  // Validate tax compliance
  async validateTaxCompliance(params) {
    try {
      const {
        taxYear,
        quarter,
        scope = 'all' // all, federal, state, local, aca
      } = params;

      const validationResults = {
        overallStatus: 'compliant',
        issues: [],
        warnings: [],
        recommendations: []
      };

      // Federal compliance validation
      if (scope === 'all' || scope === 'federal') {
        const federalValidation = await this.validateFederalCompliance(taxYear, quarter);
        validationResults.issues.push(...federalValidation.issues);
        validationResults.warnings.push(...federalValidation.warnings);
      }

      // State compliance validation
      if (scope === 'all' || scope === 'state') {
        const stateValidation = await this.validateStateCompliance(taxYear, quarter);
        validationResults.issues.push(...stateValidation.issues);
        validationResults.warnings.push(...stateValidation.warnings);
      }

      // ACA compliance validation
      if (scope === 'all' || scope === 'aca') {
        const acaValidation = await this.validateACACompliance(taxYear);
        validationResults.issues.push(...acaValidation.issues);
        validationResults.warnings.push(...acaValidation.warnings);
      }

      // Determine overall status
      if (validationResults.issues.length > 0) {
        validationResults.overallStatus = 'non_compliant';
      } else if (validationResults.warnings.length > 0) {
        validationResults.overallStatus = 'attention_required';
      }

      // Generate recommendations
      validationResults.recommendations = this.generateComplianceRecommendations(validationResults);

      return validationResults;
    } catch (error) {
      throw new Error(`Tax compliance validation failed: ${error.message}`);
    }
  }

  // Calculate tax liabilities
  async calculateTaxLiabilities(params) {
    try {
      const {
        payrollData,
        period, // monthly, quarterly, annual
        taxYear
      } = params;

      const liabilities = {
        federal: {},
        state: {},
        local: {},
        totals: {}
      };

      // Federal liabilities
      liabilities.federal = {
        incomeTax: payrollData.totalFederalWithholding,
        socialSecurity: {
          employee: payrollData.totalSSEmployee,
          employer: payrollData.totalSSEmployer,
          total: payrollData.totalSSEmployee + payrollData.totalSSEmployer
        },
        medicare: {
          employee: payrollData.totalMedicareEmployee,
          employer: payrollData.totalMedicareEmployer,
          total: payrollData.totalMedicareEmployee + payrollData.totalMedicareEmployer
        },
        federalUnemployment: payrollData.totalFUTA
      };

      // State liabilities
      for (let state of Object.keys(payrollData.stateData || {})) {
        const stateData = payrollData.stateData[state];
        liabilities.state[state] = {
          incomeTax: stateData.totalStateWithholding,
          unemployment: stateData.totalSUTA,
          disability: stateData.totalSDI || 0
        };
      }

      // Calculate totals
      liabilities.totals = {
        employeeTaxes: this.sumEmployeeTaxes(liabilities),
        employerTaxes: this.sumEmployerTaxes(liabilities),
        totalLiability: this.sumTotalLiabilities(liabilities)
      };

      // Due dates for payments
      liabilities.dueDates = this.calculateTaxDueDates(period, taxYear);

      return liabilities;
    } catch (error) {
      throw new Error(`Tax liability calculation failed: ${error.message}`);
    }
  }

  // Process tax payments
  async processTaxPayments(params) {
    try {
      const {
        liabilities,
        paymentMethod = 'eftps', // eftps, check, ach
        paymentDate,
        confirmationNumbers = {}
      } = params;

      const payments = [];

      // Federal tax payments
      if (liabilities.federal) {
        const federalPayment = {
          jurisdiction: 'federal',
          amount: liabilities.federal.incomeTax + 
                  liabilities.federal.socialSecurity.total + 
                  liabilities.federal.medicare.total,
          paymentMethod,
          paymentDate,
          confirmationNumber: confirmationNumbers.federal,
          status: 'processed'
        };
        payments.push(federalPayment);
      }

      // State tax payments
      for (let state of Object.keys(liabilities.state || {})) {
        const statePayment = {
          jurisdiction: `state_${state}`,
          amount: Object.values(liabilities.state[state]).reduce((sum, val) => sum + val, 0),
          paymentMethod,
          paymentDate,
          confirmationNumber: confirmationNumbers[state],
          status: 'processed'
        };
        payments.push(statePayment);
      }

      return {
        paymentDate,
        totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        payments,
        processedDate: new Date()
      };
    } catch (error) {
      throw new Error(`Tax payment processing failed: ${error.message}`);
    }
  }

  // Monitor compliance deadlines
  async monitorComplianceDeadlines(params) {
    try {
      const {
        lookAheadDays = 30,
        includeCompleted = false
      } = params;

      const today = new Date();
      const lookAheadDate = new Date(today.getTime() + (lookAheadDays * 24 * 60 * 60 * 1000));

      const upcomingDeadlines = await this.getUpcomingDeadlines(today, lookAheadDate, includeCompleted);

      // Categorize deadlines by urgency
      const categorized = {
        overdue: upcomingDeadlines.filter(d => new Date(d.dueDate) < today),
        urgent: upcomingDeadlines.filter(d => {
          const dueDate = new Date(d.dueDate);
          const urgentDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
          return dueDate >= today && dueDate <= urgentDate;
        }),
        upcoming: upcomingDeadlines.filter(d => {
          const dueDate = new Date(d.dueDate);
          const urgentDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
          return dueDate > urgentDate && dueDate <= lookAheadDate;
        })
      };

      return {
        lookAheadDays,
        totalDeadlines: upcomingDeadlines.length,
        overdueCount: categorized.overdue.length,
        urgentCount: categorized.urgent.length,
        upcomingCount: categorized.upcoming.length,
        deadlines: categorized,
        alerts: this.generateComplianceAlerts(categorized)
      };
    } catch (error) {
      throw new Error(`Compliance deadline monitoring failed: ${error.message}`);
    }
  }

  // Helper methods
  generateFederalComplianceItems(taxYear, employeeCount) {
    const items = [];

    // Quarterly Form 941
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const dueDates = ['04-30', '07-31', '10-31', '01-31'];

    quarters.forEach((quarter, index) => {
      const year = quarter === 'Q4' ? taxYear + 1 : taxYear;
      items.push({
        type: this.taxForms.FORM_941,
        description: `Form 941 - ${quarter} ${taxYear}`,
        dueDate: `${year}-${dueDates[index]}`,
        jurisdiction: 'federal',
        frequency: this.filingFrequencies.QUARTERLY,
        penalty: 'Late filing penalties apply'
      });
    });

    // Annual Form 940
    items.push({
      type: this.taxForms.FORM_940,
      description: `Form 940 - Annual ${taxYear}`,
      dueDate: `${taxYear + 1}-01-31`,
      jurisdiction: 'federal',
      frequency: this.filingFrequencies.ANNUALLY
    });

    // W-2 and W-3 forms
    items.push({
      type: this.taxForms.W2,
      description: `W-2 Forms Distribution to Employees`,
      dueDate: `${taxYear + 1}-01-31`,
      jurisdiction: 'federal',
      frequency: this.filingFrequencies.ANNUALLY
    });

    items.push({
      type: 'W3',
      description: `W-3 Form Filing with SSA`,
      dueDate: `${taxYear + 1}-01-31`,
      jurisdiction: 'federal',
      frequency: this.filingFrequencies.ANNUALLY
    });

    return items;
  }

  generateStateComplianceItems(taxYear, state, employeeCount) {
    const items = [];
    const stateReq = this.stateRequirements[state];

    if (!stateReq) return items;

    // State quarterly returns
    if (stateReq.hasIncomeTax || stateReq.hasUnemployment) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const dueDates = ['04-30', '07-31', '10-31', '01-31'];

      quarters.forEach((quarter, index) => {
        const year = quarter === 'Q4' ? taxYear + 1 : taxYear;
        items.push({
          type: this.taxForms.STATE_QUARTERLY,
          description: `${state} Quarterly Return - ${quarter} ${taxYear}`,
          dueDate: `${year}-${dueDates[index]}`,
          jurisdiction: `state_${state}`,
          frequency: this.filingFrequencies.QUARTERLY
        });
      });
    }

    // Annual state forms
    items.push({
      type: 'state_annual',
      description: `${state} Annual Tax Report`,
      dueDate: `${taxYear + 1}-01-31`,
      jurisdiction: `state_${state}`,
      frequency: this.filingFrequencies.ANNUALLY
    });

    return items;
  }

  generateACAComplianceItems(taxYear) {
    return [
      {
        type: this.taxForms.ACA_1095C,
        description: `1095-C Forms to Employees`,
        dueDate: `${taxYear + 1}-01-31`,
        jurisdiction: 'federal',
        frequency: this.filingFrequencies.ANNUALLY
      },
      {
        type: 'aca_1094c',
        description: `1094-C Filing with IRS`,
        dueDate: `${taxYear + 1}-02-28`,
        jurisdiction: 'federal',
        frequency: this.filingFrequencies.ANNUALLY
      }
    ];
  }

  generateLocalComplianceItems(taxYear, locality) {
    return [
      {
        type: this.taxForms.LOCAL_QUARTERLY,
        description: `${locality.name} Local Tax Return`,
        dueDate: `${taxYear}-04-30`,
        jurisdiction: `local_${locality.code}`,
        frequency: this.filingFrequencies.QUARTERLY
      }
    ];
  }

  async getEmployeeTaxInfo(employeeId) {
    // Mock employee tax information
    return {
      employeeId,
      filingStatus: 'single',
      allowances: 1,
      stateAllowances: 1,
      additionalWithholding: 0,
      ytdWages: 85000,
      ytdFederalTax: 12750,
      ytdStateTax: 4250
    };
  }

  annualizeWages(grossWages, payPeriod) {
    const payPeriodsPerYear = {
      weekly: 52,
      biweekly: 26,
      semimonthly: 24,
      monthly: 12
    };

    return grossWages * (payPeriodsPerYear[payPeriod] || 26);
  }

  calculateFederalWithholding(params) {
    const { grossWages, filingStatus, allowances, additionalWithholding, payPeriod } = params;
    
    // Simplified federal withholding calculation
    // In reality, would use IRS Publication 15 tables
    const annualWages = this.annualizeWages(grossWages, payPeriod);
    const standardDeduction = this.taxYearData[2025].standardDeduction[filingStatus] || this.taxYearData[2025].standardDeduction.single;
    const exemptions = allowances * 4000;
    
    const taxableIncome = Math.max(0, annualWages - standardDeduction - exemptions);
    const annualTax = this.calculateProgressiveTax(taxableIncome, 'federal');
    const payPeriodTax = annualTax / (payPeriod === 'weekly' ? 52 : payPeriod === 'biweekly' ? 26 : 12);
    
    return Math.max(0, payPeriodTax + additionalWithholding);
  }

  calculateSocialSecurityTax(grossWages, ytdWages) {
    const ssWageBase = this.taxYearData[2025].socialSecurityWageBase;
    const ssRate = 0.062;
    
    if (ytdWages >= ssWageBase) return 0;
    
    const remainingWageBase = ssWageBase - ytdWages;
    const taxableWages = Math.min(grossWages, remainingWageBase);
    
    return taxableWages * ssRate;
  }

  calculateMedicareTax(grossWages, ytdWages) {
    const medicareRate = 0.0145;
    const additionalMedicareThreshold = this.taxYearData[2025].medicareAdditionalTaxThreshold;
    const additionalMedicareRate = 0.009;
    
    let medicareTax = grossWages * medicareRate;
    
    // Additional Medicare tax for high earners
    if (ytdWages + grossWages > additionalMedicareThreshold) {
      const excessWages = Math.max(0, (ytdWages + grossWages) - additionalMedicareThreshold);
      const additionalWages = Math.min(grossWages, excessWages);
      medicareTax += additionalWages * additionalMedicareRate;
    }
    
    return medicareTax;
  }

  calculateStateWithholding(params) {
    const { grossWages, state, filingStatus } = params;
    
    // Simplified state calculation
    const stateRates = {
      CA: 0.05,
      NY: 0.045,
      TX: 0.0
    };
    
    return grossWages * (stateRates[state] || 0);
  }

  calculateSDITax(grossWages, state, ytdWages) {
    const sdiRates = {
      CA: { rate: 0.009, wageBase: 145600 },
      NY: { rate: 0.005, wageBase: 203.27 }
    };
    
    const sdiInfo = sdiRates[state];
    if (!sdiInfo) return 0;
    
    if (ytdWages >= sdiInfo.wageBase) return 0;
    
    const remainingWageBase = sdiInfo.wageBase - ytdWages;
    const taxableWages = Math.min(grossWages, remainingWageBase);
    
    return taxableWages * sdiInfo.rate;
  }

  calculateLocalTax(params) {
    const { grossWages, jurisdiction } = params;
    
    // Simplified local tax calculation
    return grossWages * (jurisdiction.rate || 0.01);
  }

  calculateWithholdingTotals(withholdings) {
    let totalWithholding = 0;
    
    // Sum federal taxes
    totalWithholding += withholdings.federal.incomeTax || 0;
    totalWithholding += withholdings.fica.socialSecurity || 0;
    totalWithholding += withholdings.fica.medicare || 0;
    
    // Sum state taxes
    Object.values(withholdings.state).forEach(tax => {
      totalWithholding += tax || 0;
    });
    
    // Sum local taxes
    Object.values(withholdings.local).forEach(tax => {
      totalWithholding += tax || 0;
    });
    
    return {
      totalWithholding,
      federalTotal: (withholdings.federal.incomeTax || 0) + (withholdings.fica.socialSecurity || 0) + (withholdings.fica.medicare || 0),
      stateTotal: Object.values(withholdings.state).reduce((sum, tax) => sum + (tax || 0), 0),
      localTotal: Object.values(withholdings.local).reduce((sum, tax) => sum + (tax || 0), 0)
    };
  }

  calculateProgressiveTax(income, jurisdiction) {
    // Simplified progressive tax calculation
    const brackets = {
      federal: [
        { min: 0, max: 11000, rate: 0.10 },
        { min: 11000, max: 44725, rate: 0.12 },
        { min: 44725, max: 95375, rate: 0.22 },
        { min: 95375, max: 182050, rate: 0.24 },
        { min: 182050, max: 231250, rate: 0.32 },
        { min: 231250, max: 578125, rate: 0.35 },
        { min: 578125, max: Infinity, rate: 0.37 }
      ]
    };
    
    const taxBrackets = brackets[jurisdiction] || brackets.federal;
    let tax = 0;
    let remaining = income;
    
    for (let bracket of taxBrackets) {
      if (remaining <= 0) break;
      
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
    
    return tax;
  }

  async getQuarterlyData(quarter, taxYear) {
    // Mock quarterly payroll data
    return {
      quarter,
      taxYear,
      totalWages: 2500000,
      totalFederalWithholding: 375000,
      totalSSWages: 2500000,
      totalSSWithholding: 155000,
      totalMedicareWages: 2500000,
      totalMedicareWithholding: 36250,
      employeeCount: 50
    };
  }

  async generateForm941(quarterData) {
    return {
      form: 'Form 941',
      quarter: quarterData.quarter,
      taxYear: quarterData.taxYear,
      employeeCount: quarterData.employeeCount,
      totalWages: quarterData.totalWages,
      totalFederalTax: quarterData.totalFederalWithholding,
      totalSocialSecurity: quarterData.totalSSWithholding * 2, // Employee + Employer
      totalMedicare: quarterData.totalMedicareWithholding * 2,
      totalTaxLiability: quarterData.totalFederalWithholding + (quarterData.totalSSWithholding * 2) + (quarterData.totalMedicareWithholding * 2)
    };
  }

  async generateW2Form(employeeId, taxYear) {
    // Mock W-2 generation
    return {
      form: 'W-2',
      taxYear,
      employeeId,
      box1: 145000, // Wages
      box2: 21750, // Federal income tax withheld
      box3: 145000, // Social security wages
      box4: 8990, // Social security tax withheld
      box5: 145000, // Medicare wages
      box6: 2102.50, // Medicare tax withheld
      generatedDate: new Date()
    };
  }

  async generateW3Form(taxYear) {
    return {
      form: 'W-3',
      taxYear,
      totalEmployees: 50,
      totalWages: 7250000,
      totalFederalTax: 1087500,
      totalSSWages: 7250000,
      totalSSWithholding: 449500,
      totalMedicareWages: 7250000,
      totalMedicareWithholding: 105125
    };
  }

  async generateForm940(taxYear) {
    return {
      form: 'Form 940',
      taxYear,
      totalFUTAWages: 350000, // Only wages up to $7,000 per employee
      totalFUTATax: 2100,
      stateUnemploymentPaid: 11900,
      creditReduction: 0
    };
  }

  async generateACAForms(taxYear, employees) {
    return {
      form1094C: {
        form: '1094-C',
        taxYear,
        totalEmployees: employees.length,
        offeredCoverage: true,
        aggregatedGroup: false
      },
      form1095CForms: employees.map(employeeId => ({
        form: '1095-C',
        taxYear,
        employeeId,
        offeredCoverage: [true, true, true, true, true, true, true, true, true, true, true, true],
        safeHarbor: ['2G', '2G', '2G', '2G', '2G', '2G', '2G', '2G', '2G', '2G', '2G', '2G']
      }))
    };
  }

  async validateFederalCompliance(taxYear, quarter) {
    const issues = [];
    const warnings = [];

    // Mock validation logic
    const form941Filed = await this.checkForm941Filed(quarter, taxYear);
    if (!form941Filed) {
      issues.push({
        type: 'missing_filing',
        description: `Form 941 not filed for ${quarter} ${taxYear}`,
        severity: 'high'
      });
    }

    return { issues, warnings };
  }

  async validateStateCompliance(taxYear, quarter) {
    return { issues: [], warnings: [] };
  }

  async validateACACompliance(taxYear) {
    return { issues: [], warnings: [] };
  }

  generateComplianceRecommendations(validationResults) {
    const recommendations = [];

    if (validationResults.issues.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Resolve compliance issues immediately to avoid penalties'
      });
    }

    if (validationResults.warnings.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Review warning items and take corrective action'
      });
    }

    return recommendations;
  }

  sumEmployeeTaxes(liabilities) {
    let total = 0;
    total += liabilities.federal.incomeTax || 0;
    total += liabilities.federal.socialSecurity?.employee || 0;
    total += liabilities.federal.medicare?.employee || 0;
    
    Object.values(liabilities.state).forEach(state => {
      total += state.incomeTax || 0;
      total += state.disability || 0;
    });
    
    return total;
  }

  sumEmployerTaxes(liabilities) {
    let total = 0;
    total += liabilities.federal.socialSecurity?.employer || 0;
    total += liabilities.federal.medicare?.employer || 0;
    total += liabilities.federal.federalUnemployment || 0;
    
    Object.values(liabilities.state).forEach(state => {
      total += state.unemployment || 0;
    });
    
    return total;
  }

  sumTotalLiabilities(liabilities) {
    return this.sumEmployeeTaxes(liabilities) + this.sumEmployerTaxes(liabilities);
  }

  calculateTaxDueDates(period, taxYear) {
    // Return relevant due dates based on period
    const dueDates = {};
    
    if (period === 'quarterly') {
      dueDates.form941 = `${taxYear}-04-30`; // Next quarter due date
    }
    
    return dueDates;
  }

  async getUpcomingDeadlines(startDate, endDate, includeCompleted) {
    // Mock upcoming deadlines
    return [
      {
        type: 'Form 941',
        description: 'Q1 2025 Form 941 Due',
        dueDate: '2025-04-30',
        jurisdiction: 'federal',
        status: 'pending'
      }
    ];
  }

  generateComplianceAlerts(categorizedDeadlines) {
    const alerts = [];
    
    if (categorizedDeadlines.overdue.length > 0) {
      alerts.push({
        type: 'error',
        message: `${categorizedDeadlines.overdue.length} overdue compliance items require immediate attention`
      });
    }
    
    if (categorizedDeadlines.urgent.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${categorizedDeadlines.urgent.length} compliance items due within 7 days`
      });
    }
    
    return alerts;
  }

  async checkForm941Filed(quarter, taxYear) {
    // Mock check for filed forms
    return Math.random() > 0.3; // 70% chance it's filed
  }
}

module.exports = new TaxComplianceService();
