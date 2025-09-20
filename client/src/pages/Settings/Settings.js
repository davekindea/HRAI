import React from 'react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system preferences and manage users
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Panel</h3>
          <p className="text-gray-600 mb-4">This feature is under development</p>
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
};

export default Settings;