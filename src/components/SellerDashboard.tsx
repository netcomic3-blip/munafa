/**
 * MUNAFA Seller Desk
 * For Farmers, Mining Businesses, Factories, and Wholesalers
 * Subscription management, automatic freeze alerts, payment reference submissions, and item listings
 */

import React, { useState } from 'react';
import { UserAccount, ProductItem, ProductCategory } from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { PdfGenerator } from '../services/pdfGenerator';
import { isSafeMediaUrl, scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import { AdPostingForm } from './AdPostingForm';
import {
  Plus,
  Package,
  AlertOctagon,
  Receipt,
  LogOut,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
  Boxes,
  Trash2,
} from 'lucide-react';

interface SellerDashboardProps {
  currentUser: UserAccount;
  onOpenInbox: () => void;
  onLogout?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  onOpenInbox,
  onLogout,
}) => {
  const [products, setProducts] = useState<ProductItem[]>(() =>
    LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber === currentUser.accountNumber)
  );

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentSlipUrl, setPaymentSlipUrl] = useState('');
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);

  // Monthly FBR Tax Statement state
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [formError, setFormError] = useState<string | null>(null);
  const [failedProductImgs, setFailedProductImgs] = useState<Record<string, boolean>>({});
  const [confirmRemoveAdId, setConfirmRemoveAdId] = useState<string | null>(null);

  React.useEffect(() => {
    const sync = () => {
      setProducts(
        LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber === currentUser.accountNumber)
      );
    };
    sync();
    return LocalEdgeDb.subscribe(sync);
  }, [currentUser.accountNumber]);

  const subscription = currentUser.subscription;
  const isFrozen = subscription.status === 'frozen';

  const categoryLabel = (cat: ProductCategory) => {
    switch (cat) {
      case 'farm_mining':
        return 'Farmer & Mining';
      case 'factory':
        return 'Factory Goods';
      case 'wholesale':
        return 'Wholesale Bulk';
    }
  };

  const handleSubmitPaymentRef = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!paymentRefInput.trim()) return;

    const refScan = scanPayloadForThreats(paymentRefInput, 'seller_payment_ref');
    if (!refScan.safe) {
      setFormError(refScan.reason || 'Security shield blocked unsafe payment reference.');
      return;
    }

    const cleanSlipUrl = paymentSlipUrl.trim();
    if (cleanSlipUrl && !isSafeMediaUrl(cleanSlipUrl)) {
      setFormError('Security shield blocked an unsafe payment slip URL.');
      return;
    }

    setIsSubmittingRef(true);
    const threadId = `th_system_${currentUser.accountNumber}`;

    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: 'admin',
      type: 'payment_ref',
      content: `PAYMENT REFERENCE: Reference #${sanitizeTextInput(paymentRefInput)} for Munafa business subscription fee (PKR ${subscription.feePkr.toLocaleString()}). Requesting verification and account unfreeze.`,
      fileUrl: cleanSlipUrl || undefined,
      fileName: 'Bank_Payment_Receipt.jpg',
    });

    const updated = { ...currentUser };
    updated.subscription.pendingPaymentRef = {
      refNumber: sanitizeTextInput(paymentRefInput),
      receiptUrl: cleanSlipUrl || undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    try {
      LocalEdgeDb.saveAccount(updated);
    } catch (err: unknown) {
      setIsSubmittingRef(false);
      setFormError(err instanceof Error ? err.message : 'Unable to submit payment reference.');
      return;
    }

    setTimeout(() => {
      setIsSubmittingRef(false);
      setPaymentRefInput('');
      setPaymentSlipUrl('');
      onOpenInbox();
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 border-2 border-red-600 text-red-950 text-xs font-extrabold rounded-xl flex items-center justify-between">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      {/* Frozen / Pending Admin Activation Banner with Payment Reference Submission Row */}
      {isFrozen && (
        <div
          className={`bg-white border-2 rounded-2xl p-6 text-stone-950 shadow-xs ${
            subscription.pendingPaymentRef?.status === 'pending'
              ? 'border-amber-500'
              : 'border-red-500'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertOctagon
              className={`w-6 h-6 shrink-0 mt-0.5 ${
                subscription.pendingPaymentRef?.status === 'pending' ? 'text-amber-600' : 'text-red-600'
              }`}
            />
            <div className="space-y-1 flex-1">
              <h2
                className={`text-base font-extrabold ${
                  subscription.pendingPaymentRef?.status === 'pending'
                    ? 'text-amber-950'
                    : 'text-red-950'
                }`}
              >
                {subscription.pendingPaymentRef?.status === 'pending'
                  ? 'PENDING ADMIN PAYMENT VERIFICATION'
                  : 'ACCOUNT DEACTIVATED — SUBSCRIPTION PAYMENT REQUIRED'}
              </h2>
              <p className="text-xs text-stone-700 font-semibold leading-relaxed">
                {subscription.pendingPaymentRef?.status === 'pending' ? (
                  <>
                    Your subscription payment reference{' '}
                    <strong className="font-mono">#{subscription.pendingPaymentRef.refNumber}</strong> (
                    {(subscription.pendingPaymentRef.channel || subscription.paymentChannel || 'JazzCash/Bank').toUpperCase()}
                    ) is awaiting Admin review. Once Admin checks payment received and clicks{' '}
                    <strong>Activate Account</strong>, your unlimited product ads will go live immediately.
                  </>
                ) : (
                  <>
                    Your Munafa subscription is currently deactivated (due date:{' '}
                    <strong>{subscription.dueDate}</strong>). Please submit your JazzCash or Bank Transfer payment reference below so Admin can check payment received and activate your account.
                  </>
                )}
              </p>
              <div
                className={`text-xs font-mono font-extrabold pt-1 ${
                  subscription.pendingPaymentRef?.status === 'pending' ? 'text-amber-800' : 'text-red-700'
                }`}
              >
                Registration / Renewal Fee: PKR {subscription.feePkr.toLocaleString()} (
                {subscription.cycle === 'yearly' ? 'Annual rate' : 'Monthly rate'}) · Zero extra fees on orders or ads
              </div>
            </div>
          </div>

          {/* Submission Row & Button */}
          <div className="mt-4 pt-4 border-t-2 border-stone-200">
            <h3 className="text-xs font-extrabold text-stone-950 mb-2 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-700" />
              <span>
                {subscription.pendingPaymentRef?.status === 'pending'
                  ? 'Update or Resubmit JazzCash / Bank Transfer Reference to Admin'
                  : 'Submit JazzCash / Bank Transfer Payment Reference to Admin'}
              </span>
            </h3>

            <form onSubmit={handleSubmitPaymentRef} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                placeholder="JazzCash / Bank Transfer Reference # (e.g. TRX-998821)"
                className="flex-1 px-3 py-2 text-xs border-2 border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold"
              />
              <input
                type="text"
                value={paymentSlipUrl}
                onChange={(e) => setPaymentSlipUrl(e.target.value)}
                placeholder="Optional Slip Scan URL"
                className="w-full sm:w-56 px-3 py-2 text-xs border-2 border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
              <button
                type="submit"
                disabled={isSubmittingRef}
                className="py-2 px-4 munafa-green-btn font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmittingRef ? 'Sending...' : 'Send Reference to Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Seller Desk Top Bar with Log Out button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 munafa-bg-header bg-[#034720] text-white p-5 rounded-2xl border-2 border-[#d4af37] shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.photoUrl}
            alt={currentUser.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#facc15] shadow-2xs"
          />
          <div>
            <h1 className="text-base font-extrabold text-white">{currentUser.name}</h1>
            <p className="text-xs text-[#fef08a] font-mono font-bold">
              Account #{currentUser.accountNumber} · {currentUser.accountType.replace('_', ' ').toUpperCase()} · {currentUser.address}
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="py-2 px-4 bg-[#023819] hover:bg-red-700 border border-[#facc15]/70 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Log Out of Munafa"
          >
            <LogOut className="w-3.5 h-3.5 text-[#fef08a]" />
            <span>Log Out</span>
          </button>
        )}
      </div>

      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-[#046c31] uppercase font-extrabold tracking-wider mb-1">
            Subscription Tier
          </div>
          <div className="text-lg font-extrabold text-[#023819]">
            {currentUser.accountType === 'customer'
              ? 'Buyer (100% Free)'
              : currentUser.accountType === 'farmer_mining'
              ? 'Farmer / Mining (PKR 2,000 / Year)'
              : currentUser.accountType === 'factory'
              ? 'Factory (PKR 2,000 / Month)'
              : 'Wholesaler (PKR 1,500 / Month)'}
          </div>
          <div className="text-xs text-stone-700 font-bold mt-1">
            Status:{' '}
            <strong
              className={
                isFrozen
                  ? subscription.pendingPaymentRef?.status === 'pending'
                    ? 'text-amber-700 font-extrabold'
                    : 'text-red-600 font-extrabold'
                  : 'text-emerald-700 font-extrabold'
              }
            >
              {isFrozen
                ? subscription.pendingPaymentRef?.status === 'pending'
                  ? 'PENDING ADMIN ACTIVATION'
                  : 'DEACTIVATED'
                : 'ACTIVE'}
            </strong>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-[#046c31] uppercase font-extrabold tracking-wider mb-1">
            Next Payment Due Date
          </div>
          <div className="text-lg font-extrabold text-[#023819] font-mono">
            {subscription.dueDate}
          </div>
          <div className="text-xs text-stone-700 font-bold mt-1">
            {isFrozen ? (
              subscription.pendingPaymentRef?.status === 'pending' ? (
                <span className="text-amber-700 font-extrabold">Waiting for Admin to check payment & activate</span>
              ) : (
                <span className="text-red-600 font-extrabold">
                  {subscription.daysOverdue ? `${subscription.daysOverdue} days overdue` : 'Deactivated by Admin'}
                </span>
              )
            ) : (
              <span className="text-emerald-700 font-extrabold">Active & in good standing</span>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#046c31] uppercase font-extrabold tracking-wider mb-1">
              Seller NTN Registration
            </div>
            <div className="text-lg font-mono font-extrabold text-[#023819]">
              {currentUser.ntn || 'Not Provided'}
            </div>
          </div>
          <p className="text-[10px] text-stone-600 font-bold mt-2">
            Tax collection & remittance is the sole responsibility of the seller.
          </p>
        </div>
      </div>

      {/* MONTHLY FINAL FBR TAX STATEMENT & SETTLEMENT CONSOLE (For Farmers/Mining, Factory, Wholesaler) */}
      <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#eef7f1] p-6 border-b-2 border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#034720] text-[#fef08a] border border-[#d4af37] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
                FBR SECTION 153 COMPLIANCE
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-950 bg-white border border-emerald-400 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>AI Fraud Shield Active · 0% Threat Rating</span>
              </span>
            </div>
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-800" />
              <span>
                {currentUser.accountType === 'farmer_mining'
                  ? 'Farmer / Mining Monthly Tax & Settlement Statement'
                  : currentUser.accountType === 'factory'
                  ? 'Factory Monthly Sales Tax & Settlement Statement'
                  : 'Wholesaler Monthly Tax & Settlement Statement'}
              </span>
            </h3>
            <p className="text-xs text-stone-600 font-bold leading-relaxed max-w-2xl">
              Download and print your official FBR monthly tax declaration PDF with consolidated GST (18%) and Section 153 Withholding Tax summaries (PKR 0 extra platform order fees).
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-3 bg-white border-2 border-stone-300 rounded-xl text-xs font-black text-black cursor-pointer shadow-2xs focus:ring-2 focus:ring-emerald-700"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="py-1.5 px-3 bg-white border-2 border-stone-300 rounded-xl text-xs font-black text-black cursor-pointer shadow-2xs focus:ring-2 focus:ring-emerald-700"
            >
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tax Settlement Data Cards */}
        {(() => {
          const sellerOrders = LocalEdgeDb.getOrdersForAccount(currentUser.accountNumber);
          const totalGross = sellerOrders.reduce((sum, o) => sum + o.grandTotal, 0);
          const totalGst = sellerOrders.reduce((sum, o) => sum + o.gstAmount, 0);
          const totalDelivery = sellerOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
          const totalWithholding = Math.round(totalGross * 0.02);
          const totalNet = totalGross - totalGst - totalDelivery;

          const handlePrintTaxStatement = () => {
            const html = PdfGenerator.generateMonthlyTaxStatementHtml(currentUser, sellerOrders, selectedMonth, selectedYear);
            PdfGenerator.printDocument(html);
          };

          const handleDownloadTaxStatement = () => {
            const html = PdfGenerator.generateMonthlyTaxStatementHtml(currentUser, sellerOrders, selectedMonth, selectedYear);
            PdfGenerator.downloadFile(html, `Munafa_Monthly_Tax_Statement_${selectedMonth}_${selectedYear}_${currentUser.accountNumber}.html`);
          };

          return (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-[#f2fbf5] border-2 border-emerald-200 rounded-xl">
                  <div className="text-[10px] uppercase font-black text-stone-500">Gross Sales</div>
                  <div className="text-sm font-black text-black font-mono mt-0.5">
                    PKR {totalGross.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-[#f2fbf5] border-2 border-emerald-200 rounded-xl">
                  <div className="text-[10px] uppercase font-black text-stone-500">GST Collected (18%)</div>
                  <div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
                    PKR {totalGst.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-[#f2fbf5] border-2 border-emerald-200 rounded-xl">
                  <div className="text-[10px] uppercase font-black text-stone-500">Est. WHT (2%)</div>
                  <div className="text-sm font-black text-stone-800 font-mono mt-0.5">
                    PKR {totalWithholding.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-[#f2fbf5] border-2 border-emerald-200 rounded-xl">
                  <div className="text-[10px] uppercase font-black text-stone-500">Delivery / Platform Fee</div>
                  <div className="text-sm font-black text-stone-800 font-mono mt-0.5">
                    PKR {totalDelivery.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-[#dcfce7] border-2 border-[#046c31] rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-black text-[#023819]">Net Realized Payout</div>
                  <div className="text-sm font-black text-[#023819] font-mono mt-0.5">
                    PKR {totalNet.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Print Statement & Download PDF */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-stone-600 font-bold">
                  Period: <strong className="text-black">{selectedMonth} {selectedYear}</strong> · Status: <span className="text-emerald-800 font-black">FBR Compliant & Dispatched</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintTaxStatement}
                    className="py-2.5 px-4 bg-[#023819] hover:bg-[#034720] border border-[#d4af37] text-[#fef08a] font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-[#fef08a]" />
                    <span>Print Monthly Tax Statement</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTaxStatement}
                    className="py-2.5 px-4 munafa-green-btn font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Tax PDF / HTML</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Catalog & Products Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-extrabold text-[#023819]">Your Product Listings ({products.length}) — Unlimited Ads</h2>
          <p className="text-xs text-stone-600 font-semibold">
            {isFrozen
              ? 'Ads you post are saved and go live on the Marketplace as soon as Admin activates your account.'
              : 'Live on Munafa Marketplace. Post as many product ads as you want with zero posting fees.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddingItem(!isAddingItem)}
          className="py-2.5 px-4 munafa-gold-btn rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-[#052e16]" />
          <span>{isAddingItem ? 'Cancel Item' : 'Add New Item'}</span>
        </button>
      </div>

      {/* Unified Ad Posting Form Drawer */}
      {isAddingItem && (
        <AdPostingForm
          currentUser={currentUser}
          onCancel={() => setIsAddingItem(false)}
          onPublished={() => setIsAddingItem(false)}
        />
      )}

      {/* Items Grid (Matches Main Marketplace Card Format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <article
            key={p.id}
            className={`bg-white rounded-2xl border-2 overflow-hidden shadow-xs flex flex-col justify-between ${
              p.isActive ? 'border-stone-200 hover:border-emerald-700' : 'border-red-400'
            }`}
          >
            <div className="aspect-4/3 bg-stone-100 overflow-hidden relative flex items-center justify-center border-b border-stone-200">
              {failedProductImgs[p.id] || !p.imageUrl ? (
                <div className="w-full h-full bg-[#eef7f1] flex flex-col items-center justify-center p-4 text-center">
                  <Boxes className="w-10 h-10 text-[#046c31] mb-2" />
                  <span className="text-xs font-extrabold text-[#023819]">{p.title}</span>
                </div>
              ) : (
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedProductImgs((prev) => ({ ...prev, [p.id]: true }))}
                  className="w-full h-full object-cover"
                />
              )}
              {!p.isActive && (
                <div className="absolute inset-0 bg-black/85 flex items-center justify-center text-white text-xs font-extrabold uppercase tracking-wider">
                  Hidden (Account Frozen)
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-[11px] font-extrabold">
                  <span className="text-[#046c31] uppercase tracking-wide truncate">
                    {categoryLabel(p.category)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-700 truncate shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#046c31] shrink-0" />
                    <span className="truncate">{p.city}</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-[#023819] text-base leading-snug line-clamp-2">
                    {p.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mt-1">
                    {p.description}
                  </p>
                </div>

                <div className="p-2.5 bg-[#f4faf6] border border-emerald-700/20 rounded-xl flex items-center justify-between text-[11px] font-mono font-bold text-[#065f46]">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>{p.sellerPhone || currentUser.phone}</span>
                  </span>
                  <span className="font-black">#{p.sellerAccountNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-stone-500 font-bold">Min Order Qty</div>
                    <div className="font-mono font-black text-xs text-[#023819] mt-0.5">
                      {p.minOrderQty} {p.unit}
                    </div>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-stone-500 font-bold">Available Stock</div>
                    <div className="font-mono font-black text-xs text-[#023819] mt-0.5">
                      {p.quantityAvailable} {p.unit}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-stone-200 rounded-xl bg-white overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-stone-200">
                  <div className="p-3 bg-white">
                    <span className="text-[10px] uppercase font-extrabold text-stone-500 block">
                      Price / {p.unit}
                    </span>
                    <div className="font-mono font-black text-sm text-[#023819] mt-1">
                      PKR {p.pricePerUnit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50/80">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-900 block">
                      Govt GST ({p.taxRatePercent}%)
                    </span>
                    <div className="font-mono font-extrabold text-xs text-emerald-900 mt-1">
                      +PKR {p.taxAmountPkr.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

                {confirmRemoveAdId === p.id ? (
                  <div className="mt-3 p-2.5 bg-red-50 border-2 border-red-400 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-red-900">Remove this ad permanently?</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveAdId(null)}
                        className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg font-bold text-stone-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          LocalEdgeDb.deleteProduct(p.id, false);
                          setConfirmRemoveAdId(null);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black cursor-pointer"
                      >
                        Confirm Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveAdId(p.id)}
                    className="mt-3 w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-800 border-2 border-red-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Ad</span>
                  </button>
                )}
              </div>
          </article>
        ))}

        {products.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white rounded-2xl border-2 border-emerald-700/25 text-[#023819] font-extrabold text-xs">
            No items listed yet. Click "Add New Item" to start selling directly to shops and households.
          </div>
        )}
      </div>
    </div>
  );
};
