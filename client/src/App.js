import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Jobs from './pages/Jobs/Jobs';
import JobDetails from './pages/Jobs/JobDetails';
import Applications from './pages/Applications/Applications';
import ApplicationDetails from './pages/Applications/ApplicationDetails';
import Candidates from './pages/Candidates/Candidates';
import CandidateDetails from './pages/Candidates/CandidateDetails';
import Analytics from './pages/Analytics/Analytics';
import Payroll from './pages/Payroll/Payroll';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';
import PublicJobBoard from './pages/Public/JobBoard';
import PublicJobDetails from './pages/Public/JobDetails';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/jobs" element={<PublicJobBoard />} />
        <Route path="/jobs/:id" element={<PublicJobDetails />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* HR/Admin Routes */}
                  {user.userType === 'user' && (
                    <>
                      <Route path="/admin/jobs" element={<Jobs />} />
                      <Route path="/admin/jobs/:id" element={<JobDetails />} />
                      <Route path="/admin/applications" element={<Applications />} />
                      <Route path="/admin/applications/:id" element={<ApplicationDetails />} />
                      <Route path="/admin/candidates" element={<Candidates />} />
                      <Route path="/admin/candidates/:id" element={<CandidateDetails />} />
                      <Route path="/admin/analytics" element={<Analytics />} />
                      <Route path="/admin/payroll" element={<Payroll />} />
                      <Route path="/admin/settings" element={<Settings />} />
                    </>
                  )}
                  
                  {/* Candidate Routes */}
                  {user.userType === 'candidate' && (
                    <>
                      <Route path="/my-applications" element={<Applications />} />
                      <Route path="/browse-jobs" element={<Jobs />} />
                    </>
                  )}
                  
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </div>
  );
}

export default App;