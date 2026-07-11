/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  requisitionRepository, 
  inventoryRepository, 
  auditLogRepository, 
  notificationRepository 
} from '../services/firestore';
import { Requisition, InventoryItem } from '../types';
import { 
  CheckSquare, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Warehouse,
  Boxes,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingReqs, setPendingReqs] = useState<Requisition[]>([]);
  const [completedReqs, setCompletedReqs] = useState<Requisition[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReqs, allItems] = await Promise.all([
        requisitionRepository.getAll(),
        inventoryRepository.getAll()
      ]);

      setInventoryItems(allItems);

      // Separate pending vs history based on user role permission limits
      const pending: Requisition[] = [];
      const completed: Requisition[] = [];

      allReqs.forEach(req => {
        const isPending = req.status === 'Pending EO Approval' || req.status === 'Pending Store Issuance';
        if (isPending) {
          pending.push(req);
        } else {
          completed.push(req);
        }
      });

      setPendingReqs(pending);
      setCompletedReqs(completed);

      if (pending.length > 0) {
        setSelectedReq(pending[0]);
      } else {
        setSelectedReq(null);
      }
    } catch (e) {
      console.error('Error loading approval data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleProcessApproval = async (approve: boolean) => {
    if (!selectedReq || !user) return;
    setActionError('');
    setSubmitting(true);

    try {
      const allItems = await inventoryRepository.getAll();
      const targetItem = allItems.find(i => i.id === selectedReq.itemId);

      if (!targetItem) {
        throw new Error('Associated inventory asset not found in the database.');
      }

      const updatedReq = { ...selectedReq };
      let actionName = '';
      let logDetails = '';

      // 1. Level 1: Department Executive Head Approval
      if (selectedReq.status === 'Pending EO Approval') {
        if (user.role !== 'Department EO' && user.role !== 'System Admin') {
          throw new Error('Only Department Executive Officers or Administrators can complete Level 1 authorization.');
        }

        updatedReq.eoApproval = {
          approvedBy: user.uid,
          approvedByName: user.displayName,
          status: approve ? 'Approved' : 'Rejected',
          updatedAt: new Date().toISOString(),
          remarks: actionRemarks.trim() || 'Reviewed and authorized.'
        };

        updatedReq.status = approve ? 'Pending Store Issuance' : 'Rejected';
        updatedReq.updatedAt = new Date().toISOString();

        actionName = approve ? 'EO Approval' : 'EO Rejection';
        logDetails = `Requisition ${selectedReq.requestNo} was ${approve ? 'approved' : 'rejected'} by Executive Head ${user.displayName}. Remarks: "${actionRemarks}"`;

        // Create System Notifications
        if (approve) {
          await notificationRepository.createNotification(
            'Requisition Awaiting Issuance',
            `Requisition ${selectedReq.requestNo} for "${selectedReq.itemName}" was approved by ${user.displayName} and is ready for store release.`,
            'success',
            ['Store Keeper', 'System Admin']
          );
        } else {
          await notificationRepository.createNotification(
            'Requisition Rejected',
            `Your requisition ${selectedReq.requestNo} was rejected by ${user.displayName}.`,
            'alert',
            undefined,
            selectedReq.requestedByUid
          );
        }
      } 
      // 2. Level 2: Store Keeper Release / Issuance
      else if (selectedReq.status === 'Pending Store Issuance') {
        if (user.role !== 'Store Keeper' && user.role !== 'System Admin') {
          throw new Error('Only Store Keepers or Administrators can execute Level 2 stock release.');
        }

        if (approve) {
          // Verify on-hand stock sufficiency
          if (targetItem.quantity < selectedReq.quantity) {
            throw new Error(`Insufficient stock in warehouse database to fulfill this requisition. On-hand: ${targetItem.quantity}, Requested: ${selectedReq.quantity}`);
          }

          updatedReq.storeIssuance = {
            issuedBy: user.uid,
            issuedByName: user.displayName,
            status: 'Issued',
            updatedAt: new Date().toISOString(),
            remarks: actionRemarks.trim() || 'Physically released to requester.'
          };

          updatedReq.status = 'Issued';
          updatedReq.updatedAt = new Date().toISOString();

          // Decrement inventory stock on hand
          const previousQty = targetItem.quantity;
          targetItem.quantity -= selectedReq.quantity;
          await inventoryRepository.update(targetItem);

          actionName = 'Stock Released';
          logDetails = `Requisition ${selectedReq.requestNo} fulfilled. ${selectedReq.quantity} ${targetItem.unit} of "${selectedReq.name}" released by Store Keeper ${user.displayName}. Stock decremented from ${previousQty} to ${targetItem.quantity}.`;

          // Check for reorder threshold notification trigger
          if (targetItem.quantity <= targetItem.reorderPoint) {
            await notificationRepository.createNotification(
              'Critical Stock Warning',
              `Critical low-stock warning! "${targetItem.name}" (SKU: ${targetItem.sku}) has reached ${targetItem.quantity} ${targetItem.unit} (Threshold: ${targetItem.reorderPoint}). Organize restock.`,
              'warning',
              ['Store Keeper', 'System Admin']
            );
          }

          // Notify Requester
          await notificationRepository.createNotification(
            'Asset Issued Successfully',
            `Your requested resource (${selectedReq.itemName}) has been issued. Collect it from ${targetItem.location}.`,
            'success',
            undefined,
            selectedReq.requestedByUid
          );

        } else {
          updatedReq.storeIssuance = {
            issuedBy: user.uid,
            issuedByName: user.displayName,
            status: 'Rejected',
            updatedAt: new Date().toISOString(),
            remarks: actionRemarks.trim() || 'Release denied.'
          };

          updatedReq.status = 'Rejected';
          updatedReq.updatedAt = new Date().toISOString();

          actionName = 'Release Rejected';
          logDetails = `Store release for Requisition ${selectedReq.requestNo} was rejected by Keeper ${user.displayName}. Remarks: "${actionRemarks}"`;

          // Notify Requester
          await notificationRepository.createNotification(
            'Requisition Release Rejected',
            `The Store Keeper has declined release for requisition ${selectedReq.requestNo}. Remarks: ${actionRemarks}`,
            'alert',
            undefined,
            selectedReq.requestedByUid
          );
        }
      }

      // Save updated request
      await requisitionRepository.update(updatedReq);

      // Save Audit log
      await auditLogRepository.logAction(
        user.uid,
        user.displayName,
        user.email,
        user.role,
        actionName,
        logDetails
      );

      // Reset Remarks
      setActionRemarks('');
      
      // Refresh Data
      await loadData();
    } catch (e: any) {
      console.error('Approval execution error:', e);
      setActionError(e.message || 'An error occurred during verification processing.');
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

  const filteredPending = pendingReqs.filter(req => {
    const q = searchQuery.toLowerCase();
    return (
      req.requestNo.toLowerCase().includes(q) ||
      req.itemName.toLowerCase().includes(q) ||
      req.requestedByName.toLowerCase().includes(q) ||
      req.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
          <CheckSquare className="text-slate-950" size={28} />
          <span>Workflows & Approvals</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Perform administrative reviews, sanction assets, and authorize warehouse inventory dispatch.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading workflow registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Pending Actions (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col h-[650px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock size={14} className="text-amber-500" />
              <span>Awaiting Review Desk</span>
            </h3>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Pending..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all text-slate-700"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPending.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 font-bold uppercase">
                  No pending workflows
                </div>
              ) : (
                filteredPending.map(req => {
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${
                          isSelected ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                        }`}>
                          {req.requestNo}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-full ${getStatusBadgeClass(req.status)}`}>
                          {req.status === 'Pending EO Approval' ? 'L1: EO Review' : 'L2: Release'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-extrabold tracking-tight leading-tight line-clamp-1">
                          {req.itemName}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>By {req.requestedByName}</span>
                          <span>Qty: {req.quantity}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Decision Details & Action (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedReq ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                
                {/* Requisition Detailed overview */}
                <div className="border-b border-slate-100 pb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {selectedReq.requestNo}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-2">
                        {selectedReq.itemName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono font-bold mt-1">
                        SKU: {selectedReq.itemSku}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Requisition Status</div>
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 border rounded-full mt-1.5 ${getStatusBadgeClass(selectedReq.status)}`}>
                        {selectedReq.status}
                      </span>
                    </div>
                  </div>

                  {/* Requisition Meta Data */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-black">Submitted By</span>
                      <div className="text-slate-900 font-bold">{selectedReq.requestedByName}</div>
                      <div className="text-slate-500 font-medium text-[11px]">{selectedReq.requestedByEmail}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-black">Cost Center</span>
                      <div className="text-slate-900 font-bold">{selectedReq.department}</div>
                      <div className="text-slate-500 font-medium text-[11px] flex items-center space-x-0.5">
                        <Calendar size={12} />
                        <span>{new Date(selectedReq.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Business Justification Justification</span>
                    <p className="text-xs text-slate-700 leading-relaxed italic border-l-2 border-slate-300 pl-3">
                      "{selectedReq.purpose}"
                    </p>
                  </div>

                  {/* If L2, show previous L1 approved signatures */}
                  {selectedReq.status === 'Pending Store Issuance' && selectedReq.eoApproval && (
                    <div className="p-3.5 bg-green-50/50 border border-green-200/60 rounded-lg text-xs text-green-800 space-y-1">
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <CheckCircle2 size={13} className="text-green-600" />
                        <span>Level 1: EO Review Approved</span>
                      </div>
                      <div className="font-semibold text-[11px]">
                        Authorized by: <strong className="font-bold">{selectedReq.eoApproval.approvedByName}</strong> on {new Date(selectedReq.eoApproval.updatedAt || '').toLocaleString()}
                      </div>
                      {selectedReq.eoApproval.remarks && (
                        <div className="italic text-[11px] mt-1 text-green-700/85">
                          Remarks: "{selectedReq.eoApproval.remarks}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DECISION PROCESSING FORM */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Process Verification Decision
                  </h4>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Decision Remarks & Feedback
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add compliance notes, release assignment tags, or reasons for rejection..."
                      value={actionRemarks}
                      onChange={(e) => setActionRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:border-slate-950 outline-none resize-none bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <button
                      onClick={() => handleProcessApproval(false)}
                      disabled={submitting}
                      className="py-2.5 border border-red-200 hover:bg-red-50/40 text-red-600 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ThumbsDown size={14} />
                      <span>Decline Request</span>
                    </button>

                    <button
                      onClick={() => handleProcessApproval(true)}
                      disabled={submitting}
                      className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ThumbsUp size={14} />
                      <span>
                        {selectedReq.status === 'Pending EO Approval' ? 'Approve & Pass' : 'Issue & Release'}
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-xl space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-1">
                  <CheckSquare size={24} />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    All Workflows Clear
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                    There are no requisitions currently awaiting processing. Pending transactions will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
