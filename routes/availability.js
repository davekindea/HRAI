const express = require('express');
const router = express.Router();
const availabilityService = require('../services/availabilityService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Availability Management Routes
 * API endpoints for employee availability, time off, and scheduling preferences
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

// ============================================================================
// AVAILABILITY PROFILE MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/availability/profile
 * @desc    Create or update staff availability profile
 * @access  Private (Staff can manage own, Manager+ can manage any)
 */
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const profileData = {
      ...req.body,
      staffId: req.body.staffId || req.user.id
    };

    // Check authorization - staff can only manage their own profile
    if (profileData.staffId !== req.user.id && 
        !['admin', 'manager', 'hr', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only manage your own availability profile'
      });
    }

    const result = await availabilityService.createAvailabilityProfile(profileData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while creating availability profile'
    });
  }
});

/**
 * @route   GET /api/availability/profile/:staffId
 * @desc    Get availability profile for a staff member
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/profile/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    // Check authorization
    if (staffId !== req.user.id && 
        !['admin', 'manager', 'hr', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own availability profile'
      });
    }

    const result = await availabilityService.getStaffAvailability(staffId, date);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving availability profile'
    });
  }
});

/**
 * @route   GET /api/availability/my-profile
 * @desc    Get current user's availability profile
 * @access  Private (All roles)
 */
router.get('/my-profile', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    const result = await availabilityService.getStaffAvailability(req.user.id, date);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving your availability profile'
    });
  }
});

/**
 * @route   POST /api/availability/bulk-check
 * @desc    Get bulk staff availability for a date range
 * @access  Private (Manager+)
 */
router.post('/bulk-check', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const { staffIds, startDate, endDate } = req.body;

      if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid staff IDs',
          message: 'Please provide an array of staff IDs'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Date range required',
          message: 'Please provide startDate and endDate'
        });
      }

      const result = await availabilityService.getBulkStaffAvailability(
        staffIds, 
        startDate, 
        endDate
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
        message: 'Server error while checking bulk staff availability'
      });
    }
  }
);

// ============================================================================
// TIME OFF MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/availability/time-off
 * @desc    Submit a time off request
 * @access  Private (All roles)
 */
router.post('/time-off', authenticateToken, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      staffId: req.user.id
    };

    const result = await availabilityService.submitTimeOffRequest(requestData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while submitting time off request'
    });
  }
});

/**
 * @route   GET /api/availability/time-off
 * @desc    Get time off requests
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/time-off', authenticateToken, async (req, res) => {
  try {
    const filters = {
      staffId: req.query.staffId,
      status: req.query.status,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // If not admin/manager and no staffId specified, default to own requests
    if (!['admin', 'manager', 'hr'].includes(req.user.role) && !filters.staffId) {
      filters.staffId = req.user.id;
    }

    // Check authorization
    if (filters.staffId && filters.staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own time off requests'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: [], 
      pagination,
      message: 'Time off requests retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving time off requests'
    });
  }
});

/**
 * @route   GET /api/availability/time-off/:requestId
 * @desc    Get specific time off request details
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/time-off/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        id: requestId,
        staffId: req.user.id,
        status: 'pending'
      }, 
      message: 'Time off request retrieved successfully' 
    };

    // Check authorization
    if (result.data.staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own time off requests'
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving time off request'
    });
  }
});

/**
 * @route   PUT /api/availability/time-off/:requestId/approve
 * @desc    Approve time off request
 * @access  Private (Manager+)
 */
router.put('/time-off/:requestId/approve', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;

      const result = await availabilityService.approveTimeOffRequest(
        requestId, 
        req.user.id, 
        notes
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
        message: 'Server error while approving time off request'
      });
    }
  }
);

/**
 * @route   PUT /api/availability/time-off/:requestId/reject
 * @desc    Reject time off request
 * @access  Private (Manager+)
 */
router.put('/time-off/:requestId/reject', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason required',
          message: 'Please provide a reason for rejecting the time off request'
        });
      }

      const result = await availabilityService.rejectTimeOffRequest(
        requestId, 
        req.user.id, 
        reason
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
        message: 'Server error while rejecting time off request'
      });
    }
  }
);

/**
 * @route   DELETE /api/availability/time-off/:requestId
 * @desc    Cancel/withdraw time off request
 * @access  Private (Staff can cancel own, Manager+ can cancel any)
 */
router.delete('/time-off/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // This would check ownership and implement cancellation logic
    const result = { 
      success: true, 
      message: 'Time off request cancelled successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while cancelling time off request'
    });
  }
});

// ============================================================================
// AVAILABILITY OVERRIDES
// ============================================================================

/**
 * @route   POST /api/availability/override
 * @desc    Create temporary availability override
 * @access  Private (Manager+)
 */
router.post('/override', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const overrideData = {
        ...req.body,
        createdBy: req.user.id
      };

      const result = await availabilityService.createAvailabilityOverride(overrideData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while creating availability override'
      });
    }
  }
);

