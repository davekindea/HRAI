import api from './api';

export const jobService = {
  // Public job endpoints
  getPublicJobs: async (params = {}) => {
    const response = await api.get('/jobs/public', { params });
    return response.data;
  },

  getPublicJobById: async (id) => {
    const response = await api.get(`/jobs/public/${id}`);
    return response.data;
  },

  // Admin job endpoints
  getJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  deleteJob: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  getJobStats: async () => {
    const response = await api.get('/jobs/stats/overview');
    return response.data;
  },
};

export const applicationService = {
  applyForJob: async (jobId, applicationData) => {
    const formData = new FormData();
    formData.append('coverLetter', applicationData.coverLetter);
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    
    const response = await api.post(`/applications/apply/${jobId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyApplications: async (params = {}) => {
    const response = await api.get('/applications/my-applications', { params });
    return response.data;
  },

  getApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  updateApplicationStatus: async (id, statusData) => {
    const response = await api.put(`/applications/${id}/status`, statusData);
    return response.data;
  },

  bulkUpdateApplications: async (applicationData) => {
    const response = await api.put('/applications/bulk/status', applicationData);
    return response.data;
  },

  getApplicationStats: async (params = {}) => {
    const response = await api.get('/applications/stats/overview', { params });
    return response.data;
  },
};

export const candidateService = {
  getCandidates: async (params = {}) => {
    const response = await api.get('/candidates', { params });
    return response.data;
  },

  getCandidateById: async (id) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  updateCandidateStatus: async (id, statusData) => {
    const response = await api.put(`/candidates/${id}/status`, statusData);
    return response.data;
  },

  searchCandidates: async (searchCriteria) => {
    const response = await api.post('/candidates/search', searchCriteria);
    return response.data;
  },

  getCandidateStats: async () => {
    const response = await api.get('/candidates/stats/overview');
    return response.data;
  },
};

export const analyticsService = {
  getOverview: async (params = {}) => {
    const response = await api.get('/analytics/overview', { params });
    return response.data;
  },

  getFunnelAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/funnel', { params });
    return response.data;
  },

  getSourceAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/sources', { params });
    return response.data;
  },

  getDepartmentAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/departments', { params });
    return response.data;
  },

  getSkillAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/skills', { params });
    return response.data;
  },

  getRecruiterAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/recruiters', { params });
    return response.data;
  },

  getAIInsights: async (params = {}) => {
    const response = await api.get('/analytics/ai-insights', { params });
    return response.data;
  },
};

export const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (id, statusData) => {
    const response = await api.put(`/admin/users/${id}/status`, statusData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSetting: async (key, value) => {
    const response = await api.put(`/admin/settings/${key}`, { value });
    return response.data;
  },

  getEmailTemplates: async () => {
    const response = await api.get('/admin/email-templates');
    return response.data;
  },

  createEmailTemplate: async (templateData) => {
    const response = await api.post('/admin/email-templates', templateData);
    return response.data;
  },

  updateEmailTemplate: async (id, templateData) => {
    const response = await api.put(`/admin/email-templates/${id}`, templateData);
    return response.data;
  },

  getDashboardData: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
};