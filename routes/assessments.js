const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const assessmentService = require('../services/assessmentService');
const { body, validationResult } = require('express-validator');

// Create assessment
router.post('/',
  auth,
  [
    body('title').notEmpty().withMessage('Assessment title is required'),
    body('description').notEmpty().withMessage('Assessment description is required'),
    body('type').isIn(['technical', 'cognitive', 'personality', 'skills', 'video']).withMessage('Valid assessment type is required'),
    body('jobId').optional().isUUID().withMessage('Valid job ID is required'),
    body('timeLimit').optional().isInt({ min: 5, max: 480 }).withMessage('Time limit must be between 5 and 480 minutes'),
    body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assessmentData = {
        ...req.body,
        createdBy: req.user.id
      };

      const assessment = await assessmentService.createAssessment(assessmentData);
      
      res.status(201).json({
        success: true,
        message: 'Assessment created successfully',
        assessment
      });
    } catch (error) {
      console.error('Failed to create assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create assessment',
        error: error.message
      });
    }
  }
);

// Get assessment list
router.get('/', auth, async (req, res) => {
  try {
    const {
      type,
      jobId,
      isActive,
      page = 1,
      limit = 10
    } = req.query;

    // Mock assessments list
    const assessments = [
      {
        id: '1',
        title: 'Software Engineer Technical Assessment',
        description: 'Evaluate programming skills and problem-solving abilities',
        type: 'technical',
        jobId: 'job-1',
        timeLimit: 120,
        passingScore: 70,
        totalQuestions: 15,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        completions: 25,
        averageScore: 78
      },
      {
        id: '2',
        title: 'Cognitive Abilities Test',
        description: 'Assess logical reasoning and analytical thinking',
        type: 'cognitive',
        jobId: null, // Generic assessment
        timeLimit: 60,
        passingScore: 65,
        totalQuestions: 20,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        completions: 40,
        averageScore: 72
      }
    ];

    // Apply filters
    let filteredAssessments = assessments;
    if (type) {
      filteredAssessments = filteredAssessments.filter(a => a.type === type);
    }
    if (jobId) {
      filteredAssessments = filteredAssessments.filter(a => a.jobId === jobId);
    }
    if (isActive !== undefined) {
      filteredAssessments = filteredAssessments.filter(a => a.isActive === (isActive === 'true'));
    }

    res.json({
      success: true,
      assessments: filteredAssessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredAssessments.length,
        pages: Math.ceil(filteredAssessments.length / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessments',
      error: error.message
    });
  }
});

// Get assessment details
router.get('/:assessmentId', auth, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await assessmentService.getAssessmentById(assessmentId);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Failed to get assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment details',
      error: error.message
    });
  }
});

// Assign assessment to candidate
router.post('/:assessmentId/assign',
  auth,
  [
    body('candidateId').notEmpty().withMessage('Candidate ID is required'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { assessmentId } = req.params;
      const { candidateId, dueDate } = req.body;
      
      const assignment = await assessmentService.assignAssessment(assessmentId, candidateId, dueDate);
      
      res.status(201).json({
        success: true,
        message: 'Assessment assigned successfully',
        assignment
      });
    } catch (error) {
      console.error('Failed to assign assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign assessment',
        error: error.message
      });
    }
  }
);

// Start assessment (candidate endpoint)
router.post('/assignments/:assignmentId/start', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { candidateId } = req.body; // In production, this would come from candidate auth

    const result = await assessmentService.startAssessment(assignmentId, candidateId);
    
    res.json({
      success: true,
      message: 'Assessment started successfully',
      assignment: result.assignment,
      questions: result.questions,
      timeLimit: result.timeLimit
    });
  } catch (error) {
    console.error('Failed to start assessment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Submit answer
router.post('/assignments/:assignmentId/answers',
  [
    body('questionId').notEmpty().withMessage('Question ID is required'),
    body('answer').notEmpty().withMessage('Answer is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { assignmentId } = req.params;
      const { questionId, answer } = req.body;
      
      const result = await assessmentService.submitAnswer(assignmentId, questionId, answer);
      
      res.json({
        success: true,
        message: 'Answer submitted successfully',
        result
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Submit complete assessment
router.post('/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const result = await assessmentService.submitAssessment(assignmentId);
    
    res.json({
      success: true,
      message: 'Assessment submitted successfully',
      assignment: result.assignment,
      results: result.results,
      passed: result.passed
    });
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment',
      error: error.message
    });
  }
});

// Get candidate's assessments
router.get('/candidates/:candidateId/assignments', auth, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { status } = req.query;

    // Mock candidate assignments
    const assignments = [
      {
        id: '1',
        assessmentId: '1',
        assessmentTitle: 'Technical Assessment',
        status: 'completed',
        assignedAt: '2024-01-10T00:00:00Z',
        dueDate: '2024-01-17T23:59:59Z',
        completedAt: '2024-01-15T14:30:00Z',
        score: 85,
        passed: true,
        timeSpent: 105
      },
      {
        id: '2',
        assessmentId: '2',
        assessmentTitle: 'Cognitive Test',
        status: 'assigned',
        assignedAt: '2024-01-20T00:00:00Z',
        dueDate: '2024-01-27T23:59:59Z',
        completedAt: null,
        score: null,
        passed: null,
        timeSpent: 0
      }
    ];

    let filteredAssignments = assignments;
    if (status) {
      filteredAssignments = assignments.filter(a => a.status === status);
    }

    res.json({
      success: true,
      candidateId,
      assignments: filteredAssignments
    });
  } catch (error) {
    console.error('Failed to get candidate assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get candidate assessments',
      error: error.message
    });
  }
});

