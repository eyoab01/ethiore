/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { Logo } from '../../../components/layout/Logo';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [department, setDepartment] = useState('Claims Department');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    
    if (!email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (isRegister && !displayName) {
      setFormError('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await signUp(email, password, displayName, role, department);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error(err);
      // Auth context handles error setting
    } finally {
      setSubmitting(false);
    }
  };

  // Demo credential auto-fill helper
  const handleQuickFill = (demoEmail: string, demoRole?: UserRole, demoDept?: string) => {
    setEmail(demoEmail);
    setPassword('EthioRe123!');
    if (demoRole && demoDept) {
      setIsRegister(true);
      setDisplayName(demoEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      setRole(demoRole);
      setDepartment(demoDept);
    } else {
      setIsRegister(false);
    }
    setFormError(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          {/* Logo Emblem resembling the brand identity */}
          <Logo variant="full" height={160} className="shadow-lg hover:scale-105 transition-all duration-300 rounded" />
          <h2 className="mt-6 text-center text-2xl font-black text-slate-900 tracking-tight">
            Inventory System
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500 font-medium">
            Ethiopian Reinsurance S.C.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          
          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setFormError(null);
                clearError();
              }}
              className={`w-1/2 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                !isRegister
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setFormError(null);
                clearError();
              }}
              className={`w-1/2 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                isRegister
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Register Account
            </button>
          </div>

          {(error || formError) && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded p-3 text-xs text-red-600 flex items-start space-x-2 animate-fadeIn">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formError || error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Yohannes Mitiku"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 rounded text-sm transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="claims.head@ethiore.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 rounded text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 rounded text-sm transition-all"
              />
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    User Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 rounded text-sm transition-all appearance-none"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Department EO">Department EO</option>
                    <option value="Store Keeper">Store Keeper</option>
                    <option value="System Admin">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 rounded text-sm transition-all appearance-none"
                  >
                    <option value="Claims Department">Claims Dept</option>
                    <option value="Finance Department">Finance Dept</option>
                    <option value="Information Technology">IT Dept</option>
                    <option value="Underwriting Department">Underwriting</option>
                    <option value="Human Resources">HR Dept</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm rounded transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-98"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Register & Sign In' : 'Sign In'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quick-Access Demo Credentials (PW: EthioRe123!)
            </h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('yohannes.m@ethiore.com', 'Employee', 'Claims Department')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  Employee (Claims)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('dept.head@ethiore.com', 'Department EO', 'Claims Department')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  Dept Head (EO)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('store.keeper@ethiore.com', 'Store Keeper', 'Information Technology')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  Store Keeper
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('sys.admin@ethiore.com', 'System Admin', 'Information Technology')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  System Admin
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 Clicking any demo account fills the fields and allows login. If not yet registered on Firebase, switch to Register and click a demo role to auto-complete!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
