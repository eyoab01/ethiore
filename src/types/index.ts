/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Employee' | 'Department EO' | 'Store Keeper' | 'System Admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  photoURL?: string;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headUid?: string;
  headName?: string;
}

export type ActivePage =
  | 'login'
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'departments'
  | 'inventory'
  | 'stock'
  | 'requests'
  | 'approvals'
  | 'qr'
  | 'reports'
  | 'settings';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unit: string;
  reorderPoint: number;
  location: string;
  description?: string;
  createdAt: string;
}

export interface Requisition {
  id: string;
  requestNo: string;
  requestedByUid: string;
  requestedByName: string;
  requestedByEmail: string;
  department: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  purpose: string;
  status: 'Pending EO Approval' | 'Pending Store Issuance' | 'Issued' | 'Rejected';
  eoApproval?: {
    approvedBy?: string;
    approvedByName?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    updatedAt?: string;
    remarks?: string;
  };
  storeIssuance?: {
    issuedBy?: string;
    issuedByName?: string;
    status: 'Pending' | 'Issued' | 'Rejected';
    updatedAt?: string;
    remarks?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  roles?: string[];
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  readBy: string[];
  createdAt: string;
}

