const express = require('express');
const router = express.Router();
const ClientPortalService = require('../services/clientPortalService');

// Client Dashboard Routes
router.get('/clients/:clientId/dashboard', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await ClientPortalService.getClientDashboard(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Job Status for Clients
router.get('/clients/:clientId/jobs/:jobId/status', async (req, res) => {
  try {
    const { clientId, jobId } = req.params;
    const result = await ClientPortalService.getJobStatusForClient(clientId, jobId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clients/:clientId/jobs', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, department } = req.query;
    
    // Simulate getting all jobs for a client with optional filters
    const jobs = [
      {
        jobId: 'job_1',
        title: 'Senior Software Engineer',
        department: 'Technology',
        status: 'active',
        postedDate: '2025-09-10',
        candidates: 45,
        filled: false
      },
      {
        jobId: 'job_2',
        title: 'Product Manager',
        department: 'Product',
        status: 'reviewing',
        postedDate: '2025-09-15',
        candidates: 32,
        filled: false
      },
      {
        jobId: 'job_3',
        title: 'Marketing Specialist',
        department: 'Marketing',
        status: 'closed',
        postedDate: '2025-08-25',
        candidates: 28,
        filled: true
      }
    ].filter(job => {
      let matches = true;
      if (status) matches = matches && job.status === status;
      if (department) matches = matches && job.department === department;
      return matches;
    });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client Feedback Routes
router.post('/clients/:clientId/feedback', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await ClientPortalService.submitClientFeedback(clientId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clients/:clientId/feedback', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { jobId, candidateId } = req.query;
    
    // Simulate getting feedback history for client
    const feedback = [
      {
        id: 'feedback_1',
        jobId: 'job_1',
        candidateId: 'candidate_1',
        rating: 4,
        comments: 'Strong technical skills, good communication',
        submittedAt: '2025-09-18T14:30:00Z'
      },
      {
        id: 'feedback_2',
        jobId: 'job_1',
        candidateId: 'candidate_2',
        rating: 3,
        comments: 'Good fit but lacks senior-level experience',
        submittedAt: '2025-09-17T10:15:00Z'
      }
    ].filter(f => {
      let matches = true;
      if (jobId) matches = matches && f.jobId === jobId;
      if (candidateId) matches = matches && f.candidateId === candidateId;
      return matches;
    });

    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client Notifications
router.get('/clients/:clientId/notifications', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await ClientPortalService.getClientNotifications(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/clients/:clientId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { clientId, notificationId } = req.params;
    
    // Simulate marking notification as read
    res.json({ 
      success: true, 
      message: 'Notification marked as read',
      notificationId,
      readAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client Profile Management
router.get('/clients/:clientId/profile', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const profile = {
      id: clientId,
      companyName: 'TechCorp Solutions',
      industry: 'Technology',
      size: '500-1000 employees',
      contactPerson: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        phone: '+1-555-0123',
        title: 'HR Director'
      },
      accountManager: {
        name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '+1-555-0456'
      },
      preferences: {
        communicationFrequency: 'weekly',
        preferredChannels: ['email', 'phone'],
        reportingLevel: 'detailed'
      },
      contractDetails: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        serviceLevel: 'Premium',
        billingType: 'per_placement'
      }
    };

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/clients/:clientId/profile', async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;
    
    // Simulate profile update
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      clientId,
      updatedFields: Object.keys(updates),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client Analytics & Reports
router.get('/clients/:clientId/analytics', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { period } = req.query;
    
    const analytics = {
      period: period || 'last_30_days',
      metrics: {
        jobsPosted: 5,
        candidatesPresented: 67,
        interviewsScheduled: 23,
        offersExtended: 8,
        placements: 3,
        avgTimeToHire: 21,
        clientSatisfactionScore: 4.2
      },
      trends: {
        applicationVolume: [
          { date: '2025-09-01', count: 8 },
          { date: '2025-09-08', count: 12 },
          { date: '2025-09-15', count: 15 }
        ],
        placementRate: [
          { month: 'July', rate: 60 },
          { month: 'August', rate: 45 },
          { month: 'September', rate: 37 }
        ]
      }
    };

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;