import React, { useState, useEffect } from 'react';
import { hrDashboardService } from '../../../services/analyticsService';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Settings, 
  Save, 
  RotateCcw,
  Bell,
  Eye,
  Clock,
  Palette,
  Shield,
  Database
} from 'lucide-react';

const AnalyticsSettings = () => {
  const [settings, setSettings] = useState({
    dashboard: {
      refreshInterval: 300, // seconds
      autoRefresh: true,
      defaultDateRange: '30d',
      chartAnimations: true,
      compactView: false
    },
    notifications: {
      emailAlerts: true,
      browserNotifications: false,
      alertThresholds: {
        timeToHire: 30,
        costPerHire: 5000,
        offerAcceptanceRate: 0.7
      }
    },
    privacy: {
      dataMasking: false,
      anonymizeExports: false,
      auditLogging: true
    },
    performance: {
      cacheEnabled: true,
      cacheTimeout: 600, // seconds
      maxRecords: 10000,
      enableCompression: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the backend
      // const data = await hrDashboardService.getSettings();
      // setSettings(data.settings);
      
      // For demo, we'll use the default settings
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // await hrDashboardService.updateDashboardSettings(settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (would use toast in real implementation)
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      dashboard: {
        refreshInterval: 300,
        autoRefresh: true,
        defaultDateRange: '30d',
        chartAnimations: true,
        compactView: false
      },
      notifications: {
        emailAlerts: true,
        browserNotifications: false,
        alertThresholds: {
          timeToHire: 30,
          costPerHire: 5000,
          offerAcceptanceRate: 0.7
        }
      },
      privacy: {
        dataMasking: false,
        anonymizeExports: false,
        auditLogging: true
      },
      performance: {
        cacheEnabled: true,
        cacheTimeout: 600,
        maxRecords: 10000,
        enableCompression: true
      }
    });
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (section, nestedKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...prev[section][nestedKey],
          [key]: value
        }
      }
    }));
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Database }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  const renderDashboardSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Refresh</label>
              <p className="text-sm text-gray-500">Automatically refresh dashboard data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dashboard.autoRefresh}
              onChange={(e) => updateSetting('dashboard', 'autoRefresh', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Interval (seconds)
            </label>
            <select
              value={settings.dashboard.refreshInterval}
              onChange={(e) => updateSetting('dashboard', 'refreshInterval', parseInt(e.target.value))}
              disabled={!settings.dashboard.autoRefresh}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Date Range
            </label>
            <select
              value={settings.dashboard.defaultDateRange}
              onChange={(e) => updateSetting('dashboard', 'defaultDateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Chart Animations</label>
              <p className="text-sm text-gray-500">Enable animated chart transitions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dashboard.chartAnimations}
              onChange={(e) => updateSetting('dashboard', 'chartAnimations', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Compact View</label>
              <p className="text-sm text-gray-500">Use compact layout for more data density</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dashboard.compactView}
              onChange={(e) => updateSetting('dashboard', 'compactView', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Alerts</label>
              <p className="text-sm text-gray-500">Receive email notifications for important events</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailAlerts}
              onChange={(e) => updateSetting('notifications', 'emailAlerts', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Browser Notifications</label>
              <p className="text-sm text-gray-500">Show browser push notifications</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.browserNotifications}
              onChange={(e) => updateSetting('notifications', 'browserNotifications', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-4">Alert Thresholds</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time to Hire (days)
            </label>
            <input
              type="number"
              value={settings.notifications.alertThresholds.timeToHire}
              onChange={(e) => updateNestedSetting('notifications', 'alertThresholds', 'timeToHire', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost per Hire ($)
            </label>
            <input
              type="number"
              value={settings.notifications.alertThresholds.costPerHire}
              onChange={(e) => updateNestedSetting('notifications', 'alertThresholds', 'costPerHire', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Acceptance Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.notifications.alertThresholds.offerAcceptanceRate * 100}
              onChange={(e) => updateNestedSetting('notifications', 'alertThresholds', 'offerAcceptanceRate', e.target.value / 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Security</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Data Masking</label>
              <p className="text-sm text-gray-500">Mask sensitive data in displays</p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.dataMasking}
              onChange={(e) => updateSetting('privacy', 'dataMasking', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Anonymize Exports</label>
              <p className="text-sm text-gray-500">Remove personal identifiers from exports</p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.anonymizeExports}
              onChange={(e) => updateSetting('privacy', 'anonymizeExports', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Audit Logging</label>
              <p className="text-sm text-gray-500">Log all analytics access and operations</p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.auditLogging}
              onChange={(e) => updateSetting('privacy', 'auditLogging', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Optimization</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Caching</label>
              <p className="text-sm text-gray-500">Cache analytics data for faster loading</p>
            </div>
            <input
              type="checkbox"
              checked={settings.performance.cacheEnabled}
              onChange={(e) => updateSetting('performance', 'cacheEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cache Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.performance.cacheTimeout}
              onChange={(e) => updateSetting('performance', 'cacheTimeout', parseInt(e.target.value))}
              disabled={!settings.performance.cacheEnabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Records per Request
            </label>
            <input
              type="number"
              value={settings.performance.maxRecords}
              onChange={(e) => updateSetting('performance', 'maxRecords', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Compression</label>
              <p className="text-sm text-gray-500">Compress data transfers for better performance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.performance.enableCompression}
              onChange={(e) => updateSetting('performance', 'enableCompression', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return renderDashboardSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your analytics preferences and system settings
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleResetSettings}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
