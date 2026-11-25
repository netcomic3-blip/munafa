/**
 * MUNAFA Orders & Statements View
 * Tracks order progress timelines, generates official Invoice PDFs, and prints Statement PDFs
 */

import React, { useState } from 'react';
import { OrderItem, UserAccount, OrderStatus, DisputeReport } from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { PdfGenerator } from '../services/pdfGenerator';
import { useLanguage } from '../context/LanguageContext';
import { scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import {
  FileText,
  Printer,
  Download,
  Truck,
  PackageCheck,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Search,
  CheckCircle,
  Calendar,
  LogOut,
} from 'lucide-react';

interface OrdersViewProps {
  currentUser: UserAccount;
  onOpenChatWithCounterparty: (accountNumber: string) => void;
  onLogout?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  onOpenChatWithCounterparty,
  onLogout,
}) => {
  const [orders, setOrders] = useState<OrderItem[]>(() =>
    LocalEdgeDb.getOrdersForAccount(currentUser.accountNumber)
  );
  const [accounts, setAccounts] = useState<UserAccount[]>(() => LocalEdgeDb.getAccounts());

  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderItem | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [statementRangeStart, setStatementRangeStart] = useState('2026-01-01');
  const [statementRangeEnd, setStatementRangeEnd] = useState('2026-12-31');

  React.useEffect(() => {
    const sync = () => {
      setOrders(LocalEdgeDb.getOrdersForAccount(currentUser.accountNumber));
      setAccounts(LocalEdgeDb.getAccounts());
    };
    sync();
    return LocalEdgeDb.subscribe(sync);
  }, [currentUser.accountNumber]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  // Action handlers
  const handleUpdateStatus = (
    order: OrderItem,
    newStatus: OrderStatus,
    note?: string,
    trackingNo?: string
  ) => {
    LocalEdgeDb.updateOrderStatus(
      order.id,
      newStatus,
      currentUser.accountNumber,
      note,
      trackingNo
    );
  };

  const handlePrintInvoice = (order: OrderItem) => {
    const seller = accounts.find((a) => a.accountNumber === order.sellerAccountNumber) || currentUser;
    const buyer = accounts.find((a) => a.accountNumber === order.buyerAccountNumber) || currentUser;
    const html = PdfGenerator.generateInvoiceHtml(order, seller, buyer);
    PdfGenerator.printDocument(html);
  };

  const handleDownloadInvoice = (order: OrderItem) => {
    const seller = accounts.find((a) => a.accountNumber === order.sellerAccountNumber) || currentUser;
    const buyer = accounts.find((a) => a.accountNumber === order.buyerAccountNumber) || currentUser;
    const html = PdfGenerator.generateInvoiceHtml(order, seller, buyer);
    PdfGenerator.downloadFile(html, `Munafa_Invoice_${order.orderNumber}.html`);
  };

  const handlePrintStatement = () => {
    const startMs = statementRangeStart ? new Date(`${statementRangeStart}T00:00:00`).getTime() : 0;
    const endMs = statementRangeEnd ? new Date(`${statementRangeEnd}T23:59:59.999`).getTime() : Number.MAX_SAFE_INTEGER;
    const rangedOrders = orders.filter((o) => {
      const createdMs = new Date(o.createdAt).getTime();
      if (!Number.isFinite(createdMs)) return true;
      return createdMs >= startMs && createdMs <= endMs;
    });
    const html = PdfGenerator.generateStatementHtml(
      currentUser,
      rangedOrders,
      statementRangeStart,
      statementRangeEnd
    );
    PdfGenerator.printDocument(html);
  };

  const { t, isUrdu } = useLanguage();
  const [disputeOrder, setDisputeOrder] = useState<OrderItem | null>(null);
  const [disputeCategory, setDisputeCategory] = useState<DisputeReport['category']>('missing_item');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!disputeOrder || !disputeDesc.trim()) return;
    const isSeller = disputeOrder.sellerAccountNumber === currentUser.accountNumber;
    try {
      LocalEdgeDb.addDispute({
        orderId: disputeOrder.id,
        orderNumber: disputeOrder.orderNumber,
        reporterAccountNumber: currentUser.accountNumber,
        reporterName: currentUser.name,
        againstAccountNumber: isSeller
          ? disputeOrder.buyerAccountNumber
          : disputeOrder.sellerAccountNumber,
        againstName: isSeller ? disputeOrder.buyerName : disputeOrder.sellerName,
        category: disputeCategory,
        description: disputeDesc.trim(),
      });
      setDisputeSuccess(
        isUrdu
          ? `آرڈر #${disputeOrder.orderNumber} کا تنازعہ ایڈمن کو بھیج دیا گیا ہے۔`
          : `Dispute for Order #${disputeOrder.orderNumber} submitted to Munafa Admin.`
      );
      setDisputeOrder(null);
      setDisputeDesc('');
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : '1st-Second Shield blocked unsafe dispute content.');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_fee':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'dispatched':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'closed':
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6">
      {/* Dispute Submission Confirmation Banner */}
      {disputeSuccess && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-700 rounded-2xl flex items-center justify-between gap-3 text-xs font-extrabold text-emerald-950 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{disputeSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setDisputeSuccess(null)}
            className="text-emerald-900 underline cursor-pointer font-black"
          >
            {isUrdu ? 'بند کریں' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Top Banner and Statement Generator */}
      <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#023819]">
            {isUrdu ? 'آرڈرز، انوائسز اور اسٹیٹمنٹس' : 'Orders, Invoices & Statements'}
          </h1>
          <p className="text-xs text-stone-700 font-semibold mt-1">
            {isUrdu
              ? 'تمام لین دین ایف بی آر جی ایس ٹی کمرشل انوائسز اور بیمہ شدہ ترسیلی رسیدوں کے ساتھ محفوظ ہیں۔'
              : 'Track insured deliveries, direct pickups, and download official FBR GST commercial invoices and statements.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#023819] font-bold bg-[#f2fbf5] px-3 py-2 rounded-xl border-2 border-emerald-300">
            <Calendar className="w-3.5 h-3.5 text-[#046c31]" />
            <input
              type="date"
              value={statementRangeStart}
              onChange={(e) => setStatementRangeStart(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={statementRangeEnd}
              onChange={(e) => setStatementRangeEnd(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrintStatement}
            className="py-2 px-4 munafa-green-btn rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#fef08a]" />
            <span>Generate Statement PDF</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="py-2 px-3.5 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 border-2 border-stone-300 text-stone-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Log Out of Munafa"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {[
          { id: 'all', label: isUrdu ? `تمام آرڈرز (${orders.length})` : `All Orders (${orders.length})` },
          { id: 'placed', label: isUrdu ? 'نیا آرڈر' : 'Placed' },
          { id: 'confirmed', label: isUrdu ? 'سیلر سے تصدیق شدہ' : 'Confirmed by Seller' },
          { id: 'dispatched', label: isUrdu ? 'روانہ / کوریئر' : 'Dispatched / In Transit' },
          { id: 'delivered', label: isUrdu ? 'موصول ہو گیا' : 'Delivered' },
          { id: 'closed', label: isUrdu ? 'مکمل' : 'Closed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`py-2 px-4 rounded-xl border-2 font-extrabold cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-[#034720] text-[#fef08a] border-[#d4af37] shadow-xs'
                : 'bg-white border-emerald-300 text-[#023819] hover:bg-[#f2fbf5] hover:border-emerald-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => {
          const isSeller = ord.sellerAccountNumber === currentUser.accountNumber;
          const isBuyer = ord.buyerAccountNumber === currentUser.accountNumber;

          return (
            <div
              key={ord.id}
              className="bg-white border-2 border-emerald-700/30 rounded-2xl overflow-hidden shadow-xs hover:border-emerald-700/60 transition-colors"
            >
              {/* Order Header Row */}
              <div className="p-4 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-extrabold">Order #</span>
                    <span className="font-mono font-extrabold text-sm text-stone-950">{ord.orderNumber}</span>
                  </div>
                  <div className="h-6 w-0.5 bg-stone-300" />
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-extrabold">Date</span>
                    <span className="font-mono text-stone-800 font-bold">
                      {new Date(ord.createdAt).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-stone-200" />
                  <div>
                    <span className="text-stone-600 block text-[10px] uppercase font-extrabold">Counterparty</span>
                    <span className="font-semibold text-stone-900 truncate">
                      {isSeller ? `Buyer: ${ord.buyerName}` : `Seller: ${ord.sellerName}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${getStatusBadge(
                      ord.status
                    )}`}
                  >
                    {ord.status}
                  </span>

                  <button
                    onClick={() => handlePrintInvoice(ord)}
                    className="p-1.5 bg-white border border-stone-200 hover:bg-stone-100 rounded text-stone-700 transition-colors cursor-pointer"
                    title="Print Commercial Invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadInvoice(ord)}
                    className="p-1.5 bg-white border border-stone-200 hover:bg-stone-100 rounded text-stone-700 transition-colors cursor-pointer"
                    title="Download Invoice HTML/PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Order Body Details */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Product & Pricing Details */}
                <div className="md:col-span-6 space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm">{ord.productTitle}</h3>
                  <div className="text-xs text-stone-600 flex items-center gap-2 font-mono">
                    <span>{ord.quantity} {ord.unit}(s)</span>
                    <span aria-hidden="true">·</span>
                    <span>PKR {ord.unitPrice.toLocaleString()} / unit</span>
                  </div>

                  <div className="pt-2 text-xs text-stone-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Goods Subtotal:</span>
                      <span className="font-mono">PKR {ord.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span className="font-mono">PKR {ord.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{ord.fulfilmentType === 'cod' ? 'Courier / Delivery:' : 'Pickup (Self-Arranged):'}</span>
                      <span className="font-mono">PKR {ord.deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="pt-1.5 border-t border-stone-100 flex justify-between font-bold text-stone-900 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-emerald-800 font-mono">PKR {ord.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Zero Extra Order Fees Guarantee */}
                  <div className="p-3 bg-[#f2fbf5] border-2 border-emerald-600 rounded-2xl flex items-center justify-between text-xs text-[#023819] font-black shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#046c31]" />
                      <span>
                        {isUrdu
                          ? '100% مفت آرڈرنگ (صفر پلیٹ فارم فیس) — براہِ راست سیلر کو ارسال'
                          : '100% Free Ordering (PKR 0 Extra Fee) · Sent Directly to Seller'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase bg-[#034720] text-[#fef08a] border border-[#d4af37] px-2 py-0.5 rounded">
                      {ord.fulfilmentType.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        onOpenChatWithCounterparty(
                          isSeller ? ord.buyerAccountNumber : ord.sellerAccountNumber
                        )
                      }
                      className="py-2 px-4 bg-[#eef7f1] hover:bg-[#dcfce7] text-[#023819] border-2 border-[#046c31] rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#046c31]" />
                      <span>
                        {isUrdu ? 'آرڈر چیٹ کھولیں' : 'Chat in Order Thread'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDisputeOrder(ord);
                        setDisputeCategory('missing_item');
                        setDisputeDesc('');
                      }}
                      className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-900 border-2 border-red-400 hover:border-red-600 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                      <span>{isUrdu ? 'ایڈمن کو شکایت / تنازعہ' : 'Report Dispute to Admin'}</span>
                    </button>
                  </div>
                </div>

                {/* Fulfilment & Progress Timeline */}
                <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-stone-100 md:pl-6 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                      {ord.fulfilmentType === 'cod' ? (
                        <>
                          <Truck className="w-4 h-4 text-emerald-700" />
                          <span>Cash on Delivery (Insured Transit)</span>
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4 text-emerald-700" />
                          <span>Pickup at Supplier Facility</span>
                        </>
                      )}
                    </div>
                  </div>

                  {ord.courierTrackingNo && (
                    <div className="text-xs bg-purple-50 border border-purple-200 text-purple-900 p-2 rounded font-mono">
                      <strong>Tracking Number:</strong> {ord.courierTrackingNo}
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 block">
                      Timeline Progress
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {ord.timeline.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-stone-900">{step.status.toUpperCase()}: </span>
                            <span className="text-stone-700 text-[11px]">{step.note}</span>
                            <div className="text-[10px] text-stone-600 font-mono">
                              {new Date(step.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Next Action Buttons */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                    {/* Seller actions */}
                    {isSeller && ord.status === 'placed' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(ord, 'confirmed', 'Supplier confirmed stock and packaging.')
                        }
                        className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Confirm Order
                      </button>
                    )}

                    {isSeller && ord.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          setTrackingModalOrder(ord);
                          setTrackingNumberInput(`TCS-EXP-${Math.floor(100000 + Math.random() * 900000)}PK`);
                        }}
                        className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Dispatch via Insured Courier
                      </button>
                    )}

                    {/* Buyer or Seller handover confirm */}
                    {ord.status === 'dispatched' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            ord,
                            'delivered',
                            'Goods received safely. Cash payment collected at handover.'
                          )
                        }
                        className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Mark as Delivered / Handed Over
                      </button>
                    )}

                    {ord.status === 'delivered' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(ord, 'closed', 'Order transaction successfully finalized and closed.')
                        }
                        className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Close Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-emerald-700/25 p-12 text-center text-[#023819] font-extrabold text-xs">
            {isUrdu ? 'اس فلٹر کے تحت کوئی آرڈر نہیں ملا۔' : 'No orders found under this filter.'}
          </div>
        )}
      </div>

      {/* Dispatch Tracking Number Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden">
            <div className="px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37]">
              <h3 className="text-base font-extrabold text-white">
                Confirm Insured Courier Dispatch
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-stone-700 font-semibold mb-4">
                Enter the insured tracking or consignment note number from your logistics carrier (TCS, Leopards, Freight).
              </p>

              {modalError && (
                <div className="mb-3 p-2.5 bg-red-50 border-2 border-red-400 rounded-xl text-xs font-black text-red-900">
                  {modalError}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const scan = scanPayloadForThreats(trackingNumberInput, 'courier_tracking');
                  if (!scan.safe) {
                    setModalError(scan.reason || '1st-Second Shield blocked unsafe tracking code.');
                    return;
                  }
                  setModalError(null);
                  handleUpdateStatus(
                    trackingModalOrder,
                    'dispatched',
                    `Dispatched via insured freight. Policy active.`,
                    sanitizeTextInput(trackingNumberInput)
                  );
                  setTrackingModalOrder(null);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-extrabold text-stone-800 uppercase mb-1">
                    Insured Courier Tracking / Consignment #
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="e.g. TCS-EXP-849201PK"
                    className="w-full px-3 py-2 text-sm font-mono font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrder(null)}
                    className="px-4 py-2 text-xs text-stone-700 hover:text-stone-950 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-extrabold cursor-pointer shadow-xs"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Escalation Modal */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden"
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            <div className="px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#fef08a]" />
                <span>
                  {isUrdu
                    ? `آرڈر #${disputeOrder.orderNumber} کی شکایت درج کریں`
                    : `Report Dispute — Order #${disputeOrder.orderNumber}`}
                </span>
              </h3>
            </div>
            <div className="p-6">
            <p className="text-xs text-stone-700 font-semibold mb-4">
              {isUrdu
                ? 'گمشدہ مال، چوری، معیار کی خرابی یا انشورنس کلیم کے لیے ایڈمن کو اطلاع دیں۔'
                : 'Escalate missing items, delivery theft, damaged goods, or insurance claims to Munafa Staff Admin.'}
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 bg-red-50 border-2 border-red-400 rounded-xl text-xs font-black text-red-900">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitDispute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-stone-900 uppercase mb-1">
                  {isUrdu ? 'شکایت کی قسم' : 'Dispute Category'}
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value as DisputeReport['category'])}
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="missing_item">
                    {isUrdu ? 'ترسیل میں گمشدہ اشیاء' : 'Missing Items in Delivery'}
                  </option>
                  <option value="theft_damage">
                    {isUrdu ? 'چوری یا خراب شدہ سامان (بیمہ کلیم)' : 'Theft / Damaged Goods (Insurance Claim)'}
                  </option>
                  <option value="tax_discrepancy">
                    {isUrdu ? 'ایف بی آر ٹیکس یا بلنگ کا مسئلہ' : 'FBR GST / Tax Invoice Discrepancy'}
                  </option>
                  <option value="payment_issue">
                    {isUrdu ? 'ادائیگی یا فیس کا مسئلہ' : 'Payment / Settlement Issue'}
                  </option>
                  <option value="other">
                    {isUrdu ? 'دیگر تجارتی تنازعہ' : 'Other Commercial Issue'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 uppercase mb-1">
                  {isUrdu ? 'مکمل تفصیل' : 'Detailed Description'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder={
                    isUrdu
                      ? 'واقعے، مقدار اور انشورنس یا ترسیل کی تفصیل لکھیں...'
                      : 'Explain missing quantities, transit seal condition, or tax invoice discrepancy...'
                  }
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2 text-xs text-stone-700 hover:text-stone-950 font-bold cursor-pointer"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white border-2 border-red-900 rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  {isUrdu ? 'ایڈمن کو شکایت بھیجیں' : 'Submit Dispute to Admin'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
