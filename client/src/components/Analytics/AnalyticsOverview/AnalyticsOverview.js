import React, { useState, useEffect } from 'react';
import { advancedAnalyticsService } from '../../../services/analyticsService';
import MetricCard from '../MetricCard';
import ChartComponent from '../ChartComponent';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Target,
  Award,
  Activity,
  Eye,
  ArrowRight
} from 'lucide-react';

const AnalyticsOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [crossModuleData, insightsData] = await Promise.all([
        advancedAnalyticsService.getCrossModuleAnalytics(['hr', 'recruitment', 'performance'], {}),
        advancedAnalyticsService.getInsights('dashboard')
      ]);
      setOverviewData(crossModuleData);
      setInsights(insightsData.insights || []);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'HR Dashboard',
      description: 'View comprehensive HR metrics',
      icon: Users,
      action: 'dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Performance Analytics',
      description: 'Deep dive into performance trends',
      icon: TrendingUp,
      action: 'performance',
      color: 'bg-green-500'
    },
    {
      title: 'Build Report',
      description: 'Create custom analytics reports',
      icon: Activity,
      action: 'reports',
      color: 'bg-purple-500'
    },
    {
      title: 'Export Data',
      description: 'Download data in various formats',
      icon: Target,
      action: 'export',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Active Positions"
          value={overviewData?.metrics?.activePositions || '0'}
          change={overviewData?.metrics?.activePositionsChange}
          changeType="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Monthly Hires"
          value={overviewData?.metrics?.monthlyHires || '0'}
          change={overviewData?.metrics?.monthlyHiresChange}
          changeType="number"
          icon={Award}
          loading={loading}
        />
        <MetricCard
          title="Avg Time to Fill"
          value={overviewData?.metrics?.avgTimeToFill ? `${overviewData.metrics.avgTimeToFill} days` : '0 days'}
          change={overviewData?.metrics?.timeToFillChange}
          changeType="number"
          icon={Clock}
          loading={loading}
        />
        <MetricCard
          title="Recruitment ROI"
          value={overviewData?.metrics?.recruitmentROI ? `${overviewData.metrics.recruitmentROI.toFixed(1)}x` : '0x'}
          change={overviewData?.metrics?.roiChange}
          changeType="number"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.action}
                className="cursor-pointer group border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 text-gray-600`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="line"
          title="Hiring Trends (Last 6 Months)"
          data={overviewData?.charts?.hiringTrends || []}
          loading={loading}
        />
        <ChartComponent
          type="pie"
          title="Recruitment Sources"
          data={overviewData?.charts?.recruitmentSources || []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="bar"
          title="Department Hiring Activity"
          data={overviewData?.charts?.departmentActivity || []}
          loading={loading}
        />
        <ChartComponent
          type="area"
          title="Cost per Hire Trends"
          data={overviewData?.charts?.costTrends || []}
          loading={loading}
        />
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Eye className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">AI-Powered Insights</h3>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="border-l-4 border-primary-500 bg-primary-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-primary-900">{insight.title}</h4>
                    <p className="text-sm text-primary-700 mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-primary-800 font-medium mt-2">
                        💡 Recommendation: {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No insights available</p>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Analytics Activity</h3>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {overviewData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {activity.module}
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsOverview;
