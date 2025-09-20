const { Op } = require('sequelize');

/**
 * Availability Management Service
 * Handles employee availability preferences, constraints, and scheduling rules
 * Developed by: MiniMax Agent
 * Version: 6.0.0
 */

class AvailabilityService {
  constructor() {
    this.availabilityProfiles = new Map();
    this.timeOffRequests = new Map();
    this.availabilityConstraints = new Map();
    this.recurringAvailability = new Map();
  }

  // ============================================================================
  // AVAILABILITY PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Create or update staff availability profile
   */
  async createAvailabilityProfile(profileData) {
    try {
      const {
        staffId,
        weeklyAvailability,
        preferences,
        constraints,
        effectiveDate
      } = profileData;

      const profile = {
        id: this.generateId(),
        staffId,
        effectiveDate: new Date(effectiveDate || Date.now()),
        weeklyAvailability: {
          monday: {
            available: weeklyAvailability.monday?.available || false,
            startTime: weeklyAvailability.monday?.startTime || null,
            endTime: weeklyAvailability.monday?.endTime || null,
            breakPreference: weeklyAvailability.monday?.breakPreference || null
          },
          tuesday: {
            available: weeklyAvailability.tuesday?.available || false,
            startTime: weeklyAvailability.tuesday?.startTime || null,
            endTime: weeklyAvailability.tuesday?.endTime || null,
            breakPreference: weeklyAvailability.tuesday?.breakPreference || null
          },
          wednesday: {
            available: weeklyAvailability.wednesday?.available || false,
            startTime: weeklyAvailability.wednesday?.startTime || null,
            endTime: weeklyAvailability.wednesday?.endTime || null,
            breakPreference: weeklyAvailability.wednesday?.breakPreference || null
          },
          thursday: {
            available: weeklyAvailability.thursday?.available || false,
            startTime: weeklyAvailability.thursday?.startTime || null,
            endTime: weeklyAvailability.thursday?.endTime || null,
            breakPreference: weeklyAvailability.thursday?.breakPreference || null
          },
          friday: {
            available: weeklyAvailability.friday?.available || false,
            startTime: weeklyAvailability.friday?.startTime || null,
            endTime: weeklyAvailability.friday?.endTime || null,
            breakPreference: weeklyAvailability.friday?.breakPreference || null
          },
          saturday: {
            available: weeklyAvailability.saturday?.available || false,
            startTime: weeklyAvailability.saturday?.startTime || null,
            endTime: weeklyAvailability.saturday?.endTime || null,
            breakPreference: weeklyAvailability.saturday?.breakPreference || null
          },
          sunday: {
            available: weeklyAvailability.sunday?.available || false,
            startTime: weeklyAvailability.sunday?.startTime || null,
            endTime: weeklyAvailability.sunday?.endTime || null,
            breakPreference: weeklyAvailability.sunday?.breakPreference || null
          }
        },
        preferences: {
          maxHoursPerDay: preferences?.maxHoursPerDay || 8,
          maxHoursPerWeek: preferences?.maxHoursPerWeek || 40,
          minHoursBetweenShifts: preferences?.minHoursBetweenShifts || 10,
          preferredShiftTypes: preferences?.preferredShiftTypes || ['day'],
          maxConsecutiveDays: preferences?.maxConsecutiveDays || 5,
          preferredLocations: preferences?.preferredLocations || [],
          overtimeWillingness: preferences?.overtimeWillingness || 'sometimes',
          weekendAvailability: preferences?.weekendAvailability || 'limited',
          holidayAvailability: preferences?.holidayAvailability || 'unavailable',
          nightShiftWillingness: preferences?.nightShiftWillingness || 'no',
          travelWillingness: preferences?.travelWillingness || 'local_only'
        },
        constraints: {
          schoolSchedule: constraints?.schoolSchedule || null,
          childcareNeeds: constraints?.childcareNeeds || null,
          secondJobSchedule: constraints?.secondJobSchedule || null,
          medicalAppointments: constraints?.medicalAppointments || [],
          transportationLimits: constraints?.transportationLimits || null,
          religiousObservances: constraints?.religiousObservances || [],
          legalRestrictions: constraints?.legalRestrictions || []
        },
        notifications: {
          scheduleChanges: preferences?.notifications?.scheduleChanges !== false,
          newShiftOffers: preferences?.notifications?.newShiftOffers !== false,
          shiftReminders: preferences?.notifications?.shiftReminders !== false,
          overtimeOpportunities: preferences?.notifications?.overtimeOpportunities !== false
        },
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
        notes: profileData.notes || ''
      };

      // Validate availability profile
      const validation = this.validateAvailabilityProfile(profile);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid availability profile',
          validationErrors: validation.errors,
          message: 'Please fix the validation errors and try again'
        };
      }

