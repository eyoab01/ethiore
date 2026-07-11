/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { departmentRepository, userRepository } from '../services/firestore';
import { Department, UserProfile } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  User, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  Users, 
  Briefcase 
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { searchQuery } = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Department values
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newHeadUid, setNewHeadUid] = useState('');

  // Editing Department values
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editHeadUid, setEditHeadUid] = useState('');

  // Load departments and users
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allDepts = await departmentRepository.getAll();
      const allUsers = await userRepository.getAll();
      setDepartments(allDepts);
      setUsers(allUsers);
    } catch (err: any) {
      console.error('Error loading departments:', err);
      setError('Could not retrieve departments or user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute staff counts per department
  const getStaffCount = (deptName: string) => {
    return users.filter(u => u.department.toLowerCase() === deptName.toLowerCase()).length;
  };

  // Handle Add Department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formattedId = newId.trim().toLowerCase().replace(/\s+/g, '-');
    const formattedCode = newCode.trim().toUpperCase();

    if (!formattedId || !newName.trim() || !formattedCode) {
      setError('All fields are required.');
      return;
    }

    // Validate unique ID and Code
    if (departments.some(d => d.id === formattedId)) {
      setError(`A department with ID "${formattedId}" already exists.`);
      return;
    }
    if (departments.some(d => d.code === formattedCode)) {
      setError(`A department with Code "${formattedCode}" already exists.`);
      return;
    }

    const headUser = users.find(u => u.uid === newHeadUid);

    const newDept: Department = {
      id: formattedId,
      name: newName.trim(),
      code: formattedCode,
      headUid: newHeadUid || undefined,
      headName: headUser ? headUser.displayName : undefined
    };

    try {
      await departmentRepository.create(newDept);
      setSuccessMessage(`Department "${newName}" created successfully.`);
      setIsAdding(false);
      // Reset form
      setNewId('');
      setNewName('');
      setNewCode('');
      setNewHeadUid('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create department.');
    }
  };

  // Handle Start Edit
  const handleStartEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditHeadUid(dept.headUid || '');
  };

  // Handle Save Edit
  const handleSaveEdit = async (id: string) => {
    setError(null);
    setSuccessMessage(null);

    const formattedCode = editCode.trim().toUpperCase();
    if (!editName.trim() || !formattedCode) {
      setError('Name and Code are required.');
      return;
    }

    // Validate unique Code excluding current department
    if (departments.some(d => d.id !== id && d.code === formattedCode)) {
      setError(`Another department already has code "${formattedCode}".`);
      return;
    }

    const headUser = users.find(u => u.uid === editHeadUid);

    const updatedDept: Department = {
      id,
      name: editName.trim(),
      code: formattedCode,
      headUid: editHeadUid || undefined,
      headName: headUser ? headUser.displayName : undefined
    };

    try {
      await departmentRepository.update(updatedDept);
      setSuccessMessage('Department configurations updated.');
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update department.');
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (dept: Department) => {
    const staffCount = getStaffCount(dept.name);
    let confirmMsg = `Are you sure you want to delete the ${dept.name} (${dept.code})?`;
    if (staffCount > 0) {
      confirmMsg += `\n\nWARNING: There are currently ${staffCount} staff members assigned to this department in the directory. They will lose their department mapping.`;
    }

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await departmentRepository.delete(dept.id);
      setSuccessMessage(`Department "${dept.name}" was successfully removed.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete department.');
    }
  };

  // Filter list by main search query (via layout search bar)
  const filteredDepts = departments.filter((dept) => {
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      (dept.headName && dept.headName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <Building className="text-slate-950" size={28} />
            <span>Departments Structure</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Define organizational boundaries, department codes, and delegate Executive Officers.
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="self-start sm:self-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus size={14} />
            <span>New Department</span>
          </button>
        )}
      </div>

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

      {/* Register New Department Form Block */}
      {isAdding && (
        <form 
          onSubmit={handleAddDepartment}
          className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Building size={16} />
              <span>Register New Department</span>
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
            {/* ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department ID</label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="e.g. dept-it-ops"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. IT Operations"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. ITOPS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Head Executive Officer */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department EO</label>
              <select
                value={newHeadUid}
                onChange={(e) => setNewHeadUid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- No EO Assigned --</option>
                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.displayName} ({user.role})
                  </option>
                ))}
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
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
            >
              Register Department
            </button>
          </div>
        </form>
      )}

      {/* Grid List of Departments */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">
            Loading Departments directory...
          </p>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="bg-white py-20 text-center rounded-lg border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No departments found</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
            Try adjusting your search query in the top header.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => {
            const isEditing = editingId === dept.id;
            const staffCount = getStaffCount(dept.name);

            return (
              <div 
                key={dept.id}
                className={`bg-white rounded-lg border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  isEditing ? 'border-slate-900 ring-2 ring-slate-900/5 bg-slate-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Department Card Header */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-900 border border-slate-200">
                      <Building size={18} />
                    </div>
                    
                    {!isEditing && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStartEdit(dept)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Body */}
                  {isEditing ? (
                    <div className="space-y-3 pt-1">
                      {/* Edit Name */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                          required
                        />
                      </div>

                      {/* Edit Code */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Short Code</label>
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                          required
                        />
                      </div>

                      {/* Edit Head */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department Head</label>
                        <select
                          value={editHeadUid}
                          onChange={(e) => setEditHeadUid(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all cursor-pointer"
                        >
                          <option value="">-- No EO Assigned --</option>
                          {users.map((user) => (
                            <option key={user.uid} value={user.uid}>
                              {user.displayName} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-end space-x-1.5 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(dept.id)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                          title="Save Changes"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                          {dept.name}
                        </h3>
                        <div className="flex items-center space-x-1 mt-1 text-[10px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-max uppercase tracking-wider">
                          <Hash size={10} />
                          <span>Code: {dept.code}</span>
                        </div>
                      </div>

                      <div className="pt-2 divide-y divide-slate-100 text-xs text-slate-500 font-medium">
                        {/* Executive Officer Head */}
                        <div className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <Briefcase size={13} />
                            <span>Executive Officer</span>
                          </div>
                          {dept.headName ? (
                            <span className="text-slate-800 font-bold">{dept.headName}</span>
                          ) : (
                            <span className="text-slate-300 italic">Unassigned</span>
                          )}
                        </div>

                        {/* Staff count */}
                        <div className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <Users size={13} />
                            <span>Assigned Staff</span>
                          </div>
                          <span className="text-slate-800 font-bold">{staffCount} Members</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Section of Card */}
                <div className="bg-slate-50 px-5 py-3 rounded-b-lg border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>ID: {dept.id}</span>
                  <span className="text-slate-500">{staffCount > 0 ? 'Active Deployment' : 'No staff members'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
