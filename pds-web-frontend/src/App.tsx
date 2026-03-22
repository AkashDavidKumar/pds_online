import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import BookSlot from './pages/BookSlot';
import Transactions from './pages/Transactions';
import Contact from './pages/Contact';
import DealerDashboard from './pages/DealerDashboard';
import VerifyUser from './pages/VerifyUser';
import Distribute from './pages/Distribute';
import Inventory from './pages/Inventory';
import DealerUsers from './pages/DealerUsers';
import DealerMessages from './pages/DealerMessages';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    // If user is dealer trying to access beneficiary page, redirect to dealer dash
    // If beneficiary trying to access dealer page, redirect to user dash
    return user.role === 'dealer' || user.role === 'admin' 
      ? <Navigate to="/dealer/dashboard" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="overlay">
          <div className="min-h-screen font-sans selection:bg-blue-200">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute role="beneficiary">
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute role="beneficiary">
                    <History />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transactions" 
                element={
                  <ProtectedRoute role="beneficiary">
                    <Transactions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/book-slot" 
                element={
                  <ProtectedRoute role="beneficiary">
                    <BookSlot />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contact" 
                element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                } 
              />

              {/* Dealer Routes */}
              <Route 
                path="/dealer/dashboard" 
                element={
                  <ProtectedRoute role="dealer">
                    <DealerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer/verify" 
                element={
                  <ProtectedRoute role="dealer">
                    <VerifyUser />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer/distribute/:slotId?" 
                element={
                  <ProtectedRoute role="dealer">
                    <Distribute />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer/inventory" 
                element={
                  <ProtectedRoute role="dealer">
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer/users" 
                element={
                  <ProtectedRoute role="dealer">
                    <DealerUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer/messages" 
                element={
                  <ProtectedRoute role="dealer">
                    <DealerMessages />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
