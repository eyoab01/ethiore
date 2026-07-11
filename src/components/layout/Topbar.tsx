/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { notificationRepository } from '../../services/firestore';
import { SystemNotification } from '../../types';
import { Logo } from './Logo';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Menu, 
  User, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery } = useNavigation();

  // Notification States
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const allNotifs = await notificationRepository.getAll();
      const filtered = allNotifs.filter(n => {
        const matchesRole = !n.roles || n.roles.length === 0 || n.roles.includes(user.role);
        const matchesUser = !n.userId || n.userId === user.uid;
        return matchesRole && matchesUser;
      });
      setNotifications(filtered);
    } catch (e) {
      console.error('Error fetching notifications in header:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const unreadCount = notifications.filter(n => user && !n.readBy.includes(user.uid)).length;

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await notificationRepository.markAsRead(id, user.uid);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await notificationRepository.markAllAsRead(user.uid);
    await loadNotifications();
  };

  const getNotifIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={14} className="text-amber-500" />;
      case 'success':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'alert':
        return <AlertTriangle size={14} className="text-red-500" />;
      default:
        return <Info size={14} className="text-blue-500" />;
    }
  };

  // Get User Initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left items: Menu Trigger & Brand Name */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:flex items-center space-x-2.5">
          <Logo variant="compact" height={32} className="shadow-xs" />
          <h2 className="text-base lg:text-lg font-black text-slate-800 tracking-tight">
            Ethiopian Reinsurance S.C.
          </h2>
        </div>
      </div>

      {/* Middle Item: Search Box */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory or requests..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none rounded-md text-sm text-slate-800 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Items: Action Alerts & User Avatar Block */}
      <div className="flex items-center space-x-4">
        {/* Alerts Center Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-all hidden xs:block relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Floating drop-down */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Bell size={15} className="text-slate-900" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Alert Center</span>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold tracking-tight underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase">
                    All notifications clear
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isRead = user && notif.readBy.includes(user.uid);
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-3 text-xs space-y-1 hover:bg-slate-50 transition-colors flex items-start space-x-2.5 ${
                          !isRead ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="font-extrabold text-slate-800 flex justify-between items-start gap-1">
                            <span className="line-clamp-1">{notif.title}</span>
                            {!isRead && (
                              <button 
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-700 font-bold p-0.5"
                                title="Mark read"
                              >
                                <Check size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-500 font-medium leading-relaxed text-[11px]">
                            {notif.message}
                          </p>
                          <div className="text-[9px] text-slate-400 font-bold flex items-center space-x-0.5 pt-1">
                            <Clock size={10} />
                            <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-all hidden xs:block">
          <HelpCircle size={18} />
        </button>

        {/* Vertical divider line */}
        <div className="h-6 w-[1px] bg-slate-200 hidden xs:block"></div>

        {/* User Block */}
        {user && (
          <div className="flex items-center space-x-2.5 pl-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full object-cover border border-slate-100"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 text-white font-bold text-xs rounded-full flex items-center justify-center border border-blue-700 shadow-xs">
                {getInitials(user.displayName)}
              </div>
            )}
            
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-800">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {user.department.replace(' Department', ' Dept')}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
