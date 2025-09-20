const mongoose = require('mongoose');

// Compensation Management Service
// Handles salary adjustments, bonuses, equity, and comprehensive compensation administration
class CompensationManagementService {
  constructor() {
    this.compensationTypes = {
      BASE_SALARY: 'base_salary',
      HOURLY_WAGE: 'hourly_wage',
      BONUS: 'bonus',
      COMMISSION: 'commission',
      EQUITY: 'equity',
      ALLOWANCE: 'allowance',
      OVERTIME: 'overtime'
    };

    this.adjustmentTypes = {
      MERIT_INCREASE: 'merit_increase',
      PROMOTION: 'promotion',
      MARKET_ADJUSTMENT: 'market_adjustment',
      COST_OF_LIVING: 'cost_of_living',
      DEMOTION: 'demotion',
      CORRECTION: 'correction',
      TEMPORARY: 'temporary'
    };

    this.bonusTypes = {
      PERFORMANCE: 'performance',
      RETENTION: 'retention',
      SIGNING: 'signing',
      SPOT: 'spot',
      ANNUAL: 'annual',
      QUARTERLY: 'quarterly',
      PROJECT: 'project',
      REFERRAL: 'referral'
    };

    this.equityTypes = {
      STOCK_OPTIONS: 'stock_options',
      RESTRICTED_STOCK: 'restricted_stock',
      RSU: 'rsu',
      PHANTOM_STOCK: 'phantom_stock',
      ESPP: 'espp'
    };

    this.approvalStatuses = {
      DRAFT: 'draft',
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      IMPLEMENTED: 'implemented',
      CANCELLED: 'cancelled'
    };
  }

  // Create compensation adjustment request
  async createCompensationAdjustment(params) {
    try {
      const {
        employeeId,
        adjustmentType,
        requestedBy,
        effectiveDate,
        currentCompensation,
        proposedCompensation,
        justification,
        marketData = {},
        budgetImpact,
        managerApproval = false,
        hrApproval = false
      } = params;

      // Calculate adjustment details
      const adjustmentAmount = proposedCompensation - currentCompensation;
      const adjustmentPercentage = (adjustmentAmount / currentCompensation) * 100;

      // Determine approval workflow
      const approvalWorkflow = this.determineApprovalWorkflow({
        adjustmentType,
        adjustmentAmount,
        adjustmentPercentage,
        employeeLevel: await this.getEmployeeLevel(employeeId)
      });

      const adjustmentRequest = {
        id: `adj_${Date.now()}`,
        employeeId,
        adjustmentType,
        requestedBy,
        requestedDate: new Date(),
        effectiveDate,
        status: this.approvalStatuses.DRAFT,
        
        compensation: {
          current: currentCompensation,
          proposed: proposedCompensation,
          adjustmentAmount,
          adjustmentPercentage
        },
        
        justification,
        marketData,
        budgetImpact,
        
        approvalWorkflow,
        approvals: {
          manager: { required: approvalWorkflow.managerRequired, status: 'pending' },
          hr: { required: approvalWorkflow.hrRequired, status: 'pending' },
          finance: { required: approvalWorkflow.financeRequired, status: 'pending' },
          executive: { required: approvalWorkflow.executiveRequired, status: 'pending' }
        },
        
        auditTrail: [{
          action: 'created',
          userId: requestedBy,
          timestamp: new Date(),
          details: 'Compensation adjustment request created'
        }]
      };

      return adjustmentRequest;
    } catch (error) {
      throw new Error(`Compensation adjustment creation failed: ${error.message}`);
    }
  }