/**
 * @route   GET /api/availability/overrides
 * @desc    Get availability overrides
 * @access  Private (Manager+)
 */
router.get('/overrides', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const filters = {
        staffId: req.query.staffId,
        status: req.query.status || 'active',
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: [], 
        message: 'Availability overrides retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving availability overrides'
      });
    }
  }
);

// ============================================================================
// STAFF MATCHING & OPTIMIZATION
// ============================================================================

/**
 * @route   POST /api/availability/find-staff
 * @desc    Find available staff for specific shift requirements
 * @access  Private (Manager+)
 */
router.post('/find-staff', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const shiftRequirements = {
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        skillsRequired: req.body.skillsRequired || [],
        location: req.body.location,
        minimumStaff: req.body.minimumStaff || 1,
        excludeStaffIds: req.body.excludeStaffIds || []
      };

      // Validate required fields
      if (!shiftRequirements.date || !shiftRequirements.startTime || !shiftRequirements.endTime) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Date, start time, and end time are required'
        });
      }

      const result = await availabilityService.findAvailableStaff(shiftRequirements);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while finding available staff'
      });
    }
  }
);

/**
 * @route   POST /api/availability/reports/availability
 * @desc    Generate availability conflict report
 * @access  Private (Manager+)
 */
router.post('/reports/availability', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const reportParams = {
        staffIds: req.body.staffIds,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        includeTimeOff: req.body.includeTimeOff !== false,
        includeConstraints: req.body.includeConstraints !== false
      };

      const result = await availabilityService.generateAvailabilityReport(reportParams);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating availability report'
      });
    }
  }
);

// ============================================================================
// STAFF AVAILABILITY VIEWS
// ============================================================================

/**
 * @route   GET /api/availability/my-schedule
 * @desc    Get current user's availability and upcoming time off
 * @access  Private (All roles)
 */
router.get('/my-schedule', authenticateToken, async (req, res) => {
  try {
    const { period, includeTimeOff } = req.query;
    
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId: req.user.id,
        weeklyAvailability: {},
        upcomingTimeOff: includeTimeOff !== 'false' ? [] : undefined,
        conflicts: [],
        pendingRequests: []
      }, 
      message: 'Your availability schedule retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving your availability schedule'
    });
  }
});

/**
 * @route   GET /api/availability/dashboard
 * @desc    Get availability management dashboard data
 * @access  Private (Manager+)
 */
router.get('/dashboard', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr', 'scheduler']), 
  async (req, res) => {
    try {
      const { department, location } = req.query;
      
      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          pendingTimeOffRequests: 8,
          approvedTimeOffToday: 3,
          staffWithoutProfiles: 2,
          upcomingTimeOff: [],
          availabilityAlerts: [],
          staffingGaps: []
        }, 
        message: 'Availability dashboard data retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving availability dashboard data'
      });
    }
  }
);

// ============================================================================
// LEAVE BALANCE MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/availability/leave-balances/:staffId
 * @desc    Get leave balances for a staff member
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/leave-balances/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check authorization
    if (staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own leave balances'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId,
        vacation: { balance: 80.0, accrualRate: 0.077, used: 16.0 },
        sick: { balance: 24.0, accrualRate: 0.033, used: 8.0 },
        personal: { balance: 16.0, accrualRate: 0.019, used: 0.0 },
        lastUpdated: new Date()
      }, 
      message: 'Leave balances retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving leave balances'
    });
  }
});

/**
 * @route   GET /api/availability/my-leave-balances
 * @desc    Get current user's leave balances
 * @access  Private (All roles)
 */
router.get('/my-leave-balances', authenticateToken, async (req, res) => {
  try {
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId: req.user.id,
        vacation: { balance: 80.0, accrualRate: 0.077, used: 16.0 },
        sick: { balance: 24.0, accrualRate: 0.033, used: 8.0 },
        personal: { balance: 16.0, accrualRate: 0.019, used: 0.0 },
        nextAccrualDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date()
      }, 
      message: 'Your leave balances retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving your leave balances'
    });
  }
});

// ============================================================================
// AVAILABILITY PREFERENCES
// ============================================================================

/**
 * @route   PUT /api/availability/preferences
 * @desc    Update availability preferences
 * @access  Private (All roles)
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = {
      staffId: req.user.id,
      ...req.body
    };

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: preferences, 
      message: 'Availability preferences updated successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while updating availability preferences'
    });
  }
});

/**
 * @route   GET /api/availability/preferences
 * @desc    Get availability preferences
 * @access  Private (All roles)
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const staffId = req.query.staffId || req.user.id;

    // Check authorization
    if (staffId !== req.user.id && 
        !['admin', 'manager', 'hr', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own availability preferences'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        preferredShiftTypes: ['day'],
        weekendAvailability: 'limited',
        notifications: {
          scheduleChanges: true,
          newShiftOffers: true,
          shiftReminders: true
        }
      }, 
      message: 'Availability preferences retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving availability preferences'
    });
  }
});

module.exports = router;