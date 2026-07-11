/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { 
  Package, 
  ClipboardList, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentPage } = useNavigation();

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mock dashboard summary data to keep the screen active and high-fidelity
  const stats = [
    {
      label: 'Total Active Inventory',
      value: '1,248 Items',
      desc: 'Across 5 departments',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      page: 'inventory' as const
    },
    {
      label: 'Pending Requisitions',
      value: '8 Requests',
      desc: '3 awaiting your signature',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
      page: 'requests' as const
    },
    {
      label: 'Approvals Action List',
      value: '5 Pending',
      desc: 'Requires verified audit',
      icon: CheckSquare,
      color: 'bg-emerald-50 text-emerald-600',
      page: 'approvals' as const
    },
    {
      label: 'Low Stock Alerts',
      value: '3 Commodities',
      desc: 'A4 paper, toner, adapter',
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      page: 'inventory' as const
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'A4 Paper (Box) Stock In',
      type: 'stock',
      user: 'Storekeeper Aster',
      time: '10 mins ago',
      badge: '+50 Boxes',
      badgeColor: 'bg-green-50 text-green-700'
    },
    {
      id: 2,
      title: 'ThinkPad Laptop Dock Requisition',
      type: 'request',
      user: 'M. Yohannes',
      time: '1 hour ago',
      badge: 'Pending Head EO',
      badgeColor: 'bg-amber-50 text-amber-700'
    },
    {
      id: 3,
      title: 'Wireless Mouse (Logitech) Issuance',
      type: 'issue',
      user: 'Storekeeper Aster',
      time: '3 hours ago',
      badge: 'Completed',
      badgeColor: 'bg-blue-50 text-blue-700'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-slate-900 rounded-lg p-6 md:p-8 text-white relative overflow-hidden shadow-sm border border-slate-800">
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.displayName}!
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Welcome to the Ethiopian Reinsurance S.C. enterprise inventory ecosystem. Track high-value assets, verify requisition compliance, and secure approval chains in real time.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => setCurrentPage('requests')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-xs tracking-wide rounded text-white shadow-sm transition-all active:scale-98 flex items-center space-x-1.5"
            >
              <span>Create Request</span>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage('inventory')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-semibold text-xs tracking-wide rounded text-slate-300 border border-slate-700 transition-all active:scale-98"
            >
              Scan Inventory
            </button>
          </div>
        </div>
        
        {/* Subtle grid accent */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4 hidden md:block">
          <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="40" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              onClick={() => setCurrentPage(stat.page)}
              className="bg-white p-5 rounded-lg border border-slate-200 hover:shadow-xs transition-all cursor-pointer group flex items-start space-x-4"
            >
              <div className={`p-3 rounded-md ${stat.color} transition-colors shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="space-y-1 leading-tight flex-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stat.value}</h3>
                <p className="text-xs text-slate-500 font-medium">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bento content details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live System Glance Card */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span>Recent Logs & Operations</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Real-time trace logs of stock and requisition updates</p>
              </div>
              <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full animate-pulse border border-green-100 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>System Live</span>
              </span>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-600">
                      <Clock size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        By <span className="font-semibold">{act.user}</span> • {act.time}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${act.badgeColor}`}>
                    {act.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setCurrentPage('requests')}
            className="mt-6 w-full py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-center text-xs font-bold text-slate-700 transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>View Requisition Desk</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Quick Help & Reference Panel */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Compliance Guidelines</h2>
              <p className="text-xs text-slate-400 font-medium">Ethiopian Reinsurance S.C. audit policy</p>
            </div>

            <ul className="space-y-3">
              <li className="p-3 bg-slate-50 rounded border-l-4 border-blue-500 text-xs text-slate-600 font-medium">
                ⚠️ All reinsurance claims department acquisitions exceeding <span className="font-bold text-slate-800">5,000 ETB</span> must get direct sign-off from Department EO.
              </li>
              <li className="p-3 bg-slate-50 rounded border-l-4 border-slate-500 text-xs text-slate-600 font-medium">
                🕒 Processing turnaround time standard is 48 hours for general stationery and office supplies.
              </li>
              <li className="p-3 bg-slate-50 rounded border-l-4 border-amber-500 text-xs text-slate-600 font-medium">
                💻 Technical assets (laptops, servers, switches) require physical verification by IT before inventory logging.
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-slate-900 rounded text-white flex items-center justify-between">
            <div className="leading-tight">
              <p className="text-xs font-bold">QR Asset Labeling</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Generate compliant labels</p>
            </div>
            <button 
              onClick={() => setCurrentPage('qr')}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-all active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
