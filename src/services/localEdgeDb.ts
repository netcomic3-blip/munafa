/**
 * MUNAFA Local Edge Database Engine
 * Zero-Cost Client-Device Storage with Automated AI Self-Healing & Subscription Engine
 */

import {
  UserAccount,
  ProductItem,
  OrderItem,
  ChatMessage,
  ChatThread,
  FreezeLogEntry,
  AgentLogEntry,
  MobileNotification,
  AccountType,
  OrderStatus,
  MunafaBankDetails,
  ContactEntry,
  FraudAlert,
  DisputeReport,
  SharedInboxConfig,
  MountedUserDeviceInfo,
} from '../types';
import {
  safeJsonParse,
  isSafeMediaUrl,
  scanPayloadForThreats,
  sanitizeTextInput,
  checkRateLimit,
  resetRateLimit,
  getBlockedThreats,
} from '../utils/security';
import {
  BUNDLED_PRODUCT_ASSETS,
  LEGACY_ASSET_PATH_MAP,
  getFallbackProductImage,
} from '../assets/productAssets';

const STORAGE_PREFIX = 'munafa_edge_v1_';
const USER_NODE_PREFIX = 'munafa_user_node_';
const ACTIVE_SESSION_KEY = 'munafa_edge_active_session';
const EDGE_IDB_NAME = 'munafa_unlimited_edge_db';
const EDGE_IDB_STORE = 'edge_kv';

