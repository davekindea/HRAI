const mongoose = require('mongoose');

// Compensation Calculator Service
// Handles salary calculations, benefit valuations, and total compensation packages
class CompensationCalculatorService {
  constructor() {
    this.taxRates = {
      federal: {
        brackets: [
          { min: 0, max: 11000, rate: 0.10 },
          { min: 11000, max: 44725, rate: 0.12 },
          { min: 44725, max: 95375, rate: 0.22 },
          { min: 95375, max: 182050, rate: 0.24 },
          { min: 182050, max: 231250, rate: 0.32 },
          { min: 231250, max: 578125, rate: 0.35 },
          { min: 578125, max: Infinity, rate: 0.37 }
        ]
      },
      state: {
        default: 0.05, // Default state tax rate
        rates: {
          'CA': 0.13,
          'NY': 0.085,
          'TX': 0.0,
          'FL': 0.0,
          'WA': 0.0
        }
      },
      social_security: 0.062,
      medicare: 0.0145,
      unemployment: 0.006
    };

    this.benefitsCosts = {
      health_insurance: {
        individual: 450,
        family: 1200
      },
      dental_insurance: {
        individual: 25,
        family: 75
      },
      vision_insurance: {
        individual: 15,
        family: 35
      },
      life_insurance: {
        base: 25,
        additional_per_1000: 0.5
      },
      retirement_401k: {
        employer_match: 0.06,
        max_match: 6000
      }
    };
  }

  // Calculate base salary components
  async calculateBaseSalary(params) {
    try {
      const {
        annualSalary,
        payFrequency = 'biweekly', // weekly, biweekly, semimonthly, monthly
        workingHours = 40,
        overtimeEligible = false
      } = params;

      const payPeriodsPerYear = this.getPayPeriodsPerYear(payFrequency);
      const grossPayPerPeriod = annualSalary / payPeriodsPerYear;
      const hourlyRate = annualSalary / (workingHours * 52);

      return {
        annualSalary,
        grossPayPerPeriod,
        hourlyRate,
        payFrequency,
        payPeriodsPerYear,
        workingHours,
        overtimeEligible,
        overtimeRate: overtimeEligible ? hourlyRate * 1.5 : null
      };
    } catch (error) {
      throw new Error(`Base salary calculation failed: ${error.message}`);
    }
  }

  // Calculate tax deductions
  async calculateTaxDeductions(params) {
    try {
      const {
        annualSalary,
        state = 'CA',
        filingStatus = 'single',
        dependents = 0,
        additionalWithholding = 0
      } = params;

      // Federal tax calculation
      const federalTax = this.calculateFederalTax(annualSalary, filingStatus, dependents);
      
      // State tax calculation
      const stateTax = this.calculateStateTax(annualSalary, state);
      
      // FICA taxes
      const socialSecurityTax = Math.min(annualSalary * this.taxRates.social_security, 147000 * this.taxRates.social_security);
      const medicareTax = annualSalary * this.taxRates.medicare;
      
      // Additional Medicare tax for high earners
      const additionalMedicareTax = annualSalary > 200000 ? (annualSalary - 200000) * 0.009 : 0;

      const totalTaxes = federalTax + stateTax + socialSecurityTax + medicareTax + additionalMedicareTax + additionalWithholding;
      const netSalary = annualSalary - totalTaxes;

      return {
        grossSalary: annualSalary,
        federalTax,
        stateTax,
        socialSecurityTax,
        medicareTax,
        additionalMedicareTax,
        additionalWithholding,
        totalTaxes,
        netSalary,
        effectiveTaxRate: totalTaxes / annualSalary,
        state,
        filingStatus,
        dependents
      };
    } catch (error) {
      throw new Error(`Tax calculation failed: ${error.message}`);
    }
  }