// Get assessment results
router.get('/assignments/:assignmentId/results', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Mock detailed results
    const results = {
      assignmentId,
      assessmentTitle: 'Technical Assessment',
      candidateName: 'John Doe',
      overallScore: 85,
      passed: true,
      timeSpent: 105,
      completedAt: '2024-01-15T14:30:00Z',
      categoryBreakdown: {
        programming: { score: 90, questionsAnswered: 5, totalQuestions: 5 },
        algorithms: { score: 80, questionsAnswered: 5, totalQuestions: 5 },
        system_design: { score: 85, questionsAnswered: 3, totalQuestions: 3 }
      },
      questionResults: [
        {
          questionId: '1',
          question: 'What is the time complexity of binary search?',
          category: 'algorithms',
          userAnswer: 'O(log n)',
          correctAnswer: 'O(log n)',
          score: 2,
          maxScore: 2,
          feedback: 'Correct! Binary search has O(log n) time complexity.'
        }
      ],
      recommendations: [
        'Strong performance in programming fundamentals',
        'Consider reviewing advanced algorithm concepts',
        'Excellent problem-solving approach'
      ]
    };

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Failed to get assessment results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment results',
      error: error.message
    });
  }
});

// Get assessment analytics
router.get('/:assessmentId/analytics', auth, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const analytics = await assessmentService.getAssessmentAnalytics(assessmentId);
    
    res.json({
      success: true,
      assessmentId,
      analytics
    });
  } catch (error) {
    console.error('Failed to get assessment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment analytics',
      error: error.message
    });
  }
});

// Update assessment
router.put('/:assessmentId',
  auth,
  [
    body('title').optional().notEmpty().withMessage('Assessment title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Assessment description cannot be empty'),
    body('timeLimit').optional().isInt({ min: 5, max: 480 }).withMessage('Time limit must be between 5 and 480 minutes'),
    body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { assessmentId } = req.params;
      
      // Mock update - in production, update in database
      const updatedAssessment = {
        id: assessmentId,
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Assessment updated successfully',
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error('Failed to update assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assessment',
        error: error.message
      });
    }
  }
);

// Delete assessment
router.delete('/:assessmentId', auth, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    // Mock deletion - in production, soft delete in database
    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment',
      error: error.message
    });
  }
});

// Get assessment types and templates
router.get('/types/templates', async (req, res) => {
  try {
    const templates = {
      technical: {
        name: 'Technical Assessment',
        description: 'Evaluate technical skills and knowledge',
        defaultTimeLimit: 120,
        categories: ['programming', 'system_design', 'algorithms', 'databases'],
        questionTypes: ['multiple_choice', 'coding', 'essay']
      },
      cognitive: {
        name: 'Cognitive Assessment',
        description: 'Assess logical reasoning and problem-solving abilities',
        defaultTimeLimit: 60,
        categories: ['logical_reasoning', 'numerical_reasoning', 'verbal_reasoning'],
        questionTypes: ['multiple_choice', 'multiple_select']
      },
      personality: {
        name: 'Personality Assessment',
        description: 'Evaluate personality traits and cultural fit',
        defaultTimeLimit: 30,
        categories: ['big_five', 'work_style', 'team_dynamics'],
        questionTypes: ['single_choice', 'likert_scale']
      },
      skills: {
        name: 'Skills Assessment',
        description: 'Test specific job-related skills',
        defaultTimeLimit: 90,
        categories: ['communication', 'leadership', 'project_management', 'domain_specific'],
        questionTypes: ['essay', 'multiple_choice', 'scenario']
      },
      video: {
        name: 'Video Assessment',
        description: 'Record video responses to behavioral questions',
        defaultTimeLimit: 45,
        categories: ['behavioral', 'situational', 'presentation'],
        questionTypes: ['video_response']
      }
    };

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Failed to get assessment templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment templates',
      error: error.message
    });
  }
});

module.exports = router;
