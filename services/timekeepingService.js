const { Op } = require('sequelize');

/**
 * Timekeeping Service
 * Handles time clock, timesheets, and time tracking functionality
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

class TimekeepingService {
  constructor() {
    this.timeEntries = new Map();
    this.timesheets = new Map();
    this.clockSessions = new Map();
    this.timeApprovals = new Map();
  }

  // ============================================================================
  // TIME CLOCK FUNCTIONALITY
  // ============================================================================

  /**
   * Clock in for work
   */
  async clockIn(clockInData) {
    try {
      const {
        staffId,
        location,
        deviceInfo,
        gpsCoordinates,
        faceVerification,
        photo
      } = clockInData;

      // Check for existing active session
      const existingSession = this.findActiveSession(staffId);
      if (existingSession) {
        return {
          success: false,
          error: 'Already clocked in',
          data: existingSession,
          message: 'You are already clocked in. Please clock out first.'
        };
      }

      // Verify location if required
      const locationVerification = await this.verifyLocation(location, gpsCoordinates);
      
      const session = {
        id: this.generateId(),
        staffId,
        clockInTime: new Date(),
        clockOutTime: null,
        location: {
          name: location,
          coordinates: gpsCoordinates,
          verified: locationVerification.verified,
          accuracy: gpsCoordinates?.accuracy || null
        },
        device: {
          type: deviceInfo.type, // mobile, web, kiosk
          id: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress
        },
        verification: {
          method: faceVerification ? 'face' : 'standard',
          verified: faceVerification?.verified || true,
          confidence: faceVerification?.confidence || null,
          photo: photo || null
        },
        breaks: [],
        status: 'active',
        duration: null,
        regularHours: 0,
        overtimeHours: 0,
        createdAt: new Date(),
        anomalies: [],
        notes: clockInData.notes || ''
      };

      // Check for anomalies
      await this.detectClockInAnomalies(session);

      this.clockSessions.set(session.id, session);

      return {
        success: true,
        data: session,
        message: 'Successfully clocked in',
        verification: locationVerification
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clock in'
      };
    }
  }

  /**
   * Clock out from work
   */
  async clockOut(clockOutData) {
    try {
      const {
        staffId,
        location,
        deviceInfo,
        gpsCoordinates,
        workSummary
      } = clockOutData;

      const session = this.findActiveSession(staffId);
      if (!session) {
        return {
          success: false,
          error: 'No active session found',
          message: 'You are not currently clocked in.'
        };
      }

      const clockOutTime = new Date();
      const totalDuration = clockOutTime - session.clockInTime;
      const breakDuration = session.breaks.reduce((total, break_) => 
        total + (break_.duration || 0), 0);
      const workDuration = totalDuration - breakDuration;

      // Calculate regular and overtime hours
      const hoursWorked = workDuration / (1000 * 60 * 60);
      const { regularHours, overtimeHours } = this.calculateOvertimeHours(
        hoursWorked, 
        staffId, 
        session.clockInTime
      );

      // Verify location for clock out
      const locationVerification = await this.verifyLocation(location, gpsCoordinates);

      // Update session
      session.clockOutTime = clockOutTime;
      session.duration = totalDuration;
      session.workDuration = workDuration;
      session.breakDuration = breakDuration;
      session.regularHours = regularHours;
      session.overtimeHours = overtimeHours;
      session.status = 'completed';
      session.clockOutLocation = {
        name: location,
        coordinates: gpsCoordinates,
        verified: locationVerification.verified
      };
      session.workSummary = workSummary || '';

      // Check for clock out anomalies
      await this.detectClockOutAnomalies(session);

      // Create timesheet entry
      await this.createTimesheetEntry(session);

      return {
        success: true,
        data: {
          session,
          summary: {
            totalTime: this.formatDuration(totalDuration),
            workTime: this.formatDuration(workDuration),
            breakTime: this.formatDuration(breakDuration),
            regularHours: regularHours.toFixed(2),
            overtimeHours: overtimeHours.toFixed(2)
          }
        },
        message: 'Successfully clocked out',
        verification: locationVerification
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clock out'
      };
    }
  }

  /**
   * Start a break
   */
  async startBreak(breakData) {
    try {
      const { staffId, breakType, location } = breakData;

      const session = this.findActiveSession(staffId);
      if (!session) {
        return {
          success: false,
          error: 'No active session found',
          message: 'You must be clocked in to start a break.'
        };
      }

      // Check if already on break
      const activeBreak = session.breaks.find(b => !b.endTime);
      if (activeBreak) {
        return {
          success: false,
          error: 'Already on break',
          message: 'You are already on a break. Please end current break first.'
        };
      }

      const break_ = {
        id: this.generateId(),
        type: breakType, // lunch, rest, personal, other
        startTime: new Date(),
        endTime: null,
        location: location,
        duration: null,
        paid: this.isBreakPaid(breakType),
        notes: breakData.notes || ''
      };

      session.breaks.push(break_);

      return {
        success: true,
        data: break_,
        message: `${breakType} break started successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to start break'
      };
    }
  }

  /**
   * End a break
   */
  async endBreak(staffId, notes = '') {
    try {
      const session = this.findActiveSession(staffId);
      if (!session) {
        return {
          success: false,
          error: 'No active session found',
          message: 'You must be clocked in to end a break.'
        };
      }

      const activeBreak = session.breaks.find(b => !b.endTime);
      if (!activeBreak) {
        return {
          success: false,
          error: 'No active break found',
          message: 'You are not currently on a break.'
        };
      }

      const endTime = new Date();
      activeBreak.endTime = endTime;
      activeBreak.duration = endTime - activeBreak.startTime;
      activeBreak.notes += notes ? ` - ${notes}` : '';

      return {
        success: true,
        data: {
          break: activeBreak,
          duration: this.formatDuration(activeBreak.duration)
        },
        message: 'Break ended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to end break'
      };
    }
  }

  // ============================================================================
  // TIMESHEET MANAGEMENT
  // ============================================================================

  /**
   * Create a timesheet entry from a completed clock session
   */
  async createTimesheetEntry(session) {
    try {
      const timesheet = {
        id: this.generateId(),
        staffId: session.staffId,
        date: session.clockInTime.toDateString(),
        week: this.getWeekNumber(session.clockInTime),
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime,
        scheduledShiftId: session.scheduledShiftId || null,
        regularHours: session.regularHours,
        overtimeHours: session.overtimeHours,
        breaks: session.breaks,
        totalBreakTime: session.breakDuration,
        location: session.location.name,
        status: 'pending_approval',
        submittedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        payPeriod: this.getPayPeriod(session.clockInTime),
        anomalies: session.anomalies,
        notes: session.notes,
        workSummary: session.workSummary,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.timesheets.set(timesheet.id, timesheet);

      // Auto-approve if within normal parameters
      if (this.shouldAutoApprove(timesheet)) {
        await this.approveTimesheet(timesheet.id, 'system_auto_approval');
      }

      return timesheet;
    } catch (error) {
      throw new Error(`Failed to create timesheet entry: ${error.message}`);
    }
  }

  /**
   * Get timesheets with filtering and pagination
   */
  async getTimesheets(filters = {}, pagination = {}) {
    try {
      let timesheets = Array.from(this.timesheets.values());

      // Apply filters
      if (filters.staffId) {
        timesheets = timesheets.filter(t => t.staffId === filters.staffId);
      }
      if (filters.status) {
        timesheets = timesheets.filter(t => t.status === filters.status);
      }
      if (filters.payPeriod) {
        timesheets = timesheets.filter(t => t.payPeriod === filters.payPeriod);
      }
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        timesheets = timesheets.filter(t => new Date(t.date) >= fromDate);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        timesheets = timesheets.filter(t => new Date(t.date) <= toDate);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;
      const paginatedResults = timesheets.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: timesheets.length,
          totalPages: Math.ceil(timesheets.length / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Approve a timesheet
   */
  async approveTimesheet(timesheetId, approvedBy, notes = '') {
    try {
      const timesheet = this.timesheets.get(timesheetId);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }

      if (timesheet.status !== 'pending_approval' && timesheet.status !== 'rejected') {
        throw new Error('Timesheet cannot be approved in its current status');
      }

      timesheet.status = 'approved';
      timesheet.approvedAt = new Date();
      timesheet.approvedBy = approvedBy;
      timesheet.approvalNotes = notes;
      timesheet.updatedAt = new Date();

      return {
        success: true,
        data: timesheet,
        message: 'Timesheet approved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to approve timesheet'
      };
    }
  }

  /**
   * Reject a timesheet
   */
  async rejectTimesheet(timesheetId, rejectedBy, reason) {
    try {
      const timesheet = this.timesheets.get(timesheetId);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }

      if (timesheet.status !== 'pending_approval') {
        throw new Error('Only pending timesheets can be rejected');
      }

      timesheet.status = 'rejected';
      timesheet.rejectedAt = new Date();
      timesheet.rejectedBy = rejectedBy;
      timesheet.rejectionReason = reason;
      timesheet.updatedAt = new Date();

      return {
        success: true,
        data: timesheet,
        message: 'Timesheet rejected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to reject timesheet'
      };
    }
  }

  // ============================================================================
  // TIME TRACKING ANALYTICS
  // ============================================================================

  /**
   * Generate time tracking analytics
   */
  async getTimeTrackingAnalytics(filters = {}) {
    try {
      const timesheets = Array.from(this.timesheets.values());
      const filtered = this.applyAnalyticsFilters(timesheets, filters);

      const analytics = {
        summary: {
          totalTimesheets: filtered.length,
          totalRegularHours: filtered.reduce((sum, t) => sum + t.regularHours, 0),
          totalOvertimeHours: filtered.reduce((sum, t) => sum + t.overtimeHours, 0),
          averageHoursPerDay: 0,
          approvalRate: 0
        },
        attendance: {
          punctualityRate: this.calculatePunctualityRate(filtered),
          absenteeismRate: this.calculateAbsenteeismRate(filtered),
          lateArrivals: this.countLateArrivals(filtered),
          earlyDepartures: this.countEarlyDepartures(filtered)
        },
        productivity: {
          averageBreakDuration: this.calculateAverageBreakDuration(filtered),
          breakFrequency: this.calculateBreakFrequency(filtered),
          workEfficiencyScore: this.calculateWorkEfficiencyScore(filtered)
        },
        anomalies: {
          totalAnomalies: this.countAnomalies(filtered),
          anomalyTypes: this.groupAnomaliesByType(filtered),
          highRiskTimesheets: this.identifyHighRiskTimesheets(filtered)
        },
        trends: {
          dailyAverages: this.calculateDailyAverages(filtered),
          weeklyTrends: this.calculateWeeklyTrends(filtered),
          monthlyComparison: this.calculateMonthlyComparison(filtered)
        }
      };

      // Calculate derived metrics
      analytics.summary.averageHoursPerDay = 
        analytics.summary.totalRegularHours / (analytics.summary.totalTimesheets || 1);
      
      const approvedCount = filtered.filter(t => t.status === 'approved').length;
      analytics.summary.approvalRate = 
        (approvedCount / (analytics.summary.totalTimesheets || 1)) * 100;

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate attendance report
   */
  async generateAttendanceReport(reportParams) {
    try {
      const {
        staffIds,
        startDate,
        endDate,
        includeBreaks,
        groupBy
      } = reportParams;

      const timesheets = Array.from(this.timesheets.values())
        .filter(t => {
          if (staffIds && !staffIds.includes(t.staffId)) return false;
          if (startDate && new Date(t.date) < new Date(startDate)) return false;
          if (endDate && new Date(t.date) > new Date(endDate)) return false;
          return true;
        });

      const report = {
        reportId: this.generateId(),
        generatedAt: new Date(),
        period: { startDate, endDate },
        parameters: reportParams,
        data: [],
        summary: {
          totalEntries: timesheets.length,
          totalHours: timesheets.reduce((sum, t) => sum + t.regularHours + t.overtimeHours, 0),
          averageHoursPerEntry: 0
        }
      };

      // Group data based on groupBy parameter
      if (groupBy === 'staff') {
        report.data = this.groupTimesheetsByStaff(timesheets, includeBreaks);
      } else if (groupBy === 'day') {
        report.data = this.groupTimesheetsByDay(timesheets, includeBreaks);
      } else if (groupBy === 'week') {
        report.data = this.groupTimesheetsByWeek(timesheets, includeBreaks);
      } else {
        report.data = timesheets;
      }

      report.summary.averageHoursPerEntry = 
        report.summary.totalHours / (report.summary.totalEntries || 1);

      return {
        success: true,
        data: report,
        message: 'Attendance report generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate attendance report'
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  findActiveSession(staffId) {
    for (const session of this.clockSessions.values()) {
      if (session.staffId === staffId && session.status === 'active') {
        return session;
      }
    }
    return null;
  }

  async verifyLocation(expectedLocation, gpsCoordinates) {
    // Mock location verification
    const allowedRadius = 100; // meters
    const verified = gpsCoordinates ? 
      gpsCoordinates.accuracy <= allowedRadius : true;

    return {
      verified,
      distance: gpsCoordinates?.accuracy || 0,
      withinRange: verified
    };
  }

  async detectClockInAnomalies(session) {
    const anomalies = [];

    // Check for unusual clock in time
    const hour = session.clockInTime.getHours();
    if (hour < 5 || hour > 23) {
      anomalies.push({
        type: 'unusual_time',
        severity: 'medium',
        description: 'Clock in time outside normal business hours'
      });
    }

    // Check for weekend clock in
    const day = session.clockInTime.getDay();
    if (day === 0 || day === 6) {
      anomalies.push({
        type: 'weekend_work',
        severity: 'low',
        description: 'Clock in on weekend'
      });
    }

    session.anomalies = anomalies;
  }

  async detectClockOutAnomalies(session) {
    // Check for very long shifts
    const hoursWorked = session.duration / (1000 * 60 * 60);
    if (hoursWorked > 12) {
      session.anomalies.push({
        type: 'long_shift',
        severity: 'high',
        description: `Shift duration (${hoursWorked.toFixed(1)} hours) exceeds 12 hours`
      });
    }

    // Check for very short shifts
    if (hoursWorked < 2) {
      session.anomalies.push({
        type: 'short_shift',
        severity: 'medium',
        description: `Very short shift duration (${hoursWorked.toFixed(1)} hours)`
      });
    }
  }

  calculateOvertimeHours(totalHours, staffId, date) {
    // Mock overtime calculation - in real app, this would consider
    // daily overtime (>8 hours), weekly overtime (>40 hours), etc.
    const standardDailyHours = 8;
    const regularHours = Math.min(totalHours, standardDailyHours);
    const overtimeHours = Math.max(0, totalHours - standardDailyHours);

    return { regularHours, overtimeHours };
  }

  isBreakPaid(breakType) {
    const paidBreaks = ['rest'];
    return paidBreaks.includes(breakType);
  }

  formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  getPayPeriod(date) {
    // Mock pay period calculation (bi-weekly)
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    const payPeriod = Math.ceil(weekNumber / 2);
    return `${year}-PP${payPeriod.toString().padStart(2, '0')}`;
  }

  shouldAutoApprove(timesheet) {
    // Auto-approve if no anomalies and within normal working hours
    return timesheet.anomalies.length === 0 && 
           timesheet.regularHours <= 8 && 
           timesheet.overtimeHours <= 2;
  }

  generateId() {
    return 'time_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Analytics helper methods
  applyAnalyticsFilters(timesheets, filters) {
    let filtered = timesheets;
    
    if (filters.staffId) {
      filtered = filtered.filter(t => t.staffId === filters.staffId);
    }
    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.endDate));
    }
    
    return filtered;
  }

  calculatePunctualityRate(timesheets) {
    // Mock calculation
    return 92.5; // percentage
  }

  calculateAbsenteeismRate(timesheets) {
    // Mock calculation
    return 3.2; // percentage
  }

  countLateArrivals(timesheets) {
    // Mock calculation
    return timesheets.filter(t => t.anomalies.some(a => a.type === 'late_arrival')).length;
  }

  countEarlyDepartures(timesheets) {
    // Mock calculation  
    return timesheets.filter(t => t.anomalies.some(a => a.type === 'early_departure')).length;
  }

  calculateAverageBreakDuration(timesheets) {
    const totalBreakTime = timesheets.reduce((sum, t) => sum + (t.totalBreakTime || 0), 0);
    return totalBreakTime / (timesheets.length || 1);
  }

  calculateBreakFrequency(timesheets) {
    const totalBreaks = timesheets.reduce((sum, t) => sum + t.breaks.length, 0);
    return totalBreaks / (timesheets.length || 1);
  }

  calculateWorkEfficiencyScore(timesheets) {
    // Mock efficiency calculation
    return 87.3; // percentage
  }

  countAnomalies(timesheets) {
    return timesheets.reduce((sum, t) => sum + t.anomalies.length, 0);
  }

  groupAnomaliesByType(timesheets) {
    const anomalyTypes = {};
    timesheets.forEach(t => {
      t.anomalies.forEach(a => {
        anomalyTypes[a.type] = (anomalyTypes[a.type] || 0) + 1;
      });
    });
    return anomalyTypes;
  }

  identifyHighRiskTimesheets(timesheets) {
    return timesheets.filter(t => 
      t.anomalies.some(a => a.severity === 'high') || 
      t.anomalies.length > 2
    );
  }

  calculateDailyAverages(timesheets) {
    // Mock calculation
    return {
      monday: 8.2,
      tuesday: 8.1,
      wednesday: 8.3,
      thursday: 8.0,
      friday: 7.8,
      saturday: 4.5,
      sunday: 0
    };
  }

  calculateWeeklyTrends(timesheets) {
    // Mock calculation
    return [
      { week: 1, hours: 162.5, efficiency: 92.1 },
      { week: 2, hours: 158.3, efficiency: 89.7 },
      { week: 3, hours: 165.2, efficiency: 94.2 },
      { week: 4, hours: 160.1, efficiency: 91.8 }
    ];
  }

  calculateMonthlyComparison(timesheets) {
    // Mock calculation
    return {
      currentMonth: { hours: 686.1, efficiency: 91.9 },
      previousMonth: { hours: 672.3, efficiency: 89.2 },
      change: { hours: +13.8, efficiency: +2.7 }
    };
  }

  groupTimesheetsByStaff(timesheets, includeBreaks) {
    const grouped = {};
    timesheets.forEach(t => {
      if (!grouped[t.staffId]) {
        grouped[t.staffId] = [];
      }
      grouped[t.staffId].push(includeBreaks ? t : this.excludeBreakDetails(t));
    });
    return grouped;
  }

  groupTimesheetsByDay(timesheets, includeBreaks) {
    const grouped = {};
    timesheets.forEach(t => {
      if (!grouped[t.date]) {
        grouped[t.date] = [];
      }
      grouped[t.date].push(includeBreaks ? t : this.excludeBreakDetails(t));
    });
    return grouped;
  }

  groupTimesheetsByWeek(timesheets, includeBreaks) {
    const grouped = {};
    timesheets.forEach(t => {
      const week = `${t.week}`;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(includeBreaks ? t : this.excludeBreakDetails(t));
    });
    return grouped;
  }

  excludeBreakDetails(timesheet) {
    const { breaks, ...timesheetWithoutBreaks } = timesheet;
    return timesheetWithoutBreaks;
  }
}

module.exports = new TimekeepingService();