  // Calculate benefits package value
  async calculateBenefitsPackage(params) {
    try {
      const {
        healthInsurance = 'individual',
        dentalInsurance = false,
        visionInsurance = false,
        lifeInsurance = 50000,
        retirement401k = true,
        employerMatch401k = 0.06,
        paidTimeOff = 20,
        sickDays = 10,
        holidayDays = 10,
        annualSalary,
        customBenefits = []
      } = params;

      let benefitsValue = 0;
      const benefitsBreakdown = {};

      // Health insurance
      if (healthInsurance) {
        const healthCost = this.benefitsCosts.health_insurance[healthInsurance] || 0;
        benefitsValue += healthCost * 12;
        benefitsBreakdown.healthInsurance = healthCost * 12;
      }

      // Dental insurance
      if (dentalInsurance) {
        const dentalCost = this.benefitsCosts.dental_insurance[healthInsurance] || this.benefitsCosts.dental_insurance.individual;
        benefitsValue += dentalCost * 12;
        benefitsBreakdown.dentalInsurance = dentalCost * 12;
      }

      // Vision insurance
      if (visionInsurance) {
        const visionCost = this.benefitsCosts.vision_insurance[healthInsurance] || this.benefitsCosts.vision_insurance.individual;
        benefitsValue += visionCost * 12;
        benefitsBreakdown.visionInsurance = visionCost * 12;
      }

      // Life insurance
      if (lifeInsurance > 0) {
        const lifeCost = this.benefitsCosts.life_insurance.base + 
          (Math.max(0, lifeInsurance - 50000) / 1000) * this.benefitsCosts.life_insurance.additional_per_1000;
        benefitsValue += lifeCost * 12;
        benefitsBreakdown.lifeInsurance = lifeCost * 12;
      }

      // 401k employer match
      if (retirement401k && annualSalary) {
        const matchValue = Math.min(annualSalary * employerMatch401k, this.benefitsCosts.retirement_401k.max_match);
        benefitsValue += matchValue;
        benefitsBreakdown.retirement401k = matchValue;
      }

      // PTO value calculation
      if (annualSalary) {
        const dailyRate = annualSalary / 260; // 52 weeks * 5 days
        const ptoValue = (paidTimeOff + sickDays + holidayDays) * dailyRate;
        benefitsValue += ptoValue;
        benefitsBreakdown.paidTimeOff = ptoValue;
      }

      // Custom benefits
      customBenefits.forEach(benefit => {
        benefitsValue += benefit.value || 0;
        benefitsBreakdown[benefit.name] = benefit.value || 0;
      });

      return {
        totalBenefitsValue: benefitsValue,
        benefitsBreakdown,
        benefitsAsPercentOfSalary: annualSalary ? (benefitsValue / annualSalary) * 100 : 0
      };
    } catch (error) {
      throw new Error(`Benefits calculation failed: ${error.message}`);
    }
  }

  // Calculate total compensation package
  async calculateTotalCompensation(params) {
    try {
      const {
        baseSalary,
        bonusTarget = 0,
        equityValue = 0,
        commissionTarget = 0,
        benefits = {},
        perquisites = [],
        location = 'San Francisco, CA'
      } = params;

      // Calculate base components
      const baseSalaryCalc = await this.calculateBaseSalary({ annualSalary: baseSalary });
      const taxCalc = await this.calculateTaxDeductions({ annualSalary: baseSalary });
      const benefitsCalc = await this.calculateBenefitsPackage({ ...benefits, annualSalary: baseSalary });

      // Variable compensation
      const totalVariableComp = bonusTarget + equityValue + commissionTarget;

      // Perquisites value
      const perqsValue = perquisites.reduce((total, perq) => total + (perq.value || 0), 0);

      // Total compensation
      const totalCompensation = baseSalary + totalVariableComp + benefitsCalc.totalBenefitsValue + perqsValue;

      return {
        baseSalary,
        bonusTarget,
        equityValue,
        commissionTarget,
        totalVariableComp,
        benefitsValue: benefitsCalc.totalBenefitsValue,
        perquisitesValue: perqsValue,
        totalCompensation,
        netCompensation: totalCompensation - taxCalc.totalTaxes,
        location,
        breakdown: {
          baseSalary: baseSalaryCalc,
          taxes: taxCalc,
          benefits: benefitsCalc,
          perquisites: perquisites
        }
      };
    } catch (error) {
      throw new Error(`Total compensation calculation failed: ${error.message}`);
    }
  }

  // Compare compensation packages
  async compareOffers(offers) {
    try {
      const comparisons = [];

      for (let offer of offers) {
        const calculation = await this.calculateTotalCompensation(offer);
        comparisons.push({
          offerName: offer.offerName || `Offer ${comparisons.length + 1}`,
          ...calculation
        });
      }

      // Sort by total compensation
      comparisons.sort((a, b) => b.totalCompensation - a.totalCompensation);

      return {
        comparisons,
        bestOffer: comparisons[0],
        insights: this.generateComparisonInsights(comparisons)
      };
    } catch (error) {
      throw new Error(`Offer comparison failed: ${error.message}`);
    }
  }

