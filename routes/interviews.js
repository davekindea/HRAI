const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const interviewService = require('../services/interviewService');
const { body, validationResult } = require('express-validator');

// Schedule interview
router.post('/schedule', 
  auth,
  [
    body('candidateId').notEmpty().withMessage('Candidate ID is required'),
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('interviewerId').notEmpty().withMessage('Interviewer ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
    body('type').isIn(['video', 'phone', 'in-person']).withMessage('Valid interview type is required'),
    body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const interview = await interviewService.scheduleInterview(req.body);
      res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully',
        interview
      });
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview',
        error: error.message
      });
    }
  }
);

// Get available time slots
router.get('/available-slots/:date/:interviewerId', auth, async (req, res) => {
  try {
    const { date, interviewerId } = req.params;
    const slots = await interviewService.getAvailableTimeSlots(date, interviewerId);
    
    res.json({
      success: true,
      date,
      interviewerId,
      availableSlots: slots
    });
  } catch (error) {
    console.error('Failed to get available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available time slots',
      error: error.message
    });
  }
});

// Reschedule interview
router.put('/:interviewId/reschedule',
  auth,
  [
    body('newDateTime').isISO8601().withMessage('Valid date and time is required'),
    body('reason').notEmpty().withMessage('Reason for rescheduling is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { interviewId } = req.params;
      const { newDateTime, reason } = req.body;
      
      const interview = await interviewService.rescheduleInterview(interviewId, newDateTime, reason);
      
      res.json({
        success: true,
        message: 'Interview rescheduled successfully',
        interview
      });
    } catch (error) {
      console.error('Failed to reschedule interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reschedule interview',
        error: error.message
      });
    }
  }
);

// Cancel interview
router.put('/:interviewId/cancel',
  auth,
  [
    body('reason').notEmpty().withMessage('Reason for cancellation is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { interviewId } = req.params;
      const { reason } = req.body;
      
      const interview = await interviewService.cancelInterview(interviewId, reason);
      
      res.json({
        success: true,
        message: 'Interview cancelled successfully',
        interview
      });
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel interview',
        error: error.message
      });
    }
  }
);

// Get interview details
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await interviewService.getInterviewById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Failed to get interview details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview details',
      error: error.message
    });
  }
});

// List interviews with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      candidateId,
      interviewerId,
      jobId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    if (candidateId) filters.candidateId = candidateId;
    if (interviewerId) filters.interviewerId = interviewerId;
    if (jobId) filters.jobId = jobId;
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    // Mock implementation - in production, query database with filters
    const interviews = [
      {
        id: '1',
        candidateId: '1',
        jobId: '1',
        interviewerId: '1',
        scheduledAt: '2024-01-15 14:00',
        type: 'video',
        status: 'scheduled',
        candidateName: 'John Doe',
        jobTitle: 'Software Engineer',
        interviewerName: 'Jane Smith'
      }
    ];

    res.json({
      success: true,
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: interviews.length,
        pages: Math.ceil(interviews.length / limit)
      },
      filters
    });
  } catch (error) {
    console.error('Failed to list interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list interviews',
      error: error.message
    });
  }
});

// Download calendar file
router.get('/:interviewId/calendar', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await interviewService.getInterviewById(interviewId);
    
    if (!interview || !interview.calendarFile) {
      return res.status(404).json({
        success: false,
        message: 'Calendar file not found'
      });
    }

    res.download(interview.calendarFile, `interview_${interviewId}.ics`);
  } catch (error) {
    console.error('Failed to download calendar file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download calendar file',
      error: error.message
    });
  }
});

// Get interview analytics
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const { timeframe = 'last_30_days' } = req.query;
    
    // Mock analytics data
    const analytics = {
      totalInterviews: 120,
      completedInterviews: 95,
      cancelledInterviews: 15,
      rescheduledInterviews: 10,
      averageInterviewDuration: 45,
      interviewsByType: {
        video: 60,
        phone: 30,
        'in-person': 30
      },
      interviewsByStatus: {
        scheduled: 25,
        completed: 95,
        cancelled: 15,
        rescheduled: 10
      },
      monthlyTrend: [
        { month: 'Jan', interviews: 40 },
        { month: 'Feb', interviews: 35 },
        { month: 'Mar', interviews: 45 }
      ]
    };

    res.json({
      success: true,
      timeframe,
      analytics
    });
  } catch (error) {
    console.error('Failed to get interview analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview analytics',
      error: error.message
    });
  }
});

module.exports = router;
