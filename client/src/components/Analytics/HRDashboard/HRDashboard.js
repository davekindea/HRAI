import React, { useState, useEffect } from 'react';
import { hrDashboardService } from '../../../services/analyticsService';
import MetricCard from '../MetricCard';
import ChartComponent from '../ChartComponent';
import FilterPanel from '../FilterPanel';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Target,
  Calendar
} from 'lucide-react';

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30d'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hrDashboardService.getDashboardData(filters);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your recruitment and HR metrics
          </p>
        </div>
        <FilterPanel 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
          availableFilters={{
            departments: [
              { value: 'engineering', label: 'Engineering' },
              { value: 'sales', label: 'Sales' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'hr', label: 'Human Resources' },
              { value: 'finance', label: 'Finance' }
            ]
          }}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Hires"
          value={dashboardData?.metrics?.totalHires || '0'}
          change={dashboardData?.metrics?.hiresChange}
          icon={UserCheck}
          loading={loading}
        />
        <MetricCard
          title="Open Positions"
          value={dashboardData?.metrics?.openPositions || '0'}
          change={dashboardData?.metrics?.openPositionsChange}
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Avg Time to Hire"
          value={dashboardData?.metrics?.avgTimeToHire ? `${dashboardData.metrics.avgTimeToHire} days` : '0 days'}
          change={dashboardData?.metrics?.timeToHireChange}
          changeType="number"
          icon={Clock}
          loading={loading}
        />
        <MetricCard
          title="Cost per Hire"
          value={dashboardData?.metrics?.costPerHire ? `$${dashboardData.metrics.costPerHire.toLocaleString()}` : '$0'}
          change={dashboardData?.metrics?.costPerHireChange}
          changeType="currency"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Offer Acceptance Rate"
          value={dashboardData?.metrics?.offerAcceptanceRate ? `${(dashboardData.metrics.offerAcceptanceRate * 100).toFixed(1)}%` : '0%'}
          change={dashboardData?.metrics?.offerAcceptanceChange}
          icon={Target}
          loading={loading}
        />
        <MetricCard
          title="Interview Show Rate"
          value={dashboardData?.metrics?.interviewShowRate ? `${(dashboardData.metrics.interviewShowRate * 100).toFixed(1)}%` : '0%'}
          change={dashboardData?.metrics?.interviewShowChange}
          icon={Calendar}
          loading={loading}
        />
        <MetricCard
          title="Active Candidates"
          value={dashboardData?.metrics?.activeCandidates || '0'}
          change={dashboardData?.metrics?.activeCandidatesChange}
          changeType="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Quality of Hire Score"
          value={dashboardData?.metrics?.qualityOfHire ? `${dashboardData.metrics.qualityOfHire.toFixed(1)}/5.0` : '0/5.0'}
          change={dashboardData?.metrics?.qualityOfHireChange}
          changeType="number"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="line"
          title="Hiring Trends"
          data={dashboardData?.charts?.hiringTrends || []}
          loading={loading}
        />
        <ChartComponent
          type="bar"
          title="Hires by Department"
          data={dashboardData?.charts?.hiresByDepartment || []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="area"
          title="Pipeline Conversion"
          data={dashboardData?.charts?.pipelineConversion || []}
          loading={loading}
        />
        <ChartComponent
          type="pie"
          title="Source Effectiveness"
          data={dashboardData?.charts?.sourceEffectiveness || []}
          loading={loading}
        />
      </div>

      {/* Candidate Pipeline Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Candidate Pipeline</h3>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {dashboardData?.pipeline?.stages?.map((stage, index) => (
              <div key={stage.name} className="text-center">
                <div className="bg-primary-50 rounded-lg p-4 mb-2">
                  <p className="text-2xl font-bold text-primary-600">{stage.count}</p>
                  <p className="text-sm text-gray-600">{stage.name}</p>
                </div>
                {index < dashboardData.pipeline.stages.length - 1 && (
                  <div className="hidden md:block text-gray-400 text-sm">
                    {stage.conversionRate ? `${(stage.conversionRate * 100).toFixed(1)}%` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {activity.type === 'hire' && <UserCheck className="h-5 w-5 text-green-500" />}
                    {activity.type === 'interview' && <Calendar className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'application' && <Users className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {activity.department}
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

export default HRDashboard;