  // Process bonus payments
  async processBonusPayment(params) {
    try {
      const {
        employeeId,
        bonusType,
        bonusAmount,
        bonusPercentage,
        performancePeriod,
        performanceRating,
        paymentDate,
        payrollCycle,
        taxTreatment = 'supplemental',
        approvedBy,
        justification
      } = params;

      // Calculate actual bonus amount if percentage-based
      let actualBonusAmount = bonusAmount;
      if (bonusPercentage && !bonusAmount) {
        const baseSalary = await this.getEmployeeBaseSalary(employeeId);
        actualBonusAmount = baseSalary * (bonusPercentage / 100);
      }

      // Calculate tax implications
      const taxCalculation = await this.calculateBonusTaxes({
        bonusAmount: actualBonusAmount,
        employeeId,
        taxTreatment
      });

      const bonusPayment = {
        id: `bonus_${Date.now()}`,
        employeeId,
        bonusType,
        performancePeriod,
        performanceRating,
        
        amount: {
          gross: actualBonusAmount,
          taxes: taxCalculation.totalTaxes,
          net: actualBonusAmount - taxCalculation.totalTaxes
        },
        
        taxDetails: taxCalculation.breakdown,
        taxTreatment,
        
        paymentDate,
        payrollCycle,
        status: 'approved',
        
        approvedBy,
        approvedDate: new Date(),
        justification,
        
        auditTrail: [{
          action: 'processed',
          userId: approvedBy,
          timestamp: new Date(),
          details: `${bonusType} bonus processed for $${actualBonusAmount}`
        }]
      };

      return bonusPayment;
    } catch (error) {
      throw new Error(`Bonus payment processing failed: ${error.message}`);
    }
  }

  // Manage equity grants
  async manageEquityGrant(params) {
    try {
      const {
        employeeId,
        equityType,
        grantDate,
        grantAmount,
        strikePrice,
        vestingSchedule,
        expirationDate,
        grantReason,
        approvedBy
      } = params;

      // Calculate vesting schedule details
      const vestingDetails = this.calculateVestingSchedule({
        grantDate,
        grantAmount,
        vestingSchedule,
        expirationDate
      });

      // Determine current equity value
      const currentValuation = await this.getCurrentEquityValuation();
      const currentValue = this.calculateEquityValue({
        equityType,
        grantAmount,
        strikePrice,
        currentValuation
      });

      const equityGrant = {
        id: `equity_${Date.now()}`,
        employeeId,
        equityType,
        grantDate,
        grantAmount,
        strikePrice,
        
        vesting: {
          schedule: vestingSchedule,
          details: vestingDetails,
          vestedAmount: 0,
          unvestedAmount: grantAmount
        },
        
        valuation: {
          grantDateValue: currentValuation,
          currentValue: currentValue.currentValue,
          potentialValue: currentValue.potentialValue
        },
        
        expirationDate,
        grantReason,
        status: 'active',
        
        approvedBy,
        approvedDate: new Date(),
        
        auditTrail: [{
          action: 'granted',
          userId: approvedBy,
          timestamp: new Date(),
          details: `${equityType} grant of ${grantAmount} shares`
        }]
      };

      return equityGrant;
    } catch (error) {
      throw new Error(`Equity grant management failed: ${error.message}`);
    }
  }

  // Process commission calculations
  async processCommissions(params) {
    try {
      const {
        employeeId,
        commissionPeriod,
        salesData,
        commissionPlan,
        overrides = [],
        approvedBy
      } = params;

      let totalCommission = 0;
      const commissionBreakdown = [];

      // Process each commission tier/rule
      for (let tier of commissionPlan.tiers) {
        const applicableSales = this.getApplicableSales(salesData, tier.criteria);
        const tierCommission = this.calculateTierCommission(applicableSales, tier);
        
        if (tierCommission > 0) {
          commissionBreakdown.push({
            tier: tier.name,
            salesAmount: applicableSales.total,
            rate: tier.rate,
            commission: tierCommission
          });
          totalCommission += tierCommission;
        }
      }

      // Apply overrides
      overrides.forEach(override => {
        commissionBreakdown.push({
          tier: 'Override',
          description: override.description,
          commission: override.amount
        });
        totalCommission += override.amount;
      });

      // Apply caps and floors
      if (commissionPlan.cap && totalCommission > commissionPlan.cap) {
        totalCommission = commissionPlan.cap;
      }
      if (commissionPlan.floor && totalCommission < commissionPlan.floor) {
        totalCommission = commissionPlan.floor;
      }

      const commissionPayment = {
        id: `comm_${Date.now()}`,
        employeeId,
        commissionPeriod,
        
        calculation: {
          totalSales: salesData.reduce((sum, sale) => sum + sale.amount, 0),
          qualifyingSales: commissionBreakdown.reduce((sum, tier) => sum + (tier.salesAmount || 0), 0),
          totalCommission,
          breakdown: commissionBreakdown
        },
        
        commissionPlan: commissionPlan.name,
        overrides,
        
        status: 'calculated',
        calculatedDate: new Date(),
        approvedBy,
        
        auditTrail: [{
          action: 'calculated',
          userId: approvedBy,
          timestamp: new Date(),
          details: `Commission calculated for period ${commissionPeriod.start} - ${commissionPeriod.end}`
        }]
      };

      return commissionPayment;
    } catch (error) {
      throw new Error(`Commission processing failed: ${error.message}`);
    }
  }

