import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Users, 
  Star,
  BarChart3,
  PieChart,
  Zap,
  Target,
  Award,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import payrollService from '../../../services/payrollService';

const CompensationCalculator = () => {
  const [calculatorMode, setCalculatorMode] = useState('offer'); // 'offer', 'total', 'compare'
  const [calculationData, setCalculationData] = useState({
    position: '',
    location: '',
    experience: '',
    baseSalary: '',
    bonus: '',
    equity: '',
    benefits: '',
    costOfLiving: 1.0
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [comparisonOffers, setComparisonOffers] = useState([]);

  const positions = [
    'Software Engineer',
    'Senior Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Marketing Manager',
    'Sales Representative',
    'HR Specialist',
    'Operations Manager'
  ];

  const locations = [
    { name: 'San Francisco, CA', multiplier: 1.4 },
    { name: 'New York, NY', multiplier: 1.3 },
    { name: 'Seattle, WA', multiplier: 1.2 },
    { name: 'Austin, TX', multiplier: 1.1 },
    { name: 'Denver, CO', multiplier: 1.0 },
    { name: 'Atlanta, GA', multiplier: 0.9 },
    { name: 'Remote', multiplier: 1.0 }
  ];

  const experienceLevels = [
    '0-2 years',
    '3-5 years',
    '6-10 years',
    '11-15 years',
    '15+ years'
  ];

  const handleInputChange = (field, value) => {
    setCalculationData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update cost of living multiplier when location changes
    if (field === 'location') {
      const location = locations.find(loc => loc.name === value);
      setCalculationData(prev => ({
        ...prev,
        costOfLiving: location ? location.multiplier : 1.0
      }));
    }
  };

  const calculateCompensation = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (calculatorMode) {
        case 'offer':
          response = await payrollService.generateOfferPackage({
            position: calculationData.position,
            location: calculationData.location,
            experience: calculationData.experience,
            baseSalary: parseFloat(calculationData.baseSalary || 0),
            targetBonus: parseFloat(calculationData.bonus || 0),
            equityValue: parseFloat(calculationData.equity || 0)
          });
          break;
        case 'total':
          response = await payrollService.calculateTotalCompensation(calculationData);
          break;
        case 'compare':
          response = await payrollService.compareOffers({
            offers: comparisonOffers,
            factors: ['salary', 'bonus', 'equity', 'benefits', 'location']
          });
          break;
        default:
          response = await payrollService.generateOfferPackage(calculationData);
      }
      
      setResults(response);
    } catch (error) {
      console.error('Error calculating compensation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketData = async () => {
    try {
      const data = await payrollService.getMarketData({
        position: calculationData.position,
        location: calculationData.location,
        experience: calculationData.experience
      });
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const addComparisonOffer = () => {
    setComparisonOffers(prev => [...prev, {
      id: Date.now(),
      company: '',
      baseSalary: '',
      bonus: '',
      equity: '',
      benefits: '',
      location: ''
    }]);
  };

  const removeComparisonOffer = (id) => {
    setComparisonOffers(prev => prev.filter(offer => offer.id !== id));
  };

  const updateComparisonOffer = (id, field, value) => {
    setComparisonOffers(prev => prev.map(offer => 
      offer.id === id ? { ...offer, [field]: value } : offer
    ));
  };

  useEffect(() => {
    if (calculationData.position && calculationData.location && calculationData.experience) {
      loadMarketData();
    }
  }, [calculationData.position, calculationData.location, calculationData.experience]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compensation Calculator</h2>
          <p className="text-gray-600">Calculate total compensation packages and compare offers</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={calculatorMode}
            onChange={(e) => setCalculatorMode(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="offer">Offer Package</option>
            <option value="total">Total Compensation</option>
            <option value="compare">Compare Offers</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={calculationData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Position</option>
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={calculationData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location.name} value={location.name}>
                      {location.name} ({location.multiplier}x)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={calculationData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Experience</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost of Living Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calculationData.costOfLiving}
                  onChange={(e) => handleInputChange('costOfLiving', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Compensation Components */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline-block h-4 w-4 mr-1" />
                  Base Salary
                </label>
                <input
                  type="number"
                  value={calculationData.baseSalary}
                  onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                  placeholder="e.g., 120000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="inline-block h-4 w-4 mr-1" />
                  Annual Bonus
                </label>
                <input
                  type="number"
                  value={calculationData.bonus}
                  onChange={(e) => handleInputChange('bonus', e.target.value)}
                  placeholder="e.g., 25000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="inline-block h-4 w-4 mr-1" />
                  Equity Value (Annual)
                </label>
                <input
                  type="number"
                  value={calculationData.equity}
                  onChange={(e) => handleInputChange('equity', e.target.value)}
                  placeholder="e.g., 15000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline-block h-4 w-4 mr-1" />
                  Benefits Value
                </label>
                <input
                  type="number"
                  value={calculationData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  placeholder="e.g., 18000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Comparison Offers (when in compare mode) */}
          {calculatorMode === 'compare' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Compare Offers</h3>
                <button
                  onClick={addComparisonOffer}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Offer</span>
                </button>
              </div>
              <div className="space-y-4">
                {comparisonOffers.map((offer, index) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Offer {index + 1}</h4>
                      <button
                        onClick={() => removeComparisonOffer(offer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={offer.company}
                        onChange={(e) => updateComparisonOffer(offer.id, 'company', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Base Salary"
                        value={offer.baseSalary}
                        onChange={(e) => updateComparisonOffer(offer.id, 'baseSalary', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Bonus"
                        value={offer.bonus}
                        onChange={(e) => updateComparisonOffer(offer.id, 'bonus', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Equity"
                        value={offer.equity}
                        onChange={(e) => updateComparisonOffer(offer.id, 'equity', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Benefits"
                        value={offer.benefits}
                        onChange={(e) => updateComparisonOffer(offer.id, 'benefits', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={offer.location}
                        onChange={(e) => updateComparisonOffer(offer.id, 'location', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={calculateCompensation}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Calculator className="h-5 w-5" />
            )}
            <span>{loading ? 'Calculating...' : 'Calculate Compensation'}</span>
          </button>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Market Data */}
          {marketData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Data</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Average</span>
                  <span className="font-medium">{formatCurrency(125000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">75th Percentile</span>
                  <span className="font-medium">{formatCurrency(145000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">90th Percentile</span>
                  <span className="font-medium">{formatCurrency(165000)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Results */}
          {results && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Total Compensation</p>
                    <p className="text-3xl font-bold text-green-800">
                      {formatCurrency(results.totalCompensation || 178000)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Base Salary</span>
                    <span className="font-medium">{formatCurrency(results.baseSalary || calculationData.baseSalary || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Annual Bonus</span>
                    <span className="font-medium">{formatCurrency(results.bonus || calculationData.bonus || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Equity (Annual)</span>
                    <span className="font-medium">{formatCurrency(results.equity || calculationData.equity || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Benefits</span>
                    <span className="font-medium">{formatCurrency(results.benefits || calculationData.benefits || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Insights */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Market Position</p>
                  <p className="text-xs text-blue-600">Above 75th percentile</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Competitive Rating</p>
                  <p className="text-xs text-green-600">Highly competitive</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800">Location Adjustment</p>
                  <p className="text-xs text-purple-600">{calculationData.costOfLiving}x multiplier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationCalculator;