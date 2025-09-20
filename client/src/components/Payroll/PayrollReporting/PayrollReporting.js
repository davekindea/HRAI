import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  Eye,
  Settings,
  Plus,
  RefreshCw,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const PayrollReporting = () => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'detailed', 'scheduled', 'analytics'
  const [reportData, setReportData] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('2025-09');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'payroll_summary', name: 'Payroll Summary', description: 'High-level payroll overview' },
    { id: 'cost_center', name: 'Cost Center Analysis', description: 'Department and project costs' },
    { id: 'labor_distribution', name: 'Labor Distribution', description: 'Work allocation by department' },
    { id: 'tax_liability', name: 'Tax Liability Report', description: 'Tax obligations and payments' },
    { id: 'benefits_utilization', name: 'Benefits Utilization', description: 'Employee benefits usage' },
    { id: 'compliance', name: 'Compliance Report', description: 'Regulatory compliance status' }
  ];

  const mockPayrollSummary = {
    totalEmployees: 1247,
    totalGrossPay: 2400000,
    totalNetPay: 1553000,
    totalDeductions: 847000,
    totalTaxes: 623000,
    averagePay: 1925,
    payrollFrequency: 'Monthly',
    period: '2025-09-01 to 2025-09-30'
  };

  const mockDepartmentData = [
    { department: 'Engineering', employees: 485, grossPay: 950000, avgSalary: 125000 },
    { department: 'Sales', employees: 312, grossPay: 485000, avgSalary: 95000 },
    { department: 'Marketing', employees: 156, grossPay: 285000, avgSalary: 87000 },
    { department: 'Operations', employees: 198, grossPay: 350000, avgSalary: 82000 },
    { department: 'HR', employees: 96, grossPay: 330000, avgSalary: 92000 }
  ];

  const mockScheduledReports = [
    {
      id: 1,
      name: 'Monthly Payroll Summary',
      type: 'payroll_summary',
      frequency: 'Monthly',
      nextRun: '2025-10-01T09:00:00Z',
      lastRun: '2025-09-01T09:00:00Z',
      recipients: ['hr@company.com', 'finance@company.com'],
      status: 'active'
    },
    {
      id: 2,
      name: 'Quarterly Tax Report',
      type: 'tax_liability',
      frequency: 'Quarterly',
      nextRun: '2025-10-01T09:00:00Z',
      lastRun: '2025-07-01T09:00:00Z',
      recipients: ['tax@company.com'],
      status: 'active'
    },
    {
      id: 3,
      name: 'Benefits Analysis',
      type: 'benefits_utilization',
      frequency: 'Quarterly',
      nextRun: '2025-10-01T09:00:00Z',
      lastRun: '2025-07-01T09:00:00Z',
      recipients: ['benefits@company.com'],
      status: 'paused'
    }
  ];

  const mockRecentReports = [
    {
      id: 1,
      name: 'September 2025 Payroll Summary',
      type: 'Payroll Summary',
      generatedDate: '2025-09-30T14:30:00Z',
      status: 'completed',
      format: 'PDF',
      size: '2.4 MB'
    },
    {
      id: 2,
      name: 'Q3 2025 Benefits Report',
      type: 'Benefits Utilization',
      generatedDate: '2025-09-28T10:15:00Z',
      status: 'completed',
      format: 'Excel',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Cost Center Analysis - Engineering',
      type: 'Cost Center',
      generatedDate: '2025-09-25T16:45:00Z',
      status: 'completed',
      format: 'PDF',
      size: '3.1 MB'
    }
  ];

  useEffect(() => {
    setReportData(mockPayrollSummary);
    setScheduledReports(mockScheduledReports);
  }, [selectedPeriod]);

  const generateReport = async (reportType, filters = {}) => {
    setLoading(true);
    try {
      const report = await payrollService.generateDetailedReport({
        reportType,
        filters: {
          period: selectedPeriod,
          ...filters
        },
        format: 'pdf',
        includeCharts: true
      });
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportId, format) => {
    try {
      await payrollService.exportReport({
        reportId,
        format,
        filters: { period: selectedPeriod }
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const scheduleReport = async (reportConfig) => {
    try {
      await payrollService.scheduleReport(reportConfig);
      // Refresh scheduled reports
    } catch (error) {
      console.error('Error scheduling report:', error);
    }
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Reporting & Analytics</h2>
          <p className="text-gray-600">Comprehensive payroll reports and business insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025-09">September 2025</option>
            <option value="2025-08">August 2025</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-06">June 2025</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', name: 'Summary Reports', icon: BarChart3 },
            { id: 'detailed', name: 'Detailed Reports', icon: FileText },
            { id: 'scheduled', name: 'Scheduled Reports', icon: Calendar },
            { id: 'analytics', name: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Summary Reports Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          {reportData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Payroll Summary - {selectedPeriod}</h3>
                <div className="flex items-center space-x-3">
                  <button className="text-gray-600 hover:text-gray-700 p-2">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    Export
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-800">{reportData.totalEmployees.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-green-600">Gross Pay</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(reportData.totalGrossPay)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-purple-600">Net Pay</p>
                      <p className="text-2xl font-bold text-purple-800">{formatCurrency(reportData.totalNetPay)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-orange-600">Deductions</p>
                      <p className="text-2xl font-bold text-orange-800">{formatCurrency(reportData.totalDeductions)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Department Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Pay
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockDepartmentData.map((dept, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dept.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dept.employees}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(dept.grossPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(dept.avgSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((dept.grossPay / reportData.totalGrossPay) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Reports Tab */}
      {activeTab === 'detailed' && (
        <div className="space-y-6">
          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((reportType) => (
              <div key={reportType.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <button 
                    onClick={() => generateReport(reportType.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Generate
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{reportType.name}</h3>
                <p className="text-sm text-gray-600">{reportType.description}</p>
              </div>
            ))}
          </div>

          {/* Recent Reports */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {mockRecentReports.map((report) => (
                <div key={report.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">{report.type}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Generated: {formatDate(report.generatedDate)}</span>
                          <span>Format: {report.format}</span>
                          <span>Size: {report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-2">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700 p-2">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Schedule Report</span>
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <div key={report.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">{report.type} - {report.frequency}</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <p>Next Run: {formatDate(report.nextRun)}</p>
                          <p>Last Run: {formatDate(report.lastRun)}</p>
                          <p>Recipients: {report.recipients.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-2">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700 p-2">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payroll Trends */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Trends</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">YoY Growth</span>
                  <span className="text-lg font-bold text-green-600">+8.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Variance</span>
                  <span className="text-lg font-bold text-blue-600">±2.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per Employee</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(1925)}</span>
                </div>
              </div>
            </div>

            {/* Cost Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base Salary</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">68%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Benefits</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '22%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">22%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxes</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Performance Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">94.2%</p>
                <p className="text-sm text-blue-700 mt-2">Payroll Accuracy</p>
                <p className="text-xs text-blue-600 mt-1">↑ 2.1% from last quarter</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">1.2 days</p>
                <p className="text-sm text-green-700 mt-2">Processing Time</p>
                <p className="text-xs text-green-600 mt-1">↓ 0.3 days from last quarter</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">98.7%</p>
                <p className="text-sm text-purple-700 mt-2">Compliance Rate</p>
                <p className="text-xs text-purple-600 mt-1">↑ 1.5% from last quarter</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReporting;