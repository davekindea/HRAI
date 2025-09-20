const express = require('express');
const router = express.Router();
const onboardingService = require('../services/onboardingService');
const multer = require('multer');

// Configure multer for document uploads
const upload = multer({
  dest: 'tmp/uploads/onboarding',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for onboarding documents
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// ============================================================================
// ONBOARDING PROCESS MANAGEMENT
// ============================================================================

// Create new onboarding process
router.post('/process', async (req, res) => {
  try {
    const onboardingData = {
      employee_id: req.body.employee_id,
      candidate_id: req.body.candidate_id,
      workflow_id: req.body.workflow_id || 'standard-employee-onboarding',
      start_date: req.body.start_date,
      created_by: req.body.created_by,
      assigned_hr: req.body.assigned_hr,
      assigned_manager: req.body.assigned_manager,
      assigned_buddy: req.body.assigned_buddy,
      custom_data: req.body.custom_data
    };

    // Validate required fields
    if (!onboardingData.employee_id || !onboardingData.start_date) {
      return res.status(400).json({
        error: 'Missing required fields: employee_id, start_date'
      });
    }

    const result = await onboardingService.createOnboardingProcess(onboardingData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating onboarding process:', error);
    res.status(500).json({ error: 'Failed to create onboarding process' });
  }
});

// Get all onboarding processes
router.get('/process', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      assigned_hr: req.query.assigned_hr,
      assigned_manager: req.query.assigned_manager,
      start_date_from: req.query.start_date_from,
      start_date_to: req.query.start_date_to
    };

    const result = await onboardingService.getAllOnboardingProcesses(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching onboarding processes:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding processes' });
  }
});

// Get specific onboarding process
router.get('/process/:processId', async (req, res) => {
  try {
    const result = await onboardingService.getOnboardingProcess(req.params.processId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching onboarding process:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding process' });
  }
});

// ============================================================================
// DOCUMENT COLLECTION
// ============================================================================

// Submit document
router.post('/process/:processId/document', upload.single('document'), async (req, res) => {
  try {
    const documentData = {
      document_id: req.body.document_id,
      submitted_by: req.body.submitted_by,
      notes: req.body.notes,
      file: req.file
    };

    // Validate required fields
    if (!documentData.document_id) {
      return res.status(400).json({
        error: 'Missing required field: document_id'
      });
    }

    const result = await onboardingService.submitDocument(req.params.processId, documentData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error submitting document:', error);
    res.status(500).json({ error: 'Failed to submit document' });
  }
});

// Approve/reject document
router.put('/process/:processId/document/:documentId/review', async (req, res) => {
  try {
    const approvalData = {
      approved: req.body.approved,
      approved_by: req.body.approved_by,
      notes: req.body.notes,
      rejection_reason: req.body.rejection_reason
    };

    // Validate required fields
    if (typeof approvalData.approved !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required field: approved (boolean)'
      });
    }

    const result = await onboardingService.approveDocument(
      req.params.processId, 
      req.params.documentId, 
      approvalData
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error reviewing document:', error);
    res.status(500).json({ error: 'Failed to review document' });
  }
});

// Get document requirements for a process
router.get('/process/:processId/documents', async (req, res) => {
  try {
    const process = await onboardingService.getOnboardingProcess(req.params.processId);
    
    if (process.success) {
      res.json({
        success: true,
        required_documents: process.process.documents.required,
        pending_documents: process.process.documents.pending,
        collected_documents: process.process.documents.collected
      });
    } else {
      res.status(404).json(process);
    }
  } catch (error) {
    console.error('Error fetching document requirements:', error);
    res.status(500).json({ error: 'Failed to fetch document requirements' });
  }
});

// ============================================================================
// ORIENTATION SCHEDULING
// ============================================================================

// Schedule orientation
router.post('/process/:processId/orientation', async (req, res) => {
  try {
    const orientationData = {
      start_date: req.body.start_date,
      attendees: req.body.attendees,
      location: req.body.location,
      virtual_meeting_link: req.body.virtual_meeting_link,
      materials: req.body.materials
    };

    const result = await onboardingService.scheduleOrientation(req.params.processId, orientationData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error scheduling orientation:', error);
    res.status(500).json({ error: 'Failed to schedule orientation' });
  }
});

// Record attendance for orientation session
router.put('/orientation/:orientationId/session/:sessionId/attendance', async (req, res) => {
  try {
    const attendanceData = {
      attended: req.body.attended,
      notes: req.body.notes
    };

    // Validate required fields
    if (typeof attendanceData.attended !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required field: attended (boolean)'
      });
    }

    const result = await onboardingService.recordAttendance(
      req.params.orientationId,
      req.params.sessionId,
      attendanceData
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Get orientation schedule
router.get('/orientation/:orientationId', async (req, res) => {
  try {
    // This would get orientation details from the service
    res.json({
      success: true,
      message: 'Orientation details endpoint - implementation depends on service method'
    });
  } catch (error) {
    console.error('Error fetching orientation:', error);
    res.status(500).json({ error: 'Failed to fetch orientation' });
  }
});

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

// Update task status
router.put('/process/:processId/task/:taskId', async (req, res) => {
  try {
    const statusData = {
      status: req.body.status,
      completed_by: req.body.completed_by,
      notes: req.body.notes
    };

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(statusData.status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await onboardingService.updateTaskStatus(
      req.params.processId,
      req.params.taskId,
      statusData
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Get tasks for a process
router.get('/process/:processId/tasks', async (req, res) => {
  try {
    const process = await onboardingService.getOnboardingProcess(req.params.processId);
    
    if (process.success) {
      const allTasks = [];
      process.process.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          allTasks.push({
            ...task,
            phase_name: phase.name,
            phase_id: phase.id
          });
        });
      });

      // Filter by status if requested
      let filteredTasks = allTasks;
      if (req.query.status) {
        filteredTasks = allTasks.filter(task => task.status === req.query.status);
      }

      res.json({
        success: true,
        tasks: filteredTasks,
        count: filteredTasks.length
      });
    } else {
      res.status(404).json(process);
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ============================================================================
// COMMUNICATIONS
// ============================================================================

// Send welcome communication
router.post('/process/:processId/communication', async (req, res) => {
  try {
    const communicationType = req.body.type;
    
    const validTypes = ['welcome_email', 'first_day_instructions', 'week_one_checkin', 'thirty_day_survey'];
    if (!validTypes.includes(communicationType)) {
      return res.status(400).json({
        error: `Invalid communication type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = await onboardingService.sendWelcomeCommunication(
      req.params.processId,
      communicationType
    );
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({ error: 'Failed to send communication' });
  }
});

// Get communication history for a process
router.get('/process/:processId/communications', async (req, res) => {
  try {
    const process = await onboardingService.getOnboardingProcess(req.params.processId);
    
    if (process.success) {
      res.json({
        success: true,
        communications: process.process.communications || [],
        count: (process.process.communications || []).length
      });
    } else {
      res.status(404).json(process);
    }
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

// Get onboarding analytics
router.get('/analytics', async (req, res) => {
  try {
    const filters = {
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      } : undefined,
      assigned_hr: req.query.assigned_hr,
      workflow_id: req.query.workflow_id
    };

    const result = await onboardingService.getOnboardingAnalytics(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error generating onboarding analytics:', error);
    res.status(500).json({ error: 'Failed to generate onboarding analytics' });
  }
});

// Get process completion metrics
router.get('/analytics/completion', async (req, res) => {
  try {
    const analytics = await onboardingService.getOnboardingAnalytics();
    
    if (analytics.success) {
      const completionMetrics = {
        total_processes: analytics.analytics.summary.total_processes,
        completed_processes: analytics.analytics.summary.completed_processes,
        completion_rate: analytics.analytics.summary.total_processes > 0 ? 
          ((analytics.analytics.summary.completed_processes / analytics.analytics.summary.total_processes) * 100).toFixed(2) : 0,
        avg_completion_time: analytics.analytics.summary.avg_days_to_complete,
        in_progress: analytics.analytics.summary.in_progress_processes,
        scheduled: analytics.analytics.summary.scheduled_processes
      };

      res.json({
        success: true,
        completion_metrics: completionMetrics,
        generated_at: analytics.analytics.generated_at
      });
    } else {
      res.status(400).json(analytics);
    }
  } catch (error) {
    console.error('Error generating completion metrics:', error);
    res.status(500).json({ error: 'Failed to generate completion metrics' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk update task status
router.put('/bulk/tasks/status', async (req, res) => {
  try {
    const { task_updates, updated_by } = req.body;

    if (!task_updates || !Array.isArray(task_updates)) {
      return res.status(400).json({ error: 'task_updates array is required' });
    }

    const results = [];
    const errors = [];

    for (const update of task_updates) {
      try {
        const result = await onboardingService.updateTaskStatus(
          update.process_id,
          update.task_id,
          {
            status: update.status,
            completed_by: updated_by,
            notes: update.notes
          }
        );
        
        if (result.success) {
          results.push({ 
            process_id: update.process_id, 
            task_id: update.task_id, 
            success: true 
          });
        } else {
          errors.push({ 
            process_id: update.process_id, 
            task_id: update.task_id, 
            error: result.error 
          });
        }
      } catch (error) {
        errors.push({ 
          process_id: update.process_id, 
          task_id: update.task_id, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results: results,
      errors_detail: errors
    });
  } catch (error) {
    console.error('Error performing bulk task update:', error);
    res.status(500).json({ error: 'Failed to perform bulk task update' });
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

// Get HR dashboard data
router.get('/dashboard/hr', async (req, res) => {
  try {
    const hrUserId = req.query.hr_user_id;
    const filters = hrUserId ? { assigned_hr: hrUserId } : {};

    const processes = await onboardingService.getAllOnboardingProcesses(filters);
    const analytics = await onboardingService.getOnboardingAnalytics(filters);

    if (processes.success && analytics.success) {
      const dashboardData = {
        summary: {
          total_processes: processes.count,
          active_processes: processes.processes.filter(p => p.status === 'in_progress').length,
          completed_today: processes.processes.filter(p => 
            p.status === 'completed' && 
            new Date(p.completed_at).toDateString() === new Date().toDateString()
          ).length,
          pending_documents: processes.processes.reduce((sum, p) => 
            sum + p.documents.pending.length, 0
          )
        },
        recent_processes: processes.processes
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5),
        metrics: analytics.analytics.summary
      };

      res.json({
        success: true,
        dashboard: dashboardData,
        generated_at: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Failed to fetch dashboard data' });
    }
  } catch (error) {
    console.error('Error generating HR dashboard:', error);
    res.status(500).json({ error: 'Failed to generate HR dashboard' });
  }
});

// Get manager dashboard data
router.get('/dashboard/manager', async (req, res) => {
  try {
    const managerId = req.query.manager_id;
    const filters = managerId ? { assigned_manager: managerId } : {};

    const processes = await onboardingService.getAllOnboardingProcesses(filters);

    if (processes.success) {
      const dashboardData = {
        summary: {
          team_onboarding: processes.count,
          pending_tasks: processes.processes.reduce((sum, p) => {
            const managerTasks = [];
            p.phases.forEach(phase => {
              phase.tasks.forEach(task => {
                if (task.responsible === 'Manager' && task.status === 'pending') {
                  managerTasks.push(task);
                }
              });
            });
            return sum + managerTasks.length;
          }, 0),
          upcoming_start_dates: processes.processes.filter(p => 
            new Date(p.start_date) > new Date() &&
            new Date(p.start_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ).length
        },
        upcoming_onboardings: processes.processes
          .filter(p => new Date(p.start_date) > new Date())
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
          .slice(0, 5),
        pending_tasks: []
      };

      // Collect pending manager tasks
      processes.processes.forEach(process => {
        process.phases.forEach(phase => {
          phase.tasks.forEach(task => {
            if (task.responsible === 'Manager' && task.status === 'pending') {
              dashboardData.pending_tasks.push({
                ...task,
                process_id: process.id,
                employee_id: process.employee_id,
                phase_name: phase.name
              });
            }
          });
        });
      });

      res.json({
        success: true,
        dashboard: dashboardData,
        generated_at: new Date().toISOString()
      });
    } else {
      res.status(400).json(processes);
    }
  } catch (error) {
    console.error('Error generating manager dashboard:', error);
    res.status(500).json({ error: 'Failed to generate manager dashboard' });
  }
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate process ID parameter
router.param('processId', async (req, res, next, processId) => {
  if (!processId || typeof processId !== 'string') {
    return res.status(400).json({ error: 'Invalid process ID' });
  }
  next();
});

// Middleware to validate task ID parameter
router.param('taskId', async (req, res, next, taskId) => {
  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }
  next();
});

// Middleware to validate document ID parameter
router.param('documentId', async (req, res, next, documentId) => {
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }
  next();
});

module.exports = router;