  // Calculate cost of living adjustments
  async calculateCOLAdjustment(params) {
    try {
      const {
        baseSalary,
        fromLocation,
        toLocation,
        adjustmentType = 'automatic' // automatic, manual, hybrid
      } = params;

      // Mock COL index data (in real implementation, would use external APIs)
      const colIndex = {
        'San Francisco, CA': 180,
        'New York, NY': 150,
        'Los Angeles, CA': 140,
        'Seattle, WA': 130,
        'Austin, TX': 110,
        'Denver, CO': 105,
        'Atlanta, GA': 95,
        'Phoenix, AZ': 90,
        'Dallas, TX': 85,
        'Tampa, FL': 80
      };

      const fromIndex = colIndex[fromLocation] || 100;
      const toIndex = colIndex[toLocation] || 100;
      const adjustmentFactor = toIndex / fromIndex;
      const adjustedSalary = baseSalary * adjustmentFactor;
      const adjustmentAmount = adjustedSalary - baseSalary;

      return {
        originalSalary: baseSalary,
        adjustedSalary,
        adjustmentAmount,
        adjustmentPercent: ((adjustmentFactor - 1) * 100),
        fromLocation,
        toLocation,
        fromIndex,
        toIndex,
        adjustmentFactor
      };
    } catch (error) {
      throw new Error(`COL adjustment calculation failed: ${error.message}`);
    }
  }

  // Salary band analysis
  async analyzeSalaryBands(params) {
    try {
      const {
        jobTitle,
        level,
        department,
        location,
        experienceYears,
        marketData = []
      } = params;

      // Calculate percentiles from market data
      const sortedSalaries = marketData.sort((a, b) => a - b);
      const p25 = this.getPercentile(sortedSalaries, 25);
      const p50 = this.getPercentile(sortedSalaries, 50);
      const p75 = this.getPercentile(sortedSalaries, 75);
      const p90 = this.getPercentile(sortedSalaries, 90);

      return {
        jobTitle,
        level,
        department,
        location,
        experienceYears,
        salaryBands: {
          p25,
          p50,
          p75,
          p90
        },
        recommendedRange: {
          min: p25,
          target: p50,
          max: p75
        },
        marketData: {
          count: marketData.length,
          average: marketData.reduce((a, b) => a + b, 0) / marketData.length,
          min: Math.min(...marketData),
          max: Math.max(...marketData)
        }
      };
    } catch (error) {
      throw new Error(`Salary band analysis failed: ${error.message}`);
    }
  }

  // Helper methods
  getPayPeriodsPerYear(frequency) {
    const frequencies = {
      weekly: 52,
      biweekly: 26,
      semimonthly: 24,
      monthly: 12
    };
    return frequencies[frequency] || 26;
  }

  calculateFederalTax(income, filingStatus, dependents) {
    let tax = 0;
    let remaining = income;

    for (let bracket of this.taxRates.federal.brackets) {
      if (remaining <= 0) break;
      
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }

    // Standard deduction and dependent exemptions
    const standardDeduction = filingStatus === 'married' ? 27700 : 13850;
    const dependentExemption = dependents * 4000;
    
    return Math.max(0, tax - standardDeduction - dependentExemption);
  }

  calculateStateTax(income, state) {
    const rate = this.taxRates.state.rates[state] || this.taxRates.state.default;
    return income * rate;
  }

  getPercentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  generateComparisonInsights(comparisons) {
    const insights = [];

    if (comparisons.length >= 2) {
      const best = comparisons[0];
      const second = comparisons[1];
      const difference = best.totalCompensation - second.totalCompensation;
      
      insights.push({
        type: 'compensation_gap',
        message: `The top offer provides $${difference.toLocaleString()} more in total compensation`,
        impact: 'high'
      });

      // Benefits comparison
      const bestBenefits = best.benefitsValue;
      const avgBenefits = comparisons.reduce((sum, c) => sum + c.benefitsValue, 0) / comparisons.length;
      
      if (bestBenefits > avgBenefits * 1.2) {
        insights.push({
          type: 'benefits_advantage',
          message: `Best offer includes significantly better benefits package`,
          impact: 'medium'
        });
      }
    }

    return insights;
  }

  // Equity calculation methods
  async calculateEquityValue(params) {
    try {
      const {
        equityType, // stock_options, restricted_stock, rsu, phantom_stock
        grantAmount,
        strikePrice = 0,
        currentValuation,
        vestingSchedule = '4_year_cliff',
        exerciseWindow = 10
      } = params;

      let currentValue = 0;
      let potentialValue = 0;

      switch (equityType) {
        case 'stock_options':
          currentValue = Math.max(0, (currentValuation - strikePrice) * grantAmount);
          potentialValue = currentValue; // Conservative estimate
          break;
        
        case 'restricted_stock':
        case 'rsu':
          currentValue = currentValuation * grantAmount;
          potentialValue = currentValue;
          break;
        
        case 'phantom_stock':
          currentValue = currentValuation * grantAmount;
          potentialValue = currentValue;
          break;
      }

      return {
        equityType,
        grantAmount,
        strikePrice,
        currentValuation,
        currentValue,
        potentialValue,
        vestingSchedule,
        exerciseWindow
      };
    } catch (error) {
      throw new Error(`Equity calculation failed: ${error.message}`);
    }
  }
}

module.exports = new CompensationCalculatorService();
