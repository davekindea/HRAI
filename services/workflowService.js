const WorkflowService = {
  // Workflow Rules & Role-based Permissions
  async getWorkflowRules() {
    try {
      const workflowRules = {
        jobCreation: {
          roles: {
            recruiter: {
              permissions: ['create_draft', 'edit_draft', 'submit_for_approval'],
              restrictions: ['cannot_publish', 'cannot_delete_published']
            },
            hiring_manager: {
              permissions: ['create_job', 'edit_job', 'approve_job', 'publish_job'],
              restrictions: ['cannot_delete_others_jobs']
            },
            hr_admin: {
              permissions: ['all_permissions'],
              restrictions: []
            },
            client: {
              permissions: ['view_assigned_jobs', 'provide_feedback'],
              restrictions: ['cannot_edit', 'cannot_create']
            }
          },
          stages: ['draft', 'review', 'approved', 'published', 'active', 'closed'],
          transitions: {
            draft: ['review', 'delete'],
            review: ['approved', 'needs_revision', 'rejected'],
            approved: ['published', 'needs_revision'],
            published: ['active'],
            active: ['on_hold', 'closed'],
            on_hold: ['active', 'closed'],
            closed: ['archived']
          }
        }
      };

      return { success: true, workflowRules };
    } catch (error) {
      console.error('Error fetching workflow rules:', error);
      return { success: false, error: error.message };
    }
  },

  async validatePermission(userId, userRole, action, resourceId) {
    try {
      console.log(`Validating permission for user ${userId} to perform ${action}`);
      
      // Simulate permission validation
      const permissions = {
        hr_admin: ['all'],
        hiring_manager: ['create_job', 'edit_job', 'approve_job', 'view_all'],
        recruiter: ['create_draft', 'edit_own', 'view_assigned'],
        client: ['view_assigned', 'provide_feedback']
      };

      const userPermissions = permissions[userRole] || [];
      const hasPermission = userPermissions.includes('all') || userPermissions.includes(action);

      return { success: true, hasPermission, userRole };
    } catch (error) {
      console.error('Error validating permission:', error);
      return { success: false, error: error.message };
    }
  },

  // Job Version Control
  async createJobVersion(jobId, changes, userId) {
    try {
      const version = {
        id: Date.now().toString(),
        jobId,
        versionNumber: await this.getNextVersionNumber(jobId),
        changes,
        changedBy: userId,
        timestamp: new Date().toISOString(),
        changeType: this.categorizeChanges(changes)
      };

      console.log(`Created version ${version.versionNumber} for job ${jobId}`);
      return { success: true, version };
    } catch (error) {
      console.error('Error creating job version:', error);
      return { success: false, error: error.message };
    }
  },

  async getJobVersionHistory(jobId) {
    try {
      // Simulate version history
      const versions = [
        {
          id: 'v1',
          versionNumber: 1,
          changes: 'Initial job creation',
          changedBy: 'hr_admin_1',
          timestamp: '2025-09-15T10:00:00Z',
          changeType: 'creation'
        },
        {
          id: 'v2',
          versionNumber: 2,
          changes: 'Updated salary range and requirements',
          changedBy: 'hiring_manager_1',
          timestamp: '2025-09-16T14:30:00Z',
          changeType: 'major_update'
        },
        {
          id: 'v3',
          versionNumber: 3,
          changes: 'Minor typo corrections',
          changedBy: 'recruiter_1',
          timestamp: '2025-09-17T09:15:00Z',
          changeType: 'minor_update'
        }
      ];

      return { success: true, versions };
    } catch (error) {
      console.error('Error fetching job version history:', error);
      return { success: false, error: error.message };
    }
  },

  async getNextVersionNumber(jobId) {
    // Simulate getting next version number
    return Math.floor(Math.random() * 10) + 1;
  },

  categorizeChanges(changes) {
    // Categorize the type of changes made
    const majorFields = ['title', 'salary', 'requirements', 'responsibilities'];
    const changesArray = Array.isArray(changes) ? changes : [changes];
    
    const hasMajorChanges = changesArray.some(change => 
      majorFields.some(field => change.toLowerCase().includes(field))
    );
    
    return hasMajorChanges ? 'major_update' : 'minor_update';
  },

  // Job Inventory Management
  async getJobInventory(filters = {}) {
    try {
      // Simulate job inventory with various statuses
      const inventory = [
        {
          id: 'job_1',
          title: 'Senior Software Engineer',
          department: 'Technology',
          status: 'active',
          openPositions: 2,
          filledPositions: 0,
          applicants: 45,
          daysOpen: 12,
          priority: 'high'
        },
        {
          id: 'job_2',
          title: 'Marketing Manager',
          department: 'Marketing',
          status: 'on_hold',
          openPositions: 1,
          filledPositions: 0,
          applicants: 23,
          daysOpen: 8,
          priority: 'medium'
        },
        {
          id: 'job_3',
          title: 'Data Analyst',
          department: 'Analytics',
          status: 'closed',
          openPositions: 1,
          filledPositions: 1,
          applicants: 67,
          daysOpen: 25,
          priority: 'low'
        }
      ];

      // Apply filters
      let filteredInventory = inventory;
      if (filters.status) {
        filteredInventory = filteredInventory.filter(job => job.status === filters.status);
      }
      if (filters.department) {
        filteredInventory = filteredInventory.filter(job => job.department === filters.department);
      }

      return { success: true, inventory: filteredInventory };
    } catch (error) {
      console.error('Error fetching job inventory:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = WorkflowService;