/**
 * MUNAFA Universal Shared Inbox & AI Telecom System
 * Features:
 * - Shared Inbox for Customers, Farmers, Factories, Wholesalers & Admin
 * - 8-Digit Phone Dialer with DTMF audio feedback
 * - Audio Call & HD Video Call with live duration, mute, speaker & camera toggles
 * - Contacts Management: Add 8-digit accounts, delete contact, block/unblock accounts
 * - In-Thread File, Photo, and PDF Document sharing
 * - Tax & Transit Insurance Responsibility Console (FBR GST & Missing/Theft Insurance adjustment)
 * - Solid crisp white design, zero transparent panels, bold black text on all buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  ChatThread,
  UserAccount,
  OrderItem,
  ContactEntry,
  SharedInboxConfig,
} from '../types';
import { LocalEdgeDb, createAvatarSvg } from '../services/localEdgeDb';
import { GeminiAgentService } from '../services/geminiAgent';
import { PdfGenerator } from '../services/pdfGenerator';
import { useLanguage } from '../context/LanguageContext';
import { compressImageFile } from '../utils/mediaCompression';
import { isSafeMediaUrl, sanitizeFilename, scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import {
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Check,
  CheckCheck,
  AlertCircle,
  Bot,
  User,
  Plus,
  Shield,
  Clock,
  Download,
  Printer,
  ChevronRight,
  Filter,
  Receipt,
  Truck,
  ExternalLink,
  LogOut,
  Phone,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  UserPlus,
  UserMinus,
  UserX,
  ShieldAlert,
  Upload,
  Trash2,
  X,
  Calculator,
  ShieldCheck,
  Grid,
  Users,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

interface InboxProps {
  currentUser: UserAccount;
  initialThreadId?: string | null;
  onOpenOrderDetails?: (orderId: string) => void;
  onLogout?: () => void;
}

// DTMF tone synthesizer for realistic phone dialer feedback
const playKeyTone = (freq = 440, duration = 0.12) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Non-critical audio error
  }
};

const DTMF_FREQS: Record<string, number> = {
  '1': 697,
  '2': 770,
  '3': 852,
  '4': 697,
  '5': 770,
  '6': 852,
  '7': 941,
  '8': 1209,
  '9': 1336,
  '0': 1477,
  '*': 941,
  '#': 1336,
};

export const Inbox: React.FC<InboxProps> = ({
  currentUser,
  initialThreadId,
  onOpenOrderDetails,
  onLogout,
}) => {
  const { t, isUrdu } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber)
  );
  const [accounts, setAccounts] = useState<UserAccount[]>(() => LocalEdgeDb.getAccounts());
  const [orders, setOrders] = useState<OrderItem[]>(() => LocalEdgeDb.getOrders());
  const [inboxConfig, setInboxConfig] = useState<SharedInboxConfig>(() => LocalEdgeDb.getSharedInboxConfig());

  // Active navigation sidebar tab: 'chats' | 'dialer' | 'contacts' | 'blocked'
  const privateAgentThreadId = `th_agent_${currentUser.accountNumber}`;
  const isAdminUser = currentUser.accountType === 'admin' || currentUser.accountNumber === 'admin';
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'dialer' | 'contacts' | 'blocked'>('chats');
  const [activeThreadId, setActiveThreadId] = useState<string>(() => initialThreadId || privateAgentThreadId);
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(() => Boolean(initialThreadId));
  const [inputText, setInputText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'system' | 'agent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 8-Digit Phone Dialer State
  const [dialerNumber, setDialerNumber] = useState('');

  // Contacts & Blocked State
  const [contacts, setContacts] = useState<ContactEntry[]>(() =>
    LocalEdgeDb.getContacts(currentUser.accountNumber)
  );
  const [blockedAccounts, setBlockedAccounts] = useState<string[]>(() =>
    LocalEdgeDb.getBlockedAccounts(currentUser.accountNumber)
  );
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [addContactTarget, setAddContactTarget] = useState('');
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);
  const [inboxNotice, setInboxNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setInboxNotice(msg);
    setTimeout(() => setInboxNotice((prev) => (prev === msg ? null : prev)), 4000);
  };

  // Audio Call Simulation State
  const [audioCallState, setAudioCallState] = useState<{
    isOpen: boolean;
    targetAccount: string;
    targetName: string;
    targetRole: string;
    targetPhoto?: string;
    status: 'dialing' | 'ringing' | 'connected' | 'ended';
    durationSeconds: number;
    isMuted: boolean;
    isSpeaker: boolean;
  } | null>(null);

  // Video Call Simulation State
  const [videoCallState, setVideoCallState] = useState<{
    isOpen: boolean;
    targetAccount: string;
    targetName: string;
    targetRole: string;
    targetPhoto?: string;
    status: 'connecting' | 'connected' | 'ended';
    durationSeconds: number;
    isMuted: boolean;
    isCameraOff: boolean;
  } | null>(null);

  // File Upload State in Chat
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tax & Delivery Adjustment Modal
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [taxGstPercent, setTaxGstPercent] = useState('18');
  const [taxDeliveryFee, setTaxDeliveryFee] = useState('0');
  const [taxInsuranceFee, setTaxInsuranceFee] = useState('0');
  const [taxOrderRef, setTaxOrderRef] = useState('');

  // Start new chat with 8-digit account number modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [targetAccountNumber, setTargetAccountNumber] = useState('');
  const [newChatError, setNewChatError] = useState('');

  // Payment reference attachment modal
  const [paymentRefModalOpen, setPaymentRefModalOpen] = useState(false);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentSlipUrl, setPaymentSlipUrl] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioConnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoConnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync and isolate inbox data strictly for the currently logged-in user
  useEffect(() => {
    setMessages(LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber));
    setAccounts(LocalEdgeDb.getAccounts());
    setOrders(LocalEdgeDb.getOrders());
    setContacts(LocalEdgeDb.getContacts(currentUser.accountNumber));
    setBlockedAccounts(LocalEdgeDb.getBlockedAccounts(currentUser.accountNumber));
    setInboxConfig(LocalEdgeDb.getSharedInboxConfig());
    setInputText('');
    setAudioCallState(null);
    setVideoCallState(null);

    const canAccessInitial =
      initialThreadId &&
      (LocalEdgeDb.isAccountConcernedInThread(initialThreadId, currentUser.accountNumber) ||
        (isAdminUser &&
          (initialThreadId.startsWith('th_system_') ||
            initialThreadId === 'th_admin_escalations' ||
            LocalEdgeDb.isAccountConcernedInThread(initialThreadId, 'admin'))));

    if (canAccessInitial && initialThreadId) {
      setActiveThreadId(initialThreadId);
      setSidebarTab('chats');
      setMobileShowThread(true);
    } else {
      setActiveThreadId(`th_agent_${currentUser.accountNumber}`);
      setMobileShowThread(false);
    }

    const unsub = LocalEdgeDb.subscribe(() => {
      setMessages(LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber));
      setAccounts(LocalEdgeDb.getAccounts());
      setOrders(LocalEdgeDb.getOrders());
      setContacts(LocalEdgeDb.getContacts(currentUser.accountNumber));
      setBlockedAccounts(LocalEdgeDb.getBlockedAccounts(currentUser.accountNumber));
      setInboxConfig(LocalEdgeDb.getSharedInboxConfig());
    });
    return unsub;
  }, [currentUser.accountNumber, isAdminUser, initialThreadId]);

  // Cleanup pending call timeouts on unmount
  useEffect(() => {
    return () => {
      if (audioRingTimeoutRef.current) clearTimeout(audioRingTimeoutRef.current);
      if (audioConnectTimeoutRef.current) clearTimeout(audioConnectTimeoutRef.current);
      if (videoConnectTimeoutRef.current) clearTimeout(videoConnectTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (activeThreadId) {
      LocalEdgeDb.markThreadAsRead(activeThreadId, currentUser.accountNumber);
    }
  }, [activeThreadId, messages.length, currentUser.accountNumber]);

  // Audio Call duration timer
  useEffect(() => {
    if (audioCallState && audioCallState.status === 'connected') {
      audioCallTimerRef.current = setInterval(() => {
        setAudioCallState((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
      }, 1000);
    } else if (audioCallTimerRef.current) {
      clearInterval(audioCallTimerRef.current);
      audioCallTimerRef.current = null;
    }
    return () => {
      if (audioCallTimerRef.current) {
        clearInterval(audioCallTimerRef.current);
        audioCallTimerRef.current = null;
      }
    };
  }, [audioCallState?.status]);

  // Video Call duration timer
  useEffect(() => {
    if (videoCallState && videoCallState.status === 'connected') {
      videoCallTimerRef.current = setInterval(() => {
        setVideoCallState((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
      }, 1000);
    } else if (videoCallTimerRef.current) {
      clearInterval(videoCallTimerRef.current);
      videoCallTimerRef.current = null;
    }
    return () => {
      if (videoCallTimerRef.current) {
        clearInterval(videoCallTimerRef.current);
        videoCallTimerRef.current = null;
      }
    };
  }, [videoCallState?.status]);

  // Derive threads
  const threadsMap = new Map<
    string,
    {
      threadId: string;
      partnerName: string;
      partnerAccount: string;
      partnerRole: string;
      partnerPhoto?: string;
      lastMessage: ChatMessage;
      unreadCount: number;
      isOrder: boolean;
      orderId?: string;
      isAgent: boolean;
    }
  >();

  // Always inject this logged-in user's private 24/7 Agent Thread
  threadsMap.set(privateAgentThreadId, {
    threadId: privateAgentThreadId,
    partnerName: 'Munafa 24/7 Automated Agent',
    partnerAccount: '00000000',
    partnerRole: 'Private AI Concierge',
    partnerPhoto: createAvatarSvg('AI', '#065f46'),
    lastMessage: {
      id: `init-agnt-${currentUser.accountNumber}`,
      threadId: privateAgentThreadId,
      senderAccountNumber: '00000000',
      senderName: 'Munafa 24/7 Agent',
      recipientAccountNumber: currentUser.accountNumber,
      type: 'text',
      content: 'Ask me about registration, subscription rates, COD rules, FBR taxes, or 8-digit dialer calls.',
      timestamp: new Date().toISOString(),
      isRead: true,
      delivered: true,
    },
    unreadCount: 0,
    isOrder: false,
    isAgent: true,
  });

  messages.forEach((msg) => {
    if (!LocalEdgeDb.isMessageConcernedWithAccount(msg, currentUser.accountNumber, isAdminUser)) {
      return;
    }

    const threadId = msg.threadId;
    let partnerAccount =
      threadId === privateAgentThreadId
        ? '00000000'
        : msg.senderAccountNumber === currentUser.accountNumber
        ? msg.recipientAccountNumber
        : msg.recipientAccountNumber === currentUser.accountNumber
        ? msg.senderAccountNumber
        : msg.senderAccountNumber;

    if (
      (partnerAccount === 'system' || partnerAccount === 'all') &&
      threadId.startsWith('th_') &&
      !threadId.startsWith('th_system_') &&
      !threadId.startsWith('th_agent_')
    ) {
      const otherParticipant = threadId
        .slice(3)
        .split('_')
        .find((seg) => seg && seg !== currentUser.accountNumber && seg !== 'system' && seg !== 'all');
      if (otherParticipant) {
        partnerAccount = otherParticipant;
      }
    }

    if (partnerAccount === 'all') {
      return;
    }

    const partner = accounts.find((a) => a.accountNumber === partnerAccount);
    const isAgent = partnerAccount === '00000000' || threadId === privateAgentThreadId;

    let partnerName = partner
      ? partner.name
      : isAgent
      ? 'Munafa 24/7 Agent'
      : partnerAccount === 'system'
      ? 'Munafa System Bureau'
      : `User #${partnerAccount}`;
    let partnerRole = partner
      ? partner.accountType === 'farmer_mining'
        ? 'Farmer / Mining'
        : partner.accountType === 'factory'
        ? 'Factory'
        : partner.accountType === 'wholesaler'
        ? 'Wholesaler'
        : partner.accountType === 'admin'
        ? 'Staff Admin HQ'
        : 'Customer'
      : isAgent
      ? 'Private AI Concierge'
      : partnerAccount === 'system'
      ? 'Official Notifications'
      : 'Marketplace Trader';

    const existing = threadsMap.get(threadId);
    const unread =
      !msg.isRead &&
      (msg.recipientAccountNumber === currentUser.accountNumber ||
        (isAdminUser && msg.recipientAccountNumber === 'admin'))
        ? 1
        : 0;

    if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
      threadsMap.set(threadId, {
        threadId,
        partnerName,
        partnerAccount,
        partnerRole,
        partnerPhoto: partner?.photoUrl,
        lastMessage: msg,
        unreadCount: (existing ? existing.unreadCount : 0) + unread,
        isOrder: !!msg.orderId,
        orderId: msg.orderId,
        isAgent,
      });
    } else if (unread > 0) {
      existing.unreadCount += unread;
    }
  });

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  );

  const filteredThreads = threads.filter((t) => {
    // Hide blocked partner threads if desired
    if (blockedAccounts.includes(t.partnerAccount)) return false;

    if (filterType === 'orders' && !t.isOrder) return false;
    if (filterType === 'system' && !t.threadId.startsWith('th_system')) return false;
    if (filterType === 'agent' && !t.isAgent) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.partnerName.toLowerCase().includes(q) ||
        t.partnerAccount.includes(q) ||
        t.lastMessage.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeThread = threadsMap.get(activeThreadId) || threads[0];
  const resolvedActiveThreadId = activeThread?.threadId || privateAgentThreadId;
  const activeMessages = messages.filter((m) => m.threadId === resolvedActiveThreadId);

  // Send a regular text message in active thread
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const content = inputText.trim();
    setInputText('');

    if (blockedAccounts.includes(activeThread.partnerAccount)) {
      showNotice(`Cannot send message. Account #${activeThread.partnerAccount} is in your blocked list.`);
      return;
    }

    const newMsg = LocalEdgeDb.sendMessage({
      threadId: activeThread.threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: activeThread.partnerAccount,
      type: 'text',
      content,
      orderId: activeThread.orderId,
    });

    // If talking to 24/7 AI Agent, trigger automated Gemini Agent reply when enabled in Shared Inbox Config
    if (activeThread.isAgent) {
      if (!inboxConfig.aiConciergeEnabled) {
        LocalEdgeDb.sendMessage({
          threadId: activeThread.threadId,
          senderAccountNumber: 'system',
          senderName: inboxConfig.broadcastSenderName || 'Munafa Admin Support',
          recipientAccountNumber: currentUser.accountNumber,
          type: 'system',
          content: 'Automated AI replies are currently paused by Admin configuration. Your message has been queued for direct Munafa Staff Admin review.',
        });
        return;
      }
      setTimeout(() => {
        GeminiAgentService.generateAgentReply(content, currentUser)
          .then((replyText: string) => {
            LocalEdgeDb.sendMessage({
              threadId: activeThread.threadId,
              senderAccountNumber: '00000000',
              senderName: 'Munafa 24/7 Agent',
              recipientAccountNumber: currentUser.accountNumber,
              type: 'text',
              content: replyText,
            });
          })
          .catch((err: unknown) => {
            console.error(err);
          });
      }, 600);
    }
  };

  // Dialer Digit Click
  const handleDialerDigit = (digit: string) => {
    if (dialerNumber.length < 8) {
      playKeyTone(DTMF_FREQS[digit] || 440);
      setDialerNumber((prev) => prev + digit);
    }
  };

  const handleDialerBackspace = () => {
    playKeyTone(350, 0.08);
    setDialerNumber((prev) => prev.slice(0, -1));
  };

  const handleDialerClear = () => {
    setDialerNumber('');
  };

  // Find user by dialed number
  const dialedUser = accounts.find((a) => a.accountNumber === dialerNumber);

  // Start Audio Call from Dialer or Thread Header
  const initiateAudioCall = (accountNum: string) => {
    if (!inboxConfig.allowAudioVideoCalls) {
      showNotice('Audio & video calling is currently disabled in Shared Inbox configuration by Admin.');
      return;
    }
    const clean = accountNum.trim();
    if (!clean) return;

    if (clean === currentUser.accountNumber) {
      showNotice('Cannot call your own account number.');
      return;
    }

    if (blockedAccounts.includes(clean)) {
      showNotice(`Cannot initiate call. Account #${clean} is blocked.`);
      return;
    }

    playKeyTone(440, 0.25);
    const targetUser = accounts.find((a) => a.accountNumber === clean);
    const name = targetUser ? targetUser.name : clean === '00000000' ? 'Munafa 24/7 AI Concierge' : `User #${clean}`;
    const role = targetUser
      ? targetUser.accountType === 'farmer_mining'
        ? 'Farmer / Mining'
        : targetUser.accountType === 'factory'
        ? 'Factory'
        : targetUser.accountType === 'wholesaler'
        ? 'Wholesaler'
        : 'Customer'
      : 'Trader';

    setAudioCallState({
      isOpen: true,
      targetAccount: clean,
      targetName: name,
      targetRole: role,
      targetPhoto: targetUser?.photoUrl,
      status: 'dialing',
      durationSeconds: 0,
      isMuted: false,
      isSpeaker: true,
    });

    if (audioRingTimeoutRef.current) clearTimeout(audioRingTimeoutRef.current);
    if (audioConnectTimeoutRef.current) clearTimeout(audioConnectTimeoutRef.current);

    // Simulate ringing after 1.2 seconds
    audioRingTimeoutRef.current = setTimeout(() => {
      setAudioCallState((prev) => (prev ? { ...prev, status: 'ringing' } : null));
      playKeyTone(500, 0.4);
    }, 1200);

    // Simulate connected after 3.5 seconds
    audioConnectTimeoutRef.current = setTimeout(() => {
      setAudioCallState((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 3500);
  };

  // End Audio Call
  const endAudioCall = () => {
    if (audioRingTimeoutRef.current) {
      clearTimeout(audioRingTimeoutRef.current);
      audioRingTimeoutRef.current = null;
    }
    if (audioConnectTimeoutRef.current) {
      clearTimeout(audioConnectTimeoutRef.current);
      audioConnectTimeoutRef.current = null;
    }
    if (!audioCallState) return;
    playKeyTone(300, 0.2);

    const dur = audioCallState.durationSeconds;
    const minutes = Math.floor(dur / 60);
    const seconds = dur % 60;
    const durFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Log call event into thread
    const threadId = `th_${[currentUser.accountNumber, audioCallState.targetAccount].sort().join('_')}`;
    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: audioCallState.targetAccount,
      type: 'call_log',
      content: `📞 Voice Call ended. Duration: ${durFormatted}. AI Secure Encrypted P2P connection.`,
    });

    setAudioCallState(null);
  };

  // Start Video Call from Dialer or Thread Header
  const initiateVideoCall = (accountNum: string) => {
    if (!inboxConfig.allowAudioVideoCalls) {
      showNotice('Audio & video calling is currently disabled in Shared Inbox configuration by Admin.');
      return;
    }
    const clean = accountNum.trim();
    if (!clean) return;

    if (clean === currentUser.accountNumber) {
      showNotice('Cannot video call your own account number.');
      return;
    }

    if (blockedAccounts.includes(clean)) {
      showNotice(`Cannot video call. Account #${clean} is blocked.`);
      return;
    }

    playKeyTone(550, 0.2);
    const targetUser = accounts.find((a) => a.accountNumber === clean);
    const name = targetUser ? targetUser.name : `User #${clean}`;
    const role = targetUser ? targetUser.accountType : 'Trader';

    setVideoCallState({
      isOpen: true,
      targetAccount: clean,
      targetName: name,
      targetRole: role,
      targetPhoto: targetUser?.photoUrl,
      status: 'connecting',
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
    });

    if (videoConnectTimeoutRef.current) clearTimeout(videoConnectTimeoutRef.current);

    // Connect after 2.5 seconds
    videoConnectTimeoutRef.current = setTimeout(() => {
      setVideoCallState((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 2500);
  };

  // End Video Call
  const endVideoCall = () => {
    if (videoConnectTimeoutRef.current) {
      clearTimeout(videoConnectTimeoutRef.current);
      videoConnectTimeoutRef.current = null;
    }
    if (!videoCallState) return;
    playKeyTone(300, 0.2);

    const dur = videoCallState.durationSeconds;
    const minutes = Math.floor(dur / 60);
    const seconds = dur % 60;
    const durFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Log video call event into thread
    const threadId = `th_${[currentUser.accountNumber, videoCallState.targetAccount].sort().join('_')}`;
    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: videoCallState.targetAccount,
      type: 'call_log',
      content: `📹 Video Call ended. Duration: ${durFormatted}. AI Secure Encrypted Video Stream.`,
    });

    setVideoCallState(null);
  };

  // Open Chat directly from Dialer
  const startChatFromDialer = (accountNum: string) => {
    const clean = accountNum.trim();
    if (!clean) return;
    const threadId = `th_${[currentUser.accountNumber, clean].sort().join('_')}`;
    setActiveThreadId(threadId);
    setSidebarTab('chats');
    setMobileShowThread(true);

    const existingMsgs = LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber).filter((m) => m.threadId === threadId);
    if (existingMsgs.length === 0) {
      LocalEdgeDb.sendMessage({
        threadId,
        senderAccountNumber: currentUser.accountNumber,
        senderName: currentUser.name,
        recipientAccountNumber: clean,
        type: 'text',
        content: `Chat session initiated between Account #${currentUser.accountNumber} and #${clean}.`,
      });
    }
  };

  // Add Contact Handler
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);
    const clean = addContactTarget.trim();
    if (!clean) return;

    const res = LocalEdgeDb.addContact(currentUser.accountNumber, clean);
    setContactFeedback(res.message);
    if (res.success) {
      setContacts(LocalEdgeDb.getContacts(currentUser.accountNumber));
      setTimeout(() => {
        setAddContactModalOpen(false);
        setAddContactTarget('');
        setContactFeedback(null);
      }, 1200);
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = (contactAccount: string) => {
    LocalEdgeDb.deleteContact(currentUser.accountNumber, contactAccount);
    setContacts(LocalEdgeDb.getContacts(currentUser.accountNumber));
  };

  // Toggle Block Account Handler
  const handleToggleBlock = (targetAccount: string) => {
    const res = LocalEdgeDb.toggleBlockAccount(currentUser.accountNumber, targetAccount);
    setBlockedAccounts(LocalEdgeDb.getBlockedAccounts(currentUser.accountNumber));
    if (res.blocked) {
      showNotice(`Account #${targetAccount} has been blocked. They cannot call or message you.`);
    } else {
      showNotice(`Account #${targetAccount} unblocked successfully.`);
    }
  };

  // Device File Upload in Chat
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!inboxConfig.allowFileAttachments) {
        showNotice('File attachments are currently disabled by Admin in Shared Inbox configuration.');
        e.target.value = '';
        return;
      }
      const maxKb = Math.max(256, inboxConfig.maxAttachmentKb || 5120);
      if (file.size > maxKb * 1024) {
        showNotice(`Attachment exceeds Shared Inbox limit of ${maxKb.toLocaleString()} KB.`);
        e.target.value = '';
        return;
      }
      try {
        const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
        const compactUrl = await compressImageFile(file, 640, 0.68);
        setPendingFile({
          url: compactUrl,
          name: sanitizeFilename(file.name, 'attachment'),
          size: sizeStr,
        });
        setFileUploadModalOpen(true);
      } catch (err: any) {
        showNotice(err?.message || 'Blocked unsafe file attachment.');
      }
      e.target.value = '';
    }
  };

  // Confirm File Send
  const handleSendFileMessage = () => {
    if (!pendingFile || !activeThread) return;

    LocalEdgeDb.sendMessage({
      threadId: activeThread.threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: activeThread.partnerAccount,
      type: 'file',
      content: `Sent attachment: ${pendingFile.name} (${pendingFile.size})`,
      fileUrl: pendingFile.url,
      fileName: pendingFile.name,
      fileSize: pendingFile.size,
      orderId: activeThread.orderId,
    });

    setPendingFile(null);
    setFileUploadModalOpen(false);
  };

  // Send Tax & Delivery Adjustment Invoice in thread
  const handleSendTaxInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    const scanRef = scanPayloadForThreats(taxOrderRef, 'tax_invoice_ref');
    if (!scanRef.safe) {
      showNotice(scanRef.reason || '1st-Second Shield blocked unsafe Order Reference.');
      return;
    }

    const gst = Number(taxGstPercent) || 18;
    const delivery = Number(taxDeliveryFee) || 0;
    const insurance = Number(taxInsuranceFee) || 0;
    const ref = sanitizeTextInput(taxOrderRef) || `MNF-${Math.floor(100000 + Math.random() * 900000)}`;

    const text =
      `📄 FBR TAX & DELIVERY SPECIFICATION STATEMENT\n` +
      `Order Reference: ${ref}\n` +
      `FBR Sales Tax (GST): ${gst}%\n` +
      `Insured Delivery Charges: PKR ${delivery.toLocaleString()}\n` +
      `Theft/Missing Transit Insurance: PKR ${insurance.toLocaleString()}\n` +
      `Fulfilment Mode: Cash on Delivery / Direct Site Pickup\n` +
      `Note: Seller is responsible for paying FBR taxes and securing full transit replacement insurance.`;

    LocalEdgeDb.sendMessage({
      threadId: activeThread.threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: activeThread.partnerAccount,
      type: 'invoice',
      content: text,
      orderId: ref,
    });

    setTaxModalOpen(false);
    setTaxOrderRef('');
  };

  // Start new chat with 8-digit modal
  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    setNewChatError('');
    const clean = targetAccountNumber.trim();
    if (!clean) return;

    if (clean === currentUser.accountNumber) {
      setNewChatError('You cannot start a chat with your own account number.');
      return;
    }

    const threadId = `th_${[currentUser.accountNumber, clean].sort().join('_')}`;
    setActiveThreadId(threadId);
    setNewChatModalOpen(false);
    setTargetAccountNumber('');
    setSidebarTab('chats');
    setMobileShowThread(true);

    const existingMsgs = LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber).filter((m) => m.threadId === threadId);
    if (existingMsgs.length === 0) {
      LocalEdgeDb.sendMessage({
        threadId,
        senderAccountNumber: currentUser.accountNumber,
        senderName: currentUser.name,
        recipientAccountNumber: clean,
        type: 'text',
        content: `Chat session initiated between Account #${currentUser.accountNumber} and #${clean}.`,
      });
    }
  };

  // Submit Payment Reference to Admin
  const handleSubmitPaymentRef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRefNumber.trim()) return;

    const refScan = scanPayloadForThreats(paymentRefNumber, 'inbox_payment_ref');
    if (!refScan.safe) {
      showNotice(refScan.reason || '1st-Second Shield blocked unsafe payment reference.');
      return;
    }
    const cleanRef = sanitizeTextInput(paymentRefNumber);
    const safeReceipt = paymentSlipUrl && isSafeMediaUrl(paymentSlipUrl) ? paymentSlipUrl : undefined;

    const threadId = `th_system_${currentUser.accountNumber}`;
    LocalEdgeDb.sendMessage({
      threadId,
      senderAccountNumber: currentUser.accountNumber,
      senderName: currentUser.name,
      recipientAccountNumber: 'admin',
      type: 'payment_ref',
      content: `PAYMENT REFERENCE SUBMITTED: Ref #${cleanRef} for Munafa business subscription (PKR ${currentUser.subscription?.feePkr?.toLocaleString()}). Requesting 1-click unfreeze.`,
      fileUrl: safeReceipt,
      fileName: 'Bank_Transfer_Receipt.jpg',
    });

    const updatedUser: UserAccount = {
      ...currentUser,
      subscription: {
        ...currentUser.subscription,
        pendingPaymentRef: {
          refNumber: cleanRef,
          receiptUrl: safeReceipt,
          submittedAt: new Date().toISOString(),
          status: 'pending' as const,
        },
      },
    };
    try {
      LocalEdgeDb.saveAccount(updatedUser);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Unable to save payment reference.');
      return;
    }

    setPaymentRefModalOpen(false);
    setPaymentRefNumber('');
    setPaymentSlipUrl('');
    setActiveThreadId(threadId);
    setMobileShowThread(true);
  };

  // View / Print Invoice
  const handleViewInvoice = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const seller = accounts.find((a) => a.accountNumber === ord.sellerAccountNumber) || currentUser;
    const buyer = accounts.find((a) => a.accountNumber === ord.buyerAccountNumber) || currentUser;
    const html = PdfGenerator.generateInvoiceHtml(ord, seller, buyer);
    PdfGenerator.printDocument(html);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6">
      {inboxNotice && (
        <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-500 rounded-xl text-xs font-black text-amber-950 flex items-center justify-between gap-2 shadow-xs">
          <span>{inboxNotice}</span>
          <button
            type="button"
            onClick={() => setInboxNotice(null)}
            className="text-amber-900 underline font-black cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Universal FBR Tax & Transit Insurance Responsibility Notice (governed by Shared Inbox Config) */}
      {inboxConfig.showFbrTaxAndInsuranceNotice && (
        <div className={`mb-3 sm:mb-4 bg-[#f2fbf5] border-2 border-emerald-700/40 rounded-2xl p-3 sm:p-4 shadow-xs ${mobileShowThread ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-bold`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034720] border-2 border-[#d4af37] flex items-center justify-center text-[#fef08a] shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#fef08a]" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#023819] font-black flex items-center gap-2">
                <span>FBR TAX & TRANSIT INSURANCE OBLIGATION</span>
                <span className="bg-[#034720] text-[#fef08a] px-2 py-0.5 rounded text-[10px] font-mono">
                  LEGAL STATUTE
                </span>
              </div>
              <p className="text-xs text-stone-700 font-bold mt-0.5 leading-snug">
                {inboxConfig.defaultWelcomeBanner ||
                  'Farmers, Factories, and Wholesalers must remit applicable FBR taxes and cover transit insurance against theft or damage for Cash on Delivery. Buyers may inspect upon delivery or select Site Pickup.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaxModalOpen(true)}
            className="shrink-0 py-2 px-4 munafa-green-btn font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4 text-[#fef08a]" />
            <span>Adjust Tax & Delivery</span>
          </button>
        </div>
      )}

      <div className="bg-white border-2 border-emerald-700/35 rounded-2xl shadow-xs overflow-hidden h-[calc(100dvh-140px)] md:h-[760px] min-h-[500px] flex flex-col md:flex-row">
        {/* Left Column: Sidebar Navigation & Tabs */}
        <div className={`w-full md:w-84 lg:w-96 border-r-2 border-emerald-700/20 flex flex-col bg-white shrink-0 ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Header Title & Current User Account */}
          <div className="p-4 border-b-2 border-emerald-700/25 bg-[#eef7f1] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#023819] flex items-center gap-2">
                <span>Shared Inbox</span>
                <span className="text-[11px] font-mono text-[#fef08a] font-black bg-[#034720] border border-[#d4af37] px-2 py-0.5 rounded-md">
                  Acc #{currentUser.accountNumber}
                </span>
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(true)}
                  className="py-1.5 px-3 munafa-green-btn rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Start chat with 8-digit Account Number"
                >
                  <Plus className="w-3.5 h-3.5 text-[#fef08a]" />
                  <span>New</span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="py-1.5 px-2.5 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-400 border-2 border-emerald-300 text-[#023819] rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4 Mode Tabs: Chats, 8-Digit Dialer, Contacts, Blocked */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#d7ecdf] rounded-xl border border-emerald-700/25">
              <button
                type="button"
                onClick={() => setSidebarTab('chats')}
                className={`py-1.5 px-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'chats'
                    ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs'
                    : 'text-[#023819] hover:bg-white/80'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chats</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('dialer')}
                className={`py-1.5 px-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'dialer'
                    ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs'
                    : 'text-[#023819] hover:bg-white/80'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Dialer</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('contacts')}
                className={`py-1.5 px-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'contacts'
                    ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs'
                    : 'text-[#023819] hover:bg-white/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Contacts</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('blocked')}
                className={`py-1.5 px-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'blocked'
                    ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs'
                    : 'text-[#023819] hover:bg-white/80'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Blocked</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CHATS LIST */}
          {sidebarTab === 'chats' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-emerald-700/15 bg-white space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#046c31] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accounts or messages..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-[#023819]"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-0.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'system', label: 'System' },
                    { id: 'agent', label: '24/7 AI' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterType(f.id as any)}
                      className={`px-3 py-1 rounded-xl whitespace-nowrap cursor-pointer transition-colors border-2 font-black text-[11px] ${
                        filterType === f.id
                          ? 'bg-[#046c31] text-white border-[#023819] shadow-xs'
                          : 'bg-[#f2fbf5] text-[#023819] border-emerald-200 hover:border-emerald-500'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.threadId}
                    type="button"
                    onClick={() => {
                      setActiveThreadId(thread.threadId);
                      setMobileShowThread(true);
                    }}
                    className={`w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      activeThreadId === thread.threadId
                        ? 'bg-[#dcfce7]/80 border-l-4 border-[#046c31]'
                        : 'hover:bg-[#f2fbf5]'
                    }`}
                  >
                    {thread.isAgent ? (
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-700 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                        <Bot className="w-5 h-5 text-emerald-800" />
                      </div>
                    ) : thread.partnerPhoto ? (
                      <img
                        src={thread.partnerPhoto}
                        alt={thread.partnerName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-stone-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-300 text-stone-800 flex items-center justify-center font-black text-xs shrink-0">
                        {thread.partnerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-black text-xs text-black truncate">
                          {thread.partnerName}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono font-bold">
                          {new Date(thread.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[10px] text-stone-600 font-mono font-bold mb-1 truncate">
                        Acc #{thread.partnerAccount} · {thread.partnerRole}
                      </div>

                      <p className="text-xs text-stone-700 font-bold truncate leading-tight">
                        {thread.lastMessage.content}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.2 rounded-full tabular-nums shrink-0 self-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                ))}

                {filteredThreads.length === 0 && (
                  <div className="p-8 text-center text-xs text-stone-500 font-bold">
                    No conversation threads matching filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 8-DIGIT PHONE DIALER */}
          {sidebarTab === 'dialer' && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-white">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block">
                    8-Digit Direct Telecom Dialer
                  </span>
                  <div className="mt-2 min-h-12 bg-stone-50 border-2 border-stone-300 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs">
                    <span className="font-mono text-2xl font-black tracking-widest text-black pl-2">
                      {dialerNumber || <span className="text-stone-600 text-lg">Enter 8 Digits</span>}
                    </span>
                    {dialerNumber && (
                      <button
                        type="button"
                        onClick={handleDialerBackspace}
                        className="py-1 px-2.5 bg-white border border-stone-300 rounded-lg text-xs font-bold hover:bg-stone-100 cursor-pointer text-stone-700"
                      >
                        ⌫
                      </button>
                    )}
                  </div>

                  {/* Registered Match Detection */}
                  {dialedUser ? (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-left flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-emerald-950">{dialedUser.name}</div>
                        <div className="text-[10px] text-stone-600 font-bold uppercase">{dialedUser.accountType}</div>
                      </div>
                      <span className="text-[10px] bg-white border border-emerald-400 text-emerald-900 px-2 py-0.5 rounded font-black">
                        Verified
                      </span>
                    </div>
                  ) : dialerNumber.length === 8 ? (
                    <div className="mt-2 text-[11px] text-stone-500 font-bold">
                      Account #{dialerNumber} (External or New Peer)
                    </div>
                  ) : null}
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDialerDigit(d)}
                      className="h-13 bg-[#f2fbf5] hover:bg-[#dcfce7] active:scale-95 border-2 border-emerald-300 hover:border-[#046c31] rounded-2xl text-lg font-black text-[#023819] flex flex-col items-center justify-center cursor-pointer shadow-xs transition-transform"
                    >
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Call & Chat Action Buttons */}
              <div className="pt-4 border-t border-emerald-700/20 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!dialerNumber}
                    onClick={() => initiateAudioCall(dialerNumber)}
                    className="py-3 px-3 munafa-green-btn disabled:opacity-40 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-[#fef08a]" />
                    <span>Audio Call</span>
                  </button>

                  <button
                    type="button"
                    disabled={!dialerNumber}
                    onClick={() => initiateVideoCall(dialerNumber)}
                    className="py-3 px-3 bg-[#023819] hover:bg-[#034720] disabled:opacity-40 border-2 border-[#d4af37] text-[#fef08a] font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4 text-[#fef08a]" />
                    <span>Video Call</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!dialerNumber}
                    onClick={() => startChatFromDialer(dialerNumber)}
                    className="flex-1 py-2 px-3 bg-[#eef7f1] hover:bg-[#dcfce7] disabled:opacity-40 border-2 border-emerald-700 text-[#023819] font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#046c31]" />
                    <span>Open Direct Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDialerClear}
                    className="py-2 px-3 bg-white hover:bg-stone-100 border-2 border-stone-300 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACTS LIST */}
          {sidebarTab === 'contacts' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-3 border-b border-emerald-700/20 bg-[#f2fbf5] flex items-center justify-between">
                <span className="text-xs font-black text-[#023819]">
                  Saved Directory ({contacts.length})
                </span>
                <button
                  type="button"
                  onClick={() => setAddContactModalOpen(true)}
                  className="py-1 px-3 munafa-green-btn font-black text-xs rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#fef08a]" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-1">
                {contacts.map((c) => (
                  <div
                    key={c.accountNumber}
                    className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-300 text-stone-800 flex items-center justify-center font-black text-xs shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-black truncate">{c.name}</div>
                        <div className="text-[10px] text-stone-600 font-mono font-bold">
                          Acc #{c.accountNumber} · {c.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => initiateAudioCall(c.accountNumber)}
                        className="p-1.5 bg-white border border-stone-300 hover:border-emerald-600 rounded-lg text-black cursor-pointer shadow-2xs"
                        title="Voice Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-800" />
                      </button>
                      <button
                        type="button"
                        onClick={() => initiateVideoCall(c.accountNumber)}
                        className="p-1.5 bg-white border border-stone-300 hover:border-blue-600 rounded-lg text-black cursor-pointer shadow-2xs"
                        title="Video Call"
                      >
                        <Video className="w-3.5 h-3.5 text-black" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startChatFromDialer(c.accountNumber)}
                        className="p-1.5 bg-white border border-stone-300 hover:border-stone-500 rounded-lg text-black cursor-pointer shadow-2xs"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-black" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.accountNumber)}
                        className="p-1.5 bg-white border border-stone-300 hover:border-red-500 hover:text-red-700 rounded-lg text-stone-600 cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {contacts.length === 0 && (
                  <div className="p-8 text-center text-xs text-stone-500 font-bold">
                    No contacts saved. Click &ldquo;Add Contact&rdquo; to add any 8-digit peer.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BLOCKED ACCOUNTS */}
          {sidebarTab === 'blocked' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-3 border-b border-stone-200">
                <span className="text-xs font-black text-black">
                  Blocked Accounts ({blockedAccounts.length})
                </span>
                <p className="text-[10px] text-stone-600 font-bold mt-0.5">
                  Blocked accounts cannot call, video call, or send messages to your 8-digit account.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {blockedAccounts.map((accNum) => {
                  const match = accounts.find((a) => a.accountNumber === accNum);
                  return (
                    <div
                      key={accNum}
                      className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs font-bold shadow-2xs"
                    >
                      <div>
                        <div className="font-black text-black">
                          {match ? match.name : `Account #${accNum}`}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">Acc #{accNum}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(accNum)}
                        className="py-1 px-3 bg-white border border-stone-300 hover:bg-stone-50 text-emerald-900 font-black text-xs rounded-lg cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}

                {blockedAccounts.length === 0 && (
                  <div className="p-8 text-center text-xs text-stone-500 font-bold">
                    You have no blocked accounts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Chat Thread */}
        <div className={`flex-1 flex flex-col bg-[#f4fbf6] overflow-hidden ${!mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              {/* Chat Thread Header with Call & Options Controls */}
              <div className="px-3 sm:px-5 py-3 border-b-2 border-emerald-700/25 bg-[#eef7f1] flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Android Native Back Arrow on Mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1.5 -ml-1 bg-white text-[#023819] hover:bg-[#dcfce7] rounded-xl flex items-center gap-1 font-black cursor-pointer border-2 border-emerald-300 shrink-0 shadow-2xs"
                    title={isUrdu ? 'واپس' : 'Back'}
                  >
                    <ArrowLeft className="w-4 h-4 text-[#023819]" />
                    <span className="text-xs font-black">{isUrdu ? 'واپس' : 'Back'}</span>
                  </button>
                  {activeThread.isAgent ? (
                    <div className="w-10 h-10 rounded-full bg-[#034720] border-2 border-[#d4af37] text-[#fef08a] flex items-center justify-center font-black">
                      <Bot className="w-5 h-5 text-[#fef08a]" />
                    </div>
                  ) : activeThread.partnerPhoto ? (
                    <img
                      src={activeThread.partnerPhoto}
                      alt={activeThread.partnerName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#034720] border-2 border-[#d4af37] text-[#fef08a] flex items-center justify-center font-black text-xs">
                      {activeThread.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-[#023819]">{activeThread.partnerName}</h3>
                      <span className="text-[10px] font-mono text-[#fef08a] bg-[#034720] border border-[#d4af37] px-2 py-0.5 rounded font-black">
                        Acc #{activeThread.partnerAccount}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-900 font-bold">
                      {activeThread.isAgent
                        ? '24/7 Automated AI Guidance · Direct Admin Escalation Available'
                        : activeThread.partnerRole}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Audio Call Button */}
                  <button
                    type="button"
                    onClick={() => initiateAudioCall(activeThread.partnerAccount)}
                    className="py-1.5 px-3 munafa-green-btn text-xs font-black rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Start Voice Call"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#fef08a]" />
                    <span className="hidden sm:inline">Call</span>
                  </button>

                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={() => initiateVideoCall(activeThread.partnerAccount)}
                    className="py-1.5 px-3 bg-[#023819] hover:bg-[#034720] text-[#fef08a] border-2 border-[#d4af37] text-xs font-black rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Start Video Call"
                  >
                    <Video className="w-3.5 h-3.5 text-[#fef08a]" />
                    <span className="hidden sm:inline">Video</span>
                  </button>

                  {/* Block / Unblock Toggle */}
                  {!activeThread.isAgent && activeThread.partnerAccount !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(activeThread.partnerAccount)}
                      className={`p-2 rounded-xl border-2 transition-colors cursor-pointer text-xs font-bold ${
                        blockedAccounts.includes(activeThread.partnerAccount)
                          ? 'border-red-600 bg-red-50 text-red-900'
                          : 'border-emerald-300 bg-white text-[#023819] hover:border-red-500 hover:text-red-700'
                      }`}
                      title={
                        blockedAccounts.includes(activeThread.partnerAccount)
                          ? 'Unblock Account'
                          : 'Block Account'
                      }
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}

                  {currentUser.subscription?.status === 'frozen' && (
                    <button
                      type="button"
                      onClick={() => setPaymentRefModalOpen(true)}
                      className="py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white border-2 border-red-900 text-xs font-black rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-white" />
                      <span>Send Payment Slip</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f4fbf6]">
                {activeMessages.map((msg) => {
                  const isMe = msg.senderAccountNumber === currentUser.accountNumber;
                  const isSystem = msg.senderAccountNumber === 'system';
                  const isAgent = msg.senderAccountNumber === '00000000';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="max-w-xl mx-auto my-2">
                        <div className="bg-white border-2 border-stone-300 p-4 rounded-2xl text-xs space-y-1.5 shadow-xs">
                          <div className="flex items-center gap-2 text-stone-900 font-black">
                            <Shield className="w-4 h-4 text-emerald-800" />
                            <span>{msg.senderName}</span>
                            <span className="text-[10px] text-stone-500 font-mono font-bold ml-auto">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-stone-800 font-bold whitespace-pre-line leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'call_log') {
                    return (
                      <div key={msg.id} className="max-w-md mx-auto my-2 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50 border-2 border-stone-300 rounded-full text-xs font-mono font-bold text-black shadow-2xs">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{msg.content}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-lg ${
                        isMe ? 'ml-auto' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl text-xs space-y-1 border-2 ${
                          isMe
                            ? 'bg-[#dcfce7] text-[#023819] border-[#046c31] rounded-br-none shadow-xs font-bold'
                            : isAgent
                            ? 'bg-white text-[#023819] border-emerald-600 rounded-bl-none shadow-xs font-bold'
                            : 'bg-white text-black border-stone-300 rounded-bl-none shadow-xs font-bold'
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                            {isAgent && <Bot className="w-3 h-3 text-emerald-800 inline" />}
                            <span>{msg.senderName}</span>
                          </div>
                        )}

                        <p className="whitespace-pre-line leading-relaxed text-black font-bold">
                          {msg.content}
                        </p>

                        {/* Attached File Preview */}
                        {msg.fileUrl && isSafeMediaUrl(msg.fileUrl) && (
                          <div className="mt-2 pt-2 border-t border-stone-200">
                            {msg.fileUrl.startsWith('data:image') ? (
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'Attachment'}
                                className="max-h-48 rounded-xl object-cover border border-stone-300 shadow-2xs"
                              />
                            ) : msg.fileUrl.startsWith('data:video') ||
                              /\.(mp4|webm|mov|m4v)$/i.test(msg.fileName || '') ? (
                              <video
                                src={msg.fileUrl}
                                controls
                                className="max-h-56 w-full rounded-xl border border-stone-300 bg-black shadow-2xs"
                              />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                download={sanitizeFilename(msg.fileName || 'document.pdf')}
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-300 rounded-xl text-black font-bold text-xs hover:bg-stone-200"
                              >
                                <FileText className="w-4 h-4 text-emerald-800" />
                                <span>{msg.fileName || 'Download Document'}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Order Invoice Button */}
                        {msg.orderId && (
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(msg.orderId!)}
                            className="mt-2 py-1.5 px-3 bg-white border-2 border-stone-400 rounded-xl text-black font-black text-xs flex items-center gap-1.5 cursor-pointer hover:bg-stone-50 shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Order Invoice</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-stone-500 font-bold">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && (
                          <>
                            <span>·</span>
                            <span>{msg.delivered ? 'Delivered' : 'Sent'}</span>
                            <CheckCheck
                              className={`w-3.5 h-3.5 ${msg.isRead ? 'text-emerald-800' : 'text-stone-400'}`}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar with File Upload and Send Button */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t-2 border-emerald-700/20 bg-[#eef7f1] flex items-center gap-2"
              >
                {/* File Attachment Trigger (respects Admin Shared Inbox Config) */}
                {inboxConfig.allowFileAttachments && (
                  <label
                    className="p-2.5 rounded-xl border-2 border-emerald-400 hover:border-[#046c31] text-[#023819] bg-white cursor-pointer transition-colors shadow-2xs"
                    title="Attach photo, video, or PDF document"
                  >
                    <Paperclip className="w-4 h-4 text-[#046c31] font-black" />
                    <input
                      type="file"
                      accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      ref={fileInputRef}
                      onChange={handleSelectFile}
                      className="hidden"
                    />
                  </label>
                )}

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Reply to ${activeThread.partnerName}... (type question, price, or details)`}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-[#023819]"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 munafa-green-btn disabled:opacity-40 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center"
                >
                  <Send className="w-4 h-4 text-white font-black" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#023819]">
              <Bot className="w-12 h-12 mb-3 text-[#046c31]" />
              <p className="text-sm font-black text-[#023819]">Select a conversation thread or start a new chat</p>
            </div>
          )}
        </div>
      </div>

      {/* AUDIO CALL MODAL */}
      {audioCallState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-stone-300 p-6 text-center space-y-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono font-black text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                AI ENCRYPTED VOICE LINK
              </span>
              <span>HD P2P</span>
            </div>

            <div className="relative inline-block">
              {audioCallState.targetPhoto ? (
                <img
                  src={audioCallState.targetPhoto}
                  alt={audioCallState.targetName}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-emerald-700 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-stone-100 border-4 border-emerald-700 flex items-center justify-center mx-auto text-2xl font-black text-black shadow-md">
                  {audioCallState.targetName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-black">{audioCallState.targetName}</h3>
              <div className="text-xs font-mono font-bold text-stone-600">
                Account #{audioCallState.targetAccount} · {audioCallState.targetRole}
              </div>
              <div className="mt-2 text-sm font-mono font-black text-emerald-950">
                {audioCallState.status === 'dialing' && 'Calling...'}
                {audioCallState.status === 'ringing' && 'Ringing...'}
                {audioCallState.status === 'connected' && (
                  <span>
                    Connected · {Math.floor(audioCallState.durationSeconds / 60)}:
                    {(audioCallState.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {audioCallState.status === 'ended' && 'Call Ended'}
              </div>
            </div>

            {/* Audio Waveform simulation */}
            {audioCallState.status === 'connected' && (
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[12, 24, 18, 30, 16, 26, 20, 14, 28].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-emerald-600 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}

            {/* In-Call Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  setAudioCallState((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
                }
                className={`p-3.5 rounded-full border-2 cursor-pointer transition-colors ${
                  audioCallState.isMuted
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-stone-300 text-black hover:bg-stone-50'
                }`}
                title={audioCallState.isMuted ? 'Unmute' : 'Mute'}
              >
                {audioCallState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={endAudioCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-lg active:scale-95 transition-transform"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setAudioCallState((prev) => (prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null))
                }
                className={`p-3.5 rounded-full border-2 cursor-pointer transition-colors ${
                  audioCallState.isSpeaker
                    ? 'bg-white border-stone-800 text-black'
                    : 'bg-white border-stone-300 text-stone-500'
                }`}
                title={audioCallState.isSpeaker ? 'Speaker On' : 'Speaker Off'}
              >
                {audioCallState.isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO CALL MODAL */}
      {videoCallState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-stone-300 overflow-hidden shadow-2xl flex flex-col">
            {/* Video Call Top Bar */}
            <div className="p-4 bg-white border-b-2 border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-black">{videoCallState.targetName}</h3>
                <div className="text-xs font-mono font-bold text-stone-600">
                  Acc #{videoCallState.targetAccount} · {videoCallState.status === 'connected' ? 'Live Video Session' : 'Connecting...'}
                </div>
              </div>
              <div className="text-xs font-mono font-black text-emerald-950 bg-stone-100 border border-stone-300 px-3 py-1 rounded-full">
                {videoCallState.status === 'connected' ? (
                  <span>
                    {Math.floor(videoCallState.durationSeconds / 60)}:
                    {(videoCallState.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  'Connecting...'
                )}
              </div>
            </div>

            {/* Video Viewport Area */}
            <div className="relative bg-stone-900 h-96 flex items-center justify-center overflow-hidden">
              {videoCallState.targetPhoto ? (
                <img
                  src={videoCallState.targetPhoto}
                  alt={videoCallState.targetName}
                  className="w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="text-center text-[#fef08a] space-y-2">
                  <Video className="w-16 h-16 mx-auto text-[#fef08a]" />
                  <div className="font-bold text-sm text-white">Pakistani Trade Direct Video Stream</div>
                </div>
              )}

              {/* Self Video PIP (Picture-In-Picture) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#023819] rounded-xl border-2 border-[#facc15] shadow-xl overflow-hidden flex items-center justify-center">
                {videoCallState.isCameraOff ? (
                  <div className="text-[10px] text-[#fef08a] font-bold">Camera Off</div>
                ) : currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
                <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                  You
                </span>
              </div>
            </div>

            {/* Video Call Controls */}
            <div className="p-4 bg-white flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setVideoCallState((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
                }
                className={`p-3.5 rounded-full border-2 cursor-pointer transition-colors ${
                  videoCallState.isMuted
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-stone-300 text-black hover:bg-stone-50'
                }`}
                title={videoCallState.isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {videoCallState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  setVideoCallState((prev) =>
                    prev ? { ...prev, isCameraOff: !prev.isCameraOff } : null
                  )
                }
                className={`p-3.5 rounded-full border-2 cursor-pointer transition-colors ${
                  videoCallState.isCameraOff
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-stone-300 text-black hover:bg-stone-50'
                }`}
                title={videoCallState.isCameraOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {videoCallState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={endVideoCall}
                className="py-3 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-lg active:scale-95 transition-transform flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTACT */}
      {addContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-stone-300 p-6">
            <h3 className="text-base font-black text-black mb-1">Add Contact by 8-Digit Account</h3>
            <p className="text-xs text-stone-600 font-bold mb-4">
              Add any registered Pakistani farmer, miner, factory, wholesaler or shop to your direct contacts.
            </p>

            {contactFeedback && (
              <div className="mb-3 p-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-xs font-black text-black">
                {contactFeedback}
              </div>
            )}

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  8-Digit Peer Account Number
                </label>
                <input
                  type="text"
                  required
                  value={addContactTarget}
                  onChange={(e) => setAddContactTarget(e.target.value)}
                  placeholder="e.g. 71029415"
                  className="w-full px-3 py-2 text-sm font-mono font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddContactModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-700 hover:text-black font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Save to Contacts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATTACH FILE PREVIEW */}
      {fileUploadModalOpen && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 p-6 space-y-4">
            <h3 className="text-base font-black text-[#023819]">Send File / Receipt Attachment</h3>
            <div className="p-4 bg-[#f2fbf5] border-2 border-emerald-200 rounded-2xl text-center space-y-2">
              {pendingFile.url.startsWith('data:image') ? (
                <img
                  src={pendingFile.url}
                  alt={pendingFile.name}
                  className="max-h-48 mx-auto rounded-xl object-contain border border-stone-300"
                />
              ) : pendingFile.url.startsWith('data:video') ||
                /\.(mp4|webm|mov|m4v)$/i.test(pendingFile.name) ? (
                <video
                  src={pendingFile.url}
                  controls
                  className="max-h-52 w-full mx-auto rounded-xl border border-stone-300 bg-black"
                />
              ) : (
                <FileText className="w-12 h-12 text-emerald-800 mx-auto" />
              )}
              <div className="font-black text-xs text-black">{pendingFile.name}</div>
              <div className="text-[11px] text-stone-500 font-mono font-bold">{pendingFile.size}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setFileUploadModalOpen(false);
                }}
                className="px-4 py-2 text-xs text-stone-700 hover:text-black font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendFileMessage}
                className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Send to {activeThread?.partnerName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST FBR TAX & DELIVERY SPECIFICATION */}
      {taxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden">
            <div className="px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#fef08a]" />
                <span>Tax, GST & Insurance Specification</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-600 font-bold leading-relaxed">
                FBR legal statute: Farmers, Factories, and Wholesalers adjust applicable sales tax and transit theft insurance for customer orders.
              </p>

              <form onSubmit={handleSendTaxInvoice} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Order / Invoice Reference #
                  </label>
                  <input
                    type="text"
                    value={taxOrderRef}
                    onChange={(e) => setTaxOrderRef(e.target.value)}
                    placeholder="e.g. MNF-849201"
                    className="w-full px-3 py-2 text-xs font-mono font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      FBR Sales Tax (GST %)
                    </label>
                    <input
                      type="number"
                      required
                      value={taxGstPercent}
                      onChange={(e) => setTaxGstPercent(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      Courier Delivery Fee (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      value={taxDeliveryFee}
                      onChange={(e) => setTaxDeliveryFee(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Missing / Theft Transit Insurance (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={taxInsuranceFee}
                    onChange={(e) => setTaxInsuranceFee(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                  />
                  <span className="text-[10px] text-stone-500 font-bold block mt-1">
                    Covers full consignment reimbursement in case of courier loss or in-transit damage.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setTaxModalOpen(false)}
                    className="px-4 py-2 text-xs text-stone-700 hover:text-black font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    Post Statement to Chat
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: START CHAT BY 8-DIGIT ACCOUNT NUMBER */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden">
            <div className="px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37]">
              <h3 className="text-base font-black text-white">
                Start Chat by 8-Digit Account Number
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-stone-600 font-bold mb-4">
                Enter the recipient&apos;s verified Munafa account number to initiate encrypted conversation records.
              </p>

              {newChatError && (
                <div className="mb-3 p-3 bg-white border-2 border-red-500 text-red-800 text-xs font-black rounded-xl">
                  {newChatError}
                </div>
              )}

              <form onSubmit={handleStartNewChat} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Recipient Account Number (8 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    value={targetAccountNumber}
                    onChange={(e) => setTargetAccountNumber(e.target.value)}
                    placeholder="e.g. 71029415"
                    className="w-full px-3 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-black bg-white text-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewChatModalOpen(false)}
                    className="px-4 py-2 text-xs text-stone-700 hover:text-black font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    Open Chat Thread
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PAYMENT REFERENCE TO ADMIN */}
      {paymentRefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden">
            <div className="px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37]">
              <h3 className="text-base font-black text-white">
                Submit Subscription Payment Reference
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-stone-600 font-bold mb-4">
                Send your transaction ID or slip to Munafa Staff Admin to unfreeze your business account and restore marketplace listings.
              </p>

              <form onSubmit={handleSubmitPaymentRef} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Bank / JazzCash / EasyPaisa Reference #
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    placeholder="e.g. TRX-99882741"
                    className="w-full px-3 py-2.5 text-sm font-mono font-black border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Receipt Image or Slip Scan
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compactUrl = await compressImageFile(file, 640, 0.68);
                          setPaymentSlipUrl(compactUrl);
                        } catch (err: any) {
                          showNotice(err?.message || 'Blocked unsafe receipt file.');
                        }
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-2 file:border-emerald-700 file:bg-[#eef7f1] file:text-[#023819] file:font-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentRefModalOpen(false)}
                    className="px-4 py-2 text-xs text-stone-700 hover:text-black font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 munafa-green-btn rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    Send to Admin
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
