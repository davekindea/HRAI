const express = require('express');
const router = express.Router();
const ClientEngagementService = require('../services/clientEngagementService');

// Enhanced Client Dashboard Routes
router.get('/clients/:clientId/enhanced-dashboard', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await ClientEngagementService.getEnhancedClientDashboard(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Order Management Routes
router.post('/job-orders', async (req, res) => {
  try {
    const { clientId } = req.body;
    const result = await ClientEngagementService.createJobOrder(clientId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/job-orders', async (req, res) => {
  try {
    const { clientId, status, priority } = req.query;
    
    // Simulate fetching job orders with filters
    const orders = [
      {
        id: 'order_1',
        orderNumber: 'JO-20250920001',
        clientId: 'client_1',
        jobTitle: 'Senior Software Engineer',
        status: 'active',
        priority: 'high',
        createdAt: '2025-09-15T10:00:00Z',
        targetDate: '2025-10-30T23:59:59Z'
      },
      {
        id: 'order_2',
        orderNumber: 'JO-20250918002',
        clientId: 'client_1',
        jobTitle: 'Product Manager',
        status: 'pending_review',
        priority: 'medium',
        createdAt: '2025-09-18T14:30:00Z',
        targetDate: '2025-11-15T23:59:59Z'
      }
    ].filter(order => {
      let matches = true;
      if (clientId) matches = matches && order.clientId === clientId;
      if (status) matches = matches && order.status === status;
      if (priority) matches = matches && order.priority === priority;
      return matches;
    });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/job-orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Simulate detailed job order
    const order = {
      id: orderId,
      orderNumber: 'JO-20250920001',
      status: 'active',
      jobDetails: {
        title: 'Senior Software Engineer',
        department: 'Technology',
        level: 'Senior',
        location: 'San Francisco, CA',
        workType: 'hybrid'
      },
      commercialTerms: {
        fee: 20000,
        feeType: 'fixed',
        timeline: '45 days',
        replacementGuarantee: 90
      },
      progress: {
        candidatesSourced: 35,
        candidatesPresented: 8,
        interviewsScheduled: 5,
        offersExtended: 1
      }
    };

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/job-orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, comments, updatedBy } = req.body;
    const result = await ClientEngagementService.updateJobOrderStatus(orderId, status, comments, updatedBy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quote and Proposal Management Routes
router.post('/quotes', async (req, res) => {
  try {
    const { clientId } = req.body;
    const result = await ClientEngagementService.generateQuote(clientId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/quotes', async (req, res) => {
  try {
    const { clientId, status } = req.query;
    
    // Simulate quote list
    const quotes = [
      {
        id: 'quote_1',
        quoteNumber: 'QT-20250920001',
        clientId: 'client_1',
        totalAmount: 75000,
        status: 'approved',
        validUntil: '2025-10-20T23:59:59Z',
        createdAt: '2025-09-20T09:00:00Z'
      },
      {
        id: 'quote_2',
        quoteNumber: 'QT-20250918002',
        clientId: 'client_1',
        totalAmount: 45000,
        status: 'sent',
        validUntil: '2025-10-18T23:59:59Z',
        createdAt: '2025-09-18T15:00:00Z'
      }
    ].filter(quote => {
      let matches = true;
      if (clientId) matches = matches && quote.clientId === clientId;
      if (status) matches = matches && quote.status === status;
      return matches;
    });

    res.json({ success: true, quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/quotes/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    
    // Simulate detailed quote
    const quote = {
      id: quoteId,
      quoteNumber: 'QT-20250920001',
      clientId: 'client_1',
      services: [
        {
          type: 'executive_search',
          description: 'Senior Software Engineer recruitment',
          quantity: 1,
          rate: 25000,
          totalAmount: 25000
        },
        {
          type: 'retained_search',
          description: 'Product Manager search with 30-day guarantee',
          quantity: 1,
          rate: 20000,
          totalAmount: 20000
        }
      ],
      pricing: {
        subtotal: 45000,
        discount: 0,
        tax: 0,
        total: 45000
      },
      terms: {
        validUntil: '2025-10-20T23:59:59Z',
        paymentTerms: 'net_30',
        replacementGuarantee: 90
      },
      status: 'approved'
    };

    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/quotes/:quoteId/status', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { status, clientFeedback } = req.body;
    const result = await ClientEngagementService.updateQuoteStatus(quoteId, status, clientFeedback);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Feedback and Evaluation Routes
router.post('/candidate-evaluations', async (req, res) => {
  try {
    const { clientId } = req.body;
    const result = await ClientEngagementService.submitCandidateEvaluation(clientId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/candidate-evaluations', async (req, res) => {
  try {
    const { clientId, jobId, candidateId } = req.query;
    
    // Simulate evaluation list
    const evaluations = [
      {
        id: 'eval_1',
        clientId: 'client_1',
        candidateId: 'candidate_1',
        jobId: 'job_1',
        overallRating: 4.5,
        recommendation: 'proceed',
        submittedAt: '2025-09-19T14:30:00Z'
      },
      {
        id: 'eval_2',
        clientId: 'client_1',
        candidateId: 'candidate_2',
        jobId: 'job_1',
        overallRating: 3.8,
        recommendation: 'hold',
        submittedAt: '2025-09-18T11:15:00Z'
      }
    ].filter(eval => {
      let matches = true;
      if (clientId) matches = matches && eval.clientId === clientId;
      if (jobId) matches = matches && eval.jobId === jobId;
      if (candidateId) matches = matches && eval.candidateId === candidateId;
      return matches;
    });

    res.json({ success: true, evaluations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/candidate-evaluations/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    
    // Simulate detailed evaluation
    const evaluation = {
      id: evaluationId,
      candidateId: 'candidate_1',
      jobId: 'job_1',
      ratings: {
        technicalSkills: 4.5,
        communication: 4.0,
        culturalFit: 4.2,
        experience: 4.3,
        motivation: 4.1,
        overall: 4.2
      },
      feedback: {
        strengths: ['Strong technical background', 'Good problem-solving skills'],
        weaknesses: ['Limited leadership experience'],
        concerns: ['Salary expectations may be high'],
        recommendations: ['Proceed to final interview']
      },
      decision: {
        recommendation: 'proceed',
        reasoning: 'Strong technical fit with good cultural alignment',
        nextSteps: ['Schedule final interview', 'Prepare offer parameters']
      },
      submittedAt: '2025-09-19T14:30:00Z'
    };

    res.json({ success: true, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/jobs/:jobId/evaluation-summary', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { clientId } = req.query;
    const result = await ClientEngagementService.getEvaluationSummary(clientId, jobId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Project Progress Tracking
router.get('/projects/:projectId/progress', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Simulate project progress
    const progress = {
      projectId,
      currentPhase: 'interviewing',
      overallProgress: 65,
      
      phases: {
        planning: { status: 'completed', progress: 100, completedAt: '2025-09-10T00:00:00Z' },
        sourcing: { status: 'completed', progress: 100, completedAt: '2025-09-17T00:00:00Z' },
        screening: { status: 'completed', progress: 100, completedAt: '2025-09-19T00:00:00Z' },
        interviewing: { status: 'in_progress', progress: 60, estimatedCompletion: '2025-09-28T00:00:00Z' },
        offer: { status: 'pending', progress: 0, estimatedStart: '2025-09-29T00:00:00Z' },
        closure: { status: 'pending', progress: 0, estimatedStart: '2025-10-05T00:00:00Z' }
      },
      
      metrics: {
        candidatesSourced: 45,
        candidatesScreened: 28,
        candidatesPresented: 12,
        interviewsCompleted: 8,
        offersExtended: 0
      },
      
      timeline: {
        startDate: '2025-09-10T00:00:00Z',
        targetCompletion: '2025-10-30T00:00:00Z',
        estimatedCompletion: '2025-10-25T00:00:00Z',
        daysRemaining: 35
      }
    };

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client Onboarding
router.post('/clients/:clientId/onboard', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Simulate onboarding process
    const onboarding = {
      clientId,
      status: 'in_progress',
      steps: [
        { name: 'Welcome package sent', status: 'completed', completedAt: '2025-09-20T09:00:00Z' },
        { name: 'Initial consultation scheduled', status: 'completed', completedAt: '2025-09-20T10:00:00Z' },
        { name: 'Service agreement signed', status: 'in_progress', estimatedCompletion: '2025-09-22T00:00:00Z' },
        { name: 'Portal access configured', status: 'pending' },
        { name: 'First project kickoff', status: 'pending' }
      ],
      nextAction: 'Follow up on service agreement signature',
      assignedTo: 'account_manager_1'
    };

    res.json({ success: true, onboarding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;