import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Calendar, 
  Download, 
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  BarChart3,
  DollarSign,
  FileText,
  Bell,
  Eye,
  RefreshCw
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const TaxCompliance = () => {
  const [activeTab, setActiveTab] = useState('withholdings'); // 'withholdings', 'filings', 'forms', 'alerts', 'settings'
  const [jurisdictions, setJurisdictions] = useState([]);
  const [complianceAlerts, setComplianceAlerts] = useState([]);
  const [taxForms, setTaxForms] = useState([]);
  const [loading, setLoading] = useState(false);

  const mockJurisdictions = [
    { id: 1, name: 'Federal', type: 'Federal', status: 'Active', lastUpdate: '2025-09-01' },
    { id: 2, name: 'California', type: 'State', status: 'Active', lastUpdate: '2025-09-01' },
    { id: 3, name: 'Los Angeles', type: 'Local', status: 'Active', lastUpdate: '2025-08-15' },
    { id: 4, name: 'New York', type: 'State', status: 'Active', lastUpdate: '2025-09-01' }
  ];

  const mockTaxRates = [
    { jurisdiction: 'Federal', type: 'Income Tax', rate: '12-37%', description: 'Progressive rates based on income brackets' },
    { jurisdiction: 'Federal', type: 'Social Security', rate: '6.2%', description: 'Employee portion up to wage base' },
    { jurisdiction: 'Federal', type: 'Medicare', rate: '1.45%', description: 'All wages, additional 0.9% for high earners' },
    { jurisdiction: 'California', type: 'State Income Tax', rate: '1-13.3%', description: 'Progressive rates with additional mental health tax' },
    { jurisdiction: 'California', type: 'State Disability', rate: '0.9%', description: 'Employee paid disability insurance' }
  ];

  const mockAlerts = [
    {
      id: 1,
      type: 'filing_due',
      title: 'Quarterly 941 Filing Due',
      description: 'Q3 2025 Form 941 must be filed by October 31, 2025',
      priority: 'high',
      dueDate: '2025-10-31',
      status: 'pending'
    },
    {
      id: 2,
      type: 'rate_change',
      title: 'California Tax Rate Update',
      description: 'New state disability insurance rate effective January 1, 2026',
      priority: 'medium',
      dueDate: '2026-01-01',
      status: 'acknowledged'
    },
    {
      id: 3,
      type: 'compliance_check',
      title: 'W-4 Forms Missing',
      description: '12 employees need updated W-4 forms on file',
      priority: 'medium',
      dueDate: '2025-12-31',
      status: 'pending'
    }
  ];

  const mockTaxForms = [
    {
      id: 1,
      formType: 'W-2',
      year: 2025,
      employees: 1247,
      status: 'generated',
      generatedDate: '2025-01-15',
      filedDate: null
    },
    {
      id: 2,
      formType: '941',
      quarter: 'Q3 2025',
      status: 'pending',
      dueDate: '2025-10-31',
      amount: 623000
    },
    {
      id: 3,
      formType: '940',
      year: 2024,
      status: 'filed',
      filedDate: '2025-01-31',
      amount: 45000
    }
  ];

  const mockWithholdings = [
    {
      employeeId: 'EMP001',
      name: 'John Smith',
      federalIncome: 1250,
      stateIncome: 620,
      socialSecurity: 485,
      medicare: 113,
      totalWithholdings: 2468
    },
    {
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      federalIncome: 980,
      stateIncome: 485,
      socialSecurity: 380,
      medicare: 89,
      totalWithholdings: 1934
    }
  ];

  useEffect(() => {
    setJurisdictions(mockJurisdictions);
    setComplianceAlerts(mockAlerts);
    setTaxForms(mockTaxForms);
  }, []);

  const calculateWithholdings = async (employeeData) => {
    setLoading(true);
    try {
      const result = await payrollService.calculateTaxWithholdings(employeeData);
      return result;
    } catch (error) {
      console.error('Error calculating withholdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitTaxFiling = async (filingData) => {
    setLoading(true);
    try {
      await payrollService.submitTaxFiling(filingData);
    } catch (error) {
      console.error('Error submitting tax filing:', error);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'filed':
      case 'generated':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax Compliance</h2>
          <p className="text-gray-600">Manage tax calculations, filings, and compliance requirements</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Run Audit</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <FileCheck className="h-4 w-4" />
            <span>File Returns</span>
          </button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Current Filings</p>
              <p className="text-2xl font-bold text-green-800">97%</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Pending Actions</p>
              <p className="text-2xl font-bold text-yellow-800">
                {complianceAlerts.filter(alert => alert.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">YTD Tax Liability</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(5847000)}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Jurisdictions</p>
              <p className="text-2xl font-bold text-purple-800">{jurisdictions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'withholdings', name: 'Tax Withholdings', icon: DollarSign },
            { id: 'filings', name: 'Tax Filings', icon: FileCheck },
            { id: 'forms', name: 'Tax Forms', icon: FileText },
            { id: 'alerts', name: 'Compliance Alerts', icon: Bell },
            { id: 'settings', name: 'Settings', icon: Settings }
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

      {/* Tax Withholdings Tab */}
      {activeTab === 'withholdings' && (
        <div className="space-y-6">
          {/* Tax Rates */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Current Tax Rates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jurisdiction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockTaxRates.map((rate, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rate.jurisdiction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rate.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {rate.rate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rate.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Withholdings */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Employee Tax Withholdings</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Calculate All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Federal Income
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State Income
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Social Security
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicare
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockWithholdings.map((withholding, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{withholding.name}</div>
                          <div className="text-sm text-gray-500">{withholding.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(withholding.federalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(withholding.stateIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(withholding.socialSecurity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(withholding.medicare)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(withholding.totalWithholdings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Forms Tab */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tax Forms</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Generate Forms</span>
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {mockTaxForms.map((form) => (
                <div key={form.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          Form {form.formType}
                          {form.year && ` - ${form.year}`}
                          {form.quarter && ` - ${form.quarter}`}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {form.employees && <p>Employees: {form.employees.toLocaleString()}</p>}
                          {form.amount && <p>Amount: {formatCurrency(form.amount)}</p>}
                          {form.dueDate && <p>Due Date: {formatDate(form.dueDate)}</p>}
                          {form.generatedDate && <p>Generated: {formatDate(form.generatedDate)}</p>}
                          {form.filedDate && <p>Filed: {formatDate(form.filedDate)}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        form.status === 'filed' ? 'bg-green-100 text-green-800' :
                        form.status === 'generated' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {form.status}
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

      {/* Compliance Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Alerts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {complianceAlerts.map((alert) => (
                <div key={alert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        alert.priority === 'high' ? 'bg-red-100' :
                        alert.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        <AlertTriangle className={`h-6 w-6 ${
                          alert.priority === 'high' ? 'text-red-600' :
                          alert.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Due: {formatDate(alert.dueDate)}</span>
                          <span>Priority: {alert.priority}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      {alert.status === 'pending' ? (
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {alert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tax Compliance Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Automatic Filing</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Enable automatic tax filing for quarterly returns</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-gray-700">Auto-generate W-2 forms at year end</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Notification Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Email alerts for upcoming filing deadlines</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Notifications for tax rate changes</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Backup & Recovery</h4>
                <div className="flex items-center space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Backup Tax Data
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                    Download Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCompliance;