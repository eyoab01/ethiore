/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { InventoryItem, AuditLog } from '../types';

const BRAND_BLUE = '#16689d';
const BRAND_GOLD = '#e3af23';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';

// Format currency in ETB (Ethiopian Birr)
const formatBirrPDF = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0
  }).format(amount);
};

// Map SKU prefixes to estimated valuations
const getItemValue = (sku: string) => {
  if (sku.includes('LP')) return 45000; // HP Laptop
  if (sku.includes('SRV')) return 280000; // Dell Server
  if (sku.includes('FUR')) return 6500; // Mesh Chair
  if (sku.includes('DOC')) return 250; // Folders
  return 80; // Paper
};

/**
 * Draws the master template header and footer on a PDF page
 */
function drawPageTemplate(doc: jsPDF, title: string, pageNum: number, totalPagesPlaceholder: string | number) {
  const width = 210; // A4 size
  const margin = 15;

  // Header Banner
  doc.setFillColor(22, 104, 157); // BRAND_BLUE rgb(22, 104, 157)
  doc.rect(margin, 12, width - (margin * 2), 4, 'F');

  // Ethiopian Reinsurance S.C. English & Amharic Headings
  doc.setTextColor(22, 104, 157); // BRAND_BLUE
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ETHIOPIAN REINSURANCE S.C.', margin, 23);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('የኢትዮጵያ ጠለፋ መድን ማኅበር (EthioRe)', margin, 27.5);

  // Document Badge on top right
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(width - margin - 55, 18, 55, 9, 'F');
  doc.setTextColor(100, 116, 139); // TEXT_MUTED
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AUDIT-READY DOCUMENT', width - margin - 51, 24);

  // Title of the specific report
  doc.setTextColor(30, 41, 59); // TEXT_DARK
  doc.setFontSize(11);
  doc.text(title, margin, 36);

  // Golden accent rule under title
  doc.setFillColor(227, 175, 35); // BRAND_GOLD rgb(227, 175, 35)
  doc.rect(margin, 38, width - (margin * 2), 0.5, 'F');

  // Metadata Footer
  const footerY = 285;
  doc.setFillColor(227, 175, 35);
  doc.rect(margin, footerY - 5, width - (margin * 2), 0.3, 'F');

  doc.setTextColor(100, 116, 139); // TEXT_MUTED
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Confidential - For Internal Executive Audit & Board Review Only', margin, footerY);
  
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.text(`Generated: ${dateStr}`, width - margin - 75, footerY);
  doc.text(`Page ${pageNum} of ${totalPagesPlaceholder}`, width - margin - 15, footerY, { align: 'right' });
}

/**
 * 1. Export Store Asset Ledger (Inventory items catalog)
 */
