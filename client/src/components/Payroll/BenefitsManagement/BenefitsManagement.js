import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Shield, 
  Car, 
  Home, 
  Zap, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Eye,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const BenefitsManagement = () => {
  const [activeTab, setActiveTab] = useState('enrollment'); // 'enrollment', 'plans', 'utilization', 'life-events'
  const [benefits, setBenefits] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  const benefitCategories = [
    { id: 'health', name: 'Health Insurance', icon: Heart, color: 'red' },
    { id: 'dental', name: 'Dental Insurance', icon: Shield, color: 'blue' },
    { id: 'vision', name: 'Vision Insurance', icon: Eye, color: 'purple' },
    { id: 'life', name: 'Life Insurance', icon: Shield, color: 'green' },
    { id: 'disability', name: 'Disability Insurance', icon: Shield, color: 'orange' },
    { id: 'retirement', name: '401(k) Plan', icon: TrendingUp, color: 'indigo' },
    { id: 'transport', name: 'Transit Benefits', icon: Car, color: 'gray' },
    { id: 'wellness', name: 'Wellness Programs', icon: Zap, color: 'pink' }
  ];

  const mockBenefits = [
    {
      id: 1,
      category: 'health',
      name: 'Premium Health Plan',
      provider: 'Blue Cross Blue Shield',
      type: 'Medical',
      employeeCost: 180,
      employerCost: 520,
      coverage: 'Employee + Family',
      deductible: 1500,
      outOfPocketMax: 6000,
      enrolled: true
    },
    {
      id: 2,
      category: 'dental',
      name: 'Comprehensive Dental',
      provider: 'Delta Dental',
      type: 'Dental',
      employeeCost: 45,
      employerCost: 85,
      coverage: 'Employee + Family',
      deductible: 50,
      outOfPocketMax: 1500,
      enrolled: true
    },
    {
      id: 3,
      category: 'vision',
      name: 'Vision Plus',
      provider: 'VSP',
      type: 'Vision',
      employeeCost: 12,
      employerCost: 18,
      coverage: 'Employee Only',
      deductible: 0,
      outOfPocketMax: 500,
      enrolled: false
    },
    {
      id: 4,
      category: 'retirement',
      name: '401(k) Savings Plan',
      provider: 'Fidelity',
      type: 'Retirement',
      employeeCost: 0,
      employerCost: 0,
      coverage: 'Employee',
      matchPercentage: 6,
      vestingSchedule: '6 years graded',
      enrolled: true
    }
  ];

  const mockEmployees = [
    { id: 1, name: 'John Smith', department: 'Engineering', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', department: 'Marketing', status: 'Active' },
    { id: 3, name: 'Mike Davis', department: 'Sales', status: 'Active' },
    { id: 4, name: 'Lisa Chen', department: 'HR', status: 'Active' }
  ];

  const lifeEventTypes = [
    { id: 'marriage', name: 'Marriage', description: 'Getting married' },
    { id: 'divorce', name: 'Divorce', description: 'Legal separation or divorce' },
    { id: 'birth', name: 'Birth/Adoption', description: 'Birth or adoption of a child' },
    { id: 'death', name: 'Death of Dependent', description: 'Death of covered dependent' },
    { id: 'employment', name: 'Employment Change', description: 'Spouse employment status change' },
    { id: 'coverage', name: 'Loss of Coverage', description: 'Loss of other health coverage' }
  ];

  useEffect(() => {
    setBenefits(mockBenefits);
  }, []);

  const handleEnrollment = async (benefitId, action) => {
    setLoading(true);
    try {
      if (action === 'enroll') {
        await payrollService.enrollInBenefits({
          employeeId: selectedEmployee,
          benefitId: benefitId,
          coverage: 'Employee + Family'
        });
      } else {
        // Handle unenrollment logic
      }
      
      // Refresh data
      setBenefits(prev => prev.map(benefit => 
        benefit.id === benefitId 
          ? { ...benefit, enrolled: action === 'enroll' }
          : benefit
      ));
    } catch (error) {
      console.error('Error processing enrollment:', error);
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

  const getCategoryIcon = (categoryId) => {
    const category = benefitCategories.find(cat => cat.id === categoryId);
    if (!category) return Heart;
    return category.icon;
  };

  const getCategoryColor = (categoryId) => {
    const category = benefitCategories.find(cat => cat.id === categoryId);
    if (!category) return 'red';
    return category.color;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Benefits Management</h2>
          <p className="text-gray-600">Manage employee benefits enrollment and administration</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Employee</option>
            {mockEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Open Enrollment
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'enrollment', name: 'Benefits Enrollment', icon: CheckCircle },
            { id: 'plans', name: 'Available Plans', icon: Shield },
            { id: 'utilization', name: 'Utilization', icon: TrendingUp },
            { id: 'life-events', name: 'Life Events', icon: Calendar }
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

      {/* Benefits Enrollment Tab */}
      {activeTab === 'enrollment' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Enrolled Benefits</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {benefits.filter(b => b.enrolled).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Monthly Cost</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(benefits.filter(b => b.enrolled).reduce((sum, b) => sum + b.employeeCost, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Employer Contribution</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {formatCurrency(benefits.filter(b => b.enrolled).reduce((sum, b) => sum + b.employerCost, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600">Dependents</p>
                  <p className="text-2xl font-bold text-orange-800">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Current Benefits</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {benefits.map(benefit => {
                const Icon = getCategoryIcon(benefit.category);
                const colorClass = getCategoryColor(benefit.category);
                
                return (
                  <div key={benefit.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 bg-${colorClass}-100 rounded-lg`}>
                          <Icon className={`h-6 w-6 text-${colorClass}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{benefit.name}</h4>
                            {benefit.enrolled && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enrolled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{benefit.provider}</p>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Employee Cost:</span>
                              <div className="font-medium">{formatCurrency(benefit.employeeCost)}/mo</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Coverage:</span>
                              <div className="font-medium">{benefit.coverage}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Deductible:</span>
                              <div className="font-medium">{formatCurrency(benefit.deductible)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Out-of-Pocket Max:</span>
                              <div className="font-medium">{formatCurrency(benefit.outOfPocketMax)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-2">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 p-2">
                          <Edit className="h-4 w-4" />
                        </button>
                        {benefit.enrolled ? (
                          <button
                            onClick={() => handleEnrollment(benefit.id, 'unenroll')}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                          >
                            Unenroll
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnrollment(benefit.id, 'enroll')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Enroll
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {benefitCategories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-sm`}
                >
                  <Icon className={`h-4 w-4 text-${category.color}-600`} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(benefit => {
              const Icon = getCategoryIcon(benefit.category);
              const colorClass = getCategoryColor(benefit.category);
              
              return (
                <div key={benefit.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 bg-${colorClass}-100 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${colorClass}-600`} />
                    </div>
                    {benefit.enrolled && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{benefit.provider}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Cost:</span>
                      <span className="font-medium">{formatCurrency(benefit.employeeCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Deductible:</span>
                      <span className="font-medium">{formatCurrency(benefit.deductible)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coverage:</span>
                      <span className="font-medium">{benefit.coverage}</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Utilization Tab */}
      {activeTab === 'utilization' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Utilization Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits Utilization</h3>
              <div className="space-y-4">
                {benefitCategories.slice(0, 4).map(category => {
                  const Icon = category.icon;
                  const utilization = Math.floor(Math.random() * 40) + 60; // Mock data
                  
                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 text-${category.color}-600`} />
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{utilization}%</div>
                        <div className={`w-20 bg-gray-200 rounded-full h-2 mt-1`}>
                          <div 
                            className={`bg-${category.color}-600 h-2 rounded-full`}
                            style={{ width: `${utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Total Monthly Premium</span>
                  <span className="font-bold text-blue-800">{formatCurrency(1247)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">Employee Contribution</span>
                  <span className="font-bold text-green-800">{formatCurrency(387)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-700">Employer Contribution</span>
                  <span className="font-bold text-purple-800">{formatCurrency(860)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Annual Savings (Tax)</span>
                  <span className="font-bold text-gray-800">{formatCurrency(2847)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Life Events Tab */}
      {activeTab === 'life-events' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Qualifying Life Events</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Report Life Event</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lifeEventTypes.map(event => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{event.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Life Events */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Life Events</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Marriage - Sarah Johnson</p>
                    <p className="text-sm text-green-600">Processed on Sept 15, 2025</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Birth of Child - Mike Davis</p>
                    <p className="text-sm text-yellow-600">Reported on Sept 18, 2025</p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitsManagement;