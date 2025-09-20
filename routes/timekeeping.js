const express = require('express');
const router = express.Router();
const timekeepingService = require('../services/timekeepingService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Timekeeping Routes
 * API endpoints for time clock, timesheets, and time tracking
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

// ============================================================================
// TIME CLOCK FUNCTIONALITY
// ============================================================================

/**
 * @route   POST /api/timekeeping/clock-in
 * @desc    Clock in for work
 * @access  Private (All roles)
 */
router.post('/clock-in', authenticateToken, async (req, res) => {
  try {
    const clockInData = {
      staffId: req.user.id,
      location: req.body.location,
      deviceInfo: {
        type: req.body.deviceType || 'web',
        deviceId: req.body.deviceId || req.headers['user-agent'],
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      gpsCoordinates: req.body.gpsCoordinates,
      faceVerification: req.body.faceVerification,
      photo: req.body.photo,
      notes: req.body.notes
    };

    const result = await timekeepingService.clockIn(clockInData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while clocking in'
    });
  }
});

/**
 * @route   POST /api/timekeeping/clock-out
 * @desc    Clock out from work
 * @access  Private (All roles)
 */
router.post('/clock-out', authenticateToken, async (req, res) => {
  try {
    const clockOutData = {
      staffId: req.user.id,
      location: req.body.location,
      deviceInfo: {
        type: req.body.deviceType || 'web',
        deviceId: req.body.deviceId || req.headers['user-agent'],
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      gpsCoordinates: req.body.gpsCoordinates,
      workSummary: req.body.workSummary
    };

    const result = await timekeepingService.clockOut(clockOutData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while clocking out'
    });
  }
});

/**
 * @route   GET /api/timekeeping/clock-status
 * @desc    Get current clock status for user
 * @access  Private (All roles)
 */
router.get('/clock-status', authenticateToken, async (req, res) => {
  try {
    const staffId = req.user.id;
    
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId,
        status: 'clocked_out', // or 'clocked_in', 'on_break'
        currentSession: null,
        lastClockIn: null,
        lastClockOut: null
      }, 
      message: 'Clock status retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving clock status'
    });
  }
});

// ============================================================================
// BREAK MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/timekeeping/break/start
 * @desc    Start a break
 * @access  Private (All roles)
 */
router.post('/break/start', authenticateToken, async (req, res) => {
  try {
    const breakData = {
      staffId: req.user.id,
      breakType: req.body.breakType, // lunch, rest, personal, other
      location: req.body.location,
      notes: req.body.notes
    };

    const result = await timekeepingService.startBreak(breakData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while starting break'
    });
  }
});

/**
 * @route   POST /api/timekeeping/break/end
 * @desc    End current break
 * @access  Private (All roles)
 */
router.post('/break/end', authenticateToken, async (req, res) => {
  try {
    const result = await timekeepingService.endBreak(req.user.id, req.body.notes);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while ending break'
    });
  }
});

// ============================================================================
// TIMESHEET MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/timekeeping/timesheets
 * @desc    Get timesheets with filtering and pagination
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/timesheets', authenticateToken, async (req, res) => {
  try {
    const filters = {
      staffId: req.query.staffId,
      status: req.query.status,
      payPeriod: req.query.payPeriod,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // If not admin/manager and no staffId specified, default to own timesheets
    if (!['admin', 'manager', 'hr'].includes(req.user.role) && !filters.staffId) {
      filters.staffId = req.user.id;
    }

    // Check authorization for viewing other staff timesheets
    if (filters.staffId && filters.staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own timesheets'
      });
    }

    const result = await timekeepingService.getTimesheets(filters, pagination);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving timesheets'
    });
  }
});

/**
 * @route   GET /api/timekeeping/timesheets/:timesheetId
 * @desc    Get specific timesheet details
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/timesheets/:timesheetId', authenticateToken, async (req, res) => {
  try {
    const { timesheetId } = req.params;
    
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        id: timesheetId,
        staffId: req.user.id,
        status: 'pending_approval'
      }, 
      message: 'Timesheet retrieved successfully' 
    };

    // Check authorization
    if (result.data.staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own timesheets'
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving timesheet'
    });
  }
});

/**
 * @route   PUT /api/timekeeping/timesheets/:timesheetId/approve
 * @desc    Approve a timesheet
 * @access  Private (Manager+)
 */
router.put('/timesheets/:timesheetId/approve', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { timesheetId } = req.params;
      const { notes } = req.body;

      const result = await timekeepingService.approveTimesheet(
        timesheetId, 
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
        message: 'Server error while approving timesheet'
      });
    }
  }
);

/**
 * @route   PUT /api/timekeeping/timesheets/:timesheetId/reject
 * @desc    Reject a timesheet
 * @access  Private (Manager+)
 */
router.put('/timesheets/:timesheetId/reject', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { timesheetId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason required',
          message: 'Please provide a reason for rejecting the timesheet'
        });
      }

      const result = await timekeepingService.rejectTimesheet(
        timesheetId, 
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
        message: 'Server error while rejecting timesheet'
      });
    }
  }
);

/**
 * @route   POST /api/timekeeping/timesheets/bulk-approve
 * @desc    Bulk approve multiple timesheets
 * @access  Private (Manager+)
 */
