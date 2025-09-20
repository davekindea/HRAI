import React, { useState, useEffect } from 'react';
import { scheduledReportingService } from '../../../services/analyticsService';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Clock, 
  Calendar, 
  Mail, 
  Play, 
  Pause, 
  Settings, 
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const ScheduledReporting = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    description: '',
    reportType: '',
    frequency: 'weekly',
    dayOfWeek: '1', // Monday
    timeOfDay: '09:00',
    recipients: [],
    format: 'pdf',
    filters: {},
    enabled: true
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduledReportingService.getScheduledReports();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionHistory = async (scheduleId) => {
    try {
      const data = await scheduledReportingService.getExecutionHistory(scheduleId);
      setExecutionHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching execution history:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await scheduledReportingService.createSchedule(scheduleConfig);
      setShowScheduleModal(false);
      resetScheduleConfig();
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      await scheduledReportingService.updateSchedule(selectedSchedule.id, scheduleConfig);
      setShowScheduleModal(false);
      resetScheduleConfig();
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handlePauseSchedule = async (scheduleId) => {
    try {
      await scheduledReportingService.pauseSchedule(scheduleId);
      fetchSchedules();
    } catch (error) {
      console.error('Error pausing schedule:', error);
    }
  };

  const handleResumeSchedule = async (scheduleId) => {
    try {
      await scheduledReportingService.resumeSchedule(scheduleId);
      fetchSchedules();
    } catch (error) {
      console.error('Error resuming schedule:', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await scheduledReportingService.deleteSchedule(scheduleId);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const resetScheduleConfig = () => {
    setScheduleConfig({
      name: '',
      description: '',
      reportType: '',
      frequency: 'weekly',
      dayOfWeek: '1',
      timeOfDay: '09:00',
      recipients: [],
      format: 'pdf',
      filters: {},
      enabled: true
    });
    setSelectedSchedule(null);
  };

  const handleEditSchedule = (schedule) => {
    setScheduleConfig(schedule.config);
    setSelectedSchedule(schedule);
    setShowScheduleModal(true);
  };

  const getFrequencyDisplay = (frequency, dayOfWeek, timeOfDay) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (frequency) {
      case 'daily':
        return `Daily at ${timeOfDay}`;
      case 'weekly':
        return `Weekly on ${days[dayOfWeek]} at ${timeOfDay}`;
      case 'monthly':
        return `Monthly on the ${dayOfWeek}th at ${timeOfDay}`;
      default:
        return frequency;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const addRecipient = () => {
    setScheduleConfig({
      ...scheduleConfig,
      recipients: [...scheduleConfig.recipients, { email: '', name: '' }]
    });
  };

  const updateRecipient = (index, field, value) => {
    const updatedRecipients = [...scheduleConfig.recipients];
    updatedRecipients[index][field] = value;
    setScheduleConfig({ ...scheduleConfig, recipients: updatedRecipients });
  };

  const removeRecipient = (index) => {
    const updatedRecipients = scheduleConfig.recipients.filter((_, i) => i !== index);
    setScheduleConfig({ ...scheduleConfig, recipients: updatedRecipients });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Reports</h1>
          <p className="mt-2 text-gray-600">
            Automate your reporting with scheduled delivery
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Scheduled Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Schedules</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${schedule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {schedule.enabled ? (
                      <Calendar className="h-5 w-5 text-green-600" />
                    ) : (
                      <Pause className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                    <p className="text-sm text-gray-600">{schedule.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{getFrequencyDisplay(schedule.frequency, schedule.dayOfWeek, schedule.timeOfDay)}</span>
                      <span>•</span>
                      <span>{schedule.recipients?.length || 0} recipients</span>
                      <span>•</span>
                      <span>Format: {schedule.format?.toUpperCase()}</span>
                      <span>•</span>
                      <span>Next run: {schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchExecutionHistory(schedule.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View History"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {schedule.enabled ? (
                    <button
                      onClick={() => handlePauseSchedule(schedule.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600"
                      title="Pause"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResumeSchedule(schedule.id)}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="Resume"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No scheduled reports configured</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Create your first scheduled report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Execution History */}
      {executionHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Executions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {executionHistory.slice(0, 10).map((execution, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(execution.status)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {execution.reportName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(execution.executedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Duration: {execution.duration}ms
                    </p>
                    {execution.error && (
                      <p className="text-sm text-red-600">
                        Error: {execution.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Configuration Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </h3>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    resetScheduleConfig();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={scheduleConfig.name}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={scheduleConfig.reportType}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, reportType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select report type</option>
                    <option value="hr_dashboard">HR Dashboard</option>
                    <option value="performance_analytics">Performance Analytics</option>
                    <option value="recruitment_summary">Recruitment Summary</option>
                    <option value="candidate_pipeline">Candidate Pipeline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={scheduleConfig.description}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Schedule Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {scheduleConfig.frequency === 'weekly' ? 'Day of Week' : 'Day'}
                  </label>
                  <select
                    value={scheduleConfig.dayOfWeek}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {scheduleConfig.frequency === 'weekly' ? (
                      <>
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </>
                    ) : (
                      Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleConfig.timeOfDay}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, timeOfDay: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Recipients
                  </label>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Recipient
                  </button>
                </div>
                <div className="space-y-2">
                  {scheduleConfig.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={scheduleConfig.format}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, format: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  resetScheduleConfig();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={selectedSchedule ? handleUpdateSchedule : handleCreateSchedule}
                disabled={!scheduleConfig.name || !scheduleConfig.reportType}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedSchedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReporting;
