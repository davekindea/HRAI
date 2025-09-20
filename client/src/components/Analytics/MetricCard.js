import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'percentage', 
  period = 'vs last period',
  icon: Icon,
  loading = false 
}) => {
  const formatChange = (change, type) => {
    if (change === null || change === undefined) return null;
    
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    
    switch (type) {
      case 'percentage':
        return `${sign}${absChange.toFixed(1)}%`;
      case 'number':
        return `${sign}${absChange.toLocaleString()}`;
      case 'currency':
        return `${sign}$${absChange.toLocaleString()}`;
      default:
        return `${sign}${absChange}`;
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const ChangeIcon = change !== null ? getChangeIcon(change) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {Icon && <Icon className="h-8 w-8 text-gray-400" />}
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      
      {change !== null && (
        <div className="flex items-center">
          <ChangeIcon className={`h-4 w-4 mr-1 ${getChangeColor(change)}`} />
          <span className={`text-sm font-medium ${getChangeColor(change)}`}>
            {formatChange(change, changeType)}
          </span>
          <span className="text-sm text-gray-500 ml-1">{period}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