export const createAvatarSvg = (initials: string, bg = '#065f46'): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fef08a" font-family="Arial,sans-serif" font-weight="800" font-size="56">${initials}</text></svg>`
  )}`;

export const INITIAL_BANK_DETAILS: MunafaBankDetails = {
  bankName: 'Meezan Bank Limited (Premier Islamic Banking)',
  accountTitle: 'Wage',
  accountNumber: '02840192840182',
  iban: 'PK36MEZN0002840192840182',
  branchCode: '0284 (Gulberg III Commercial Branch)',
  branchCity: 'Lahore, Punjab, Pakistan',
  jazzCashTitle: 'Wage Official Direct',
  jazzCashNumber: '0300-1234567',
  easyPaisaTitle: 'Wage Official Merchant',
  easyPaisaNumber: '0345-7654321',
  orderFeePkr: 0,
  aiAutoVerifyEnabled: false,
  verificationDelaySeconds: 60,
};

export const INITIAL_INBOX_CONFIG: SharedInboxConfig = {
  aiConciergeEnabled: true,
  allowFileAttachments: true,
  allowAudioVideoCalls: true,
  autoWelcomeMessageEnabled: true,
  showFbrTaxAndInsuranceNotice: true,
  maxAttachmentKb: 5120,
  broadcastSenderName: 'Munafa Staff Broadcast',
  defaultWelcomeBanner:
    'Welcome to Munafa Shared Inbox — Verified 8-digit Trade Messaging, Audio/Video Calling & Official FBR Invoicing.',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

export interface EdgeStorageDiagnostics {
  totalStorageBytes: number;
  deviceStorageBytes: number;
  mainCoordinatorBytes: number;
  totalRecordsCount: number;
  accountsCount: number;
  productsCount: number;
  ordersCount: number;
  messagesCount: number;
  deviceType: 'Mobile Phone' | 'Tablet' | 'Laptop / PC';
  cpuCores: number;
  deviceMemoryGb: number;
  persistentStorageGranted: boolean;
  storageQuotaMb: number;
  storageUsageKb: number;
  networkStatus: 'Online Peer Mesh' | 'Offline-First Device DB';
  lastComputeMs: number;
  isEdgeModeActive: boolean;
  lastSelfHealingCheck: string;
  healingEventsLogged: number;
  centralDbCostUsd: number;
  centralDbCostPkr: number;
  deviceNodeRole: string;
  deviceMemoryAllocatedMb: number;
  deviceNetworkingMode: string;
  storageEngine: string;
  blockedThreatsCount: number;
}

// Initial Seed Data for realistic Pakistani marketplace operation
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    accountNumber: 'admin',
    pin: '0000',
    name: 'Munafa Staff Admin HQ',
    accountType: 'admin',
    address: 'Munafa Central Operations, Gulberg III, Lahore, Punjab',
    phone: '+92 42 35789000',
    email: 'admin@munafa.pk',
    cnic: '35201-1122334-1',
    photoUrl: createAvatarSvg('HQ', '#023819'),
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      cycle: 'yearly',
      feePkr: 0,
      dueDate: '2030-01-01',
    },
  },
  {
    accountNumber: '71029415',
    pin: '1234',
    name: 'Chaudhry Aslam Agro & Minerals',
    accountType: 'farmer_mining',
    address: 'Chak 42, Muridke-Narowal Road, Sheikhupura / Khewra Outpost',
    phone: '+92 300 4819203',
    email: 'chaudhry.agro@munafa.pk',
    cnic: '35404-8920194-3',
    ntn: '2849102-4',
    photoUrl: createAvatarSvg('CA', '#065f2e'),
    createdAt: '2026-01-15T10:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      cycle: 'yearly',
      feePkr: 2000,
      dueDate: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
      lastPaidAt: '2026-01-15',
    },
  },
  {
    accountNumber: '82940173',
    pin: '1234',
    name: 'Sialkot Precision Steel & Instruments',
    accountType: 'factory',
    address: 'Small Industrial Estate II, Daska Road, Sialkot',
    phone: '+92 321 9840192',
    email: 'sialkot.steel@munafa.pk',
    cnic: '34603-9182304-7',
    ntn: '1948203-1',
    photoUrl: createAvatarSvg('SP', '#064e3b'),
    createdAt: '2026-02-01T08:30:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      cycle: 'monthly',
      feePkr: 2000,
      dueDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
      lastPaidAt: '2026-02-01',
    },
  },
  {
    accountNumber: '93810245',
    pin: '1234',
    name: 'Akbari Mandi Commodities Wholesale',
    accountType: 'wholesaler',
    address: 'Circular Road, Inside Delhi Gate, Akbari Mandi, Lahore',
    phone: '+92 333 7654321',
    email: 'akbari.wholesale@munafa.pk',
    cnic: '35202-4819203-5',
    ntn: '5829104-7',
    photoUrl: createAvatarSvg('AM', '#047857'),
    createdAt: '2026-02-10T11:15:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      cycle: 'monthly',
      feePkr: 1500,
      dueDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
      lastPaidAt: '2026-02-10',
    },
  },
  {
    accountNumber: '10928374',
    pin: '1234',
    name: 'Tariq Road Superstore & Trade',
    accountType: 'customer',
    address: 'Shop 14-B, Tariq Road Commercial Area, PECHS, Karachi',
    phone: '+92 312 9988776',
    email: 'tariq.trade@munafa.pk',
    cnic: '42101-8374920-1',
    photoUrl: createAvatarSvg('TR', '#065f46'),
    createdAt: '2026-02-15T14:20:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      cycle: 'yearly',
      feePkr: 0,
      dueDate: '2099-01-01',
    },
  },
  {
    accountNumber: '65109284',
    pin: '1234',
    name: 'Khyber Industrial Spares & Castings',
    accountType: 'factory',
    address: 'Hayatabad Industrial Estate, Phase 7, Peshawar, KPK',
    phone: '+92 345 5544332',
    email: 'khyber.castings@munafa.pk',
    cnic: '17301-6510928-9',
    ntn: '7729103-9',
    photoUrl: createAvatarSvg('KI', '#7f1d1d'),
    createdAt: '2026-01-05T09:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    subscription: {
      status: 'frozen',
      cycle: 'monthly',
      feePkr: 2000,
      dueDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      daysOverdue: 4,
      amountOwed: 2000,
    },
  },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-101',
    sellerAccountNumber: '71029415',
    sellerName: 'Chaudhry Aslam Agro & Minerals',
    sellerPhone: '+92 300 4819203',
    title: 'Super Kernel Basmati Rice — Export Quality',
    description: 'Aged 2 years, ultra-long grain naturally fragrant Basmati directly from Sheikhupura fields. Tested moisture < 12%, double polished, 100% sortexed clean.',
    category: 'farm_mining',
    unit: 'bag',
    pricePerUnit: 14500, // PKR 14,500 per 50kg bag
    taxRatePercent: 18,
    taxAmountPkr: 2610,
    quantityAvailable: 340,
    minOrderQty: 1,
    city: 'Sheikhupura',
    imageUrl: BUNDLED_PRODUCT_ASSETS.basmatiRiceImg,
    createdAt: '2026-02-18T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-102',
    sellerAccountNumber: '71029415',
    sellerName: 'Chaudhry Aslam Agro & Minerals',
    sellerPhone: '+92 300 4819203',
    title: 'Pure Pink Himalayan Rock Salt Raw Lumps',
    description: 'Directly sourced from Khewra Salt Mine veins. Food-grade and bath therapy raw crystalline salt boulders, deep pink to translucent amber hue.',
    category: 'farm_mining',
    unit: 'ton',
    pricePerUnit: 48000,
    taxRatePercent: 18,
    taxAmountPkr: 8640,
    quantityAvailable: 85,
    minOrderQty: 1,
    city: 'Khewra / Jhelum',
    imageUrl: BUNDLED_PRODUCT_ASSETS.pinkSaltImg,
    createdAt: '2026-02-19T14:30:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-103',
    sellerAccountNumber: '82940173',
    sellerName: 'Sialkot Precision Steel & Instruments',
    sellerPhone: '+92 321 9840192',
    title: 'German Grade Surgical Forceps & Scissors Set',
    description: 'Forged AISI 420 Japanese/German stainless steel medical instruments. Autoclavable up to 134°C, ISO 13485 & CE certified, manufactured in Sialkot.',
    category: 'factory',
    unit: 'dozen',
    pricePerUnit: 8900,
    taxRatePercent: 18,
    taxAmountPkr: 1602,
    quantityAvailable: 150,
    minOrderQty: 2,
    city: 'Sialkot',
    imageUrl: BUNDLED_PRODUCT_ASSETS.surgicalSteelImg,
    createdAt: '2026-02-20T11:00:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-104',
    sellerAccountNumber: '82940173',
    sellerName: 'Sialkot Precision Steel & Instruments',
    sellerPhone: '+92 321 9840192',
    title: 'Industrial Heavy Duty Water Pump 2.0 HP',
    description: '100% copper winding, high-pressure centrifugal water booster pump with cast iron casing. Built for continuous factory and commercial building duty.',
    category: 'factory',
    unit: 'piece',
    pricePerUnit: 26500,
    taxRatePercent: 18,
    taxAmountPkr: 4770,
    quantityAvailable: 60,
    minOrderQty: 1,
    city: 'Gujranwala / Sialkot',
    imageUrl: BUNDLED_PRODUCT_ASSETS.waterPumpImg,
    createdAt: '2026-02-21T09:15:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-105',
    sellerAccountNumber: '93810245',
    sellerName: 'Akbari Mandi Commodities Wholesale',
    sellerPhone: '+92 333 7654321',
    title: 'Wholesale Green Cardamom (Elaichi) Grade A',
    description: 'Fresh 8mm bold green cardamom pods, intense aroma and high essential oil content. Jute bulk packaged for spice stores, sweet shops, and tea blenders.',
    category: 'wholesale',
    unit: 'bag',
    pricePerUnit: 92000, // PKR 92,000 per 25kg carton
    taxRatePercent: 18,
    taxAmountPkr: 16560,
    quantityAvailable: 42,
    minOrderQty: 1,
    city: 'Lahore',
    imageUrl: BUNDLED_PRODUCT_ASSETS.greenCardamomImg,
    createdAt: '2026-02-22T13:45:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-106',
    sellerAccountNumber: '93810245',
    sellerName: 'Akbari Mandi Commodities Wholesale',
    sellerPhone: '+92 333 7654321',
    title: 'Heavy Denim Cotton Twill Fabric Rolls 14oz',
    description: 'Indigo dyed 100% spun cotton raw selvedge denim fabric, 58 inch width. Direct factory overrun ready for garment manufacturers and stitching units.',
    category: 'wholesale',
    unit: 'meter',
    pricePerUnit: 650,
    taxRatePercent: 18,
    taxAmountPkr: 117,
    quantityAvailable: 4500,
    minOrderQty: 100,
    city: 'Karachi / Lahore',
    imageUrl: BUNDLED_PRODUCT_ASSETS.denimFabricImg,
    createdAt: '2026-02-23T15:10:00.000Z',
    isActive: true,
  },
  {
    id: 'prod-107',
    sellerAccountNumber: '65109284',
    sellerName: 'Khyber Industrial Spares & Castings',
    sellerPhone: '+92 345 5544332',
    title: 'Ductile Iron Flanged Pipe Fittings (FROZEN LISTING)',
    description: 'High tensile flanged valves and reducers for agricultural tube wells. [Temporarily Hidden due to subscription pause]',
    category: 'factory',
    unit: 'piece',
    pricePerUnit: 11200,
    taxRatePercent: 18,
    taxAmountPkr: 2016,
    quantityAvailable: 20,
    minOrderQty: 1,
    city: 'Peshawar',
    imageUrl: BUNDLED_PRODUCT_ASSETS.waterPumpImg,
    createdAt: '2026-01-20T12:00:00.000Z',
    isActive: false, // Seller is frozen
  },
];

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord-849201',
    orderNumber: 'MNF-849201',
    buyerAccountNumber: '10928374',
    buyerName: 'Tariq Road Superstore & Trade',
    buyerPhone: '+92 312 9988776',
    buyerAddress: 'Shop 14-B, Tariq Road Commercial Area, PECHS, Karachi',
    sellerAccountNumber: '71029415',
    sellerName: 'Chaudhry Aslam Agro & Minerals',
    sellerPhone: '+92 300 4819203',
    sellerAddress: 'Chak 42, Muridke-Narowal Road, Sheikhupura',
    sellerNtn: '2849102-4',
    productId: 'prod-101',
    productTitle: 'Super Kernel Basmati Rice — Export Quality',
    unit: 'bag',
    quantity: 5,
    unitPrice: 14500,
    subtotal: 72500,
    gstAmount: 13050,
    deliveryFee: 0, // Zero platform or extra checkout fee
    grandTotal: 85550,
    fulfilmentType: 'cod',
    courierTrackingNo: 'TCS-EXP-9928174PK',
    status: 'dispatched',
    munafaFeePkr: 0,
    munafaFeeStatus: 'verified',
    munafaFeeChannel: 'bank',
    munafaFeeRef: 'FREE-ORDER',
    munafaFeePaidAt: '2026-03-01T10:14:00.000Z',
    createdAt: '2026-03-01T10:15:00.000Z',
    timeline: [
      {
        status: 'placed',
        timestamp: '2026-03-01T10:15:00.000Z',
        note: 'Order placed by Tariq Road Superstore. Selected Cash on Delivery with insured transit.',
      },
      {
        status: 'confirmed',
        timestamp: '2026-03-01T11:30:00.000Z',
        note: 'Confirmed by Chaudhry Aslam Agro. Stock verified and packaged in tamper-evident jute bags.',
      },
      {
        status: 'dispatched',
        timestamp: '2026-03-02T09:00:00.000Z',
        note: 'Handed over to insured freight carrier with transit insurance policy #INS-4910.',
      },
    ],
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    threadId: 'th_71029415_10928374',
    senderAccountNumber: '10928374',
    senderName: 'Tariq Road Superstore',
    recipientAccountNumber: '71029415',
    type: 'text',
    content: 'Assalam-o-Alaikum Chaudhry Sahib! How old is the harvest on this Super Kernel Basmati batch?',
    timestamp: '2026-03-01T09:45:00.000Z',
    isRead: true,
    delivered: true,
  },
  {
    id: 'msg-init-2',
    threadId: 'th_71029415_10928374',
    senderAccountNumber: '71029415',
    senderName: 'Chaudhry Aslam Agro',
    recipientAccountNumber: '10928374',
    type: 'text',
    content: 'Walaikum Assalam. It is completely naturally aged for 2 full crop seasons. Length cooks to over 8.2mm. We dispatch with insured transport.',
    timestamp: '2026-03-01T09:50:00.000Z',
    isRead: true,
    delivered: true,
  },
  {
    id: 'msg-init-3',
    threadId: 'th_71029415_10928374',
    senderAccountNumber: 'system',
    senderName: 'Munafa System',
    recipientAccountNumber: '10928374',
    type: 'order_update',
    content: 'Order #MNF-849201 has been placed for 5 bags (PKR 85,550 total — zero platform fees). Invoice PDF generated.',
    orderId: 'ord-849201',
    timestamp: '2026-03-01T10:15:00.000Z',
    isRead: true,
    delivered: true,
  },
];

const INITIAL_FREEZE_LOGS: FreezeLogEntry[] = [
  {
    id: 'frz-001',
    accountNumber: '65109284',
    accountName: 'Khyber Industrial Spares & Castings',
    accountType: 'factory',
    blockedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    amountOwed: 2000,
    daysOverdue: 4,
    resolutionStatus: 'blocked',
  },
];

const INITIAL_AGENT_LOGS: AgentLogEntry[] = [
  {
    id: 'agnt-log-1',
    userAccountNumber: '10928374',
    userName: 'Tariq Road Superstore',
    query: 'What are the rules for Cash on Delivery orders?',
    reply: 'On Munafa, Cash on Delivery requires the seller to dispatch goods strictly via an insured delivery service. The customer pays in cash at handover. Munafa does not hold funds or accept liability for transit loss or non-payment.',
    timestamp: '2026-03-01T08:30:00.000Z',
    isEscalated: false,
    adminTakenOver: false,
  },
];

let lastMeasuredComputeMs = 0.4;
const storageTelemetryCache = {
  persistentStorageGranted: false,
  storageQuotaMb: 0,
  storageUsageKb: 0,
  lastProbedAt: 0,
};

function detectDeviceClass(): 'Mobile Phone' | 'Tablet' | 'Laptop / PC' {
  if (typeof navigator === 'undefined') return 'Laptop / PC';
  const ua = navigator.userAgent || '';
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return 'Tablet';
  }
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || width < 640) {
    return 'Mobile Phone';
  }
  return 'Laptop / PC';
}

async function refreshStorageTelemetry(requestPersistence = false, onUpdated?: () => void): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage) return;
  try {
    if (requestPersistence && typeof navigator.storage.persist === 'function') {
      const persisted = await navigator.storage.persist();
      storageTelemetryCache.persistentStorageGranted = Boolean(persisted);
    } else if (typeof navigator.storage.persisted === 'function') {
      storageTelemetryCache.persistentStorageGranted = Boolean(await navigator.storage.persisted());
    }
    if (typeof navigator.storage.estimate === 'function') {
      const est = await navigator.storage.estimate();
      storageTelemetryCache.storageQuotaMb = est.quota
        ? Math.round(est.quota / (1024 * 1024))
        : 0;
      storageTelemetryCache.storageUsageKb = est.usage
        ? Math.round((est.usage / 1024) * 10) / 10
        : 0;
    }
    storageTelemetryCache.lastProbedAt = Date.now();
    if (onUpdated) onUpdated();
  } catch {
    // Non-fatal in restricted browser privacy modes
  }
}

// Helper to calculate local storage & zero-cost coordinator diagnostics safely
function getLocalDiagnostics(): EdgeStorageDiagnostics {
  const countedKeys = new Set<string>();
  let totalBytes = 0;
  let mainCoordinatorBytes = 0;

  try {
    const coordinatorKey = STORAGE_PREFIX + 'main_coordinator';
    const rawKeys = LocalEdgeDb.getStoredKeyEntries();
    for (const [key, val] of rawKeys) {
      countedKeys.add(key);
      const byteLen = (val.length + key.length) * 2;
      if (key === coordinatorKey) {
        mainCoordinatorBytes = byteLen;
      } else {
        totalBytes += byteLen;
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_PREFIX) || key.startsWith(USER_NODE_PREFIX)) && !countedKeys.has(key)) {
        const val = localStorage.getItem(key) || '';
        const byteLen = (val.length + key.length) * 2;
        if (key === coordinatorKey) {
          mainCoordinatorBytes = byteLen;
        } else {
          totalBytes += byteLen;
        }
      }
    }
  } catch {
    // Fallback cleanly if storage enumeration is restricted
  }

  const accounts = LocalEdgeDb.getAccounts();
  const products = LocalEdgeDb.getProducts();
  const orders = LocalEdgeDb.getOrders();
  const messages = LocalEdgeDb.getMessages();

  const deviceType = detectDeviceClass();
  const cpuCores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? Math.max(1, navigator.hardwareConcurrency)
      : 4;
  const navWithMem = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  const deviceMemoryGb =
    typeof navWithMem?.deviceMemory === 'number' && navWithMem.deviceMemory > 0
      ? navWithMem.deviceMemory
      : 4;
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  return {
    totalStorageBytes: totalBytes,
    deviceStorageBytes: totalBytes,
    mainCoordinatorBytes,
    totalRecordsCount: accounts.length + products.length + orders.length + messages.length,
    accountsCount: accounts.length,
    productsCount: products.length,
    ordersCount: orders.length,
    messagesCount: messages.length,
    deviceType,
    cpuCores,
    deviceMemoryGb,
    persistentStorageGranted: storageTelemetryCache.persistentStorageGranted,
    storageQuotaMb: storageTelemetryCache.storageQuotaMb,
    storageUsageKb: storageTelemetryCache.storageUsageKb,
    networkStatus: isOnline ? 'Online Peer Mesh' : 'Offline-First Device DB',
    lastComputeMs: lastMeasuredComputeMs,
    isEdgeModeActive: true,
    lastSelfHealingCheck: new Date().toLocaleTimeString(),
    healingEventsLogged: 0,
    centralDbCostUsd: 0,
    centralDbCostPkr: 0,
    deviceNodeRole: `Active ${deviceType} Server-DB Node`,
    deviceMemoryAllocatedMb: Math.max(0.48, Math.round((totalBytes / 1024 / 1024) * 100) / 100),
    deviceNetworkingMode: isOnline ? 'Browser Peer Mesh + Local Device DB' : '100% Offline Device Server DB',
    storageEngine: 'Per-User Device IndexedDB + $0.00 Login Coordinator',
    blockedThreatsCount: getBlockedThreats().length,
  };
}

function openEdgeIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(EDGE_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(EDGE_IDB_STORE)) {
          db.createObjectStore(EDGE_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeToIdb(key: string, value: string): Promise<void> {
  const db = await openEdgeIdb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(EDGE_IDB_STORE, 'readwrite');
      tx.objectStore(EDGE_IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Non-fatal fallback to memoryStore/localStorage
  }
}

async function readFromIdb(key: string): Promise<string | null> {
  const db = await openEdgeIdb();
  if (!db) return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(EDGE_IDB_STORE, 'readonly');
      const req = tx.objectStore(EDGE_IDB_STORE).get(key);
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearIdbStore(): Promise<void> {
  const db = await openEdgeIdb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(EDGE_IDB_STORE, 'readwrite');
      tx.objectStore(EDGE_IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Non-fatal fallback
  }
}

export class LocalEdgeDb {
  private static listeners: Set<() => void> = new Set();
  private static memoryStore: Record<string, string> = {};
  private static parsedCache: Map<string, unknown> = new Map();
  private static initialized = false;
  private static idbHydrated = false;
  private static dirtyKeys: Set<string> = new Set();
  private static mountedNodeInfo: MountedUserDeviceInfo | null = null;
  private static meshChannel: BroadcastChannel | null = null;
  private static windowListenersAttached = false;

  public static getStoredKeyEntries(): Array<[string, string]> {
    return Object.entries(LocalEdgeDb.memoryStore);
  }

  private static safeGetItem(key: string): string | null {
    if (Object.prototype.hasOwnProperty.call(LocalEdgeDb.memoryStore, key)) {
      return LocalEdgeDb.memoryStore[key];
    }
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        LocalEdgeDb.memoryStore[key] = val;
      }
      return val;
    } catch {
      return null;
    }
  }

  private static getParsed<T>(key: string, fallback: T): T {
    if (LocalEdgeDb.parsedCache.has(key)) {
      return LocalEdgeDb.parsedCache.get(key) as T;
    }
    const raw = LocalEdgeDb.safeGetItem(key);
    const parsed = safeJsonParse<T>(raw, fallback);
    LocalEdgeDb.parsedCache.set(key, parsed);
    return parsed;
  }

  private static getParsedArray<T>(key: string, fallback: T[]): T[] {
    const val = LocalEdgeDb.getParsed<T[]>(key, fallback);
    if (!Array.isArray(val)) {
      LocalEdgeDb.parsedCache.set(key, fallback);
      return fallback;
    }
    return val.filter((item) => item !== null && item !== undefined);
  }

  private static async hydrateFromIdb(): Promise<void> {
    if (LocalEdgeDb.idbHydrated) return;
    LocalEdgeDb.idbHydrated = true;
    const db = await openEdgeIdb();
    if (!db) return;
    try {
      const entries = await new Promise<Array<{ key: string; value: string }>>((resolve) => {
        const result: Array<{ key: string; value: string }> = [];
        const tx = db.transaction(EDGE_IDB_STORE, 'readonly');
        const store = tx.objectStore(EDGE_IDB_STORE);
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            if (typeof cursor.key === 'string' && typeof cursor.value === 'string') {
              result.push({ key: cursor.key, value: cursor.value });
            }
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        cursorReq.onerror = () => resolve(result);
      });

      let changed = false;
      for (const entry of entries) {
        if (
          (entry.key.startsWith(STORAGE_PREFIX) || entry.key.startsWith(USER_NODE_PREFIX)) &&
          !LocalEdgeDb.dirtyKeys.has(entry.key) &&
          LocalEdgeDb.memoryStore[entry.key] !== entry.value
        ) {
          LocalEdgeDb.memoryStore[entry.key] = entry.value;
          LocalEdgeDb.parsedCache.delete(entry.key);
          changed = true;
        }
      }
      if (changed) {
        LocalEdgeDb.notify();
      }
    } catch {
      // Ignore IndexedDB hydration errors cleanly
    }
  }

  private static compactJsonBlobs(key: string, jsonValue: string, aggressive = false): string {
    const maxDataUrlLen = aggressive ? 15_000 : 80_000;
    try {
      const parsed = JSON.parse(jsonValue);
      if (!Array.isArray(parsed)) return jsonValue;

      if (key === STORAGE_PREFIX + 'accounts') {
        return JSON.stringify(
          parsed.map((acc: UserAccount, index: number) => {
            const copy: UserAccount = { ...acc };
            const keepNewestPhoto = !aggressive && index >= parsed.length - 2;
            if (copy.photoUrl && copy.photoUrl.startsWith('data:') && !copy.photoUrl.startsWith('data:image/svg+xml') && copy.photoUrl.length > maxDataUrlLen && !keepNewestPhoto) {
              copy.photoUrl = createAvatarSvg((copy.name || 'MN').slice(0, 2).toUpperCase(), '#065f46');
            }
            if (copy.subscription?.pendingPaymentRef?.receiptUrl && copy.subscription.pendingPaymentRef.receiptUrl.length > maxDataUrlLen) {
              copy.subscription = {
                ...copy.subscription,
                pendingPaymentRef: {
                  ...copy.subscription.pendingPaymentRef,
                  receiptUrl: undefined,
                },
              };
            }
            return copy;
          })
        );
      }

      if (key === STORAGE_PREFIX + 'products') {
        return JSON.stringify(
          parsed.map((prod: ProductItem) => {
            if (prod.imageUrl && prod.imageUrl.startsWith('data:') && prod.imageUrl.length > maxDataUrlLen) {
              return { ...prod, imageUrl: getFallbackProductImage(prod.category, prod.city) };
            }
            return prod;
          })
        );
      }

      if (key === STORAGE_PREFIX + 'orders') {
        return JSON.stringify(
          parsed.map((ord: OrderItem) => {
            if (ord.munafaFeeReceiptUrl && ord.munafaFeeReceiptUrl.length > maxDataUrlLen) {
              return { ...ord, munafaFeeReceiptUrl: undefined };
            }
            return ord;
          })
        );
      }

      if (key === STORAGE_PREFIX + 'messages') {
        return JSON.stringify(
          parsed.map((msg: ChatMessage) => {
            if (msg.fileUrl && msg.fileUrl.length > maxDataUrlLen) {
              return { ...msg, fileUrl: undefined };
            }
            return msg;
          })
        );
      }

      if (key.startsWith(STORAGE_PREFIX + 'contacts_')) {
        return JSON.stringify(
          parsed.map((c: ContactEntry) => {
            if (c.photoUrl && c.photoUrl.startsWith('data:') && !c.photoUrl.startsWith('data:image/svg+xml') && c.photoUrl.length > 15_000) {
              return { ...c, photoUrl: createAvatarSvg((c.name || 'MN').slice(0, 2).toUpperCase(), '#065f46') };
            }
            return c;
          })
        );
      }

      if ((key === STORAGE_PREFIX + 'agent_log' || key === STORAGE_PREFIX + 'freeze_log') && aggressive && parsed.length > 50) {
        return JSON.stringify(parsed.slice(0, 50));
      }
    } catch {
      return jsonValue;
    }
    return jsonValue;
  }

  private static compactAllStoredKeys(aggressive: boolean) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX) && k !== STORAGE_PREFIX + 'main_coordinator') {
          keys.push(k);
        }
      }
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const compacted = LocalEdgeDb.compactJsonBlobs(k, raw, aggressive);
        if (compacted.length < raw.length) {
          try {
            // Never overwrite memoryStore or IndexedDB with compacted mirror data
            localStorage.setItem(k, compacted);
          } catch {
            // Continue compacting remaining localStorage keys
          }
        }
      }
    } catch {
      // Ignore storage enumeration errors
    }
  }

  private static broadcastRecordUpdate(key: string): void {
    if (key === STORAGE_PREFIX + 'main_coordinator') return;
    LocalEdgeDb.ensureMeshChannel();
    if (LocalEdgeDb.meshChannel) {
      try {
        LocalEdgeDb.meshChannel.postMessage({ type: 'EDGE_RECORD_UPDATE', key });
      } catch {
        // Non-fatal cross-tab post ignore
      }
    }
  }

  private static safeSetItem(key: string, value: string): void {
    // Always keep full uncompressed state in memory cache + IndexedDB (unlimited user capacity on user's device)
    LocalEdgeDb.dirtyKeys.add(key);
    LocalEdgeDb.memoryStore[key] = value;
    LocalEdgeDb.parsedCache.delete(key);
    void writeToIdb(key, value);

    try {
      localStorage.setItem(key, value);
      LocalEdgeDb.broadcastRecordUpdate(key);
      return;
    } catch {
      // localStorage 5MB limit reached — compact localStorage mirror ONLY while IndexedDB + memoryStore keep 100% full data
      LocalEdgeDb.compactAllStoredKeys(false);
      const compactedTarget = LocalEdgeDb.compactJsonBlobs(key, value, false);
      try {
        localStorage.setItem(key, compactedTarget);
        LocalEdgeDb.broadcastRecordUpdate(key);
        return;
      } catch {
        LocalEdgeDb.compactAllStoredKeys(true);
        const ultraCompactTarget = LocalEdgeDb.compactJsonBlobs(key, value, true);
        try {
          localStorage.setItem(key, ultraCompactTarget);
        } catch {
          // Offload heavy array mirror from localStorage cleanly so session + main_coordinator always stay writable;
          // full unlimited data stays safely stored in IndexedDB + memoryStore.
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignore cleanup failure
          }
        }
        LocalEdgeDb.broadcastRecordUpdate(key);
      }
    }
  }

  public static subscribe(callback: () => void): () => void {
    LocalEdgeDb.listeners.add(callback);
    return () => {
      LocalEdgeDb.listeners.delete(callback);
    };
  }

  private static syncMainCoordinatorRegistry(): number {
    const accounts = LocalEdgeDb.getAccounts();
    const products = LocalEdgeDb.getProducts();
    const coordinatorPayload = {
      hostingCostUsd: 0,
      hostingCostPkr: 0,
      architecture: 'Main Coordinator handles Login Verification & Routing Only; User Devices store & process records',
      activeCatalogCount: products.length,
      registeredUsers: accounts.map((acc) => ({
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        status: acc.isDeleted ? 'deleted' : acc.subscription.status,
        lastActiveAt: acc.lastActiveAt || acc.createdAt,
      })),
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(coordinatorPayload);
    const coordinatorKey = STORAGE_PREFIX + 'main_coordinator';
    LocalEdgeDb.memoryStore[coordinatorKey] = serialized;
    try {
      localStorage.setItem(coordinatorKey, serialized);
    } catch {
      // Non-fatal if browser storage full
    }
    void writeToIdb(coordinatorKey, serialized);
    return (serialized.length + coordinatorKey.length) * 2;
  }

  private static notify() {
    LocalEdgeDb.syncMainCoordinatorRegistry();
    if (LocalEdgeDb.mountedNodeInfo) {
      LocalEdgeDb.syncUserNodeSnapshot(LocalEdgeDb.mountedNodeInfo.accountNumber);
    }
    LocalEdgeDb.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in EdgeDb subscriber:', err);
      }
    });
  }

  /**
   * Initializes local storage and executes automated AI self-healing checks (idempotent)
   */
  public static init() {
    if (LocalEdgeDb.initialized) return;
    LocalEdgeDb.initialized = true;

    // Reclaim any legacy oversized image data URLs stored in localStorage mirror prior to IndexedDB upgrade
    LocalEdgeDb.compactAllStoredKeys(false);

    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'accounts')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(INITIAL_ACCOUNTS));
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'products')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'orders')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'orders', JSON.stringify(INITIAL_ORDERS));
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'messages')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'messages', JSON.stringify(INITIAL_MESSAGES));
    } else {
      // Sanitize legacy global 'th_agent_all' or recipient='all' messages into private concerned-user messages
      const existingMsgs = LocalEdgeDb.getMessages();
      const orders = LocalEdgeDb.getOrders();
      let msgChanged = false;
      const migratedMsgs: ChatMessage[] = [];
      for (const m of existingMsgs) {
        if (m.id === 'msg-agent-welcome') {
          msgChanged = true;
          continue;
        }
        if (m.threadId === 'th_agent_all') {
          const owner =
            m.senderAccountNumber !== '00000000' && m.senderAccountNumber !== 'system'
              ? m.senderAccountNumber
              : m.recipientAccountNumber !== 'all'
              ? m.recipientAccountNumber
              : null;
          if (!owner) {
            msgChanged = true;
            continue;
          }
          migratedMsgs.push({
            ...m,
            threadId: `th_agent_${owner}`,
            recipientAccountNumber: m.recipientAccountNumber === 'all' ? owner : m.recipientAccountNumber,
          });
          msgChanged = true;
          continue;
        }
        if (m.recipientAccountNumber === 'all') {
          const linkedOrder = m.orderId ? orders.find((o) => o.id === m.orderId) : undefined;
          if (linkedOrder) {
            migratedMsgs.push({ ...m, recipientAccountNumber: linkedOrder.buyerAccountNumber });
            if (linkedOrder.sellerAccountNumber !== linkedOrder.buyerAccountNumber) {
              migratedMsgs.push({
                ...m,
                id: `${m.id}-seller`,
                recipientAccountNumber: linkedOrder.sellerAccountNumber,
              });
            }
          }
          msgChanged = true;
          continue;
        }
        migratedMsgs.push(m);
      }
      if (msgChanged) {
        LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'messages', JSON.stringify(migratedMsgs));
      }
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'freeze_log')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'freeze_log', JSON.stringify(INITIAL_FREEZE_LOGS));
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'agent_log')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'agent_log', JSON.stringify(INITIAL_AGENT_LOGS));
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'bank_details')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'bank_details', JSON.stringify(INITIAL_BANK_DETAILS));
    } else {
      const bank = LocalEdgeDb.getBankDetails();
      let bankChanged = false;
      if (bank.accountTitle === 'Munafa Marketplace Pvt. Ltd.' || bank.accountTitle === 'Wage Marketplace Pvt. Ltd.') {
        bank.accountTitle = 'Wage';
        bankChanged = true;
      }
      if (bank.jazzCashTitle === 'Munafa Official Direct') {
        bank.jazzCashTitle = 'Wage Official Direct';
        bankChanged = true;
      }
      if (bank.easyPaisaTitle === 'Munafa Official Merchant') {
        bank.easyPaisaTitle = 'Wage Official Merchant';
        bankChanged = true;
      }
      if (bankChanged) {
        LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'bank_details', JSON.stringify(bank));
      }
    }
    if (!LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'inbox_config')) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'inbox_config', JSON.stringify(INITIAL_INBOX_CONFIG));
    } else {
      const cfg = LocalEdgeDb.getSharedInboxConfig();
      let cfgChanged = false;
      if (cfg.broadcastSenderName === 'Wage Staff Broadcast') {
        cfg.broadcastSenderName = 'Munafa Staff Broadcast';
        cfgChanged = true;
      }
      if (cfg.defaultWelcomeBanner.includes('Wage Shared Inbox')) {
        cfg.defaultWelcomeBanner = cfg.defaultWelcomeBanner.replace(/Wage/g, 'Munafa');
        cfgChanged = true;
      }
      if (cfgChanged) {
        LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'inbox_config', JSON.stringify(cfg));
      }
    }

    // Run Automated Self-Healing and Subscription Due-Date Checks on boot
    LocalEdgeDb.runSelfHealingAudit();
    LocalEdgeDb.runDailySubscriptionAutomation();
    LocalEdgeDb.ensureMeshChannel();
    LocalEdgeDb.syncMainCoordinatorRegistry();

    // Hydrate unlimited IndexedDB records & persistent storage telemetry asynchronously without blocking first paint
    void LocalEdgeDb.hydrateFromIdb();
    void refreshStorageTelemetry(false, () => {
      if (LocalEdgeDb.mountedNodeInfo) {
        LocalEdgeDb.syncUserNodeSnapshot(LocalEdgeDb.mountedNodeInfo.accountNumber);
      }
      LocalEdgeDb.listeners.forEach((cb) => {
        try {
          cb();
        } catch {
          // Ignore telemetry subscriber errors
        }
      });
    });
  }

  /**
   * Automated AI Self-Healing System:
   * Fixes data defects, enforces schema integrity, validates CNIC formats, and verifies product statuses.
   */
  public static runSelfHealingAudit(): { repairedItemsCount: number; report: string[] } {
    const report: string[] = [];
    let repairedItemsCount = 0;

    const accounts = LocalEdgeDb.getAccounts();
    const products = LocalEdgeDb.getProducts();

    // 1. Audit Accounts
    accounts.forEach((acc) => {
      if (acc.accountNumber !== 'admin' && acc.accountNumber.length !== 8) {
        report.push(`Fixed malformed account number for ${acc.name}`);
        repairedItemsCount++;
      }
      if (acc.photoUrl && acc.photoUrl.includes('images.unsplash.com')) {
        acc.photoUrl = createAvatarSvg(acc.name.slice(0, 2).toUpperCase(), '#065f46');
        repairedItemsCount++;
      }
      if (!acc.subscription) {
        acc.subscription = {
          status: 'active',
          cycle: acc.accountType === 'farmer_mining' ? 'yearly' : 'monthly',
          feePkr: acc.accountType === 'farmer_mining' ? 2000 : acc.accountType === 'factory' ? 2000 : acc.accountType === 'wholesaler' ? 1500 : 0,
          dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        };
        report.push(`Restored missing subscription object for ${acc.name}`);
        repairedItemsCount++;
      } else {
        const expectedFee = acc.accountType === 'farmer_mining' ? 2000 : acc.accountType === 'factory' ? 2000 : acc.accountType === 'wholesaler' ? 1500 : 0;
        if (acc.accountType !== 'admin' && acc.subscription.feePkr !== expectedFee) {
          acc.subscription.feePkr = expectedFee;
          if (acc.subscription.amountOwed) acc.subscription.amountOwed = expectedFee;
          repairedItemsCount++;
        }
      }
    });

    // 2. Synchronize Product visibility & local assets
    const seedProductImages: Record<string, string> = {
      'prod-101': BUNDLED_PRODUCT_ASSETS.basmatiRiceImg,
      'prod-102': BUNDLED_PRODUCT_ASSETS.pinkSaltImg,
      'prod-103': BUNDLED_PRODUCT_ASSETS.surgicalSteelImg,
      'prod-104': BUNDLED_PRODUCT_ASSETS.waterPumpImg,
      'prod-105': BUNDLED_PRODUCT_ASSETS.greenCardamomImg,
      'prod-106': BUNDLED_PRODUCT_ASSETS.denimFabricImg,
      'prod-107': BUNDLED_PRODUCT_ASSETS.waterPumpImg,
    };
    products.forEach((prod) => {
      if (prod.imageUrl && LEGACY_ASSET_PATH_MAP[prod.imageUrl]) {
        prod.imageUrl = LEGACY_ASSET_PATH_MAP[prod.imageUrl];
        repairedItemsCount++;
      } else if (
        !prod.imageUrl ||
        prod.imageUrl.includes('images.unsplash.com') ||
        prod.imageUrl.includes('hero_marketplace_pakistan_1792651530359') ||
        prod.imageUrl.includes('/cat_')
      ) {
        prod.imageUrl =
          seedProductImages[prod.id] || getFallbackProductImage(prod.category, prod.city);
        repairedItemsCount++;
      }
      const seller = accounts.find((a) => a.accountNumber === prod.sellerAccountNumber);
      if (seller) {
        if (!prod.sellerPhone) {
          prod.sellerPhone = seller.phone;
          repairedItemsCount++;
        }
        const shouldBeActive = seller.subscription.status === 'active' && !seller.isDeleted;
        if (prod.isActive !== shouldBeActive) {
          prod.isActive = shouldBeActive;
          report.push(`Synchronized catalog visibility for ${prod.title} (active: ${shouldBeActive})`);
          repairedItemsCount++;
        }
      }
    });

    if (repairedItemsCount > 0) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
      LocalEdgeDb.notify();
    }

    return { repairedItemsCount, report };
  }

  /**
   * Automated Subscription System:
   * Checks subscription due dates daily.
   * - 7 days before due: reminder message to Inbox
   * - 1 day before due: urgent reminder to Inbox
   * - On due date: final notice to Inbox
   * - Day AFTER due date: automatically blocks/freezes the account!
   */
  public static runDailySubscriptionAutomation(): { frozenCount: number; remindersSent: number } {
    const accounts = LocalEdgeDb.getAccounts();
    const products = LocalEdgeDb.getProducts();
    const freezeLogs = LocalEdgeDb.getFreezeLogs();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let frozenCount = 0;
    let remindersSent = 0;

    const existingMsgs = LocalEdgeDb.getMessages();

    accounts.forEach((acc) => {
      if (acc.accountType === 'customer' || acc.accountType === 'admin' || acc.isDeleted) {
        return;
      }
      if (!acc.subscription || !acc.subscription.dueDate) {
        return;
      }

      const due = new Date(acc.subscription.dueDate);
      if (!Number.isFinite(due.getTime())) {
        return;
      }
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Overdue Check: Day after due date
      if (diffDays < 0 && acc.subscription.status !== 'frozen') {
        // Freeze account automatically!
        acc.subscription.status = 'frozen';
        acc.subscription.daysOverdue = Math.abs(diffDays);
        acc.subscription.amountOwed = acc.subscription.feePkr;

        // Hide seller products
        products.forEach((p) => {
          if (p.sellerAccountNumber === acc.accountNumber) {
            p.isActive = false;
          }
        });

        // Add to freeze log
        freezeLogs.unshift({
          id: `frz-${Date.now()}-${acc.accountNumber}`,
          accountNumber: acc.accountNumber,
          accountName: acc.name,
          accountType: acc.accountType,
          blockedAt: new Date().toISOString(),
          amountOwed: acc.subscription.feePkr,
          daysOverdue: Math.abs(diffDays),
          resolutionStatus: 'blocked',
        });

        // Deliver official Freeze Notice directly to user's Inbox
        LocalEdgeDb.sendMessage({
          threadId: `th_system_${acc.accountNumber}`,
          senderAccountNumber: 'system',
          senderName: 'Munafa Subscription Bureau',
          recipientAccountNumber: acc.accountNumber,
          type: 'freeze_notice',
          content: `ACCOUNT BLOCKED: Your Munafa business subscription payment of PKR ${acc.subscription.feePkr.toLocaleString()} was due on ${acc.subscription.dueDate}. Your product listings have been hidden from the marketplace. To unblock: send your payment reference or receipt slip in this Inbox to Admin for immediate 1-click restoration.`,
        });

        frozenCount++;
      } else if (diffDays === 7 || diffDays === 1 || diffDays === 0) {
        // Automated reminder notice (deduplicated per account per calendar day)
        const text =
          diffDays === 0
            ? `TODAY IS DUE DATE: Your Munafa subscription (PKR ${acc.subscription.feePkr.toLocaleString()}) is due today. Please remit to keep your listings live.`
            : `SUBSCRIPTION REMINDER: Your Munafa subscription (PKR ${acc.subscription.feePkr.toLocaleString()}) is due in ${diffDays} day(s) on ${acc.subscription.dueDate}.`;

        const alreadySentToday = existingMsgs.some(
          (m) =>
            m.recipientAccountNumber === acc.accountNumber &&
            m.content === text &&
            (m.timestamp || '').startsWith(todayStr)
        );
        if (!alreadySentToday) {
          LocalEdgeDb.sendMessage({
            threadId: `th_system_${acc.accountNumber}`,
            senderAccountNumber: 'system',
            senderName: 'Munafa Subscription Bureau',
            recipientAccountNumber: acc.accountNumber,
            type: 'system',
            content: text,
          });
          remindersSent++;
        }
      }
    });

    if (frozenCount > 0) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'freeze_log', JSON.stringify(freezeLogs));
      LocalEdgeDb.notify();
    }

    return { frozenCount, remindersSent };
  }

  // --- ACCOUNTS API ---
  public static getAccounts(): UserAccount[] {
    return LocalEdgeDb.getParsedArray<UserAccount>(STORAGE_PREFIX + 'accounts', INITIAL_ACCOUNTS);
  }

  public static getAccountByNumber(accountNumber: string): UserAccount | undefined {
    return LocalEdgeDb.getAccounts().find((a) => a.accountNumber === accountNumber && !a.isDeleted);
  }

  public static getAccountByCnic(cnicClean: string): UserAccount | undefined {
    const norm = cnicClean.replace(/\D/g, '');
    return LocalEdgeDb.getAccounts().find((a) => a.cnic.replace(/\D/g, '') === norm && !a.isDeleted);
  }

  public static lookupAccountByCnicWithRateLimit(
    cnicInput: string
  ): { success: boolean; account?: UserAccount; error?: string } {
    const scan = scanPayloadForThreats(cnicInput, 'cnic_lookup');
    if (!scan.safe) {
      return { success: false, error: scan.reason || 'Security shield blocked invalid CNIC characters.' };
    }
    const rate = checkRateLimit('cnic_recovery', 6, 60_000);
    if (!rate.allowed) {
      return {
        success: false,
        error: `Too many CNIC lookup attempts. Shield locked lookup for ${rate.retryAfterSec}s.`,
      };
    }
    const clean = cnicInput.replace(/\D/g, '');
    if (clean.length !== 13) {
      return { success: false, error: 'CNIC must be 13 digits (e.g. 35404-8920194-3).' };
    }
    const acc = LocalEdgeDb.getAccountByCnic(clean);
    if (!acc) {
      return { success: false, error: 'No registered account found matching this CNIC.' };
    }
    resetRateLimit('cnic_recovery');
    return { success: true, account: acc };
  }

  public static saveAccount(account: UserAccount): void {
    const fieldsToScan = [account.name, account.address, account.email, account.phone, account.cnic, account.ntn || ''];
    for (const val of fieldsToScan) {
      const scan = scanPayloadForThreats(val, 'saveAccount');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe registration payload.');
      }
    }

    const safeAccount: UserAccount = {
      ...account,
      name: sanitizeTextInput(account.name),
      address: sanitizeTextInput(account.address),
      email: sanitizeTextInput(account.email),
      phone: sanitizeTextInput(account.phone),
      cnic: sanitizeTextInput(account.cnic),
      ntn: account.ntn ? sanitizeTextInput(account.ntn) : undefined,
      photoUrl:
        account.photoUrl && isSafeMediaUrl(account.photoUrl)
          ? account.photoUrl
          : createAvatarSvg((account.name || 'MN').slice(0, 2).toUpperCase(), '#065f46'),
    };
    const accounts = [...LocalEdgeDb.getAccounts()];
    const idx = accounts.findIndex((a) => a.accountNumber === safeAccount.accountNumber);
    if (idx >= 0) {
      accounts[idx] = safeAccount;
    } else {
      accounts.push(safeAccount);
    }
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
  }

  public static recordUserActivity(accountNumber: string): void {
    const accounts = [...LocalEdgeDb.getAccounts()];
    const idx = accounts.findIndex((a) => a.accountNumber === accountNumber && !a.isDeleted);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], lastActiveAt: new Date().toISOString() };
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    }
  }

  public static verifyUserLogin(
    accountNumber: string,
    pin: string
  ): { success: boolean; account?: UserAccount; error?: string } {
    const cleanAcc = accountNumber.trim();
    const cleanPin = pin.trim();

    const scanAcc = scanPayloadForThreats(cleanAcc, 'user_login');
    const scanPin = scanPayloadForThreats(cleanPin, 'user_login');
    if (!scanAcc.safe || !scanPin.safe) {
      return { success: false, error: 'Security shield blocked invalid login characters.' };
    }

    const rate = checkRateLimit(`user_login_${cleanAcc || 'anon'}`, 6, 60_000);
    if (!rate.allowed) {
      return {
        success: false,
        error: `Too many failed attempts. Shield locked login for ${rate.retryAfterSec}s.`,
      };
    }

    const acc = LocalEdgeDb.getAccountByNumber(cleanAcc);
    if (!acc) {
      return { success: false, error: 'Account Number not found.' };
    }
    if (acc.pin !== cleanPin) {
      return { success: false, error: 'Incorrect 4-digit PIN.' };
    }

    resetRateLimit(`user_login_${cleanAcc || 'anon'}`);
    LocalEdgeDb.recordUserActivity(acc.accountNumber);
    return { success: true, account: LocalEdgeDb.getAccountByNumber(acc.accountNumber) || acc };
  }

  private static randomIntInRange(min: number, maxExclusive: number): number {
    const span = maxExclusive - min;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return min + (buf[0] % span);
    }
    return min + Math.floor(Math.random() * span);
  }

  /**
   * Generates a unique 8-digit account number not collisioning with existing accounts
   */
  public static generateAccountNumber(): string {
    const accounts = LocalEdgeDb.getAccounts();
    const existing = new Set(accounts.map((a) => a.accountNumber));
    let num = '';
    let guard = 0;
    do {
      num = LocalEdgeDb.randomIntInRange(10000000, 100000000).toString();
      guard++;
    } while (existing.has(num) && guard < 1000);
    return num;
  }

  /**
   * Generates a 4-digit PIN
   */
  public static generatePin(): string {
    return LocalEdgeDb.randomIntInRange(1000, 10000).toString();
  }

  /**
   * Unfreeze an account with one click after admin verification of payment reference
   */
  public static unfreezeAccount(accountNumber: string): boolean {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber);
    if (!acc) return false;

    acc.subscription.status = 'active';
    acc.subscription.lastPaidAt = new Date().toISOString().split('T')[0];
    
    // Extend due date by 1 year for farmer_mining, or 1 month for factory/wholesaler
    const nextDue = new Date();
    if (acc.accountType === 'farmer_mining') {
      nextDue.setFullYear(nextDue.getFullYear() + 1);
    } else {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    acc.subscription.dueDate = nextDue.toISOString().split('T')[0];
    acc.subscription.daysOverdue = 0;
    acc.subscription.amountOwed = 0;

    if (acc.subscription.pendingPaymentRef) {
      acc.subscription.pendingPaymentRef.status = 'approved';
    }

    // Make products live again
    const products = LocalEdgeDb.getProducts();
    products.forEach((p) => {
      if (p.sellerAccountNumber === accountNumber) {
        p.isActive = true;
      }
    });

    // Update freeze logs
    const freezeLogs = LocalEdgeDb.getFreezeLogs();
    const log = freezeLogs.find((f) => f.accountNumber === accountNumber && f.resolutionStatus === 'blocked');
    if (log) {
      log.resolutionStatus = 'unfrozen_by_admin';
      log.resolvedAt = new Date().toISOString();
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'freeze_log', JSON.stringify(freezeLogs));
    }

    // Send confirmation to user Inbox
    LocalEdgeDb.sendMessage({
      threadId: `th_system_${acc.accountNumber}`,
      senderAccountNumber: 'system',
      senderName: 'Munafa Admin Bureau',
      recipientAccountNumber: acc.accountNumber,
      type: 'system',
      content: `ACCOUNT ACTIVATED: Admin verified your subscription payment. Your account #${acc.accountNumber} is now active, you can post unlimited product ads, and your next renewal date is ${acc.subscription.dueDate}.`,
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
    LocalEdgeDb.notify();
    return true;
  }

  public static activateAccount(accountNumber: string): boolean {
    return LocalEdgeDb.unfreezeAccount(accountNumber);
  }

  public static deactivateAccount(accountNumber: string, reason = 'Deactivated by Admin after payment review'): boolean {
    return LocalEdgeDb.freezeAccount(accountNumber, reason);
  }

  /**
   * Manually freeze an account
   */
  public static freezeAccount(accountNumber: string, reason: string): boolean {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber);
    if (!acc) return false;

    acc.subscription.status = 'frozen';
    acc.subscription.amountOwed = acc.subscription.feePkr;

    const products = LocalEdgeDb.getProducts();
    products.forEach((p) => {
      if (p.sellerAccountNumber === accountNumber) {
        p.isActive = false;
      }
    });

    const freezeLogs = LocalEdgeDb.getFreezeLogs();
    freezeLogs.unshift({
      id: `frz-manual-${Date.now()}`,
      accountNumber: acc.accountNumber,
      accountName: acc.name,
      accountType: acc.accountType,
      blockedAt: new Date().toISOString(),
      amountOwed: acc.subscription.feePkr,
      daysOverdue: 0,
      resolutionStatus: 'manual_freeze',
    });

    const safeReason = scanPayloadForThreats(reason, 'freeze_reason').safe
      ? sanitizeTextInput(reason) || 'Deactivated by Admin'
      : 'Deactivated by Admin compliance review';

    LocalEdgeDb.sendMessage({
      threadId: `th_system_${acc.accountNumber}`,
      senderAccountNumber: 'system',
      senderName: 'Munafa Staff Admin',
      recipientAccountNumber: acc.accountNumber,
      type: 'freeze_notice',
      content: `ACCOUNT FROZEN: ${safeReason}. All listings temporarily removed. Please contact Munafa staff in this Inbox.`,
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'freeze_log', JSON.stringify(freezeLogs));
    LocalEdgeDb.notify();
    return true;
  }

  /**
   * Delete an account inactive for 5 years with prior warning check
   */
  public static send5YearInactiveWarning(accountNumber: string): boolean {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber);
    if (!acc) return false;

    acc.deletionWarningSentAt = new Date().toISOString();
    LocalEdgeDb.sendMessage({
      threadId: `th_system_${acc.accountNumber}`,
      senderAccountNumber: 'system',
      senderName: 'Munafa Policy Compliance',
      recipientAccountNumber: acc.accountNumber,
      type: 'system',
      content: 'NOTICE OF INACTIVITY: This account has recorded zero activity for an extended period. Per Munafa Terms Section 15, accounts inactive for 5 years will be queued for deletion. Log in and reply to cancel deletion.',
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
    return true;
  }

  public static getDeletionEligibility(acc: UserAccount): {
    eligible: boolean;
    hasWarning: boolean;
    inactiveYears: number;
    hasFiveYearsInactivity: boolean;
    reason: string;
  } {
    if (acc.accountType === 'admin') {
      return {
        eligible: false,
        hasWarning: false,
        inactiveYears: 0,
        hasFiveYearsInactivity: false,
        reason: 'System Admin HQ account cannot be deleted.',
      };
    }
    const lastActiveMs = new Date(acc.lastActiveAt || acc.createdAt).getTime();
    const elapsedMs = Number.isFinite(lastActiveMs) ? Math.max(0, Date.now() - lastActiveMs) : 0;
    const inactiveYears = Math.round((elapsedMs / (365 * 24 * 60 * 60 * 1000)) * 10) / 10;
    const hasFiveYearsInactivity = elapsedMs >= FIVE_YEARS_MS;
    const hasWarning = Boolean(acc.deletionWarningSentAt);
    const eligible = hasWarning && hasFiveYearsInactivity;

    let reason = 'Eligible for permanent deletion (warning issued and 5+ years inactive).';
    if (!hasWarning && !hasFiveYearsInactivity) {
      reason = `Requires an inactivity warning notice AND 5 years of inactivity (currently ${inactiveYears} yrs inactive).`;
    } else if (!hasWarning) {
      reason = '5+ years inactive, but an inactivity warning notice must be issued first.';
    } else if (!hasFiveYearsInactivity) {
      reason = `Warning issued, but requires 5 full years of inactivity (currently ${inactiveYears} yrs inactive).`;
    }

    return {
      eligible,
      hasWarning,
      inactiveYears,
      hasFiveYearsInactivity,
      reason,
    };
  }

  public static simulateFiveYearInactivity(accountNumber: string): boolean {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber);
    if (!acc || acc.accountType === 'admin') return false;
    acc.lastActiveAt = new Date(Date.now() - (FIVE_YEARS_MS + 86400000 * 30)).toISOString();
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
    return true;
  }

  public static deleteEligibleAccount(accountNumber: string): { success: boolean; message: string } {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber);
    if (!acc) return { success: false, message: 'Account not found.' };

    const check = LocalEdgeDb.getDeletionEligibility(acc);
    if (!check.eligible) {
      return { success: false, message: check.reason };
    }

    acc.isDeleted = true;
    const products = LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber !== accountNumber);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
    return {
      success: true,
      message: `Eligible Account #${accountNumber} (${acc.name}) permanently deleted after warning and 5+ years of inactivity.`,
    };
  }

  public static deleteAccount(accountNumber: string): boolean {
    return LocalEdgeDb.adminDeleteAccount(accountNumber).success;
  }

  public static adminDeleteAccount(accountNumber: string): { success: boolean; message: string } {
    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber && !a.isDeleted);
    if (!acc) return { success: false, message: 'Account not found.' };
    if (acc.accountType === 'admin') {
      return { success: false, message: 'System Admin HQ account cannot be deleted.' };
    }

    acc.isDeleted = true;
    acc.subscription.status = 'frozen';
    const products = LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber !== accountNumber);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));

    try {
      if (localStorage.getItem(ACTIVE_SESSION_KEY) === accountNumber) {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch {
      // Non-fatal
    }

    LocalEdgeDb.notify();
    return {
      success: true,
      message: `Account #${accountNumber} (${acc.name}) has been deleted by Admin.`,
    };
  }

  // --- PRODUCTS API ---
  public static getProducts(): ProductItem[] {
    return LocalEdgeDb.getParsedArray<ProductItem>(STORAGE_PREFIX + 'products', INITIAL_PRODUCTS);
  }

  public static getActiveProducts(): ProductItem[] {
    return LocalEdgeDb.getProducts().filter((p) => p.isActive);
  }

  public static addProduct(product: ProductItem): void {
    for (const val of [product.title, product.description, product.city]) {
      const scan = scanPayloadForThreats(val, 'addProduct');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe product listing content.');
      }
    }
    const safeProduct: ProductItem = {
      ...product,
      title: sanitizeTextInput(product.title),
      description: sanitizeTextInput(product.description),
      city: sanitizeTextInput(product.city),
      imageUrl: isSafeMediaUrl(product.imageUrl)
        ? product.imageUrl
        : getFallbackProductImage(product.category, product.city),
    };
    const products = [...LocalEdgeDb.getProducts()];
    products.unshift(safeProduct);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
    LocalEdgeDb.notify();
  }

  public static updateProduct(product: ProductItem): void {
    for (const val of [product.title, product.description, product.city]) {
      const scan = scanPayloadForThreats(val, 'updateProduct');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe product listing content.');
      }
    }
    const products = [...LocalEdgeDb.getProducts()];
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      products[idx] = {
        ...product,
        title: sanitizeTextInput(product.title),
        description: sanitizeTextInput(product.description),
        city: sanitizeTextInput(product.city),
        imageUrl: isSafeMediaUrl(product.imageUrl) ? product.imageUrl : products[idx].imageUrl,
      };
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
      LocalEdgeDb.notify();
    }
  }

  public static deleteProduct(
    productId: string,
    notifySeller = true
  ): { success: boolean; message: string } {
    const products = [...LocalEdgeDb.getProducts()];
    const target = products.find((p) => p.id === productId);
    if (!target) {
      return { success: false, message: 'Product ad not found.' };
    }

    const remaining = products.filter((p) => p.id !== productId);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(remaining));

    if (notifySeller && target.sellerAccountNumber) {
      LocalEdgeDb.sendMessage({
        threadId: `th_system_${target.sellerAccountNumber}`,
        senderAccountNumber: 'admin',
        senderName: 'Munafa Admin HQ',
        recipientAccountNumber: target.sellerAccountNumber,
        type: 'system',
        content: `AD REMOVED BY ADMIN: Your listing "${target.title}" (${target.id}) has been removed from Munafa marketplace panels.`,
      });
    }

    LocalEdgeDb.notify();
    return {
      success: true,
      message: `Removed ad "${target.title}" (${target.id}) from all panels.`,
    };
  }

  // --- ORDERS API ---
  public static getOrders(): OrderItem[] {
    return LocalEdgeDb.getParsedArray<OrderItem>(STORAGE_PREFIX + 'orders', INITIAL_ORDERS);
  }

  public static getOrderById(orderId: string): OrderItem | undefined {
    return LocalEdgeDb.getOrders().find((o) => o.id === orderId);
  }

  public static getOrdersForAccount(accountNumber: string): OrderItem[] {
    return LocalEdgeDb.getOrders().filter(
      (o) => o.buyerAccountNumber === accountNumber || o.sellerAccountNumber === accountNumber
    );
  }

  // --- MUNAFA OFFICIAL BANK & FEE API ---
  public static getBankDetails(): MunafaBankDetails {
    return LocalEdgeDb.getParsed<MunafaBankDetails>(STORAGE_PREFIX + 'bank_details', INITIAL_BANK_DETAILS);
  }

  public static saveBankDetails(details: MunafaBankDetails): void {
    const textFields = [
      details.bankName,
      details.accountTitle,
      details.accountNumber,
      details.iban,
      details.branchCode,
      details.branchCity,
      details.jazzCashTitle,
      details.jazzCashNumber,
      details.easyPaisaTitle,
      details.easyPaisaNumber,
    ];
    for (const val of textFields) {
      const scan = scanPayloadForThreats(val || '', 'saveBankDetails');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe bank configuration text.');
      }
    }
    const safeDetails: MunafaBankDetails = {
      ...details,
      bankName: sanitizeTextInput(details.bankName),
      accountTitle: sanitizeTextInput(details.accountTitle),
      accountNumber: sanitizeTextInput(details.accountNumber),
      iban: sanitizeTextInput(details.iban),
      branchCode: sanitizeTextInput(details.branchCode),
      branchCity: sanitizeTextInput(details.branchCity),
      jazzCashTitle: sanitizeTextInput(details.jazzCashTitle),
      jazzCashNumber: sanitizeTextInput(details.jazzCashNumber),
      easyPaisaTitle: sanitizeTextInput(details.easyPaisaTitle),
      easyPaisaNumber: sanitizeTextInput(details.easyPaisaNumber),
      orderFeePkr: 0,
      aiAutoVerifyEnabled: false,
    };
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'bank_details', JSON.stringify(safeDetails));
    LocalEdgeDb.notify();
  }

  private static pendingFeeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  public static submitCustomerOrderFee(
    orderId: string,
    channel: 'bank' | 'jazzcash' | 'easypaisa' | 'cash_deposit',
    ref: string,
    receiptUrl?: string
  ): boolean {
    const orders = LocalEdgeDb.getOrders();
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return false;

    ord.munafaFeeStatus = 'submitted';
    ord.munafaFeeChannel = channel;
    ord.munafaFeeRef = ref;
    ord.munafaFeePaidAt = new Date().toISOString();
    if (receiptUrl) ord.munafaFeeReceiptUrl = receiptUrl;

    ord.timeline.push({
      status: 'placed',
      timestamp: new Date().toISOString(),
      note: `Order placed directly with zero extra Munafa fees (${channel.toUpperCase()} Ref: ${ref}).`,
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'orders', JSON.stringify(orders));
    LocalEdgeDb.notify();

    // Trigger immediate confirmation if configured
    const bankDetails = LocalEdgeDb.getBankDetails();
    if (bankDetails.aiAutoVerifyEnabled) {
      const delayMs = (bankDetails.verificationDelaySeconds || 60) * 1000;

      // Clear existing timer if any
      if (LocalEdgeDb.pendingFeeTimers[orderId]) {
        clearTimeout(LocalEdgeDb.pendingFeeTimers[orderId]);
      }

      LocalEdgeDb.pendingFeeTimers[orderId] = setTimeout(() => {
        LocalEdgeDb.verifyCustomerOrderFee(orderId);
        delete LocalEdgeDb.pendingFeeTimers[orderId];
      }, delayMs);
    }

    return true;
  }

  public static verifyCustomerOrderFee(orderId: string): boolean {
    const orders = LocalEdgeDb.getOrders();
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return false;

    if (ord.munafaFeeStatus === 'verified') return true;

    ord.munafaFeeStatus = 'verified';
    ord.munafaFeePkr = 0;
    ord.status = 'placed'; // Formally placed and dispatched to the seller business!

    ord.timeline.push({
      status: 'placed',
      timestamp: new Date().toISOString(),
      note: `Order officially dispatched to ${ord.sellerName} for processing (PKR 0 extra platform order fee).`,
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'orders', JSON.stringify(orders));

    const threadId = `th_${[ord.buyerAccountNumber, ord.sellerAccountNumber].sort().join('_')}`;

    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: '00000000',
      senderName: 'Munafa 24/7 AI Agent Bot',
      recipientAccountNumber: ord.buyerAccountNumber,
      type: 'order_update',
      orderId: ord.id,
      content: `ORDER CONFIRMED: Order #${ord.orderNumber} (PKR 0 extra platform order fees) has been dispatched directly to ${ord.sellerName} (${ord.sellerPhone}).`,
    });

    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: 'system',
      senderName: 'Munafa Order Dispatch Engine',
      recipientAccountNumber: ord.sellerAccountNumber,
      type: 'order_update',
      orderId: ord.id,
      content: `ORDER DISPATCHED TO BUSINESS (${ord.orderNumber}): Buyer ${ord.buyerName} ordered ${ord.quantity} ${ord.unit}(s) of "${ord.productTitle}". Fulfilment: ${ord.fulfilmentType.toUpperCase()}. Zero order fees applied.`,
    });

    LocalEdgeDb.dispatchMobilePush({
      id: `fee-verify-${Date.now()}`,
      title: 'Order Confirmed & Dispatched',
      body: `Order #${ord.orderNumber} sent directly to ${ord.sellerName} with PKR 0 platform fees.`,
      timestamp: new Date().toLocaleTimeString(),
      accountNumber: ord.buyerAccountNumber,
      type: 'order',
    });

    LocalEdgeDb.notify();
    return true;
  }

  public static createOrder(order: OrderItem): void {
    for (const val of [order.buyerAddress, order.buyerPhone, order.buyerName, order.sellerAddress]) {
      const scan = scanPayloadForThreats(val || '', 'createOrder');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe order delivery details.');
      }
    }

    const products = [...LocalEdgeDb.getProducts()];
    const prod = products.find((p) => p.id === order.productId);
    if (!prod || !prod.isActive || prod.quantityAvailable <= 0) {
      throw new Error('This product is currently unavailable or out of stock.');
    }

    const rawQty = Number.isFinite(order.quantity) ? Math.floor(order.quantity) : 1;
    const safeQty = Math.min(prod.quantityAvailable, Math.max(1, rawQty));
    const unitPrice = Math.max(0, Number.isFinite(prod.pricePerUnit) ? prod.pricePerUnit : order.unitPrice);
    const subtotal = unitPrice * safeQty;
    const gstAmount = Math.round((subtotal * (prod.taxRatePercent || 0)) / 100);
    const grandTotal = subtotal + gstAmount;

    const safeOrder: OrderItem = {
      ...order,
      buyerName: sanitizeTextInput(order.buyerName),
      buyerPhone: sanitizeTextInput(order.buyerPhone),
      buyerAddress: sanitizeTextInput(order.buyerAddress),
      sellerAddress: sanitizeTextInput(order.sellerAddress),
      quantity: safeQty,
      unitPrice,
      subtotal,
      gstAmount,
      deliveryFee: 0,
      grandTotal,
      munafaFeePkr: 0,
      munafaFeeStatus: 'verified',
    };

    const orders = [...LocalEdgeDb.getOrders()];
    orders.unshift(safeOrder);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'orders', JSON.stringify(orders));

    // Deduct stock from product safely
    prod.quantityAvailable = Math.max(0, prod.quantityAvailable - safeQty);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'products', JSON.stringify(products));

    // Linked chat thread
    const threadId = `th_${[safeOrder.buyerAccountNumber, safeOrder.sellerAccountNumber].sort().join('_')}`;

    // Buyer confirmation (100% Free Ordering — No extra fees)
    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: 'system',
      senderName: 'Munafa Order Engine',
      recipientAccountNumber: safeOrder.buyerAccountNumber,
      type: 'invoice',
      orderId: safeOrder.id,
      content: `ORDER PLACED #${safeOrder.orderNumber}: Your order with ${safeOrder.sellerName} has been sent directly to the seller. Grand Total: PKR ${safeOrder.grandTotal.toLocaleString()} (PKR 0 extra platform/order fee).`,
    });

    // Direct dispatch notification to Seller
    if (safeOrder.sellerAccountNumber !== safeOrder.buyerAccountNumber) {
      LocalEdgeDb.sendMessage({
        threadId,
        senderAccountNumber: 'system',
        senderName: 'Munafa Order Dispatch Engine',
        recipientAccountNumber: safeOrder.sellerAccountNumber,
        type: 'order_update',
        orderId: safeOrder.id,
        content: `NEW ORDER RECEIVED #${safeOrder.orderNumber}: Buyer ${safeOrder.buyerName} (${safeOrder.buyerPhone}) ordered ${safeOrder.quantity} ${safeOrder.unit}(s) of "${safeOrder.productTitle}". Total: PKR ${safeOrder.grandTotal.toLocaleString()}. Fulfilment: ${safeOrder.fulfilmentType.toUpperCase()}.`,
      });
    }

    LocalEdgeDb.dispatchMobilePush({
      id: `ord-push-${Date.now()}`,
      title: `Munafa Order #${safeOrder.orderNumber} Placed`,
      body: `Order sent directly to ${safeOrder.sellerName}. Total: PKR ${safeOrder.grandTotal.toLocaleString()} (No Extra Fees).`,
      timestamp: new Date().toLocaleTimeString(),
      accountNumber: safeOrder.buyerAccountNumber,
      type: 'order',
    });

    LocalEdgeDb.notify();
  }

  public static updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    _updatedByAccountNumber: string,
    note?: string,
    trackingNo?: string
  ): boolean {
    if (note && !scanPayloadForThreats(note, 'updateOrderStatus').safe) {
      return false;
    }
    if (trackingNo && !scanPayloadForThreats(trackingNo, 'updateOrderStatus').safe) {
      return false;
    }
    const cleanNote = note ? sanitizeTextInput(note) : undefined;
    const cleanTracking = trackingNo ? sanitizeTextInput(trackingNo) : undefined;

    const orders = LocalEdgeDb.getOrders();
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return false;

    ord.status = newStatus;
    if (cleanTracking) {
      ord.courierTrackingNo = cleanTracking;
    }

    ord.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: cleanNote || `Order marked as ${newStatus.toUpperCase()}`,
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'orders', JSON.stringify(orders));

    // Post update directly to the concerned buyer & seller only (never broadcast to 'all')
    const threadId = `th_${[ord.buyerAccountNumber, ord.sellerAccountNumber].sort().join('_')}`;
    const statusText = `ORDER STATUS UPDATE (${ord.orderNumber}): Status changed to "${newStatus.toUpperCase()}". ${cleanNote || ''}${cleanTracking ? ` | Insured Courier Tracking: ${cleanTracking}` : ''}`;

    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: 'system',
      senderName: 'Munafa Tracker',
      recipientAccountNumber: ord.buyerAccountNumber,
      type: 'order_update',
      orderId: ord.id,
      content: statusText,
    });

    if (ord.sellerAccountNumber && ord.sellerAccountNumber !== ord.buyerAccountNumber) {
      LocalEdgeDb.sendMessage({
        threadId,
        senderAccountNumber: 'system',
        senderName: 'Munafa Tracker',
        recipientAccountNumber: ord.sellerAccountNumber,
        type: 'order_update',
        orderId: ord.id,
        content: statusText,
      });
    }

    LocalEdgeDb.notify();
    return true;
  }

  // --- SHARED INBOX & MESSAGING API ---
  public static getMessages(): ChatMessage[] {
    return LocalEdgeDb.getParsedArray<ChatMessage>(STORAGE_PREFIX + 'messages', INITIAL_MESSAGES);
  }

  public static isAccountConcernedInThread(threadId: string, accountNumber: string): boolean {
    if (!threadId || !accountNumber) return false;
    if (threadId === `th_system_${accountNumber}` || threadId === `th_agent_${accountNumber}`) {
      return true;
    }
    if (
      threadId === 'th_agent_all' ||
      threadId.startsWith('th_system_') ||
      threadId.startsWith('th_agent_') ||
      threadId === 'th_admin_escalations'
    ) {
      return false;
    }
    if (threadId.startsWith('th_')) {
      const participants = threadId.slice(3).split('_').filter(Boolean);
      return participants.includes(accountNumber);
    }
    return false;
  }

  public static isMessageConcernedWithAccount(msg: ChatMessage, accountNumber: string, isAdmin = false): boolean {
    if (!accountNumber) return false;
    if (isAdmin) {
      return (
        msg.senderAccountNumber === accountNumber ||
        msg.senderAccountNumber === 'admin' ||
        msg.recipientAccountNumber === accountNumber ||
        msg.recipientAccountNumber === 'admin' ||
        msg.threadId === 'th_admin_escalations' ||
        LocalEdgeDb.isAccountConcernedInThread(msg.threadId, accountNumber) ||
        LocalEdgeDb.isAccountConcernedInThread(msg.threadId, 'admin')
      );
    }
    if (msg.recipientAccountNumber === 'all' || msg.threadId === 'th_agent_all') {
      return false;
    }
    return (
      msg.senderAccountNumber === accountNumber ||
      msg.recipientAccountNumber === accountNumber ||
      LocalEdgeDb.isAccountConcernedInThread(msg.threadId, accountNumber)
    );
  }

  public static getMessagesForAccount(accountNumber: string): ChatMessage[] {
    if (!accountNumber) return [];
    const msgs = LocalEdgeDb.getMessages();
    const acc = LocalEdgeDb.getAccountByNumber(accountNumber);
    const isAdmin = accountNumber === 'admin' || acc?.accountType === 'admin';
    return msgs.filter((m) => LocalEdgeDb.isMessageConcernedWithAccount(m, accountNumber, isAdmin));
  }

  public static sendMessage(msg: Omit<ChatMessage, 'id' | 'timestamp' | 'delivered' | 'isRead'>): ChatMessage {
    const contentScan = scanPayloadForThreats(msg.content, `message:${msg.senderAccountNumber}`);
    const messages = [...LocalEdgeDb.getMessages()];
    const safeFileUrl = msg.fileUrl && isSafeMediaUrl(msg.fileUrl) ? msg.fileUrl : undefined;
    const safeContent = contentScan.safe
      ? sanitizeTextInput(msg.content)
      : '[Security Shield Blocked Unsafe Message Content]';
    const newMsg: ChatMessage = {
      ...msg,
      senderName: sanitizeTextInput(msg.senderName),
      content: safeContent,
      fileUrl: safeFileUrl,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      delivered: true,
      isRead: false,
    };
    messages.push(newMsg);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'messages', JSON.stringify(messages));

    // Trigger simulated mobile push alert strictly addressed to recipient
    LocalEdgeDb.dispatchMobilePush({
      id: `push-${Date.now()}`,
      title: `Munafa: Message from ${newMsg.senderName}`,
      body: newMsg.content.slice(0, 100),
      timestamp: new Date().toLocaleTimeString(),
      accountNumber: newMsg.recipientAccountNumber,
      type: newMsg.type === 'order_update' ? 'order' : 'chat',
    });

    LocalEdgeDb.notify();
    return newMsg;
  }

  public static markThreadAsRead(threadId: string, readerAccountNumber: string) {
    const messages = LocalEdgeDb.getMessages();
    const acc = LocalEdgeDb.getAccountByNumber(readerAccountNumber);
    const isAdmin = readerAccountNumber === 'admin' || acc?.accountType === 'admin';
    let updated = false;
    messages.forEach((m) => {
      if (
        m.threadId === threadId &&
        !m.isRead &&
        (m.recipientAccountNumber === readerAccountNumber || (isAdmin && m.recipientAccountNumber === 'admin'))
      ) {
        m.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'messages', JSON.stringify(messages));
      LocalEdgeDb.notify();
    }
  }

  // --- MOBILE PUSH NOTIFICATIONS ---
  private static pushListeners: Set<(notification: MobileNotification) => void> = new Set();

  public static onMobilePush(callback: (notification: MobileNotification) => void): () => void {
    LocalEdgeDb.pushListeners.add(callback);
    return () => {
      LocalEdgeDb.pushListeners.delete(callback);
    };
  }

  public static dispatchMobilePush(notification: MobileNotification) {
    LocalEdgeDb.pushListeners.forEach((cb) => {
      try {
        cb(notification);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // --- FREEZE & AGENT LOGS ---
  public static getFreezeLogs(): FreezeLogEntry[] {
    return LocalEdgeDb.getParsedArray<FreezeLogEntry>(STORAGE_PREFIX + 'freeze_log', INITIAL_FREEZE_LOGS);
  }

  public static getAgentLogs(): AgentLogEntry[] {
    return LocalEdgeDb.getParsedArray<AgentLogEntry>(STORAGE_PREFIX + 'agent_log', INITIAL_AGENT_LOGS);
  }

  public static addAgentLog(log: Omit<AgentLogEntry, 'id' | 'timestamp'>): void {
    const logs = LocalEdgeDb.getAgentLogs();
    logs.unshift({
      ...log,
      id: `agnt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'agent_log', JSON.stringify(logs));
    LocalEdgeDb.notify();
  }

  // --- PIN MANAGEMENT ---
  public static changePin(accountNumber: string, oldPin: string | null, newPin: string): { success: boolean; message: string } {
    const cleanPin = newPin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: 'PIN must be exactly 4 digits (e.g. 1234).' };
    }

    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.accountNumber === accountNumber && !a.isDeleted);
    if (!acc) {
      return { success: false, message: 'Account not found.' };
    }

    if (oldPin !== null && oldPin.trim() !== acc.pin) {
      return { success: false, message: 'Current PIN is incorrect.' };
    }

    acc.pin = cleanPin;
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
    return { success: true, message: 'PIN successfully updated.' };
  }

  public static resetPinByCnic(
    cnicInput: string,
    newPin: string
  ): { success: boolean; message: string; accountNumber?: string; name?: string } {
    if (!scanPayloadForThreats(cnicInput, 'reset_pin_cnic').safe || !scanPayloadForThreats(newPin, 'reset_pin_cnic').safe) {
      return { success: false, message: 'Security shield blocked unsafe characters.' };
    }
    const rate = checkRateLimit('cnic_recovery', 6, 60_000);
    if (!rate.allowed) {
      return {
        success: false,
        message: `Too many CNIC reset attempts. Shield locked reset for ${rate.retryAfterSec}s.`,
      };
    }

    const cleanCnic = cnicInput.replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      return { success: false, message: 'CNIC must be 13 digits (e.g. 35404-8920194-3).' };
    }

    const cleanPin = newPin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: 'New PIN must be exactly 4 digits (e.g. 1234).' };
    }

    const accounts = LocalEdgeDb.getAccounts();
    const acc = accounts.find((a) => a.cnic.replace(/\D/g, '') === cleanCnic && !a.isDeleted);
    if (!acc) {
      return { success: false, message: 'No active account found matching this CNIC number.' };
    }

    resetRateLimit('cnic_recovery');
    acc.pin = cleanPin;
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.sendMessage({
      threadId: `th_system_${acc.accountNumber}`,
      senderAccountNumber: 'system',
      senderName: 'MUNAFA Security Recovery',
      recipientAccountNumber: acc.accountNumber,
      type: 'system',
      content: `PIN RESET BY CNIC: Account #${acc.accountNumber} PIN was updated via CNIC verification.`,
    });
    LocalEdgeDb.notify();
    return {
      success: true,
      message: `PIN updated for Account #${acc.accountNumber} (${acc.name}).`,
      accountNumber: acc.accountNumber,
      name: acc.name,
    };
  }

  // --- CONTACTS & BLOCKED ACCOUNTS ---
  public static getContacts(userAccountNumber: string): ContactEntry[] {
    const key = STORAGE_PREFIX + 'contacts_' + userAccountNumber;
    const raw = LocalEdgeDb.safeGetItem(key);
    if (raw) {
      const parsed = safeJsonParse<ContactEntry[] | null>(raw, null);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed default contacts with marketplace peers (compact avatars to prevent blob duplication)
    const allAccounts = LocalEdgeDb.getAccounts();
    const defaultPeers = allAccounts
      .filter((a) => a.accountNumber !== userAccountNumber && !a.isDeleted && a.accountNumber !== 'admin')
      .slice(0, 4)
      .map((a) => ({
        accountNumber: a.accountNumber,
        name: a.name,
        phone: a.phone,
        accountType: a.accountType,
        photoUrl:
          a.photoUrl && a.photoUrl.length > 20_000
            ? createAvatarSvg(a.name.slice(0, 2).toUpperCase() || 'MN', '#065f46')
            : a.photoUrl,
        addedAt: new Date().toISOString(),
      }));
    LocalEdgeDb.safeSetItem(key, JSON.stringify(defaultPeers));
    return defaultPeers;
  }

  public static addContact(userAccountNumber: string, contactAccountNumber: string): { success: boolean; message: string } {
    const cleanTarget = contactAccountNumber.trim();
    if (cleanTarget === userAccountNumber) {
      return { success: false, message: 'You cannot add your own account as a contact.' };
    }
    const targetAccount = LocalEdgeDb.getAccountByNumber(cleanTarget);
    if (!targetAccount) {
      return { success: false, message: `No registered user found with Account #${cleanTarget}.` };
    }
    const contacts = LocalEdgeDb.getContacts(userAccountNumber);
    if (contacts.some((c) => c.accountNumber === cleanTarget)) {
      return { success: false, message: 'This account is already in your contacts.' };
    }
    contacts.unshift({
      accountNumber: targetAccount.accountNumber,
      name: targetAccount.name,
      phone: targetAccount.phone,
      accountType: targetAccount.accountType,
      photoUrl:
        targetAccount.photoUrl && targetAccount.photoUrl.length > 20_000
          ? createAvatarSvg(targetAccount.name.slice(0, 2).toUpperCase() || 'MN', '#065f46')
          : targetAccount.photoUrl,
      addedAt: new Date().toISOString(),
    });
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'contacts_' + userAccountNumber, JSON.stringify(contacts));
    LocalEdgeDb.notify();
    return { success: true, message: `Added ${targetAccount.name} to contacts.` };
  }

  public static deleteContact(userAccountNumber: string, contactAccountNumber: string): boolean {
    const key = STORAGE_PREFIX + 'contacts_' + userAccountNumber;
    const contacts = LocalEdgeDb.getContacts(userAccountNumber);
    const filtered = contacts.filter((c) => c.accountNumber !== contactAccountNumber);
    LocalEdgeDb.safeSetItem(key, JSON.stringify(filtered));
    LocalEdgeDb.notify();
    return true;
  }

  public static getBlockedAccounts(userAccountNumber: string): string[] {
    const raw = LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'blocked_' + userAccountNumber);
    const parsed = safeJsonParse<string[]>(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  public static toggleBlockAccount(userAccountNumber: string, targetAccountNumber: string): { blocked: boolean } {
    const key = STORAGE_PREFIX + 'blocked_' + userAccountNumber;
    let list = LocalEdgeDb.getBlockedAccounts(userAccountNumber);
    let isBlocked = false;
    if (list.includes(targetAccountNumber)) {
      list = list.filter((id) => id !== targetAccountNumber);
      isBlocked = false;
    } else {
      list.push(targetAccountNumber);
      isBlocked = true;
    }
    LocalEdgeDb.safeSetItem(key, JSON.stringify(list));
    LocalEdgeDb.notify();
    return { blocked: isBlocked };
  }

  public static isAccountBlocked(fromAccount: string, toAccount: string): boolean {
    const list = LocalEdgeDb.getBlockedAccounts(toAccount);
    return list.includes(fromAccount);
  }

  // --- ADMIN CREDENTIALS & SECURITY ---
  public static getAdminAccount(): UserAccount {
    const accounts = LocalEdgeDb.getAccounts();
    const admin = accounts.find((a) => a.accountType === 'admin');
    if (admin) return admin;
    return INITIAL_ACCOUNTS[0];
  }

  public static verifyAdminLoginDetailed(
    username: string,
    pin: string
  ): { success: boolean; error?: string } {
    const scanUser = scanPayloadForThreats(username, 'admin_login');
    const scanPin = scanPayloadForThreats(pin, 'admin_login');
    if (!scanUser.safe || !scanPin.safe) {
      return { success: false, error: 'Security shield blocked malicious login payload.' };
    }

    const rate = checkRateLimit('admin_login_gate', 5, 60_000);
    if (!rate.allowed) {
      return {
        success: false,
        error: `Too many failed admin attempts. Shield locked login for ${rate.retryAfterSec}s.`,
      };
    }

    const admin = LocalEdgeDb.getAdminAccount();
    const matchUser = username.trim().toLowerCase() === admin.accountNumber.toLowerCase();
    const matchPin = pin.trim() === admin.pin;
    if (matchUser && matchPin) {
      resetRateLimit('admin_login_gate');
      return { success: true };
    }
    return { success: false, error: 'Invalid Admin credentials.' };
  }

  public static verifyAdminLogin(username: string, pin: string): boolean {
    return LocalEdgeDb.verifyAdminLoginDetailed(username, pin).success;
  }

  public static updateAdminCredentials(newUsername: string, newPin: string): { success: boolean; message: string } {
    if (!scanPayloadForThreats(newUsername, 'updateAdminCredentials').safe || !scanPayloadForThreats(newPin, 'updateAdminCredentials').safe) {
      return { success: false, message: 'Security shield blocked unsafe characters in Admin credentials.' };
    }
    const cleanUser = sanitizeTextInput(newUsername).toLowerCase();
    const cleanPin = newPin.trim();

    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUser)) {
      return {
        success: false,
        message: 'Username must be 3-32 characters (letters, numbers, dot, underscore, or hyphen).',
      };
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: 'Admin PIN must be exactly 4 digits.' };
    }

    const accounts = LocalEdgeDb.getAccounts();
    const adminIdx = accounts.findIndex((a) => a.accountType === 'admin');
    if (adminIdx >= 0) {
      accounts[adminIdx].accountNumber = cleanUser;
      accounts[adminIdx].pin = cleanPin;
      accounts[adminIdx].name = `Munafa Staff Admin (${cleanUser})`;
    } else {
      accounts.push({
        ...INITIAL_ACCOUNTS[0],
        accountNumber: cleanUser,
        pin: cleanPin,
        name: `Munafa Staff Admin (${cleanUser})`,
      });
    }

    resetRateLimit('admin_login_gate');
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
    LocalEdgeDb.notify();
    return { success: true, message: `Admin credentials updated: username '${cleanUser}', PIN '${cleanPin}'.` };
  }

  // --- AI FRAUD DETECTION SENTINEL ---
  public static runFraudScan(): {
    alerts: FraudAlert[];
    overallThreatLevel: 'low' | 'medium' | 'critical';
    averageRiskScore: number;
    totalAudited: number;
  } {
    const storedAlertsRaw = LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'fraud_alerts');
    const alerts: FraudAlert[] = safeJsonParse<FraudAlert[]>(storedAlertsRaw, []);

    const accounts = LocalEdgeDb.getAccounts();
    const products = LocalEdgeDb.getProducts();
    const orders = LocalEdgeDb.getOrders();

    const newAlerts: FraudAlert[] = [];

    // 1. Check for Duplicate CNIC patterns
    const cnicMap = new Map<string, string[]>();
    accounts.forEach((acc) => {
      if (acc.accountType === 'admin' || acc.isDeleted) return;
      const clean = acc.cnic.replace(/\D/g, '');
      const list = cnicMap.get(clean) || [];
      list.push(acc.accountNumber);
      cnicMap.set(clean, list);
    });
    cnicMap.forEach((accList, cnic) => {
      if (accList.length > 1) {
        newAlerts.push({
          id: `frd-cnic-${cnic}`,
          targetAccountNumber: accList.join(', '),
          targetName: 'Multiple Accounts Sharing CNIC',
          targetRole: 'customer',
          riskScore: 92,
          severity: 'critical',
          triggerReason: `Same CNIC (${cnic}) detected across ${accList.length} distinct 8-digit accounts. Potential multi-identity registration anomaly.`,
          category: 'identity_anomaly',
          timestamp: new Date().toISOString(),
          status: 'active',
        });
      }
    });

    // 2. Check for Abnormal Pricing Anomalies
    products.forEach((prod) => {
      if (prod.pricePerUnit > 200000 && prod.category === 'farm_mining') {
        newAlerts.push({
          id: `frd-price-${prod.id}`,
          targetAccountNumber: prod.sellerAccountNumber,
          targetName: prod.sellerName,
          targetRole: 'farmer_mining',
          riskScore: 78,
          severity: 'medium',
          triggerReason: `Extreme unit price anomaly detected on '${prod.title}' (PKR ${prod.pricePerUnit.toLocaleString()}/${prod.unit}). 350% above provincial benchmark.`,
          category: 'pricing_anomaly',
          timestamp: prod.createdAt,
          status: 'active',
        });
      }
    });

    // 3. Check for Repeated Unverified Payment References
    const refMap = new Map<string, string[]>();
    orders.forEach((ord) => {
      if (ord.munafaFeeRef) {
        const list = refMap.get(ord.munafaFeeRef) || [];
        list.push(ord.orderNumber);
        refMap.set(ord.munafaFeeRef, list);
      }
    });
    refMap.forEach((ordersList, ref) => {
      if (ordersList.length > 1) {
        newAlerts.push({
          id: `frd-tid-${ref}`,
          targetAccountNumber: 'Multiple Orders',
          targetName: 'Reused Bank TID Gateway Ref',
          targetRole: 'customer',
          riskScore: 89,
          severity: 'critical',
          triggerReason: `Reused Transaction Reference '${ref}' across ${ordersList.length} distinct orders. Gateway collision detected.`,
          category: 'payment_anomaly',
          timestamp: new Date().toISOString(),
          status: 'active',
        });
      }
    });

    // 4. Check for Business Accounts with Missing NTN
    accounts.forEach((acc) => {
      if (acc.accountType !== 'customer' && acc.accountType !== 'admin' && !acc.ntn && !acc.isDeleted) {
        newAlerts.push({
          id: `frd-ntn-${acc.accountNumber}`,
          targetAccountNumber: acc.accountNumber,
          targetName: acc.name,
          targetRole: acc.accountType,
          riskScore: 65,
          severity: 'medium',
          triggerReason: `Unregistered business seller operating without verified FBR NTN certificate. Subject to withholding audit.`,
          category: 'tax_evasion',
          timestamp: acc.createdAt,
          status: 'active',
        });
      }
    });

    // Merge non-duplicate alerts
    newAlerts.forEach((na) => {
      if (!alerts.some((a) => a.id === na.id)) {
        alerts.unshift(na);
      }
    });

    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'fraud_alerts', JSON.stringify(alerts));

    const activeAlerts = alerts.filter((a) => a.status === 'active');
    const totalAudited = accounts.length + products.length + orders.length;
    const avgScore =
      activeAlerts.length > 0
        ? Math.round(activeAlerts.reduce((sum, a) => sum + a.riskScore, 0) / activeAlerts.length)
        : 8;

    const overallThreatLevel: 'low' | 'medium' | 'critical' =
      activeAlerts.some((a) => a.severity === 'critical')
        ? 'critical'
        : activeAlerts.length > 0
        ? 'medium'
        : 'low';

    return {
      alerts,
      overallThreatLevel,
      averageRiskScore: avgScore,
      totalAudited,
    };
  }

  public static dismissFraudAlert(alertId: string): void {
    const stored = LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'fraud_alerts');
    const list = safeJsonParse<FraudAlert[]>(stored, []);
    const item = list.find((a) => a.id === alertId);
    if (item) {
      item.status = 'dismissed';
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'fraud_alerts', JSON.stringify(list));
      LocalEdgeDb.notify();
    }
  }

  public static auditFraudAlert(alertId: string): void {
    const stored = LocalEdgeDb.safeGetItem(STORAGE_PREFIX + 'fraud_alerts');
    const list = safeJsonParse<FraudAlert[]>(stored, []);
    const item = list.find((a) => a.id === alertId);
    if (item) {
      item.status = 'audited';
      LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'fraud_alerts', JSON.stringify(list));
      LocalEdgeDb.notify();
    }
  }

  public static getDiagnostics(): EdgeStorageDiagnostics {
    return getLocalDiagnostics();
  }

  // --- PER-USER DEVICE DATABASE NODE & ZERO-COST MAIN COORDINATOR ---
  private static ensureMeshChannel(): boolean {
    if (typeof window !== 'undefined' && !LocalEdgeDb.windowListenersAttached) {
      LocalEdgeDb.windowListenersAttached = true;
      window.addEventListener('storage', (ev) => {
        if (ev.key && (ev.key.startsWith(STORAGE_PREFIX) || ev.key.startsWith(USER_NODE_PREFIX))) {
          if (ev.newValue !== null && LocalEdgeDb.memoryStore[ev.key] !== ev.newValue) {
            LocalEdgeDb.memoryStore[ev.key] = ev.newValue;
            LocalEdgeDb.parsedCache.delete(ev.key);
            LocalEdgeDb.listeners.forEach((cb) => {
              try {
                cb();
              } catch {
                // Non-fatal
              }
            });
          }
        }
      });
      const emitNetworkRefresh = () => {
        LocalEdgeDb.listeners.forEach((cb) => {
          try {
            cb();
          } catch {
            // Non-fatal
          }
        });
      };
      window.addEventListener('online', emitNetworkRefresh);
      window.addEventListener('offline', emitNetworkRefresh);
    }

    if (typeof BroadcastChannel === 'undefined') return false;
    if (!LocalEdgeDb.meshChannel) {
      try {
        LocalEdgeDb.meshChannel = new BroadcastChannel('munafa_device_mesh');
        LocalEdgeDb.meshChannel.onmessage = (event) => {
          const payload = event.data as { type?: string; key?: string } | null;
          if (payload?.type === 'EDGE_RECORD_UPDATE' && payload.key) {
            const targetKey = payload.key;
            void (async () => {
              try {
                const fromIdb = await readFromIdb(targetKey);
                const fresh = fromIdb ?? localStorage.getItem(targetKey);
                if (fresh !== null && LocalEdgeDb.memoryStore[targetKey] !== fresh) {
                  LocalEdgeDb.memoryStore[targetKey] = fresh;
                  LocalEdgeDb.parsedCache.delete(targetKey);
                  LocalEdgeDb.listeners.forEach((cb) => cb());
                }
              } catch {
                // Non-fatal cross-tab sync ignore
              }
            })();
          }
        };
      } catch {
        return false;
      }
    }
    return true;
  }

  private static syncUserNodeSnapshot(accountNumber: string): MountedUserDeviceInfo | null {
    const startPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const acc = LocalEdgeDb.getAccountByNumber(accountNumber);
    if (!acc) return null;

    const userOrders = LocalEdgeDb.getOrdersForAccount(accountNumber);
    const userMessages = LocalEdgeDb.getMessagesForAccount(accountNumber);
    const userProducts = LocalEdgeDb.getProducts().filter((p) => p.sellerAccountNumber === accountNumber);
    const userContacts = LocalEdgeDb.getContacts(accountNumber);
    const blocked = LocalEdgeDb.getBlockedAccounts(accountNumber);

    const nodeKey = `${USER_NODE_PREFIX}${accountNumber}`;
    const snapshot = {
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      profile: {
        accountNumber: acc.accountNumber,
        name: acc.name,
        city: acc.address,
        subscriptionStatus: acc.subscription.status,
      },
      orders: userOrders,
      messages: userMessages,
      products: userProducts,
      contacts: userContacts,
      blocked,
      syncedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(snapshot);
    LocalEdgeDb.memoryStore[nodeKey] = serialized;
    void writeToIdb(nodeKey, serialized);

    const meshActive = LocalEdgeDb.ensureMeshChannel();
    const existingMounted = LocalEdgeDb.mountedNodeInfo;

    const rawCoordinator = LocalEdgeDb.memoryStore[STORAGE_PREFIX + 'main_coordinator'] || '';
    const mainCoordinatorBytes = rawCoordinator ? (rawCoordinator.length + (STORAGE_PREFIX + 'main_coordinator').length) * 2 : 0;

    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startPerf;
    lastMeasuredComputeMs = Math.max(0.1, Math.round(elapsed * 10) / 10);

    const cpuCores =
      typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
        ? Math.max(1, navigator.hardwareConcurrency)
        : 4;
    const navWithMem = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
    const deviceMemoryGb =
      typeof navWithMem?.deviceMemory === 'number' && navWithMem.deviceMemory > 0
        ? navWithMem.deviceMemory
        : 4;
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

    const info: MountedUserDeviceInfo = {
      accountNumber: acc.accountNumber,
      userName: acc.name,
      accountType: acc.accountType,
      nodeKey,
      mountedAt:
        existingMounted?.accountNumber === accountNumber
          ? existingMounted.mountedAt
          : new Date().toISOString(),
      lastSyncedAt: snapshot.syncedAt,
      userOrdersCount: userOrders.length,
      userMessagesCount: userMessages.length,
      userProductsCount: userProducts.length,
      userContactsCount: userContacts.length,
      nodeBytes: serialized.length * 2,
      peerMeshChannelActive: meshActive,
      deviceType: detectDeviceClass(),
      cpuCores,
      deviceMemoryGb,
      persistentStorageGranted: storageTelemetryCache.persistentStorageGranted,
      storageQuotaMb: storageTelemetryCache.storageQuotaMb,
      storageUsageKb: storageTelemetryCache.storageUsageKb,
      mainCoordinatorBytes,
      networkStatus: isOnline ? 'Online Peer Mesh' : 'Offline-First Device DB',
      lastComputeMs: lastMeasuredComputeMs,
    };
    LocalEdgeDb.mountedNodeInfo = info;
    return info;
  }

  public static mountUserDeviceNode(accountNumber: string): MountedUserDeviceInfo | null {
    const info = LocalEdgeDb.syncUserNodeSnapshot(accountNumber);
    if (!info) return null;
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, accountNumber);
    } catch {
      // Non-fatal
    }
    void refreshStorageTelemetry(true, () => {
      if (LocalEdgeDb.mountedNodeInfo?.accountNumber === accountNumber) {
        LocalEdgeDb.syncUserNodeSnapshot(accountNumber);
        LocalEdgeDb.listeners.forEach((cb) => {
          try {
            cb();
          } catch {
            // Non-fatal
          }
        });
      }
    });
    if (LocalEdgeDb.meshChannel) {
      try {
        LocalEdgeDb.meshChannel.postMessage({
          type: 'USER_NODE_MOUNTED',
          accountNumber,
          timestamp: info.lastSyncedAt,
        });
      } catch {
        // Ignore broadcast error
      }
    }
    return info;
  }

  public static fetchUserRecordsToDevice(accountNumber: string): MountedUserDeviceInfo | null {
    LocalEdgeDb.recordUserActivity(accountNumber);
    const info = LocalEdgeDb.mountUserDeviceNode(accountNumber);
    LocalEdgeDb.notify();
    return info;
  }

  public static unmountUserDeviceNode(): void {
    LocalEdgeDb.mountedNodeInfo = null;
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
      // Non-fatal
    }
  }

  public static getMountedUserDeviceInfo(): MountedUserDeviceInfo | null {
    return LocalEdgeDb.mountedNodeInfo;
  }

  public static restoreActiveSessionAccount(): UserAccount | null {
    try {
      const savedAcc = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!savedAcc) return null;
      const found = LocalEdgeDb.getAccountByNumber(savedAcc);
      if (found && !found.isDeleted) {
        LocalEdgeDb.mountUserDeviceNode(found.accountNumber);
        return found;
      }
    } catch {
      // Ignore storage access restriction
    }
    return null;
  }

  public static async resetDeviceDatabase(): Promise<void> {
    LocalEdgeDb.unmountUserDeviceNode();
    try {
      localStorage.clear();
    } catch {
      // Non-fatal
    }
    await clearIdbStore();
    LocalEdgeDb.memoryStore = {};
    LocalEdgeDb.parsedCache.clear();
    LocalEdgeDb.dirtyKeys.clear();
    LocalEdgeDb.initialized = false;
    LocalEdgeDb.idbHydrated = false;
    LocalEdgeDb.init();
  }

  // --- DISPUTES & ESCALATION REPORTS ---
  public static getDisputes(): DisputeReport[] {
    return LocalEdgeDb.getParsedArray<DisputeReport>(STORAGE_PREFIX + 'disputes', []);
  }

  public static addDispute(dispute: Omit<DisputeReport, 'id' | 'status' | 'createdAt'>): DisputeReport {
    const scan = scanPayloadForThreats(dispute.description, 'addDispute');
    if (!scan.safe) {
      throw new Error(scan.reason || 'Security shield blocked unsafe dispute content.');
    }
    const disputes = [...LocalEdgeDb.getDisputes()];
    const newDispute: DisputeReport = {
      ...dispute,
      description: sanitizeTextInput(dispute.description),
      id: `dsp-${Date.now().toString().slice(-6)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    disputes.unshift(newDispute);
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'disputes', JSON.stringify(disputes));

    // Notify Admin Inbox
    LocalEdgeDb.sendMessage({
      threadId: `th_system_${dispute.reporterAccountNumber}`,
      senderAccountNumber: dispute.reporterAccountNumber,
      senderName: dispute.reporterName,
      recipientAccountNumber: 'admin',
      type: 'system',
      orderId: dispute.orderId,
      content: `DISPUTE FILED (${newDispute.id})${dispute.orderNumber ? ` for Order #${dispute.orderNumber}` : ''} [${dispute.category.replace('_', ' ').toUpperCase()}]: ${newDispute.description}`,
    });

    LocalEdgeDb.notify();
    return newDispute;
  }

  public static resolveDispute(disputeId: string, adminNote: string, status: 'investigating' | 'resolved'): boolean {
    const scan = scanPayloadForThreats(adminNote || '', 'resolveDispute');
    if (!scan.safe) {
      return false;
    }
    const disputes = [...LocalEdgeDb.getDisputes()];
    const d = disputes.find((item) => item.id === disputeId);
    if (!d) return false;
    d.status = status;
    d.adminNote = sanitizeTextInput(adminNote);
    if (status === 'resolved') {
      d.resolvedAt = new Date().toISOString();
    }
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'disputes', JSON.stringify(disputes));

    LocalEdgeDb.sendMessage({
      threadId: `th_system_${d.reporterAccountNumber}`,
      senderAccountNumber: 'admin',
      senderName: 'Munafa Admin HQ',
      recipientAccountNumber: d.reporterAccountNumber,
      type: 'system',
      content: `DISPUTE UPDATE (${d.id}): Status changed to ${status.toUpperCase()}. Admin Note: ${d.adminNote}`,
    });

    LocalEdgeDb.notify();
    return true;
  }

  // --- SHARED INBOX CONFIGURATION & BULK NOTICES ---
  public static getSharedInboxConfig(): SharedInboxConfig {
    return LocalEdgeDb.getParsed<SharedInboxConfig>(STORAGE_PREFIX + 'inbox_config', INITIAL_INBOX_CONFIG);
  }

  public static saveSharedInboxConfig(cfg: SharedInboxConfig): void {
    for (const val of [cfg.broadcastSenderName, cfg.defaultWelcomeBanner]) {
      const scan = scanPayloadForThreats(val || '', 'saveSharedInboxConfig');
      if (!scan.safe) {
        throw new Error(scan.reason || 'Security shield blocked unsafe inbox configuration text.');
      }
    }
    const maxKb = Number.isFinite(cfg.maxAttachmentKb)
      ? Math.min(25600, Math.max(256, Math.round(cfg.maxAttachmentKb)))
      : 5120;
    const updated: SharedInboxConfig = {
      ...cfg,
      broadcastSenderName: sanitizeTextInput(cfg.broadcastSenderName) || 'Munafa Staff Broadcast',
      defaultWelcomeBanner: sanitizeTextInput(cfg.defaultWelcomeBanner),
      maxAttachmentKb: maxKb,
      updatedAt: new Date().toISOString(),
    };
    LocalEdgeDb.safeSetItem(STORAGE_PREFIX + 'inbox_config', JSON.stringify(updated));
    LocalEdgeDb.notify();
  }

  public static sendNoticeToUsers(
    target: 'all' | AccountType,
    title: string,
    body: string
  ): { recipientCount: number } {
    const scanTitle = scanPayloadForThreats(title || '', 'sendNoticeToUsers');
    const scanBody = scanPayloadForThreats(body || '', 'sendNoticeToUsers');
    if (!scanTitle.safe || !scanBody.safe) {
      throw new Error(scanTitle.reason || scanBody.reason || 'Security shield blocked unsafe broadcast content.');
    }

    const cleanTitle = sanitizeTextInput(title);
    const cleanBody = sanitizeTextInput(body);
    const accounts = LocalEdgeDb.getAccounts();
    const cfg = LocalEdgeDb.getSharedInboxConfig();
    const senderLabel = sanitizeTextInput(cfg.broadcastSenderName) || 'Munafa Staff Broadcast';
    let recipientCount = 0;

    accounts.forEach((acc) => {
      if (acc.accountNumber === 'admin' || acc.accountType === 'admin' || acc.isDeleted) return;
      if (target !== 'all' && acc.accountType !== target) return;

      LocalEdgeDb.sendMessage({
        threadId: `th_system_${acc.accountNumber}`,
        senderAccountNumber: 'system',
        senderName: senderLabel,
        recipientAccountNumber: acc.accountNumber,
        type: 'system',
        content: `MUNAFA OFFICIAL NOTICE: ${cleanTitle}\n\n${cleanBody}`,
      });
      recipientCount++;
    });

    return { recipientCount };
  }
}
