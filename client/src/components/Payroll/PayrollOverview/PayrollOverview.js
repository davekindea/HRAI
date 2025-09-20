import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  FileText
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const PayrollOverview = () => {
  const [overview, setOverview] = useState({
    totalEmployees: 1247,
    monthlyPayroll: 2400000,
    benefitsCost: 847000,
    taxLiability: 623000,
    pendingApprovals: 23,
    complianceAlerts: 3,
    lastPayrollRun: '2025-09-15',
    nextPayrollRun: '2025-09-30'
  });

  const [payrollMetrics, setPayrollMetrics] = useState({
    averageSalary: 96000,
    medianSalary: 87000,
    payrollGrowth: 8.3,
    benefitsUtilization: 87.5,
    overtimeHours: 2847,
    turnoverRate: 12.4
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'payroll_run',
      description: 'Payroll processed for September 2025',
      timestamp: '2025-09-15T10:30:00Z',
      status: 'completed',
      amount: '$2,400,000'
    },
    {
      id: 2,
      type: 'bonus_payment',
      description: 'Q3 performance bonuses distributed',
      timestamp: '2025-09-10T14:15:00Z',
      status: 'completed',
      amount: '$185,000'
    },
    {
      id: 3,
      type: 'tax_filing',
      description: 'Quarterly tax filing submitted',
      timestamp: '2025-09-08T09:00:00Z',
      status: 'completed',
      amount: '$623,000'
    },
    {
      id: 4,
      type: 'benefits_enrollment',
      description: 'New hire benefits enrollment',
      timestamp: '2025-09-05T11:45:00Z',
      status: 'pending',
      amount: '-'
    }
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'payroll_run':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'bonus_payment':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'tax_filing':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'benefits_enrollment':
        return <Users className="h-5 w-5 text-orange-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Overview</h2>
          <p className="text-gray-600">Comprehensive payroll dashboard and key metrics</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Run Payroll
          </button>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Employees</p>
              <p className="text-3xl font-bold">{overview.totalEmployees.toLocaleString()}</p>
            </div>
            <Users className="h-10 w-10 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-200 mr-2" />
            <span className="text-blue-100 text-sm">+5.2% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Monthly Payroll</p>
              <p className="text-3xl font-bold">{formatCurrency(overview.monthlyPayroll)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-200" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-200 mr-2" />
            <span className="text-green-100 text-sm">+8.3% from last year</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Benefits Cost</p>
              <p className="text-3xl font-bold">{formatCurrency(overview.benefitsCost)}</p>
            </div>
            <Target className="h-10 w-10 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-purple-200 mr-2" />
            <span className="text-purple-100 text-sm">87.5% utilization</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Tax Liability</p>
              <p className="text-3xl font-bold">{formatCurrency(overview.taxLiability)}</p>
            </div>
            <FileText className="h-10 w-10 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="h-4 w-4 text-orange-200 mr-2" />
            <span className="text-orange-100 text-sm">All filings current</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollMetrics.averageSalary)}</p>
                <p className="text-sm text-gray-600">Average Salary</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollMetrics.medianSalary)}</p>
                <p className="text-sm text-gray-600">Median Salary</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">+{payrollMetrics.payrollGrowth}%</p>
                <p className="text-sm text-gray-600">YoY Growth</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{payrollMetrics.benefitsUtilization}%</p>
                <p className="text-sm text-gray-600">Benefits Utilization</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{payrollMetrics.overtimeHours.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Overtime Hours</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{payrollMetrics.turnoverRate}%</p>
                <p className="text-sm text-gray-600">Turnover Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Next Payroll Run</p>
                    <p className="text-sm text-gray-600">{formatDate(overview.nextPayrollRun)}</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Process Bonuses</p>
                    <p className="text-sm text-gray-600">Q3 performance bonuses</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Tax Filing</p>
                    <p className="text-sm text-gray-600">Quarterly submission</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
              {overview.complianceAlerts > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {overview.complianceAlerts} Active
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Pending Approvals
                  </p>
                  <p className="text-sm text-yellow-700">
                    {overview.pendingApprovals} items need approval
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Compliance Issues
                  </p>
                  <p className="text-sm text-red-700">
                    {overview.complianceAlerts} items require attention
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getActivityTypeIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {activity.amount !== '-' && (
                  <span className="text-sm font-medium text-gray-900">
                    {activity.amount}
                  </span>
                )}
                {getStatusIcon(activity.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayrollOverview;