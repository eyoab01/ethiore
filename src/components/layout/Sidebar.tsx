/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { ActivePage } from '../../types';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Users as UsersIcon,
  Shield,
  Building2,
  Package,
  ArrowLeftRight,
  ClipboardList,
  CheckSquare,
  QrCode,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, signOut } = useAuth();
  const { currentPage, setCurrentPage } = useNavigation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: UsersIcon, roles: ['System Admin'] },
    { id: 'roles', label: 'Roles', icon: Shield, roles: ['System Admin'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['System Admin'] },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'stock', label: 'Stock In/Out', icon: ArrowLeftRight, roles: ['Store Keeper', 'System Admin'] },
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, roles: ['Department EO', 'Store Keeper', 'System Admin'] },
    { id: 'qr', label: 'QR Management', icon: QrCode },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ] as const;

  const handleNavigate = (pageId: ActivePage) => {
    setCurrentPage(pageId);
    setMobileOpen(false);
  };

  const visibleMenuItems = menuItems.filter(
    (item: any) => !item.roles || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo variant="compact" height={40} className="shadow-md" />
          <div className="leading-tight">
            <h1 className="text-lg font-black text-white tracking-tight">EthioRe</h1>
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">
              Inventory S.C.
            </p>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {visibleMenuItems.map((item) => {
          const isActive = currentPage === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as ActivePage)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500 border-l-4 border-blue-600 rounded-r-full font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <IconComponent size={18} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 rounded-md transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Sheet */}
          <div className="relative w-64 max-w-xs h-full animate-slideIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