export const exportInventoryToPDF = (items: InventoryItem[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = 210;
  const margin = 15;
  const tableWidth = width - (margin * 2);

  // Column definitions: width total = 180
  const cols = [
    { header: 'Asset Item Name', width: 48 },
    { header: 'SKU Code', width: 28 },
    { header: 'Category Name', width: 34 },
    { header: 'Location / Vault', width: 42 },
    { header: 'Qty', width: 14, align: 'right' as const },
    { header: 'Unit', width: 14, align: 'right' as const }
  ];

  let pageNum = 1;
  const drawPage = (p: number) => {
    drawPageTemplate(doc, 'STORE ASSET LEDGER - CENTRAL INVENTORY DIRECTORY', p, '##TOTAL_PAGES##');
  };

  drawPage(pageNum);

  // Draw Brief Summary Section at the top
  let y = 46;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y, tableWidth, 12, 'F');
  doc.setDrawColor(226, 232, 240); // border-slate-200
  doc.rect(margin, y, tableWidth, 12, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // TEXT_DARK
  doc.text('SUMMARY INDICATORS:', margin + 4, y + 7.5);

  doc.setFont('Helvetica', 'normal');
  doc.text(`Total SKU Lines: ${items.length} SKUs`, margin + 45, y + 7.5);
  
  const sumQty = items.reduce((sum, i) => sum + i.quantity, 0);
  doc.text(`Total Physical Stock: ${sumQty} units`, margin + 95, y + 7.5);

  const lowStock = items.filter(i => i.quantity <= i.reorderPoint).length;
  doc.text(`Low Stock Alerts: ${lowStock} SKUs`, margin + 145, y + 7.5);

  // Table Headers
  y = 64;
  doc.setFillColor(22, 104, 157); // BRAND_BLUE
  doc.rect(margin, y, tableWidth, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  cols.forEach(c => {
    const textX = c.align === 'right' ? curX + c.width - 2 : curX + 2;
    doc.text(c.header, textX, y + 5.5, { align: c.align });
    curX += c.width;
  });

  // Table Rows
  y += 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item, index) => {
    // Check for page overflow
    if (y > 265) {
      pageNum++;
      doc.addPage();
      drawPage(pageNum);
      
      // Redraw Table Headers
      y = 45;
      doc.setFillColor(22, 104, 157);
      doc.rect(margin, y, tableWidth, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      let headerX = margin;
      cols.forEach(c => {
        const textX = c.align === 'right' ? headerX + c.width - 2 : headerX + 2;
        doc.text(c.header, textX, y + 5.5, { align: c.align });
        headerX += c.width;
      });

      y += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    // Row Background (Zebra Striping)
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, tableWidth, 7.5, 'F');
    }
    
    // Bottom thin line border
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(margin, y + 7.5, margin + tableWidth, y + 7.5);

    // Text details
    doc.setTextColor(30, 41, 59); // TEXT_DARK
    
    let cellX = margin;

    // Asset Name (clip or truncate if too long)
    const rawName = item.name;
    const nameStr = rawName.length > 25 ? rawName.slice(0, 24) + '...' : rawName;
    doc.setFont('Helvetica', 'bold');
    doc.text(nameStr, cellX + 2, y + 5);

    cellX += cols[0].width;
    doc.setFont('Helvetica', 'normal');

    // SKU
    doc.setFont('Courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(item.sku, cellX + 2, y + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    cellX += cols[1].width;

    // Category
    const catStr = item.categoryName.length > 18 ? item.categoryName.slice(0, 17) + '...' : item.categoryName;
    doc.text(catStr, cellX + 2, y + 5);

    cellX += cols[2].width;

    // Location
    const locStr = item.location.length > 22 ? item.location.slice(0, 21) + '...' : item.location;
    doc.text(locStr, cellX + 2, y + 5);

    cellX += cols[3].width;

    // Qty
    // Highlight low stock quantities in deep amber
    const isLow = item.quantity <= item.reorderPoint;
    if (isLow) {
      doc.setTextColor(194, 65, 12); // Amber-700
      doc.setFont('Helvetica', 'bold');
    }
    doc.text(String(item.quantity), cellX + cols[4].width - 2, y + 5, { align: 'right' });
    if (isLow) {
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'normal');
    }

    cellX += cols[4].width;

    // Unit
    doc.text(item.unit, cellX + cols[5].width - 2, y + 5, { align: 'right' });

    y += 7.5;
  });

  // Programmatically replace total pages placeholder
  const totalPages = pageNum;
  for (let j = 1; j <= totalPages; j++) {
    doc.setPage(j);
    // Find text ##TOTAL_PAGES## and replace it on each page
    // Using simple programmatic replacement by overriding
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setFillColor(255, 255, 255);
    // Erase the placeholder text by painting white card first
    doc.rect(width - margin - 20, 281, 15, 6, 'F');
    // Draw real total pages count
    doc.text(`Page ${j} of ${totalPages}`, width - margin - 15, 285, { align: 'right' });
  }

  doc.save(`ethiore_asset_ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 2. Export Property Valuation Ledger Sheet
 */
export const exportValuationToPDF = (items: InventoryItem[], totalValue: number, totalAssetsCount: number) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = 210;
  const margin = 15;
  const tableWidth = width - (margin * 2);

  // Column definitions: width total = 180
  const cols = [
    { header: 'Asset Description', width: 52 },
    { header: 'SKU Reference', width: 28 },
    { header: 'Vault / Storage Location', width: 44 },
    { header: 'In-Stock Balance', width: 28, align: 'right' as const },
    { header: 'Estimated Unit Val', width: 28, align: 'right' as const }
  ];

  let pageNum = 1;
  const drawPage = (p: number) => {
    drawPageTemplate(doc, 'CORPORATE PROPERTY VALUATION LEDGER - COMPLIANCE REVIEW', p, '##TOTAL_PAGES##');
  };

  drawPage(pageNum);

  // Summary Metrics Header Card
  let y = 46;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y, tableWidth, 18, 'F');
  doc.setDrawColor(226, 232, 240); // border-slate-200
  doc.rect(margin, y, tableWidth, 18, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // TEXT_DARK
  doc.text('OFFICIAL TRANSIT AUDIT STATS:', margin + 5, y + 6.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Audit Interval: Fiscal Year Quarter End`, margin + 5, y + 12);
  doc.text(`Consolidated Assets Count: ${totalAssetsCount} total items`, margin + 65, y + 12);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(22, 104, 157); // BRAND_BLUE
  doc.text(`CUMULATIVE LEDGER VALUATION: ${formatBirrPDF(totalValue)}`, margin + 65, y + 6.5);
  doc.setTextColor(30, 41, 59);

  // Table Headers
  y = 70;
  doc.setFillColor(22, 104, 157); // BRAND_BLUE
  doc.rect(margin, y, tableWidth, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  cols.forEach(c => {
    const textX = c.align === 'right' ? curX + c.width - 2 : curX + 2;
    doc.text(c.header, textX, y + 5.5, { align: c.align });
    curX += c.width;
  });

  // Table Rows
  y += 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item, index) => {
    // Check for page overflow
    if (y > 265) {
      pageNum++;
      doc.addPage();
      drawPage(pageNum);
      
      // Redraw Table Headers
      y = 45;
      doc.setFillColor(22, 104, 157);
      doc.rect(margin, y, tableWidth, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      let headerX = margin;
      cols.forEach(c => {
        const textX = c.align === 'right' ? headerX + c.width - 2 : headerX + 2;
        doc.text(c.header, textX, y + 5.5, { align: c.align });
        headerX += c.width;
      });

      y += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    // Row Background (Zebra Striping)
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, tableWidth, 7.5, 'F');
    }
    
    // Bottom border
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7.5, margin + tableWidth, y + 7.5);

    doc.setTextColor(30, 41, 59); // TEXT_DARK
    
    let cellX = margin;

    // Asset Name
    doc.setFont('Helvetica', 'bold');
    doc.text(item.name.length > 28 ? item.name.slice(0, 27) + '...' : item.name, cellX + 2, y + 5);
    cellX += cols[0].width;

    // SKU Reference
    doc.setFont('Courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(item.sku, cellX + 2, y + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    cellX += cols[1].width;

    // Vault Location
    doc.text(item.location.length > 25 ? item.location.slice(0, 24) + '...' : item.location, cellX + 2, y + 5);
    cellX += cols[2].width;

    // In-stock balance
    const stockStr = `${item.quantity} ${item.unit}`;
    doc.text(stockStr, cellX + cols[3].width - 2, y + 5, { align: 'right' });
    cellX += cols[3].width;

    // Unit value & item valuation total combined to show details elegantly
    const uVal = getItemValue(item.sku);
    doc.text(formatBirrPDF(uVal), cellX + cols[4].width - 2, y + 5, { align: 'right' });

    y += 7.5;
  });

  // Table Footer summary total row
  if (y > 260) {
    pageNum++;
    doc.addPage();
    drawPage(pageNum);
    y = 45;
  }

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, tableWidth, 9, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(margin, y, tableWidth, 9, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('CUMULATIVE VALUATION SUM', margin + 3, y + 6);
  
  doc.text(`${totalAssetsCount} items`, margin + 115, y + 6, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setTextColor(22, 104, 157); // BRAND_BLUE
  doc.text(formatBirrPDF(totalValue), margin + tableWidth - 3, y + 6, { align: 'right' });

  // Update real page counts
  const totalPages = pageNum;
  for (let j = 1; j <= totalPages; j++) {
    doc.setPage(j);
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setFillColor(255, 255, 255);
    doc.rect(width - margin - 20, 281, 15, 6, 'F');
    doc.text(`Page ${j} of ${totalPages}`, width - margin - 15, 285, { align: 'right' });
  }

  doc.save(`ethiore_property_valuation_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 3. Export Security Audit Logs
 */
export const exportAuditLogsToPDF = (logs: AuditLog[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = 210;
  const margin = 15;
  const tableWidth = width - (margin * 2);

  // Column definitions: width total = 180
  const cols = [
    { header: 'Date & Timestamp', width: 34 },
    { header: 'Officer Name / Role', width: 36 },
    { header: 'Action Category', width: 32 },
    { header: 'Detailed Audit Ledger Entry Narrative', width: 78 }
  ];

  let pageNum = 1;
  const drawPage = (p: number) => {
    drawPageTemplate(doc, 'SECURITY TRANSMISSION AUDIT TRAIL LOGS', p, '##TOTAL_PAGES##');
  };

  drawPage(pageNum);

  // Table Headers
  let y = 46;
  doc.setFillColor(22, 104, 157); // BRAND_BLUE
  doc.rect(margin, y, tableWidth, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  cols.forEach(c => {
    doc.text(c.header, curX + 2, y + 5.5);
    curX += c.width;
  });

  // Table Rows
  y += 8;
  doc.setFont('Helvetica', 'normal');

  logs.forEach((log, index) => {
    // Audit narratives can be quite long. Let's programmatically wrap the text to fit 74mm width.
    doc.setFontSize(7.5);
    const detailLines = doc.splitTextToSize(log.details, cols[3].width - 4);
    // Row height matches content
    const rowHeight = Math.max(detailLines.length * 4.2 + 3.5, 9);

    // Check for page overflow
    if (y + rowHeight > 270) {
      pageNum++;
      doc.addPage();
      drawPage(pageNum);
      
      // Redraw Table Headers
      y = 45;
      doc.setFillColor(22, 104, 157);
      doc.rect(margin, y, tableWidth, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      let headerX = margin;
      cols.forEach(c => {
        doc.text(c.header, headerX + 2, y + 5.5);
        headerX += c.width;
      });

      y += 8;
      doc.setFont('Helvetica', 'normal');
    }

    // Row Background (Zebra Striping)
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, tableWidth, rowHeight, 'F');
    }
    
    // Bottom border line
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

    doc.setTextColor(30, 41, 59); // TEXT_DARK
    
    let cellX = margin;

    // Date & Timestamp
    const formattedDate = new Date(log.timestamp).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.setFontSize(7.5);
    doc.text(formattedDate, cellX + 2, y + 5);
    cellX += cols[0].width;

    // Officer Name & Role
    doc.setFont('Helvetica', 'bold');
    doc.text(log.userName, cellX + 2, y + 4.5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(log.userRole, cellX + 2, y + 8);
    doc.setTextColor(30, 41, 59);
    cellX += cols[1].width;

    // Action Category
    doc.setFont('Courier', 'bold');
    doc.setFontSize(7);
    doc.text(log.action.toUpperCase(), cellX + 2, y + 5);
    doc.setFont('Helvetica', 'normal');
    cellX += cols[2].width;

    // Narrative Lines
    doc.setFontSize(7.5);
    detailLines.forEach((line: string, lineIdx: number) => {
      doc.text(line, cellX + 2, y + 4.5 + (lineIdx * 4.2));
    });

    y += rowHeight;
  });

  // Update total page counts
  const totalPages = pageNum;
  for (let j = 1; j <= totalPages; j++) {
    doc.setPage(j);
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setFillColor(255, 255, 255);
    doc.rect(width - margin - 20, 281, 15, 6, 'F');
    doc.text(`Page ${j} of ${totalPages}`, width - margin - 15, 285, { align: 'right' });
  }

  doc.save(`ethiore_security_audit_trail_${new Date().toISOString().slice(0, 10)}.pdf`);
};
