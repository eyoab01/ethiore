/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { 
  UserProfile, 
  Department, 
  Category, 
  Supplier, 
  InventoryItem, 
  Requisition, 
  AuditLog, 
  SystemNotification 
} from '../types';

// Error Handling Infrastructure as per Firebase Integration Skill Guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore fallback warning: ', JSON.stringify(errInfo));
}

// Startup connection verification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection validation succeeded.');
  } catch (error) {
    console.warn('Firestore initial check (system may be offline or DB not provisioned yet):', error);
  }
}
testConnection();

// In-memory / LocalStorage fallback keys
const USERS_KEY = 'icms_users_directory';
const DEPTS_KEY = 'icms_departments';
const CATEGORIES_KEY = 'icms_categories';
const SUPPLIERS_KEY = 'icms_suppliers';
const INVENTORY_KEY = 'icms_inventory_items';
const REQUISITIONS_KEY = 'icms_requisitions';
const AUDIT_LOGS_KEY = 'icms_audit_logs';
const NOTIFICATIONS_KEY = 'icms_notifications';

// Local Storage low-level getters & setters
function getLocalUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading users from local storage:', e);
    return [];
  }
}

function saveLocalUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to local storage:', e);
  }
}

function getLocalDepts(): Department[] {
  try {
    const data = localStorage.getItem(DEPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading departments from local storage:', e);
    return [];
  }
}

function saveLocalDepts(depts: Department[]) {
  try {
    localStorage.setItem(DEPTS_KEY, JSON.stringify(depts));
  } catch (e) {
    console.error('Error saving departments to local storage:', e);
  }
}

function getLocalCategories(): Category[] {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading categories from local storage:', e);
    return [];
  }
}

function saveLocalCategories(categories: Category[]) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories to local storage:', e);
  }
}

function getLocalSuppliers(): Supplier[] {
  try {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading suppliers from local storage:', e);
    return [];
  }
}

function saveLocalSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  } catch (e) {
    console.error('Error saving suppliers to local storage:', e);
  }
}

function getLocalInventory(): InventoryItem[] {
  try {
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading inventory from local storage:', e);
    return [];
  }
}

function saveLocalInventory(items: InventoryItem[]) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving inventory to local storage:', e);
  }
}

function getLocalRequisitions(): Requisition[] {
  try {
    const data = localStorage.getItem(REQUISITIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading requisitions:', e);
    return [];
  }
}

function saveLocalRequisitions(reqs: Requisition[]) {
  try {
    localStorage.setItem(REQUISITIONS_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.error('Error saving requisitions:', e);
  }
}

function getLocalAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading audit logs:', e);
    return [];
  }
}

function saveLocalAuditLogs(logs: AuditLog[]) {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving audit logs:', e);
  }
}

function getLocalNotifications(): SystemNotification[] {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading notifications:', e);
    return [];
  }
}

