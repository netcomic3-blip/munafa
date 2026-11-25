/**
 * MUNAFA Zero-Cost Main Coordinator & Per-User Device Database Console
 * Main Registry handles lightweight auth & catalog routing at $0.00 storage cost.
 * Once a user logs in, their mobile phone, PC, or laptop mounts an isolated Device DB Node
 * to store/fetch their records, process searches, and handle networking with 0 cost to Main DB.
 */

import React, { useState, useEffect } from 'react';
import { LocalEdgeDb, EdgeStorageDiagnostics } from '../services/localEdgeDb';
import { MountedUserDeviceInfo, UserAccount } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { scanSystemConnectionsAndAssets, getBlockedThreats, SecurityScanReport } from '../utils/security';
import {
  HardDrive,
  Cpu,
  ShieldCheck,
  Zap,
  Download,
  RotateCcw,
  Activity,
  Server,
  CheckCircle2,
  FileJson,
  Coins,
  Network,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface EdgeDbViewProps {
  currentUser?: UserAccount | null;
}

export const EdgeDbView: React.FC<EdgeDbViewProps> = ({ currentUser }) => {
  const { isUrdu } = useLanguage();
  const [diagnostics, setDiagnostics] = useState<EdgeStorageDiagnostics>(() => LocalEdgeDb.getDiagnostics());
  const [mountedNode, setMountedNode] = useState<MountedUserDeviceInfo | null>(() =>
    LocalEdgeDb.getMountedUserDeviceInfo()
  );
  const [healReport, setHealReport] = useState<{ repairedItemsCount: number; report: string[] } | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityScanReport | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setDiagnostics(LocalEdgeDb.getDiagnostics());
      setMountedNode(LocalEdgeDb.getMountedUserDeviceInfo());
    };
    refresh();
    return LocalEdgeDb.subscribe(refresh);
  }, [currentUser?.accountNumber]);

  const handleRunHealthCheck = () => {
    const res = LocalEdgeDb.runSelfHealingAudit();
    setHealReport(res);
    const sec = scanSystemConnectionsAndAssets({
      accounts: LocalEdgeDb.getAccounts(),
      products: LocalEdgeDb.getProducts(),
      messages: LocalEdgeDb.getMessages(),
    });
    setSecurityReport(sec);
    setDiagnostics(LocalEdgeDb.getDiagnostics());
  };

  const handleSyncFromCentral = () => {
    setIsSyncing(true);
    setSyncStatus(null);
    setTimeout(() => {
      LocalEdgeDb.init();
      if (currentUser) {
        const node = LocalEdgeDb.fetchUserRecordsToDevice(currentUser.accountNumber);
        setMountedNode(node);
      }
      setDiagnostics(LocalEdgeDb.getDiagnostics());
      setIsSyncing(false);
      setSyncStatus(
        isUrdu
          ? 'مرکزی لاگ اِن رجسٹری سے آپ کا ذاتی ریکارڈ کامیابی سے آپ کی ڈیوائس نوڈ میں منتقل ہو گیا ہے۔ مرکزی ڈیٹا بیس لاگت 0 روپے ہے۔'
          : 'User login & personal records fetched directly to your isolated Device Database Node. Main coordinator hosting cost remains $0.00.'
      );
    }, 350);
  };

  const handleExportBackup = () => {
    const targetAcc = currentUser?.accountNumber;
    const data = targetAcc
      ? {
          node: LocalEdgeDb.getMountedUserDeviceInfo(),
          orders: LocalEdgeDb.getOrdersForAccount(targetAcc),
          messages: LocalEdgeDb.getMessagesForAccount(targetAcc),
          products: LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber === targetAcc),
          contacts: LocalEdgeDb.getContacts(targetAcc),
          timestamp: new Date().toISOString(),
          engine: 'Munafa Per-User Device Node v2',
        }
      : {
          accounts: LocalEdgeDb.getAccounts(),
          products: LocalEdgeDb.getProducts(),
          orders: LocalEdgeDb.getOrders(),
          messages: LocalEdgeDb.getMessages(),
          timestamp: new Date().toISOString(),
          engine: 'Munafa Main Registry Snapshot v2',
        };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetAcc
      ? `Munafa_User_Node_${targetAcc}_${Date.now()}.json`
      : `Munafa_Device_Database_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetSeed = async () => {
    await LocalEdgeDb.resetDeviceDatabase();
    setDiagnostics(LocalEdgeDb.getDiagnostics());
    window.location.reload();
  };

  const blockedThreats = getBlockedThreats();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Zero Cost Architecture Banner */}
      <div className="bg-white border-2 border-[#046c31] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-36 h-[72px] shrink-0 rounded-xl bg-white border-2 border-[#d4af37] px-2 py-1 items-center justify-center shadow-xs">
              <img
                src="/assets/aistudio/image_65c6c502.png"
                alt="MUNAFA"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-[#046c31] uppercase tracking-widest">
                <Zap className="w-4 h-4 text-[#046c31]" />
                <span>
                  {isUrdu
                    ? 'صفر لاگت مین رجسٹری و صارف ڈیوائس ڈیٹا بیس'
                    : 'ZERO-COST MAIN COORDINATOR + PER-USER DEVICE DATABASE ENGINE'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#023819] tracking-tight">
                {isUrdu
                  ? 'ہر صارف کی ڈیوائس بطور ڈیٹا بیس نوڈ اور فرسٹ سیکنڈ سائبر شیلڈ'
                  : 'Per-User Device Database & 1st-Second Hacker Firewall'}
              </h1>
              <p className="text-xs text-stone-800 font-bold max-w-3xl leading-relaxed">
                {isUrdu
                  ? 'مرکزی سسٹم صرف صارفین کے لاگ اِن کی تصدیق اور راستہ فراہم کرتا ہے جس کی لاگت 0 روپے ہے۔ لاگ اِن ہوتے ہی آپ کا موبائل، لیپ ٹاپ یا پی سی خود ایک مکمل ڈیٹا بیس نوڈ بن جاتا ہے اور تمام آرڈرز، پیغامات، بل اور سرچنگ ڈیوائس پر چلاتا ہے۔'
                  : 'Main registry handles lightweight routing & login verification at $0.00 storage cost. Every logged-in user’s device mounts its own isolated IndexedDB node, fetches personal records on login, and handles networking locally.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncFromCentral}
              disabled={isSyncing}
              className="py-2.5 px-4 munafa-green-btn rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? isUrdu
                    ? 'ریکارڈز ڈیوائس پر آ رہے ہیں...'
                    : 'Fetching to Device...'
                  : isUrdu
                  ? 'ریکارڈز ڈیوائس پر تازہ کریں'
                  : 'Fetch Records to Device'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRunHealthCheck}
              className="py-2.5 px-4 munafa-gold-btn rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-[#052e16]" />
              <span>{isUrdu ? 'سیکیورٹی و ہیلتھ اسکین' : 'Run Security & Health Scan'}</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-4 p-3.5 bg-[#eef7f1] border-2 border-[#046c31] rounded-xl text-xs font-black text-[#023819] flex items-center justify-between gap-3">
            <span>{syncStatus}</span>
            <button type="button" onClick={() => setSyncStatus(null)} className="underline cursor-pointer shrink-0">
              {isUrdu ? 'بند کریں' : 'Dismiss'}
            </button>
          </div>
        )}
      </div>

      {/* Active Logged-In User Device Node Banner */}
      <div className="bg-white border-2 border-emerald-700/40 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#034720] text-[#fef08a] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-extrabold text-[#046c31]">
                {isUrdu ? 'موجودہ فعال صارف ڈیوائس نوڈ' : 'Active Logged-In User Device Node'}
              </div>
              <div className="text-sm font-black text-[#023819]">
                {mountedNode
                  ? `${mountedNode.userName} (#${mountedNode.accountNumber})`
                  : isUrdu
                  ? 'مہمان موڈ — لاگ اِن پر ذاتی ڈیوائس نوڈ لوڈ ہوگا'
                  : 'Guest Browsing — Personal Device DB Node mounts automatically on login'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#f4faf6] border border-emerald-300 text-[#023819] font-mono font-bold text-[11px]">
              {diagnostics.deviceType} · {diagnostics.cpuCores} Cores · {diagnostics.deviceMemoryGb} GB RAM
            </span>
            {mountedNode && (
              <span className="px-3 py-1 rounded-lg bg-[#eef7f1] border border-[#046c31] text-[#023819] font-mono font-black text-[11px]">
                {mountedNode.nodeKey} · {(mountedNode.nodeBytes / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        {mountedNode && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs">
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'آپ کے آرڈرز' : 'Device Orders'}</span>
              <span className="text-lg font-black font-mono text-[#023819] tabular-nums">{mountedNode.userOrdersCount}</span>
            </div>
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'چیٹ پیغامات' : 'Device Messages'}</span>
              <span className="text-lg font-black font-mono text-[#023819] tabular-nums">{mountedNode.userMessagesCount}</span>
            </div>
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'رابطہ فہرست' : 'Synced Contacts'}</span>
              <span className="text-lg font-black font-mono text-[#023819] tabular-nums">{mountedNode.userContactsCount}</span>
            </div>
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'مقامی پروسیسنگ' : 'Local Compute'}</span>
              <span className="text-sm font-black font-mono text-[#023819] tabular-nums">
                {(mountedNode.lastComputeMs ?? diagnostics.lastComputeMs).toFixed(1)} ms
              </span>
            </div>
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'مستقل اسٹوریج' : 'Device Storage Quota'}</span>
              <span className="text-sm font-black font-mono text-[#023819] tabular-nums">
                {diagnostics.storageQuotaMb > 0 ? `${diagnostics.storageQuotaMb.toLocaleString()} MB` : 'IndexedDB Ready'}
              </span>
            </div>
            <div className="bg-[#f4faf6] border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-stone-600 block">{isUrdu ? 'پیئر میش نیٹ ورک' : 'Networking Node'}</span>
              <span className="text-sm font-black text-[#046c31]">
                {mountedNode.networkStatus || diagnostics.networkStatus}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4 Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider">
              {isUrdu ? 'مین ڈیٹا بیس لاگت' : 'Main DB Hosting Cost'}
            </span>
            <Coins className="w-4 h-4 text-[#046c31]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#046c31] tabular-nums">
            {isUrdu ? '0 روپے ($0.00)' : '$0.00 / PKR 0'}
          </div>
          <p className="text-[11px] text-stone-700 font-bold mt-1">
            {isUrdu
              ? `مین لاگ اِن انڈیکس صرف ${(diagnostics.mainCoordinatorBytes / 1024).toFixed(1)} KB`
              : `Login & Routing Coordinator only (${(diagnostics.mainCoordinatorBytes / 1024).toFixed(1)} KB); all load runs on user devices`}
          </p>
        </div>

        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider">
              {isUrdu ? 'ڈیوائس لوکل اسٹوریج' : 'Device Server Storage'}
            </span>
            <HardDrive className="w-4 h-4 text-[#046c31]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#023819] tabular-nums">
            {(diagnostics.totalStorageBytes / 1024).toFixed(1)} KB
          </div>
          <p className="text-[11px] text-stone-700 font-bold mt-1">
            {diagnostics.persistentStorageGranted
              ? `Persistent Storage Granted · ${diagnostics.storageEngine}`
              : diagnostics.storageEngine}
          </p>
        </div>

        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider">
              {isUrdu ? 'کل ڈیوائس ریکارڈز' : 'Total Synced Records'}
            </span>
            <FileJson className="w-4 h-4 text-[#046c31]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#023819] tabular-nums">
            {diagnostics.totalRecordsCount} {isUrdu ? 'آئٹمز' : 'Records'}
          </div>
          <p className="text-[11px] text-stone-700 font-bold mt-1">
            {diagnostics.accountsCount} accs · {diagnostics.productsCount} items · {diagnostics.ordersCount} orders
          </p>
        </div>

        <div className="bg-white border-2 border-red-700/40 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-900 mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider">
              {isUrdu ? 'فرسٹ سیکنڈ ہیکر بلاکس' : '1st-Second Threat Blocks'}
            </span>
            <ShieldAlert className="w-4 h-4 text-red-700" />
          </div>
          <div className="text-2xl font-black font-mono text-red-800 tabular-nums">
            {blockedThreats.length}
          </div>
          <p className="text-[11px] text-stone-700 font-bold mt-1">
            {isUrdu ? 'کوڈ، اسکرپٹ و اے آئی پے لوڈ فوری بلاک' : 'Code, script, binary & AI-injection firewall active'}
          </p>
        </div>
      </div>

      {/* Diagnostic & Security Scan Results */}
      {(healReport || securityReport) && (
        <div className="bg-[#eef7f1] border-2 border-[#046c31] rounded-2xl p-5 text-xs text-[#023819] space-y-2">
          <div className="flex items-center gap-2 font-black text-sm text-[#023819]">
            <CheckCircle2 className="w-5 h-5 text-[#046c31]" />
            <span>{isUrdu ? 'سیکیورٹی شیلڈ اور ڈیٹا آڈٹ مکمل' : '1st-Second Cyber-Shield & Device DB Audit Complete'}</span>
          </div>
          {healReport && (
            <p className="font-bold">
              {healReport.repairedItemsCount === 0
                ? '100% record schema integrity verified on your device.'
                : `Auto-repaired ${healReport.repairedItemsCount} record(s).`}
            </p>
          )}
          {securityReport && (
            <p className="font-bold">
              Shield Engine: {securityReport.shieldEngineVersion} · Status: {securityReport.overallStatus.toUpperCase()} · Scanned{' '}
              {securityReport.scannedDomElements} DOM nodes & {securityReport.scannedRecordsCount} records.
            </p>
          )}
        </div>
      )}

      {/* Architecture Rules & Backup */}
      <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#f4faf6] border border-emerald-200 rounded-xl space-y-1.5">
            <div className="font-black text-[#023819] flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#046c31]" />
              <span>{isUrdu ? '۱. صفر لاگت مین رجسٹری' : '1. Zero-Cost Main Coordinator'}</span>
            </div>
            <p className="text-stone-700 font-bold leading-relaxed">
              Main registry coordinates account ID routing and login verification only—carrying $0.00 storage or compute fees.
            </p>
          </div>

          <div className="p-4 bg-[#f4faf6] border border-emerald-200 rounded-xl space-y-1.5">
            <div className="font-black text-[#023819] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#046c31]" />
              <span>{isUrdu ? '۲. لاگ اِن ڈیوائس بطور ڈیٹا بیس' : '2. Logged-In Device Node'}</span>
            </div>
            <p className="text-stone-700 font-bold leading-relaxed">
              Upon login, your phone or laptop mounts its isolated IndexedDB node, fetches personal records, and processes networking locally.
            </p>
          </div>

          <div className="p-4 bg-[#f4faf6] border border-emerald-200 rounded-xl space-y-1.5">
            <div className="font-black text-[#023819] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#046c31]" />
              <span>{isUrdu ? '۳. فرسٹ سیکنڈ ہیکر و کوڈ فائر وال' : '3. 1st-Second Code & AI Blocker'}</span>
            </div>
            <p className="text-stone-700 font-bold leading-relaxed">
              Any attempt to upload source code, scripts, malware, disguised polyglots, or AI prompt-injections is blocked in the 1st second.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-4 munafa-green-btn rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-white" />
            <span>
              {isUrdu ? 'میرا ڈیوائس ڈیٹا بیک اپ ڈاؤن لوڈ کریں (JSON)' : 'Export My Device Node Backup (JSON)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetSeed}
            className="py-2.5 px-4 bg-[#eef7f1] hover:bg-[#dcfce7] text-[#023819] border-2 border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#046c31]" />
            <span>{isUrdu ? 'ڈیفالٹ ڈیٹا ری سیٹ کریں' : 'Reset Device Database Seed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