      this.availabilityProfiles.set(profile.id, profile);

      return {
        success: true,
        data: profile,
        message: 'Availability profile created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create availability profile'
      };
    }
  }

  /**
   * Get availability profile for a staff member
   */
  async getStaffAvailability(staffId, date = null) {
    try {
      const profiles = Array.from(this.availabilityProfiles.values())
        .filter(p => p.staffId === staffId && p.status === 'active')
        .sort((a, b) => b.effectiveDate - a.effectiveDate);

      if (profiles.length === 0) {
        return {
          success: false,
          error: 'No availability profile found',
          message: 'Staff member has no availability profile on record'
        };
      }

      const currentProfile = profiles[0];
      
      // Get time off requests for the specified date or period
      const timeOffRequests = date ? 
        await this.getTimeOffForDate(staffId, date) : 
        await this.getUpcomingTimeOff(staffId);

      // Get any special availability overrides
      const overrides = await this.getAvailabilityOverrides(staffId, date);

      return {
        success: true,
        data: {
          profile: currentProfile,
          timeOff: timeOffRequests,
          overrides: overrides,
          computedAvailability: date ? 
            this.computeAvailabilityForDate(currentProfile, date, timeOffRequests, overrides) :
            currentProfile.weeklyAvailability
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve staff availability'
      };
    }
  }

  /**
   * Bulk get availability for multiple staff members
   */
  async getBulkStaffAvailability(staffIds, startDate, endDate) {
    try {
      const results = {};
      
      for (const staffId of staffIds) {
        const availability = await this.getStaffAvailability(staffId);
        if (availability.success) {
          // Get detailed availability for date range
          const dateRange = this.getDateRange(startDate, endDate);
          const detailedAvailability = {};
          
          for (const date of dateRange) {
            detailedAvailability[date.toISOString().split('T')[0]] = 
              this.computeAvailabilityForDate(
                availability.data.profile, 
                date, 
                availability.data.timeOff, 
                availability.data.overrides
              );
          }
          
          results[staffId] = {
            profile: availability.data.profile,
            dateAvailability: detailedAvailability,
            summary: this.summarizeAvailabilityForPeriod(detailedAvailability)
          };
        } else {
          results[staffId] = {
            error: availability.error,
            available: false
          };
        }
      }

      return {
        success: true,
        data: results,
        period: { startDate, endDate }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bulk staff availability'
      };
    }
  }

  // ============================================================================
  // TIME OFF MANAGEMENT
  // ============================================================================

  /**
   * Submit a time off request
   */
  async submitTimeOffRequest(requestData) {
    try {
      const {
        staffId,
        startDate,
        endDate,
        type,
        reason,
        isPartialDay,
        partialDayTimes
      } = requestData;

      const request = {
        id: this.generateId(),
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type, // vacation, sick, personal, bereavement, jury_duty, etc.
        reason: reason || '',
        isPartialDay: isPartialDay || false,
        partialDayTimes: partialDayTimes || null, // { startTime, endTime }
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        daysRequested: this.calculateBusinessDays(new Date(startDate), new Date(endDate)),
        hoursRequested: this.calculateHoursRequested(
          new Date(startDate), 
          new Date(endDate), 
          isPartialDay, 
          partialDayTimes
        ),
        conflictsDetected: [],
        coverageRequired: requestData.coverageRequired || false,
        coverageArranged: false,
        coverageAssignments: [],
        priority: this.determinePriority(type, new Date(startDate)),
        notes: requestData.notes || '',
        attachments: requestData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check for conflicts
      await this.detectTimeOffConflicts(request);

      this.timeOffRequests.set(request.id, request);

      // Auto-approve certain types of requests
      if (this.shouldAutoApprove(request)) {
        await this.approveTimeOffRequest(request.id, 'system_auto_approval');
      }

      return {
        success: true,
        data: request,
        message: 'Time off request submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit time off request'
      };
    }
  }

  /**
   * Approve time off request
   */
  async approveTimeOffRequest(requestId, approvedBy, notes = '') {
    try {
      const request = this.timeOffRequests.get(requestId);
      if (!request) {
        throw new Error('Time off request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request cannot be approved in its current status');
      }

      request.status = 'approved';
      request.reviewedAt = new Date();
      request.reviewedBy = approvedBy;
      request.approvedAt = new Date();
      request.approvalNotes = notes;
      request.updatedAt = new Date();

      return {
        success: true,
        data: request,
        message: 'Time off request approved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to approve time off request'
      };
    }
  }

  /**
   * Reject time off request
   */
  async rejectTimeOffRequest(requestId, rejectedBy, reason) {
    try {
      const request = this.timeOffRequests.get(requestId);
      if (!request) {
        throw new Error('Time off request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request cannot be rejected in its current status');
      }

      request.status = 'rejected';
      request.reviewedAt = new Date();
      request.reviewedBy = rejectedBy;
      request.rejectedAt = new Date();
      request.rejectionReason = reason;
      request.updatedAt = new Date();

      return {
        success: true,
        data: request,
        message: 'Time off request rejected'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to reject time off request'
      };
    }
  }

  // ============================================================================
  // AVAILABILITY OVERRIDE MANAGEMENT
  // ============================================================================

  /**
   * Create temporary availability override
   */
  async createAvailabilityOverride(overrideData) {
    try {
      const {
        staffId,
        startDate,
        endDate,
        overrideType,
        availability,
        reason
      } = overrideData;

      const override = {
        id: this.generateId(),
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: overrideType, // temporary_unavailable, temporary_available, schedule_change
        availability: availability, // modified availability for the period
        reason: reason,
        priority: overrideData.priority || 'normal',
        status: 'active',
        createdAt: new Date(),
        createdBy: overrideData.createdBy,
        expiresAt: endDate ? new Date(endDate) : null,
        notes: overrideData.notes || ''
      };

      const overrideId = this.generateId();
      this.availabilityConstraints.set(overrideId, override);

      return {
        success: true,
        data: override,
        message: 'Availability override created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create availability override'
      };
    }
  }

  // ============================================================================
  // AVAILABILITY MATCHING & OPTIMIZATION
  // ============================================================================

  /**
   * Find available staff for specific shift requirements
   */
  async findAvailableStaff(shiftRequirements) {
    try {
      const {
        date,
        startTime,
        endTime,
        skillsRequired,
        location,
        minimumStaff,
        excludeStaffIds
      } = shiftRequirements;

      const allProfiles = Array.from(this.availabilityProfiles.values())
        .filter(p => p.status === 'active');

      const availableStaff = [];

      for (const profile of allProfiles) {
        if (excludeStaffIds && excludeStaffIds.includes(profile.staffId)) {
          continue;
        }

        const availability = await this.getStaffAvailability(profile.staffId, date);
        if (!availability.success) continue;

        const isAvailable = this.checkStaffAvailabilityForShift(
          availability.data.computedAvailability,
          { date, startTime, endTime }
        );

        if (isAvailable) {
          const staffMatch = {
            staffId: profile.staffId,
            availability: availability.data.computedAvailability,
            matchScore: this.calculateMatchScore(profile, shiftRequirements),
            preferenceMatch: this.calculatePreferenceMatch(profile, shiftRequirements),
            constraints: this.getActiveConstraints(profile.staffId, date),
            workloadScore: await this.calculateWorkloadScore(profile.staffId, date)
          };

          availableStaff.push(staffMatch);
        }
      }

      // Sort by match score (highest first)
      availableStaff.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        data: {
          availableStaff: availableStaff,
          totalFound: availableStaff.length,
          minimumMet: availableStaff.length >= minimumStaff,
          recommendations: this.generateStaffingRecommendations(availableStaff, shiftRequirements)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to find available staff'
      };
    }
  }

  /**
   * Generate availability conflict report
   */
  async generateAvailabilityReport(reportParams) {
    try {
      const {
        staffIds,
        startDate,
        endDate,
        includeTimeOff,
        includeConstraints
      } = reportParams;

      const report = {
        reportId: this.generateId(),
        generatedAt: new Date(),
        period: { startDate, endDate },
        staffCoverage: {},
        timeOffSummary: {},
        availabilityGaps: [],
        recommendations: []
      };

      // Analyze each staff member's availability
      for (const staffId of staffIds) {
        const availability = await this.getStaffAvailability(staffId);
        if (availability.success) {
          report.staffCoverage[staffId] = {
            profile: availability.data.profile,
            totalAvailableHours: this.calculateTotalAvailableHours(
              availability.data.profile.weeklyAvailability
            ),
            constraints: availability.data.profile.constraints,
            preferences: availability.data.profile.preferences
          };

          if (includeTimeOff) {
            const timeOff = await this.getTimeOffForPeriod(staffId, startDate, endDate);
            report.timeOffSummary[staffId] = timeOff;
          }
        }
      }

      // Identify availability gaps
      report.availabilityGaps = this.identifyAvailabilityGaps(report.staffCoverage);

      // Generate recommendations
      report.recommendations = this.generateAvailabilityRecommendations(report);

      return {
        success: true,
        data: report,
        message: 'Availability report generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate availability report'
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  validateAvailabilityProfile(profile) {
    const errors = [];

    // Check weekly availability consistency
    for (const [day, avail] of Object.entries(profile.weeklyAvailability)) {
      if (avail.available && (!avail.startTime || !avail.endTime)) {
        errors.push(`${day}: Start and end times required when available`);
      }
      if (avail.startTime && avail.endTime && avail.startTime >= avail.endTime) {
        errors.push(`${day}: Start time must be before end time`);
      }
    }

    // Check preference constraints
    if (profile.preferences.maxHoursPerDay > 24) {
      errors.push('Maximum hours per day cannot exceed 24');
    }
    if (profile.preferences.maxHoursPerWeek > 168) {
      errors.push('Maximum hours per week cannot exceed 168');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  computeAvailabilityForDate(profile, date, timeOffRequests, overrides) {
    const dayName = this.getDayName(date).toLowerCase();
    let baseAvailability = profile.weeklyAvailability[dayName];

    // Check for time off
    const dateString = date.toISOString().split('T')[0];
    const hasTimeOff = timeOffRequests.some(request => 
      request.status === 'approved' &&
      request.startDate <= date && 
      request.endDate >= date
    );

    if (hasTimeOff) {
      return { available: false, reason: 'time_off' };
    }

    // Apply overrides
    const activeOverrides = overrides.filter(override => 
      override.startDate <= date && 
      override.endDate >= date &&
      override.status === 'active'
    );

    if (activeOverrides.length > 0) {
      const override = activeOverrides[0]; // Use first override if multiple
      baseAvailability = override.availability;
    }

    return baseAvailability;
  }

  async getTimeOffForDate(staffId, date) {
    const requests = Array.from(this.timeOffRequests.values())
      .filter(r => 
        r.staffId === staffId &&
        r.status === 'approved' &&
        r.startDate <= date &&
        r.endDate >= date
      );
    return requests;
  }

  async getUpcomingTimeOff(staffId, days = 30) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const requests = Array.from(this.timeOffRequests.values())
      .filter(r => 
        r.staffId === staffId &&
        (r.status === 'approved' || r.status === 'pending') &&
        r.startDate <= cutoffDate
      );
    return requests;
  }

  async getAvailabilityOverrides(staffId, date) {
    const overrides = Array.from(this.availabilityConstraints.values())
      .filter(o => o.staffId === staffId);
    
    if (date) {
      return overrides.filter(o => 
        o.startDate <= date && 
        (!o.endDate || o.endDate >= date) &&
        o.status === 'active'
      );
    }
    
    return overrides.filter(o => o.status === 'active');
  }

  getDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  summarizeAvailabilityForPeriod(dateAvailability) {
    const totalDays = Object.keys(dateAvailability).length;
    const availableDays = Object.values(dateAvailability)
      .filter(avail => avail.available).length;
    
    return {
      totalDays,
      availableDays,
      unavailableDays: totalDays - availableDays,
      availabilityRate: (availableDays / totalDays) * 100
    };
  }

  async detectTimeOffConflicts(request) {
    // Check for existing approved requests that overlap
    const existingRequests = Array.from(this.timeOffRequests.values())
      .filter(r => 
        r.staffId === request.staffId &&
        r.status === 'approved' &&
        this.datesOverlap(r.startDate, r.endDate, request.startDate, request.endDate)
      );

    if (existingRequests.length > 0) {
      request.conflictsDetected.push({
        type: 'existing_time_off',
        description: 'Overlaps with existing approved time off',
        conflictingRequests: existingRequests.map(r => r.id)
      });
    }

    // Check for scheduled shifts during the time off period
    // This would integrate with schedule management service in real implementation
    const scheduledShifts = []; // Mock data
    if (scheduledShifts.length > 0) {
      request.conflictsDetected.push({
        type: 'scheduled_shifts',
        description: 'Conflicts with scheduled shifts',
        conflictingShifts: scheduledShifts
      });
    }
  }

  calculateBusinessDays(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  calculateHoursRequested(startDate, endDate, isPartialDay, partialDayTimes) {
    if (isPartialDay && partialDayTimes) {
      // Calculate hours for partial day
      const start = new Date(`1970-01-01T${partialDayTimes.startTime}:00`);
      const end = new Date(`1970-01-01T${partialDayTimes.endTime}:00`);
      return (end - start) / (1000 * 60 * 60);
    }
    
    // Calculate full days (assuming 8 hours per day)
    const businessDays = this.calculateBusinessDays(startDate, endDate);
    return businessDays * 8;
  }

  determinePriority(type, startDate) {
    const daysFromNow = (startDate - new Date()) / (1000 * 60 * 60 * 24);
    
    if (['sick', 'emergency'].includes(type)) return 'high';
    if (daysFromNow < 7) return 'urgent';
    if (daysFromNow < 30) return 'normal';
    return 'low';
  }

  shouldAutoApprove(request) {
    // Auto-approve sick days under 3 days and advance requests
    const daysDifference = (request.startDate - new Date()) / (1000 * 60 * 60 * 24);
    return (request.type === 'sick' && request.daysRequested <= 3) ||
           (daysDifference > 14 && request.daysRequested <= 1);
  }

  checkStaffAvailabilityForShift(availability, shift) {
    if (!availability.available) return false;
    
    // Check if shift times fall within available hours
    return availability.startTime <= shift.startTime && 
           availability.endTime >= shift.endTime;
  }

  calculateMatchScore(profile, requirements) {
    let score = 100;
    
    // Deduct points for preference mismatches
    if (requirements.location && 
        !profile.preferences.preferredLocations.includes(requirements.location)) {
      score -= 10;
    }
    
    // Add points for skill matches
    if (requirements.skillsRequired) {
      // This would check against staff skills in real implementation
      score += 5;
    }
    
    return Math.max(0, score);
  }

  calculatePreferenceMatch(profile, requirements) {
    // Mock calculation of how well the shift matches staff preferences
    return 85.0; // percentage
  }

  getActiveConstraints(staffId, date) {
    // Mock implementation
    return [];
  }

  async calculateWorkloadScore(staffId, date) {
    // Mock calculation of current workload
    return 65.0; // percentage of capacity
  }

  generateStaffingRecommendations(availableStaff, requirements) {
    const recommendations = [];
    
    if (availableStaff.length < requirements.minimumStaff) {
      recommendations.push({
        type: 'insufficient_staff',
        message: 'Not enough available staff for this shift',
        severity: 'high'
      });
    }
    
    const highScoreStaff = availableStaff.filter(s => s.matchScore > 90);
    if (highScoreStaff.length > 0) {
      recommendations.push({
        type: 'optimal_matches',
        message: `${highScoreStaff.length} staff members are excellent matches`,
        severity: 'info'
      });
    }
    
    return recommendations;
  }

  calculateTotalAvailableHours(weeklyAvailability) {
    let totalHours = 0;
    
    for (const day of Object.values(weeklyAvailability)) {
      if (day.available && day.startTime && day.endTime) {
        const start = new Date(`1970-01-01T${day.startTime}:00`);
        const end = new Date(`1970-01-01T${day.endTime}:00`);
        totalHours += (end - start) / (1000 * 60 * 60);
      }
    }
    
    return totalHours;
  }

  async getTimeOffForPeriod(staffId, startDate, endDate) {
    return Array.from(this.timeOffRequests.values())
      .filter(r => 
        r.staffId === staffId &&
        r.status === 'approved' &&
        this.datesOverlap(r.startDate, r.endDate, new Date(startDate), new Date(endDate))
      );
  }

  identifyAvailabilityGaps(staffCoverage) {
    const gaps = [];
    
    // Mock gap detection
    gaps.push({
      timeSlot: 'Monday 9:00-12:00',
      availableStaff: 2,
      requiredStaff: 5,
      gap: 3,
      severity: 'high'
    });
    
    return gaps;
  }

  generateAvailabilityRecommendations(report) {
    const recommendations = [];
    
    if (report.availabilityGaps.length > 0) {
      recommendations.push({
        type: 'recruit_additional_staff',
        message: 'Consider recruiting additional staff for high-gap time slots',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  datesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1;
  }

  getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  generateId() {
    return 'avail_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

module.exports = new AvailabilityService();