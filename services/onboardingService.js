const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const cron = require('node-cron');

class OnboardingService {
  constructor() {
    this.onboardingProcesses = new Map();
    this.documentTemplates = new Map();
    this.orientationSchedules = new Map();
    this.taskTemplates = new Map();
    this.workflows = new Map();
    this.automatedReminders = new Map();
    this.initializeDefaultTemplates();
    this.initializeDefaultWorkflows();
    this.startReminderService();
  }

  // Initialize default onboarding templates
  initializeDefaultTemplates() {
    const defaultDocumentTemplates = [
      {
        id: 'new-hire-checklist',
        name: 'New Hire Document Checklist',
        category: 'required_documents',
        documents: [
          { name: 'I-9 Employment Eligibility Verification', required: true, deadline_days: 3 },
          { name: 'W-4 Tax Form', required: true, deadline_days: 1 },
          { name: 'Direct Deposit Authorization', required: true, deadline_days: 5 },
          { name: 'Emergency Contact Information', required: true, deadline_days: 1 },
          { name: 'Employee Handbook Acknowledgment', required: true, deadline_days: 7 },
          { name: 'Confidentiality Agreement', required: true, deadline_days: 1 },
          { name: 'Benefits Enrollment Forms', required: false, deadline_days: 30 },
          { name: 'Parking Pass Application', required: false, deadline_days: 14 }
        ]
      },
      {
        id: 'it-setup-checklist',
        name: 'IT Setup and Access Checklist',
        category: 'it_setup',
        tasks: [
          { name: 'Create User Account', responsible: 'IT', deadline_days: 1 },
          { name: 'Provision Laptop/Desktop', responsible: 'IT', deadline_days: 2 },
          { name: 'Setup Email Account', responsible: 'IT', deadline_days: 1 },
          { name: 'Grant System Access', responsible: 'IT', deadline_days: 3 },
          { name: 'Install Required Software', responsible: 'IT', deadline_days: 2 },
          { name: 'Setup VPN Access', responsible: 'IT', deadline_days: 2 },
          { name: 'Security Badge Creation', responsible: 'Security', deadline_days: 3 }
        ]
      },
      {
        id: 'orientation-schedule',
        name: 'Standard Orientation Schedule',
        category: 'orientation',
        schedule: [
          { day: 1, sessions: [
            { time: '09:00', duration: 60, title: 'Welcome & Company Overview', presenter: 'HR' },
            { time: '10:30', duration: 90, title: 'Policies & Procedures', presenter: 'HR' },
            { time: '13:30', duration: 60, title: 'Benefits Overview', presenter: 'HR' },
            { time: '15:00', duration: 60, title: 'Meet the Team', presenter: 'Manager' }
          ]},
          { day: 2, sessions: [
            { time: '09:00', duration: 120, title: 'Department Overview', presenter: 'Manager' },
            { time: '11:30', duration: 90, title: 'Role-Specific Training', presenter: 'Team Lead' },
            { time: '14:00', duration: 60, title: 'Office Tour & Facilities', presenter: 'Buddy' }
          ]},
          { day: 3, sessions: [
            { time: '09:00', duration: 180, title: 'Hands-On Training', presenter: 'Team Lead' },
            { time: '14:00', duration: 60, title: 'Systems Training', presenter: 'IT' },
            { time: '15:30', duration: 30, title: 'First Week Check-in', presenter: 'Manager' }
          ]}
        ]
      }
    ];

    defaultDocumentTemplates.forEach(template => {
      this.documentTemplates.set(template.id, template);
    });
  }

  // Initialize default workflows
  initializeDefaultWorkflows() {
    const workflows = [
      {
        id: 'standard-employee-onboarding',
        name: 'Standard Employee Onboarding',
        type: 'full-time',
        phases: [
          {
            name: 'Pre-boarding',
            duration_days: 7,
            starts_before_start_date: true,
            tasks: [
              { name: 'Send welcome email', auto: true, deadline_days: -7 },
              { name: 'Prepare workspace', responsible: 'Facilities', deadline_days: -2 },
              { name: 'Setup IT equipment', responsible: 'IT', deadline_days: -1 },
              { name: 'Send first day instructions', auto: true, deadline_days: -1 }
            ]
          },
          {
            name: 'Day 1 - First Day',
            duration_days: 1,
            starts_before_start_date: false,
            tasks: [
              { name: 'Welcome reception', responsible: 'HR', deadline_days: 0 },
              { name: 'Complete I-9 verification', responsible: 'HR', deadline_days: 0 },
              { name: 'Photo for ID badge', responsible: 'Security', deadline_days: 0 },
              { name: 'Manager introduction', responsible: 'Manager', deadline_days: 0 },
              { name: 'Team introductions', responsible: 'Manager', deadline_days: 0 }
            ]
          },
          {
            name: 'Week 1 - Integration',
            duration_days: 5,
            starts_before_start_date: false,
            tasks: [
              { name: 'Complete orientation sessions', responsible: 'HR', deadline_days: 3 },
              { name: 'Role-specific training', responsible: 'Manager', deadline_days: 5 },
              { name: 'Buddy assignment', responsible: 'HR', deadline_days: 1 },
              { name: 'First week check-in', responsible: 'Manager', deadline_days: 5 }
            ]
          },
          {
            name: 'Month 1 - Foundation',
            duration_days: 30,
            starts_before_start_date: false,
            tasks: [
              { name: '30-day review', responsible: 'Manager', deadline_days: 30 },
              { name: 'Benefits enrollment completion', responsible: 'HR', deadline_days: 30 },
              { name: 'Performance goal setting', responsible: 'Manager', deadline_days: 30 },
              { name: 'Feedback collection', responsible: 'HR', deadline_days: 30 }
            ]
          },
          {
            name: 'Quarter 1 - Full Integration',
            duration_days: 90,
            starts_before_start_date: false,
            tasks: [
              { name: '90-day review', responsible: 'Manager', deadline_days: 90 },
              { name: 'Onboarding survey', responsible: 'HR', deadline_days: 90 },
              { name: 'Performance assessment', responsible: 'Manager', deadline_days: 90 }
            ]
          }
        ]
      }
    ];

    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  // Create onboarding process
  async createOnboardingProcess(onboardingData) {
    try {
      const processId = crypto.randomUUID();
      const workflow = this.workflows.get(onboardingData.workflow_id);
      
      if (!workflow) {
        throw new Error('Onboarding workflow not found');
      }

      const startDate = moment(onboardingData.start_date);
      const process = {
        id: processId,
        employee_id: onboardingData.employee_id,
        candidate_id: onboardingData.candidate_id,
        workflow_id: onboardingData.workflow_id,
        workflow_name: workflow.name,
        start_date: onboardingData.start_date,
        status: 'scheduled',
        current_phase: 'pre-boarding',
        progress: {
          total_tasks: 0,
          completed_tasks: 0,
          percentage: 0
        },
        phases: [],
        documents: {
          required: [],
          collected: [],
          pending: []
        },
        reminders: [],
        created_at: new Date().toISOString(),
        created_by: onboardingData.created_by,
        assigned_hr: onboardingData.assigned_hr,
        assigned_manager: onboardingData.assigned_manager,
        assigned_buddy: onboardingData.assigned_buddy,
        custom_data: onboardingData.custom_data || {}
      };

      // Generate phase timelines and tasks
      let totalTasks = 0;
      workflow.phases.forEach(phaseTemplate => {
        const phaseStartDate = phaseTemplate.starts_before_start_date 
          ? startDate.clone().subtract(Math.abs(phaseTemplate.duration_days), 'days')
          : startDate.clone();

        const phase = {
          id: crypto.randomUUID(),
          name: phaseTemplate.name,
          status: 'pending',
          start_date: phaseStartDate.toISOString(),
          end_date: phaseStartDate.clone().add(phaseTemplate.duration_days, 'days').toISOString(),
          tasks: []
        };

        phaseTemplate.tasks.forEach(taskTemplate => {
          const taskDueDate = startDate.clone().add(taskTemplate.deadline_days, 'days');
          const task = {
            id: crypto.randomUUID(),
            name: taskTemplate.name,
            responsible: taskTemplate.responsible || 'HR',
            status: 'pending',
            due_date: taskDueDate.toISOString(),
            auto: taskTemplate.auto || false,
            completed_at: null,
            completed_by: null,
            notes: ''
          };
          
          phase.tasks.push(task);
          totalTasks++;
        });

        process.phases.push(phase);
      });

      process.progress.total_tasks = totalTasks;

      // Setup document requirements
      const docTemplate = this.documentTemplates.get('new-hire-checklist');
      if (docTemplate) {
        docTemplate.documents.forEach(doc => {
          const docReq = {
            id: crypto.randomUUID(),
            name: doc.name,
            required: doc.required,
            status: 'pending',
            due_date: startDate.clone().add(doc.deadline_days, 'days').toISOString(),
            submitted_at: null,
            approved_at: null,
            file_path: null
          };
          process.documents.required.push(docReq);
          if (doc.required) {
            process.documents.pending.push(docReq.id);
          }
        });
      }

      this.onboardingProcesses.set(processId, process);

      // Schedule automated reminders
      await this.scheduleReminders(process);

      return {
        success: true,
        process_id: processId,
        process: process
      };
    } catch (error) {
      console.error('Error creating onboarding process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Document Collection Management
  async submitDocument(processId, documentData) {
    try {
      const process = this.onboardingProcesses.get(processId);
      if (!process) {
        throw new Error('Onboarding process not found');
      }

      const docReq = process.documents.required.find(d => d.id === documentData.document_id);
      if (!docReq) {
        throw new Error('Document requirement not found');
      }

      // Handle file upload
      let filePath = null;
      if (documentData.file) {
        const fileName = `${processId}_${docReq.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        filePath = await this.saveDocument(documentData.file, fileName);
      }

      // Update document status
      docReq.status = 'submitted';
      docReq.submitted_at = new Date().toISOString();
      docReq.submitted_by = documentData.submitted_by;
      docReq.file_path = filePath;
      docReq.notes = documentData.notes || '';

      // Move from pending to collected
      process.documents.pending = process.documents.pending.filter(id => id !== docReq.id);
      process.documents.collected.push(docReq.id);

      // Update process progress
      this.updateProcessProgress(process);

      return {
        success: true,
        document: docReq,
        process_progress: process.progress
      };
    } catch (error) {
      console.error('Error submitting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async approveDocument(processId, documentId, approvalData) {
    try {
      const process = this.onboardingProcesses.get(processId);
      if (!process) {
        throw new Error('Onboarding process not found');
      }

      const docReq = process.documents.required.find(d => d.id === documentId);
      if (!docReq) {
        throw new Error('Document not found');
      }

      if (approvalData.approved) {
        docReq.status = 'approved';
        docReq.approved_at = new Date().toISOString();
        docReq.approved_by = approvalData.approved_by;
      } else {
        docReq.status = 'rejected';
        docReq.rejected_at = new Date().toISOString();
        docReq.rejected_by = approvalData.approved_by;
        docReq.rejection_reason = approvalData.rejection_reason || '';
        
        // Move back to pending
        process.documents.collected = process.documents.collected.filter(id => id !== documentId);
        process.documents.pending.push(documentId);
      }

      docReq.review_notes = approvalData.notes || '';

      return {
        success: true,
        document: docReq,
        status: docReq.status
      };
    } catch (error) {
      console.error('Error approving document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Orientation Scheduling
  async scheduleOrientation(processId, orientationData) {
    try {
      const process = this.onboardingProcesses.get(processId);
      if (!process) {
        throw new Error('Onboarding process not found');
      }

      const orientationId = crypto.randomUUID();
      const orientationTemplate = this.documentTemplates.get('orientation-schedule');
      
      if (!orientationTemplate) {
        throw new Error('Orientation template not found');
      }

      const startDate = moment(orientationData.start_date || process.start_date);
      const orientation = {
        id: orientationId,
        process_id: processId,
        template_id: 'orientation-schedule',
        status: 'scheduled',
        start_date: startDate.toISOString(),
        sessions: [],
        attendees: orientationData.attendees || [],
        location: orientationData.location || 'TBD',
        virtual_meeting_link: orientationData.virtual_meeting_link,
        materials: orientationData.materials || [],
        created_at: new Date().toISOString()
      };

      // Generate sessions from template
      orientationTemplate.schedule.forEach(daySchedule => {
        const sessionDate = startDate.clone().add(daySchedule.day - 1, 'days');
        
        daySchedule.sessions.forEach(sessionTemplate => {
          const sessionTime = moment(sessionTemplate.time, 'HH:mm');
          const sessionDateTime = sessionDate.clone()
            .hour(sessionTime.hour())
            .minute(sessionTime.minute());

          const session = {
            id: crypto.randomUUID(),
            title: sessionTemplate.title,
            presenter: sessionTemplate.presenter,
            start_time: sessionDateTime.toISOString(),
            end_time: sessionDateTime.clone().add(sessionTemplate.duration, 'minutes').toISOString(),
            duration_minutes: sessionTemplate.duration,
            location: orientation.location,
            virtual_link: orientation.virtual_meeting_link,
            status: 'scheduled',
            attendance: {
              required: true,
              attended: false,
              attendance_time: null
            },
            materials: [],
            notes: ''
          };

          orientation.sessions.push(session);
        });
      });

      this.orientationSchedules.set(orientationId, orientation);

      // Update process with orientation reference
      if (!process.orientations) process.orientations = [];
      process.orientations.push(orientationId);

      return {
        success: true,
        orientation_id: orientationId,
        orientation: orientation
      };
    } catch (error) {
      console.error('Error scheduling orientation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async recordAttendance(orientationId, sessionId, attendanceData) {
    try {
      const orientation = this.orientationSchedules.get(orientationId);
      if (!orientation) {
        throw new Error('Orientation not found');
      }

      const session = orientation.sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.attendance.attended = attendanceData.attended;
      session.attendance.attendance_time = new Date().toISOString();
      session.attendance.notes = attendanceData.notes || '';

      // Update overall orientation progress
      const totalSessions = orientation.sessions.length;
      const attendedSessions = orientation.sessions.filter(s => s.attendance.attended).length;
      orientation.completion_rate = ((attendedSessions / totalSessions) * 100).toFixed(2);

      return {
        success: true,
        session: session,
        orientation_progress: {
          attended_sessions: attendedSessions,
          total_sessions: totalSessions,
          completion_rate: orientation.completion_rate
        }
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Welcome Communications & Training Schedule
  async sendWelcomeCommunication(processId, communicationType) {
    try {
      const process = this.onboardingProcesses.get(processId);
      if (!process) {
        throw new Error('Onboarding process not found');
      }

      const communications = {
        welcome_email: {
          template: 'welcome-email',
          subject: 'Welcome to the Team!',
          timing: 'pre-boarding'
        },
        first_day_instructions: {
          template: 'first-day-instructions',
          subject: 'Your First Day - Important Information',
          timing: 'day-before'
        },
        week_one_checkin: {
          template: 'week-one-checkin',
          subject: 'How\'s Your First Week Going?',
          timing: 'week-one'
        },
        thirty_day_survey: {
          template: 'thirty-day-survey',
          subject: 'Your First Month - We Want Your Feedback',
          timing: 'thirty-days'
        }
      };

      const comm = communications[communicationType];
      if (!comm) {
        throw new Error('Communication type not found');
      }

      const communication = {
        id: crypto.randomUUID(),
        process_id: processId,
        type: communicationType,
        template: comm.template,
        subject: comm.subject,
        sent_at: new Date().toISOString(),
        status: 'sent',
        recipient: process.employee_id,
        content: this.generateCommunicationContent(comm.template, process)
      };

      // Store communication record
      if (!process.communications) process.communications = [];
      process.communications.push(communication);

      return {
        success: true,
        communication: communication
      };
    } catch (error) {
      console.error('Error sending welcome communication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateCommunicationContent(template, process) {
    const templates = {
      'welcome-email': `
        Welcome to our team! We're excited to have you join us.
        
        Your start date: ${moment(process.start_date).format('MMMM DD, YYYY')}
        Your manager: ${process.assigned_manager}
        HR contact: ${process.assigned_hr}
        
        Before your first day, please:
        - Review the employee handbook
        - Complete any remaining documents
        - Prepare for your orientation
        
        Looking forward to working with you!
      `,
      'first-day-instructions': `
        Your first day is tomorrow! Here's what you need to know:
        
        Arrival time: 9:00 AM
        Location: Main lobby
        What to bring: Photo ID and completed documents
        
        Your day will include:
        - Welcome session with HR
        - Meet your manager and team
        - Orientation activities
        - Lunch with your buddy
        
        See you soon!
      `,
      'week-one-checkin': `
        How has your first week been? We hope you're settling in well.
        
        Please take a moment to:
        - Complete any remaining training modules
        - Schedule your first 1-on-1 with your manager
        - Reach out if you have any questions
        
        Your feedback is important to us!
      `,
      'thirty-day-survey': `
        It's been a month since you joined us! We'd love to hear about your experience.
        
        Please take 5 minutes to complete our onboarding survey:
        [Survey Link]
        
        Your feedback helps us improve our process for future new hires.
        
        Thank you for being part of our team!
      `
    };

    return templates[template] || 'Template content not found';
  }

  // Task Management
  async updateTaskStatus(processId, taskId, statusData) {
    try {
      const process = this.onboardingProcesses.get(processId);
      if (!process) {
        throw new Error('Onboarding process not found');
      }

      let task = null;
      let phase = null;

      // Find task in phases
      for (const p of process.phases) {
        const foundTask = p.tasks.find(t => t.id === taskId);
        if (foundTask) {
          task = foundTask;
          phase = p;
          break;
        }
      }

      if (!task) {
        throw new Error('Task not found');
      }

      const previousStatus = task.status;
      task.status = statusData.status;
      task.notes = statusData.notes || task.notes;
      
      if (statusData.status === 'completed') {
        task.completed_at = new Date().toISOString();
        task.completed_by = statusData.completed_by;
      }

      // Update phase progress
      const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = phase.tasks.length;
      phase.completion_rate = ((completedTasks / totalTasks) * 100).toFixed(2);

      if (completedTasks === totalTasks && phase.status !== 'completed') {
        phase.status = 'completed';
        phase.completed_at = new Date().toISOString();
      }

      // Update overall process progress
      this.updateProcessProgress(process);

      return {
        success: true,
        task: task,
        phase_progress: {
          phase_name: phase.name,
          completed_tasks: completedTasks,
          total_tasks: totalTasks,
          completion_rate: phase.completion_rate
        },
        process_progress: process.progress
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Progress Tracking
  updateProcessProgress(process) {
    let totalTasks = 0;
    let completedTasks = 0;

    process.phases.forEach(phase => {
      totalTasks += phase.tasks.length;
      completedTasks += phase.tasks.filter(t => t.status === 'completed').length;
    });

    // Add document completion to progress
    const requiredDocs = process.documents.required.filter(d => d.required);
    const approvedDocs = requiredDocs.filter(d => d.status === 'approved');
    
    totalTasks += requiredDocs.length;
    completedTasks += approvedDocs.length;

    process.progress = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      percentage: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
    };

    // Update overall status
    if (process.progress.percentage >= 100) {
      process.status = 'completed';
      process.completed_at = new Date().toISOString();
    } else if (process.progress.percentage > 0) {
      process.status = 'in_progress';
    }
  }

  // Automated Reminders
  async scheduleReminders(process) {
    try {
      const reminders = [];

      // Schedule task reminders
      process.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          if (task.auto) return; // Skip automated tasks

          const reminderDate = moment(task.due_date).subtract(1, 'day');
          if (reminderDate.isAfter(moment())) {
            const reminder = {
              id: crypto.randomUUID(),
              process_id: process.id,
              task_id: task.id,
              type: 'task_reminder',
              scheduled_for: reminderDate.toISOString(),
              recipient: task.responsible,
              message: `Reminder: Task "${task.name}" is due tomorrow`,
              status: 'scheduled'
            };
            reminders.push(reminder);
          }
        });
      });

      // Schedule document reminders
      process.documents.required.forEach(doc => {
        if (!doc.required) return;

        const reminderDate = moment(doc.due_date).subtract(2, 'days');
        if (reminderDate.isAfter(moment())) {
          const reminder = {
            id: crypto.randomUUID(),
            process_id: process.id,
            document_id: doc.id,
            type: 'document_reminder',
            scheduled_for: reminderDate.toISOString(),
            recipient: process.employee_id,
            message: `Reminder: Document "${doc.name}" is due in 2 days`,
            status: 'scheduled'
          };
          reminders.push(reminder);
        }
      });

      process.reminders = reminders;
      return reminders;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      return [];
    }
  }

  startReminderService() {
    // Check for due reminders every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.processScheduledReminders();
      } catch (error) {
        console.error('Error processing scheduled reminders:', error);
      }
    });
  }

  async processScheduledReminders() {
    const now = moment();
    
    for (const [processId, process] of this.onboardingProcesses) {
      if (!process.reminders) continue;

      for (const reminder of process.reminders) {
        if (reminder.status === 'scheduled' && moment(reminder.scheduled_for).isBefore(now)) {
          await this.sendReminder(reminder);
          reminder.status = 'sent';
          reminder.sent_at = new Date().toISOString();
        }
      }
    }
  }

  async sendReminder(reminder) {
    // Implementation would integrate with email/notification service
    console.log(`Sending reminder: ${reminder.message} to ${reminder.recipient}`);
  }

  // Utility methods
  async saveDocument(fileData, fileName) {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/onboarding');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, fileData);
      
      return `/uploads/onboarding/${fileName}`;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async getOnboardingProcess(processId) {
    const process = this.onboardingProcesses.get(processId);
    
    if (!process) {
      return {
        success: false,
        error: 'Onboarding process not found'
      };
    }

    return {
      success: true,
      process: process
    };
  }

  async getAllOnboardingProcesses(filters = {}) {
    const processes = Array.from(this.onboardingProcesses.values());
    
    let filteredProcesses = processes;
    if (filters.status) {
      filteredProcesses = filteredProcesses.filter(p => p.status === filters.status);
    }
    
    if (filters.assigned_hr) {
      filteredProcesses = filteredProcesses.filter(p => p.assigned_hr === filters.assigned_hr);
    }

    return {
      success: true,
      processes: filteredProcesses,
      count: filteredProcesses.length
    };
  }

  async getOnboardingAnalytics(filters = {}) {
    try {
      const processes = Array.from(this.onboardingProcesses.values());
      
      const totalProcesses = processes.length;
      const completedProcesses = processes.filter(p => p.status === 'completed').length;
      const inProgressProcesses = processes.filter(p => p.status === 'in_progress').length;
      const scheduledProcesses = processes.filter(p => p.status === 'scheduled').length;

      const avgCompletionRate = processes.length > 0 ? 
        (processes.reduce((sum, p) => sum + parseFloat(p.progress.percentage), 0) / processes.length).toFixed(2) : 0;

      // Calculate average time to completion
      const completedWithTime = processes.filter(p => p.status === 'completed' && p.completed_at);
      const avgDaysToComplete = completedWithTime.length > 0 ? 
        (completedWithTime.reduce((sum, p) => {
          const days = moment(p.completed_at).diff(moment(p.start_date), 'days');
          return sum + days;
        }, 0) / completedWithTime.length).toFixed(1) : 0;

      return {
        success: true,
        analytics: {
          summary: {
            total_processes: totalProcesses,
            completed_processes: completedProcesses,
            in_progress_processes: inProgressProcesses,
            scheduled_processes: scheduledProcesses,
            avg_completion_rate: `${avgCompletionRate}%`,
            avg_days_to_complete: avgDaysToComplete
          },
          document_stats: this.calculateDocumentStats(processes),
          orientation_stats: this.calculateOrientationStats(),
          workflow_usage: this.calculateWorkflowUsage(processes),
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating onboarding analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateDocumentStats(processes) {
    let totalRequired = 0;
    let totalSubmitted = 0;
    let totalApproved = 0;

    processes.forEach(process => {
      const required = process.documents.required.filter(d => d.required);
      const submitted = required.filter(d => ['submitted', 'approved'].includes(d.status));
      const approved = required.filter(d => d.status === 'approved');

      totalRequired += required.length;
      totalSubmitted += submitted.length;
      totalApproved += approved.length;
    });

    return {
      total_required: totalRequired,
      total_submitted: totalSubmitted,
      total_approved: totalApproved,
      submission_rate: totalRequired > 0 ? ((totalSubmitted / totalRequired) * 100).toFixed(2) : 0,
      approval_rate: totalSubmitted > 0 ? ((totalApproved / totalSubmitted) * 100).toFixed(2) : 0
    };
  }

  calculateOrientationStats() {
    const orientations = Array.from(this.orientationSchedules.values());
    
    if (orientations.length === 0) {
      return {
        total_orientations: 0,
        avg_completion_rate: 0,
        total_sessions: 0
      };
    }

    const totalSessions = orientations.reduce((sum, o) => sum + o.sessions.length, 0);
    const avgCompletionRate = orientations.length > 0 ? 
      (orientations.reduce((sum, o) => sum + parseFloat(o.completion_rate || 0), 0) / orientations.length).toFixed(2) : 0;

    return {
      total_orientations: orientations.length,
      avg_completion_rate: `${avgCompletionRate}%`,
      total_sessions: totalSessions
    };
  }

  calculateWorkflowUsage(processes) {
    const usage = {};
    processes.forEach(process => {
      const workflowName = process.workflow_name || 'Unknown';
      usage[workflowName] = (usage[workflowName] || 0) + 1;
    });
    return usage;
  }
}

module.exports = new OnboardingService();