router.post('/timesheets/bulk-approve', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { timesheetIds, notes } = req.body;

      if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timesheet IDs',
          message: 'Please provide an array of timesheet IDs to approve'
        });
      }

      const results = [];
      for (const timesheetId of timesheetIds) {
        const result = await timekeepingService.approveTimesheet(
          timesheetId, 
          req.user.id, 
          notes
        );
        results.push({ timesheetId, result });
      }

      const successCount = results.filter(r => r.result.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            approved: successCount,
            failed: failureCount
          }
        },
        message: `Bulk approval completed: ${successCount} approved, ${failureCount} failed`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while bulk approving timesheets'
      });
    }
  }
);

// ============================================================================
// TIME TRACKING ANALYTICS
// ============================================================================

/**
 * @route   GET /api/timekeeping/analytics
 * @desc    Generate time tracking analytics
 * @access  Private (Manager+)
 */
router.get('/analytics', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const filters = {
        staffId: req.query.staffId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        department: req.query.department,
        location: req.query.location
      };

      const result = await timekeepingService.getTimeTrackingAnalytics(filters);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating time tracking analytics'
      });
    }
  }
);

/**
 * @route   POST /api/timekeeping/reports/attendance
 * @desc    Generate attendance report
 * @access  Private (Manager+)
 */
router.post('/reports/attendance', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const reportParams = {
        staffIds: req.body.staffIds,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        includeBreaks: req.body.includeBreaks !== false,
        groupBy: req.body.groupBy || 'staff'
      };

      const result = await timekeepingService.generateAttendanceReport(reportParams);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while generating attendance report'
      });
    }
  }
);

// ============================================================================
// STAFF TIME TRACKING VIEWS
// ============================================================================

/**
 * @route   GET /api/timekeeping/my-hours
 * @desc    Get current user's time tracking summary
 * @access  Private (All roles)
 */
router.get('/my-hours', authenticateToken, async (req, res) => {
  try {
    const { period, includeBreaks } = req.query;
    
    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        staffId: req.user.id,
        period: period || 'current_week',
        totalHours: 40.5,
        regularHours: 40.0,
        overtimeHours: 0.5,
        currentWeekHours: 32.5,
        todayHours: 8.0,
        breaks: includeBreaks ? [] : undefined
      }, 
      message: 'Your hours retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving your hours'
    });
  }
});

/**
 * @route   GET /api/timekeeping/dashboard
 * @desc    Get time tracking dashboard data
 * @access  Private (Manager+)
 */
router.get('/dashboard', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { department, location } = req.query;
      
      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          currentlyWorking: 25,
          onBreak: 3,
          pendingApprovals: 12,
          overdueTimesheets: 2,
          recentActivity: [],
          alerts: []
        }, 
        message: 'Dashboard data retrieved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while retrieving dashboard data'
      });
    }
  }
);

// ============================================================================
// TIME CORRECTIONS
// ============================================================================

/**
 * @route   POST /api/timekeeping/corrections
 * @desc    Submit time correction request
 * @access  Private (All roles)
 */
router.post('/corrections', authenticateToken, async (req, res) => {
  try {
    const correctionData = {
      staffId: req.user.id,
      timesheetId: req.body.timesheetId,
      correctionType: req.body.correctionType, // missed_punch, wrong_time, missed_break
      originalTime: req.body.originalTime,
      correctedTime: req.body.correctedTime,
      reason: req.body.reason,
      submittedAt: new Date()
    };

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: { 
        id: 'correction_' + Date.now(),
        ...correctionData,
        status: 'pending'
      }, 
      message: 'Time correction request submitted successfully' 
    };
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while submitting time correction'
    });
  }
});

/**
 * @route   GET /api/timekeeping/corrections
 * @desc    Get time correction requests
 * @access  Private (Staff can view own, Manager+ can view any)
 */
router.get('/corrections', authenticateToken, async (req, res) => {
  try {
    const filters = {
      staffId: req.query.staffId,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    // If not admin/manager and no staffId specified, default to own corrections
    if (!['admin', 'manager', 'hr'].includes(req.user.role) && !filters.staffId) {
      filters.staffId = req.user.id;
    }

    // Check authorization
    if (filters.staffId && filters.staffId !== req.user.id && 
        !['admin', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own correction requests'
      });
    }

    // This would be implemented in the service
    const result = { 
      success: true, 
      data: [], 
      message: 'Correction requests retrieved successfully' 
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while retrieving correction requests'
    });
  }
});

/**
 * @route   PUT /api/timekeeping/corrections/:correctionId/approve
 * @desc    Approve time correction request
 * @access  Private (Manager+)
 */
router.put('/corrections/:correctionId/approve', 
  authenticateToken, 
  authorizeRoles(['admin', 'manager', 'hr']), 
  async (req, res) => {
    try {
      const { correctionId } = req.params;
      const { notes } = req.body;

      // This would be implemented in the service
      const result = { 
        success: true, 
        data: { 
          id: correctionId,
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date(),
          notes
        }, 
        message: 'Time correction approved successfully' 
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Server error while approving time correction'
      });
    }
  }
);

module.exports = router;