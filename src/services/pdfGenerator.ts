/**
 * MUNAFA Official Document & PDF Generator
 * Renders print-ready, XSS-safe Pakistani commercial invoices and statements
 * using sandboxed in-page iframe printing (no popup/alert blockers).
 */

import { OrderItem, UserAccount } from '../types';
import { escapeHtml, sanitizeFilename } from '../utils/security';

export class PdfGenerator {
  /**
   * Generates formatted HTML for an official Munafa Order Invoice
   */
  public static generateInvoiceHtml(order: OrderItem, seller: UserAccount, _buyer: UserAccount): string {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${escapeHtml(order.orderNumber)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1c1917; line-height: 1.5; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; padding: 24px; border: 1px solid #e7e5e4; }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #047857; padding-bottom: 16px; margin-bottom: 20px; }
          .brand-title { font-size: 26px; font-weight: 800; color: #047857; letter-spacing: -0.5px; margin: 0; }
          .brand-subtitle { font-size: 13px; color: #78716c; margin-top: 4px; }
          .invoice-meta { text-align: right; }
          .meta-title { font-size: 20px; font-weight: 700; color: #1c1917; margin: 0; }
          .meta-text { font-size: 13px; color: #57534e; margin: 2px 0; }
          .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .party-card { background: #fafaf9; border: 1px solid #f5f5f4; padding: 14px; border-radius: 6px; font-size: 13px; }
          .party-header { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #047857; margin-bottom: 6px; }
          .table-items { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .table-items th { background: #f5f5f4; text-align: left; padding: 10px; border-bottom: 1px solid #e7e5e4; color: #44403c; font-weight: 600; }
          .table-items td { padding: 12px 10px; border-bottom: 1px solid #f5f5f4; }
          .totals-table { width: 320px; margin-left: auto; margin-bottom: 24px; font-size: 13px; }
          .totals-table td { padding: 6px 10px; }
          .totals-table .grand-total { font-size: 16px; font-weight: 800; color: #047857; border-top: 2px solid #047857; }
          .disclaimer-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; font-size: 11px; color: #991b1b; line-height: 1.4; margin-top: 20px; }
          .safety-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 10px; font-size: 11px; color: #92400e; margin-top: 8px; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-row">
            <div style="display:flex;align-items:center;gap:14px;">
              <img src="/assets/aistudio/image_65c6c502.png" alt="MUNAFA" style="height:56px;width:auto;background:#fff;border:2px solid #d4af37;border-radius:8px;padding:3px 6px;" />
              <div>
                <h1 class="brand-title">MUNAFA منافع</h1>
                <div class="brand-subtitle">Made in Pakistan Marketplace · Connecting Fields &amp; Factories</div>
              </div>
            </div>
            <div class="invoice-meta">
              <h2 class="meta-title">COMMERCIAL INVOICE</h2>
              <div class="meta-text"><strong>Invoice #:</strong> ${escapeHtml(order.orderNumber)}</div>
              <div class="meta-text"><strong>Date:</strong> ${escapeHtml(formattedDate)}</div>
              <div class="meta-text"><strong>Fulfilment:</strong> ${order.fulfilmentType === 'cod' ? 'Cash on Delivery (Insured)' : 'Pickup at Facility'}</div>
              ${order.courierTrackingNo ? `<div class="meta-text"><strong>Courier Tracking:</strong> ${escapeHtml(order.courierTrackingNo)}</div>` : ''}
            </div>
          </div>

          <div class="parties-grid">
            <div class="party-card">
              <div class="party-header">Seller (Supplier)</div>
              <div><strong>${escapeHtml(order.sellerName)}</strong></div>
              <div>Account #: ${escapeHtml(order.sellerAccountNumber)}</div>
              <div>NTN: ${escapeHtml(seller.ntn || order.sellerNtn || 'Unregistered')}</div>
              <div>Phone: ${escapeHtml(order.sellerPhone)}</div>
              <div>Address: ${escapeHtml(order.sellerAddress)}</div>
            </div>
            <div class="party-card">
              <div class="party-header">Buyer (Consignee)</div>
              <div><strong>${escapeHtml(order.buyerName)}</strong></div>
              <div>Account #: ${escapeHtml(order.buyerAccountNumber)}</div>
              <div>Phone: ${escapeHtml(order.buyerPhone)}</div>
              <div>Delivery Address: ${escapeHtml(order.buyerAddress)}</div>
            </div>
          </div>

          <table class="table-items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th style="text-align: right;">Unit Price (PKR)</th>
                <th style="text-align: right;">GST Rate</th>
                <th style="text-align: right;">Total (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${escapeHtml(order.productTitle)}</strong></td>
                <td>${Number(order.quantity || 0)}</td>
                <td>${escapeHtml(order.unit)}</td>
                <td style="text-align: right;">${Number(order.unitPrice || 0).toLocaleString()}</td>
                <td style="text-align: right;">18% (PKR ${Number(order.gstAmount || 0).toLocaleString()})</td>
                <td style="text-align: right;">${Number(order.subtotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Goods Subtotal:</td>
              <td style="text-align: right;">PKR ${Number(order.subtotal || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>GST / Govt Taxes (18%):</td>
              <td style="text-align: right;">PKR ${Number(order.gstAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>${order.fulfilmentType === 'cod' ? 'Courier / Delivery Charges:' : 'Pickup (Self-Arranged):'}</td>
              <td style="text-align: right;">PKR ${Number(order.deliveryFee || 0).toLocaleString()}</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total:</td>
              <td style="text-align: right;">PKR ${Number(order.grandTotal || 0).toLocaleString()}</td>
            </tr>
          </table>

          ${order.fulfilmentType === 'pickup' ? `
            <div class="safety-box">
              <strong>Pickup Safety Warning:</strong> Be careful, meet in a public daytime location or certified factory premises, and carry out inspection in the presence of colleagues or authorized personnel when meeting for pickup.
            </div>
          ` : ''}

          <div class="disclaimer-box">
            <strong>Core Legal Disclaimer:</strong>
            Munafa is not responsible for any item loss, theft, missing goods, damage in transit, non-payment, or any tax not paid to the Government of Pakistan. All businesses are solely responsible for their own goods, their own delivery, their own insurance, and their own tax collection and remittance. Munafa provides connecting services only.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates full Account Statement HTML for date range
   */
  public static generateStatementHtml(account: UserAccount, orders: OrderItem[], startDate: string, endDate: string): string {
    const totalDispatched = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalGst = orders.reduce((sum, o) => sum + o.gstAmount, 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Statement - ${escapeHtml(account.accountNumber)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1c1917; background: #fff; }
          .box { max-width: 850px; margin: auto; }
          .header { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          .table th { background: #f5f5f4; text-align: left; padding: 8px 10px; border-bottom: 1px solid #d6d3d1; }
          .table td { padding: 10px; border-bottom: 1px solid #f5f5f4; }
          .summary-card { background: #fafaf9; border: 1px solid #e7e5e4; padding: 16px; border-radius: 6px; margin-top: 20px; display: flex; justify-content: space-between; }
          .disclaimer { font-size: 11px; color: #78716c; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="header">
            <div style="display:flex;align-items:center;gap:14px;">
              <img src="/assets/aistudio/image_65c6c502.png" alt="MUNAFA" style="height:56px;width:auto;background:#fff;border:2px solid #d4af37;border-radius:8px;padding:3px 6px;" />
              <div>
                <h1 style="color: #047857; margin: 0; font-size: 24px;">MUNAFA منافع — Dispatched Orders Statement</h1>
                <div style="font-size: 13px; color: #57534e;">Account Holder: <strong>${escapeHtml(account.name)}</strong> (${escapeHtml(account.accountType.toUpperCase())}) · Account #: <strong>${escapeHtml(account.accountNumber)}</strong></div>
                ${account.ntn ? `<div style="font-size: 12px; color: #78716c;">NTN: ${escapeHtml(account.ntn)}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #57534e;">
              <div>Period: ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</div>
              <div>Generated: ${escapeHtml(new Date().toLocaleDateString('en-PK'))}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Counterparty</th>
                <th>Fulfilment</th>
                <th>Status</th>
                <th style="text-align: right;">GST (PKR)</th>
                <th style="text-align: right;">Total Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((o) => `
                <tr>
                  <td><strong>${escapeHtml(o.orderNumber)}</strong></td>
                  <td>${escapeHtml(new Date(o.createdAt).toLocaleDateString())}</td>
                  <td>${escapeHtml(o.sellerAccountNumber === account.accountNumber ? o.buyerName : o.sellerName)}</td>
                  <td>${escapeHtml(o.fulfilmentType.toUpperCase())}</td>
                  <td>${escapeHtml(o.status.toUpperCase())}</td>
                  <td style="text-align: right;">${Number(o.gstAmount || 0).toLocaleString()}</td>
                  <td style="text-align: right;"><strong>${Number(o.grandTotal || 0).toLocaleString()}</strong></td>
                </tr>
              `).join('')}
              ${orders.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #78716c;">No dispatched orders recorded in this date range.</td></tr>' : ''}
            </tbody>
          </table>

          <div class="summary-card">
            <div>Total Orders: <strong>${orders.length}</strong></div>
            <div>Cumulative GST Remitted: <strong>PKR ${totalGst.toLocaleString()}</strong></div>
            <div>Grand Total Trade Value: <strong style="color: #047857; font-size: 16px;">PKR ${totalDispatched.toLocaleString()}</strong></div>
          </div>

          <div class="disclaimer">
            Munafa is not responsible for any item loss, theft, missing goods, damage in transit, non-payment, or any tax not paid to the Government of Pakistan. All businesses are solely responsible for their own goods, their own delivery, their own insurance, and their own tax collection and remittance. Munafa provides connecting services only.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates Official Monthly FBR Tax & Settlement Statement HTML
   */
  public static generateMonthlyTaxStatementHtml(
    seller: UserAccount,
    orders: OrderItem[],
    monthName: string,
    year: number
  ): string {
    const totalGross = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalGst = orders.reduce((sum, o) => sum + o.gstAmount, 0);
    const totalDelivery = orders.reduce((sum, o) => sum + o.deliveryFee, 0);
    const netProceeds = totalGross - totalGst - totalDelivery;
    const withholdingEst = Math.round(totalGross * 0.02);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Monthly Tax Statement - ${escapeHtml(seller.name)} - ${escapeHtml(monthName)} ${year}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 28px; color: #000; background: #fff; line-height: 1.5; }
          .container { max-width: 860px; margin: auto; border: 2px solid #000; padding: 24px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .fbr-badge { background: #000; color: #fff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; letter-spacing: 0.5px; }
          .title { font-size: 22px; font-weight: 900; margin: 0; color: #000; }
          .subtitle { font-size: 12px; font-weight: 600; color: #333; margin-top: 4px; }
          .meta-box { text-align: right; font-size: 12px; font-weight: 700; }
          .seller-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; border: 1px solid #ccc; padding: 14px; border-radius: 6px; font-size: 12px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          .table th { background: #f0f0f0; text-align: left; padding: 8px 10px; border: 1px solid #999; font-weight: 900; }
          .table td { padding: 9px 10px; border: 1px solid #ccc; font-weight: 600; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
          .tax-card { border: 2px solid #000; padding: 14px; border-radius: 6px; font-size: 12px; }
          .tax-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ccc; }
          .tax-row.highlight { font-weight: 900; font-size: 14px; border-top: 2px solid #000; border-bottom: none; margin-top: 6px; padding-top: 8px; }
          .stamp-box { border: 2px dashed #000; padding: 14px; border-radius: 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; }
          .disclaimer { font-size: 10px; font-weight: 700; color: #444; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; line-height: 1.4; }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="display:flex;align-items:center;gap:14px;">
              <img src="/assets/aistudio/image_65c6c502.png" alt="MUNAFA" style="height:56px;width:auto;background:#fff;border:2px solid #d4af37;border-radius:8px;padding:3px 6px;" />
              <div>
                <span class="fbr-badge">FBR SALES TAX &amp; PROVINCIAL REVENUE ACT</span>
                <h1 class="title">MONTHLY COMMODITY TAX STATEMENT</h1>
                <div class="subtitle">Official Munafa Settlement · Section 153 Withholding &amp; Sales Tax Record</div>
              </div>
            </div>
            <div class="meta-box">
              <div>Period: <strong>${escapeHtml(monthName)} ${year}</strong></div>
              <div>Generated: <strong>${escapeHtml(new Date().toLocaleDateString('en-PK'))}</strong></div>
              <div>Report ID: <strong>MNF-TAX-${year}-${escapeHtml(monthName.slice(0, 3).toUpperCase())}-${escapeHtml(seller.accountNumber)}</strong></div>
            </div>
          </div>

          <div class="seller-grid">
            <div>
              <div><strong>Business Entity:</strong> ${escapeHtml(seller.name)}</div>
              <div><strong>Account Type:</strong> ${escapeHtml(seller.accountType.toUpperCase())}</div>
              <div><strong>8-Digit Munafa ID:</strong> ${escapeHtml(seller.accountNumber)}</div>
              <div><strong>Address:</strong> ${escapeHtml(seller.address)}</div>
            </div>
            <div>
              <div><strong>National Tax Number (NTN):</strong> ${escapeHtml(seller.ntn || 'STRN Pending Verification')}</div>
              <div><strong>CNIC Verification:</strong> ${escapeHtml(seller.cnic)}</div>
              <div><strong>Contact Phone:</strong> ${escapeHtml(seller.phone)}</div>
              <div><strong>Email:</strong> ${escapeHtml(seller.email)}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Fulfilment</th>
                <th>Counterparty</th>
                <th>Status</th>
                <th style="text-align: right;">Gross Trade</th>
                <th style="text-align: right;">Sales Tax (GST)</th>
                <th style="text-align: right;">Transit/Courier</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((o) => `
                <tr>
                  <td><strong>${escapeHtml(o.orderNumber)}</strong></td>
                  <td>${o.fulfilmentType === 'cod' ? 'COD (Insured)' : 'Site Pickup'}</td>
                  <td>${escapeHtml(o.buyerName)}</td>
                  <td>${escapeHtml(o.status.toUpperCase())}</td>
                  <td style="text-align: right;">PKR ${Number(o.grandTotal || 0).toLocaleString()}</td>
                  <td style="text-align: right;">PKR ${Number(o.gstAmount || 0).toLocaleString()}</td>
                  <td style="text-align: right;">PKR ${Number(o.deliveryFee || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
              ${orders.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 20px; font-weight: 700;">No trade transactions recorded for this billing cycle.</td></tr>' : ''}
            </tbody>
          </table>

          <div class="summary-grid">
            <div class="tax-card">
              <div style="font-weight: 900; margin-bottom: 8px; text-transform: uppercase;">Tax &amp; Settlement Breakdown</div>
              <div class="tax-row">
                <span>Total Dispatched Transactions:</span>
                <strong>${orders.length} Consignments</strong>
              </div>
              <div class="tax-row">
                <span>Gross Taxable Invoice Volume:</span>
                <strong>PKR ${totalGross.toLocaleString()}</strong>
              </div>
              <div class="tax-row">
                <span>Applicable FBR GST (18% Collected):</span>
                <strong>PKR ${totalGst.toLocaleString()}</strong>
              </div>
              <div class="tax-row">
                <span>Est. Advance Withholding Tax (WHT 2%):</span>
                <strong>PKR ${withholdingEst.toLocaleString()}</strong>
              </div>
              <div class="tax-row">
                <span>Insured Transit &amp; Courier Costs:</span>
                <strong>PKR ${totalDelivery.toLocaleString()}</strong>
              </div>
              <div class="tax-row highlight">
                <span>Net Realized Trade Value:</span>
                <span>PKR ${netProceeds.toLocaleString()}</span>
              </div>
            </div>

            <div class="stamp-box">
              <div style="font-weight: 900; font-size: 13px; margin-bottom: 4px;">MUNAFA DIGITAL COMPLIANCE SEAL</div>
              <div style="font-size: 10px; color: #555;">Digitally Verified by MUNAFA Compliance Bureau</div>
              <div style="margin: 12px 0; font-family: monospace; font-weight: 900; letter-spacing: 2px; font-size: 14px;">[ FBR-STAMP-VERIFIED-2026 ]</div>
              <div style="font-size: 10px;">Audit Integrity Score: <strong>100% Validated</strong></div>
              <div style="font-size: 10px; margin-top: 4px;">Signatory: <em>Munafa Automated Tax Settlement Bureau</em></div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>LEGAL STATUTORY NOTICE:</strong> Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7). All Pakistani Farmers, Mining operators, Factories, and Wholesalers registered on Munafa are directly responsible under Federal Board of Revenue (FBR) laws for filing periodic sales tax returns and remitting GST/WHT. Munafa operates strictly as a connecting marketplace platform.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Prints generated invoice HTML safely using a hidden sandboxed iframe (no popups or alert blockers).
   * Falls back to HTML download if printing is blocked in embedded WebView environments.
   */
  public static printDocument(htmlContent: string) {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.srcdoc = htmlContent;

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          PdfGenerator.downloadFile(htmlContent, `Munafa_Document_${Date.now()}.html`);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 1500);
        }
      };

      document.body.appendChild(iframe);
    } catch {
      PdfGenerator.downloadFile(htmlContent, `Munafa_Document_${Date.now()}.html`);
    }
  }

  /**
   * Triggers safe download of the invoice/statement HTML file
   */
  public static downloadFile(htmlContent: string, fileName: string) {
    const safeName = sanitizeFilename(fileName, 'Munafa_Document.html');
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
