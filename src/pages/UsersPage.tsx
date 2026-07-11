/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { userRepository, departmentRepository } from '../services/firestore';
import { UserProfile, UserRole, Department } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserCog, 
  Mail, 
  Building, 
  ShieldAlert, 
  Search, 
  Filter, 
  UserMinus, 
  Edit2, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { searchQuery } = useNavigation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter states
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Employee');
  const [editDept, setEditDept] = useState<string>('Claims Department');
  const [updating, setUpdating] = useState(false);

  // Add Staff states
  const [isAdding, setIsAdding] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Employee');
  const [newDept, setNewDept] = useState('Claims Department');
  const [adding, setAdding] = useState(false);

  // Load users and departments
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await userRepository.getAll();
      const allDepts = await departmentRepository.getAll();
      setUsers(allUsers);
      setDepartments(allDepts);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Could not retrieve user directory. Check permissions in firestore.rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.uid);
    setEditRole(user.role);
    setEditDept(user.department);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleUpdateUser = async (uid: string) => {
    if (uid === currentUser?.uid && editRole !== currentUser.role) {
      const confirmSelfDemote = window.confirm(
        "Warning: You are editing your own role. Demoting yourself from System Admin will lock you out of this panel. Proceed?"
      );
      if (!confirmSelfDemote) return;
    }

    setUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await userRepository.updateProfile({
        uid,
        role: editRole,
        department: editDept
      });
      setSuccessMessage('Staff member profile updated successfully.');
      setEditingUserId(null);
      // Reload list
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update user profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newEmail.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const generatedUid = `emp-${Date.now()}`;
      await userRepository.saveProfile({
        uid: generatedUid,
        email: newEmail.trim().toLowerCase(),
        displayName: newDisplayName.trim(),
        role: newRole,
        department: newDept,
        createdAt: new Date().toISOString()
      });

      setSuccessMessage(`New staff member "${newDisplayName}" registered successfully.`);
      setIsAdding(false);
      setNewDisplayName('');
      setNewEmail('');
      setNewRole('Employee');
      if (departments.length > 0) {
        setNewDept(departments[0].name);
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to register new staff member.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStaff = async (item: UserProfile) => {
    if (item.uid === currentUser?.uid) {
      setError('You cannot delete your own profile.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${item.displayName}" from the Staff Directory?`);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await userRepository.deleteProfile(item.uid);
      setSuccessMessage(`Staff member "${item.displayName}" was removed from the directory.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete staff member.');
    }
  };

  // Filter & Search Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRoleFilter === 'all' || user.role === selectedRoleFilter;
    const matchesDept = selectedDeptFilter === 'all' || user.department === selectedDeptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'System Admin':
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Store Keeper':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Department EO':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <Users className="text-slate-950" size={28} />
            <span>Staff Directory</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage roles, departments, and credentials for Ethiopian Reinsurance S.C. staff.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isAdding && (
            <button
              onClick={() => {
                setIsAdding(true);
                if (departments.length > 0) {
                  setNewDept(departments[0].name);
                }
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus size={14} />
              <span>Add Staff Member</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <span>Refresh Directory</span>
          </button>
        </div>
      </div>

      {/* Register New Staff Member Form Block */}
      {isAdding && (
        <form 
          onSubmit={handleAddStaff}
          className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCog size={16} />
              <span>Register New Staff Member</span>
            </h3>
            <button 
              type="button"
              onClick={() => setIsAdding(false)} 
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Samuel Ayele"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. samuel.ayele@ethiore.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Enterprise Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all cursor-pointer"
              >
                <option value="Employee">Employee</option>
                <option value="Department EO">Department EO</option>
                <option value="Store Keeper">Store Keeper</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Department</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all cursor-pointer"
              >
                {departments.length === 0 ? (
                  <>
                    <option value="Claims Department">Claims Department</option>
                    <option value="Finance Department">Finance Department</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Underwriting Department">Underwriting Department</option>
                    <option value="Human Resources">Human Resources</option>
                  </>
                ) : (
                  departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded transition-colors"
            >
              {adding ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      )}

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-100 rounded text-sm text-green-700 flex items-start space-x-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded text-sm text-red-700 flex items-start space-x-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Toolbar / Filters Panel */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="Department EO">Department EO</option>
            <option value="Store Keeper">Store Keeper</option>
            <option value="System Admin">System Admin</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.length === 0 ? (
              <>
                <option value="Claims Department">Claims Dept</option>
                <option value="Finance Department">Finance Dept</option>
                <option value="Information Technology">IT Dept</option>
                <option value="Underwriting Department">Underwriting</option>
                <option value="Human Resources">HR Dept</option>
              </>
            ) : (
              departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))
            )}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Total: <span className="text-slate-800">{filteredUsers.length}</span> Active Staff Members
        </div>
      </div>

      {/* Main Staff Directory Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">
              Syncing Ledger Profiles...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No staff members found</h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
              We couldn't find any profiles matching your search or filters. Try relaxing your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Staff Member</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Enterprise Role</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((item) => {
                  const isEditing = editingUserId === item.uid;
                  return (
                    <tr 
                      key={item.uid}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isEditing ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      {/* Name / Email Column */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200">
                            {item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{item.displayName}</span>
                              {item.uid === currentUser?.uid && (
                                <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                              <Mail size={12} className="text-slate-300" />
                              <span>{item.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department Column */}
                      <td className="py-4.5 px-6">
                        {isEditing ? (
                          <select
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 rounded text-xs font-medium outline-none focus:border-blue-600 transition-all cursor-pointer"
                          >
                            {departments.length === 0 ? (
                              <>
                                <option value="Claims Department">Claims Dept</option>
                                <option value="Finance Department">Finance Dept</option>
                                <option value="Information Technology">IT Dept</option>
                                <option value="Underwriting Department">Underwriting</option>
                                <option value="Human Resources">HR Dept</option>
                              </>
                            ) : (
                              departments.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                              ))
                            )}
                          </select>
                        ) : (
                          <div className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                            <Building size={13} className="text-slate-400" />
                            <span>{item.department}</span>
                          </div>
                        )}
                      </td>

                      {/* Role Column */}
                      <td className="py-4.5 px-6">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 rounded text-xs font-medium outline-none focus:border-blue-600 transition-all cursor-pointer"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Department EO">Department EO</option>
                            <option value="Store Keeper">Store Keeper</option>
                            <option value="System Admin">System Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide ${getRoleBadgeStyle(item.role)}`}>
                            {item.role}
                          </span>
                        )}
                      </td>

                      {/* Created Date Column */}
                      <td className="py-4.5 px-6 text-xs text-slate-400 font-semibold">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4.5 px-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleUpdateUser(item.uid)}
                              disabled={updating}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded transition-colors"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded transition-all"
                              title="Edit Role & Department"
                            >
                              <Edit2 size={14} />
                            </button>
                            {item.uid !== currentUser?.uid && (
                              <button
                                onClick={() => handleDeleteStaff(item)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                title="Remove Staff Member"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information / Governance Box */}
      <div className="bg-slate-900 text-slate-300 rounded-lg p-5 border border-slate-800 flex items-start space-x-4">
        <div className="p-2 bg-slate-800 text-amber-500 rounded-md">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1 leading-tight">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access Governance Notice</h4>
          <p className="text-xs text-slate-400 font-medium">
            Role allocations control access rights to specific transaction modules. Granting <span className="text-white font-semibold">"System Admin"</span> access allows the recipient to re-configure security rules, seed baseline databases, and alter other profiles. Please audit these permissions periodically to stay compliant with Ethiopian Reinsurance S.C. governance guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
