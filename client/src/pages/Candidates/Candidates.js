import React from 'react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Candidates = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Management</h1>
        <p className="mt-2 text-gray-600">
          Search, review, and manage candidate profiles
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Database</h3>
          <p className="text-gray-600 mb-4">This feature is under development</p>
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
};

export default Candidates;