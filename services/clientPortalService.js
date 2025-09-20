const ClientPortalService = {
  // Client Portal Management
  async getClientDashboard(clientId) {
    try {
      console.log(`Fetching dashboard for client ${clientId}`);
      
      const dashboard = {
        clientInfo: {
          id: clientId,
          name: 'TechCorp Solutions',
          contactPerson: 'Sarah Johnson',
          email: 'sarah.johnson@techcorp.com',
          accountManager: 'John Smith'
        },
        activeJobs: [
          {
            jobId: 'job_1',
            title: 'Senior Software Engineer',
            status: 'active',
            candidates: {
              total: 45,
              shortlisted: 8,
              interviewed: 3,
              offered: 1
            },
            timeline: {
              posted: '2025-09-10',
              deadline: '2025-10-10',
              daysRemaining: 20
            }
          },
          {
            jobId: 'job_2',
            title: 'Product Manager',
            status: 'reviewing',
            candidates: {
              total: 32,
              shortlisted: 12,
              interviewed: 5,
              offered: 0
            },
            timeline: {
              posted: '2025-09-15',
              deadline: '2025-10-15',
              daysRemaining: 25
            }
          }
        ],
        recentActivity: [
          {
            date: '2025-09-19',
            activity: 'New candidate applied for Senior Software Engineer',
            type: 'application'
          },
          {
            date: '2025-09-18',
            activity: 'Interview scheduled with candidate Jane Smith',
            type: 'interview'
          },
          {
            date: '2025-09-17',
            activity: 'Offer extended to candidate Michael Brown',
            type: 'offer'
          }
        ],
        metrics: {
          totalJobsPosted: 5,
          totalCandidates: 156,
          avgTimeToHire: 18,
          fillRate: 80
        }
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error fetching client dashboard:', error);
      return { success: false, error: error.message };
    }
  },

  async getJobStatusForClient(clientId, jobId) {
    try {
      const jobStatus = {
        jobId,
        title: 'Senior Software Engineer',
        description: 'Looking for an experienced software engineer...',
        status: 'active',
        postedDate: '2025-09-10',
        deadline: '2025-10-10',
        clientId,
        
        pipeline: {
          applied: 45,
          screening: 12,
          shortlisted: 8,
          interviewed: 3,
          offered: 1,
          hired: 0
        },
        
        recentCandidates: [
          {
            id: 'candidate_1',
            name: 'John Doe',
            stage: 'interviewed',
            appliedDate: '2025-09-18',
            status: 'pending_decision'
          },
          {
            id: 'candidate_2',
            name: 'Jane Smith',
            stage: 'shortlisted',
            appliedDate: '2025-09-17',
            status: 'interview_scheduled'
          }
        ],
        
        timeline: [
          {
            date: '2025-09-10',
            event: 'Job posted',
            description: 'Job successfully posted to multiple channels'
          },
          {
            date: '2025-09-12',
            event: 'First applications received',
            description: '5 candidates applied'
          },
          {
            date: '2025-09-15',
            event: 'Screening completed',
            description: '12 candidates passed initial screening'
          }
        ]
      };

      return { success: true, jobStatus };
    } catch (error) {
      console.error('Error fetching job status:', error);
      return { success: false, error: error.message };
    }
  },

  async submitClientFeedback(clientId, feedbackData) {
    try {
      const feedback = {
        id: Date.now().toString(),
        clientId,
        jobId: feedbackData.jobId,
        candidateId: feedbackData.candidateId,
        type: 'client_feedback',
        rating: feedbackData.rating,
        comments: feedbackData.comments,
        categories: feedbackData.categories || [],
        recommendation: feedbackData.recommendation,
        submittedAt: new Date().toISOString()
      };

      console.log(`Client feedback submitted: ${feedback.id}`);
      return { success: true, feedback };
    } catch (error) {
      console.error('Error submitting client feedback:', error);
      return { success: false, error: error.message };
    }
  },

  async getClientNotifications(clientId) {
    try {
      const notifications = [
        {
          id: 'notif_1',
          type: 'new_application',
          title: 'New Application Received',
          message: 'A new candidate has applied for Senior Software Engineer position',
          timestamp: '2025-09-19T10:30:00Z',
          read: false,
          jobId: 'job_1'
        },
        {
          id: 'notif_2',
          type: 'interview_reminder',
          title: 'Interview Scheduled',
          message: 'Interview with Jane Smith scheduled for tomorrow at 2:00 PM',
          timestamp: '2025-09-18T15:45:00Z',
          read: false,
          candidateId: 'candidate_2'
        },
        {
          id: 'notif_3',
          type: 'offer_update',
          title: 'Offer Status Update',
          message: 'Candidate Michael Brown has accepted the offer',
          timestamp: '2025-09-17T09:20:00Z',
          read: true,
          candidateId: 'candidate_3'
        }
      ];

      return { success: true, notifications };
    } catch (error) {
      console.error('Error fetching client notifications:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = ClientPortalService;