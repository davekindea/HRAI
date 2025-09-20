const mongoose = require('mongoose');

// Benefits Management Service
// Handles benefits enrollment, administration, and management
class BenefitsManagementService {
  constructor() {
    this.benefitTypes = {
      HEALTH_INSURANCE: 'health_insurance',
      DENTAL_INSURANCE: 'dental_insurance',
      VISION_INSURANCE: 'vision_insurance',
      LIFE_INSURANCE: 'life_insurance',
      DISABILITY_INSURANCE: 'disability_insurance',
      RETIREMENT_401K: 'retirement_401k',
      FLEXIBLE_SPENDING: 'flexible_spending',
      HEALTH_SAVINGS: 'health_savings',
      PAID_TIME_OFF: 'paid_time_off',
      TRANSPORTATION: 'transportation',
      WELLNESS: 'wellness',
      EDUCATION: 'education',
      DEPENDENT_CARE: 'dependent_care'
    };

    this.enrollmentPeriods = {
      OPEN_ENROLLMENT: 'open_enrollment',
      NEW_HIRE: 'new_hire',
      QUALIFYING_EVENT: 'qualifying_event',
      ANNUAL_RENEWAL: 'annual_renewal'
    };

    this.planTiers = {
      EMPLOYEE_ONLY: 'employee_only',
      EMPLOYEE_SPOUSE: 'employee_spouse',
      EMPLOYEE_CHILDREN: 'employee_children',
      FAMILY: 'family'
    };
  }

  // Get available benefits for employee
  async getAvailableBenefits(params) {
    try {
      const {
        employeeId,
        department,
        level,
        location,
        enrollmentPeriod = this.enrollmentPeriods.NEW_HIRE,
        effectiveDate = new Date()
      } = params;

      // Mock benefits catalog (in real implementation, would be from database)
      const benefitsCatalog = [
        // Health Insurance Plans
        {
          id: 'health_ppo_premium',
          type: this.benefitTypes.HEALTH_INSURANCE,
          name: 'Premium PPO Health Plan',
          description: 'Comprehensive health coverage with nationwide provider network',
          category: 'Medical',
          provider: 'Blue Cross Blue Shield',
          tiers: {
            [this.planTiers.EMPLOYEE_ONLY]: { premium: 450, deductible: 500, outOfPocketMax: 2000 },
            [this.planTiers.EMPLOYEE_SPOUSE]: { premium: 900, deductible: 1000, outOfPocketMax: 4000 },
            [this.planTiers.EMPLOYEE_CHILDREN]: { premium: 750, deductible: 750, outOfPocketMax: 3000 },
            [this.planTiers.FAMILY]: { premium: 1200, deductible: 1000, outOfPocketMax: 4000 }
          },
          features: ['$20 copay for primary care', 'No referrals needed for specialists', 'Preventive care covered 100%'],
          eligibility: { all_employees: true },
          enrollmentRequired: true
        },
        {
          id: 'health_hmo_standard',
          type: this.benefitTypes.HEALTH_INSURANCE,
          name: 'Standard HMO Health Plan',
          description: 'Cost-effective health coverage with coordinated care',
          category: 'Medical',
          provider: 'Kaiser Permanente',
          tiers: {
            [this.planTiers.EMPLOYEE_ONLY]: { premium: 350, deductible: 1000, outOfPocketMax: 3000 },
            [this.planTiers.EMPLOYEE_SPOUSE]: { premium: 700, deductible: 2000, outOfPocketMax: 6000 },
            [this.planTiers.EMPLOYEE_CHILDREN]: { premium: 580, deductible: 1500, outOfPocketMax: 4500 },
            [this.planTiers.FAMILY]: { premium: 950, deductible: 2000, outOfPocketMax: 6000 }
          },
          features: ['Integrated care model', '$15 copay for primary care', 'Prescription drug coverage'],
          eligibility: { all_employees: true },
          enrollmentRequired: true
        },

        // Dental Insurance
        {
          id: 'dental_comprehensive',
          type: this.benefitTypes.DENTAL_INSURANCE,
          name: 'Comprehensive Dental Plan',
          description: 'Full dental coverage including orthodontics',
          category: 'Dental',
          provider: 'Delta Dental',
          tiers: {
            [this.planTiers.EMPLOYEE_ONLY]: { premium: 25, annualMax: 2000 },
            [this.planTiers.EMPLOYEE_SPOUSE]: { premium: 50, annualMax: 4000 },
            [this.planTiers.EMPLOYEE_CHILDREN]: { premium: 45, annualMax: 3000 },
            [this.planTiers.FAMILY]: { premium: 75, annualMax: 4000 }
          },
          features: ['100% preventive care', '80% basic procedures', '50% major procedures', 'Orthodontic coverage'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Vision Insurance
        {
          id: 'vision_standard',
          type: this.benefitTypes.VISION_INSURANCE,
          name: 'Vision Care Plan',
          description: 'Eye care and eyewear coverage',
          category: 'Vision',
          provider: 'VSP',
          tiers: {
            [this.planTiers.EMPLOYEE_ONLY]: { premium: 15, examCopay: 10, frameAllowance: 150 },
            [this.planTiers.FAMILY]: { premium: 35, examCopay: 10, frameAllowance: 150 }
          },
          features: ['Annual eye exam', 'Lens and frame coverage', 'Contact lens allowance'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Life Insurance
        {
          id: 'life_basic',
          type: this.benefitTypes.LIFE_INSURANCE,
          name: 'Basic Life Insurance',
          description: 'Company-paid basic life insurance',
          category: 'Life & Disability',
          provider: 'MetLife',
          coverage: '1x annual salary',
          premium: 0, // Company paid
          features: ['Automatic coverage', 'No medical exam required', 'Portable coverage'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },
        {
          id: 'life_supplemental',
          type: this.benefitTypes.LIFE_INSURANCE,
          name: 'Supplemental Life Insurance',
          description: 'Additional voluntary life insurance',
          category: 'Life & Disability',
          provider: 'MetLife',
          coverage: 'Up to 5x annual salary',
          premium: 0.5, // Per $1000 of coverage
          features: ['Additional protection', 'Portable coverage', 'Spouse and child coverage available'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Disability Insurance
        {
          id: 'disability_short_term',
          type: this.benefitTypes.DISABILITY_INSURANCE,
          name: 'Short-Term Disability',
          description: 'Income protection for short-term disabilities',
          category: 'Life & Disability',
          provider: 'Unum',
          coverage: '66.67% of salary',
          premium: 25,
          features: ['0-day waiting period for accidents', '7-day waiting period for illness', 'Up to 26 weeks of benefits'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },
        {
          id: 'disability_long_term',
          type: this.benefitTypes.DISABILITY_INSURANCE,
          name: 'Long-Term Disability',
          description: 'Income protection for long-term disabilities',
          category: 'Life & Disability',
          provider: 'Unum',
          coverage: '60% of salary',
          premium: 35,
          features: ['90-day waiting period', 'Benefits to age 65', 'Own occupation coverage'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Retirement
        {
          id: 'retirement_401k',
          type: this.benefitTypes.RETIREMENT_401K,
          name: '401(k) Retirement Plan',
          description: 'Tax-advantaged retirement savings with company match',
          category: 'Retirement',
          provider: 'Fidelity',
          employerMatch: '100% of first 6%',
          vestingSchedule: 'Immediate',
          features: ['Pre-tax and Roth options', 'Loan provisions', 'Investment education'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Flexible Spending Accounts
        {
          id: 'fsa_healthcare',
          type: this.benefitTypes.FLEXIBLE_SPENDING,
          name: 'Healthcare FSA',
          description: 'Pre-tax dollars for medical expenses',
          category: 'Tax-Advantaged Accounts',
          provider: 'WageWorks',
          annualLimit: 3050,
          carryover: 610,
          features: ['Pre-tax savings', 'Debit card access', 'Online claim submission'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },
        {
          id: 'fsa_dependent_care',
          type: this.benefitTypes.DEPENDENT_CARE,
          name: 'Dependent Care FSA',
          description: 'Pre-tax dollars for dependent care expenses',
          category: 'Tax-Advantaged Accounts',
          provider: 'WageWorks',
          annualLimit: 5000,
          features: ['Pre-tax savings', 'Childcare expenses', 'Elder care expenses'],
          eligibility: { employees_with_dependents: true },
          enrollmentRequired: false
        },

        // Wellness Programs
        {
          id: 'wellness_program',
          type: this.benefitTypes.WELLNESS,
          name: 'Employee Wellness Program',
          description: 'Comprehensive wellness and fitness benefits',
          category: 'Wellness',
          provider: 'Virgin Pulse',
          premium: 0,
          features: ['Gym membership reimbursement', 'Wellness challenges', 'Health screenings', 'Mental health resources'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        },

        // Education Benefits
        {
          id: 'education_tuition',
          type: this.benefitTypes.EDUCATION,
          name: 'Tuition Reimbursement',
          description: 'Financial assistance for continuing education',
          category: 'Education',
          annualLimit: 5250,
          reimbursementRate: 0.8,
          features: ['Undergraduate and graduate courses', 'Job-related training', 'Professional certifications'],
          eligibility: { tenure_6_months: true },
          enrollmentRequired: false
        },

        // Transportation
        {
          id: 'transportation_transit',
          type: this.benefitTypes.TRANSPORTATION,
          name: 'Transit Benefit',
          description: 'Pre-tax dollars for public transportation',
          category: 'Transportation',
          provider: 'Commuter Benefits',
          monthlyLimit: 280,
          features: ['Pre-tax savings', 'Bus and rail passes', 'Parking benefits'],
          eligibility: { all_employees: true },
          enrollmentRequired: false
        }
      ];

      // Filter benefits based on eligibility
      const availableBenefits = benefitsCatalog.filter(benefit => {
        return this.checkEligibility(benefit.eligibility, { department, level, location });
      });

      return {
        enrollmentPeriod,
        effectiveDate,
        availableBenefits,
        enrollmentDeadline: this.calculateEnrollmentDeadline(enrollmentPeriod, effectiveDate),
        requiredActions: this.getRequiredActions(availableBenefits)
      };
    } catch (error) {
      throw new Error(`Failed to get available benefits: ${error.message}`);
    }
  }

  // Enroll employee in benefits
  async enrollInBenefits(params) {
    try {
      const {
        employeeId,
        enrollmentPeriod,
        effectiveDate,
        benefitSelections,
        dependents = [],
        beneficiaries = []
      } = params;

      const enrollmentResults = [];

      for (let selection of benefitSelections) {
        const {
          benefitId,
          planTier,
          contributionAmount,
          declination,
          beneficiaryInfo
        } = selection;

        // Validate selection
        const validation = await this.validateBenefitSelection({
          benefitId,
          planTier,
          contributionAmount,
          employeeId,
          dependents
        });

        if (!validation.isValid) {
          enrollmentResults.push({
            benefitId,
            status: 'failed',
            errors: validation.errors
          });
          continue;
        }

        // Process enrollment
        const enrollment = {
          id: `enrollment_${Date.now()}_${enrollmentResults.length}`,
          employeeId,
          benefitId,
          planTier,
          contributionAmount,
          effectiveDate,
          enrollmentDate: new Date(),
          enrollmentPeriod,
          status: 'active',
          dependents: this.processDependentCoverage(planTier, dependents),
          beneficiaries: beneficiaryInfo || [],
          declination: declination || false
        };

        enrollmentResults.push({
          benefitId,
          status: 'enrolled',
          enrollment
        });
      }

      return {
        employeeId,
        enrollmentPeriod,
        effectiveDate,
        totalEnrollments: enrollmentResults.filter(r => r.status === 'enrolled').length,
        failedEnrollments: enrollmentResults.filter(r => r.status === 'failed').length,
        enrollmentResults,
        confirmationNumber: `CONF_${Date.now()}`
      };
    } catch (error) {
      throw new Error(`Benefits enrollment failed: ${error.message}`);
    }
  }

  // Get employee's current benefits
  async getEmployeeBenefits(employeeId) {
    try {
      // Mock current enrollments (in real implementation, would query database)
      const currentEnrollments = [
        {
          id: 'enrollment_001',
          benefitId: 'health_ppo_premium',
          benefitName: 'Premium PPO Health Plan',
          planTier: this.planTiers.FAMILY,
          monthlyPremium: 1200,
          employeeContribution: 300,
          employerContribution: 900,
          effectiveDate: '2025-01-01',
          status: 'active',
          dependents: [
            { name: 'Jane Doe', relationship: 'spouse', ssn: '***-**-5678' },
            { name: 'John Doe Jr.', relationship: 'child', ssn: '***-**-9012' }
          ]
        },
        {
          id: 'enrollment_002',
          benefitId: 'dental_comprehensive',
          benefitName: 'Comprehensive Dental Plan',
          planTier: this.planTiers.FAMILY,
          monthlyPremium: 75,
          employeeContribution: 75,
          employerContribution: 0,
          effectiveDate: '2025-01-01',
          status: 'active'
        },
        {
          id: 'enrollment_003',
          benefitId: 'retirement_401k',
          benefitName: '401(k) Retirement Plan',
          contributionPercent: 8,
          employerMatch: 6,
          currentBalance: 125000,
          ytdContributions: 15000,
          effectiveDate: '2023-06-01',
          status: 'active'
        }
      ];

      const totalMonthlyPremiums = currentEnrollments.reduce((sum, enrollment) => {
        return sum + (enrollment.employeeContribution || 0);
      }, 0);

      const totalEmployerContributions = currentEnrollments.reduce((sum, enrollment) => {
        return sum + (enrollment.employerContribution || 0);
      }, 0);

      return {
        employeeId,
        currentEnrollments,
        summary: {
          totalMonthlyPremiums,
          totalEmployerContributions,
          totalAnnualBenefitValue: (totalMonthlyPremiums + totalEmployerContributions) * 12,
          activeEnrollments: currentEnrollments.filter(e => e.status === 'active').length
        },
        upcomingChanges: await this.getUpcomingBenefitChanges(employeeId),
        availableActions: await this.getAvailableActions(employeeId)
      };
    } catch (error) {
      throw new Error(`Failed to get employee benefits: ${error.message}`);
    }
  }

  // Process life events that may affect benefits
  async processLifeEvent(params) {
    try {
      const {
        employeeId,
        eventType, // marriage, divorce, birth, adoption, death, job_change, spouse_employment_change
        eventDate,
        eventDetails,
        requestedChanges = []
      } = params;

      const qualifyingEvents = [
        'marriage', 'divorce', 'birth', 'adoption', 'death', 
        'spouse_employment_change', 'loss_of_coverage', 'change_in_residence'
      ];

      if (!qualifyingEvents.includes(eventType)) {
        throw new Error('Event does not qualify for benefit changes');
      }

      // Calculate available change window
      const changeWindow = this.calculateChangeWindow(eventType, eventDate);
      
      // Validate requested changes
      const validationResults = [];
      for (let change of requestedChanges) {
        const validation = await this.validateLifeEventChange({
          employeeId,
          eventType,
          change
        });
        validationResults.push(validation);
      }

      const approvedChanges = validationResults.filter(v => v.isValid);

      return {
        employeeId,
        eventType,
        eventDate,
        changeWindow,
        requestedChanges: requestedChanges.length,
        approvedChanges: approvedChanges.length,
        rejectedChanges: validationResults.length - approvedChanges.length,
        changes: validationResults,
        confirmationNumber: `LIFE_${Date.now()}`
      };
    } catch (error) {
      throw new Error(`Life event processing failed: ${error.message}`);
    }
  }

  // Generate benefits statements
  async generateBenefitsStatement(params) {
    try {
      const {
        employeeId,
        statementYear = new Date().getFullYear(),
        includeProjections = true
      } = params;

      const employeeBenefits = await this.getEmployeeBenefits(employeeId);
      
      // Calculate annual costs and values
      const annualStatement = {
        year: statementYear,
        employeeInfo: {
          employeeId,
          name: 'John Doe', // Would be fetched from employee service
          department: 'Engineering',
          hireDate: '2023-06-01'
        },
        benefitsSummary: {
          totalEmployeeContributions: employeeBenefits.summary.totalMonthlyPremiums * 12,
          totalEmployerContributions: employeeBenefits.summary.totalEmployerContributions * 12,
          totalBenefitValue: employeeBenefits.summary.totalAnnualBenefitValue,
          benefitValueAsPercentOfSalary: 35.2 // Would calculate based on actual salary
        },
        benefitDetails: employeeBenefits.currentEnrollments.map(enrollment => ({
          benefit: enrollment.benefitName,
          coverage: enrollment.planTier,
          annualEmployeeCost: (enrollment.employeeContribution || 0) * 12,
          annualEmployerCost: (enrollment.employerContribution || 0) * 12,
          totalValue: ((enrollment.employeeContribution || 0) + (enrollment.employerContribution || 0)) * 12
        }))
      };

      if (includeProjections) {
        annualStatement.projections = await this.generateBenefitProjections(employeeId);
      }

      return annualStatement;
    } catch (error) {
      throw new Error(`Benefits statement generation failed: ${error.message}`);
    }
  }

  // COBRA administration
  async processCOBRAEvent(params) {
    try {
      const {
        employeeId,
        eventType, // termination, reduction_hours, death, divorce, medicare_entitlement
        eventDate,
        qualifiedBeneficiaries = [],
        electedBenefits = []
      } = params;

      const cobraEligibleBenefits = ['health_insurance', 'dental_insurance', 'vision_insurance'];
      
      // Calculate COBRA costs (typically 102% of full premium)
      const cobraCosts = electedBenefits.map(benefit => ({
        benefitId: benefit.benefitId,
        monthlyCost: benefit.fullPremium * 1.02,
        coveragePeriod: this.getCOBRACoveragePeriod(eventType),
        maxCoverageDuration: eventType === 'termination' ? 18 : 36 // months
      }));

      return {
        employeeId,
        eventType,
        eventDate,
        qualifiedBeneficiaries,
        electedBenefits: cobraCosts,
        notificationDeadline: new Date(eventDate.getTime() + (44 * 24 * 60 * 60 * 1000)), // 44 days
        electionDeadline: new Date(eventDate.getTime() + (60 * 24 * 60 * 60 * 1000)), // 60 days
        confirmationNumber: `COBRA_${Date.now()}`
      };
    } catch (error) {
      throw new Error(`COBRA processing failed: ${error.message}`);
    }
  }

  // Helper methods
  checkEligibility(eligibilityRules, employeeData) {
    // Simple eligibility check (would be more complex in real implementation)
    if (eligibilityRules.all_employees) return true;
    if (eligibilityRules.tenure_6_months && employeeData.tenureMonths >= 6) return true;
    if (eligibilityRules.employees_with_dependents && employeeData.hasDependents) return true;
    return false;
  }

  calculateEnrollmentDeadline(enrollmentPeriod, effectiveDate) {
    switch (enrollmentPeriod) {
      case this.enrollmentPeriods.NEW_HIRE:
        return new Date(effectiveDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      case this.enrollmentPeriods.OPEN_ENROLLMENT:
        return new Date('2025-12-15'); // Typical open enrollment deadline
      case this.enrollmentPeriods.QUALIFYING_EVENT:
        return new Date(effectiveDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      default:
        return new Date(effectiveDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    }
  }

  getRequiredActions(benefits) {
    const requiredBenefits = benefits.filter(b => b.enrollmentRequired);
    return requiredBenefits.map(b => ({
      action: 'enrollment_required',
      benefitId: b.id,
      benefitName: b.name,
      deadline: this.calculateEnrollmentDeadline()
    }));
  }

  async validateBenefitSelection(params) {
    const { benefitId, planTier, employeeId, dependents } = params;
    
    // Basic validation (would be more comprehensive in real implementation)
    const errors = [];
    
    if (!benefitId) errors.push('Benefit ID is required');
    if (planTier && planTier.includes('family') && dependents.length === 0) {
      errors.push('Family tier selected but no dependents provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  processDependentCoverage(planTier, dependents) {
    if (!planTier || planTier === this.planTiers.EMPLOYEE_ONLY) {
      return [];
    }
    
    return dependents.map(dep => ({
      name: dep.name,
      relationship: dep.relationship,
      ssn: dep.ssn,
      birthDate: dep.birthDate
    }));
  }

  calculateChangeWindow(eventType, eventDate) {
    const windowStart = eventDate;
    const windowEnd = new Date(eventDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    
    return {
      start: windowStart,
      end: windowEnd,
      daysRemaining: Math.max(0, Math.ceil((windowEnd - new Date()) / (24 * 60 * 60 * 1000)))
    };
  }

  async validateLifeEventChange(params) {
    // Mock validation
    return {
      isValid: true,
      change: params.change,
      approvedEffectiveDate: new Date()
    };
  }

  async getUpcomingBenefitChanges(employeeId) {
    // Mock upcoming changes
    return [
      {
        type: 'premium_increase',
        benefit: 'Premium PPO Health Plan',
        effectiveDate: '2025-01-01',
        description: 'Monthly premium will increase by $25'
      }
    ];
  }

  async getAvailableActions(employeeId) {
    return [
      { action: 'view_statement', description: 'View annual benefits statement' },
      { action: 'update_beneficiaries', description: 'Update life insurance beneficiaries' },
      { action: 'change_401k_contribution', description: 'Modify 401(k) contribution percentage' }
    ];
  }

  async generateBenefitProjections(employeeId) {
    return {
      retirement401k: {
        currentBalance: 125000,
        projectedBalanceAt65: 850000,
        monthlyContribution: 1250,
        employerMatch: 750
      },
      healthSavingsAccount: {
        currentBalance: 2500,
        annualContributionLimit: 4300,
        projectedTaxSavings: 1290
      }
    };
  }

  getCOBRACoveragePeriod(eventType) {
    const periods = {
      termination: 18,
      reduction_hours: 18,
      death: 36,
      divorce: 36,
      medicare_entitlement: 36
    };
    return periods[eventType] || 18;
  }
}

module.exports = new BenefitsManagementService();