  // Conduct compensation analysis
  async conductCompensationAnalysis(params) {
    try {
      const {
        employeeId,
        analysisType = 'individual', // individual, department, company, market
        includeMarketData = true,
        includePeerComparison = true,
        includeProjections = true
      } = params;

      const employee = await this.getEmployeeCompensationData(employeeId);
      const analysis = {
        employeeId,
        analysisDate: new Date(),
        analysisType,
        
        currentCompensation: {
          baseSalary: employee.baseSalary,
          targetBonus: employee.targetBonus,
          totalCash: employee.baseSalary + employee.targetBonus,
          equityValue: employee.equityValue,
          totalCompensation: employee.totalCompensation
        }
      };

      // Market data comparison
      if (includeMarketData) {
        const marketData = await this.getMarketCompensationData({
          jobTitle: employee.jobTitle,
          level: employee.level,
          location: employee.location,
          industry: employee.industry
        });

        analysis.marketComparison = {
          baseSalaryPercentile: this.calculatePercentile(employee.baseSalary, marketData.baseSalary),
          totalCashPercentile: this.calculatePercentile(employee.baseSalary + employee.targetBonus, marketData.totalCash),
          totalCompPercentile: this.calculatePercentile(employee.totalCompensation, marketData.totalComp),
          marketGap: {
            baseSalary: marketData.baseSalary.p50 - employee.baseSalary,
            totalCash: marketData.totalCash.p50 - (employee.baseSalary + employee.targetBonus),
            totalComp: marketData.totalComp.p50 - employee.totalCompensation
          }
        };
      }

      // Peer comparison
      if (includePeerComparison) {
        const peers = await this.getPeerCompensationData({
          department: employee.department,
          level: employee.level,
          excludeEmployeeId: employeeId
        });

        analysis.peerComparison = {
          baseSalaryRank: this.calculateRank(employee.baseSalary, peers.map(p => p.baseSalary)),
          totalCompRank: this.calculateRank(employee.totalCompensation, peers.map(p => p.totalCompensation)),
          departmentAverage: {
            baseSalary: peers.reduce((sum, p) => sum + p.baseSalary, 0) / peers.length,
            totalComp: peers.reduce((sum, p) => sum + p.totalCompensation, 0) / peers.length
          }
        };
      }

      // Compensation projections
      if (includeProjections) {
        analysis.projections = await this.generateCompensationProjections(employee);
      }

      // Risk assessment
      analysis.riskAssessment = {
        retentionRisk: this.assessRetentionRisk(analysis),
        competitivenessRisk: this.assessCompetitivenessRisk(analysis),
        recommendations: this.generateCompensationRecommendations(analysis)
      };

      return analysis;
    } catch (error) {
      throw new Error(`Compensation analysis failed: ${error.message}`);
    }
  }

