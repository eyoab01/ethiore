/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { inventoryRepository } from '../services/firestore';
import { InventoryItem } from '../types';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Search, 
  Printer, 
  Download, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  ScanLine,
  RefreshCw,
  FileSpreadsheet,
  Boxes
} from 'lucide-react';

export const QrPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Scanning simulator states
  const [simulatedScanInput, setSimulatedScanInput] = useState<string>('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [loading, setLoading] = useState(true);
  const [bulkQrCodes, setBulkQrCodes] = useState<{ [key: string]: string }>({});

  const printAreaRef = useRef<HTMLDivElement>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const allItems = await inventoryRepository.getAll();
      setItems(allItems);
      if (allItems.length > 0) {
        setSelectedItem(allItems[0]);
      }
    } catch (err) {
      console.error('Error loading items for QR generator:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Generate QR for single selected item
  useEffect(() => {
    if (!selectedItem) {
      setQrCodeDataUrl('');
      return;
    }

    // QR contains a JSON string of SKU and metadata for asset tracking compliance
    const qrPayload = JSON.stringify({
      sku: selectedItem.sku,
      name: selectedItem.name,
      location: selectedItem.location,
      verification_system: 'EthioRe-ICMS-v1'
    });

    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a', // deep slate 900
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [selectedItem]);

  // Generate QR Codes for bulk printing
  useEffect(() => {
    if (items.length === 0) return;

    const generateAll = async () => {
      const codes: { [key: string]: string } = {};
      for (const item of items) {
        const payload = JSON.stringify({
          sku: item.sku,
          name: item.name,
          location: item.location,
          verification_system: 'EthioRe-ICMS-v1'
        });

        try {
          const url = await QRCode.toDataURL(payload, {
            width: 120,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          codes[item.id] = url;
        } catch (e) {
          console.error('Bulk QR generation error:', e);
        }
      }
      setBulkQrCodes(codes);
    };

    generateAll();
  }, [items]);

  // Search filter
  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    );
  });

  // Handle Simulated Scan
  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    setScannedItem(null);
    setScanStatus('idle');

    if (!simulatedScanInput.trim()) return;

    const query = simulatedScanInput.trim().toUpperCase();
    const found = items.find(item => item.sku.toUpperCase() === query || item.id === simulatedScanInput);

    if (found) {
      setScannedItem(found);
      setScanStatus('success');
    } else {
      setScanStatus('error');
    }
  };

  const handlePrintLabels = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    
    // Create print layout stylesheet dynamically
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please enable popups to print asset labels.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>EthioRe Asset Label Sheets</title>
          <style>
            @media print {
              body { margin: 0; padding: 15px; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
              .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .label-card { border: 1.5px solid #cbd5e1; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; page-break-inside: avoid; }
              .label-info { flex-1: 1; margin-right: 10px; }
              .label-title { font-size: 11px; font-weight: bold; color: #0f172a; margin: 0; }
              .label-sku { font-size: 10px; color: #64748b; font-family: monospace; font-weight: bold; margin-top: 2px; }
              .label-meta { font-size: 9px; color: #94a3b8; margin-top: 4px; }
              .label-qr { width: 75px; height: 75px; flex-shrink: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${items.map(item => `
              <div class="label-card">
                <div class="label-info">
                  <div style="font-size: 8px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px;">ETHIORE PROPERTY</div>
                  <h3 class="label-title">${item.name}</h3>
                  <div class="label-sku">SKU: ${item.sku}</div>
                  <div class="label-meta">Loc: ${item.location}</div>
                </div>
                <img class="label-qr" src="${bulkQrCodes[item.id] || ''}" />
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2.5">
          <QrCode className="text-slate-950" size={28} />
          <span>Asset Tagging & Labeling</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Generate compliant barcode labels, configure physical asset tags, and simulate QR code scanner decoders.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading barcode inventory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Asset Browser (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col h-[650px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Boxes size={14} />
              <span>Asset Stock List</span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search SKU or Asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded outline-none focus:border-slate-950 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold uppercase">
                  No matching assets
                </div>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold tracking-tight leading-tight line-clamp-1">
                          {item.name}
                        </div>
                        <div className={`text-[9px] font-bold font-mono tracking-wider ${
                          isSelected ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          {item.sku}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* MIDDLE PANEL: Detailed Asset Tag Card (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ScanLine size={14} />
                <span>Generated Property Tag</span>
              </h3>

              {selectedItem ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Outer Asset Tag Visualizer */}
                  <div className="bg-white border-2 border-slate-900 p-5 rounded-xl shadow-xs w-full max-w-[260px] flex flex-col items-center">
                    <div className="text-[10px] font-black text-blue-800 tracking-wider uppercase mb-1">
                      ETHIORE INSURANCE
                    </div>
                    <div className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                      OFFICIAL PROPERTY TAG
                    </div>

                    {/* Generated QR Image */}
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code Asset Label" 
                        className="w-40 h-40 border border-slate-100 p-1 bg-white rounded-lg shadow-2xs"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                        Rendering QR...
                      </div>
                    )}

                    <div className="text-xs font-black text-slate-900 mt-3 tracking-tight line-clamp-1">
                      {selectedItem.name}
                    </div>
                    <div className="text-[10px] font-bold font-mono text-slate-500 tracking-wide mt-1 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      SKU: {selectedItem.sku}
                    </div>
                  </div>

                  {/* Asset Meta Info */}
                  <div className="w-full text-left space-y-2.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Classification</span>
                      <span className="text-slate-800 font-bold">{selectedItem.categoryName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Direct Supplier</span>
                      <span className="text-slate-800 font-bold">{selectedItem.supplierName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Storage Facility</span>
                      <span className="text-slate-800 font-bold flex items-center space-x-1 justify-end">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{selectedItem.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `ethiore-label-${selectedItem.sku}.png`;
                        link.href = qrCodeDataUrl;
                        link.click();
                      }}
                      className="py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download QR</span>
                    </button>

                    <button
                      onClick={handlePrintLabels}
                      className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-xs text-slate-400 font-bold uppercase">
                  Select an asset to view property tag
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Scanned QR Simulation Engine (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-xl text-slate-300 p-6 space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Cpu className="text-blue-500 animate-pulse" size={14} />
                <span>QR Scanner Decoder</span>
              </h3>

              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Enter the SKU code or exact ID of an asset to simulate scanning its physical QR tag code tag.
              </p>

              <form onSubmit={handleSimulateScan} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulated Scan Entry</label>
                  <input
                    type="text"
                    placeholder="Input SKU e.g. IT-LP-PRO450"
                    value={simulatedScanInput}
                    onChange={(e) => setSimulatedScanInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-xs font-mono rounded outline-none focus:border-blue-500 focus:bg-slate-950 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-1">
                  {/* Preset quick test tags */}
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSimulatedScanInput(items[0].sku)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                    >
                      Fill sample tag
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    Simulate Scan
                  </button>
                </div>
              </form>

              {/* Scan Results View */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                {scanStatus === 'idle' && (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 font-semibold uppercase tracking-wider flex flex-col items-center justify-center space-y-2">
                    <ScanLine size={24} className="text-slate-700 animate-pulse" />
                    <span>Awaiting scanner feed...</span>
                  </div>
                )}

                {scanStatus === 'error' && (
                  <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                      <ShieldAlert size={14} className="text-red-500" />
                      <span>Decryption Error</span>
                    </div>
                    <p className="font-medium">
                      The provided QR label code does not match any registered asset configuration in the EthioRe inventory database.
                    </p>
                  </div>
                )}

                {scanStatus === 'success' && scannedItem && (
                  <div className="p-4 bg-green-950/20 border border-green-900/40 rounded-lg text-xs text-slate-300 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-green-900/20 pb-2">
                      <div className="flex items-center space-x-1.5 text-green-400 font-bold uppercase tracking-wider">
                        <CheckCircle2 size={14} />
                        <span>Decryption Success</span>
                      </div>
                      <span className="text-[10px] text-green-500 font-bold uppercase">SECURE CONNECT</span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-white font-extrabold text-sm">{scannedItem.name}</h4>
                      <p className="text-slate-400 text-[11px] font-mono font-semibold">SKU: {scannedItem.sku}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-400 pt-1">
                      <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Classification</div>
                        <div className="text-slate-200 font-bold">{scannedItem.categoryName}</div>
                      </div>
                      <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Store Location</div>
                        <div className="text-slate-200 font-bold">{scannedItem.location}</div>
                      </div>
                      <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Qty on hand</div>
                        <div className="text-slate-200 font-bold">{scannedItem.quantity} {scannedItem.unit}</div>
                      </div>
                      <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Alert Threshold</div>
                        <div className="text-slate-200 font-bold">{scannedItem.reorderPoint} {scannedItem.unit}</div>
                      </div>
                    </div>

                    {scannedItem.quantity <= scannedItem.reorderPoint ? (
                      <div className="p-2 bg-red-950/40 border border-red-900/30 rounded text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span>LOW STOCK ALERT</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-green-950/40 border border-green-900/30 rounded text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span>Stock Levels Optimal</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Hidden print payload wrapper */}
      <div style={{ display: 'none' }}>
        <div ref={printAreaRef} id="print-sheet-content"></div>
      </div>
    </div>
  );
};
