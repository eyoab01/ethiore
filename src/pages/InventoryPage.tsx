/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  inventoryRepository, 
  categoryRepository, 
  supplierRepository 
} from '../services/firestore';
import { exportInventoryToPDF } from '../services/pdfExport';
import { InventoryItem, Category, Supplier } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { 
  Package, 
  Building2, 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FolderPlus, 
  Boxes, 
  Tag, 
  MapPin, 
  Activity, 
  QrCode,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { searchQuery, setCurrentPage } = useNavigation();
  
  // Tab control: 'catalog' | 'categories' | 'suppliers'
  const [activeTab, setActiveTab] = useState<'catalog' | 'categories' | 'suppliers'>('catalog');
  
  // Data lists
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form toggles
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // --- ITEM FORM STATE ---
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [newItemQty, setNewItemQty] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('units');
  const [newItemReorder, setNewItemReorder] = useState(5);
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const [editItemName, setEditItemName] = useState('');
  const [editItemSku, setEditItemSku] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemSupplier, setEditItemSupplier] = useState('');
  const [editItemQty, setEditItemQty] = useState(0);
  const [editItemUnit, setEditItemUnit] = useState('units');
  const [editItemReorder, setEditItemReorder] = useState(5);
  const [editItemLocation, setEditItemLocation] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  // --- CATEGORY FORM STATE ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [editCatName, setEditCatName] = useState('');
  const [editCatCode, setEditCatCode] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // --- SUPPLIER FORM STATE ---
  const [newSupName, setNewSupName] = useState('');
  const [newSupCode, setNewSupCode] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  const [editSupName, setEditSupName] = useState('');
  const [editSupCode, setEditSupCode] = useState('');
  const [editSupContact, setEditSupContact] = useState('');
  const [editSupEmail, setEditSupEmail] = useState('');
  const [editSupPhone, setEditSupPhone] = useState('');
  const [editSupAddress, setEditSupAddress] = useState('');

  // Load Data function
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allItems = await inventoryRepository.getAll();
      const allCats = await categoryRepository.getAll();
      const allSups = await supplierRepository.getAll();
      
      setItems(allItems);
      setCategories(allCats);
      setSuppliers(allSups);
    } catch (err: any) {
      console.error('Error loading inventory data:', err);
      setError('Could not retrieve catalog records or parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ITEMS HANDLERS ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formattedId = `item-${Date.now()}`;
    const formattedSku = newItemSku.trim().toUpperCase();

    if (!newItemName.trim() || !formattedSku || !newItemCategory || !newItemSupplier || !newItemLocation.trim()) {
      setError('Required field inputs are missing.');
      return;
    }

    if (items.some(item => item.sku === formattedSku)) {
      setError(`An item with SKU "${formattedSku}" already exists in the ledger.`);
      return;
    }

    const categoryObj = categories.find(c => c.id === newItemCategory);
    const supplierObj = suppliers.find(s => s.id === newItemSupplier);

    const newItem: InventoryItem = {
      id: formattedId,
      name: newItemName.trim(),
      sku: formattedSku,
      categoryId: newItemCategory,
      categoryName: categoryObj ? categoryObj.name : 'Unknown',
      supplierId: newItemSupplier,
      supplierName: supplierObj ? supplierObj.name : 'Unknown',
      quantity: Number(newItemQty) || 0,
      unit: newItemUnit.trim(),
      reorderPoint: Number(newItemReorder) || 0,
      location: newItemLocation.trim(),
      description: newItemDesc.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await inventoryRepository.create(newItem);
      setSuccessMessage(`Catalog item "${newItem.name}" added successfully.`);
      setIsAddingItem(false);
      // Reset
      setNewItemName('');
      setNewItemSku('');
      setNewItemCategory('');
      setNewItemSupplier('');
      setNewItemQty(0);
      setNewItemUnit('units');
      setNewItemReorder(5);
      setNewItemLocation('');
      setNewItemDesc('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create inventory item.');
    }
  };

  const handleStartEditItem = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemSku(item.sku);
    setEditItemCategory(item.categoryId);
    setEditItemSupplier(item.supplierId);
    setEditItemQty(item.quantity);
    setEditItemUnit(item.unit);
    setEditItemReorder(item.reorderPoint);
    setEditItemLocation(item.location);
    setEditItemDesc(item.description || '');
  };

  const handleSaveEditItem = async (id: string) => {
    setError(null);
    setSuccessMessage(null);

    const formattedSku = editItemSku.trim().toUpperCase();
    if (!editItemName.trim() || !formattedSku || !editItemCategory || !editItemSupplier || !editItemLocation.trim()) {
      setError('Required field inputs are missing.');
      return;
    }

    if (items.some(item => item.id !== id && item.sku === formattedSku)) {
      setError(`Another item already has SKU "${formattedSku}".`);
      return;
    }

    const categoryObj = categories.find(c => c.id === editItemCategory);
    const supplierObj = suppliers.find(s => s.id === editItemSupplier);

    const updatedItem: InventoryItem = {
      id,
      name: editItemName.trim(),
      sku: formattedSku,
      categoryId: editItemCategory,
      categoryName: categoryObj ? categoryObj.name : 'Unknown',
      supplierId: editItemSupplier,
      supplierName: supplierObj ? supplierObj.name : 'Unknown',
      quantity: Number(editItemQty) || 0,
      unit: editItemUnit.trim(),
      reorderPoint: Number(editItemReorder) || 0,
      location: editItemLocation.trim(),
      description: editItemDesc.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await inventoryRepository.update(updatedItem);
      setSuccessMessage('Inventory configuration details updated.');
      setEditingItemId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update item.');
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}" from the inventory? This cannot be undone.`);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await inventoryRepository.delete(id);
      setSuccessMessage(`Item "${name}" successfully deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item.');
    }
  };

  // --- CATEGORY HANDLERS ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formattedId = `cat-${Date.now()}`;
    const formattedCode = newCatCode.trim().toUpperCase();

    if (!newCatName.trim() || !formattedCode) {
      setError('Category Name and Code are required.');
      return;
    }

    if (categories.some(c => c.code === formattedCode)) {
      setError(`A category with code "${formattedCode}" already exists.`);
      return;
    }

    const newCat: Category = {
      id: formattedId,
      name: newCatName.trim(),
      code: formattedCode,
      description: newCatDesc.trim() || undefined
    };

    try {
      await categoryRepository.create(newCat);
      setSuccessMessage(`Category "${newCat.name}" created successfully.`);
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatCode('');
      setNewCatDesc('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatCode(cat.code);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveEditCategory = async (id: string) => {
    setError(null);
    setSuccessMessage(null);

    const formattedCode = editCatCode.trim().toUpperCase();
    if (!editCatName.trim() || !formattedCode) {
      setError('Name and Code are required.');
      return;
    }

    if (categories.some(c => c.id !== id && c.code === formattedCode)) {
      setError(`Another category is using code "${formattedCode}".`);
      return;
    }

    const updatedCat: Category = {
      id,
      name: editCatName.trim(),
      code: formattedCode,
      description: editCatDesc.trim() || undefined
    };

    try {
      await categoryRepository.update(updatedCat);
      setSuccessMessage('Category configurations updated.');
      setEditingCategoryId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    // Check if category is in use
    const itemInUse = items.some(i => i.categoryId === cat.id);
    if (itemInUse) {
      setError(`Cannot delete "${cat.name}". This category is currently assigned to one or more active catalog items.`);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete category "${cat.name}"?`);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await categoryRepository.delete(cat.id);
      setSuccessMessage(`Category "${cat.name}" successfully removed.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
    }
  };

  // --- SUPPLIER HANDLERS ---
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formattedId = `sup-${Date.now()}`;
    const formattedCode = newSupCode.trim().toUpperCase();

    if (!newSupName.trim() || !formattedCode || !newSupContact.trim() || !newSupEmail.trim() || !newSupPhone.trim()) {
      setError('Name, Code, Contact Person, Email, and Phone are required.');
      return;
    }

    if (suppliers.some(s => s.code === formattedCode)) {
      setError(`A supplier with code "${formattedCode}" already exists.`);
      return;
    }

    const newSup: Supplier = {
      id: formattedId,
      name: newSupName.trim(),
      code: formattedCode,
      contactName: newSupContact.trim(),
      email: newSupEmail.trim().toLowerCase(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim() || undefined
    };

    try {
      await supplierRepository.create(newSup);
      setSuccessMessage(`Supplier "${newSup.name}" registered successfully.`);
      setIsAddingSupplier(false);
      setNewSupName('');
      setNewSupCode('');
      setNewSupContact('');
      setNewSupEmail('');
      setNewSupPhone('');
      setNewSupAddress('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to register supplier.');
    }
  };

  const handleStartEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setEditSupName(sup.name);
    setEditSupCode(sup.code);
    setEditSupContact(sup.contactName);
    setEditSupEmail(sup.email);
    setEditSupPhone(sup.phone);
    setEditSupAddress(sup.address || '');
  };

  const handleSaveEditSupplier = async (id: string) => {
    setError(null);
    setSuccessMessage(null);

    const formattedCode = editSupCode.trim().toUpperCase();
    if (!editSupName.trim() || !formattedCode || !editSupContact.trim() || !editSupEmail.trim() || !editSupPhone.trim()) {
      setError('All contact details and codes are required.');
      return;
    }

    if (suppliers.some(s => s.id !== id && s.code === formattedCode)) {
      setError(`Another supplier is registered under code "${formattedCode}".`);
      return;
    }

    const updatedSup: Supplier = {
      id,
      name: editSupName.trim(),
      code: formattedCode,
      contactName: editSupContact.trim(),
      email: editSupEmail.trim().toLowerCase(),
      phone: editSupPhone.trim(),
      address: editSupAddress.trim() || undefined
    };

    try {
      await supplierRepository.update(updatedSup);
      setSuccessMessage('Supplier credentials updated.');
      setEditingSupplierId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update supplier.');
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    // Check if supplier is in use
    const itemInUse = items.some(i => i.supplierId === sup.id);
    if (itemInUse) {
      setError(`Cannot delete "${sup.name}". This supplier is currently referenced by active stock catalog items.`);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove supplier "${sup.name}"?`);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await supplierRepository.delete(sup.id);
      setSuccessMessage(`Supplier "${sup.name}" successfully removed.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete supplier.');
    }
  };

  // --- FILTERS ---
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query) ||
      item.supplierName.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)
    );
  });

  const filteredCategories = categories.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
  });

  const filteredSuppliers = suppliers.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.contactName.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  });

  const getCategoryCount = (catId: string) => {
    return items.filter(i => i.categoryId === catId).length;
  };

  const getSupplierCount = (supId: string) => {
    return items.filter(i => i.supplierId === supId).length;
  };

  return (
    <div className="space-y-8">
      {/* Header with Title and Tab Navigation */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <Package className="text-slate-950" size={28} />
            <span>Store Asset Ledger</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Manage the central product catalog, assign classifications, handle supplier networks, and monitor stock reorder alerts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
          <button
            onClick={() => { setActiveTab('catalog'); setError(null); setSuccessMessage(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
              activeTab === 'catalog' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Boxes size={14} />
            <span>Catalog Items ({items.length})</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('categories'); setError(null); setSuccessMessage(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
              activeTab === 'categories' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('suppliers'); setError(null); setSuccessMessage(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
              activeTab === 'suppliers' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck size={14} />
            <span>Suppliers ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Action Alerts */}
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

      {/* MAIN LOADING SECTION */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">
            Retrieving ledger databases...
          </p>
        </div>
      ) : (
        <>
          {/* ==================== TAB 1: CATALOG ITEMS ==================== */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Toolbar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-500">
                  Showing {filteredItems.length} of {items.length} Registered Products
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportInventoryToPDF(filteredItems)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Download PDF</span>
                  </button>

                  {!isAddingItem && (
                    <button
                      onClick={() => {
                        setIsAddingItem(true);
                        if (categories.length > 0) setNewItemCategory(categories[0].id);
                        if (suppliers.length > 0) setNewItemSupplier(suppliers[0].id);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Plus size={14} />
                      <span>Add New Asset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add Item form */}
              {isAddingItem && (
                <form 
                  onSubmit={handleAddItem}
                  className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Boxes size={16} />
                      <span>Register New Asset Entry</span>
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingItem(false)} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Item Name</label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Dell PowerEdge Server"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* SKU */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Code</label>
                      <input
                        type="text"
                        value={newItemSku}
                        onChange={(e) => setNewItemSku(e.target.value)}
                        placeholder="e.g. IT-SRV-PE760"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Classification Category</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all cursor-pointer"
                        required
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Supplier Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Supplier Partner</label>
                      <select
                        value={newItemSupplier}
                        onChange={(e) => setNewItemSupplier(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all cursor-pointer"
                        required
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Measurement Unit</label>
                      <input
                        type="text"
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        placeholder="e.g. units, reams, pcs"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Reorder Threshold */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low-Stock Alert Level</label>
                      <input
                        type="number"
                        min="0"
                        value={newItemReorder}
                        onChange={(e) => setNewItemReorder(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Physical Storage Location */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Storage Location</label>
                      <input
                        type="text"
                        value={newItemLocation}
                        onChange={(e) => setNewItemLocation(e.target.value)}
                        placeholder="e.g. IT Vault Room 104"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Specifications & Notes</label>
                    <textarea
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="Input model years, configurations, or serial numbering sequences..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
                    >
                      Add to Directory
                    </button>
                  </div>
                </form>
              )}

              {/* Items Grid View */}
              {filteredItems.length === 0 ? (
                <div className="bg-white py-20 text-center rounded-lg border border-slate-200 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Search size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No catalog assets match the query</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Try adjusting the search input at the top header.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isLowStock = item.quantity <= item.reorderPoint;

                    return (
                      <div 
                        key={item.id}
                        className={`bg-white rounded-lg border flex flex-col justify-between shadow-xs transition-all duration-200 ${
                          isEditing ? 'border-slate-900 ring-2 ring-slate-900/5 bg-slate-50/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Body container */}
                        <div className="p-5 space-y-4">
                          {/* Top row with classifications */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {item.categoryName}
                              </span>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                                SKU: {item.sku}
                              </div>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    // Navigate to QR page and can search this item SKU directly
                                    setCurrentPage('qr');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  title="Manage Label QR"
                                >
                                  <QrCode size={13} />
                                </button>
                                <button
                                  onClick={() => handleStartEditItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  title="Edit Asset"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Asset"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Editable or Standard Info */}
                          {isEditing ? (
                            <div className="space-y-3 pt-1">
                              {/* Edit Name */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asset Name</label>
                                <input
                                  type="text"
                                  value={editItemName}
                                  onChange={(e) => setEditItemName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              {/* Edit SKU */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SKU</label>
                                <input
                                  type="text"
                                  value={editItemSku}
                                  onChange={(e) => setEditItemSku(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              {/* Edit Category */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Classification</label>
                                <select
                                  value={editItemCategory}
                                  onChange={(e) => setEditItemCategory(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all cursor-pointer"
                                  required
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Edit Supplier */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                                <select
                                  value={editItemSupplier}
                                  onChange={(e) => setEditItemSupplier(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all cursor-pointer"
                                  required
                                >
                                  {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Edit Quantity & Units */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editItemQty}
                                    onChange={(e) => setEditItemQty(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit</label>
                                  <input
                                    type="text"
                                    value={editItemUnit}
                                    onChange={(e) => setEditItemUnit(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Edit Reorder & Location */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reorder Point</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editItemReorder}
                                    onChange={(e) => setEditItemReorder(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                                  <input
                                    type="text"
                                    value={editItemLocation}
                                    onChange={(e) => setEditItemLocation(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Edit Desc */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Specifications</label>
                                <textarea
                                  value={editItemDesc}
                                  onChange={(e) => setEditItemDesc(e.target.value)}
                                  rows={1}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all resize-none"
                                />
                              </div>

                              <div className="flex items-center justify-end space-x-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditItem(item.id)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Item Name */}
                              <div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-slate-400 text-xs font-medium mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Technical Details Grid */}
                              <div className="pt-2 divide-y divide-slate-100 text-xs text-slate-500 font-medium">
                                {/* Supplier Partner */}
                                <div className="py-2 flex items-center justify-between">
                                  <span className="text-slate-400">Supplier partner</span>
                                  <span className="text-slate-800 font-bold">{item.supplierName}</span>
                                </div>

                                {/* Storage Location */}
                                <div className="py-2 flex items-center justify-between">
                                  <span className="text-slate-400">Storage facility</span>
                                  <span className="text-slate-800 font-bold flex items-center space-x-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    <span>{item.location}</span>
                                  </span>
                                </div>

                                {/* Reorder alert point */}
                                <div className="py-2 flex items-center justify-between">
                                  <span className="text-slate-400">Reorder Alert point</span>
                                  <span className="text-slate-800 font-bold">{item.reorderPoint} {item.unit}</span>
                                </div>

                                {/* Active Stock Status */}
                                <div className="py-2.5 flex items-center justify-between">
                                  <span className="text-slate-400">Current Stock</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-slate-900 text-sm font-extrabold">{item.quantity}</span>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold">{item.unit}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer details */}
                        {!isEditing && (
                          <div className={`px-5 py-3 rounded-b-lg border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${
                            isLowStock 
                              ? 'bg-red-50 border-red-100 text-red-600' 
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            <span className="flex items-center space-x-1">
                              {isLowStock ? (
                                <>
                                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                                  <span>CRITICAL LOW STOCK</span>
                                </>
                              ) : (
                                <>
                                  <Activity size={12} className="text-green-500 shrink-0 animate-pulse" />
                                  <span className="text-slate-500">Stock Optimal</span>
                                </>
                              )}
                            </span>
                            <span className={isLowStock ? 'text-red-700' : 'text-slate-500'}>
                              {isLowStock ? `Deficit: ${item.reorderPoint - item.quantity}` : 'Active Status'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: CATEGORIES ==================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-500">
                  Showing {filteredCategories.length} of {categories.length} Asset Classes
                </div>
                
                {!isAddingCategory && (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Asset Class</span>
                  </button>
                )}
              </div>

              {/* Add category form */}
              {isAddingCategory && (
                <form 
                  onSubmit={handleAddCategory}
                  className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <FolderPlus size={16} />
                      <span>Define New Asset Classification Class</span>
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(false)} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification Name</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. IT Networking Nodes"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Short Code */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Code (Unique Prefix)</label>
                      <input
                        type="text"
                        value={newCatCode}
                        onChange={(e) => setNewCatCode(e.target.value)}
                        placeholder="e.g. NETNODE"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logical Scope & Operational Guidelines</label>
                    <textarea
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Specify classification types, handling restrictions, and audit policies..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
                    >
                      Register Classification
                    </button>
                  </div>
                </form>
              )}

              {/* Categories Grid */}
              {filteredCategories.length === 0 ? (
                <div className="bg-white py-20 text-center rounded-lg border border-slate-200 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Layers size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No categories found</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Define classifications to organize your company items catalog.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.map((cat) => {
                    const isEditing = editingCategoryId === cat.id;
                    const count = getCategoryCount(cat.id);

                    return (
                      <div 
                        key={cat.id}
                        className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-xs transition-all duration-200 ${
                          isEditing ? 'border-slate-900 ring-2 ring-slate-900/5 bg-slate-50/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <Tag size={10} />
                              <span>Code: {cat.code}</span>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  title="Edit Class"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Class"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Class Name</label>
                                <input
                                  type="text"
                                  value={editCatName}
                                  onChange={(e) => setEditCatName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Short Code</label>
                                <input
                                  type="text"
                                  value={editCatCode}
                                  onChange={(e) => setEditCatCode(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logical Scope</label>
                                <textarea
                                  value={editCatDesc}
                                  onChange={(e) => setEditCatDesc(e.target.value)}
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all resize-none"
                                />
                              </div>

                              <div className="flex items-center justify-end space-x-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryId(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(cat.id)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                                {cat.name}
                              </h3>
                              {cat.description && (
                                <p className="text-slate-400 text-xs font-medium mt-1">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer counts */}
                        {!isEditing && (
                          <div className="bg-slate-50 px-5 py-3 -mx-5 -mb-5 mt-5 rounded-b-lg border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Catalog mapped items</span>
                            <span className="text-slate-700 font-extrabold">{count} Active Assets</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: SUPPLIERS ==================== */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-500">
                  Showing {filteredSuppliers.length} of {suppliers.length} Supplier Partners
                </div>
                
                {!isAddingSupplier && (
                  <button
                    onClick={() => setIsAddingSupplier(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide rounded shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Plus size={14} />
                    <span>Register Supplier Partner</span>
                  </button>
                )}
              </div>

              {/* Add supplier form */}
              {isAddingSupplier && (
                <form 
                  onSubmit={handleAddSupplier}
                  className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Truck size={16} />
                      <span>Register Supplier Partner Profile</span>
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingSupplier(false)} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Supplier Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</label>
                      <input
                        type="text"
                        value={newSupName}
                        onChange={(e) => setNewSupName(e.target.value)}
                        placeholder="e.g. Abyssinia Tech Solutions"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Code */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Vendor Code</label>
                      <input
                        type="text"
                        value={newSupCode}
                        onChange={(e) => setNewSupCode(e.target.value)}
                        placeholder="e.g. ABYS-TECH"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Contact Person Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Account Manager</label>
                      <input
                        type="text"
                        value={newSupContact}
                        onChange={(e) => setNewSupContact(e.target.value)}
                        placeholder="e.g. Abebe Kebede"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Business Email</label>
                      <input
                        type="email"
                        value={newSupEmail}
                        onChange={(e) => setNewSupEmail(e.target.value)}
                        placeholder="e.g. support@abyss.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone Line</label>
                      <input
                        type="text"
                        value={newSupPhone}
                        onChange={(e) => setNewSupPhone(e.target.value)}
                        placeholder="e.g. +251-11-663-4589"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Headquarters Address</label>
                      <input
                        type="text"
                        value={newSupAddress}
                        onChange={(e) => setNewSupAddress(e.target.value)}
                        placeholder="e.g. Bole Road, Addis Ababa"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingSupplier(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
                    >
                      Register Supplier
                    </button>
                  </div>
                </form>
              )}

              {/* Suppliers List */}
              {filteredSuppliers.length === 0 ? (
                <div className="bg-white py-20 text-center rounded-lg border border-slate-200 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No suppliers registered</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Register supplier credentials to establish supply contracts.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSuppliers.map((sup) => {
                    const isEditing = editingSupplierId === sup.id;
                    const itemsCount = getSupplierCount(sup.id);

                    return (
                      <div 
                        key={sup.id}
                        className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-xs transition-all duration-200 ${
                          isEditing ? 'border-slate-900 ring-2 ring-slate-900/5 bg-slate-50/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <Building2 size={10} />
                              <span>Code: {sup.code}</span>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleStartEditSupplier(sup)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  title="Edit Supplier"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplier(sup)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Supplier"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</label>
                                <input
                                  type="text"
                                  value={editSupName}
                                  onChange={(e) => setEditSupName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Short Code</label>
                                <input
                                  type="text"
                                  value={editSupCode}
                                  onChange={(e) => setEditSupCode(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
                                <input
                                  type="text"
                                  value={editSupContact}
                                  onChange={(e) => setEditSupContact(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Business Email</label>
                                <input
                                  type="email"
                                  value={editSupEmail}
                                  onChange={(e) => setEditSupEmail(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                                <input
                                  type="text"
                                  value={editSupPhone}
                                  onChange={(e) => setEditSupPhone(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Office Address</label>
                                <input
                                  type="text"
                                  value={editSupAddress}
                                  onChange={(e) => setEditSupAddress(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 transition-all"
                                />
                              </div>

                              <div className="flex items-center justify-end space-x-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSupplierId(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditSupplier(sup.id)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 text-xs text-slate-500">
                              <div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                                  {sup.name}
                                </h3>
                                {sup.address && (
                                  <p className="text-slate-400 text-[11px] font-medium mt-1">
                                    {sup.address}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 divide-y divide-slate-100">
                                <div className="py-2 flex items-center justify-between">
                                  <span>Account Manager</span>
                                  <span className="text-slate-800 font-bold">{sup.contactName}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                  <span>Phone Line</span>
                                  <span className="text-slate-800 font-bold">{sup.phone}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                  <span>Business Email</span>
                                  <span className="text-slate-800 font-bold">{sup.email}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer counts */}
                        {!isEditing && (
                          <div className="bg-slate-50 px-5 py-3 -mx-5 -mb-5 mt-5 rounded-b-lg border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Supplied product types</span>
                            <span className="text-slate-700 font-extrabold">{itemsCount} Items</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
