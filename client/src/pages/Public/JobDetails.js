// Placeholder for Public Job Details component
import React from 'react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const PublicJobDetails = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Details</h1>
            <p className="text-gray-600 mb-4">This feature is under development</p>
            <LoadingSpinner />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicJobDetails;