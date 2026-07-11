/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { UserRole } from '../../types';
import { Logo } from '../layout/Logo';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const { setCurrentPage } = useNavigation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-sm text-center space-y-6">
          {/* Circular Loader with Logo */}
          <div className="relative flex flex-col items-center">
            <Logo variant="compact" height={60} className="shadow-md animate-pulse mb-4" />
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Ethiopian Reinsurance</h1>
            <p className="text-sm text-slate-500 font-medium">Enterprise Resource Portal</p>
            <p className="text-xs text-slate-400 animate-pulse mt-2">Securing session...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login page (we can handle this inside App.tsx or directly here)
  if (!user) {
    // We defer setting current page to avoid state updates during render, but we can return null and let App.tsx handle rendering the login page
    return null;
  }

  // Role-based authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-slate-200 max-w-lg mx-auto my-12 space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500">
            Your account role (<span className="font-semibold text-slate-700">{user.role}</span>) does not have permission to view this section.
          </p>
          <p className="text-xs text-slate-400">
            Please contact the System Administrator if you believe this is an error.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('dashboard')}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-sm transition-all focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