  // Generate compensation statements
  async generateCompensationStatement(params) {
    try {
      const {
        employeeId,
        statementYear = new Date().getFullYear(),
        includeProjections = true,
        includeEquityDetails = true
      } = params;

      const employee = await this.getEmployeeCompensationData(employeeId);
      const payrollHistory = await this.getPayrollHistory(employeeId, statementYear);
      
      const statement = {
        employeeInfo: {
          employeeId,
          name: employee.name,
          jobTitle: employee.jobTitle,
          department: employee.department,
          hireDate: employee.hireDate
        },
        
        statementPeriod: {
          year: statementYear,
          generatedDate: new Date()
        },
        
        compensation: {
          baseSalary: {
            annual: employee.baseSalary,
            actualEarned: payrollHistory.totalBaseSalary
          },
          
          variableCompensation: {
            targetBonus: employee.targetBonus,
            actualBonus: payrollHistory.totalBonus,
            commission: payrollHistory.totalCommission,
            otherIncentives: payrollHistory.totalOtherIncentives
          },
          
          totalCash: {
            target: employee.baseSalary + employee.targetBonus,
            actual: payrollHistory.totalBaseSalary + payrollHistory.totalBonus + payrollHistory.totalCommission
          }
        },
        
        benefits: {
          healthBenefits: payrollHistory.healthBenefitsValue,
          retirementBenefits: payrollHistory.retirement401kMatch,
          paidTimeOff: payrollHistory.ptoValue,
          otherBenefits: payrollHistory.otherBenefitsValue,
          totalBenefitsValue: payrollHistory.totalBenefitsValue
        },
        
        totalCompensation: {
          cashCompensation: payrollHistory.totalCash,
          benefitsValue: payrollHistory.totalBenefitsValue,
          equityValue: includeEquityDetails ? employee.equityValue : 0,
          totalValue: payrollHistory.totalCash + payrollHistory.totalBenefitsValue + (includeEquityDetails ? employee.equityValue : 0)
        }
      };

      // Add equity details if requested
      if (includeEquityDetails) {
        statement.equity = await this.getEmployeeEquityDetails(employeeId);
      }

      // Add projections if requested
      if (includeProjections) {
        statement.projections = await this.generateCompensationProjections(employee);
      }

      return statement;
    } catch (error) {
      throw new Error(`Compensation statement generation failed: ${error.message}`);
    }
  }

  // Approve compensation changes
  async approveCompensationChange(params) {
    try {
      const {
        requestId,
        approverUserId,
        approvalLevel, // manager, hr, finance, executive
        approved,
        comments,
        conditions = []
      } = params;

      const request = await this.getCompensationRequest(requestId);
      
      // Update approval status
      request.approvals[approvalLevel] = {
        required: true,
        status: approved ? 'approved' : 'rejected',
        approvedBy: approverUserId,
        approvedDate: new Date(),
        comments,
        conditions
      };

      // Add to audit trail
      request.auditTrail.push({
        action: approved ? 'approved' : 'rejected',
        level: approvalLevel,
        userId: approverUserId,
        timestamp: new Date(),
        details: comments
      });

      // Check if all required approvals are complete
      const allApproved = this.checkAllApprovalsComplete(request);
      if (allApproved) {
        request.status = this.approvalStatuses.APPROVED;
        
        // Implement the compensation change
        await this.implementCompensationChange(request);
        request.status = this.approvalStatuses.IMPLEMENTED;
      } else if (!approved) {
        request.status = this.approvalStatuses.REJECTED;
      }

      return request;
    } catch (error) {
      throw new Error(`Compensation approval failed: ${error.message}`);
    }
  }

  // Helper methods
  determineApprovalWorkflow(params) {
    const { adjustmentType, adjustmentAmount, adjustmentPercentage, employeeLevel } = params;
    
    // Define approval thresholds
    const workflow = {
      managerRequired: true,
      hrRequired: adjustmentPercentage > 5 || adjustmentAmount > 5000,
      financeRequired: adjustmentPercentage > 10 || adjustmentAmount > 10000,
      executiveRequired: adjustmentPercentage > 20 || adjustmentAmount > 25000
    };

    // Executive level employees require higher approval
    if (employeeLevel === 'executive') {
      workflow.executiveRequired = true;
    }

    return workflow;
  }

  async getEmployeeLevel(employeeId) {
    // Mock implementation
    return 'manager'; // junior, senior, manager, director, executive
  }

  async getEmployeeBaseSalary(employeeId) {
    // Mock implementation
    return 120000;
  }

  async calculateBonusTaxes(params) {
    const { bonusAmount, employeeId, taxTreatment } = params;
    
    // Supplemental tax rate (federal)
    const supplementalRate = 0.22;
    
    let federalTax;
    if (taxTreatment === 'supplemental') {
      federalTax = bonusAmount * supplementalRate;
    } else {
      // Aggregate method - would need to calculate with regular wages
      federalTax = bonusAmount * 0.20; // Simplified
    }

    const stateTax = bonusAmount * 0.05; // Simplified state calculation
    const socialSecurityTax = bonusAmount * 0.062;
    const medicareTax = bonusAmount * 0.0145;

    const totalTaxes = federalTax + stateTax + socialSecurityTax + medicareTax;

    return {
      totalTaxes,
      breakdown: {
        federal: federalTax,
        state: stateTax,
        socialSecurity: socialSecurityTax,
        medicare: medicareTax
      }
    };
  }

  calculateVestingSchedule(params) {
    const { grantDate, grantAmount, vestingSchedule, expirationDate } = params;
    
    // Parse vesting schedule (e.g., "4-year-25-percent-cliff")
    const scheduleDetails = {
      cliffPeriod: 12, // months
      vestingPeriod: 48, // months
      vestingFrequency: 'monthly',
      cliffPercentage: 0.25
    };

    const vestingEvents = [];
    const cliffDate = new Date(grantDate.getTime() + (scheduleDetails.cliffPeriod * 30 * 24 * 60 * 60 * 1000));
    
    // Cliff vesting
    vestingEvents.push({
      date: cliffDate,
      percentage: scheduleDetails.cliffPercentage,
      shares: grantAmount * scheduleDetails.cliffPercentage,
      cumulativeShares: grantAmount * scheduleDetails.cliffPercentage
    });

    // Monthly vesting after cliff
    const remainingMonths = scheduleDetails.vestingPeriod - scheduleDetails.cliffPeriod;
    const monthlyVesting = (grantAmount * (1 - scheduleDetails.cliffPercentage)) / remainingMonths;
    
    for (let i = 1; i <= remainingMonths; i++) {
      const vestingDate = new Date(cliffDate.getTime() + (i * 30 * 24 * 60 * 60 * 1000));
      const cumulativeShares = (grantAmount * scheduleDetails.cliffPercentage) + (monthlyVesting * i);
      
      vestingEvents.push({
        date: vestingDate,
        shares: monthlyVesting,
        cumulativeShares,
        percentage: cumulativeShares / grantAmount
      });
    }

    return {
      schedule: scheduleDetails,
      events: vestingEvents,
      fullyVestedDate: vestingEvents[vestingEvents.length - 1].date
    };
  }

  async getCurrentEquityValuation() {
    // Mock current company valuation
    return 45.00; // per share
  }

  calculateEquityValue(params) {
    const { equityType, grantAmount, strikePrice, currentValuation } = params;
    
    let currentValue = 0;
    let potentialValue = 0;

    switch (equityType) {
      case this.equityTypes.STOCK_OPTIONS:
        currentValue = Math.max(0, (currentValuation - strikePrice) * grantAmount);
        potentialValue = currentValue; // Conservative estimate
        break;
      
      case this.equityTypes.RESTRICTED_STOCK:
      case this.equityTypes.RSU:
        currentValue = currentValuation * grantAmount;
        potentialValue = currentValue;
        break;
    }

    return { currentValue, potentialValue };
  }

  getApplicableSales(salesData, criteria) {
    // Filter sales based on commission criteria
    const applicable = salesData.filter(sale => {
      return (!criteria.productType || sale.productType === criteria.productType) &&
             (!criteria.territory || sale.territory === criteria.territory) &&
             (!criteria.customerType || sale.customerType === criteria.customerType);
    });

    return {
      sales: applicable,
      total: applicable.reduce((sum, sale) => sum + sale.amount, 0)
    };
  }

  calculateTierCommission(applicableSales, tier) {
    if (tier.type === 'percentage') {
      return applicableSales.total * tier.rate;
    } else if (tier.type === 'tiered') {
      // Tiered commission calculation
      let commission = 0;
      let remaining = applicableSales.total;
      
      for (let threshold of tier.thresholds) {
        if (remaining <= 0) break;
        
        const tierAmount = Math.min(remaining, threshold.max - threshold.min);
        commission += tierAmount * threshold.rate;
        remaining -= tierAmount;
      }
      
      return commission;
    }
    
    return 0;
  }

  async getEmployeeCompensationData(employeeId) {
    // Mock employee compensation data
    return {
      employeeId,
      name: 'John Doe',
      jobTitle: 'Senior Software Engineer',
      level: 'senior',
      department: 'Engineering',
      location: 'San Francisco, CA',
      industry: 'Technology',
      hireDate: '2023-06-01',
      baseSalary: 145000,
      targetBonus: 25000,
      equityValue: 75000,
      totalCompensation: 245000
    };
  }

