/**
 * MUNAFA — Made in Pakistan Marketplace
 * Core Type Definitions
 */

export type AccountType = 'customer' | 'farmer_mining' | 'factory' | 'wholesaler' | 'admin';

export type ProductUnit = 'kg' | 'ton' | 'piece' | 'dozen' | 'meter' | 'bag';

export type ProductCategory = 'farm_mining' | 'factory' | 'wholesale';

export type FulfilmentType = 'cod' | 'pickup';

export type OrderStatus = 'awaiting_fee' | 'placed' | 'confirmed' | 'dispatched' | 'delivered' | 'closed';

export interface MunafaBankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchCode: string;
  branchCity: string;
  jazzCashTitle: string;
  jazzCashNumber: string;
  easyPaisaTitle: string;
  easyPaisaNumber: string;
  orderFeePkr: number; // PKR 100 subscription fee
  aiAutoVerifyEnabled: boolean;
  verificationDelaySeconds: number; // 60 seconds (1 minute)
}

export interface UserAccount {
  accountNumber: string; // 8-digit unique ID (e.g. "84920153")
  pin: string; // 4-digit PIN (e.g. "3891")
  name: string;
  accountType: AccountType;
  address: string;
  phone: string; // WhatsApp / Contact number
  email: string;
  cnic: string; // 13 digits (e.g. "42101-1234567-1")
  ntn?: string; // Required for farmer_mining, factory, wholesaler
  photoUrl: string; // Base64 or asset path
  createdAt: string;
  lastActiveAt: string;
  termsAcceptedAt?: string;
  deviceSyncConsent?: boolean;

  // Subscription fields (for business accounts)
  subscription: {
    status: 'active' | 'frozen';
    cycle: 'yearly' | 'monthly';
    feePkr: number; // 2000 for farmer_mining (yearly), 2000 for factory (monthly), 1500 for wholesaler (monthly)
    dueDate: string;
    lastPaidAt?: string;
    paymentChannel?: 'jazzcash' | 'bank';
    pendingPaymentRef?: {
      refNumber: string;
      channel?: 'jazzcash' | 'bank';
      receiptUrl?: string;
      submittedAt: string;
      status: 'pending' | 'approved' | 'rejected';
    };
    daysOverdue?: number;
    amountOwed?: number;
  };

  isDeleted?: boolean;
  deletionWarningSentAt?: string;
}

export interface ProductItem {
  id: string;
  sellerAccountNumber: string;
  sellerName: string;
  sellerPhone?: string;
  title: string;
  description: string;
  category: ProductCategory;
  unit: ProductUnit;
  pricePerUnit: number; // in PKR
  taxRatePercent: number; // GST % set by seller (e.g. 18%)
  taxAmountPkr: number; // calculated or stated GST amount
  quantityAvailable: number;
  minOrderQty: number;
  city: string;
  imageUrl: string;
  createdAt: string;
  isActive: boolean; // Hidden if seller account is frozen
}

export interface OrderItem {
  id: string;
  orderNumber: string; // e.g. "MNF-849201"
  buyerAccountNumber: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerAccountNumber: string;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
  sellerNtn?: string;
  productId: string;
  productTitle: string;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  gstAmount: number;
  deliveryFee: number; // for COD insurance & courier
  grandTotal: number;
  fulfilmentType: FulfilmentType;
  courierTrackingNo?: string;
  status: OrderStatus;
  
  // Munafa PKR 100 Platform/Subscription Fee
  munafaFeePkr: number;
  munafaFeeStatus: 'pending' | 'submitted' | 'verified';
  munafaFeeChannel?: 'bank' | 'jazzcash' | 'easypaisa' | 'cash_deposit';
  munafaFeeRef?: string;
  munafaFeePaidAt?: string;
  munafaFeeReceiptUrl?: string;

  createdAt: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface DisputeReport {
  id: string;
  orderId?: string;
  orderNumber?: string;
  reporterAccountNumber: string;
  reporterName: string;
  againstAccountNumber: string;
  againstName: string;
  category: 'missing_item' | 'theft_damage' | 'tax_discrepancy' | 'payment_issue' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type MessageType = 'text' | 'file' | 'system' | 'invoice' | 'order_update' | 'payment_ref' | 'freeze_notice' | 'call_log';

export interface ContactEntry {
  accountNumber: string;
  name: string;
  phone: string;
  accountType: AccountType;
  photoUrl?: string;
  addedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderAccountNumber: string; // "system", "00000000" (agent), or 8-digit
  senderName: string;
  recipientAccountNumber: string; // 8-digit or "all"
  type: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  isRead: boolean;
  delivered: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[]; // 8-digit account numbers or "00000000" (agent)
  lastMessageText: string;
  lastMessageTime: string;
  unreadCountByAccount: Record<string, number>;
  orderId?: string;
  isAgentThread?: boolean;
  isEscalatedToAdmin?: boolean;
}

export interface FreezeLogEntry {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  blockedAt: string;
  amountOwed: number;
  daysOverdue: number;
  resolvedAt?: string;
  resolutionStatus: 'blocked' | 'unfrozen_by_admin' | 'manual_freeze';
}

export interface AgentLogEntry {
  id: string;
  userAccountNumber: string;
  userName: string;
  query: string;
  reply: string;
  timestamp: string;
  isEscalated: boolean;
  adminTakenOver: boolean;
}

export interface SystemNotice {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | AccountType;
  senderName: string;
  createdAt: string;
}

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  accountNumber: string;
  type: 'chat' | 'order' | 'subscription' | 'system' | 'otp' | 'security';
}

export interface MountedUserDeviceInfo {
  accountNumber: string;
  userName: string;
  accountType: AccountType;
  nodeKey: string;
  mountedAt: string;
  lastSyncedAt: string;
  userOrdersCount: number;
  userMessagesCount: number;
  userProductsCount: number;
  userContactsCount: number;
  nodeBytes: number;
  peerMeshChannelActive: boolean;
  deviceType?: 'Mobile Phone' | 'Tablet' | 'Laptop / PC';
  cpuCores?: number;
  deviceMemoryGb?: number;
  persistentStorageGranted?: boolean;
  storageQuotaMb?: number;
  storageUsageKb?: number;
  mainCoordinatorBytes?: number;
  networkStatus?: 'Online Peer Mesh' | 'Offline-First Device DB';
  lastComputeMs?: number;
}

export interface FraudAlert {
  id: string;
  targetAccountNumber: string;
  targetName: string;
  targetRole: AccountType;
  riskScore: number; // 0 to 100
  severity: 'low' | 'medium' | 'critical';
  triggerReason: string;
  category: 'identity_anomaly' | 'pricing_anomaly' | 'payment_anomaly' | 'order_velocity' | 'tax_evasion';
  timestamp: string;
  status: 'active' | 'audited' | 'dismissed';
}

export interface MonthlyTaxSettlement {
  sellerAccountNumber: string;
  sellerName: string;
  month: string;
  year: number;
  ntn?: string;
  totalOrdersCount: number;
  grossTradeValue: number;
  fbrGstLiability: number;
  advanceWithholdingTax: number;
  transitInsuranceCosts: number;
  courierDeliveryFees: number;
  netRealizedProceeds: number;
  generatedAt: string;
}

export interface SharedInboxConfig {
  aiConciergeEnabled: boolean;
  allowFileAttachments: boolean;
  allowAudioVideoCalls: boolean;
  autoWelcomeMessageEnabled: boolean;
  showFbrTaxAndInsuranceNotice: boolean;
  maxAttachmentKb: number;
  broadcastSenderName: string;
  defaultWelcomeBanner: string;
  updatedAt: string;
}
