/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requisitionRepository, inventoryRepository, auditLogRepository, notificationRepository } from '../services/firestore';
import { Requisition, InventoryItem } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  MapPin, 
  FileText,
  Building2,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Request Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requestQty, setRequestQty] = useState<number>(1);
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReqs, allItems] = await Promise.all([
        requisitionRepository.getAll(),
        inventoryRepository.getAll()
      ]);
      
      // Employees only see their own requests; admins/EOs/keepers see all or filtered
      if (user?.role === 'Employee') {
        setRequisitions(allReqs.filter(r => r.requestedByUid === user.uid));
      } else {
        setRequisitions(allReqs);
      }
      setInventoryItems(allItems);
      if (allItems.length > 0) {
        setSelectedItemId(allItems[0].id);
      }
    } catch (err) {
      console.error('Error loading requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');

    const targetItem = inventoryItems.find(i => i.id === selectedItemId);
    if (!targetItem) {
      setFormError('Please select a valid asset item.');
      return;
    }

    if (requestQty <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    if (requestQty > targetItem.quantity) {
      setFormError(`Insufficient stock. Current on-hand quantity is ${targetItem.quantity} ${targetItem.unit}.`);
      return;
    }

    if (!purpose.trim()) {
      setFormError('Please provide a business justification.');
      return;
    }

    setSubmitting(true);
    try {
      const randNo = Math.floor(1000 + Math.random() * 9000);
      const reqNo = `REQ-2026-${randNo}`;
      const newReq: Requisition = {
        id: `req-${Date.now()}`,
        requestNo: reqNo,
        requestedByUid: user.uid,
        requestedByName: user.displayName,
        requestedByEmail: user.email,
        department: user.department || 'General Administration',
        itemId: targetItem.id,
        itemName: targetItem.name,
        itemSku: targetItem.sku,
        quantity: requestQty,
        purpose: purpose.trim(),
        status: 'Pending EO Approval',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to repo
      await requisitionRepository.create(newReq);

      // Log action
      await auditLogRepository.logAction(
        user.uid,
        user.displayName,
        user.email,
        user.role,
        'Create Requisition',
        `Submitted Requisition ${reqNo} for ${requestQty} ${targetItem.unit} of "${targetItem.name}".`
      );

      // Notify Department EO and Store Keepers
      await notificationRepository.createNotification(
        'New Requisition Submitted',
        `${user.displayName} (${user.department}) submitted requisition ${reqNo} for ${requestQty} ${targetItem.unit} of ${targetItem.name}.`,
        'info',
        ['Department EO', 'System Admin']
      );

      // Reset form
      setRequestQty(1);
      setPurpose('');
      setIsModalOpen(false);
      
      // Reload list
      await loadData();
    } catch (err: any) {
      console.error('Error submitting requisition:', err);
      setFormError('Failed to submit requisition. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: Requisition['status']) => {
    switch (status) {
      case 'Pending EO Approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Store Issuance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Issued':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: Requisition['status']) => {
    switch (status) {
      case 'Pending EO Approval':
        return <Clock size={14} className="text-amber-500 animate-pulse" />;
      case 'Pending Store Issuance':
        return <AlertCircle size={14} className="text-blue-500" />;
      case 'Issued':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'Rejected':
        return <XCircle size={14} className="text-red-500" />;
    }
  };

  const filteredRequisitions = requisitions.filter(req => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      req.requestNo.toLowerCase().includes(q) ||
      req.itemName.toLowerCase().includes(q) ||
      req.itemSku.toLowerCase().includes(q) ||
      req.requestedByName.toLowerCase().includes(q) ||
      req.department.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <ClipboardList className="text-slate-950" size={28} />
            <span>Requisition Desk</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Initiate, authorize, and track physical resource allocations and item requests.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Requisition</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading requisition log...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search requisition no, item, or requestor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all text-slate-700"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>

            {/* Status Tabs/Filters */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'Pending EO Approval', label: 'Pending Review' },
                { id: 'Pending Store Issuance', label: 'Pending Release' },
                { id: 'Issued', label: 'Issued' },
                { id: 'Rejected', label: 'Rejected' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requisitions List Grid */}
          {filteredRequisitions.length === 0 ? (
            <div className="min-h-[30vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-1">
                <ClipboardList size={22} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">No Requisitions Found</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                We couldn't find any requisitions matching your filter parameters. Initiate a new request above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredRequisitions.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {req.requestNo}
                        </span>
                        <div className={`text-[10px] font-bold px-2 py-0.5 border rounded-full flex items-center space-x-1 ${getStatusBadgeClass(req.status)}`}>
                          {getStatusIcon(req.status)}
                          <span>{req.status}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-1 pt-1">
                        <Calendar size={11} />
                        <span>Submitted on {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Asset Requested</div>
                      <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span className="line-clamp-1">{req.itemName}</span>
                        <span className="text-slate-900 font-extrabold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shrink-0 font-mono">
                          Qty: {req.quantity}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono">SKU: {req.itemSku}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                        <FileText size={11} />
                        <span>Justification Justification</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-2">
                        "{req.purpose}"
                      </p>
                    </div>

                    {/* Requester (for admin/approver overview) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span className="text-slate-400">Requestor</span>
                      <span className="text-slate-800 flex items-center space-x-1">
                        <span>{req.requestedByName}</span>
                        <span className="text-slate-400 text-[10px]">({req.department})</span>
                      </span>
                    </div>
                  </div>

                  {/* Approval Trail Footer */}
                  <div className="pt-3 border-t border-slate-100 text-[11px] space-y-2">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Approval Verification Trail</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2 rounded border text-[10px] ${
                        req.eoApproval?.status === 'Approved' 
                          ? 'bg-green-50/40 border-green-200 text-green-700' 
                          : req.eoApproval?.status === 'Rejected'
                          ? 'bg-red-50/40 border-red-200 text-red-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <div className="font-bold">1. EO Authorization</div>
                        <div className="font-semibold text-[9px] mt-0.5">
                          {req.eoApproval ? `${req.eoApproval.status} (${req.eoApproval.approvedByName || 'EO'})` : 'Awaiting Review'}
                        </div>
                      </div>

                      <div className={`p-2 rounded border text-[10px] ${
                        req.storeIssuance?.status === 'Issued' 
                          ? 'bg-green-50/40 border-green-200 text-green-700' 
                          : req.storeIssuance?.status === 'Rejected'
                          ? 'bg-red-50/40 border-red-200 text-red-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <div className="font-bold">2. Store Release</div>
                        <div className="font-semibold text-[9px] mt-0.5">
                          {req.status === 'Issued' ? 'Asset Issued' : req.status === 'Rejected' ? 'Rejected' : 'Awaiting Release'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Requisition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Sheet */}
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-slideIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center space-x-2">
                <ClipboardList size={16} className="text-slate-950" />
                <span>Submit Asset Requisition</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5">
                  <XCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Item Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Available Inventory</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    setRequestQty(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 bg-white focus:border-slate-950 outline-none"
                >
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (SKU: {item.sku}) — Available: {item.quantity} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Requisition Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={requestQty}
                  onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-bold text-slate-800 focus:border-slate-950 outline-none"
                />
              </div>

              {/* Business Justification */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Business Justification / Purpose</label>
                <textarea
                  rows={3}
                  placeholder="Specify the specific reinsurance operational purpose or staff designation details..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:border-slate-950 outline-none resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-bold text-xs rounded transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Requisition</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
