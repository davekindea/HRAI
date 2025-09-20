import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Eye,
  Settings,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const PayrollProcessing = () => {
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', 'schedule', 'settings'
  const [payrollData, setPayrollData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('2025-09');

  const payrollPeriods = [
    { id: '2025-09', name: 'September 2025', status: 'current', dueDate: '2025-09-30' },
    { id: '2025-08', name: 'August 2025', status: 'completed', dueDate: '2025-08-31' },
    { id: '2025-07', name: 'July 2025', status: 'completed', dueDate: '2025-07-31' },
    { id: '2025-06', name: 'June 2025', status: 'completed', dueDate: '2025-06-30' }
  ];

  const mockPayrollData = {
    totalEmployees: 1247,
    totalGrossPay: 2400000,
    totalDeductions: 847000,
    totalNetPay: 1553000,
    totalTaxes: 623000,
    overtimeHours: 2847,
    regularHours: 248940,
    period: '2025-09-01 to 2025-09-30',
    status: 'pending',
    lastProcessed: '2025-09-15T10:30:00Z'
  };

  const mockEmployeePayroll = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'John Smith',
      department: 'Engineering',
      regularHours: 160,
      overtimeHours: 8,
      grossPay: 8500,
      deductions: 2100,
      taxes: 1800,
      netPay: 4600,
      status: 'calculated'
    },
    {
      id: 2,
      employeeId: 'EMP002', 
      name: 'Sarah Johnson',
      department: 'Marketing',
      regularHours: 160,
      overtimeHours: 4,
      grossPay: 7200,
      deductions: 1850,
      taxes: 1520,
      netPay: 3830,
      status: 'calculated'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Mike Davis',
      department: 'Sales',
      regularHours: 160,
      overtimeHours: 12,
      grossPay: 9200,
      deductions: 2300,
      taxes: 1950,
      netPay: 4950,
      status: 'calculated'
    }
  ];

  useEffect(() => {
    setPayrollData(mockPayrollData);
  }, [selectedPeriod]);

  const processPayroll = async () => {
    setProcessing(true);
    try {
      await payrollService.processPayroll({
        payrollPeriod: selectedPeriod,
        employees: mockEmployeePayroll.map(emp => emp.employeeId)
      });
      
      setPayrollData(prev => ({ ...prev, status: 'processing' }));
      
      // Simulate processing time
      setTimeout(() => {
        setPayrollData(prev => ({ ...prev, status: 'completed' }));
        setProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      setProcessing(false);
    }
  };

  const generatePayStubs = async () => {
    try {
      await payrollService.generatePayStubs({
        payrollPeriod: selectedPeriod,
        employees: mockEmployeePayroll.map(emp => emp.employeeId),
        format: 'pdf'
      });
    } catch (error) {
      console.error('Error generating pay stubs:', error);
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
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
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
          <h2 className="text-2xl font-bold text-gray-900">Payroll Processing</h2>
          <p className="text-gray-600">Process payroll calculations and manage payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {payrollPeriods.map(period => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
          <button 
            onClick={processPayroll}
            disabled={processing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{processing ? 'Processing...' : 'Run Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Status Overview */}
      {payrollData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Current Payroll Period</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payrollData.status)}`}>
                {payrollData.status.charAt(0).toUpperCase() + payrollData.status.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Period: {payrollData.period}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-800">{payrollData.totalEmployees.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Gross Pay</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(payrollData.totalGrossPay)}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Net Pay</p>
                  <p className="text-2xl font-bold text-purple-800">{formatCurrency(payrollData.totalNetPay)}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-orange-800">{formatCurrency(payrollData.totalDeductions)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={generatePayStubs}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Generate Pay Stubs</span>
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', name: 'Current Period', icon: Clock },
            { id: 'history', name: 'Payroll History', icon: Calendar },
            { id: 'schedule', name: 'Schedule', icon: Settings },
            { id: 'validation', name: 'Validation', icon: CheckCircle }
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

      {/* Current Period Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Employee Payroll Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Employee Payroll Details</h3>
              <div className="flex items-center space-x-3">
                <button className="text-gray-600 hover:text-gray-700 p-2">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-700 p-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockEmployeePayroll.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Regular: {employee.regularHours}h</div>
                          <div className="text-orange-600">Overtime: {employee.overtimeHours}h</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(employee.grossPay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(employee.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(employee.netPay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                          {getStatusIcon(employee.status)}
                          <span className="ml-1">{employee.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-700">
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payroll History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {payrollPeriods.map((period) => (
                <div key={period.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(period.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{period.name}</h4>
                      <p className="text-sm text-gray-500">Due: {formatDate(period.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                      {period.status}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Schedule Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payroll Frequency
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Monthly</option>
                  <option>Bi-weekly</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cut-off Date
                </label>
                <input
                  type="date"
                  defaultValue="2025-09-30"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Date
                </label>
                <input
                  type="date"
                  defaultValue="2025-10-05"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-process
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Validation</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Run Validation</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Employee Data Validation</p>
                    <p className="text-sm text-green-600">All employee records are valid</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Passed</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Time & Attendance</p>
                    <p className="text-sm text-green-600">All timesheets approved</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Passed</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Tax Calculations</p>
                    <p className="text-sm text-yellow-600">3 employees need tax form updates</p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Warning</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Benefits Deductions</p>
                    <p className="text-sm text-green-600">All deductions calculated correctly</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Passed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollProcessing;