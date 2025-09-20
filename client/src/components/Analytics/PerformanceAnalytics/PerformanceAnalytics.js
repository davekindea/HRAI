import React, { useState, useEffect } from 'react';
import { performanceAnalyticsService } from '../../../services/analyticsService';
import MetricCard from '../MetricCard';
import ChartComponent from '../ChartComponent';
import FilterPanel from '../FilterPanel';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  DollarSign,
  Award,
  Activity,
  Calendar
} from 'lucide-react';

const PerformanceAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    dateRange: '30d',
    department: '',
    role: ''
  });

  useEffect(() => {
    fetchPerformanceData();
  }, [filters]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [metricsData, trendsData, sourceEffectiveness, conversionRates] = await Promise.all([
        performanceAnalyticsService.getPerformanceMetrics(filters),
        performanceAnalyticsService.getRecruitmentTrends(filters.dateRange, 'daily'),
        performanceAnalyticsService.getSourceEffectiveness(filters.dateRange),
        performanceAnalyticsService.getConversionRates('standard', filters)
      ]);

      setMetrics(metricsData);
      setTrends(trendsData);
      setSourceData(sourceEffectiveness);
      setConversionData(conversionRates);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'sources', label: 'Source Analysis', icon: Target },
    { id: 'conversion', label: 'Conversion Funnel', icon: Users }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Recruitment Velocity"
          value={metrics?.recruitmentVelocity ? `${metrics.recruitmentVelocity.toFixed(1)}` : '0'}
          change={metrics?.velocityChange}
          changeType="number"
          period="vs last period"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Quality Score"
          value={metrics?.qualityScore ? `${metrics.qualityScore.toFixed(1)}/10` : '0/10'}
          change={metrics?.qualityChange}
          changeType="number"
          icon={Award}
          loading={loading}
        />
        <MetricCard
          title="Efficiency Rating"
          value={metrics?.efficiencyRating ? `${(metrics.efficiencyRating * 100).toFixed(1)}%` : '0%'}
          change={metrics?.efficiencyChange}
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          title="ROI Score"
          value={metrics?.roiScore ? `${metrics.roiScore.toFixed(2)}x` : '0x'}
          change={metrics?.roiChange}
          changeType="number"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="line"
          title="Performance Over Time"
          data={metrics?.performanceOverTime || []}
          loading={loading}
        />
        <ChartComponent
          type="bar"
          title="Department Comparison"
          data={metrics?.departmentComparison || []}
          loading={loading}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Speed Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Time to First Response</span>
                <span className="text-sm font-medium">{metrics?.avgFirstResponse || '0h'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Time to Interview</span>
                <span className="text-sm font-medium">{metrics?.avgTimeToInterview || '0 days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Time to Offer</span>
                <span className="text-sm font-medium">{metrics?.avgTimeToOffer || '0 days'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quality Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Candidate Satisfaction</span>
                <span className="text-sm font-medium">{metrics?.candidateSatisfaction || '0/5'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hiring Manager Satisfaction</span>
                <span className="text-sm font-medium">{metrics?.hiringManagerSatisfaction || '0/5'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">90-Day Retention Rate</span>
                <span className="text-sm font-medium">{metrics?.retentionRate || '0%'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cost Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Recruitment Spend</span>
                <span className="text-sm font-medium">${metrics?.totalSpend?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cost per Application</span>
                <span className="text-sm font-medium">${metrics?.costPerApplication || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ROI per Hire</span>
                <span className="text-sm font-medium">{metrics?.roiPerHire || '0x'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="line"
          title="Application Trends"
          data={trends?.applications || []}
          loading={loading}
        />
        <ChartComponent
          type="line"
          title="Hiring Trends"
          data={trends?.hires || []}
          loading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="area"
          title="Source Performance Trends"
          data={trends?.sourcePerformance || []}
          loading={loading}
        />
        <ChartComponent
          type="bar"
          title="Monthly Comparison"
          data={trends?.monthlyComparison || []}
          loading={loading}
        />
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          type="pie"
          title="Applications by Source"
          data={sourceData?.applicationsBySource || []}
          loading={loading}
        />
        <ChartComponent
          type="bar"
          title="Source Effectiveness"
          data={sourceData?.sourceEffectiveness || []}
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Source Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost per Hire
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sourceData?.sourceDetails?.map((source, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {source.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.applications}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.interviews}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.hires}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(source.conversionRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${source.costPerHire?.toLocaleString() || '0'}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {loading ? <LoadingSpinner /> : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderConversion = () => (
    <div className="space-y-6">
      <ChartComponent
        type="bar"
        title="Conversion Funnel"
        data={conversionData?.funnelData || []}
        loading={loading}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Stages</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {conversionData?.stages?.map((stage, index) => (
            <div key={stage.name} className="text-center">
              <div className="bg-primary-50 rounded-lg p-4 mb-2">
                <p className="text-2xl font-bold text-primary-600">{stage.count}</p>
                <p className="text-sm text-gray-600">{stage.name}</p>
              </div>
              {index < conversionData.stages.length - 1 && (
                <div className="text-gray-400 text-sm">
                  {stage.conversionRate ? `${(stage.conversionRate * 100).toFixed(1)}%` : ''}
                </div>
              )}
            </div>
          )) || (
            <div className="col-span-5 text-center py-8">
              {loading ? <LoadingSpinner /> : <p className="text-gray-500">No conversion data available</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="mt-2 text-gray-600">
            Deep insights into recruitment performance and trends
          </p>
        </div>
        <FilterPanel 
          filters={filters} 
          onFiltersChange={setFilters}
          availableFilters={{
            departments: [
              { value: 'engineering', label: 'Engineering' },
              { value: 'sales', label: 'Sales' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'hr', label: 'Human Resources' }
            ]
          }}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'trends' && renderTrends()}
      {activeTab === 'sources' && renderSources()}
      {activeTab === 'conversion' && renderConversion()}
    </div>
  );
};

export default PerformanceAnalytics;
