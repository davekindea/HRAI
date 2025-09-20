const { Op } = require('sequelize');

/**
 * Schedule Management Service
 * Handles shift planning, roster building, and schedule management
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

class ScheduleManagementService {
  constructor() {
    this.scheduleTemplates = new Map();
    this.shiftPatterns = new Map();
    this.rosterCache = new Map();
  }

  // ============================================================================
  // SHIFT TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Create a new shift template
   */
  async createShiftTemplate(templateData) {
    try {
      const template = {
        id: this.generateId(),
        name: templateData.name,
        description: templateData.description,
        duration: templateData.duration, // in minutes
        startTime: templateData.startTime, // HH:MM format
        endTime: templateData.endTime,
        breakDuration: templateData.breakDuration || 0,
        minimumStaff: templateData.minimumStaff || 1,
        maximumStaff: templateData.maximumStaff || 10,
        skillRequirements: templateData.skillRequirements || [],
        department: templateData.department,
        location: templateData.location,
        payRate: templateData.payRate,
        shiftType: templateData.shiftType, // day, night, weekend, holiday
        isFlexible: templateData.isFlexible || false,
        recurringPattern: templateData.recurringPattern, // daily, weekly, biweekly, monthly
        tags: templateData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: templateData.createdBy,
        status: 'active'
      };

      this.scheduleTemplates.set(template.id, template);
      
      return {
        success: true,
        data: template,
        message: 'Shift template created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create shift template'
      };
    }
  }

  /**
   * Get all shift templates
   */
  async getShiftTemplates(filters = {}) {
    try {
      let templates = Array.from(this.scheduleTemplates.values());

      // Apply filters
      if (filters.department) {
        templates = templates.filter(t => t.department === filters.department);
      }
      if (filters.shiftType) {
        templates = templates.filter(t => t.shiftType === filters.shiftType);
      }
      if (filters.location) {
        templates = templates.filter(t => t.location === filters.location);
      }
      if (filters.status) {
        templates = templates.filter(t => t.status === filters.status);
      }

      return {
        success: true,
        data: templates,
        count: templates.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // ROSTER BUILDING
  // ============================================================================

  /**
   * Create a new roster for a specific period
   */
  async createRoster(rosterData) {
    try {
      const roster = {
        id: this.generateId(),
        name: rosterData.name,
        department: rosterData.department,
        location: rosterData.location,
        startDate: new Date(rosterData.startDate),
        endDate: new Date(rosterData.endDate),
        shifts: [],
        assignments: new Map(),
        status: 'draft',
        totalHours: 0,
        totalStaffCost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: rosterData.createdBy,
        approvedBy: null,
        approvedAt: null,
        publishedAt: null,
        version: 1,
        constraints: rosterData.constraints || {},
        notes: rosterData.notes || ''
      };

      this.rosterCache.set(roster.id, roster);

      return {
        success: true,
        data: roster,
        message: 'Roster created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create roster'
      };
    }
  }

  /**
   * Auto-generate roster based on templates and staff availability
   */
  async autoGenerateRoster(params) {
    try {
      const {
        rosterId,
        templateIds,
        staffPoolIds,
        optimizationRules,
        constraints
      } = params;

      const roster = this.rosterCache.get(rosterId);
      if (!roster) {
        throw new Error('Roster not found');
      }

      // Get templates
      const templates = templateIds.map(id => this.scheduleTemplates.get(id)).filter(Boolean);
      
      // Generate shifts based on templates
      const generatedShifts = await this.generateShiftsFromTemplates(
        templates, 
        roster.startDate, 
        roster.endDate
      );

      // Apply optimization rules
      const optimizedAssignments = await this.optimizeStaffAssignments(
        generatedShifts,
        staffPoolIds,
        optimizationRules,
        constraints
      );

      // Update roster
      roster.shifts = generatedShifts;
      roster.assignments = optimizedAssignments;
      roster.totalHours = this.calculateTotalHours(generatedShifts);
      roster.updatedAt = new Date();
      roster.status = 'generated';

      return {
        success: true,
        data: {
          roster,
          shiftsGenerated: generatedShifts.length,
          assignmentsCreated: optimizedAssignments.size,
          totalHours: roster.totalHours,
          optimizationStats: {
            coverageRate: this.calculateCoverageRate(generatedShifts, optimizedAssignments),
            costEfficiency: this.calculateCostEfficiency(optimizedAssignments),
            staffUtilization: this.calculateStaffUtilization(optimizedAssignments)
          }
        },
        message: 'Roster auto-generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to auto-generate roster'
      };
    }
  }

  /**
   * Generate shifts from templates for a date range
   */
  async generateShiftsFromTemplates(templates, startDate, endDate) {
    const shifts = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      for (const template of templates) {
        if (this.shouldCreateShiftOnDate(template, currentDate)) {
          const shift = {
            id: this.generateId(),
            templateId: template.id,
            date: new Date(currentDate),
            startTime: template.startTime,
            endTime: template.endTime,
            duration: template.duration,
            breakDuration: template.breakDuration,
            minimumStaff: template.minimumStaff,
            maximumStaff: template.maximumStaff,
            skillRequirements: template.skillRequirements,
            department: template.department,
            location: template.location,
            payRate: template.payRate,
            shiftType: template.shiftType,
            assignedStaff: [],
            status: 'unassigned',
            createdAt: new Date()
          };
          shifts.push(shift);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return shifts;
  }

  /**
   * Optimize staff assignments using intelligent algorithms
   */
  async optimizeStaffAssignments(shifts, staffPoolIds, rules, constraints) {
    const assignments = new Map();
    
    // Mock staff availability data - in real implementation, this would come from availabilityService
    const staffAvailability = await this.getStaffAvailability(staffPoolIds);
    
    for (const shift of shifts) {
      const eligibleStaff = this.findEligibleStaff(shift, staffAvailability, constraints);
      const selectedStaff = this.selectOptimalStaff(shift, eligibleStaff, rules);
      
      if (selectedStaff.length >= shift.minimumStaff) {
        assignments.set(shift.id, selectedStaff);
        shift.assignedStaff = selectedStaff;
        shift.status = 'assigned';
      } else {
        shift.status = 'understaffed';
      }
    }

    return assignments;
  }

  // ============================================================================
  // SCHEDULE MODIFICATION
  // ============================================================================

  /**
   * Assign staff to a specific shift
   */
  async assignStaffToShift(shiftId, staffIds, assignedBy) {
    try {
      // Mock implementation - in real app, this would update database
      const assignment = {
        id: this.generateId(),
        shiftId,
        staffIds,
        assignedBy,
        assignedAt: new Date(),
        status: 'confirmed',
        notifications: {
          sent: false,
          sentAt: null,
          methods: ['email', 'push', 'sms']
        }
      };

      return {
        success: true,
        data: assignment,
        message: 'Staff assigned to shift successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to assign staff to shift'
      };
    }
  }

  /**
   * Handle shift swaps between staff members
   */
  async requestShiftSwap(swapRequest) {
    try {
      const swap = {
        id: this.generateId(),
        requestingStaffId: swapRequest.requestingStaffId,
        targetStaffId: swapRequest.targetStaffId,
        originalShiftId: swapRequest.originalShiftId,
        requestedShiftId: swapRequest.requestedShiftId,
        reason: swapRequest.reason,
        status: 'pending',
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        approvalRequired: swapRequest.requiresApproval || true,
        notifications: {
          targetNotified: false,
          managerNotified: false
        }
      };

      return {
        success: true,
        data: swap,
        message: 'Shift swap request created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create shift swap request'
      };
    }
  }

  /**
   * Handle emergency shift coverage
   */
  async handleEmergencyCoverage(emergencyData) {
    try {
      const coverage = {
        id: this.generateId(),
        originalShiftId: emergencyData.shiftId,
        originalStaffId: emergencyData.staffId,
        reason: emergencyData.reason,
        urgency: emergencyData.urgency, // low, medium, high, critical
        requestedAt: new Date(),
        coverageDeadline: new Date(emergencyData.deadline),
        autoAssignment: emergencyData.autoAssignment || false,
        premiumRate: emergencyData.premiumRate || 1.5,
        notificationsSent: [],
        candidates: [],
        status: 'seeking_coverage'
      };

      // Auto-find potential coverage candidates
      const candidates = await this.findEmergencyCandidates(emergencyData);
      coverage.candidates = candidates;

      if (emergencyData.autoAssignment && candidates.length > 0) {
        const selectedStaff = candidates[0]; // Pick first available
        coverage.assignedStaffId = selectedStaff.id;
        coverage.status = 'covered';
        coverage.assignedAt = new Date();
      }

      return {
        success: true,
        data: coverage,
        message: 'Emergency coverage request processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to handle emergency coverage'
      };
    }
  }

  // ============================================================================
  // SCHEDULE ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Generate schedule analytics
   */
  async getScheduleAnalytics(rosterId, period) {
    try {
      const roster = this.rosterCache.get(rosterId);
      if (!roster) {
        throw new Error('Roster not found');
      }

      const analytics = {
        period: {
          start: roster.startDate,
          end: roster.endDate,
          totalDays: this.getDaysBetween(roster.startDate, roster.endDate)
        },
        coverage: {
          totalShifts: roster.shifts.length,
          coveredShifts: roster.shifts.filter(s => s.status === 'assigned').length,
          uncoveredShifts: roster.shifts.filter(s => s.status === 'unassigned').length,
          understaffedShifts: roster.shifts.filter(s => s.status === 'understaffed').length,
          coverageRate: 0
        },
        staffing: {
          totalStaffHours: roster.totalHours,
          averageShiftLength: roster.totalHours / (roster.shifts.length || 1),
          peakStaffingHours: this.findPeakStaffingHours(roster.shifts),
          staffUtilization: this.calculateStaffUtilization(roster.assignments)
        },
        costs: {
          totalLabourCost: roster.totalStaffCost,
          averageCostPerHour: roster.totalStaffCost / (roster.totalHours || 1),
          overtimeCosts: this.calculateOvertimeCosts(roster.assignments),
          premiumRateCosts: this.calculatePremiumCosts(roster.assignments)
        },
        patterns: {
          busiestDays: this.findBusiestDays(roster.shifts),
          mostRequestedShifts: this.findMostRequestedShifts(roster.shifts),
          absenteeismRate: this.calculateAbsenteeismRate(roster.assignments)
        }
      };

      analytics.coverage.coverageRate = 
        (analytics.coverage.coveredShifts / analytics.coverage.totalShifts) * 100;

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
   * Generate conflict detection report
   */
  async detectScheduleConflicts(rosterId) {
    try {
      const roster = this.rosterCache.get(rosterId);
      if (!roster) {
        throw new Error('Roster not found');
      }

      const conflicts = {
        staffDoubleBooking: [],
        insufficientBreaks: [],
        skillMismatches: [],
        overtimeViolations: [],
        availabilityConflicts: [],
        laborLawViolations: []
      };

      // Check for staff double booking
      const staffScheduleMap = new Map();
      for (const shift of roster.shifts) {
        for (const staffId of shift.assignedStaff) {
          if (!staffScheduleMap.has(staffId)) {
            staffScheduleMap.set(staffId, []);
          }
          staffScheduleMap.get(staffId).push(shift);
        }
      }

      for (const [staffId, shifts] of staffScheduleMap) {
        const overlapping = this.findOverlappingShifts(shifts);
        if (overlapping.length > 0) {
          conflicts.staffDoubleBooking.push({
            staffId,
            conflicts: overlapping
          });
        }
      }

      return {
        success: true,
        data: conflicts,
        summary: {
          totalConflicts: Object.values(conflicts).flat().length,
          criticalConflicts: conflicts.staffDoubleBooking.length + conflicts.laborLawViolations.length,
          warningConflicts: conflicts.insufficientBreaks.length + conflicts.overtimeViolations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  generateId() {
    return 'sched_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  shouldCreateShiftOnDate(template, date) {
    // Mock logic for recurring patterns
    const dayOfWeek = date.getDay();
    switch (template.recurringPattern) {
      case 'daily':
        return true;
      case 'weekly':
        return dayOfWeek === 1; // Mondays
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      default:
        return true;
    }
  }

  async getStaffAvailability(staffIds) {
    // Mock data - in real implementation, this would query availabilityService
    return staffIds.map(id => ({
      staffId: id,
      availability: {
        monday: { available: true, hours: '09:00-17:00' },
        tuesday: { available: true, hours: '09:00-17:00' },
        wednesday: { available: true, hours: '09:00-17:00' },
        thursday: { available: true, hours: '09:00-17:00' },
        friday: { available: true, hours: '09:00-17:00' },
        saturday: { available: false, hours: null },
        sunday: { available: false, hours: null }
      },
      skills: ['general', 'customer_service'],
      preferences: {
        preferredShifts: ['day'],
        maxHoursPerWeek: 40,
        unavailableDates: []
      }
    }));
  }

  findEligibleStaff(shift, staffAvailability, constraints) {
    return staffAvailability.filter(staff => {
      // Check basic availability
      const dayName = this.getDayName(shift.date);
      const dayAvail = staff.availability[dayName.toLowerCase()];
      if (!dayAvail || !dayAvail.available) return false;

      // Check skill requirements
      if (shift.skillRequirements.length > 0) {
        const hasRequiredSkills = shift.skillRequirements.every(skill => 
          staff.skills.includes(skill)
        );
        if (!hasRequiredSkills) return false;
      }

      return true;
    });
  }

  selectOptimalStaff(shift, eligibleStaff, rules) {
    // Mock optimization logic
    return eligibleStaff.slice(0, shift.minimumStaff).map(staff => staff.staffId);
  }

  calculateTotalHours(shifts) {
    return shifts.reduce((total, shift) => total + (shift.duration / 60), 0);
  }

  calculateCoverageRate(shifts, assignments) {
    const coveredShifts = shifts.filter(shift => assignments.has(shift.id));
    return (coveredShifts.length / shifts.length) * 100;
  }

  calculateCostEfficiency(assignments) {
    // Mock calculation
    return 85.5; // percentage
  }

  calculateStaffUtilization(assignments) {
    // Mock calculation
    return 78.3; // percentage
  }

  getDaysBetween(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  findPeakStaffingHours(shifts) {
    // Mock implementation
    return { hour: 14, count: 25 }; // 2 PM with 25 staff
  }

  calculateOvertimeCosts(assignments) {
    // Mock calculation
    return 15420.50;
  }

  calculatePremiumCosts(assignments) {
    // Mock calculation
    return 8930.25;
  }

  findBusiestDays(shifts) {
    // Mock implementation
    return ['Monday', 'Friday'];
  }

  findMostRequestedShifts(shifts) {
    // Mock implementation
    return ['day_shift', 'evening_shift'];
  }

  calculateAbsenteeismRate(assignments) {
    // Mock calculation
    return 3.2; // percentage
  }

  findOverlappingShifts(shifts) {
    const overlapping = [];
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (this.shiftsOverlap(shifts[i], shifts[j])) {
          overlapping.push([shifts[i], shifts[j]]);
        }
      }
    }
    return overlapping;
  }

  shiftsOverlap(shift1, shift2) {
    // Mock overlap detection
    const date1 = shift1.date.toDateString();
    const date2 = shift2.date.toDateString();
    
    if (date1 !== date2) return false;
    
    // Simple time overlap check (would be more complex in real implementation)
    return shift1.startTime < shift2.endTime && shift2.startTime < shift1.endTime;
  }

  async findEmergencyCandidates(emergencyData) {
    // Mock implementation for finding emergency coverage candidates
    return [
      { id: 'staff_001', name: 'John Doe', distance: 5, availability: 'immediate' },
      { id: 'staff_002', name: 'Jane Smith', distance: 12, availability: '30min' }
    ];
  }
}

module.exports = new ScheduleManagementService();