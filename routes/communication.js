const express = require('express');
const router = express.Router();
const CommunicationService = require('../services/communicationService');

// Email Template Management Routes
router.get('/email-templates', async (req, res) => {
  try {
    const { category } = req.query;
    const result = await CommunicationService.getEmailTemplates(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/email-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Simulate getting specific template
    const template = {
      id: templateId,
      category: 'client_onboarding',
      name: 'Client Welcome Email',
      subject: 'Welcome to Elite Recruitment Solutions - {{clientName}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Elite Recruitment Solutions!</h2>
          <p>Dear {{contactName}},</p>
          
          <p>Thank you for choosing Elite Recruitment Solutions as your trusted recruitment partner. We're excited to begin working with {{clientName}} to find exceptional talent for your organization.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Account Details:</h3>
            <ul>
              <li><strong>Account Manager:</strong> {{accountManager}}</li>
              <li><strong>Client Portal:</strong> <a href="{{portalUrl}}">Access Here</a></li>
              <li><strong>Emergency Contact:</strong> {{emergencyContact}}</li>
            </ul>
          </div>
          
          <p>We look forward to a successful partnership!</p>
          
          <p>Best regards,<br>
          {{senderName}}<br>
          Elite Recruitment Solutions</p>
        </div>
      `,
      variables: ['clientName', 'contactName', 'accountManager', 'portalUrl', 'emergencyContact', 'senderName'],
      usage: 145,
      lastUsed: '2025-09-18T10:30:00Z'
    };

    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email-templates', async (req, res) => {
  try {
    const result = await CommunicationService.createCustomTemplate(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/email-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;
    
    // Simulate template update
    const result = {
      templateId,
      updates,
      updatedAt: new Date().toISOString(),
      version: '1.1'
    };

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/email-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Simulate template deletion
    res.json({ 
      success: true, 
      message: 'Template deleted successfully',
      templateId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Message Composition and Sending Routes
router.post('/messages/compose', async (req, res) => {
  try {
    const result = await CommunicationService.composeMessage(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/messages/:messageId/send', async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await CommunicationService.sendMessage(messageId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const { clientId, candidateId, status, type } = req.query;
    
    // Simulate message list
    const messages = [
      {
        id: 'msg_1',
        type: 'email',
        subject: 'Candidate Presentation for Senior Engineer Role',
        recipients: { to: ['client@techcorp.com'] },
        status: 'delivered',
        sentAt: '2025-09-20T10:30:00Z',
        templateId: 'template_candidate_presentation',
        clientId: 'client_1'
      },
      {
        id: 'msg_2',
        type: 'sms',
        subject: 'Interview reminder for tomorrow',
        recipients: { to: ['+1-555-0123'] },
        status: 'delivered',
        sentAt: '2025-09-19T16:00:00Z',
        candidateId: 'candidate_1'
      }
    ].filter(msg => {
      let matches = true;
      if (clientId) matches = matches && msg.clientId === clientId;
      if (candidateId) matches = matches && msg.candidateId === candidateId;
      if (status) matches = matches && msg.status === status;
      if (type) matches = matches && msg.type === type;
      return matches;
    });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Simulate detailed message
    const message = {
      id: messageId,
      type: 'email',
      recipients: {
        to: ['client@techcorp.com'],
        cc: ['manager@techcorp.com'],
        bcc: []
      },
      content: {
        subject: 'Candidate Presentation for Senior Engineer Role',
        htmlBody: '<p>Dear John,</p><p>I am pleased to present 3 qualified candidates...</p>',
        textBody: 'Dear John, I am pleased to present 3 qualified candidates...',
        attachments: [
          { name: 'candidate_profiles.pdf', size: 2048576 },
          { name: 'salary_benchmarks.xlsx', size: 512000 }
        ]
      },
      tracking: {
        delivered: true,
        deliveredAt: '2025-09-20T10:31:00Z',
        opened: true,
        openedAt: '2025-09-20T11:15:00Z',
        clicked: false,
        replied: false
      },
      status: 'delivered',
      createdAt: '2025-09-20T10:30:00Z',
      sentAt: '2025-09-20T10:30:00Z'
    };

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conversation Threading Routes
router.post('/conversations', async (req, res) => {
  try {
    const { participants, subject, context } = req.body;
    const result = await CommunicationService.createConversationThread(participants, subject, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const { clientId, candidateId, status } = req.query;
    
    // Simulate conversation list
    const conversations = [
      {
        id: 'conv_1',
        subject: 'Senior Engineer Position - John Doe',
        participants: ['recruiter@company.com', 'client@techcorp.com'],
        lastActivity: '2025-09-20T14:30:00Z',
        messageCount: 8,
        status: 'active',
        context: { type: 'candidate_discussion', candidateId: 'candidate_1' }
      },
      {
        id: 'conv_2',
        subject: 'Q4 Recruitment Planning',
        participants: ['manager@company.com', 'client@techcorp.com'],
        lastActivity: '2025-09-19T09:15:00Z',
        messageCount: 5,
        status: 'active',
        context: { type: 'client_communication', clientId: 'client_1' }
      }
    ].filter(conv => {
      let matches = true;
      if (clientId) matches = matches && conv.context.clientId === clientId;
      if (candidateId) matches = matches && conv.context.candidateId === candidateId;
      if (status) matches = matches && conv.status === status;
      return matches;
    });

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/conversations/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Simulate conversation thread
    const conversation = {
      id: threadId,
      subject: 'Senior Engineer Position - John Doe',
      participants: ['recruiter@company.com', 'client@techcorp.com'],
      context: { type: 'candidate_discussion', candidateId: 'candidate_1' },
      
      messages: [
        {
          id: 'msg_1',
          sender: 'recruiter@company.com',
          content: 'Hi Sarah, I wanted to update you on John Doe\'s application...',
          timestamp: '2025-09-20T09:00:00Z',
          messageType: 'initial'
        },
        {
          id: 'msg_2',
          sender: 'client@techcorp.com',
          content: 'Thanks for the update. His background looks promising...',
          timestamp: '2025-09-20T10:30:00Z',
          messageType: 'reply'
        },
        {
          id: 'msg_3',
          sender: 'recruiter@company.com',
          content: 'Great! I\'ve scheduled his technical interview for Friday...',
          timestamp: '2025-09-20T14:30:00Z',
          messageType: 'reply'
        }
      ],
      
      metadata: {
        createdAt: '2025-09-20T09:00:00Z',
        lastActivity: '2025-09-20T14:30:00Z',
        status: 'active'
      }
    };

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/conversations/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await CommunicationService.addMessageToThread(threadId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Communication Analytics Routes
router.get('/communication/metrics', async (req, res) => {
  try {
    const { clientId, timeframe } = req.query;
    const result = await CommunicationService.getCommunicationMetrics(clientId, timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/communication/analytics/templates', async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    // Simulate template analytics
    const analytics = {
      timeframe: timeframe || 'last_30_days',
      
      topPerformingTemplates: [
        {
          templateId: 'template_candidate_presentation',
          name: 'Candidate Presentation',
          usage: 145,
          openRate: 87.2,
          replyRate: 34.5,
          successRate: 28.9
        },
        {
          templateId: 'template_project_status',
          name: 'Project Status Update',
          usage: 89,
          openRate: 92.1,
          replyRate: 12.4,
          successRate: 8.7
        }
      ],
      
      templatePerformance: {
        avgOpenRate: 76.8,
        avgReplyRate: 23.6,
        avgSuccessRate: 18.9,
        totalTemplatesUsed: 12
      }
    };

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Automated Workflow Routes
router.post('/workflows', async (req, res) => {
  try {
    const result = await CommunicationService.createAutomatedWorkflow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/workflows', async (req, res) => {
  try {
    const { isActive, triggerType } = req.query;
    
    // Simulate workflow list
    const workflows = [
      {
        id: 'workflow_1',
        name: 'Client Onboarding Sequence',
        description: 'Automated email sequence for new clients',
        triggerType: 'client_onboarding',
        isActive: true,
        triggered: 25,
        completed: 23,
        successRate: 92
      },
      {
        id: 'workflow_2',
        name: 'Candidate Follow-up',
        description: 'Follow-up sequence for candidates after interviews',
        triggerType: 'interview_completion',
        isActive: true,
        triggered: 67,
        completed: 59,
        successRate: 88
      }
    ].filter(workflow => {
      let matches = true;
      if (isActive !== undefined) matches = matches && workflow.isActive === (isActive === 'true');
      if (triggerType) matches = matches && workflow.triggerType === triggerType;
      return matches;
    });

    res.json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    // Simulate detailed workflow
    const workflow = {
      id: workflowId,
      name: 'Client Onboarding Sequence',
      description: 'Automated email sequence for new clients',
      
      trigger: {
        type: 'client_onboarding',
        conditions: ['client_status = active', 'onboarding_completed = false']
      },
      
      steps: [
        {
          stepNumber: 1,
          type: 'send_email',
          delay: 0,
          template: 'template_client_welcome',
          recipients: ['primary_contact'],
          conditions: []
        },
        {
          stepNumber: 2,
          type: 'schedule_call',
          delay: 86400, // 1 day
          template: null,
          recipients: ['account_manager'],
          conditions: ['welcome_email_opened = true']
        },
        {
          stepNumber: 3,
          type: 'send_email',
          delay: 259200, // 3 days
          template: 'template_onboarding_checklist',
          recipients: ['primary_contact'],
          conditions: []
        }
      ],
      
      settings: {
        isActive: true,
        timezone: 'America/Los_Angeles',
        businessHoursOnly: true
      },
      
      analytics: {
        triggered: 25,
        completed: 23,
        successRate: 92,
        avgCompletionTime: '5.2 days'
      }
    };

    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;
    
    // Simulate workflow update
    const result = {
      workflowId,
      updates,
      updatedAt: new Date().toISOString(),
      requiresReactivation: updates.steps || updates.trigger
    };

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Message Scheduling
router.post('/messages/schedule', async (req, res) => {
  try {
    const { messageId, scheduledFor, timezone } = req.body;
    
    // Simulate message scheduling
    const schedule = {
      messageId,
      scheduledFor,
      timezone: timezone || 'UTC',
      status: 'scheduled',
      scheduledAt: new Date().toISOString()
    };

    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/messages/scheduled', async (req, res) => {
  try {
    const { date, status } = req.query;
    
    // Simulate scheduled messages
    const scheduledMessages = [
      {
        id: 'sched_1',
        messageId: 'msg_1',
        subject: 'Weekly project update',
        scheduledFor: '2025-09-21T09:00:00Z',
        status: 'scheduled',
        recipients: ['client@techcorp.com']
      },
      {
        id: 'sched_2',
        messageId: 'msg_2',
        subject: 'Interview reminder',
        scheduledFor: '2025-09-22T08:00:00Z',
        status: 'scheduled',
        recipients: ['candidate@email.com']
      }
    ];

    res.json({ success: true, scheduledMessages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;