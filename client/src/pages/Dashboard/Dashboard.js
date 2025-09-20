import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, jobService, applicationService, candidateService } from '../../services/apiService';
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const Dashboard = () => {
  const { user, isHR, isCandidate } = useAuth();

  // Fetch dashboard data based on user type
  const { data: dashboardData, isLoading } = useQuery(
    'dashboardData',
    () => {
      if (isHR) {
        return adminService.getDashboardData();
      } else {
        // For candidates, get their applications
        return applicationService.getMyApplications({ limit: 5 });
      }
    },
    {
      enabled: !!user
    }
  );

  const { data: jobStats } = useQuery(
    'jobStats',
    jobService.getJobStats,
    {
      enabled: isHR
    }
  );

  const { data: applicationStats } = useQuery(
    'applicationStats',
    applicationService.getApplicationStats,
    {
      enabled: isHR
    }
  );

  const { data: candidateStats } = useQuery(
    'candidateStats',
    candidateService.getCandidateStats,
    {
      enabled: isHR
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', change }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (isCandidate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="mt-2 text-gray-600">Track your applications and discover new opportunities.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Applications"
            value={dashboardData?.applications?.length || 0}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Under Review"
            value={dashboardData?.applications?.filter(app => ['pending', 'reviewed'].includes(app.status)).length || 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Interviews Scheduled"
            value={dashboardData?.applications?.filter(app => app.status === 'interview_scheduled').length || 0}
            icon="calendar"
            color="green"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="p-6">
            {dashboardData?.applications?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.applications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{application.job_title}</h3>
                      <p className="text-sm text-gray-600">{application.department} • {application.location}</p>
                      <p className="text-xs text-gray-500">Applied on {new Date(application.applied_date).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      variant={
                        application.status === 'hired' ? 'success' :
                        application.status === 'rejected' ? 'danger' :
                        application.status === 'interview_scheduled' ? 'info' :
                        'warning'
                      }
                    >
                      {application.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start by browsing and applying to jobs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // HR Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor recruitment metrics and system activity.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={jobStats?.active || 0}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="Total Applications"
          value={applicationStats?.total || 0}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Active Candidates"
          value={candidateStats?.active || 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={applicationStats?.by_status?.pending || 0}
          icon={Clock}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="p-6">
            {dashboardData?.recentApplications?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{application.candidate_name}</p>
                      <p className="text-sm text-gray-600">{application.job_title}</p>
                    </div>
                    <Badge
                      variant={
                        application.status === 'hired' ? 'success' :
                        application.status === 'rejected' ? 'danger' :
                        'warning'
                      }
                    >
                      {application.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent applications</p>
            )}
          </div>
        </div>

        {/* Application Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Application Status</h2>
          </div>
          <div className="p-6">
            {dashboardData?.applicationsByStatus?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.applicationsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Briefcase className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Post New Job</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Review Candidates</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;