function saveLocalNotifications(notifs: SystemNotification[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

// Hybrid Repository Pattern for User Profiles
export const userRepository = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        // Keep synced
        const local = getLocalUsers();
        const index = local.findIndex(u => u.uid === uid);
        if (index !== -1) {
          local[index] = profile;
        } else {
          local.push(profile);
        }
        saveLocalUsers(local);
        return profile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    // Fallback
    const users = getLocalUsers();
    return users.find(u => u.uid === uid) || null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    // 1. Local Sync
    const users = getLocalUsers();
    const index = users.findIndex(u => u.uid === profile.uid);
    if (index !== -1) {
      users[index] = profile;
    } else {
      users.push(profile);
    }
    saveLocalUsers(users);

    // 2. Cloud write
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async getAll(): Promise<UserProfile[]> {
    const path = 'users';
    try {
      const qs = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      qs.forEach(docSnap => {
        list.push(docSnap.data() as UserProfile);
      });
      if (list.length > 0) {
        saveLocalUsers(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalUsers();
  },

  async updateProfile(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.uid === profile.uid);
    if (index !== -1) {
      const merged = { ...users[index], ...profile };
      users[index] = merged;
      saveLocalUsers(users);

      const path = `users/${profile.uid}`;
      try {
        await setDoc(doc(db, 'users', profile.uid), merged);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  },

  async deleteProfile(uid: string): Promise<void> {
    const users = getLocalUsers().filter(u => u.uid !== uid);
    saveLocalUsers(users);

    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Departments
export const departmentRepository = {
  async getAll(): Promise<Department[]> {
    const path = 'departments';
    try {
      const qs = await getDocs(collection(db, 'departments'));
      const list: Department[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as Department);
      });
      if (list.length > 0) {
        saveLocalDepts(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalDepts();
  },

  async create(dept: Department): Promise<void> {
    const depts = getLocalDepts();
    if (depts.some(d => d.id === dept.id || d.code.toUpperCase() === dept.code.toUpperCase())) {
      throw new Error('Department ID or Code already exists.');
    }
    depts.push(dept);
    saveLocalDepts(depts);

    const path = `departments/${dept.id}`;
    try {
      await setDoc(doc(db, 'departments', dept.id), dept);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(dept: Department): Promise<void> {
    const depts = getLocalDepts();
    const index = depts.findIndex(d => d.id === dept.id);
    if (index !== -1) {
      depts[index] = dept;
      saveLocalDepts(depts);

      const path = `departments/${dept.id}`;
      try {
        await setDoc(doc(db, 'departments', dept.id), dept);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      throw new Error('Department not found.');
    }
  },

  async delete(id: string): Promise<void> {
    const depts = getLocalDepts();
    const filtered = depts.filter(d => d.id !== id);
    if (filtered.length === depts.length) {
      throw new Error('Department not found.');
    }
    saveLocalDepts(filtered);

    const path = `departments/${id}`;
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Categories
export const categoryRepository = {
  async getAll(): Promise<Category[]> {
    const path = 'categories';
    try {
      const qs = await getDocs(collection(db, 'categories'));
      const list: Category[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as Category);
      });
      if (list.length > 0) {
        saveLocalCategories(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalCategories();
  },

  async create(category: Category): Promise<void> {
    const categories = getLocalCategories();
    if (categories.some(c => c.id === category.id || c.code.toUpperCase() === category.code.toUpperCase())) {
      throw new Error('Category ID or Code already exists.');
    }
    categories.push(category);
    saveLocalCategories(categories);

    const path = `categories/${category.id}`;
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(category: Category): Promise<void> {
    const categories = getLocalCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      categories[index] = category;
      saveLocalCategories(categories);

      const path = `categories/${category.id}`;
      try {
        await setDoc(doc(db, 'categories', category.id), category);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      throw new Error('Category not found.');
    }
  },

  async delete(id: string): Promise<void> {
    const categories = getLocalCategories();
    const filtered = categories.filter(c => c.id !== id);
    if (filtered.length === categories.length) {
      throw new Error('Category not found.');
    }
    saveLocalCategories(filtered);

    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Suppliers
export const supplierRepository = {
  async getAll(): Promise<Supplier[]> {
    const path = 'suppliers';
    try {
      const qs = await getDocs(collection(db, 'suppliers'));
      const list: Supplier[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as Supplier);
      });
      if (list.length > 0) {
        saveLocalSuppliers(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalSuppliers();
  },

  async create(supplier: Supplier): Promise<void> {
    const suppliers = getLocalSuppliers();
    if (suppliers.some(s => s.id === supplier.id || s.code.toUpperCase() === supplier.code.toUpperCase())) {
      throw new Error('Supplier ID or Code already exists.');
    }
    suppliers.push(supplier);
    saveLocalSuppliers(suppliers);

    const path = `suppliers/${supplier.id}`;
    try {
      await setDoc(doc(db, 'suppliers', supplier.id), supplier);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(supplier: Supplier): Promise<void> {
    const suppliers = getLocalSuppliers();
    const index = suppliers.findIndex(s => s.id === supplier.id);
    if (index !== -1) {
      suppliers[index] = supplier;
      saveLocalSuppliers(suppliers);

      const path = `suppliers/${supplier.id}`;
      try {
        await setDoc(doc(db, 'suppliers', supplier.id), supplier);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      throw new Error('Supplier not found.');
    }
  },

  async delete(id: string): Promise<void> {
    const suppliers = getLocalSuppliers();
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) {
      throw new Error('Supplier not found.');
    }
    saveLocalSuppliers(filtered);

    const path = `suppliers/${id}`;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Inventory Items
export const inventoryRepository = {
  async getAll(): Promise<InventoryItem[]> {
    const path = 'inventory';
    try {
      const qs = await getDocs(collection(db, 'inventory'));
      const list: InventoryItem[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as InventoryItem);
      });
      if (list.length > 0) {
        saveLocalInventory(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalInventory();
  },

  async create(item: InventoryItem): Promise<void> {
    const items = getLocalInventory();
    if (items.some(i => i.id === item.id || i.sku.toUpperCase() === item.sku.toUpperCase())) {
      throw new Error('Inventory Item ID or SKU already exists.');
    }
    items.push(item);
    saveLocalInventory(items);

    const path = `inventory/${item.id}`;
    try {
      await setDoc(doc(db, 'inventory', item.id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(item: InventoryItem): Promise<void> {
    const items = getLocalInventory();
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
      saveLocalInventory(items);

      const path = `inventory/${item.id}`;
      try {
        await setDoc(doc(db, 'inventory', item.id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      throw new Error('Inventory item not found.');
    }
  },

  async delete(id: string): Promise<void> {
    const items = getLocalInventory();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) {
      throw new Error('Inventory item not found.');
    }
    saveLocalInventory(filtered);

    const path = `inventory/${id}`;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Requisitions
export const requisitionRepository = {
  async getAll(): Promise<Requisition[]> {
    const path = 'requisitions';
    try {
      const qs = await getDocs(collection(db, 'requisitions'));
      const list: Requisition[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as Requisition);
      });
      if (list.length > 0) {
        saveLocalRequisitions(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return getLocalRequisitions();
  },

  async create(req: Requisition): Promise<void> {
    const reqs = getLocalRequisitions();
    reqs.unshift(req);
    saveLocalRequisitions(reqs);

    const path = `requisitions/${req.id}`;
    try {
      await setDoc(doc(db, 'requisitions', req.id), req);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(req: Requisition): Promise<void> {
    const reqs = getLocalRequisitions();
    const index = reqs.findIndex(r => r.id === req.id);
    if (index !== -1) {
      reqs[index] = req;
      saveLocalRequisitions(reqs);

      const path = `requisitions/${req.id}`;
      try {
        await setDoc(doc(db, 'requisitions', req.id), req);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      throw new Error('Requisition not found.');
    }
  },

  async delete(id: string): Promise<void> {
    const reqs = getLocalRequisitions();
    const filtered = reqs.filter(r => r.id !== id);
    saveLocalRequisitions(filtered);

    const path = `requisitions/${id}`;
    try {
      await deleteDoc(doc(db, 'requisitions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

// Hybrid Repository Pattern for Audit Logs
export const auditLogRepository = {
  async getAll(): Promise<AuditLog[]> {
    const path = 'audit_logs';
    try {
      const qs = await getDocs(collection(db, 'audit_logs'));
      const list: AuditLog[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as AuditLog);
      });
      if (list.length > 0) {
        const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        saveLocalAuditLogs(sorted);
        return sorted;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    const logs = getLocalAuditLogs();
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async create(log: AuditLog): Promise<void> {
    const logs = getLocalAuditLogs();
    logs.unshift(log);
    saveLocalAuditLogs(logs);

    const path = `audit_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async logAction(
    userId: string, 
    userName: string, 
    userEmail: string, 
    userRole: string, 
    action: string, 
    details: string
  ): Promise<void> {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      userName,
      userEmail,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await this.create(newLog);
  }
};

// Hybrid Repository Pattern for Notifications
export const notificationRepository = {
  async getAll(): Promise<SystemNotification[]> {
    const path = 'notifications';
    try {
      const qs = await getDocs(collection(db, 'notifications'));
      const list: SystemNotification[] = [];
      qs.forEach(snap => {
        list.push(snap.data() as SystemNotification);
      });
      if (list.length > 0) {
        const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveLocalNotifications(sorted);
        return sorted;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    const notifs = getLocalNotifications();
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async create(notif: SystemNotification): Promise<void> {
    const notifs = getLocalNotifications();
    notifs.unshift(notif);
    saveLocalNotifications(notifs);

    const path = `notifications/${notif.id}`;
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async markAsRead(id: string, userId: string): Promise<void> {
    const notifs = getLocalNotifications();
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!notifs[index].readBy.includes(userId)) {
        notifs[index].readBy.push(userId);
        saveLocalNotifications(notifs);

        const path = `notifications/${id}`;
        try {
          await setDoc(doc(db, 'notifications', id), notifs[index]);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifs = getLocalNotifications();
    let changed = false;
    notifs.forEach(n => {
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
        changed = true;
      }
    });

    if (changed) {
      saveLocalNotifications(notifs);
      // Try parallel batch updates to cloud
      for (const n of notifs) {
        const path = `notifications/${n.id}`;
        try {
          await setDoc(doc(db, 'notifications', n.id), n);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    }
  },

  async createNotification(
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'success' | 'alert', 
    roles?: string[], 
    userId?: string
  ): Promise<void> {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      roles,
      title,
      message,
      type,
      readBy: [],
      createdAt: new Date().toISOString()
    };
    await this.create(newNotif);
  }
};

// Seeder Service to initialize collections
export const systemSeeder = {
  async seedIfNeeded(): Promise<void> {
    // 1. Seed departments if none exist
    const depts = getLocalDepts();
    if (depts.length === 0) {
      const initialDepts: Department[] = [
        { id: 'dept-claims', name: 'Claims Department', code: 'CLAIMS' },
        { id: 'dept-finance', name: 'Finance Department', code: 'FINANCE' },
        { id: 'dept-it', name: 'Information Technology', code: 'IT' },
        { id: 'dept-underwriting', name: 'Underwriting Department', code: 'UNDERWRITING' },
        { id: 'dept-hr', name: 'Human Resources', code: 'HR' }
      ];
      saveLocalDepts(initialDepts);
      
      // Try to seed to Firestore
      for (const d of initialDepts) {
        try {
          await setDoc(doc(db, 'departments', d.id), d);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for department ${d.id}`);
        }
      }
      console.log('Seeded departments.');
    }

    // 2. Seed realistic employees / users if none exist
    const users = getLocalUsers();
    const hasMockEmployees = users.some(u => u.uid.startsWith('emp-'));
    if (!hasMockEmployees) {
      const initialUsers: UserProfile[] = [
        {
          uid: 'emp-aster-bekele',
          email: 'aster.bekele@ethiore.com',
          displayName: 'Aster Bekele',
          role: 'Department EO',
          department: 'Claims Department',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-yohannes-tekle',
          email: 'yohannes.tekle@ethiore.com',
          displayName: 'Yohannes Tekle',
          role: 'Store Keeper',
          department: 'Information Technology',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-selamawit-kebede',
          email: 'selamawit.kebede@ethiore.com',
          displayName: 'Selamawit Kebede',
          role: 'Employee',
          department: 'Underwriting Department',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-tewodros-assefa',
          email: 'tewodros.assefa@ethiore.com',
          displayName: 'Tewodros Assefa',
          role: 'Employee',
          department: 'Information Technology',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-mulugeta-alene',
          email: 'mulugeta.alene@ethiore.com',
          displayName: 'Mulugeta Alene',
          role: 'Department EO',
          department: 'Finance Department',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-rahel-solomon',
          email: 'rahel.solomon@ethiore.com',
          displayName: 'Rahel Solomon',
          role: 'Store Keeper',
          department: 'Finance Department',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: 'emp-tariku-mengistu',
          email: 'tariku.mengistu@ethiore.com',
          displayName: 'Tariku Mengistu',
          role: 'Employee',
          department: 'Human Resources',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mergedUsers = [...users];
      initialUsers.forEach((initialUser) => {
        if (!mergedUsers.some(u => u.email.toLowerCase() === initialUser.email.toLowerCase())) {
          mergedUsers.push(initialUser);
        }
      });
      saveLocalUsers(mergedUsers);

      for (const u of initialUsers) {
        try {
          await setDoc(doc(db, 'users', u.uid), u);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for user ${u.uid}`);
        }
      }
      console.log('Seeded mock Ethiopian Reinsurance S.C. employees.');
    }

    // 3. Seed initial Categories
    const categories = getLocalCategories();
    if (categories.length === 0) {
      const initialCategories: Category[] = [
        { id: 'cat-ithw', name: 'IT Hardware & Servers', code: 'ITHW', description: 'Laptops, server chassis, active switches, and computing infrastructure.' },
        { id: 'cat-furn', name: 'Office Furniture', code: 'FURN', description: 'Ergonomic chairs, conference desks, filing cabinets, and office fittings.' },
        { id: 'cat-stat', name: 'Stationery & Supplies', code: 'STAT', description: 'Double-A paper reams, writing tools, and corporate binders.' },
        { id: 'cat-docs', name: 'Specialized Documentation', code: 'DOCS', description: 'Printed reinsurance treaty templates, physical cover notes, and policies.' }
      ];
      saveLocalCategories(initialCategories);

      for (const c of initialCategories) {
        try {
          await setDoc(doc(db, 'categories', c.id), c);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for category ${c.id}`);
        }
      }
      console.log('Seeded categories.');
    }

    // 4. Seed initial Suppliers
    const suppliers = getLocalSuppliers();
    if (suppliers.length === 0) {
      const initialSuppliers: Supplier[] = [
        { id: 'sup-abyss', name: 'Abyssinia Tech Solutions', code: 'ABYS-TECH', contactName: 'Abebe Kebede', email: 'support@abyssiniatech.com', phone: '+251-11-663-4589', address: 'Bole Sub-City, Addis Ababa' },
        { id: 'sup-sheg', name: 'Sheger Stationers Ltd.', code: 'SHEG-STAT', contactName: 'Marta Hailu', email: 'sales@shegerstationers.com', phone: '+251-11-551-1234', address: 'Kirkos Sub-City, Addis Ababa' },
        { id: 'sup-egprint', name: 'Ethio-Gabon Printing Press', code: 'EG-PRINT', contactName: 'Dawit Worku', email: 'production@ethio-gabon.com', phone: '+251-11-440-2345', address: 'Nifas Silk Sub-City, Addis Ababa' }
      ];
      saveLocalSuppliers(initialSuppliers);

      for (const s of initialSuppliers) {
        try {
          await setDoc(doc(db, 'suppliers', s.id), s);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for supplier ${s.id}`);
        }
      }
      console.log('Seeded suppliers.');
    }

    // 5. Seed initial Inventory Items
    const items = getLocalInventory();
    if (items.length === 0) {
      const initialItems: InventoryItem[] = [
        {
          id: 'item-probook',
          name: 'HP ProBook 450 G10 Laptop',
          sku: 'IT-LP-PRO450',
          categoryId: 'cat-ithw',
          categoryName: 'IT Hardware & Servers',
          supplierId: 'sup-abyss',
          supplierName: 'Abyssinia Tech Solutions',
          quantity: 24,
          unit: 'units',
          reorderPoint: 5,
          location: 'IT Vault Room 104',
          description: 'Intel i7 Core, 16GB RAM, 512GB SSD configured for EthioRe staff.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'item-poweredge',
          name: 'Dell PowerEdge R760 Rack Server',
          sku: 'IT-SRV-R760',
          categoryId: 'cat-ithw',
          categoryName: 'IT Hardware & Servers',
          supplierId: 'sup-abyss',
          supplierName: 'Abyssinia Tech Solutions',
          quantity: 3,
          unit: 'units',
          reorderPoint: 1,
          location: 'Main Data Center Room 20',
          description: 'Production server hosting Core Reinsurance databases.',
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'item-meshchair',
          name: 'Ergonomic High-Back Mesh Chair',
          sku: 'FUR-CH-MESH',
          categoryId: 'cat-furn',
          categoryName: 'Office Furniture',
          supplierId: 'sup-sheg',
          supplierName: 'Sheger Stationers Ltd.',
          quantity: 45,
          unit: 'pcs',
          reorderPoint: 10,
          location: 'Warehouse Section B',
          description: 'Adjustable armrests, lumber support chair for main floor staff.',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'item-treatyfold',
          name: 'EthioRe Branded Reinsurance Treaty Folder',
          sku: 'DOC-TR-BRN',
          categoryId: 'cat-docs',
          categoryName: 'Specialized Documentation',
          supplierId: 'sup-egprint',
          supplierName: 'Ethio-Gabon Printing Press',
          quantity: 1200,
          unit: 'units',
          reorderPoint: 200,
          location: 'Store Room A (Admin)',
          description: 'EthioRe embossed heavy leatherette binders with premium brass dividers.',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'item-copyreams',
          name: 'Double A A4 80GSM Copy Paper Reams',
          sku: 'ST-PA-AA4',
          categoryId: 'cat-stat',
          categoryName: 'Stationery & Supplies',
          supplierId: 'sup-sheg',
          supplierName: 'Sheger Stationers Ltd.',
          quantity: 180,
          unit: 'reams',
          reorderPoint: 30,
          location: 'Supply Cabinet Floor 2',
          description: 'Ultra-white multi-purpose paper for printing reinsurance contracts.',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      saveLocalInventory(initialItems);

      for (const item of initialItems) {
        try {
          await setDoc(doc(db, 'inventory', item.id), item);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for inventory item ${item.id}`);
        }
      }
      console.log('Seeded inventory items.');
    }

    // 6. Seed requisitions if empty
    const reqs = getLocalRequisitions();
    if (reqs.length === 0) {
      const initialReqs: Requisition[] = [
        {
          id: 'req-101',
          requestNo: 'REQ-2026-0001',
          requestedByUid: 'emp-selamawit-kebede',
          requestedByName: 'Selamawit Kebede',
          requestedByEmail: 'selamawit.kebede@ethiore.com',
          department: 'Underwriting Department',
          itemId: 'item-probook',
          itemName: 'HP ProBook 450 G10 Laptop',
          itemSku: 'IT-LP-PRO450',
          quantity: 1,
          purpose: 'Required for remote work and treaty reinsurance system deployment.',
          status: 'Issued',
          eoApproval: {
            approvedBy: 'emp-aster-bekele',
            approvedByName: 'Aster Bekele',
            status: 'Approved',
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Justification approved. Eligible for direct computing resources.'
          },
          storeIssuance: {
            issuedBy: 'emp-yohannes-tekle',
            issuedByName: 'Yohannes Tekle',
            status: 'Issued',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Asset property tag ETHIORE-IT-049 assigned and handed over.'
          },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'req-102',
          requestNo: 'REQ-2026-0002',
          requestedByUid: 'emp-tewodros-assefa',
          requestedByName: 'Tewodros Assefa',
          requestedByEmail: 'tewodros.assefa@ethiore.com',
          department: 'Information Technology',
          itemId: 'item-copyreams',
          itemName: 'Double A A4 80GSM Copy Paper Reams',
          itemSku: 'ST-PA-AA4',
          quantity: 15,
          purpose: 'Reinsurance agreement documents physical prints for signing ceremony.',
          status: 'Pending EO Approval',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'req-103',
          requestNo: 'REQ-2026-0003',
          requestedByUid: 'emp-tariku-mengistu',
          requestedByName: 'Tariku Mengistu',
          requestedByEmail: 'tariku.mengistu@ethiore.com',
          department: 'Human Resources',
          itemId: 'item-meshchair',
          itemName: 'Ergonomic High-Back Mesh Chair',
          itemSku: 'FUR-CH-MESH',
          quantity: 2,
          purpose: 'Sourced for newly hired claims underwriting interns.',
          status: 'Pending Store Issuance',
          eoApproval: {
            approvedBy: 'emp-mulugeta-alene',
            approvedByName: 'Mulugeta Alene',
            status: 'Approved',
            updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            remarks: 'Ergonomic assets approved for training annex room.'
          },
          createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      saveLocalRequisitions(initialReqs);

      for (const r of initialReqs) {
        try {
          await setDoc(doc(db, 'requisitions', r.id), r);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for requisition ${r.id}`);
        }
      }
    }

    // 7. Seed audit logs if empty
    const logs = getLocalAuditLogs();
    if (logs.length === 0) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-1',
          userId: 'emp-selamawit-kebede',
          userName: 'Selamawit Kebede',
          userEmail: 'selamawit.kebede@ethiore.com',
          userRole: 'Employee',
          action: 'Create Requisition',
          details: 'Submitted requisition REQ-2026-0001 for 1 HP ProBook 450 G10 Laptop.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'log-2',
          userId: 'emp-aster-bekele',
          userName: 'Aster Bekele',
          userEmail: 'aster.bekele@ethiore.com',
          userRole: 'Department EO',
          action: 'Approve Requisition',
          details: 'Approved requisition REQ-2026-0001 (Step 1: EO Review).',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'log-3',
          userId: 'emp-yohannes-tekle',
          userName: 'Yohannes Tekle',
          userEmail: 'yohannes.tekle@ethiore.com',
          userRole: 'Store Keeper',
          action: 'Issue Stock',
          details: 'Handed over 1 HP ProBook Laptop from IT Vault Room 104 under tag ETHIORE-IT-049.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'log-4',
          userId: 'emp-tewodros-assefa',
          userName: 'Tewodros Assefa',
          userEmail: 'tewodros.assefa@ethiore.com',
          userRole: 'Employee',
          action: 'Create Requisition',
          details: 'Submitted requisition REQ-2026-0002 for 15 Double A A4 Paper Reams.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'log-5',
          userId: 'emp-tariku-mengistu',
          userName: 'Tariku Mengistu',
          userEmail: 'tariku.mengistu@ethiore.com',
          userRole: 'Employee',
          action: 'Create Requisition',
          details: 'Submitted requisition REQ-2026-0003 for 2 Ergonomic High-Back Mesh Chairs.',
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'log-6',
          userId: 'emp-mulugeta-alene',
          userName: 'Mulugeta Alene',
          userEmail: 'mulugeta.alene@ethiore.com',
          userRole: 'Department EO',
          action: 'Approve Requisition',
          details: 'Approved requisition REQ-2026-0003 for 2 Ergonomic Mesh Chairs.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      saveLocalAuditLogs(initialLogs);

      for (const log of initialLogs) {
        try {
          await setDoc(doc(db, 'audit_logs', log.id), log);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for audit log ${log.id}`);
        }
      }
    }

    // 8. Seed notifications if empty
    const notifications = getLocalNotifications();
    if (notifications.length === 0) {
      const initialNotifs: SystemNotification[] = [
        {
          id: 'notif-1',
          title: 'Low Stock Alert',
          message: 'Dell PowerEdge R760 Rack Server is below the reorder threshold (Current: 3, Min: 1). Please organize vendor restock.',
          type: 'warning',
          roles: ['Store Keeper', 'System Admin'],
          readBy: [],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-2',
          title: 'New Requisition Submitted',
          message: 'Tewodros Assefa submitted a requisition (REQ-2026-0002) for 15 Double A A4 Paper Reams.',
          type: 'info',
          roles: ['Department EO', 'System Admin'],
          readBy: [],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-3',
          title: 'Requisition Approved',
          message: 'Mulugeta Alene approved requisition REQ-2026-0003. Sourced ergonomic chairs are awaiting Store Release.',
          type: 'success',
          roles: ['Store Keeper', 'System Admin'],
          readBy: [],
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      saveLocalNotifications(initialNotifs);

      for (const notif of initialNotifs) {
        try {
          await setDoc(doc(db, 'notifications', notif.id), notif);
        } catch (e) {
          console.warn(`Firestore seeding bypassed for notification ${notif.id}`);
        }
      }
    }
  }
};
