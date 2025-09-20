import React, { useState } from 'react';
import AnalyticsOverview from '../../components/Analytics/AnalyticsOverview/AnalyticsOverview';
import HRDashboard from '../../components/Analytics/HRDashboard/HRDashboard';
import ReportBuilder from '../../components/Analytics/ReportBuilder/ReportBuilder';
import PerformanceAnalytics from '../../components/Analytics/PerformanceAnalytics/PerformanceAnalytics';
import DataExport from '../../components/Analytics/DataExport/DataExport';
import ScheduledReporting from '../../components/Analytics/ScheduledReporting/ScheduledReporting';
import AnalyticsSettings from '../../components/Analytics/AnalyticsSettings/AnalyticsSettings';
import { 
  Home,
  BarChart3, 
  FileText, 
  TrendingUp, 
  Download, 
  Calendar,
  Settings,
  Activity
} from 'lucide-react';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      component: AnalyticsOverview,
      description: 'High-level analytics summary and insights'
    },
    {
      id: 'dashboard',
      label: 'HR Dashboard',
      icon: BarChart3,
      component: HRDashboard,
      description: 'Overview of key HR metrics and KPIs'
    },
    {
      id: 'performance',
      label: 'Performance Analytics',
      icon: TrendingUp,
      component: PerformanceAnalytics,
      description: 'Deep dive into recruitment performance trends'
    },
    {
      id: 'reports',
      label: 'Report Builder',
      icon: FileText,
      component: ReportBuilder,
      description: 'Create custom reports and analytics'
    },
    {
      id: 'export',
      label: 'Data Export',
      icon: Download,
      component: DataExport,
      description: 'Export data in various formats'
    },
    {
      id: 'scheduled',
      label: 'Scheduled Reports',
      icon: Calendar,
      component: ScheduledReporting,
      description: 'Automate report delivery'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      component: AnalyticsSettings,
      description: 'Configure analytics preferences and system settings'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive insights into your recruitment process with advanced analytics
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-gray-400 mr-2" />
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default Analytics;