  async getMarketCompensationData(params) {
    // Mock market data
    return {
      baseSalary: { p25: 125000, p50: 145000, p75: 165000, p90: 185000 },
      totalCash: { p25: 150000, p50: 175000, p75: 200000, p90: 225000 },
      totalComp: { p25: 200000, p50: 250000, p75: 300000, p90: 350000 }
    };
  }

  async getPeerCompensationData(params) {
    // Mock peer data
    return [
      { baseSalary: 140000, totalCompensation: 240000 },
      { baseSalary: 150000, totalCompensation: 260000 },
      { baseSalary: 135000, totalCompensation: 230000 }
    ];
  }

  calculatePercentile(value, distribution) {
    // Calculate percentile rank
    const values = Object.values(distribution);
    const rank = values.filter(v => v <= value).length / values.length;
    return Math.round(rank * 100);
  }

  calculateRank(value, array) {
    const sorted = array.sort((a, b) => b - a);
    return sorted.indexOf(value) + 1;
  }

  async generateCompensationProjections(employee) {
    return {
      nextYear: {
        baseSalary: employee.baseSalary * 1.05,
        totalCompensation: employee.totalCompensation * 1.08
      },
      threeYear: {
        baseSalary: employee.baseSalary * 1.15,
        totalCompensation: employee.totalCompensation * 1.25
      },
      fiveYear: {
        baseSalary: employee.baseSalary * 1.28,
        totalCompensation: employee.totalCompensation * 1.45
      }
    };
  }

  assessRetentionRisk(analysis) {
    // Risk scoring based on market position
    let risk = 'low';
    
    if (analysis.marketComparison?.totalCompPercentile < 25) {
      risk = 'high';
    } else if (analysis.marketComparison?.totalCompPercentile < 50) {
      risk = 'medium';
    }
    
    return risk;
  }

  assessCompetitivenessRisk(analysis) {
    // Competitive positioning assessment
    return analysis.marketComparison?.totalCompPercentile < 50 ? 'below_market' : 'competitive';
  }

  generateCompensationRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.marketComparison?.baseSalaryPercentile < 40) {
      recommendations.push({
        type: 'base_salary_adjustment',
        priority: 'high',
        description: 'Consider base salary increase to improve market competitiveness'
      });
    }
    
    if (analysis.riskAssessment?.retentionRisk === 'high') {
      recommendations.push({
        type: 'retention_bonus',
        priority: 'high',
        description: 'Consider retention bonus to mitigate turnover risk'
      });
    }
    
    return recommendations;
  }

  async getPayrollHistory(employeeId, year) {
    // Mock payroll history
    return {
      totalBaseSalary: 145000,
      totalBonus: 25000,
      totalCommission: 0,
      totalOtherIncentives: 2500,
      totalCash: 172500,
      healthBenefitsValue: 18000,
      retirement401kMatch: 8700,
      ptoValue: 11200,
      otherBenefitsValue: 3500,
      totalBenefitsValue: 41400
    };
  }

  async getEmployeeEquityDetails(employeeId) {
    // Mock equity details
    return {
      grants: [
        {
          id: 'grant_001',
          type: 'stock_options',
          grantDate: '2023-06-01',
          totalShares: 2000,
          vestedShares: 500,
          unvestedShares: 1500,
          strikePrice: 25.00,
          currentValue: 45.00
        }
      ],
      totalEquityValue: 75000,
      vestedValue: 18750,
      unvestedValue: 56250
    };
  }

  async getCompensationRequest(requestId) {
    // Mock request retrieval
    return {
      id: requestId,
      status: this.approvalStatuses.PENDING,
      approvals: {},
      auditTrail: []
    };
  }

  checkAllApprovalsComplete(request) {
    const requiredApprovals = Object.entries(request.approvals).filter(([key, approval]) => approval.required);
    const completedApprovals = requiredApprovals.filter(([key, approval]) => approval.status === 'approved');
    
    return requiredApprovals.length === completedApprovals.length;
  }

  async implementCompensationChange(request) {
    // Implementation logic for approved changes
    return true;
  }
}

module.exports = new CompensationManagementService();
