const moment = require('moment');
const winston = require('winston');

// Configure analytics logger
const analyticsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/analytics.log' }),
    new winston.transports.Console()
  ]
});

class AdvancedAnalyticsService {
  constructor() {
    this.candidateSources = {
      job_boards: ['Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'Monster'],
      social_media: ['LinkedIn Social', 'Facebook', 'Twitter', 'Instagram'],
      referrals: ['Employee Referral', 'Partner Referral', 'Customer Referral'],
      direct: ['Company Website', 'Career Page', 'Direct Application'],
      agencies: ['Recruitment Agency', 'Headhunter', 'Staffing Firm'],
      events: ['Job Fair', 'Campus Recruitment', 'Conference', 'Networking Event'],
      other: ['Other', 'Unknown']
    };

    this.applicationStages = [
      'applied',
      'screening',
      'assessment',
      'phone_interview',
      'video_interview',
      'onsite_interview',
      'final_interview',
      'reference_check',
      'offer_extended',
      'offer_accepted',
      'offer_declined',
      'rejected',
      'withdrawn'
    ];

    this.metrics = {
      timeToHire: 'time_to_hire',
      timeToScreen: 'time_to_screen',
      timeToInterview: 'time_to_interview',
      timeToOffer: 'time_to_offer',
      sourceEffectiveness: 'source_effectiveness',
      conversionRates: 'conversion_rates',
      dropOffAnalysis: 'drop_off_analysis',
      costPerHire: 'cost_per_hire',
      qualityOfHire: 'quality_of_hire'
    };
  }

  // Main analytics dashboard data
  async getDashboardAnalytics(timeframe = 'last_30_days', filters = {}) {
    try {
      analyticsLogger.info('Generating dashboard analytics', { timeframe, filters });

      const dateRange = this.getDateRange(timeframe);
      
      const analytics = {
        overview: await this.getOverviewMetrics(dateRange, filters),
        candidateSources: await this.getCandidateSourceAnalytics(dateRange, filters),
        conversionFunnel: await this.getConversionFunnelAnalytics(dateRange, filters),
        timeMetrics: await this.getTimeMetrics(dateRange, filters),
        jobPerformance: await this.getJobPerformanceAnalytics(dateRange, filters),
        recruiterPerformance: await this.getRecruiterPerformanceAnalytics(dateRange, filters),
        diversityMetrics: await this.getDiversityMetrics(dateRange, filters),
        costAnalysis: await this.getCostAnalysis(dateRange, filters),
        trendsAnalysis: await this.getTrendsAnalysis(dateRange, filters),
        predictiveInsights: await this.getPredictiveInsights(dateRange, filters)
      };

      analyticsLogger.info('Dashboard analytics generated successfully');
      return analytics;
    } catch (error) {
      analyticsLogger.error('Failed to generate dashboard analytics', { error: error.message });
      throw error;
    }
  }

  // Overview metrics
  async getOverviewMetrics(dateRange, filters) {
    const previousPeriod = this.getPreviousPeriod(dateRange);
    
    const current = await this.getMetricsForPeriod(dateRange, filters);
    const previous = await this.getMetricsForPeriod(previousPeriod, filters);

    return {
      totalApplications: {
        current: current.totalApplications,
        previous: previous.totalApplications,
        change: this.calculatePercentageChange(current.totalApplications, previous.totalApplications)
      },
      totalHires: {
        current: current.totalHires,
        previous: previous.totalHires,
        change: this.calculatePercentageChange(current.totalHires, previous.totalHires)
      },
      averageTimeToHire: {
        current: current.averageTimeToHire,
        previous: previous.averageTimeToHire,
        change: this.calculatePercentageChange(current.averageTimeToHire, previous.averageTimeToHire, true)
      },
      conversionRate: {
        current: current.conversionRate,
        previous: previous.conversionRate,
        change: this.calculatePercentageChange(current.conversionRate, previous.conversionRate)
      },
      activeJobs: current.activeJobs,
      pendingApplications: current.pendingApplications,
      scheduledInterviews: current.scheduledInterviews,
      offersExtended: current.offersExtended
    };
  }

  // Candidate source analytics
  async getCandidateSourceAnalytics(dateRange, filters) {
    const sourceData = await this.getCandidatesBySource(dateRange, filters);
    
    const analytics = {
      distribution: sourceData.map(source => ({
        source: source.name,
        category: source.category,
        candidates: source.candidates,
        percentage: source.percentage,
        hires: source.hires,
        conversionRate: source.candidates > 0 ? (source.hires / source.candidates * 100).toFixed(2) : 0,
        averageTimeToHire: source.averageTimeToHire,
        costPerCandidate: source.costPerCandidate,
        qualityScore: source.qualityScore
      })),
      topPerformingSources: sourceData
        .sort((a, b) => (b.hires / b.candidates) - (a.hires / a.candidates))
        .slice(0, 5),
      sourceEffectiveness: this.calculateSourceEffectiveness(sourceData),
      recommendations: this.generateSourceRecommendations(sourceData)
    };

    return analytics;
  }

  // Conversion funnel analytics
  async getConversionFunnelAnalytics(dateRange, filters) {
    const funnelData = await this.getFunnelData(dateRange, filters);
    
    return {
      stages: this.applicationStages.map((stage, index) => {
        const stageData = funnelData.find(s => s.stage === stage);
        const previousStage = index > 0 ? funnelData.find(s => s.stage === this.applicationStages[index - 1]) : null;
        
        return {
          stage,
          candidates: stageData?.candidates || 0,
          percentage: stageData?.percentage || 0,
          conversionRate: previousStage && previousStage.candidates > 0 
            ? ((stageData?.candidates || 0) / previousStage.candidates * 100).toFixed(2)
            : 100,
          averageTimeInStage: stageData?.averageTimeInStage || 0,
          dropOffRate: previousStage 
            ? (((previousStage.candidates - (stageData?.candidates || 0)) / previousStage.candidates) * 100).toFixed(2)
            : 0
        };
      }),
      overallConversionRate: funnelData.length > 0 
        ? ((funnelData[funnelData.length - 1]?.candidates || 0) / (funnelData[0]?.candidates || 1) * 100).toFixed(2)
        : 0,
      bottlenecks: this.identifyBottlenecks(funnelData),
      recommendations: this.generateFunnelRecommendations(funnelData)
    };
  }

  // Time metrics analysis
  async getTimeMetrics(dateRange, filters) {
    const timeData = await this.getTimeToHireData(dateRange, filters);
    
    return {
      timeToHire: {
        average: timeData.averageTimeToHire,
        median: timeData.medianTimeToHire,
        percentile90: timeData.percentile90TimeToHire,
        byDepartment: timeData.timeToHireByDepartment,
        byPosition: timeData.timeToHireByPosition,
        trend: timeData.timeToHireTrend
      },
      stageMetrics: {
        timeToScreen: {
          average: timeData.averageTimeToScreen,
          median: timeData.medianTimeToScreen
        },
        timeToInterview: {
          average: timeData.averageTimeToInterview,
          median: timeData.medianTimeToInterview
        },
        timeToOffer: {
          average: timeData.averageTimeToOffer,
          median: timeData.medianTimeToOffer
        }
      },
      benchmarks: {
        industry: this.getIndustryBenchmarks(),
        internal: this.getInternalBenchmarks(timeData)
      }
    };
  }

  // Job performance analytics
  async getJobPerformanceAnalytics(dateRange, filters) {
    const jobData = await this.getJobAnalyticsData(dateRange, filters);
    
    return {
      topPerformingJobs: jobData
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)
        .map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          applications: job.applications,
          hires: job.hires,
          conversionRate: job.conversionRate,
          averageTimeToHire: job.averageTimeToHire,
          costPerHire: job.costPerHire,
          qualityScore: job.qualityScore
        })),
      departmentPerformance: this.aggregateByDepartment(jobData),
      jobTypeAnalysis: this.analyzeByJobType(jobData),
      seasonalTrends: await this.getSeasonalTrends(dateRange, filters),
      performanceFactors: this.identifyPerformanceFactors(jobData)
    };
  }

  // Recruiter performance analytics
  async getRecruiterPerformanceAnalytics(dateRange, filters) {
    const recruiterData = await this.getRecruiterData(dateRange, filters);
    
    return {
      individualPerformance: recruiterData.map(recruiter => ({
        id: recruiter.id,
        name: recruiter.name,
        applicationsManaged: recruiter.applicationsManaged,
        hiresCompleted: recruiter.hiresCompleted,
        conversionRate: recruiter.conversionRate,
        averageTimeToHire: recruiter.averageTimeToHire,
        candidateSatisfaction: recruiter.candidateSatisfaction,
        clientSatisfaction: recruiter.clientSatisfaction,
        productivityScore: this.calculateProductivityScore(recruiter)
      })),
      teamPerformance: this.aggregateRecruiterTeamData(recruiterData),
      performanceDistribution: this.getPerformanceDistribution(recruiterData),
      topPerformers: recruiterData
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5),
      improvementOpportunities: this.identifyImprovementOpportunities(recruiterData)
    };
  }

  // Diversity metrics
  async getDiversityMetrics(dateRange, filters) {
    const diversityData = await this.getDiversityData(dateRange, filters);
    
    return {
      genderDistribution: {
        applications: diversityData.genderApplications,
        hires: diversityData.genderHires,
        conversionRates: diversityData.genderConversionRates
      },
      ethnicityDistribution: {
        applications: diversityData.ethnicityApplications,
        hires: diversityData.ethnicityHires,
        conversionRates: diversityData.ethnicityConversionRates
      },
      ageDistribution: {
        applications: diversityData.ageApplications,
        hires: diversityData.ageHires,
        conversionRates: diversityData.ageConversionRates
      },
      educationDistribution: {
        applications: diversityData.educationApplications,
        hires: diversityData.educationHires
      },
      diversityIndex: this.calculateDiversityIndex(diversityData),
      goals: diversityData.diversityGoals,
      progress: this.calculateDiversityProgress(diversityData)
    };
  }

  // Cost analysis
  async getCostAnalysis(dateRange, filters) {
    const costData = await this.getCostData(dateRange, filters);
    
    return {
      totalRecruitmentCost: costData.totalCost,
      costPerHire: costData.costPerHire,
      costBreakdown: {
        jobBoardCosts: costData.jobBoardCosts,
        agencyCosts: costData.agencyCosts,
        assessmentCosts: costData.assessmentCosts,
        interviewCosts: costData.interviewCosts,
        onboardingCosts: costData.onboardingCosts,
        internalCosts: costData.internalCosts
      },
      costBySource: costData.costBySource,
      costByDepartment: costData.costByDepartment,
      roi: this.calculateRecruitmentROI(costData),
      costOptimization: this.generateCostOptimizationRecommendations(costData)
    };
  }

  // Trends analysis
  async getTrendsAnalysis(dateRange, filters) {
    const trendsData = await this.getTrendsData(dateRange, filters);
    
    return {
      applicationTrends: trendsData.applicationTrends,
      hireTrends: trendsData.hireTrends,
      timeToHireTrends: trendsData.timeToHireTrends,
      sourceTrends: trendsData.sourceTrends,
      seasonalPatterns: trendsData.seasonalPatterns,
      forecastedMetrics: this.generateForecast(trendsData),
      anomalies: this.detectAnomalies(trendsData)
    };
  }

  // Predictive insights
  async getPredictiveInsights(dateRange, filters) {
    const historicalData = await this.getHistoricalData(dateRange, filters);
    
    return {
      hiringForecast: this.predictHiringNeed(historicalData),
      candidateSupplyPrediction: this.predictCandidateSupply(historicalData),
      timeToHirePrediction: this.predictTimeToHire(historicalData),
      budgetForecast: this.predictRecruitmentBudget(historicalData),
      riskFactors: this.identifyRiskFactors(historicalData),
      recommendations: this.generatePredictiveRecommendations(historicalData)
    };
  }

  // Drop-off analysis
  async getDropOffAnalysis(dateRange, filters = {}) {
    const dropOffData = await this.getDropOffData(dateRange, filters);
    
    return {
      stageDropOffs: this.applicationStages.map((stage, index) => {
        const stageData = dropOffData.find(s => s.stage === stage);
        const nextStage = this.applicationStages[index + 1];
        const nextStageData = dropOffData.find(s => s.stage === nextStage);
        
        if (!nextStageData) return null;
        
        const dropOffCount = (stageData?.candidates || 0) - (nextStageData?.candidates || 0);
        const dropOffRate = stageData?.candidates > 0 
          ? (dropOffCount / stageData.candidates * 100).toFixed(2)
          : 0;
        
        return {
          fromStage: stage,
          toStage: nextStage,
          candidatesAtStart: stageData?.candidates || 0,
          candidatesProgressed: nextStageData?.candidates || 0,
          droppedOff: dropOffCount,
          dropOffRate: parseFloat(dropOffRate),
          reasons: stageData?.dropOffReasons || [],
          averageTimeInStage: stageData?.averageTimeInStage || 0
        };
      }).filter(Boolean),
      highestDropOffStages: this.identifyHighestDropOffStages(dropOffData),
      dropOffReasons: this.analyzeDropOffReasons(dropOffData),
      candidateFeedback: await this.getCandidateFeedback(dateRange, filters),
      improvementSuggestions: this.generateDropOffImprovements(dropOffData)
    };
  }

  // Utility methods for calculations
  getDateRange(timeframe) {
    const now = moment();
    let start, end = now.clone();
    
    switch (timeframe) {
      case 'last_7_days':
        start = now.clone().subtract(7, 'days');
        break;
      case 'last_30_days':
        start = now.clone().subtract(30, 'days');
        break;
      case 'last_90_days':
        start = now.clone().subtract(90, 'days');
        break;
      case 'last_6_months':
        start = now.clone().subtract(6, 'months');
        break;
      case 'last_year':
        start = now.clone().subtract(1, 'year');
        break;
      default:
        start = now.clone().subtract(30, 'days');
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  }

  getPreviousPeriod(dateRange) {
    const start = moment(dateRange.start);
    const end = moment(dateRange.end);
    const duration = end.diff(start);
    
    return {
      start: start.clone().subtract(duration).toISOString(),
      end: start.toISOString()
    };
  }

  calculatePercentageChange(current, previous, inverse = false) {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return inverse ? -change : change;
  }

  calculateSourceEffectiveness(sourceData) {
    return sourceData.map(source => ({
      source: source.name,
      effectivenessScore: this.calculateEffectivenessScore(source),
      qualityScore: source.qualityScore,
      costEfficiency: source.costPerCandidate > 0 ? source.hires / source.costPerCandidate : 0,
      speedScore: source.averageTimeToHire > 0 ? 100 / source.averageTimeToHire : 0
    }));
  }

  calculateEffectivenessScore(source) {
    const conversionWeight = 0.4;
    const qualityWeight = 0.3;
    const speedWeight = 0.2;
    const costWeight = 0.1;
    
    const conversionScore = (source.hires / source.candidates) * 100;
    const qualityScore = source.qualityScore || 50;
    const speedScore = source.averageTimeToHire > 0 ? Math.max(0, 100 - source.averageTimeToHire) : 50;
    const costScore = source.costPerCandidate > 0 ? Math.max(0, 100 - (source.costPerCandidate / 10)) : 50;
    
    return (
      conversionScore * conversionWeight +
      qualityScore * qualityWeight +
      speedScore * speedWeight +
      costScore * costWeight
    ).toFixed(2);
  }

  identifyBottlenecks(funnelData) {
    return funnelData
      .map((stage, index) => {
        if (index === 0) return null;
        const previousStage = funnelData[index - 1];
        const dropOffRate = previousStage.candidates > 0 
          ? ((previousStage.candidates - stage.candidates) / previousStage.candidates) * 100
          : 0;
        
        return {
          stage: stage.stage,
          dropOffRate,
          impact: dropOffRate * previousStage.candidates
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  }

  // Mock data methods (in production, these would query the database)
  async getMetricsForPeriod(dateRange, filters) {
    // Mock implementation - replace with actual database queries
    return {
      totalApplications: Math.floor(Math.random() * 1000) + 500,
      totalHires: Math.floor(Math.random() * 100) + 50,
      averageTimeToHire: Math.floor(Math.random() * 30) + 15,
      conversionRate: Math.floor(Math.random() * 20) + 5,
      activeJobs: Math.floor(Math.random() * 50) + 25,
      pendingApplications: Math.floor(Math.random() * 200) + 100,
      scheduledInterviews: Math.floor(Math.random() * 50) + 25,
      offersExtended: Math.floor(Math.random() * 20) + 10
    };
  }

  async getCandidatesBySource(dateRange, filters) {
    // Mock implementation
    return [
      { name: 'LinkedIn', category: 'job_boards', candidates: 150, hires: 12, percentage: 30, averageTimeToHire: 25, costPerCandidate: 50, qualityScore: 85 },
      { name: 'Indeed', category: 'job_boards', candidates: 200, hires: 8, percentage: 40, averageTimeToHire: 30, costPerCandidate: 30, qualityScore: 70 },
      { name: 'Company Website', category: 'direct', candidates: 100, hires: 15, percentage: 20, averageTimeToHire: 20, costPerCandidate: 10, qualityScore: 90 },
      { name: 'Employee Referral', category: 'referrals', candidates: 50, hires: 8, percentage: 10, averageTimeToHire: 18, costPerCandidate: 100, qualityScore: 95 }
    ];
  }

  async getFunnelData(dateRange, filters) {
    // Mock implementation
    return [
      { stage: 'applied', candidates: 500, percentage: 100, averageTimeInStage: 0 },
      { stage: 'screening', candidates: 300, percentage: 60, averageTimeInStage: 2 },
      { stage: 'assessment', candidates: 150, percentage: 30, averageTimeInStage: 3 },
      { stage: 'phone_interview', candidates: 100, percentage: 20, averageTimeInStage: 1 },
      { stage: 'video_interview', candidates: 60, percentage: 12, averageTimeInStage: 2 },
      { stage: 'final_interview', candidates: 30, percentage: 6, averageTimeInStage: 3 },
      { stage: 'offer_extended', candidates: 20, percentage: 4, averageTimeInStage: 1 },
      { stage: 'offer_accepted', candidates: 15, percentage: 3, averageTimeInStage: 2 }
    ];
  }

  async getTimeToHireData(dateRange, filters) {
    // Mock implementation
    return {
      averageTimeToHire: 25,
      medianTimeToHire: 22,
      percentile90TimeToHire: 45,
      timeToHireByDepartment: {
        'Engineering': 28,
        'Sales': 20,
        'Marketing': 25,
        'HR': 30
      },
      timeToHireByPosition: {
        'Senior Engineer': 35,
        'Sales Rep': 18,
        'Marketing Manager': 22
      },
      timeToHireTrend: [20, 22, 25, 24, 26, 25],
      averageTimeToScreen: 3,
      medianTimeToScreen: 2,
      averageTimeToInterview: 7,
      medianTimeToInterview: 6,
      averageTimeToOffer: 15,
      medianTimeToOffer: 14
    };
  }

  // Additional mock methods for completeness
  async getJobAnalyticsData(dateRange, filters) { return []; }
  async getRecruiterData(dateRange, filters) { return []; }
  async getDiversityData(dateRange, filters) { return {}; }
  async getCostData(dateRange, filters) { return {}; }
  async getTrendsData(dateRange, filters) { return {}; }
  async getHistoricalData(dateRange, filters) { return {}; }
  async getDropOffData(dateRange, filters) { return []; }
  async getCandidateFeedback(dateRange, filters) { return []; }

  // Placeholder methods for various calculations
  generateSourceRecommendations(sourceData) { return []; }
  generateFunnelRecommendations(funnelData) { return []; }
  getIndustryBenchmarks() { return {}; }
  getInternalBenchmarks(timeData) { return {}; }
  aggregateByDepartment(jobData) { return {}; }
  analyzeByJobType(jobData) { return {}; }
  getSeasonalTrends(dateRange, filters) { return {}; }
  identifyPerformanceFactors(jobData) { return []; }
  aggregateRecruiterTeamData(recruiterData) { return {}; }
  getPerformanceDistribution(recruiterData) { return {}; }
  identifyImprovementOpportunities(recruiterData) { return []; }
  calculateProductivityScore(recruiter) { return 0; }
  calculateDiversityIndex(diversityData) { return 0; }
  calculateDiversityProgress(diversityData) { return {}; }
  calculateRecruitmentROI(costData) { return 0; }
  generateCostOptimizationRecommendations(costData) { return []; }
  generateForecast(trendsData) { return {}; }
  detectAnomalies(trendsData) { return []; }
  predictHiringNeed(historicalData) { return {}; }
  predictCandidateSupply(historicalData) { return {}; }
  predictTimeToHire(historicalData) { return {}; }
  predictRecruitmentBudget(historicalData) { return {}; }
  identifyRiskFactors(historicalData) { return []; }
  generatePredictiveRecommendations(historicalData) { return []; }
  identifyHighestDropOffStages(dropOffData) { return []; }
  analyzeDropOffReasons(dropOffData) { return {}; }
  generateDropOffImprovements(dropOffData) { return []; }
}

module.exports = new AdvancedAnalyticsService();
