import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  Calculator, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  FileCheck, 
  BarChart3,
  CreditCard,
  Shield,
  Award,
  Users,
  FileText,
  Settings
} from 'lucide-react';

// Import components
import PayrollOverview from '../../components/Payroll/PayrollOverview/PayrollOverview';
import CompensationCalculator from '../../components/Payroll/CompensationCalculator/CompensationCalculator';
import BenefitsManagement from '../../components/Payroll/BenefitsManagement/BenefitsManagement';
import PayrollProcessing from '../../components/Payroll/PayrollProcessing/PayrollProcessing';
import CompensationManagement from '../../components/Payroll/CompensationManagement/CompensationManagement';
import TaxCompliance from '../../components/Payroll/TaxCompliance/TaxCompliance';
import PayrollReporting from '../../components/Payroll/PayrollReporting/PayrollReporting';

const Payroll = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: 'Overview',
      icon: BarChart3,
      component: PayrollOverview,
      description: 'Payroll dashboard and summary'
    },
    {
      name: 'Compensation Calculator',
      icon: Calculator,
      component: CompensationCalculator,
      description: 'Calculate total compensation packages'
    },
    {
      name: 'Benefits Management',
      icon: Heart,
      component: BenefitsManagement,
      description: 'Manage employee benefits and enrollment'
    },
    {
      name: 'Payroll Processing',
      icon: CreditCard,
      component: PayrollProcessing,
      description: 'Process payroll and manage payments'
    },
    {
      name: 'Compensation Management',
      icon: TrendingUp,
      component: CompensationManagement,
      description: 'Manage raises, bonuses, and promotions'
    },
    {
      name: 'Tax Compliance',
      icon: Shield,
      component: TaxCompliance,
      description: 'Tax calculations and compliance'
    },
    {
      name: 'Reporting & Analytics',
      icon: FileText,
      component: PayrollReporting,
      description: 'Comprehensive payroll reports'
    }
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Payroll, Compensation & Benefits
                </h1>
                <p className="mt-2 text-gray-600">
                  Comprehensive payroll management and employee compensation
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  v9.0.0
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Sidebar */}
            <div className="lg:col-span-3">
              <Tab.List className="space-y-1">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        classNames(
                          selected
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-200 text-gray-900 hover:bg-gray-50',
                          'group border-l-4 px-3 py-3 flex items-start text-sm font-medium w-full transition-colors duration-200'
                        )
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-start space-x-3 w-full">
                          <Icon
                            className={classNames(
                              selected ? 'text-blue-500' : 'text-gray-400',
                              'flex-shrink-0 h-5 w-5 mt-0.5'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-left">
                              <p className="font-medium">{tab.name}</p>
                              <p className={classNames(
                                selected ? 'text-blue-600' : 'text-gray-500',
                                'text-xs mt-1'
                              )}>
                                {tab.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Tab>
                  );
                })}
              </Tab.List>

              {/* Quick Stats */}
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Employees</span>
                    <span className="text-sm font-medium text-gray-900">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Payroll</span>
                    <span className="text-sm font-medium text-gray-900">$2.4M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Benefits Cost</span>
                    <span className="text-sm font-medium text-gray-900">$847K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tax Liability</span>
                    <span className="text-sm font-medium text-gray-900">$623K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="mt-8 lg:mt-0 lg:col-span-9">
              <Tab.Panels>
                {tabs.map((tab, index) => {
                  const Component = tab.component;
                  return (
                    <Tab.Panel key={index} className="focus:outline-none">
                      <div className="bg-white rounded-lg shadow">
                        <Component />
                      </div>
                    </Tab.Panel>
                  );
                })}
              </Tab.Panels>
            </div>
          </div>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Payroll;