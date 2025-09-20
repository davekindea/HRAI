import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Target, 
  Users, 
  BarChart3,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Calendar,
  FileText,
  Filter
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const CompensationManagement = () => {
  const [activeTab, setActiveTab] = useState('raises'); // 'raises', 'bonuses', 'equity', 'reviews', 'analytics'
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  const mockEmployees = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'John Smith',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      currentSalary: 120000,
      lastReview: '2025-03-15',
      nextReview: '2025-09-15',
      performanceRating: 4.2,
      compRatio: 95.5,
      marketPosition: 'At Market',
      manager: 'Alice Johnson'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      position: 'Marketing Manager',
      department: 'Marketing',
      currentSalary: 95000,
      lastReview: '2025-01-20',
      nextReview: '2025-07-20',
      performanceRating: 4.7,
      compRatio: 102.3,
      marketPosition: 'Above Market',
      manager: 'Mike Wilson'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Mike Davis',
      position: 'Sales Representative',
      department: 'Sales',
      currentSalary: 75000,
      lastReview: '2025-02-10',
      nextReview: '2025-08-10',
      performanceRating: 3.8,
      compRatio: 88.2,
      marketPosition: 'Below Market',
      manager: 'Lisa Chen'
    }
  ];

  const mockCompReviews = [
    {
      id: 1,
      employee: 'John Smith',
      reviewDate: '2025-09-15',
      currentSalary: 120000,
      proposedSalary: 128000,
      increase: 6.7,
      reason: 'Performance review and market adjustment',
      status: 'pending',
      approver: 'Alice Johnson'
    },
    {
      id: 2,
      employee: 'Sarah Johnson',
      reviewDate: '2025-09-20',
      currentSalary: 95000,
      proposedSalary: 102000,
      increase: 7.4,
      reason: 'Promotion to Senior Marketing Manager',
      status: 'approved',
      approver: 'Mike Wilson'
    }
  ];

  const mockBonuses = [
    {
      id: 1,
      employee: 'John Smith',
      type: 'Performance Bonus',
      amount: 8000,
      period: 'Q3 2025',
      status: 'approved',
      payDate: '2025-10-15'
    },
    {
      id: 2,
      employee: 'Sarah Johnson',
      type: 'Sales Achievement',
      amount: 5000,
      period: 'Q3 2025',
      status: 'pending',
      payDate: '2025-10-15'
    },
    {
      id: 3,
      employee: 'Mike Davis',
      type: 'Spot Bonus',
      amount: 2000,
      period: 'September 2025',
      status: 'paid',
      payDate: '2025-09-30'
    }
  ];

  useEffect(() => {
    setEmployees(mockEmployees);
  }, []);

  const processRaise = async (employeeId, raiseData) => {
    setLoading(true);
    try {
      await payrollService.processRaise({
        employeeId,
        currentSalary: raiseData.currentSalary,
        newSalary: raiseData.newSalary,
        effectiveDate: raiseData.effectiveDate,
        reason: raiseData.reason
      });
    } catch (error) {
      console.error('Error processing raise:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBonusPayment = async (bonusData) => {
    setLoading(true);
    try {
      await payrollService.processBonusPayment(bonusData);
    } catch (error) {
      console.error('Error processing bonus:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarketPositionColor = (position) => {
    switch (position) {
      case 'Above Market':
        return 'text-green-600';
      case 'At Market':
        return 'text-blue-600';
      case 'Below Market':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compensation Management</h2>
          <p className="text-gray-600">Manage salary adjustments, bonuses, and compensation planning</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employees</option>
            {mockEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Review</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'raises', name: 'Salary Adjustments', icon: TrendingUp },
            { id: 'bonuses', name: 'Bonuses', icon: Award },
            { id: 'equity', name: 'Equity Grants', icon: Star },
            { id: 'reviews', name: 'Review Cycle', icon: Calendar },
            { id: 'analytics', name: 'Pay Analytics', icon: BarChart3 }
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

      {/* Salary Adjustments Tab */}
      {activeTab === 'raises' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-blue-800">12</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Approved Raises</p>
                  <p className="text-2xl font-bold text-green-800">8</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Budget Impact</p>
                  <p className="text-2xl font-bold text-purple-800">{formatCurrency(284000)}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600">Avg. Increase</p>
                  <p className="text-2xl font-bold text-orange-800">6.8%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Compensation Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Employee Compensation</h3>
              <div className="flex items-center space-x-3">
                <button className="text-gray-600 hover:text-gray-700 p-2">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  Bulk Actions
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
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.position}</div>
                        <div className="text-sm text-gray-500">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(employee.currentSalary)}
                        <div className="text-sm text-gray-500">Ratio: {employee.compRatio}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{employee.performanceRating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getMarketPositionColor(employee.marketPosition)}`}>
                          {employee.marketPosition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(employee.nextReview)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-700">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-700">
                            <TrendingUp className="h-4 w-4" />
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

      {/* Bonuses Tab */}
      {activeTab === 'bonuses' && (
        <div className="space-y-6">
          {/* Bonus Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Total Bonuses (YTD)</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(485000)}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Recipients</p>
                  <p className="text-2xl font-bold text-blue-800">247</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Average Bonus</p>
                  <p className="text-2xl font-bold text-purple-800">{formatCurrency(1963)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bonuses</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Bonus</span>
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {mockBonuses.map((bonus) => (
                <div key={bonus.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{bonus.employee}</h4>
                        <p className="text-sm text-gray-600">{bonus.type} - {bonus.period}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(bonus.amount)}</span>
                          <span className="text-gray-500">Pay Date:</span>
                          <span className="text-gray-900">{formatDate(bonus.payDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bonus.status)}`}>
                        {bonus.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-2">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 p-2">
                          <Edit className="h-4 w-4" />
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

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Review Cycle Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Review Cycle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Pending Reviews</h4>
                <div className="space-y-3">
                  {mockCompReviews.filter(review => review.status === 'pending').map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">{review.employee}</p>
                        <p className="text-sm text-yellow-600">
                          {formatCurrency(review.currentSalary)} → {formatCurrency(review.proposedSalary)} (+{review.increase}%)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                          Approve
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Approved Reviews</h4>
                <div className="space-y-3">
                  {mockCompReviews.filter(review => review.status === 'approved').map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">{review.employee}</p>
                        <p className="text-sm text-green-600">
                          {formatCurrency(review.currentSalary)} → {formatCurrency(review.proposedSalary)} (+{review.increase}%)
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pay Equity Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Equity Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Pay Equity Score</span>
                  <span className="text-lg font-bold text-green-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <div className="text-xs text-gray-500">
                  Based on position, experience, and performance factors
                </div>
              </div>
            </div>

            {/* Compensation Trends */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Trends</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Annual Increase</span>
                  <span className="text-sm font-medium text-gray-900">6.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Positioning</span>
                  <span className="text-sm font-medium text-blue-600">95th Percentile</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="text-sm font-medium text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Compensation Growth</span>
                  <span className="text-sm font-medium text-gray-900">8.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompensationManagement;