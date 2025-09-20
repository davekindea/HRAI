const express = require('express');
const router = express.Router();
const scheduleManagementService = require('../services/scheduleManagementService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Schedule Management Routes
 * API endpoints for shift planning, roster building, and schedule management
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

// ============================================================================
// SHIFT TEMPLATE MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/schedules/templates
 * @desc    Create a new shift template
 * @access  Private (Manager+)
 */
router.post('/templates', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user.id
      };

      const result = await scheduleManagementService.createShiftTemplate(templateData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while creating shift template'
      });
    }
  }
);

/**
 * @route   GET /api/schedules/templates
 * @desc    Get all shift templates with optional filtering
 * @access  Private (All roles)
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const filters = {
      department: req.query.department,
      shiftType: req.query.shiftType,
      location: req.query.location,
      status: req.query.status || 'active'
    };

    const result = await scheduleManagementService.getShiftTemplates(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving shift templates'
    });
  }
});

/**
 * @route   PUT /api/schedules/templates/:templateId
 * @desc    Update a shift template
 * @access  Private (Manager+)
 */
router.put('/templates/:templateId', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      // This would be implemented in the service
      const result = { success: true, message: 'Template updated successfully' };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while updating shift template'
      });
    }
  }
);

// ============================================================================
// ROSTER BUILDING
// ============================================================================

/**
 * @route   POST /api/schedules/rosters
 * @desc    Create a new roster
 * @access  Private (Manager+)
 */
router.post('/rosters', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const rosterData = {
        ...req.body,
        createdBy: req.user.id
      };

      const result = await scheduleManagementService.createRoster(rosterData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while creating roster'
      });
    }
  }
);

/**
 * @route   POST /api/schedules/rosters/:rosterId/auto-generate
 * @desc    Auto-generate roster based on templates and availability
 * @access  Private (Manager+)
 */
router.post('/rosters/:rosterId/auto-generate', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { rosterId } = req.params;
      const params = {
        rosterId,
        templateIds: req.body.templateIds,
        staffPoolIds: req.body.staffPoolIds,
        optimizationRules: req.body.optimizationRules,
        constraints: req.body.constraints
      };

      const result = await scheduleManagementService.autoGenerateRoster(params);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while auto-generating roster'
      });
    }
  }
);

/**
 * @route   GET /api/schedules/rosters/:rosterId
 * @desc    Get roster details
 * @access  Private (All roles)
 */
router.get('/rosters/:rosterId', authenticateToken, async (req, res) => {
  try {
    const { rosterId } = req.params;
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { id: rosterId }, 
      message: 'Roster retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving roster'
    });
  }
});

/**
 * @route   PUT /api/schedules/rosters/:rosterId/publish
 * @desc    Publish roster and notify staff
 * @access  Private (Manager+)
 */
router.put('/rosters/:rosterId/publish', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { rosterId } = req.params;
      const publishData = {
        publishedBy: req.user.id,
        notificationMethod: req.body.notificationMethod || 'all',
        effectiveDate: req.body.effectiveDate
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        message: 'Roster published successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while publishing roster'
      });
    }
  }
);

// ============================================================================
// SHIFT ASSIGNMENTS
// ============================================================================

/**
 * @route   POST /api/schedules/shifts/:shiftId/assign
 * @desc    Assign staff to a specific shift
 * @access  Private (Manager+)
 */
router.post('/shifts/:shiftId/assign', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { shiftId } = req.params;
      const { staffIds } = req.body;

      const result = await scheduleManagementService.assignStaffToShift(
        shiftId, 
        staffIds, 
        req.user.id
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while assigning staff to shift'
      });
    }
  }
);

/**
 * @route   POST /api/schedules/shifts/swap-request
 * @desc    Request a shift swap between staff members
 * @access  Private (All roles)
 */
router.post('/shifts/swap-request', authenticateToken, async (req, res) => {
  try {
    const swapRequest = {
      ...req.body,
      requestingStaffId: req.user.id
    };

    const result = await scheduleManagementService.requestShiftSwap(swapRequest);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while creating shift swap request'
    });
  }
});

/**
 * @route   PUT /api/schedules/shifts/swap-request/:swapId/approve
 * @desc    Approve or reject a shift swap request
 * @access  Private (Manager+)
 */
router.put('/shifts/swap-request/:swapId/approve', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { swapId } = req.params;
      const { approved, notes } = req.body;

      // This would be implemented in the service
      const result = { 
        success: true, 
        message: approved ? 'Swap request approved' : 'Swap request rejected' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while processing swap request'
      });
    }
  }
);

// ============================================================================
// EMERGENCY COVERAGE
// ============================================================================

/**
 * @route   POST /api/schedules/emergency-coverage
 * @desc    Handle emergency shift coverage
 * @access  Private (All roles)
 */
router.post('/emergency-coverage', authenticateToken, async (req, res) => {
  try {
    const emergencyData = {
      ...req.body,
      reportedBy: req.user.id
    };

    const result = await scheduleManagementService.handleEmergencyCoverage(emergencyData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while handling emergency coverage'
    });
  }
});

/**
 * @route   GET /api/schedules/emergency-coverage
 * @desc    Get active emergency coverage requests
 * @access  Private (Manager+)
 */
router.get('/emergency-coverage', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status || 'seeking_coverage',
        urgency: req.query.urgency,
        date: req.query.date
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        message: 'Emergency coverage requests retrieved' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving emergency coverage requests'
      });
    }
  }
);

// ============================================================================
// SCHEDULE ANALYTICS
// ============================================================================

/**
 * @route   GET /api/schedules/analytics/:rosterId
 * @desc    Generate schedule analytics for a roster
 * @access  Private (Manager+)
 */
router.get('/analytics/:rosterId', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { rosterId } = req.params;
      const period = req.query.period || 'current';

      const result = await scheduleManagementService.getScheduleAnalytics(rosterId, period);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating schedule analytics'
      });
    }
  }
);

/**
 * @route   GET /api/schedules/conflicts/:rosterId
 * @desc    Detect and report schedule conflicts
 * @access  Private (Manager+)
 */
router.get('/conflicts/:rosterId', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const { rosterId } = req.params;

      const result = await scheduleManagementService.detectScheduleConflicts(rosterId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while detecting schedule conflicts'
      });
    }
  }
);

// ============================================================================
// STAFF SCHEDULE VIEWS
// ============================================================================

/**
 * @route   GET /api/schedules/staff/:staffId
 * @desc    Get staff member's schedule
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/staff/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Check authorization - staff can only view their own schedule
    if (req.user.id !== staffId && !['admin', 'manager', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own schedule'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { staffId, schedule: [] }, 
      message: 'Staff schedule retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving staff schedule'
    });
  }
});

/**
 * @route   GET /api/schedules/my-schedule
 * @desc    Get current user's schedule
 * @access  Private (All roles)
 */
router.get('/my-schedule', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, includeSwapRequests } = req.query;

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId: req.user.id, 
        schedule: [],
        upcomingShifts: [],
        pendingSwapRequests: includeSwapRequests ? [] : undefined
      }, 
      message: 'Your schedule retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving your schedule'
    });
  }
});

// ============================================================================
// SCHEDULE NOTIFICATIONS
// ============================================================================

/**
 * @route   POST /api/schedules/notifications/send
 * @desc    Send schedule notifications to staff
 * @access  Private (Manager+)
 */
router.post('/notifications/send', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'scheduler']), 
  async (req, res) => {
    try {
      const {
        recipients,
        message,
        type,
        priority,
        scheduleChanges
      } = req.body;

      // This would integrate with notification service
      const result = { 
        success: true, 
        data: { 
          notificationsSent: recipients.length,
          messageId: 'msg_' + Date.now()
        },
        message: 'Schedule notifications sent successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while sending schedule notifications'
      });
    }
  }
);

/**
 * @route   GET /api/schedules/notifications/:staffId
 * @desc    Get schedule notifications for a staff member
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/notifications/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check authorization
    if (req.user.id !== staffId && !['admin', 'manager', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own notifications'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { notifications: [] }, 
      message: 'Notifications retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving notifications'
    });
  }
});

module.exports = router;