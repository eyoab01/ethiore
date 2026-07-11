/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PlaceholderProps {
  title: string;
  desc: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, desc }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-lg space-y-4">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title} Module</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
        <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-400 font-bold tracking-wide uppercase">
          Awaiting User Stage Approval
        </div>
      </div>
    </div>
  );
};
