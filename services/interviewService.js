const ical = require('ical-generator');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
const notificationService = require('./notificationService');

class InterviewSchedulingService {
  constructor() {
    this.calendarDir = path.join(__dirname, '../tmp/calendars');
    this.ensureCalendarDir();
  }

  async ensureCalendarDir() {
    try {
      await fs.mkdir(this.calendarDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create calendar directory:', error);
    }
  }

  // Schedule an interview
  async scheduleInterview(interviewData) {
    try {
      const {
        candidateId,
        jobId,
        interviewerId,
        date,
        time,
        duration = 60, // minutes
        type = 'video', // video, phone, in-person
        location,
        meetingLink,
        notes
      } = interviewData;

      // Create interview record
      const interview = {
        id: this.generateId(),
        candidateId,
        jobId,
        interviewerId,
        scheduledAt: `${date} ${time}`,
        duration,
        type,
        location,
        meetingLink,
        notes,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };

      // Generate calendar file
      const calendarFile = await this.generateCalendarFile(interview);
      interview.calendarFile = calendarFile;

      // Send notifications
      await this.sendInterviewNotifications(interview);

      return interview;
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      throw error;
    }
  }

  // Generate calendar file (.ics)
  async generateCalendarFile(interview) {
    try {
      const startTime = moment(`${interview.scheduledAt}`, 'YYYY-MM-DD HH:mm');
      const endTime = startTime.clone().add(interview.duration, 'minutes');

      const calendar = ical({
        name: 'Interview Calendar',
        prodId: { company: 'HR Platform', product: 'Interview Scheduler' }
      });

      const event = calendar.createEvent({
        start: startTime.toDate(),
        end: endTime.toDate(),
        summary: `Interview - ${interview.jobTitle || 'Position'}`,
        description: this.generateEventDescription(interview),
        location: interview.location || interview.meetingLink || 'TBD',
        url: interview.meetingLink,
        organizer: {
          name: interview.interviewerName || 'HR Team',
          email: interview.interviewerEmail || process.env.EMAIL_FROM
        },
        attendees: [
          {
            name: interview.candidateName || 'Candidate',
            email: interview.candidateEmail,
            status: 'needs-action'
          }
        ]
      });

      // Add reminders
      event.createAlarm({
        type: 'display',
        trigger: 60 * 15 // 15 minutes before
      });

      event.createAlarm({
        type: 'display',
        trigger: 60 * 60 * 24 // 1 day before
      });

      const filename = `interview_${interview.id}_${Date.now()}.ics`;
      const filepath = path.join(this.calendarDir, filename);
      
      await fs.writeFile(filepath, calendar.toString());
      
      return filepath;
    } catch (error) {
      console.error('Failed to generate calendar file:', error);
      return null;
    }
  }

  // Generate event description
  generateEventDescription(interview) {
    let description = `Interview Details:\n\n`;
    description += `Position: ${interview.jobTitle || 'TBD'}\n`;
    description += `Type: ${interview.type}\n`;
    description += `Duration: ${interview.duration} minutes\n`;
    
    if (interview.meetingLink) {
      description += `Meeting Link: ${interview.meetingLink}\n`;
    }
    
    if (interview.location) {
      description += `Location: ${interview.location}\n`;
    }
    
    if (interview.notes) {
      description += `\nNotes:\n${interview.notes}\n`;
    }
    
    description += `\nPlease be prepared with your questions and relevant documents.`;
    
    return description;
  }

  // Send interview notifications
  async sendInterviewNotifications(interview) {
    try {
      // Get candidate and job details (this would typically come from database)
      const candidate = await this.getCandidateDetails(interview.candidateId);
      const job = await this.getJobDetails(interview.jobId);
      const interviewer = await this.getInterviewerDetails(interview.interviewerId);

      // Prepare interview data for notifications
      const interviewDetails = {
        date: moment(interview.scheduledAt).format('MMMM DD, YYYY'),
        time: moment(interview.scheduledAt).format('h:mm A'),
        type: interview.type,
        meetingLink: interview.meetingLink,
        location: interview.location,
        interviewer: interviewer.name,
        calendarFile: interview.calendarFile
      };

      // Send to candidate
      await notificationService.sendInterviewInvitation(candidate, job, interviewDetails);

      // Send to interviewer
      await this.sendInterviewerNotification(interviewer, candidate, job, interviewDetails);

    } catch (error) {
      console.error('Failed to send interview notifications:', error);
    }
  }

  // Send notification to interviewer
  async sendInterviewerNotification(interviewer, candidate, job, interview) {
    const emailData = {
      interviewerName: interviewer.name,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      jobTitle: job.title,
      interviewDate: interview.date,
      interviewTime: interview.time,
      interviewType: interview.type,
      meetingLink: interview.meetingLink,
      location: interview.location
    };

    await notificationService.sendEmail({
      to: interviewer.email,
      subject: `Interview Scheduled: ${candidate.name} for ${job.title}`,
      template: 'interviewer_notification',
      data: emailData,
      attachments: interview.calendarFile ? [
        {
          filename: 'interview.ics',
          path: interview.calendarFile
        }
      ] : []
    });
  }

  // Reschedule interview
  async rescheduleInterview(interviewId, newDateTime, reason) {
    try {
      // Update interview record
      const interview = await this.getInterviewById(interviewId);
      const oldDateTime = interview.scheduledAt;
      
      interview.scheduledAt = newDateTime;
      interview.rescheduledAt = new Date().toISOString();
      interview.rescheduleReason = reason;

      // Generate new calendar file
      const calendarFile = await this.generateCalendarFile(interview);
      interview.calendarFile = calendarFile;

      // Send reschedule notifications
      await this.sendRescheduleNotifications(interview, oldDateTime);

      return interview;
    } catch (error) {
      console.error('Failed to reschedule interview:', error);
      throw error;
    }
  }

  // Cancel interview
  async cancelInterview(interviewId, reason) {
    try {
      const interview = await this.getInterviewById(interviewId);
      interview.status = 'cancelled';
      interview.cancelledAt = new Date().toISOString();
      interview.cancellationReason = reason;

      // Send cancellation notifications
      await this.sendCancellationNotifications(interview);

      return interview;
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      throw error;
    }
  }

  // Get available time slots
  async getAvailableTimeSlots(date, interviewerId) {
    try {
      // This would typically check interviewer's calendar and existing interviews
      const workingHours = {
        start: 9, // 9 AM
        end: 17,  // 5 PM
        duration: 60 // 60 minutes per slot
      };

      const slots = [];
      const startDate = moment(date).hour(workingHours.start).minute(0).second(0);
      const endDate = moment(date).hour(workingHours.end).minute(0).second(0);

      while (startDate.isBefore(endDate)) {
        const slotEnd = startDate.clone().add(workingHours.duration, 'minutes');
        
        // Check if slot is available (not booked)
        const isAvailable = await this.isTimeSlotAvailable(interviewerId, startDate, slotEnd);
        
        if (isAvailable) {
          slots.push({
            start: startDate.format('HH:mm'),
            end: slotEnd.format('HH:mm'),
            available: true
          });
        }

        startDate.add(workingHours.duration, 'minutes');
      }

      return slots;
    } catch (error) {
      console.error('Failed to get available time slots:', error);
      return [];
    }
  }

  // Check if time slot is available
  async isTimeSlotAvailable(interviewerId, startTime, endTime) {
    // This would check against existing interviews in database
    // For now, return true (all slots available)
    return true;
  }

  // Utility methods (these would typically interact with database)
  async getCandidateDetails(candidateId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: candidateId,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890'
    };
  }

  async getJobDetails(jobId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: jobId,
      title: 'Software Engineer',
      company: 'Tech Corp'
    };
  }

  async getInterviewerDetails(interviewerId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: interviewerId,
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      title: 'Senior HR Manager'
    };
  }

  async getInterviewById(interviewId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: interviewId,
      candidateId: 1,
      jobId: 1,
      interviewerId: 1,
      scheduledAt: '2024-01-15 14:00',
      duration: 60,
      type: 'video',
      status: 'scheduled'
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Send reschedule notifications
  async sendRescheduleNotifications(interview, oldDateTime) {
    // Implementation for reschedule notifications
    console.log(`Interview rescheduled from ${oldDateTime} to ${interview.scheduledAt}`);
  }

  // Send cancellation notifications
  async sendCancellationNotifications(interview) {
    // Implementation for cancellation notifications
    console.log(`Interview cancelled: ${interview.id}`);
  }
}

module.exports = new InterviewSchedulingService();
