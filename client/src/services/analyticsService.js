import api from './api';

// HR Dashboard Service
export const hrDashboardService = {
  getDashboardData: async (filters = {}) => {
    const response = await api.get('/hr-dashboard/overview', { params: filters });
    return response.data;
  },

  getMetrics: async (type, dateRange) => {
    const response = await api.get(`/hr-dashboard/metrics/${type}`, {
      params: { dateRange }
    });
    return response.data;
  },

  getKPIs: async (department) => {
    const response = await api.get('/hr-dashboard/kpis', {
      params: { department }
    });
    return response.data;
  },

  getCharts: async (chartType, filters) => {
    const response = await api.get(`/hr-dashboard/charts/${chartType}`, {
      params: filters
    });
    return response.data;
  },

  updateDashboardSettings: async (settings) => {
    const response = await api.put('/hr-dashboard/settings', settings);
    return response.data;
  }
};

// Report Builder Service
export const reportBuilderService = {
  getTemplates: async () => {
    const response = await api.get('/report-builder/templates');
    return response.data;
  },

  createReport: async (reportConfig) => {
    const response = await api.post('/report-builder/reports', reportConfig);
    return response.data;
  },

  getReport: async (reportId) => {
    const response = await api.get(`/report-builder/reports/${reportId}`);
    return response.data;
  },

  updateReport: async (reportId, reportConfig) => {
    const response = await api.put(`/report-builder/reports/${reportId}`, reportConfig);
    return response.data;
  },

  deleteReport: async (reportId) => {
    const response = await api.delete(`/report-builder/reports/${reportId}`);
    return response.data;
  },

  previewReport: async (reportConfig) => {
    const response = await api.post('/report-builder/preview', reportConfig);
    return response.data;
  },

  getDataSources: async () => {
    const response = await api.get('/report-builder/data-sources');
    return response.data;
  },

  getFieldOptions: async (dataSource) => {
    const response = await api.get(`/report-builder/fields/${dataSource}`);
    return response.data;
  }
};

// Performance Analytics Service
export const performanceAnalyticsService = {
  getPerformanceMetrics: async (filters) => {
    const response = await api.get('/performance-analytics/metrics', { params: filters });
    return response.data;
  },

  getRecruitmentTrends: async (period, granularity) => {
    const response = await api.get('/performance-analytics/trends/recruitment', {
      params: { period, granularity }
    });
    return response.data;
  },

  getSourceEffectiveness: async (dateRange) => {
    const response = await api.get('/performance-analytics/source-effectiveness', {
      params: { dateRange }
    });
    return response.data;
  },

  getConversionRates: async (pipeline, filters) => {
    const response = await api.get('/performance-analytics/conversion-rates', {
      params: { pipeline, ...filters }
    });
    return response.data;
  },

  getTimeToHire: async (department, role) => {
    const response = await api.get('/performance-analytics/time-to-hire', {
      params: { department, role }
    });
    return response.data;
  },

  getCostAnalysis: async (breakdown, period) => {
    const response = await api.get('/performance-analytics/cost-analysis', {
      params: { breakdown, period }
    });
    return response.data;
  }
};

// Scheduled Reporting Service
export const scheduledReportingService = {
  getScheduledReports: async () => {
    const response = await api.get('/scheduled-reporting/reports');
    return response.data;
  },

  createSchedule: async (scheduleConfig) => {
    const response = await api.post('/scheduled-reporting/schedules', scheduleConfig);
    return response.data;
  },

  getSchedule: async (scheduleId) => {
    const response = await api.get(`/scheduled-reporting/schedules/${scheduleId}`);
    return response.data;
  },

  updateSchedule: async (scheduleId, scheduleConfig) => {
    const response = await api.put(`/scheduled-reporting/schedules/${scheduleId}`, scheduleConfig);
    return response.data;
  },

  deleteSchedule: async (scheduleId) => {
    const response = await api.delete(`/scheduled-reporting/schedules/${scheduleId}`);
    return response.data;
  },

  pauseSchedule: async (scheduleId) => {
    const response = await api.post(`/scheduled-reporting/schedules/${scheduleId}/pause`);
    return response.data;
  },

  resumeSchedule: async (scheduleId) => {
    const response = await api.post(`/scheduled-reporting/schedules/${scheduleId}/resume`);
    return response.data;
  },

  getExecutionHistory: async (scheduleId, limit = 50) => {
    const response = await api.get(`/scheduled-reporting/schedules/${scheduleId}/history`, {
      params: { limit }
    });
    return response.data;
  }
};

// Data Export Service
export const dataExportService = {
  initiateExport: async (exportConfig) => {
    const response = await api.post('/data-export/initiate', exportConfig);
    return response.data;
  },

  getExportStatus: async (exportId) => {
    const response = await api.get(`/data-export/status/${exportId}`);
    return response.data;
  },

  downloadExport: async (exportId) => {
    const response = await api.get(`/data-export/download/${exportId}`, {
      responseType: 'blob'
    });
    return response;
  },

  getExportHistory: async (limit = 50) => {
    const response = await api.get('/data-export/history', { params: { limit } });
    return response.data;
  },

  cancelExport: async (exportId) => {
    const response = await api.delete(`/data-export/cancel/${exportId}`);
    return response.data;
  },

  getAvailableFormats: async () => {
    const response = await api.get('/data-export/formats');
    return response.data;
  },

  getExportTemplates: async () => {
    const response = await api.get('/data-export/templates');
    return response.data;
  }
};

// Advanced Analytics Service
export const advancedAnalyticsService = {
  getCrossModuleAnalytics: async (modules, filters) => {
    const response = await api.get('/advanced-analytics/cross-module', {
      params: { modules: modules.join(','), ...filters }
    });
    return response.data;
  },

  getPredictiveAnalytics: async (model, data) => {
    const response = await api.post('/advanced-analytics/predictive', { model, data });
    return response.data;
  },

  getBenchmarkAnalysis: async (category, filters) => {
    const response = await api.get('/advanced-analytics/benchmarks', {
      params: { category, ...filters }
    });
    return response.data;
  },

  getCustomAnalytics: async (query) => {
    const response = await api.post('/advanced-analytics/custom', { query });
    return response.data;
  },

  getInsights: async (context) => {
    const response = await api.get('/advanced-analytics/insights', {
      params: { context }
    });
    return response.data;
  }
};

// Utility functions
export const analyticsUtils = {
  formatMetric: (value, type) => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'duration':
        return `${value} days`;
      default:
        return value.toLocaleString();
    }
  },

  getDateRange: (period) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
};
