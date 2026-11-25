/**
 * MUNAFA Admin Control Center
 * Accessible by staff admin with secret staff PIN
 * Unfreeze accounts with 1 button, fix account errors, automated freeze logs, AI agent logs, and broadcast announcements
 */

import React, { useState } from 'react';
import {
  UserAccount,
  AccountType,
  FreezeLogEntry,
  AgentLogEntry,
  OrderItem,
  MunafaBankDetails,
  DisputeReport,
  ChatMessage,
  SharedInboxConfig,
  ProductItem,
  ProductCategory,
} from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { PdfGenerator } from '../services/pdfGenerator';
import { useLanguage } from '../context/LanguageContext';
import {
  scanSystemConnectionsAndAssets,
  getBlockedThreats,
  clearBlockedThreats,
  SecurityScanReport,
  ThreatBlockEvent,
} from '../utils/security';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Send,
  Printer,
  Boxes,
  Bot,
  Megaphone,
  RefreshCw,
  Search,
  AlertTriangle,
  Play,
  Check,
  X,
  LogOut,
  Building2,
  Smartphone,
  CreditCard,
  Clock,
  KeyRound,
  ShieldCheck,
  Lock,
  Radar,
  AlertOctagon,
  Eye,
  Sliders,
  FileText,
  Download,
  MessageSquare,
} from 'lucide-react';

interface AdminPanelProps {
  onOpenChatWithAccount: (accountNumber: string) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onOpenChatWithAccount, onLogout }) => {
  const { t, isUrdu } = useLanguage();
  const [accounts, setAccounts] = useState<UserAccount[]>(() => LocalEdgeDb.getAccounts());
  const [freezeLogs, setFreezeLogs] = useState<FreezeLogEntry[]>(() => LocalEdgeDb.getFreezeLogs());
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>(() => LocalEdgeDb.getAgentLogs());
  const [orders, setOrders] = useState<OrderItem[]>(() => LocalEdgeDb.getOrders());
  const [disputes, setDisputes] = useState<DisputeReport[]>(() => LocalEdgeDb.getDisputes());
  const [messages, setMessages] = useState<ChatMessage[]>(() => LocalEdgeDb.getMessages());
  const [products, setProducts] = useState<ProductItem[]>(() => LocalEdgeDb.getProducts());
  const [bankDetails, setBankDetails] = useState<MunafaBankDetails>(() => LocalEdgeDb.getBankDetails());
  const [inboxConfig, setInboxConfig] = useState<SharedInboxConfig>(() => LocalEdgeDb.getSharedInboxConfig());
  const [bankSavedMsg, setBankSavedMsg] = useState(false);
  const [inboxConfigSaved, setInboxConfigSaved] = useState(false);

  // Dedicated Admin Login Gate inside Admin Control Center
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Credentials Change State
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');
  const [credStatus, setCredStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Fraud Sentinel State
  const [fraudData, setFraudData] = useState(() => LocalEdgeDb.runFraudScan());
  const [isScanningFraud, setIsScanningFraud] = useState(false);

  // Cyber-Shield Virus, Malware & Connected Resources Scanner State
  const [shieldScanReport, setShieldScanReport] = useState<SecurityScanReport>(() =>
    scanSystemConnectionsAndAssets({
      accounts: LocalEdgeDb.getAccounts(),
      products: LocalEdgeDb.getProducts(),
      messages: LocalEdgeDb.getMessages(),
    })
  );
  const [blockedThreats, setBlockedThreats] = useState<ThreatBlockEvent[]>(() => getBlockedThreats());
  const [isScanningShield, setIsScanningShield] = useState(false);

  const [activeTab, setActiveTab] = useState<
    | 'directory'
    | 'ads_manager'
    | 'ledger'
    | 'messages_config'
    | 'disputes'
    | 'bank_accounts'
    | 'fraud_sentinel'
    | 'admin_security'
    | 'freeze_log'
    | 'agent_log'
    | 'broadcast'
    | 'engine'
  >('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [adCategoryFilter, setAdCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [deleteConfirmAd, setDeleteConfirmAd] = useState<ProductItem | null>(null);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [adminReplyDrafts, setAdminReplyDrafts] = useState<Record<string, string>>({});

  // Inline notices and modal confirmation states (zero window.alert/prompt/confirm)
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [freezeTargetAcc, setFreezeTargetAcc] = useState<string | null>(null);
  const [freezeReasonInput, setFreezeReasonInput] = useState('Pending verification or audit');
  const [deleteConfirmAcc, setDeleteConfirmAcc] = useState<string | null>(null);
  const [deletionPolicyModalAcc, setDeletionPolicyModalAcc] = useState<UserAccount | null>(null);
  const [paymentReceiptModal, setPaymentReceiptModal] = useState<{
    accountNumber: string;
    name: string;
    refNumber: string;
    receiptUrl?: string;
    feePkr: number;
  } | null>(null);
  const [disputeNoteDrafts, setDisputeNoteDrafts] = useState<Record<string, string>>({});

  // Account editing modal
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  // Broadcast notice form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | AccountType>('all');
  const [broadcastSentCount, setBroadcastSentCount] = useState<number | null>(null);

  // Automated engine simulation feedback
  const [engineReport, setEngineReport] = useState<string | null>(null);

  React.useEffect(() => {
    const unsub = LocalEdgeDb.subscribe(() => {
      setAccounts(LocalEdgeDb.getAccounts());
      setFreezeLogs(LocalEdgeDb.getFreezeLogs());
      setAgentLogs(LocalEdgeDb.getAgentLogs());
      setOrders(LocalEdgeDb.getOrders());
      setDisputes(LocalEdgeDb.getDisputes());
      setMessages(LocalEdgeDb.getMessages());
      setProducts(LocalEdgeDb.getProducts());
      setBankDetails(LocalEdgeDb.getBankDetails());
      setInboxConfig(LocalEdgeDb.getSharedInboxConfig());
    });
    return unsub;
  }, []);

  const filteredAccounts = accounts.filter((a) => {
    if (a.isDeleted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.accountNumber.includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.cnic.includes(q) ||
        a.accountType.includes(q)
      );
    }
    return true;
  });

  // Action: Activate / Reactivate Account after verifying JazzCash or Bank payment
  const handleUnfreeze = (accountNumber: string) => {
    LocalEdgeDb.activateAccount(accountNumber);
    setAdminNotice(`Payment verified & Account #${accountNumber} activated successfully.`);
  };

  // Action: Deactivate Account manually (via inline modal)
  const handleManualFreeze = (accountNumber: string) => {
    setFreezeTargetAcc(accountNumber);
    setFreezeReasonInput('Deactivated by Admin after payment / compliance review');
  };

  const confirmManualFreeze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeTargetAcc || !freezeReasonInput.trim()) return;
    LocalEdgeDb.deactivateAccount(freezeTargetAcc, freezeReasonInput.trim());
    setAdminNotice(`Account #${freezeTargetAcc} deactivated.`);
    setFreezeTargetAcc(null);
  };

  // Action: 5-Year Inactive Warning
  const handleSend5YearWarning = (accountNumber: string) => {
    LocalEdgeDb.send5YearInactiveWarning(accountNumber);
    setAdminNotice(`Inactivity warning notice dispatched to Account #${accountNumber} Inbox.`);
  };

  // Action: Admin 1-Click Delete Account (non-admin only)
  const handleDeleteAccount = (acc: UserAccount) => {
    if (acc.accountType === 'admin') return;
    setDeleteConfirmAcc(acc.accountNumber);
  };

  const confirmDeleteAccount = () => {
    if (!deleteConfirmAcc) return;
    const res = LocalEdgeDb.adminDeleteAccount(deleteConfirmAcc);
    setAdminNotice(res.message);
    setDeleteConfirmAcc(null);
  };

  const confirmRemoveAd = () => {
    if (!deleteConfirmAd) return;
    const res = LocalEdgeDb.deleteProduct(deleteConfirmAd.id, true);
    setAdminNotice(res.message);
    setDeleteConfirmAd(null);
  };

  // Save edited account details
  const handleSaveAccountEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      LocalEdgeDb.saveAccount(editingAccount);
      LocalEdgeDb.runSelfHealingAudit();
      setAdminNotice(`Updated and validated registration details for Account #${editingAccount.accountNumber}.`);
      setEditingAccount(null);
    } catch (err: unknown) {
      setAdminNotice(err instanceof Error ? err.message : 'Security Shield blocked unsafe account edit.');
    }
  };

  // Send Broadcast Notice to all or targeted inboxes
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    try {
      const res = LocalEdgeDb.sendNoticeToUsers(broadcastTarget, broadcastTitle, broadcastBody);
      setBroadcastSentCount(res.recipientCount);
      setAdminNotice(`Notice delivered to ${res.recipientCount} registered user inbox(es).`);
      setBroadcastTitle('');
      setBroadcastBody('');
      setTimeout(() => setBroadcastSentCount(null), 5000);
    } catch (err: unknown) {
      setAdminNotice(err instanceof Error ? err.message : 'Security Shield blocked unsafe broadcast notice.');
    }
  };

  // Inline Admin reply to a user message/thread
  const handleAdminInlineReply = (msg: ChatMessage) => {
    const draft = (adminReplyDrafts[msg.threadId] || '').trim();
    if (!draft) return;
    let recipient =
      msg.senderAccountNumber !== 'admin' &&
      msg.senderAccountNumber !== 'system' &&
      msg.senderAccountNumber !== '00000000'
        ? msg.senderAccountNumber
        : msg.recipientAccountNumber !== 'admin' &&
          msg.recipientAccountNumber !== 'system' &&
          msg.recipientAccountNumber !== 'all'
        ? msg.recipientAccountNumber
        : '';

    if (!recipient && msg.threadId.startsWith('th_')) {
      const candidate = msg.threadId
        .slice(3)
        .split('_')
        .find((seg) => seg && seg !== 'system' && seg !== 'agent' && seg !== 'admin' && seg !== 'escalations' && seg !== 'all');
      if (candidate) recipient = candidate;
    }

    if (!recipient) {
      setAdminNotice('Cannot send reply: no specific user account found for this thread.');
      return;
    }

    LocalEdgeDb.sendMessage({
      threadId: msg.threadId,
      senderAccountNumber: 'admin',
      senderName: 'Munafa Admin HQ',
      recipientAccountNumber: recipient,
      type: 'text',
      content: draft,
      orderId: msg.orderId,
    });
    setAdminReplyDrafts((prev) => ({ ...prev, [msg.threadId]: '' }));
    setAdminNotice(`Admin reply sent directly to Account #${recipient} (${msg.threadId}).`);
  };

  // Trigger Daily Automated Check
  const handleRunDailyCheck = () => {
    const res = LocalEdgeDb.runDailySubscriptionAutomation();
    const audit = LocalEdgeDb.runSelfHealingAudit();
    setEngineReport(
      `Daily Automation Run Complete: ${res.frozenCount} overdue accounts blocked/frozen, ${res.remindersSent} reminders dispatched to inboxes, ${audit.repairedItemsCount} integrity corrections verified.`
    );
  };

  // Simulate Overdue Scenario on an active account
  const handleSimulateOverdue = (acc: UserAccount) => {
    const updated = { ...acc };
    const pastDue = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
    updated.subscription.dueDate = pastDue;
    updated.subscription.status = 'active'; // force active so engine blocks it
    LocalEdgeDb.saveAccount(updated);
    LocalEdgeDb.runDailySubscriptionAutomation();
    setAdminNotice(`Simulated overdue for ${acc.name}. The daily engine has automatically blocked the account.`);
  };

  const handlePrintAccountStatement = (acc: UserAccount) => {
    const accOrders = LocalEdgeDb.getOrdersForAccount(acc.accountNumber);
    const html = PdfGenerator.generateStatementHtml(acc, accOrders, '2026-01-01', '2026-12-31');
    PdfGenerator.printDocument(html);
  };

  const handlePrintOrderInvoice = (ord: OrderItem) => {
    const seller =
      accounts.find((a) => a.accountNumber === ord.sellerAccountNumber) || currentAdminAccount;
    const buyer =
      accounts.find((a) => a.accountNumber === ord.buyerAccountNumber) || currentAdminAccount;
    const html = PdfGenerator.generateInvoiceHtml(ord, seller, buyer);
    PdfGenerator.printDocument(html);
  };

  const handleDownloadOrderInvoice = (ord: OrderItem) => {
    const seller =
      accounts.find((a) => a.accountNumber === ord.sellerAccountNumber) || currentAdminAccount;
    const buyer =
      accounts.find((a) => a.accountNumber === ord.buyerAccountNumber) || currentAdminAccount;
    const html = PdfGenerator.generateInvoiceHtml(ord, seller, buyer);
    PdfGenerator.downloadFile(html, `Munafa_Invoice_${ord.orderNumber}.html`);
  };

  // Dedicated Admin Login Handler (with Anti-Brute-Force Rate Limiter)
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = LocalEdgeDb.verifyAdminLoginDetailed(loginUsername, loginPin);
    if (result.success) {
      setIsAdminLoggedIn(true);
      setLoginError('');
      setBlockedThreats(getBlockedThreats());
    } else {
      setLoginError(
        result.error ||
          (isUrdu
            ? 'غلط ایڈمن معلومات۔ برائے مہربانی ایڈمن یوزر نیم اور 4 ہندسوں کا درست پن درج کریں۔'
            : 'Invalid Admin credentials. Check your Admin Username and 4-digit PIN.')
      );
      setBlockedThreats(getBlockedThreats());
    }
  };

  // Admin Credentials Update Handler
  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredStatus(null);
    if (!newAdminUsername.trim()) {
      setCredStatus({
        type: 'error',
        message: isUrdu ? 'ایڈمن یوزر نیم خالی نہیں ہو سکتا۔' : 'Admin username cannot be blank.',
      });
      return;
    }
    if (newAdminPin.trim().length !== 4 || !/^\d{4}$/.test(newAdminPin.trim())) {
      setCredStatus({
        type: 'error',
        message: isUrdu
          ? 'ایڈمن پن لازمی 4 ہندسوں پر مشتمل ہونا چاہیے۔'
          : 'Admin PIN must be exactly 4 numeric digits.',
      });
      return;
    }
    if (newAdminPin !== confirmAdminPin) {
      setCredStatus({
        type: 'error',
        message: isUrdu ? 'تصدیقی پن مماثلت نہیں رکھتا۔' : 'PIN confirmation does not match.',
      });
      return;
    }
    const res = LocalEdgeDb.updateAdminCredentials(newAdminUsername, newAdminPin);
    if (res.success) {
      setCredStatus({ type: 'success', message: res.message });
      setNewAdminUsername('');
      setNewAdminPin('');
      setConfirmAdminPin('');
    } else {
      setCredStatus({ type: 'error', message: res.message });
    }
  };

  // Trigger Live AI Fraud Deep Scan
  const handleTriggerDeepScan = () => {
    setIsScanningFraud(true);
    setTimeout(() => {
      const res = LocalEdgeDb.runFraudScan();
      setFraudData(res);
      setIsScanningFraud(false);
    }, 600);
  };

  // Trigger Automatic Virus, Malware & Connected Resources Deep Scan
  const handleRunCyberShieldScan = () => {
    setIsScanningShield(true);
    setTimeout(() => {
      const report = scanSystemConnectionsAndAssets({
        accounts: LocalEdgeDb.getAccounts(),
        products: LocalEdgeDb.getProducts(),
        messages: LocalEdgeDb.getMessages(),
      });
      setShieldScanReport(report);
      setBlockedThreats(getBlockedThreats());
      setIsScanningShield(false);
    }, 350);
  };

  // --- RENDER DEDICATED ADMIN LOGIN GATE IF NOT AUTHENTICATED ---
  if (!isAdminLoggedIn) {
    const currentAdmin = LocalEdgeDb.getAdminAccount();
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white border-2 border-[#046c31] rounded-2xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="munafa-bg-header bg-[#034720] text-white px-6 py-6 text-center border-b-2 border-[#d4af37]">
            <div className="w-40 h-20 mx-auto mb-3 bg-white border-2 border-[#facc15] rounded-2xl px-2 py-1 flex items-center justify-center shadow-md">
              <img
                src="/assets/aistudio/image_65c6c502.png"
                alt="MUNAFA"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-[11px] uppercase tracking-widest text-[#fef08a] font-black mb-1 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#fef08a]" />
              <span>{isUrdu ? 'منافع سینٹرل آپریشنز ہیڈ کوارٹر' : 'MUNAFA CENTRAL OPERATIONS HQ'}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isUrdu ? 'ایڈمن لاگ ان کنٹرول' : 'Admin Security Gate'}
            </h2>
            <p className="text-xs text-emerald-100 font-bold mt-1.5 leading-relaxed">
              {isUrdu
                ? 'مخصوص ایڈمن کنٹرول پینل۔ جاری رکھنے کے لیے اپنا ایڈمن یوزر نیم اور 4 ہندسوں کا پن درج کریں۔'
                : 'Restricted administrative access. Please authenticate using authorized staff credentials.'}
            </p>
          </div>

          <div className="p-6 sm:p-8">

          {/* Error Message */}
          {loginError && (
            <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-600 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-xs text-red-950 font-black leading-snug">{loginError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-stone-950 uppercase tracking-wide mb-1.5">
                {isUrdu ? 'ایڈمن یوزر نیم' : 'Admin Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-800 rounded-xl text-sm font-black text-stone-950 focus:outline-hidden focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-stone-950 uppercase tracking-wide">
                  {isUrdu ? '4 ہندسوں کا سیکیورٹی پن' : '4-Digit Staff Security PIN'}
                </label>
                <span className="text-[10px] text-stone-700 font-bold">
                  {isUrdu ? 'محفوظ تصدیق' : 'Secured Verification'}
                </span>
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-800 rounded-xl text-center text-lg font-mono font-black tracking-widest text-stone-950 focus:outline-hidden focus:border-emerald-700"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 munafa-green-btn font-black text-sm rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#fef08a]" />
              <span>{isUrdu ? 'لاگ ان کریں اور کنٹرول کھولیں' : 'Authenticate & Unlock HQ'}</span>
            </button>
          </form>

          {/* Security Notice (No PIN exposure or bypass buttons) */}
          <div className="mt-5 pt-4 border-t-2 border-emerald-100">
            <p className="text-[11px] text-[#052e16] text-center font-bold">
              {isUrdu
                ? 'لاگ ان کے بعد آپ سیکیورٹی ٹیب سے ایڈمن یوزر نیم اور پن تبدیل کر سکتے ہیں۔'
                : 'Authorized MUNAFA HQ staff only. Credentials can be rotated inside Security Settings.'}
            </p>
          </div>
          </div>
        </div>
      </div>
    );
  }

  const currentAdminAccount = LocalEdgeDb.getAdminAccount();

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6">
      {/* Admin Title & Summary */}
      <div className="munafa-bg-header bg-[#034720] text-white border-2 border-[#d4af37] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-36 h-[72px] shrink-0 rounded-xl bg-white border-2 border-[#facc15] px-2 py-1 items-center justify-center shadow-md">
            <img
              src="/assets/aistudio/image_65c6c502.png"
              alt="MUNAFA"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#fef08a] font-extrabold mb-1">
              Munafa Central Operations HQ · Staff Panel
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Admin Command Center</h1>
            <p className="text-xs text-emerald-100 font-semibold mt-1">
              Universal controls for user accounts, 1-click unfreeze verifications, automated subscription runners, and 24/7 AI agent takeover.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-[#023819] border-2 border-[#facc15] rounded-xl text-[11px] font-black text-[#fef08a] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#facc15]" />
            <span>
              {isUrdu ? `ایڈمن کلیرنس: ${currentAdminAccount.accountNumber}` : `Admin Clearance: ${currentAdminAccount.accountNumber}`}
            </span>
          </div>

          <button
            onClick={handleRunDailyCheck}
            className="py-2 px-3.5 munafa-gold-btn rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-[#023819]" />
            <span>Run Daily Engine</span>
          </button>

          <button
            onClick={() => setIsAdminLoggedIn(false)}
            className="py-2 px-3 bg-[#023819] hover:bg-[#077a38] text-[#fef08a] border border-[#facc15]/70 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Lock administrative panel"
          >
            <Lock className="w-3.5 h-3.5 text-[#facc15]" />
            <span>{isUrdu ? 'پینل لاک کریں' : 'Lock HQ'}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="py-2 px-3 bg-[#023819] hover:bg-red-700 text-white border border-red-400/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Log out of staff session"
            >
              <LogOut className="w-3.5 h-3.5 text-red-200" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {adminNotice && (
        <div className="p-3 bg-white border-2 border-emerald-700 text-emerald-950 text-xs font-extrabold rounded-xl flex items-center justify-between shadow-xs">
          <span>{adminNotice}</span>
          <button
            type="button"
            onClick={() => setAdminNotice(null)}
            className="text-emerald-800 font-black cursor-pointer hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {engineReport && (
        <div className="p-3 bg-white border-2 border-emerald-600 text-emerald-950 text-xs font-bold rounded-xl flex items-center justify-between shadow-xs">
          <span>{engineReport}</span>
          <button onClick={() => setEngineReport(null)} className="text-emerald-800 font-extrabold cursor-pointer hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-0 border-b-2 border-[#046c31]">
        {[
          { id: 'directory', label: isUrdu ? `اکاؤنٹس ڈائرکٹری (${accounts.filter((a) => !a.isDeleted).length})` : `Accounts (${accounts.filter((a) => !a.isDeleted).length})` },
          { id: 'ads_manager', label: isUrdu ? `اشتہارات ہٹائیں / مینج کریں (${products.length})` : `Product Ads (${products.length})` },
          { id: 'ledger', label: isUrdu ? `انوائسز، اسٹیٹمنٹس و سبسکرپشن (${orders.length})` : `Invoices, Statements & Subscriptions` },
          { id: 'messages_config', label: isUrdu ? `تمام پیغامات و اِن باکس سیٹنگز (${messages.length})` : `All Messages & Shared Inbox Config` },
          {
            id: 'disputes',
            label: isUrdu
              ? `تنازعات و شکایات (${disputes.filter((d) => d.status !== 'resolved').length})`
              : `Disputes (${disputes.filter((d) => d.status !== 'resolved').length})`,
          },
          { id: 'bank_accounts', label: isUrdu ? 'جاز کیش، بینک و ادائیگی کی تصدیق' : 'JazzCash, Bank & Payment Activations' },
          {
            id: 'fraud_sentinel',
            label: isUrdu
              ? `اے آئی فراڈ سینٹینل (${fraudData.alerts.filter((a) => a.status === 'active').length})`
              : `AI Fraud Sentinel (${fraudData.alerts.filter((a) => a.status === 'active').length})`,
          },
          { id: 'admin_security', label: isUrdu ? 'سیکیورٹی و پن ترتیبات' : 'Security & PIN Settings' },
          { id: 'freeze_log', label: isUrdu ? `منجمد ریکارڈ (${freezeLogs.length})` : `Freeze & Auto Log (${freezeLogs.length})` },
          { id: 'agent_log', label: isUrdu ? `24/7 اے آئی ایجنٹ لاگ (${agentLogs.length})` : `AI Conversations (${agentLogs.length})` },
          { id: 'broadcast', label: isUrdu ? 'سرکاری نوٹس براڈکاسٹ' : 'Broadcast Notice' },
          { id: 'engine', label: isUrdu ? 'خودکار انجن و سمیلیٹر' : 'Automation Engine' },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id as any)}
            className={`py-2.5 px-4 rounded-t-xl font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === tabItem.id
                ? 'bg-[#034720] text-[#fef08a] border-2 border-b-0 border-[#d4af37] font-extrabold shadow-xs'
                : 'bg-[#eef7f1] border-2 border-b-0 border-emerald-200 text-[#023819] hover:bg-[#dcfce7] font-bold'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ACCOUNTS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-600 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account by 8 digits, name, CNIC, or email..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>
          </div>

          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Account #</th>
                  <th className="p-3">Name & Address</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">CNIC & NTN</th>
                  <th className="p-3">Subscription</th>
                  <th className="p-3">Payment Ref</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredAccounts.map((acc) => {
                  const isFrozen = acc.subscription?.status === 'frozen';
                  const pendingRef = acc.subscription?.pendingPaymentRef;
                  const deletionCheck = LocalEdgeDb.getDeletionEligibility(acc);

                  return (
                    <tr key={acc.accountNumber} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3 font-mono font-extrabold text-stone-950">
                        {acc.accountNumber}
                        <div className="text-[10px] text-stone-500 font-bold">
                          {acc.accountType === 'admin' ? 'Staff HQ' : `PIN: ${acc.pin}`}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-stone-950">{acc.name}</div>
                        <div className="text-[11px] text-stone-600 font-medium truncate max-w-xs">{acc.address}</div>
                        <div className="text-[10px] text-stone-500 font-bold">{acc.phone} · {acc.email}</div>
                        {acc.accountType !== 'admin' && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {deletionCheck.eligible ? (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-400 text-[9px] font-black uppercase">
                                Eligible to Delete (5+ Yrs + Warned)
                              </span>
                            ) : deletionCheck.hasWarning ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-400 text-[9px] font-bold">
                                Warning Sent ({deletionCheck.inactiveYears}y inactive)
                              </span>
                            ) : deletionCheck.hasFiveYearsInactivity ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-400 text-[9px] font-bold">
                                {deletionCheck.inactiveYears}y Inactive (Needs Warning)
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-extrabold text-stone-800 capitalize">
                        {acc.accountType.replace('_', ' ')}
                      </td>
                      <td className="p-3 font-mono text-[11px] font-bold text-stone-800">
                        <div>CNIC: {acc.cnic}</div>
                        <div className="text-stone-500">NTN: {acc.ntn || 'None'}</div>
                      </td>
                      <td className="p-3">
                        {acc.accountType === 'admin' ? (
                          <span className="text-stone-600 font-bold text-[11px]">Staff HQ</span>
                        ) : (
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border-2 ${
                                isFrozen
                                  ? pendingRef?.status === 'pending'
                                    ? 'bg-amber-50 text-amber-900 border-amber-500'
                                    : 'bg-white text-red-700 border-red-500'
                                  : 'bg-white text-emerald-800 border-emerald-600'
                              }`}
                            >
                              {isFrozen
                                ? pendingRef?.status === 'pending'
                                  ? 'Pending Activation'
                                  : 'Deactivated'
                                : acc.accountType === 'customer'
                                ? 'Active (Free)'
                                : 'Active'}
                            </span>
                            {acc.accountType !== 'customer' && (
                              <div className="text-[10px] text-stone-600 font-bold mt-1 font-mono">
                                Due: {acc.subscription.dueDate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {pendingRef ? (
                          <div className="bg-white border-2 border-amber-400 p-2 rounded-xl text-[11px] space-y-1">
                            <span className="font-extrabold font-mono text-amber-950 block truncate">
                              Ref: {pendingRef.refNumber}
                            </span>
                            <span className="text-[10px] text-amber-800 font-bold block">
                              Status: {pendingRef.status}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentReceiptModal({
                                  accountNumber: acc.accountNumber,
                                  name: acc.name,
                                  refNumber: pendingRef.refNumber,
                                  receiptUrl: pendingRef.receiptUrl,
                                  feePkr: acc.subscription.feePkr,
                                })
                              }
                              className="text-[10px] font-black text-[#034720] underline cursor-pointer"
                            >
                              Inspect Payment Slip
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-600 font-bold text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap font-bold">
                        {/* 1-Click Activate / Deactivate / Delete Buttons */}
                        {(isFrozen || pendingRef?.status === 'pending') && acc.accountType !== 'admin' && (
                          <button
                            onClick={() => handleUnfreeze(acc.accountNumber)}
                            className="py-1 px-3 munafa-green-btn rounded-lg font-extrabold text-[11px] transition-colors cursor-pointer shadow-xs"
                            title="Verify payment received and activate account immediately"
                          >
                            Activate Account
                          </button>
                        )}

                        {!isFrozen && acc.accountType !== 'admin' && (
                          <button
                            onClick={() => handleManualFreeze(acc.accountNumber)}
                            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-500 rounded-lg text-[11px] font-extrabold cursor-pointer"
                            title="Deactivate account"
                          >
                            Deactivate
                          </button>
                        )}

                        <button
                          onClick={() => setEditingAccount(acc)}
                          className="p-1.5 bg-[#f2fbf5] hover:bg-[#dcfce7] border-2 border-emerald-300 text-[#023819] rounded-lg cursor-pointer"
                          title="Correct account information and fix errors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrintAccountStatement(acc)}
                          className="p-1.5 bg-[#f2fbf5] hover:bg-[#dcfce7] border-2 border-emerald-300 text-[#023819] rounded-lg cursor-pointer"
                          title="View & Download PDF Statement"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenChatWithAccount(acc.accountNumber)}
                          className="p-1.5 bg-[#eef7f1] hover:bg-[#dcfce7] border-2 border-[#046c31] text-[#034720] rounded-lg cursor-pointer"
                          title="Open inbox chat with this account"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {acc.accountType !== 'admin' && (
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            className="py-1 px-2.5 bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PRODUCT ADS MANAGER (REMOVE ANY AD FROM ALL PANELS) */}
      {activeTab === 'ads_manager' && (() => {
        const filteredAds = products.filter((p) => {
          if (adCategoryFilter !== 'all' && p.category !== adCategoryFilter) return false;
          if (adSearchQuery.trim()) {
            const q = adSearchQuery.toLowerCase();
            return (
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q) ||
              p.sellerName.toLowerCase().includes(q) ||
              p.sellerAccountNumber.toLowerCase().includes(q) ||
              p.city.toLowerCase().includes(q)
            );
          }
          return true;
        });

        const getPanelLabel = (cat: ProductCategory) => {
          if (cat === 'farm_mining') return 'Farmers & Mining';
          if (cat === 'factory') return 'Factories';
          return 'Wholesalers';
        };

        return (
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#046c31]" />
                  <span>{isUrdu ? 'پروڈکٹ اشتہارات کا انتظام (ایڈ ہٹائیں)' : 'Marketplace Product Ads Manager'}</span>
                </h2>
                <p className="text-xs text-[#045c29] font-semibold">
                  {isUrdu
                    ? 'مرکزی صفحہ، کسان، فیکٹری اور ہول سیل پینلز سے کوئی بھی اشتہار فوری ہٹائیں۔'
                    : 'Inspect all posted product ads across Main Page, Farmers & Mining, Factories, and Wholesalers panels and remove any ad in one click.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#046c31] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={isUrdu ? 'اشتہار، بیچنے والا یا شہر تلاش کریں...' : 'Search ad title, seller, ID, city...'}
                    value={adSearchQuery}
                    onChange={(e) => setAdSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-emerald-700/35 rounded-xl text-xs font-bold text-[#023819] outline-none focus:border-[#046c31]"
                  />
                </div>
                <span className="font-mono text-[#fef08a] bg-[#034720] border border-[#d4af37] px-3 py-1.5 rounded-xl text-xs font-extrabold">
                  {filteredAds.length} / {products.length} Ads
                </span>
              </div>
            </div>

            <div className="px-4 py-3 bg-[#f7fcf9] border-b border-emerald-200 flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: isUrdu ? 'تمام پینلز' : 'All Panels' },
                  { id: 'farm_mining', label: isUrdu ? 'کسان اور کان کنی' : 'Farmers & Mining' },
                  { id: 'factory', label: isUrdu ? 'فیکٹریاں' : 'Factories' },
                  { id: 'wholesale', label: isUrdu ? 'ہول سیلرز' : 'Wholesalers' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setAdCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 transition cursor-pointer ${
                    adCategoryFilter === cat.id
                      ? 'bg-[#034720] text-[#fef08a] border-[#d4af37]'
                      : 'bg-white text-[#023819] border-emerald-300 hover:bg-[#eef7f1]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px]">
                    <th className="p-3">Ad / Product</th>
                    <th className="p-3">Marketplace Panel & City</th>
                    <th className="p-3">Seller & Account</th>
                    <th className="p-3">Price, Tax & Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-600 font-bold">
                        {isUrdu ? 'کوئی اشتہار نہیں ملا۔' : 'No product ads match your current search or panel filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((p) => {
                      const sellerAcc = accounts.find((a) => a.accountNumber === p.sellerAccountNumber);
                      const isLive = p.isActive && (!sellerAcc || (sellerAcc.subscription.status === 'active' && !sellerAcc.isDeleted));
                      return (
                        <tr key={p.id} className="hover:bg-[#f2fbf5] transition">
                          <td className="p-3 max-w-[280px]">
                            <div className="flex items-start gap-2.5">
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-300 shrink-0 bg-stone-100"
                              />
                              <div className="min-w-0">
                                <div className="font-extrabold text-[#023819] truncate">{p.title}</div>
                                <div className="text-[11px] text-stone-700 font-medium line-clamp-2">{p.description}</div>
                                <div className="text-[10px] font-mono font-bold text-[#046c31] mt-0.5">{p.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 bg-[#eef7f1] border border-emerald-400 text-[#023819] rounded-md text-[10px] font-extrabold uppercase">
                              {getPanelLabel(p.category)}
                            </span>
                            <div className="text-[11px] text-stone-700 font-bold mt-1">{p.city}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-[#023819]">{p.sellerName}</div>
                            <div className="text-[10px] font-mono font-bold text-[#046c31]">Acc #{p.sellerAccountNumber}</div>
                            {p.sellerPhone && (
                              <div className="text-[10px] text-stone-700 font-semibold">{p.sellerPhone}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-[#023819]">
                              PKR {p.pricePerUnit.toLocaleString()} / {p.unit}
                            </div>
                            <div className="text-[10px] text-stone-700 font-bold">
                              GST {p.taxRatePercent}% (PKR {p.taxAmountPkr.toLocaleString()})
                            </div>
                            <div className="text-[10px] text-[#046c31] font-extrabold">
                              Stock: {p.quantityAvailable.toLocaleString()} {p.unit}
                            </div>
                          </td>
                          <td className="p-3">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-md text-[10px] font-extrabold">
                                <CheckCircle className="w-3 h-3" />
                                Live on Panels
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-900 border border-amber-400 rounded-md text-[10px] font-extrabold">
                                <AlertTriangle className="w-3 h-3" />
                                Hidden
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmAd(p)}
                              className="py-1.5 px-3 bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Remove this ad from Main Page and all Marketplace Panels"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isUrdu ? 'اشتہار ہٹائیں' : 'Remove Ad'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB: INVOICES, STATEMENTS & SUBSCRIPTION RECORDS */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Subscription Records & Payment Reactivation */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#046c31]" />
                  <span>{isUrdu ? 'کاروباری سبسکرپشن ریکارڈز اور ادائیگی کی تصدیق' : 'Subscription Records & Payment Verification'}</span>
                </h2>
                <p className="text-xs text-[#045c29] font-semibold">
                  Review submitted subscription payments, inspect receipt slips, and verify/reactivate accounts in one click.
                </p>
              </div>
              <span className="font-mono text-[#fef08a] bg-[#034720] border border-[#d4af37] px-3 py-1 rounded-xl text-xs font-extrabold">
                Business Accounts: {accounts.filter((a) => !a.isDeleted && a.accountType !== 'customer' && a.accountType !== 'admin').length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px]">
                    <th className="p-3">Business & Account #</th>
                    <th className="p-3">Plan & Fee</th>
                    <th className="p-3">Due / Last Paid</th>
                    <th className="p-3">Submitted Ref & Receipt</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Verify & Reactivate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {accounts
                    .filter((a) => !a.isDeleted && a.accountType !== 'customer' && a.accountType !== 'admin')
                    .map((acc) => {
                      const pRef = acc.subscription.pendingPaymentRef;
                      return (
                        <tr key={acc.accountNumber} className="hover:bg-stone-50">
                          <td className="p-3">
                            <div className="font-extrabold text-stone-950">{acc.name}</div>
                            <div className="text-[10px] font-mono font-bold text-stone-600">
                              Acc #{acc.accountNumber} · {acc.accountType.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-extrabold text-[#023819]">
                            PKR {acc.subscription.feePkr.toLocaleString()} / {acc.subscription.cycle}
                          </td>
                          <td className="p-3 font-mono text-[11px] font-bold text-stone-700">
                            <div>Due: {acc.subscription.dueDate}</div>
                            <div className="text-stone-500">Last Paid: {acc.subscription.lastPaidAt || 'Not recorded'}</div>
                          </td>
                          <td className="p-3">
                            {pRef ? (
                              <div className="space-y-1">
                                <span className="font-mono font-extrabold text-amber-950 block">
                                  Ref #{pRef.refNumber} ({pRef.status})
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPaymentReceiptModal({
                                      accountNumber: acc.accountNumber,
                                      name: acc.name,
                                      refNumber: pRef.refNumber,
                                      receiptUrl: pRef.receiptUrl,
                                      feePkr: acc.subscription.feePkr,
                                    })
                                  }
                                  className="text-[11px] font-black text-[#046c31] underline cursor-pointer"
                                >
                                  View Submitted Slip
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-600 font-bold">No pending ref</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border-2 ${
                                acc.subscription.status === 'frozen'
                                  ? 'bg-red-50 text-red-800 border-red-500'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-600'
                              }`}
                            >
                              {acc.subscription.status}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            {(acc.subscription.status === 'frozen' || pRef?.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => handleUnfreeze(acc.accountNumber)}
                                className="py-1.5 px-3 munafa-green-btn rounded-xl text-[11px] font-black cursor-pointer shadow-xs"
                              >
                                Activate Account
                              </button>
                            )}
                            {acc.subscription.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleManualFreeze(acc.accountNumber)}
                                className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-500 text-amber-950 rounded-xl text-[11px] font-black cursor-pointer"
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
                              className="py-1.5 px-2.5 bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white rounded-xl text-[11px] font-black cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintAccountStatement(acc)}
                              className="py-1.5 px-3 bg-[#eef7f1] hover:bg-[#dcfce7] border-2 border-[#046c31] text-[#023819] rounded-xl text-[11px] font-black cursor-pointer"
                            >
                              Statement
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Commercial Invoices Ledger */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#046c31]" />
                  <span>{isUrdu ? 'تمام آرڈر انوائسز اور ٹیکس ریکارڈ' : 'Official FBR Commercial Invoices & Order Records'}</span>
                </h2>
                <p className="text-xs text-[#045c29] font-semibold">
                  Inspect, print, or download any marketplace commercial invoice and GST breakdown.
                </p>
              </div>
              <span className="font-mono text-[#fef08a] bg-[#034720] border border-[#d4af37] px-3 py-1 rounded-xl text-xs font-extrabold">
                {orders.length} Orders Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px]">
                    <th className="p-3">Order #</th>
                    <th className="p-3">Buyer → Seller</th>
                    <th className="p-3">Product & Qty</th>
                    <th className="p-3">GST & Total</th>
                    <th className="p-3">Order & Fee Status</th>
                    <th className="p-3 text-right">Invoice & Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-black text-stone-950">
                        {ord.orderNumber}
                        <div className="text-[10px] text-stone-500 font-bold">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900">Buyer: {ord.buyerName} (#{ord.buyerAccountNumber})</div>
                        <div className="font-bold text-[#046c31]">Seller: {ord.sellerName} (#{ord.sellerAccountNumber})</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{ord.productTitle}</div>
                        <div className="text-[10px] text-stone-600 font-mono">
                          {ord.quantity} {ord.unit} · {ord.fulfilmentType.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-black text-[#023819]">PKR {ord.grandTotal.toLocaleString()}</div>
                        <div className="text-[10px] text-stone-600 font-bold">GST: PKR {ord.gstAmount.toLocaleString()}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-400 text-emerald-900 text-[10px] font-black uppercase block w-fit mb-1">
                          {ord.status}
                        </span>
                        <span className="text-[10px] font-bold text-stone-600">
                          Fee: {ord.munafaFeeStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintOrderInvoice(ord)}
                          className="py-1 px-2.5 munafa-green-btn rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadOrderInvoice(ord)}
                          className="py-1 px-2.5 bg-[#eef7f1] hover:bg-[#dcfce7] border-2 border-[#046c31] text-[#023819] rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Account Statements Generator */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-[#023819]">Print Account Statements (All Registered Users)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts
                .filter((a) => !a.isDeleted && a.accountType !== 'admin')
                .map((acc) => (
                  <div
                    key={acc.accountNumber}
                    className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-black text-[#023819] truncate">{acc.name}</div>
                      <div className="text-[10px] font-mono font-bold text-stone-600">
                        Acc #{acc.accountNumber} · {acc.accountType.replace('_', ' ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrintAccountStatement(acc)}
                      className="shrink-0 py-1.5 px-2.5 munafa-green-btn rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Statement</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ALL MESSAGES & SHARED INBOX CONFIGURATIONS */}
      {activeTab === 'messages_config' && (
        <div className="space-y-6">
          {/* Shared Inbox Configurations */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#046c31]" />
                  <span>{isUrdu ? 'مشترکہ اِن باکس کی ترتیبات' : 'Shared Inbox Configurations'}</span>
                </h2>
                <p className="text-xs text-[#045c29] font-semibold">
                  Control platform-wide Shared Inbox features: 24/7 AI Concierge, audio/video calling, file transfers, and official banners.
                </p>
              </div>
              {inboxConfigSaved && (
                <span className="px-3 py-1 bg-[#034720] text-[#fef08a] border border-[#d4af37] rounded-xl text-xs font-black">
                  Shared Inbox Config Saved!
                </span>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  LocalEdgeDb.saveSharedInboxConfig(inboxConfig);
                  setInboxConfigSaved(true);
                  setAdminNotice('Shared Inbox configurations updated across all devices.');
                  setTimeout(() => setInboxConfigSaved(false), 3000);
                } catch (err: unknown) {
                  setAdminNotice(
                    err instanceof Error ? err.message : 'Security Shield blocked unsafe Shared Inbox configuration.'
                  );
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: 'aiConciergeEnabled' as const,
                    title: '24/7 AI Concierge Auto-Replies',
                    desc: 'Enable automated AI responses inside the Shared Inbox concierge thread.',
                  },
                  {
                    key: 'allowFileAttachments' as const,
                    title: 'Allow Photo, Video & Document Sharing',
                    desc: 'Permit registered users to send compressed images, clips, and PDF invoices.',
                  },
                  {
                    key: 'allowAudioVideoCalls' as const,
                    title: 'Enable 8-Digit Audio & Video Calling',
                    desc: 'Allow peer-to-peer dialer voice and video call initiation from Inbox.',
                  },
                  {
                    key: 'autoWelcomeMessageEnabled' as const,
                    title: 'Send Auto-Welcome Credentials Message',
                    desc: 'Dispatch account # & PIN confirmation to Shared Inbox on signup.',
                  },
                  {
                    key: 'showFbrTaxAndInsuranceNotice' as const,
                    title: 'Display FBR Tax & Insurance Banner',
                    desc: 'Show FBR tax and COD transit insurance header inside Shared Inbox.',
                  },
                ].map((toggle) => (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() =>
                      setInboxConfig({ ...inboxConfig, [toggle.key]: !inboxConfig[toggle.key] })
                    }
                    className={`p-3.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                      inboxConfig[toggle.key]
                        ? 'bg-[#f2fbf5] border-[#046c31]'
                        : 'bg-stone-50 border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-black text-[#023819]">{toggle.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          inboxConfig[toggle.key]
                            ? 'bg-[#034720] text-[#fef08a]'
                            : 'bg-stone-300 text-stone-800'
                        }`}
                      >
                        {inboxConfig[toggle.key] ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-700 font-semibold">{toggle.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">
                    Broadcast Sender Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inboxConfig.broadcastSenderName}
                    onChange={(e) =>
                      setInboxConfig({ ...inboxConfig, broadcastSenderName: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">
                    Max Attachment Size (KB)
                  </label>
                  <input
                    type="number"
                    min={256}
                    max={25600}
                    value={inboxConfig.maxAttachmentKb}
                    onChange={(e) =>
                      setInboxConfig({ ...inboxConfig, maxAttachmentKb: Number(e.target.value) || 5120 })
                    }
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 uppercase mb-1">
                  Shared Inbox Banner Notice Text
                </label>
                <input
                  type="text"
                  value={inboxConfig.defaultWelcomeBanner}
                  onChange={(e) =>
                    setInboxConfig({ ...inboxConfig, defaultWelcomeBanner: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl font-bold bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('broadcast')}
                  className="py-2 px-4 bg-[#eef7f1] hover:bg-[#dcfce7] border-2 border-[#046c31] text-[#023819] rounded-xl font-black cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Megaphone className="w-4 h-4 text-[#046c31]" />
                  <span>Send Message to All Registered Users</span>
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-5 munafa-green-btn rounded-xl font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4 text-[#fef08a]" />
                  <span>Save Shared Inbox Config</span>
                </button>
              </div>
            </form>
          </div>

          {/* All Platform Messages Management */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#046c31]" />
                  <span>All Registered User Messages ({messages.length})</span>
                </h3>
                <p className="text-xs text-[#045c29] font-semibold">
                  Inspect any message across the platform and reply directly as Munafa Admin HQ.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  placeholder="Filter by account #, sender, or text..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border-2 border-emerald-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-[540px] overflow-y-auto">
              {[...messages]
                .reverse()
                .filter((m) => {
                  if (!msgSearchQuery.trim()) return true;
                  const q = msgSearchQuery.toLowerCase();
                  return (
                    m.senderName.toLowerCase().includes(q) ||
                    m.senderAccountNumber.toLowerCase().includes(q) ||
                    m.recipientAccountNumber.toLowerCase().includes(q) ||
                    m.content.toLowerCase().includes(q)
                  );
                })
                .slice(0, 60)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 border-2 border-emerald-200 rounded-xl bg-[#f9fdfb] space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-[#023819]">{m.senderName}</span>
                        <span className="font-mono text-[10px] bg-white border border-stone-300 px-2 py-0.5 rounded font-bold">
                          From #{m.senderAccountNumber} → #{m.recipientAccountNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#034720] text-[#fef08a] font-bold uppercase">
                          {m.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 font-bold">
                        {new Date(m.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-stone-900 font-semibold whitespace-pre-line bg-white p-2.5 rounded-lg border border-stone-200">
                      {m.content}
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={adminReplyDrafts[m.threadId] || ''}
                        onChange={(e) =>
                          setAdminReplyDrafts((prev) => ({ ...prev, [m.threadId]: e.target.value }))
                        }
                        placeholder="Write direct Admin reply into this thread..."
                        className="flex-1 px-3 py-1.5 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAdminInlineReply(m)}
                        className="py-1.5 px-3 munafa-green-btn rounded-xl text-xs font-black cursor-pointer"
                      >
                        Send Admin Reply
                      </button>
                      {m.senderAccountNumber !== 'system' && m.senderAccountNumber !== '00000000' && m.senderAccountNumber !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithAccount(m.senderAccountNumber)}
                          className="py-1.5 px-3 bg-[#eef7f1] border-2 border-[#046c31] text-[#023819] rounded-xl text-xs font-black cursor-pointer"
                        >
                          Open Thread
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: JAZZCASH, BANK TRANSFER ACCOUNTS & REGISTRATION PAYMENT VERIFICATION */}
      {activeTab === 'bank_accounts' && (
        <div className="space-y-6">
          {/* Official JazzCash & Bank Transfer Settings Form */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs space-y-4">
            <div className="bg-[#eef7f1] px-6 py-4 border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#023819] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#046c31]" />
                  <span>{t('adminBankFormTitle')}</span>
                </h2>
                <p className="text-xs text-[#045c29] font-semibold mt-0.5">
                  {t('adminBankFormDesc')}
                </p>
              </div>
              {bankSavedMsg && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#034720] border border-[#d4af37] text-[#fef08a] rounded-lg text-xs font-bold animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  <span>JazzCash & Bank Settings Saved!</span>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 space-y-5">
              {/* Fixed Registration Fee Policy Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-[#046c31]">Buyers</div>
                  <div className="font-mono font-black text-[#023819] mt-0.5">100% Free</div>
                </div>
                <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-[#046c31]">Farmers & Mining</div>
                  <div className="font-mono font-black text-[#023819] mt-0.5">PKR 2,000 / Year</div>
                </div>
                <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-[#046c31]">Factories</div>
                  <div className="font-mono font-black text-[#023819] mt-0.5">PKR 2,000 / Month</div>
                </div>
                <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-[#046c31]">Wholesalers</div>
                  <div className="font-mono font-black text-[#023819] mt-0.5">PKR 1,500 / Month</div>
                </div>
                <div className="p-3 bg-[#dcfce7] border-2 border-[#046c31] rounded-xl col-span-2 lg:col-span-1">
                  <div className="text-[10px] font-black uppercase text-[#023819]">Other / Order Fees</div>
                  <div className="font-mono font-black text-[#023819] mt-0.5">PKR 0 (Zero Fees)</div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    LocalEdgeDb.saveBankDetails({ ...bankDetails, orderFeePkr: 0, aiAutoVerifyEnabled: false });
                    setBankSavedMsg(true);
                    setTimeout(() => setBankSavedMsg(false), 3000);
                  } catch (err: unknown) {
                    setAdminNotice(
                      err instanceof Error ? err.message : 'Security Shield blocked unsafe bank or JazzCash details.'
                    );
                  }
                }}
                className="space-y-4"
              >
                {/* Bank Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Bank Account Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.accountTitle}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Bank Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Official IBAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.iban}
                      onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Branch Code & City
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={bankDetails.branchCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, branchCode: e.target.value })}
                        placeholder="e.g. 0284"
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                      <input
                        type="text"
                        value={bankDetails.branchCity}
                        onChange={(e) => setBankDetails({ ...bankDetails, branchCity: e.target.value })}
                        placeholder="e.g. Lahore"
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>
                </div>

                {/* JazzCash & Mobile Wallet Accounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      JazzCash Account Title
                    </label>
                    <input
                      type="text"
                      value={bankDetails.jazzCashTitle}
                      onChange={(e) => setBankDetails({ ...bankDetails, jazzCashTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      JazzCash Mobile / Till #
                    </label>
                    <input
                      type="text"
                      value={bankDetails.jazzCashNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, jazzCashNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      EasyPaisa Account Title
                    </label>
                    <input
                      type="text"
                      value={bankDetails.easyPaisaTitle}
                      onChange={(e) => setBankDetails({ ...bankDetails, easyPaisaTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      EasyPaisa Mobile #
                    </label>
                    <input
                      type="text"
                      value={bankDetails.easyPaisaNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, easyPaisaNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="py-2.5 px-6 munafa-green-btn font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-[#fef08a]" />
                    <span>{t('saveBankDetailsBtn')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Registration Payment Check & 1-Click Activate / Deactivate / Delete Queue */}
          <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <h3 className="font-extrabold text-[#023819]">
                  {isUrdu ? 'رجسٹریشن ادائیگی چیک اور اکاؤنٹ کنٹرول' : 'Payment Check & Account Activation Controls'}
                </h3>
                <p className="text-[#045c29] font-semibold text-[11px]">
                  Verify JazzCash or Bank Transfer registration payments received and click Activate Account, Deactivate, or Delete.
                </p>
              </div>
              <span className="font-mono text-[#fef08a] font-extrabold bg-[#034720] border-2 border-[#d4af37] px-3 py-1 rounded-xl">
                Pending Checks: {accounts.filter((a) => !a.isDeleted && a.accountType !== 'admin' && (a.subscription.status === 'frozen' || a.subscription.pendingPaymentRef?.status === 'pending')).length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px]">
                    <th className="p-3">Account # & Member</th>
                    <th className="p-3">Role & Fee</th>
                    <th className="p-3">JazzCash / Bank Transfer Ref</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {accounts
                    .filter((a) => !a.isDeleted && a.accountType !== 'admin')
                    .sort((a, b) => {
                      const aPending = a.subscription.status === 'frozen' || a.subscription.pendingPaymentRef?.status === 'pending' ? 0 : 1;
                      const bPending = b.subscription.status === 'frozen' || b.subscription.pendingPaymentRef?.status === 'pending' ? 0 : 1;
                      return aPending - bPending;
                    })
                    .map((acc) => {
                      const isFrozen = acc.subscription.status === 'frozen';
                      const pendingRef = acc.subscription.pendingPaymentRef;

                      return (
                        <tr key={acc.accountNumber} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3">
                            <div className="font-extrabold text-stone-950">{acc.name}</div>
                            <div className="text-[10px] text-stone-600 font-mono font-bold">
                              Acc #{acc.accountNumber} · {acc.phone}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-[#023819] capitalize">
                              {acc.accountType.replace('_', ' ')}
                            </div>
                            <div className="font-mono text-[11px] font-black text-[#046c31]">
                              {acc.accountType === 'customer'
                                ? '100% Free'
                                : acc.accountType === 'farmer_mining'
                                ? 'PKR 2,000 / Year'
                                : acc.accountType === 'factory'
                                ? 'PKR 2,000 / Month'
                                : 'PKR 1,500 / Month'}
                            </div>
                          </td>

                          <td className="p-3">
                            {pendingRef ? (
                              <div className="space-y-1">
                                <div className="font-mono font-extrabold text-stone-900">
                                  {(pendingRef.channel || acc.subscription.paymentChannel || 'bank').toUpperCase()} · Ref #{pendingRef.refNumber}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPaymentReceiptModal({
                                      accountNumber: acc.accountNumber,
                                      name: acc.name,
                                      refNumber: pendingRef.refNumber,
                                      receiptUrl: pendingRef.receiptUrl,
                                      feePkr: acc.subscription.feePkr,
                                    })
                                  }
                                  className="text-[11px] font-black text-[#046c31] underline cursor-pointer"
                                >
                                  Inspect Receipt Slip
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-600 font-semibold italic">
                                {acc.accountType === 'customer' ? 'Free Buyer Account' : 'No slip submitted yet'}
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {!isFrozen && pendingRef?.status !== 'pending' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Active</span>
                              </span>
                            ) : pendingRef?.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending Verification</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-400">
                                <XCircle className="w-3 h-3 text-red-700" />
                                <span>Deactivated</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            {(isFrozen || pendingRef?.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => handleUnfreeze(acc.accountNumber)}
                                className="py-1 px-3 munafa-green-btn text-[11px] font-extrabold rounded-xl shadow-xs cursor-pointer"
                              >
                                Activate Account
                              </button>
                            )}
                            {!isFrozen && (
                              <button
                                type="button"
                                onClick={() => handleManualFreeze(acc.accountNumber)}
                                className="py-1 px-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-500 text-amber-950 text-[11px] font-extrabold rounded-xl cursor-pointer"
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
                              className="py-1 px-3 bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white text-[11px] font-extrabold rounded-xl cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED FREEZE LOG */}
      {activeTab === 'freeze_log' && (
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#eef7f1] border-b-2 border-emerald-200 flex justify-between items-center text-xs">
            <div>
              <h2 className="font-extrabold text-[#023819]">Automated Freeze Records</h2>
              <p className="text-[#045c29] font-semibold text-[11px]">
                Every business account automatically blocked by the daily subscription scheduler.
              </p>
            </div>
            <span className="font-mono text-[#034720] bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-extrabold">{freezeLogs.length} events logged</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#034720] border-b-2 border-[#d4af37] text-[#fef08a] font-extrabold uppercase text-[10px]">
                <th className="p-3">Account</th>
                <th className="p-3">Blocked Timestamp</th>
                <th className="p-3">Amount Owed</th>
                <th className="p-3">Days Overdue</th>
                <th className="p-3">Resolution</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {freezeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3">
                    <div className="font-extrabold text-stone-950">{log.accountName}</div>
                    <div className="text-[10px] text-stone-500 font-mono font-bold">Acc #{log.accountNumber} ({log.accountType})</div>
                  </td>
                  <td className="p-3 font-mono text-stone-700 text-[11px] font-bold">
                    {new Date(log.blockedAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono font-extrabold text-red-700">
                    PKR {log.amountOwed.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-stone-900 font-bold">{log.daysOverdue} days</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border-2 ${
                        log.resolutionStatus === 'blocked'
                          ? 'bg-white text-red-700 border-red-500'
                          : 'bg-white text-emerald-800 border-emerald-600'
                      }`}
                    >
                      {log.resolutionStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {log.resolutionStatus === 'blocked' && (
                      <button
                        onClick={() => handleUnfreeze(log.accountNumber)}
                        className="py-1 px-3 munafa-green-btn rounded-xl text-xs font-extrabold cursor-pointer"
                      >
                        Unfreeze Account
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: AI AGENT LOG */}
      {activeTab === 'agent_log' && (
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4 bg-[#eef7f1] border-b-2 border-emerald-200 flex justify-between items-center text-xs">
            <div>
              <h2 className="font-extrabold text-[#023819]">24/7 Automated Agent Conversation Log</h2>
              <p className="text-[#045c29] font-semibold text-[11px]">
                Every query answered by the AI agent with direct Admin takeover option.
              </p>
            </div>
            <span className="font-mono text-[#034720] bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-extrabold">{agentLogs.length} queries</span>
          </div>

          <div className="p-4 space-y-3">
            {agentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border-2 border-stone-300 rounded-xl hover:border-stone-400 transition-colors text-xs space-y-2 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-950">{log.userName}</span>
                    <span className="font-mono text-[10px] text-stone-700 bg-white border border-stone-300 px-2 py-0.5 rounded font-bold">
                      Acc #{log.userAccountNumber}
                    </span>
                    {log.isEscalated && (
                      <span className="text-[10px] bg-white border-2 border-red-500 text-red-700 px-2 py-0.5 rounded font-extrabold uppercase">
                        Escalated to Human Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 font-bold">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border-2 border-stone-200">
                  <div className="font-extrabold text-stone-800 mb-0.5">User Query:</div>
                  <p className="text-stone-900 font-medium">{log.query}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border-2 border-emerald-600">
                  <div className="font-extrabold text-emerald-900 mb-0.5 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Agent Reply:</span>
                  </div>
                  <p className="text-stone-800 font-medium whitespace-pre-line">{log.reply}</p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onOpenChatWithAccount(log.userAccountNumber)}
                    className="py-1.5 px-3.5 munafa-green-btn rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Take Over Conversation in Inbox</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST NOTICE COMPOSER */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleSendBroadcast} className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="bg-[#eef7f1] px-6 py-4 border-b-2 border-emerald-200">
            <h2 className="text-base font-extrabold text-[#023819]">Post System Broadcast Notice</h2>
            <p className="text-xs text-[#045c29] font-semibold">
              Dispatches an official notice directly to the Shared Inbox of all accounts or targeted account types.
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">

          {broadcastSentCount !== null && (
            <div className="p-3 bg-white border-2 border-emerald-600 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>
                Broadcast notice dispatched successfully to {broadcastSentCount} registered user inbox(es)!
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase mb-1">
              Target Audience
            </label>
            <select
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value as any)}
              className="w-full sm:w-64 px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
              <option value="all">All Accounts (Everyone)</option>
              <option value="customer">Customers Only</option>
              <option value="farmer_mining">Farmers & Miners Only</option>
              <option value="factory">Factories Only</option>
              <option value="wholesaler">Wholesalers Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Schedule Maintenance, Tax Compliance Warning, or Eid Holiday Transit Advice"
              className="w-full px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
            </input>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase mb-1">
              Message Content
            </label>
            <textarea
              required
              rows={4}
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Full details of the announcement to appear in user Inboxes..."
              className="w-full px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 munafa-green-btn rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Megaphone className="w-4 h-4 text-[#fef08a]" />
            <span>Send Broadcast to Inboxes</span>
          </button>
          </div>
        </form>
      )}

      {/* TAB 5: AUTOMATED ENGINE & OVERDUE SIMULATOR */}
      {activeTab === 'engine' && (
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs space-y-6">
          <div className="bg-[#eef7f1] px-6 py-4 border-b-2 border-emerald-200">
            <h2 className="text-base font-extrabold text-[#023819]">
              Automated Subscription Engine & Simulator
            </h2>
            <p className="text-xs text-[#045c29] font-semibold">
              Test and demonstrate the zero-human-interference automated subscription rules.
            </p>
          </div>

          <div className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f2fbf5] p-5 rounded-2xl border-2 border-emerald-200 space-y-2 text-xs shadow-xs">
              <h3 className="font-extrabold text-[#023819] text-sm">Rule 1: Daily Cron Checks</h3>
              <p className="text-[#052e16] font-medium leading-relaxed">
                The engine evaluates every business account (Farmer, Factory, Wholesaler). If current date &gt; due date, the account is automatically blocked on the day after the due date with zero staff intervention.
              </p>
              <button
                onClick={handleRunDailyCheck}
                className="mt-2 py-2 px-4 munafa-green-btn font-extrabold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Execute Daily Automation Cycle Now
              </button>
            </div>

            <div className="bg-[#f2fbf5] p-5 rounded-2xl border-2 border-emerald-200 space-y-2 text-xs shadow-xs">
              <h3 className="font-extrabold text-[#023819] text-sm">Rule 2: Automated Self-Healing Audit</h3>
              <p className="text-[#052e16] font-medium leading-relaxed">
                Ensures local edge database schema validity, sanitizes CNIC records, synchronizes catalog visibility with account status, and reports zero defects.
              </p>
              <button
                onClick={() => {
                  const rep = LocalEdgeDb.runSelfHealingAudit();
                  setAdminNotice(`Self-Healing Complete: ${rep.repairedItemsCount} issues detected and auto-repaired.`);
                }}
                className="mt-2 py-2 px-4 bg-[#023819] hover:bg-[#034720] text-[#fef08a] border border-[#d4af37] font-extrabold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Run Self-Healing Verification
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
              Simulate Overdue Freeze on Active Accounts:
            </h3>
            <div className="space-y-2">
              {accounts
                .filter(
                  (a) =>
                    a.accountType !== 'customer' &&
                    a.accountType !== 'admin' &&
                    a.subscription.status === 'active'
                )
                .map((acc) => (
                  <div
                    key={acc.accountNumber}
                    className="p-3.5 bg-white border-2 border-stone-300 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-stone-950">{acc.name}</span>
                      <span className="text-stone-600 font-semibold text-[11px] ml-2 font-mono">
                        Acc #{acc.accountNumber} · Due: {acc.subscription.dueDate}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSimulateOverdue(acc)}
                      className="py-1 px-3 bg-white hover:bg-stone-50 text-red-700 border-2 border-red-500 rounded-lg text-[11px] font-extrabold cursor-pointer"
                    >
                      Simulate Overdue & Auto-Block
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
              5-Year Inactivity Policy & Deletion Eligibility Simulator:
            </h3>
            <div className="space-y-2">
              {accounts
                .filter((a) => a.accountType !== 'admin' && !a.isDeleted)
                .map((acc) => {
                  const elig = LocalEdgeDb.getDeletionEligibility(acc);
                  return (
                    <div
                      key={acc.accountNumber}
                      className="p-3.5 bg-white border-2 border-stone-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-stone-950">{acc.name}</span>
                        <span className="text-stone-600 font-semibold text-[11px] ml-2 font-mono">
                          Acc #{acc.accountNumber} · {elig.reason}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!elig.hasWarning && (
                          <button
                            type="button"
                            onClick={() => handleSend5YearWarning(acc.accountNumber)}
                            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-500 rounded-lg text-[11px] font-extrabold cursor-pointer"
                          >
                            Issue Warning
                          </button>
                        )}
                        {!elig.hasFiveYearsInactivity && (
                          <button
                            type="button"
                            onClick={() => {
                              LocalEdgeDb.simulateFiveYearInactivity(acc.accountNumber);
                              setAdminNotice(`Simulated 5+ years of inactivity for Account #${acc.accountNumber}.`);
                            }}
                            className="py-1 px-2.5 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-400 rounded-lg text-[11px] font-extrabold cursor-pointer"
                          >
                            Mark 5 Yrs Inactive
                          </button>
                        )}
                        {elig.eligible && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmAcc(acc.accountNumber)}
                            className="py-1 px-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-extrabold cursor-pointer"
                          >
                            Delete Eligible
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 7: AI FRAUD SENTINEL & ANOMALY DETECTION */}
      {activeTab === 'fraud_sentinel' && (
        <div className="space-y-6">
          {/* Header & Deep Scan Trigger */}
          <div className="munafa-bg-header bg-[#034720] text-white border-2 border-[#d4af37] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radar className="w-5 h-5 text-[#facc15] animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-[#fef08a] font-black">
                  {isUrdu ? 'خودکار اے آئی فراڈ شیلڈ' : 'AUTONOMOUS LEDGER & IDENTITY SHIELD'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {isUrdu ? 'اے آئی فراڈ ڈیٹیکشن و انوملی سینٹینل' : 'AI Fraud Sentinel & Risk Diagnostics'}
              </h2>
              <p className="text-xs text-emerald-100 font-bold mt-1 max-w-2xl leading-relaxed">
                {isUrdu
                  ? 'یہ خودکار اے آئی نظام پلیٹ فارم پر مشکوک سرگرمیوں، شناختی کارڈ کے ڈپلیکیٹ اندراج، غیر معمولی قیمتوں، ایک ہی ٹرانزیکشن آئی ڈی کے بار بار استعمال اور بغیر این ٹی این ٹیکس چوری کا فوری سراغ لگاتا ہے۔'
                  : 'Automated AI sentinel cross-auditing CNIC duplicates, extreme price deviations, reused bank transaction TIDs, and high-risk tax evasion patterns across local device records.'}
              </p>
            </div>

            <button
              onClick={handleTriggerDeepScan}
              disabled={isScanningFraud}
              className="py-2.5 px-4 munafa-gold-btn rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 text-[#023819] ${isScanningFraud ? 'animate-spin' : ''}`} />
              <span>{isScanningFraud ? 'Scanning Records...' : 'Trigger Live AI Deep Scan'}</span>
            </button>
          </div>

          {/* Diagnostic Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white border-2 border-stone-800 rounded-xl shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                {isUrdu ? 'پلیٹ فارم خطرہ' : 'Platform Threat Level'}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg sm:text-xl font-black uppercase ${
                    fraudData.overallThreatLevel === 'critical'
                      ? 'text-red-700'
                      : fraudData.overallThreatLevel === 'medium'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {fraudData.overallThreatLevel}
                </span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    fraudData.overallThreatLevel === 'critical'
                      ? 'bg-red-600 animate-ping'
                      : fraudData.overallThreatLevel === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-[10px] text-stone-700 font-bold mt-1">Real-time edge audit</div>
            </div>

            <div className="p-4 bg-white border-2 border-stone-800 rounded-xl shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                {isUrdu ? 'اوسط خطرہ اسکور' : 'Avg Risk Score'}
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-stone-950">
                {fraudData.averageRiskScore} <span className="text-xs font-bold text-stone-600">/ 100</span>
              </div>
              <div className="text-[10px] text-stone-700 font-bold mt-1">Weighted anomaly vector</div>
            </div>

            <div className="p-4 bg-white border-2 border-stone-800 rounded-xl shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                {isUrdu ? 'کل جانچ پڑتال' : 'Entities Audited'}
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-stone-950">
                {fraudData.totalAudited}
              </div>
              <div className="text-[10px] text-stone-700 font-bold mt-1">Accounts, Orders, Goods</div>
            </div>

            <div className="p-4 bg-white border-2 border-stone-800 rounded-xl shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                {isUrdu ? 'فعال انتباہات' : 'Active Anomaly Flags'}
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-red-700">
                {fraudData.alerts.filter((a) => a.status === 'active').length}
              </div>
              <div className="text-[10px] text-stone-700 font-bold mt-1">Requiring staff review</div>
            </div>
          </div>

          {/* Anomaly Alerts List */}
          <div className="bg-white border-2 border-stone-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-stone-200">
              <h3 className="text-sm font-black text-stone-950 uppercase tracking-wide flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>
                  {isUrdu ? 'شناخت شدہ مشکوک کیسز اور خطرات' : 'Detected Platform Anomalies & Audit Queue'}
                </span>
              </h3>
              <span className="text-xs font-bold text-stone-600">
                {fraudData.alerts.length} Total Records Logged
              </span>
            </div>

            {fraudData.alerts.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-black text-stone-950">All Clear — Zero Anomalies Detected</p>
                <p className="text-xs text-stone-600 font-bold mt-1">
                  Edge ledger data matches integrity checks across all participating entities.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fraudData.alerts.map((fAlert) => (
                  <div
                    key={fAlert.id}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      fAlert.status === 'active'
                        ? fAlert.severity === 'critical'
                          ? 'border-red-600 bg-red-50/40'
                          : 'border-amber-600 bg-amber-50/40'
                        : 'border-stone-300 bg-stone-50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              fAlert.severity === 'critical'
                                ? 'bg-red-600 text-white'
                                : fAlert.severity === 'medium'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {fAlert.severity} Risk
                          </span>

                          <span className="px-2 py-0.5 bg-stone-200 text-stone-900 rounded-md text-[10px] font-black uppercase">
                            {fAlert.category.replace('_', ' ')}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase ${
                              fAlert.status === 'active'
                                ? 'text-red-700'
                                : fAlert.status === 'audited'
                                ? 'text-blue-700'
                                : 'text-stone-600'
                            }`}
                          >
                            Status: {fAlert.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-stone-950">
                          {fAlert.targetName}{' '}
                          <span className="text-xs font-mono font-bold text-stone-700">
                            (Acc: {fAlert.targetAccountNumber})
                          </span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase text-stone-600">Risk Score</div>
                          <div
                            className={`text-base font-mono font-black ${
                              fAlert.riskScore >= 80
                                ? 'text-red-700'
                                : fAlert.riskScore >= 50
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {fAlert.riskScore}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-900 font-bold leading-relaxed mb-3 bg-white/80 p-2.5 rounded-lg border border-stone-200">
                      {fAlert.triggerReason}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-300">
                      {fAlert.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              LocalEdgeDb.auditFraudAlert(fAlert.id);
                              setFraudData(LocalEdgeDb.runFraudScan());
                            }}
                            className="py-1 px-3 bg-white hover:bg-stone-100 text-blue-900 border border-blue-700 rounded-lg text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            <span>Mark Audited</span>
                          </button>

                          <button
                            onClick={() => {
                              const accNum = fAlert.targetAccountNumber.split(',')[0].trim();
                              LocalEdgeDb.freezeAccount(
                                accNum,
                                `Flagged by AI Sentinel: ${fAlert.triggerReason.slice(0, 80)}`
                              );
                              LocalEdgeDb.auditFraudAlert(fAlert.id);
                              setFraudData(LocalEdgeDb.runFraudScan());
                            }}
                            className="py-1 px-3 bg-white hover:bg-red-50 text-red-900 border border-red-700 rounded-lg text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                            <span>Freeze Target Account</span>
                          </button>

                          <button
                            onClick={() => {
                              LocalEdgeDb.dismissFraudAlert(fAlert.id);
                              setFraudData(LocalEdgeDb.runFraudScan());
                            }}
                            className="py-1 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-400 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </>
                      )}

                      {fAlert.status !== 'active' && (
                        <span className="text-[11px] font-bold text-stone-600">
                          Resolution recorded. Case closed in local cache.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: ADMIN SECURITY & PIN SETTINGS + CYBER-SHIELD VIRUS SCANNER */}
      {activeTab === 'admin_security' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="munafa-bg-header bg-[#034720] text-white border-2 border-[#d4af37] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-[#facc15]" />
              <span className="text-xs uppercase tracking-widest text-[#fef08a] font-black">
                {isUrdu ? 'ایڈمن سیکیورٹی کنسول' : 'ADMIN CREDENTIALS & CYBER-SHIELD'}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              {isUrdu
                ? 'ایڈمن سیکیورٹی، پن تبدیل اور اینٹی وائرس اسکینر'
                : 'Admin Security PIN & Automatic Anti-Malware Shield'}
            </h2>
            <p className="text-xs text-emerald-100 font-bold mt-1 leading-relaxed">
              {isUrdu
                ? 'ایڈمن یوزر نیم و پن تبدیل کریں اور منافع سسٹم، منسلک ویب سائٹس اور ڈیٹا بیس کو وائرس، مالویئر اور ہیکنگ سے خودکار محفوظ بنائیں۔'
                : 'Manage privileged HQ credentials, scan all connected web origins and stored records for viruses/malware, and monitor blocked intrusion attempts.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Active Credentials Summary */}
              <div className="p-4 bg-white border-2 border-stone-800 rounded-xl shadow-xs space-y-2">
                <div className="text-xs font-black uppercase text-stone-600 tracking-wider">
                  {isUrdu ? 'موجودہ فعال ایڈمن معلومات' : 'Current Active Admin Profile'}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg">
                    <span className="text-[11px] font-black text-stone-600 uppercase block">Active Username</span>
                    <span className="text-sm font-mono font-black text-stone-950">
                      {currentAdminAccount.accountNumber}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg">
                    <span className="text-[11px] font-black text-stone-600 uppercase block">Active 4-Digit PIN</span>
                    <span className="text-sm font-mono font-black text-stone-950">
                      •••• (Protected)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {credStatus && (
                <div
                  className={`p-3.5 border-2 rounded-xl text-xs font-black flex items-center justify-between ${
                    credStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                      : 'bg-red-50 border-red-600 text-red-950'
                  }`}
                >
                  <span>{credStatus.message}</span>
                  <button
                    onClick={() => setCredStatus(null)}
                    className="font-bold underline cursor-pointer ml-3"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Credentials Change Form */}
              <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-xs">
                <form onSubmit={handleUpdateCredentials} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-stone-950 uppercase tracking-wide mb-1.5">
                      {isUrdu ? 'نیا ایڈمن یوزر نیم' : 'New Admin Username'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                      placeholder={`e.g. ${currentAdminAccount.accountNumber}`}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-800 rounded-xl text-xs font-black text-stone-950 focus:outline-hidden focus:border-emerald-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-stone-950 uppercase tracking-wide mb-1.5">
                        {isUrdu ? 'نیا 4 ہندسوں کا پن' : 'New 4-Digit Security PIN'}
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-800 rounded-xl text-center text-base font-mono font-black tracking-widest text-stone-950 focus:outline-hidden focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-stone-950 uppercase tracking-wide mb-1.5">
                        {isUrdu ? 'نئے پن کی تصدیق کریں' : 'Confirm New PIN'}
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={confirmAdminPin}
                        onChange={(e) => setConfirmAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-800 rounded-xl text-center text-base font-mono font-black tracking-widest text-stone-950 focus:outline-hidden focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-6 munafa-green-btn rounded-xl text-xs font-black cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-[#fef08a]" />
                      <span>
                        {isUrdu ? 'ایڈمن معلومات تبدیل اور محفوظ کریں' : 'Save & Update Admin Credentials'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Automatic Virus, Malware & Connected Resources Cyber-Shield Scanner */}
            <div className="bg-white border-2 border-[#046c31] rounded-2xl overflow-hidden shadow-xs flex flex-col">
              <div className="p-4 bg-[#eef7f1] border-b-2 border-emerald-200 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[#023819] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#046c31]" />
                    <span>{shieldScanReport.shieldEngineVersion}</span>
                  </h3>
                  <p className="text-[11px] font-bold text-[#045c29]">
                    Connected Sites, DOM & Unlimited Database Scanner
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCyberShieldScan}
                  disabled={isScanningShield}
                  className="py-1.5 px-3 munafa-green-btn rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#fef08a] ${isScanningShield ? 'animate-spin' : ''}`} />
                  <span>{isScanningShield ? 'Scanning...' : 'Scan Connected Sites'}</span>
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs flex-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                    <div className="text-[10px] uppercase font-black text-[#045c29]">Shield Status</div>
                    <div className="text-sm font-black text-[#023819] uppercase">
                      {shieldScanReport.overallStatus === 'clean' ? '100% CLEAN' : shieldScanReport.overallStatus}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                    <div className="text-[10px] uppercase font-black text-[#045c29]">Scanned Nodes</div>
                    <div className="text-sm font-mono font-black text-[#023819]">
                      {shieldScanReport.scannedDomElements + shieldScanReport.scannedRecordsCount}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#f2fbf5] border border-emerald-300 rounded-xl">
                    <div className="text-[10px] uppercase font-black text-[#045c29]">Attacks Blocked</div>
                    <div className="text-sm font-mono font-black text-[#023819]">
                      {blockedThreats.length}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <div className="font-black text-[#023819] text-[11px] uppercase">
                    Connected Origins Audited ({shieldScanReport.connectedOrigins.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {shieldScanReport.connectedOrigins.map((orig) => (
                      <span
                        key={orig}
                        className="px-2 py-0.5 bg-white border border-emerald-400 text-[#023819] font-mono text-[10px] font-bold rounded"
                      >
                        {orig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {shieldScanReport.findings.slice(0, 8).map((f) => (
                    <div
                      key={f.id}
                      className={`p-2 rounded-lg border text-[11px] flex items-start justify-between gap-2 ${
                        f.status === 'safe'
                          ? 'bg-[#f2fbf5] border-emerald-200 text-[#023819]'
                          : 'bg-red-50 border-red-300 text-red-900'
                      }`}
                    >
                      <div>
                        <span className="font-black block">{f.target}</span>
                        <span className="font-semibold opacity-85">{f.detail}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-emerald-400 text-[9px] font-black uppercase shrink-0">
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>

                {blockedThreats.length > 0 && (
                  <div className="pt-2 border-t border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-red-800 text-[11px] uppercase">
                        Auto-Blocked Threat Log ({blockedThreats.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearBlockedThreats();
                          setBlockedThreats([]);
                        }}
                        className="text-[10px] font-bold text-stone-600 underline cursor-pointer"
                      >
                        Clear Log
                      </button>
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {blockedThreats.slice(0, 5).map((bt) => (
                        <div key={bt.id} className="p-2 bg-red-50 border border-red-300 rounded-lg text-[10px] text-red-950 font-bold">
                          <span className="font-mono font-black">[{bt.threatType}]</span> {bt.detail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: DISPUTES & ESCALATIONS */}
      {activeTab === 'disputes' && (
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4 sm:p-5 bg-[#eef7f1] border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <h2 className="text-base font-black text-[#023819]">
                {isUrdu ? 'آرڈر تنازعات اور بیمہ کلیم' : 'Order Disputes & Insurance Escalations'}
              </h2>
              <p className="text-[#045c29] font-semibold text-[11px]">
                {isUrdu
                  ? 'گمشدہ اشیاء، ترسیلی چوری یا معیار کی شکایات کا جائزہ لیں اور فیصلہ محفوظ کریں۔'
                  : 'Review reported missing/stolen COD goods, damaged freight, or FBR invoice discrepancies.'}
              </p>
            </div>
            <span className="font-mono text-[#fef08a] font-black px-3 py-1 bg-[#034720] rounded-xl border border-[#d4af37]">
              {disputes.length} {isUrdu ? 'شکایات' : 'Total Reports'}
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {disputes.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500 font-bold">
                {isUrdu ? 'اس وقت کوئی تنازعہ زیر التوا نہیں ہے۔' : 'No disputes or escalations filed.'}
              </div>
            ) : (
              disputes.map((dsp) => (
                <div
                  key={dsp.id}
                  className={`p-4 border-2 rounded-2xl space-y-3 ${
                    dsp.status === 'resolved'
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : dsp.status === 'investigating'
                      ? 'border-amber-400 bg-amber-50/30'
                      : 'border-red-500 bg-red-50/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-stone-950 bg-white px-2.5 py-0.5 rounded-lg border border-stone-300">
                        Order #{dsp.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-900 text-[10px] font-black uppercase">
                        {dsp.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          dsp.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : dsp.status === 'investigating'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-red-100 text-red-900 border-red-400'
                        }`}
                      >
                        {dsp.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500 font-bold">
                      {new Date(dsp.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-stone-900 font-bold space-y-1">
                    <div>
                      Reporter: <span className="font-black">{dsp.reporterName}</span> (#{dsp.reporterAccountNumber}) vs Account #{dsp.againstAccountNumber}
                    </div>
                    <p className="p-2.5 bg-white border border-stone-300 rounded-xl font-semibold text-stone-800">
                      {dsp.description}
                    </p>
                  </div>

                  {dsp.adminNote && (
                    <div className="text-xs bg-white border border-emerald-400 rounded-xl p-2.5 text-emerald-950 font-bold">
                      Admin Note: {dsp.adminNote}
                    </div>
                  )}

                  {dsp.status !== 'resolved' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-stone-200">
                      <input
                        type="text"
                        value={disputeNoteDrafts[dsp.id] || ''}
                        onChange={(e) =>
                          setDisputeNoteDrafts((prev) => ({ ...prev, [dsp.id]: e.target.value }))
                        }
                        placeholder="Add staff investigation or insurance payout note..."
                        className="flex-1 px-3 py-1.5 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white"
                      />
                      <div className="flex items-center gap-2">
                        {dsp.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => {
                              const ok = LocalEdgeDb.resolveDispute(
                                dsp.id,
                                disputeNoteDrafts[dsp.id] || 'Assigned to Munafa compliance staff.',
                                'investigating'
                              );
                              if (!ok) {
                                setAdminNotice('1st-Second Shield blocked unsafe investigation note.');
                              }
                            }}
                            className="py-1.5 px-3 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-600 rounded-xl text-xs font-black cursor-pointer"
                          >
                            Mark Investigating
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const ok = LocalEdgeDb.resolveDispute(
                              dsp.id,
                              disputeNoteDrafts[dsp.id] || 'Dispute resolved & logged by Munafa Admin.',
                              'resolved'
                            );
                            if (!ok) {
                              setAdminNotice('1st-Second Shield blocked unsafe resolution note.');
                            }
                          }}
                          className="py-1.5 px-3 munafa-green-btn rounded-xl text-xs font-black cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* Account Error Fixer Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-[#046c31] overflow-hidden my-6">
            <div className="munafa-bg-header bg-[#034720] text-white px-6 py-4 border-b-2 border-[#d4af37]">
              <h3 className="text-base font-extrabold text-white mb-0.5">
                Admin Account Editor — Correct Info & Fix Errors
              </h3>
              <p className="text-xs text-[#fef08a] font-semibold">
                Correct inaccurate registration, tax, or subscription details for Account #{editingAccount.accountNumber}.
              </p>
            </div>
            <div className="p-6">

            <form onSubmit={handleSaveAccountEdits} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-extrabold text-stone-800 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 uppercase mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editingAccount.address}
                  onChange={(e) => setEditingAccount({ ...editingAccount, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.phone}
                    onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingAccount.email}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">CNIC (13 Digits)</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.cnic}
                    onChange={(e) => setEditingAccount({ ...editingAccount, cnic: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-stone-800 uppercase mb-1">NTN Number</label>
                  <input
                    type="text"
                    value={editingAccount.ntn || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, ntn: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {editingAccount.accountType !== 'admin' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-extrabold text-stone-800 uppercase mb-1">Account Type</label>
                    <select
                      value={editingAccount.accountType}
                      onChange={(e) => {
                        const nextType = e.target.value as AccountType;
                        setEditingAccount({
                          ...editingAccount,
                          accountType: nextType,
                          subscription: {
                            ...editingAccount.subscription,
                            cycle: nextType === 'farmer_mining' ? 'yearly' : 'monthly',
                            feePkr:
                              nextType === 'farmer_mining'
                                ? 2000
                                : nextType === 'factory'
                                ? 2000
                                : nextType === 'wholesaler'
                                ? 1500
                                : 0,
                          },
                        });
                      }}
                      className="w-full px-2.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="customer">Buyer</option>
                      <option value="farmer_mining">Farmer / Mining</option>
                      <option value="factory">Factory</option>
                      <option value="wholesaler">Wholesaler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-stone-800 uppercase mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editingAccount.subscription?.dueDate || ''}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          subscription: { ...editingAccount.subscription, dueDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-stone-800 uppercase mb-1">4-Digit PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editingAccount.pin}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      className="w-full px-2.5 py-2 border-2 border-stone-300 rounded-xl text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-emerald-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 font-bold text-[#023819] hover:text-[#046c31] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 munafa-green-btn font-extrabold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Corrections
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
      {/* Deactivate Account Reason Modal */}
      {freezeTargetAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={confirmManualFreeze}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-600 overflow-hidden"
          >
            <div className="bg-amber-800 text-white px-6 py-4 border-b border-amber-900">
              <h3 className="text-base font-black">
                Deactivate Account — Acc #{freezeTargetAcc}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase mb-1">
                  Reason for Deactivation
                </label>
                <input
                  type="text"
                  required
                  value={freezeReasonInput}
                  onChange={(e) => setFreezeReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-stone-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFreezeTargetAcc(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Remove Product Ad Confirmation Modal */}
      {deleteConfirmAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-red-700 overflow-hidden">
            <div className="bg-red-800 text-white px-6 py-4 border-b border-red-900">
              <h3 className="text-base font-black">
                Remove Ad From All Panels?
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-800 font-bold leading-relaxed">
                This will permanently remove <span className="font-black">"{deleteConfirmAd.title}"</span> ({deleteConfirmAd.id}) from Main Page, sector panels, and Seller Desk.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmAd(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveAd}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Remove Ad Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deleteConfirmAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-red-700 overflow-hidden">
            <div className="bg-red-800 text-white px-6 py-4 border-b border-red-900">
              <h3 className="text-base font-black">
                Delete Account #{deleteConfirmAcc}?
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-700 font-bold">
                This action permanently deletes the selected account from the marketplace directory.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmAcc(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Year Inactivity Policy Gate Modal */}
      {deletionPolicyModalAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-600 overflow-hidden">
            <div className="bg-[#034720] text-white px-6 py-4 border-b-2 border-[#d4af37]">
              <h3 className="text-base font-black text-[#fef08a]">
                5-Year Inactivity Deletion Policy
              </h3>
              <p className="text-xs text-emerald-100 font-semibold">
                Account #{deletionPolicyModalAcc.accountNumber} ({deletionPolicyModalAcc.name})
              </p>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {(() => {
                const elig = LocalEdgeDb.getDeletionEligibility(deletionPolicyModalAcc);
                return (
                  <>
                    <p className="text-stone-900 font-bold leading-relaxed bg-amber-50 border border-amber-400 p-3 rounded-xl">
                      {elig.reason}
                    </p>
                    <ul className="space-y-1.5 font-bold text-stone-800">
                      <li>
                        • Prior Inactivity Warning:{' '}
                        <span className={elig.hasWarning ? 'text-emerald-700' : 'text-red-700'}>
                          {elig.hasWarning ? 'Issued' : 'Not Yet Issued'}
                        </span>
                      </li>
                      <li>
                        • Five (5) Years Inactivity:{' '}
                        <span className={elig.hasFiveYearsInactivity ? 'text-emerald-700' : 'text-red-700'}>
                          {elig.hasFiveYearsInactivity
                            ? `Met (${elig.inactiveYears} yrs)`
                            : `Not Yet Met (${elig.inactiveYears} / 5 yrs)`}
                        </span>
                      </li>
                    </ul>
                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletionPolicyModalAcc(null)}
                        className="px-4 py-2 font-bold text-stone-700 cursor-pointer"
                      >
                        Close
                      </button>
                      {!elig.hasWarning && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSend5YearWarning(deletionPolicyModalAcc.accountNumber);
                            setDeletionPolicyModalAcc(null);
                          }}
                          className="px-4 py-2 munafa-gold-btn rounded-xl font-black cursor-pointer"
                        >
                          Issue Inactivity Warning Now
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Payment Slip Receipt Inspection & Reactivation Modal */}
      {paymentReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-[#046c31] overflow-hidden">
            <div className="bg-[#034720] text-white px-6 py-4 border-b-2 border-[#d4af37] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Subscription Payment Verification</h3>
                <p className="text-xs text-[#fef08a] font-mono font-bold">
                  Acc #{paymentReceiptModal.accountNumber} · Ref #{paymentReceiptModal.refNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentReceiptModal(null)}
                className="p-1 text-white hover:text-[#fef08a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl space-y-1 font-bold text-[#023819]">
                <div>Business: {paymentReceiptModal.name}</div>
                <div>Expected Fee: PKR {paymentReceiptModal.feePkr.toLocaleString()}</div>
                <div>Transaction Ref: {paymentReceiptModal.refNumber}</div>
              </div>

              {paymentReceiptModal.receiptUrl ? (
                <div className="border-2 border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                  <img
                    src={paymentReceiptModal.receiptUrl}
                    alt="Submitted payment slip"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 bg-stone-50 border border-stone-300 rounded-xl text-center text-stone-600 font-bold">
                  No receipt image attached; verify Transaction Reference #{paymentReceiptModal.refNumber} in Munafa Bank/JazzCash statement.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentReceiptModal(null)}
                  className="px-4 py-2 font-bold text-stone-700 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUnfreeze(paymentReceiptModal.accountNumber);
                    setPaymentReceiptModal(null);
                  }}
                  className="px-5 py-2.5 munafa-green-btn rounded-xl font-black cursor-pointer shadow-xs"
                >
                  Verify Payment & Activate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
