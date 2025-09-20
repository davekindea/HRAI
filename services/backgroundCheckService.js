const crypto = require('crypto');
const moment = require('moment');
const axios = require('axios');

class BackgroundCheckService {
  constructor() {
    this.backgroundChecks = new Map();
    this.referenceChecks = new Map();
    this.providers = new Map();
    this.checkTemplates = new Map();
    this.initializeProviders();
    this.initializeCheckTemplates();
  }

  // Initialize background check providers
  initializeProviders() {
    const providers = [
      {
        id: 'checkr',
        name: 'Checkr',
        type: 'background_check',
        api_endpoint: 'https://api.checkr.com/v1',
        supported_checks: [
          'ssn_trace',
          'criminal_search',
          'employment_verification',
          'education_verification',
          'driving_record',
          'credit_check',
          'drug_test',
          'international_criminal'
        ],
        turnaround_time: {
          standard: '1-3 business days',
          expedited: '24-48 hours'
        },
        pricing_tier: 'enterprise'
      },
      {
        id: 'sterling',
        name: 'Sterling Background Checks',
        type: 'background_check',
        api_endpoint: 'https://api.sterlingcheck.com/v2',
        supported_checks: [
          'identity_verification',
          'criminal_history',
          'employment_history',
          'education_verification',
          'professional_license',
          'reference_verification',
          'drug_screening'
        ],
        turnaround_time: {
          standard: '2-4 business days',
          expedited: '1-2 business days'
        },
        pricing_tier: 'premium'
      },
      {
        id: 'accurate',
        name: 'Accurate Background',
        type: 'background_check',
        api_endpoint: 'https://api.accuratebackground.com/v3',
        supported_checks: [
          'criminal_background',
          'employment_verification',
          'education_verification',
          'reference_check',
          'driving_record',
          'credit_report'
        ],
        turnaround_time: {
          standard: '1-2 business days',
          expedited: '24 hours'
        },
        pricing_tier: 'standard'
      },
      {
        id: 'skillsurvey',
        name: 'SkillSurvey',
        type: 'reference_check',
        api_endpoint: 'https://api.skillsurvey.com/v1',
        supported_checks: [
          'professional_references',
          'performance_insights',
          'behavioral_assessment',
          'skills_validation',
          'cultural_fit_analysis'
        ],
        turnaround_time: {
          standard: '3-5 business days',
          expedited: '1-2 business days'
        },
        pricing_tier: 'premium'
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  // Initialize check templates
  initializeCheckTemplates() {
    const templates = [
      {
        id: 'standard-employee',
        name: 'Standard Employee Background Check',
        position_level: 'general',
        required_checks: [
          { type: 'ssn_trace', required: true },
          { type: 'criminal_search', required: true, scope: 'county_state_federal' },
          { type: 'employment_verification', required: true, years_back: 7 },
          { type: 'education_verification', required: true },
          { type: 'reference_check', required: true, min_references: 2 }
        ],
        optional_checks: [
          { type: 'driving_record', required: false },
          { type: 'credit_check', required: false }
        ],
        turnaround_requirement: 'standard',
        auto_adjudication: true
      },
      {
        id: 'executive-level',
        name: 'Executive Level Background Check',
        position_level: 'executive',
        required_checks: [
          { type: 'comprehensive_criminal', required: true, scope: 'international' },
          { type: 'employment_verification', required: true, years_back: 10 },
          { type: 'education_verification', required: true, include_transcripts: true },
          { type: 'professional_license', required: true },
          { type: 'reference_check', required: true, min_references: 5 },
          { type: 'credit_check', required: true },
          { type: 'media_search', required: true }
        ],
        optional_checks: [
          { type: 'social_media_screening', required: false },
          { type: 'financial_sanctions', required: false }
        ],
        turnaround_requirement: 'expedited',
        auto_adjudication: false,
        manual_review_required: true
      },
      {
        id: 'finance-position',
        name: 'Financial Position Background Check',
        position_level: 'finance',
        required_checks: [
          { type: 'ssn_trace', required: true },
          { type: 'criminal_search', required: true, focus: 'financial_crimes' },
          { type: 'credit_check', required: true, detailed: true },
          { type: 'employment_verification', required: true, years_back: 10 },
          { type: 'education_verification', required: true },
          { type: 'professional_license', required: true },
          { type: 'reference_check', required: true, min_references: 3 },
          { type: 'sanctions_screening', required: true }
        ],
        optional_checks: [],
        turnaround_requirement: 'standard',
        auto_adjudication: false,
        compliance_requirements: ['SOX', 'FINRA']
      },
      {
        id: 'safety-sensitive',
        name: 'Safety-Sensitive Position Check',
        position_level: 'safety_sensitive',
        required_checks: [
          { type: 'criminal_search', required: true, scope: 'comprehensive' },
          { type: 'driving_record', required: true, years_back: 7 },
          { type: 'drug_test', required: true, type: '10_panel' },
          { type: 'employment_verification', required: true, years_back: 5 },
          { type: 'reference_check', required: true, min_references: 3 },
          { type: 'motor_vehicle_record', required: true }
        ],
        optional_checks: [
          { type: 'alcohol_test', required: false }
        ],
        turnaround_requirement: 'expedited',
        auto_adjudication: false,
        dot_compliance: true
      }
    ];

    templates.forEach(template => {
      this.checkTemplates.set(template.id, template);
    });
  }

  // Initiate Background Check
  async initiateBackgroundCheck(checkData) {
    try {
      const checkId = crypto.randomUUID();
      const template = this.checkTemplates.get(checkData.template_id);
      
      if (!template) {
        throw new Error('Background check template not found');
      }

      const provider = this.providers.get(checkData.provider_id || 'checkr');
      if (!provider) {
        throw new Error('Background check provider not found');
      }

      const backgroundCheck = {
        id: checkId,
        candidate_id: checkData.candidate_id,
        employee_id: checkData.employee_id,
        job_id: checkData.job_id,
        template_id: checkData.template_id,
        template_name: template.name,
        provider_id: provider.id,
        provider_name: provider.name,
        status: 'initiated',
        overall_result: 'pending',
        created_at: new Date().toISOString(),
        created_by: checkData.created_by,
        candidate_info: {
          first_name: checkData.candidate_info.first_name,
          last_name: checkData.candidate_info.last_name,
          email: checkData.candidate_info.email,
          phone: checkData.candidate_info.phone,
          ssn: checkData.candidate_info.ssn,
          date_of_birth: checkData.candidate_info.date_of_birth,
          address: checkData.candidate_info.address,
          previous_addresses: checkData.candidate_info.previous_addresses || []
        },
        consent: {
          provided: checkData.consent_provided || false,
          timestamp: checkData.consent_timestamp,
          ip_address: checkData.consent_ip,
          electronic_signature: checkData.electronic_signature
        },
        checks: [],
        estimated_completion: this.calculateEstimatedCompletion(template, provider),
        adjudication: {
          status: 'pending',
          auto_adjudication: template.auto_adjudication,
          manual_review_required: template.manual_review_required || false,
          decision: null,
          decision_date: null,
          decision_by: null,
          notes: ''
        },
        compliance: {
          fcra_compliant: true,
          adverse_action_notice: null,
          dispute_process: 'available'
        }
      };

      // Create individual checks based on template
      const allChecks = [...template.required_checks, ...template.optional_checks];
      allChecks.forEach(checkConfig => {
        const check = {
          id: crypto.randomUUID(),
          type: checkConfig.type,
          required: checkConfig.required,
          status: 'pending',
          result: null,
          details: {},
          provider_reference: null,
          started_at: null,
          completed_at: null,
          estimated_completion: this.calculateCheckCompletion(checkConfig, provider),
          configuration: checkConfig
        };
        backgroundCheck.checks.push(check);
      });

      this.backgroundChecks.set(checkId, backgroundCheck);

      // Submit to provider
      const submissionResult = await this.submitToProvider(backgroundCheck, provider);
      if (submissionResult.success) {
        backgroundCheck.provider_reference = submissionResult.provider_reference;
        backgroundCheck.status = 'submitted';
        backgroundCheck.submitted_at = new Date().toISOString();
      }

      return {
        success: true,
        check_id: checkId,
        background_check: backgroundCheck,
        estimated_completion: backgroundCheck.estimated_completion
      };
    } catch (error) {
      console.error('Error initiating background check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async submitToProvider(backgroundCheck, provider) {
    try {
      // Simulate API call to background check provider
      const requestData = {
        candidate: backgroundCheck.candidate_info,
        checks: backgroundCheck.checks.map(c => ({
          type: c.type,
          configuration: c.configuration
        })),
        callback_url: `${process.env.BACKEND_URL}/api/background-checks/webhook/${backgroundCheck.id}`,
        turnaround: backgroundCheck.template_id.includes('executive') ? 'expedited' : 'standard'
      };

      // In real implementation, this would make actual API call
      const providerResponse = {
        success: true,
        provider_reference: `${provider.id}_${Date.now()}`,
        status: 'submitted',
        estimated_completion: backgroundCheck.estimated_completion
      };

      return providerResponse;
    } catch (error) {
      console.error('Error submitting to provider:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process provider webhook/results
  async processProviderResult(checkId, providerData) {
    try {
      const backgroundCheck = this.backgroundChecks.get(checkId);
      if (!backgroundCheck) {
        throw new Error('Background check not found');
      }

      // Update individual check results
      if (providerData.check_results) {
        providerData.check_results.forEach(result => {
          const check = backgroundCheck.checks.find(c => c.type === result.type);
          if (check) {
            check.status = result.status;
            check.result = result.result;
            check.details = result.details || {};
            check.completed_at = result.completed_at || new Date().toISOString();
            check.provider_reference = result.provider_reference;
          }
        });
      }

      // Update overall status
      const completedChecks = backgroundCheck.checks.filter(c => c.status === 'completed');
      const failedChecks = backgroundCheck.checks.filter(c => c.status === 'failed');
      const totalChecks = backgroundCheck.checks.length;

      if (completedChecks.length + failedChecks.length === totalChecks) {
        backgroundCheck.status = 'completed';
        backgroundCheck.completed_at = new Date().toISOString();
        
        // Perform adjudication
        await this.performAdjudication(backgroundCheck);
      } else {
        backgroundCheck.status = 'in_progress';
      }

      return {
        success: true,
        background_check: backgroundCheck,
        requires_review: backgroundCheck.adjudication.manual_review_required
      };
    } catch (error) {
      console.error('Error processing provider result:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Adjudication logic
  async performAdjudication(backgroundCheck) {
    try {
      const template = this.checkTemplates.get(backgroundCheck.template_id);
      let overallDecision = 'clear';
      let flags = [];
      let requiresReview = template.manual_review_required || false;

      // Analyze each check result
      backgroundCheck.checks.forEach(check => {
        if (check.status === 'failed') {
          flags.push(`Check failed: ${check.type}`);
          overallDecision = 'review_required';
          requiresReview = true;
        } else if (check.result === 'consider') {
          flags.push(`Consideration required: ${check.type}`);
          if (!requiresReview) {
            overallDecision = 'consider';
          }
          requiresReview = true;
        } else if (check.result === 'clear_with_records') {
          flags.push(`Records found but clear: ${check.type}`);
          if (overallDecision === 'clear') {
            overallDecision = 'clear_with_records';
          }
        }
      });

      // Apply business rules
      const criminalCheck = backgroundCheck.checks.find(c => c.type.includes('criminal'));
      if (criminalCheck && criminalCheck.details.convictions) {
        const convictions = criminalCheck.details.convictions;
        const recentFelonies = convictions.filter(c => 
          c.type === 'felony' && 
          moment().diff(moment(c.date), 'years') < 7
        );
        
        if (recentFelonies.length > 0) {
          overallDecision = 'review_required';
          requiresReview = true;
          flags.push('Recent felony convictions found');
        }
      }

      // Auto-adjudication for simple cases
      if (template.auto_adjudication && !requiresReview && overallDecision === 'clear') {
        backgroundCheck.adjudication.status = 'completed';
        backgroundCheck.adjudication.decision = 'approved';
        backgroundCheck.adjudication.decision_date = new Date().toISOString();
        backgroundCheck.adjudication.auto_decision = true;
      } else {
        backgroundCheck.adjudication.status = 'review_required';
        backgroundCheck.adjudication.decision = null;
        backgroundCheck.adjudication.flags = flags;
      }

      backgroundCheck.overall_result = overallDecision;
      
      return {
        success: true,
        adjudication_result: backgroundCheck.adjudication,
        requires_manual_review: requiresReview
      };
    } catch (error) {
      console.error('Error performing adjudication:', error);
      throw error;
    }
  }

  // Manual adjudication
  async performManualAdjudication(checkId, adjudicationData) {
    try {
      const backgroundCheck = this.backgroundChecks.get(checkId);
      if (!backgroundCheck) {
        throw new Error('Background check not found');
      }

      backgroundCheck.adjudication.status = 'completed';
      backgroundCheck.adjudication.decision = adjudicationData.decision;
      backgroundCheck.adjudication.decision_date = new Date().toISOString();
      backgroundCheck.adjudication.decision_by = adjudicationData.adjudicator;
      backgroundCheck.adjudication.notes = adjudicationData.notes || '';
      backgroundCheck.adjudication.manual_override = adjudicationData.override || false;

      // Handle adverse action if decision is negative
      if (adjudicationData.decision === 'denied') {
        await this.initiateAdverseAction(backgroundCheck, adjudicationData);
      }

      return {
        success: true,
        background_check: backgroundCheck,
        final_decision: adjudicationData.decision
      };
    } catch (error) {
      console.error('Error performing manual adjudication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Adverse action process
  async initiateAdverseAction(backgroundCheck, adjudicationData) {
    try {
      const adverseAction = {
        id: crypto.randomUUID(),
        background_check_id: backgroundCheck.id,
        initiated_at: new Date().toISOString(),
        initiated_by: adjudicationData.adjudicator,
        reason: adjudicationData.adverse_action_reason || 'Background check results',
        status: 'pre_adverse_notice_sent',
        pre_adverse_notice: {
          sent_at: new Date().toISOString(),
          waiting_period_ends: moment().add(5, 'business_days').toISOString() // FCRA requirement
        },
        dispute_period: {
          allowed: true,
          deadline: moment().add(5, 'business_days').toISOString(),
          disputes: []
        }
      };

      backgroundCheck.compliance.adverse_action_notice = adverseAction.id;
      backgroundCheck.status = 'adverse_action_initiated';

      return adverseAction;
    } catch (error) {
      console.error('Error initiating adverse action:', error);
      throw error;
    }
  }

  // Reference Checks
  async initiateReferenceCheck(referenceData) {
    try {
      const referenceId = crypto.randomUUID();
      
      const referenceCheck = {
        id: referenceId,
        candidate_id: referenceData.candidate_id,
        background_check_id: referenceData.background_check_id,
        status: 'initiated',
        created_at: new Date().toISOString(),
        created_by: referenceData.created_by,
        references: referenceData.references.map(ref => ({
          id: crypto.randomUUID(),
          name: ref.name,
          title: ref.title,
          company: ref.company,
          email: ref.email,
          phone: ref.phone,
          relationship: ref.relationship,
          years_worked_together: ref.years_worked_together,
          status: 'pending',
          survey_sent_at: null,
          survey_completed_at: null,
          responses: {},
          follow_up_attempts: 0,
          max_follow_ups: 3
        })),
        survey_template: referenceData.survey_template || 'standard',
        completion_deadline: moment().add(5, 'business_days').toISOString(),
        auto_reminders: true,
        provider_id: referenceData.provider_id || 'skillsurvey'
      };

      this.referenceChecks.set(referenceId, referenceCheck);

      // Send surveys to references
      await this.sendReferenceSurveys(referenceCheck);

      return {
        success: true,
        reference_check_id: referenceId,
        reference_check: referenceCheck
      };
    } catch (error) {
      console.error('Error initiating reference check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendReferenceSurveys(referenceCheck) {
    try {
      for (const reference of referenceCheck.references) {
        const surveyLink = this.generateSurveyLink(referenceCheck.id, reference.id);
        
        // Send email with survey link
        reference.status = 'survey_sent';
        reference.survey_sent_at = new Date().toISOString();
        reference.survey_link = surveyLink;
        
        // In real implementation, would integrate with email service
        console.log(`Reference survey sent to ${reference.email}: ${surveyLink}`);
      }

      referenceCheck.status = 'surveys_sent';
      return { success: true };
    } catch (error) {
      console.error('Error sending reference surveys:', error);
      throw error;
    }
  }

  generateSurveyLink(referenceCheckId, referenceId) {
    const token = crypto.randomBytes(32).toString('hex');
    return `${process.env.FRONTEND_URL}/reference-survey/${referenceCheckId}/${referenceId}?token=${token}`;
  }

  // Survey response processing
  async processReferenceSurveyResponse(referenceCheckId, referenceId, responses) {
    try {
      const referenceCheck = this.referenceChecks.get(referenceCheckId);
      if (!referenceCheck) {
        throw new Error('Reference check not found');
      }

      const reference = referenceCheck.references.find(r => r.id === referenceId);
      if (!reference) {
        throw new Error('Reference not found');
      }

      reference.status = 'completed';
      reference.survey_completed_at = new Date().toISOString();
      reference.responses = responses;

      // Calculate reference score
      reference.score = this.calculateReferenceScore(responses);

      // Check if all references are complete
      const completedReferences = referenceCheck.references.filter(r => r.status === 'completed');
      if (completedReferences.length === referenceCheck.references.length) {
        referenceCheck.status = 'completed';
        referenceCheck.completed_at = new Date().toISOString();
        referenceCheck.overall_score = this.calculateOverallReferenceScore(referenceCheck.references);
      }

      return {
        success: true,
        reference_check: referenceCheck,
        reference_score: reference.score
      };
    } catch (error) {
      console.error('Error processing reference survey response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateReferenceScore(responses) {
    // Simple scoring algorithm - can be made more sophisticated
    const scores = {
      'excellent': 5,
      'very_good': 4,
      'good': 3,
      'fair': 2,
      'poor': 1
    };

    let totalScore = 0;
    let questionCount = 0;

    Object.values(responses).forEach(response => {
      if (scores[response]) {
        totalScore += scores[response];
        questionCount++;
      }
    });

    return questionCount > 0 ? (totalScore / questionCount).toFixed(2) : 0;
  }

  calculateOverallReferenceScore(references) {
    const completedRefs = references.filter(r => r.score);
    if (completedRefs.length === 0) return 0;

    const totalScore = completedRefs.reduce((sum, ref) => sum + parseFloat(ref.score), 0);
    return (totalScore / completedRefs.length).toFixed(2);
  }

  // Utility methods
  calculateEstimatedCompletion(template, provider) {
    const baseDays = template.position_level === 'executive' ? 3 : 2;
    const turnaroundMultiplier = provider.turnaround_time.standard.includes('24') ? 1 : 2;
    
    return moment().add(baseDays * turnaroundMultiplier, 'days').toISOString();
  }

  calculateCheckCompletion(checkConfig, provider) {
    const checkTimes = {
      'ssn_trace': 1,
      'criminal_search': 2,
      'employment_verification': 3,
      'education_verification': 2,
      'driving_record': 1,
      'credit_check': 1,
      'reference_check': 5
    };

    const baseDays = checkTimes[checkConfig.type] || 2;
    return moment().add(baseDays, 'days').toISOString();
  }

  // Analytics and reporting
  async getBackgroundCheckAnalytics(filters = {}) {
    try {
      const checks = Array.from(this.backgroundChecks.values());
      const references = Array.from(this.referenceChecks.values());

      // Apply filters
      let filteredChecks = checks;
      if (filters.date_range) {
        const { start_date, end_date } = filters.date_range;
        filteredChecks = filteredChecks.filter(check => {
          const checkDate = new Date(check.created_at);
          return checkDate >= new Date(start_date) && checkDate <= new Date(end_date);
        });
      }

      const totalChecks = filteredChecks.length;
      const completedChecks = filteredChecks.filter(c => c.status === 'completed').length;
      const approvedChecks = filteredChecks.filter(c => c.adjudication.decision === 'approved').length;
      const deniedChecks = filteredChecks.filter(c => c.adjudication.decision === 'denied').length;

      // Calculate average turnaround time
      const completedWithTime = filteredChecks.filter(c => c.completed_at);
      const avgTurnaroundDays = completedWithTime.length > 0 ? 
        (completedWithTime.reduce((sum, c) => {
          const days = moment(c.completed_at).diff(moment(c.created_at), 'days');
          return sum + days;
        }, 0) / completedWithTime.length).toFixed(1) : 0;

      return {
        success: true,
        analytics: {
          summary: {
            total_checks: totalChecks,
            completed_checks: completedChecks,
            approved_checks: approvedChecks,
            denied_checks: deniedChecks,
            approval_rate: totalChecks > 0 ? ((approvedChecks / totalChecks) * 100).toFixed(2) : 0,
            avg_turnaround_days: avgTurnaroundDays
          },
          provider_performance: this.calculateProviderPerformance(filteredChecks),
          template_usage: this.calculateTemplateUsage(filteredChecks),
          reference_check_stats: this.calculateReferenceStats(references),
          compliance_metrics: this.calculateComplianceMetrics(filteredChecks),
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating background check analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateProviderPerformance(checks) {
    const performance = {};
    
    checks.forEach(check => {
      const providerId = check.provider_id;
      if (!performance[providerId]) {
        performance[providerId] = {
          total_checks: 0,
          completed_checks: 0,
          avg_turnaround: 0,
          success_rate: 0
        };
      }
      
      performance[providerId].total_checks++;
      if (check.status === 'completed') {
        performance[providerId].completed_checks++;
      }
    });

    return performance;
  }

  calculateTemplateUsage(checks) {
    const usage = {};
    checks.forEach(check => {
      const templateName = check.template_name || 'Unknown';
      usage[templateName] = (usage[templateName] || 0) + 1;
    });
    return usage;
  }

  calculateReferenceStats(references) {
    const totalReferences = references.length;
    const completedReferences = references.filter(r => r.status === 'completed').length;
    
    if (totalReferences === 0) {
      return {
        total_reference_checks: 0,
        completion_rate: 0,
        avg_score: 0
      };
    }

    const allReferenceScores = references
      .filter(r => r.overall_score)
      .map(r => parseFloat(r.overall_score));
    
    const avgScore = allReferenceScores.length > 0 ? 
      (allReferenceScores.reduce((sum, score) => sum + score, 0) / allReferenceScores.length).toFixed(2) : 0;

    return {
      total_reference_checks: totalReferences,
      completion_rate: ((completedReferences / totalReferences) * 100).toFixed(2),
      avg_score: avgScore
    };
  }

  calculateComplianceMetrics(checks) {
    const totalChecks = checks.length;
    const fcraCompliant = checks.filter(c => c.compliance.fcra_compliant).length;
    const adverseActions = checks.filter(c => c.compliance.adverse_action_notice).length;

    return {
      fcra_compliance_rate: totalChecks > 0 ? ((fcraCompliant / totalChecks) * 100).toFixed(2) : 100,
      adverse_action_rate: totalChecks > 0 ? ((adverseActions / totalChecks) * 100).toFixed(2) : 0,
      dispute_rate: '< 1%' // Would be calculated from actual dispute data
    };
  }

  // Getter methods
  async getBackgroundCheck(checkId) {
    const check = this.backgroundChecks.get(checkId);
    return check ? { success: true, background_check: check } : { success: false, error: 'Check not found' };
  }

  async getReferenceCheck(referenceId) {
    const reference = this.referenceChecks.get(referenceId);
    return reference ? { success: true, reference_check: reference } : { success: false, error: 'Reference check not found' };
  }

  async getAllBackgroundChecks(filters = {}) {
    const checks = Array.from(this.backgroundChecks.values());
    return { success: true, background_checks: checks, count: checks.length };
  }

  async getCheckTemplates() {
    const templates = Array.from(this.checkTemplates.values());
    return { success: true, templates };
  }

  async getProviders() {
    const providers = Array.from(this.providers.values());
    return { success: true, providers };
  }
}

module.exports = new BackgroundCheckService();
