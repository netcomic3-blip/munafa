/**
 * MUNAFA — Made in Pakistan Marketplace
 * Full Dedicated Authentication, Subscription Payment & Registration Portal
 * Supports Buyers, Farmers/Mining, Factories & Wholesalers with Live Camera Capture,
 * JazzCash / Bank Transfer Onboarding, CNIC Recovery, and Change PIN.
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, AccountType } from '../types';
import { LocalEdgeDb, createAvatarSvg } from '../services/localEdgeDb';
import { useLanguage } from '../context/LanguageContext';
import { compressImageFile, captureCompressedVideoFrame } from '../utils/mediaCompression';
import { scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  Copy,
  Camera,
  Upload,
  ArrowRight,
  User,
  KeyRound,
  Mail,
  AlertCircle,
  Sparkles,
  Tractor,
  Building2,
  Boxes,
  ShoppingBag,
  Shield,
  CreditCard,
  Landmark,
  Smartphone,
} from 'lucide-react';

interface AuthPortalProps {
  onLoginSuccess: (account: UserAccount) => void;
  accounts: UserAccount[];
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess, accounts }) => {
  const { t, isUrdu } = useLanguage();
  const [activeMode, setActiveMode] = useState<
    'signup' | 'login' | 'otp' | 'success' | 'recover' | 'changepin'
  >('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankDetails = LocalEdgeDb.getBankDetails();

  // --- Registration Form Fields ---
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [ntn, setNtn] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Live Camera Capture ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Subscription Payment (Business Accounts) ---
  const [paymentChannel, setPaymentChannel] = useState<'jazzcash' | 'bank'>('jazzcash');
  const [subscriptionTxRef, setSubscriptionTxRef] = useState('');
  const [subscriptionSlipUrl, setSubscriptionSlipUrl] = useState('');

  // --- Legal & Privacy Consents ---
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSyncConsent, setAcceptedSyncConsent] = useState(false);

  // --- OTP Verification ---
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');

  // --- Generated / Recovered Credentials ---
  const [credentials, setCredentials] = useState<{
    accountNumber: string;
    pin: string;
    name: string;
    accountType: AccountType;
    email: string;
  } | null>(null);

  // --- Login Form Fields ---
  const [loginAccountNumber, setLoginAccountNumber] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // --- Recover Field ---
  const [recoverCnic, setRecoverCnic] = useState('');

  // --- Change PIN Fields ---
  const [changePinMethod, setChangePinMethod] = useState<'pin' | 'cnic'>('pin');
  const [changePinAcc, setChangePinAcc] = useState('');
  const [changePinOld, setChangePinOld] = useState('');
  const [changePinNew, setChangePinNew] = useState('');
  const [changePinCnic, setChangePinCnic] = useState('');
  const [cnicLookupResult, setCnicLookupResult] = useState<{
    accountNumber: string;
    pin: string;
    name: string;
  } | null>(null);
  const [changePinMsg, setChangePinMsg] = useState('');

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compactUrl = await compressImageFile(file, 360, 0.68);
        setPhotoUrl(compactUrl);
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Invalid or unsafe photo file blocked.');
      }
      e.target.value = '';
    }
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compactUrl = await compressImageFile(file, 640, 0.68);
        setSubscriptionSlipUrl(compactUrl);
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Invalid or unsafe receipt file blocked.');
      }
      e.target.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setErrorMessage('');
    } catch {
      setErrorMessage(
        isUrdu
          ? 'کیمرہ دستیاب نہیں ہے۔ براہِ کرم گیلری سے تصویر اپ لوڈ کریں۔'
          : 'Camera unavailable or blocked. Please select a photo file from your device.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const snapPhoto = () => {
    if (videoRef.current) {
      const compactSnapshot = captureCompressedVideoFrame(videoRef.current, 360, 0.68);
      if (compactSnapshot) {
        setPhotoUrl(compactSnapshot);
      }
      stopCamera();
    }
  };

  const getSubscriptionFee = (type: AccountType) => {
    if (type === 'farmer_mining') return 2000;
    if (type === 'factory') return 2000;
    if (type === 'wholesaler') return 1500;
    return 0;
  };

  // --- SUBMIT REGISTRATION ---
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    for (const val of [fullName, address, phone, email, cnic, ntn, subscriptionTxRef]) {
      const scan = scanPayloadForThreats(val, 'auth_portal_signup');
      if (!scan.safe) {
        setErrorMessage(
          isUrdu
            ? 'سیکیورٹی شیلڈ نے مشکوک یا غیر محفوظ مواد کو بلاک کر دیا ہے۔'
            : scan.reason || 'Security shield blocked unsafe registration characters.'
        );
        return;
      }
    }

    const cleanCnic = cnic.replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      setErrorMessage(
        isUrdu
          ? 'شناختی کارڈ نمبر کا 13 ہندسوں پر مشتمل ہونا لازمی ہے (xxxxx-xxxxxxx-x)۔'
          : 'CNIC Number must be exactly 13 digits (format: xxxxx-xxxxxxx-x).'
      );
      return;
    }

    const existingAccount = LocalEdgeDb.getAccountByCnic(cleanCnic);
    if (existingAccount) {
      setErrorMessage(
        isUrdu
          ? `یہ شناختی کارڈ نمبر پہلے سے اکاؤنٹ #${existingAccount.accountNumber} کے ساتھ رجسٹرڈ ہے۔ براہِ کرم لاگ اِن کریں یا بازیابی استعمال کریں۔`
          : `This CNIC is already registered to Account #${existingAccount.accountNumber}. Please log in or recover via CNIC.`
      );
      return;
    }

    if (accountType !== 'customer' && !ntn.trim()) {
      setErrorMessage(
        isUrdu
          ? 'کاروباری اکاؤنٹس (کسان، فیکٹری، ہول سیلر) کے لیے این ٹی این نمبر درج کرنا لازمی ہے۔'
          : 'NTN Number is required for business accounts (Farmer/Mining, Factory, Wholesaler).'
      );
      return;
    }

    if (accountType !== 'customer' && !subscriptionTxRef.trim()) {
      setErrorMessage(
        isUrdu
          ? 'کاروباری اکاؤنٹ شروع کرنے سے پہلے جاز کیش یا بینک ٹرانسفر کا ٹرانزیکشن ریفرنس نمبر درج کرنا لازمی ہے۔'
          : 'Please pay your subscription via JazzCash or Bank Transfer and enter the Transaction Reference Number to proceed.'
      );
      return;
    }

    if (!acceptedTerms || !acceptedSyncConsent) {
      setErrorMessage(
        isUrdu
          ? 'جاری رکھنے کے لیے شرائط و ضوابط اور آف لائن رسید مطابقت پذیری کی اجازت دینا لازمی ہے۔'
          : 'You must accept the Terms & Conditions and Invoice Sync consent to create an account.'
      );
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setActiveMode('otp');
  };

  // --- VERIFY OTP ---
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage(
        isUrdu
          ? 'غلط تصدیقی کوڈ۔ براہِ کرم اسکرین پر دکھایا گیا 6 ہندسوں کا درست کوڈ درج کریں۔'
          : 'Incorrect OTP. Please enter the exact 6-digit code provided.'
      );
      return;
    }

    try {
      const cleanCnic = cnic.replace(/\D/g, '');
      const accountNumber = LocalEdgeDb.generateAccountNumber();
      const pin = LocalEdgeDb.generatePin();
      const feePkr = getSubscriptionFee(accountType);
      const nowIso = new Date().toISOString();

      const newAccount: UserAccount = {
        accountNumber,
        pin,
        name: sanitizeTextInput(fullName),
        address: sanitizeTextInput(address),
        phone: sanitizeTextInput(phone),
        email: sanitizeTextInput(email).toLowerCase(),
        cnic: cleanCnic,
        ntn: ntn.trim() ? sanitizeTextInput(ntn) : undefined,
        accountType,
        photoUrl: photoUrl || createAvatarSvg(fullName.trim().slice(0, 2).toUpperCase() || 'MN', '#065f46'),
        createdAt: nowIso,
        lastActiveAt: nowIso,
        termsAcceptedAt: nowIso,
        deviceSyncConsent: acceptedSyncConsent,
        subscription: {
          status: accountType === 'customer' ? 'active' : 'frozen',
          cycle: accountType === 'farmer_mining' ? 'yearly' : 'monthly',
          feePkr,
          dueDate: new Date(Date.now() + 86400000 * (accountType === 'farmer_mining' ? 365 : 30))
            .toISOString()
            .split('T')[0],
          lastPaidAt: accountType !== 'customer' ? nowIso.split('T')[0] : undefined,
          paymentChannel: accountType !== 'customer' ? paymentChannel : undefined,
          amountOwed: accountType === 'customer' ? 0 : feePkr,
          pendingPaymentRef:
            accountType !== 'customer' && subscriptionTxRef.trim()
              ? {
                  refNumber: subscriptionTxRef.trim(),
                  channel: paymentChannel,
                  receiptUrl: subscriptionSlipUrl || undefined,
                  submittedAt: nowIso,
                  status: 'pending',
                }
              : undefined,
        },
      };

      LocalEdgeDb.saveAccount(newAccount);

      LocalEdgeDb.sendMessage({
        threadId: `th_system_${newAccount.accountNumber}`,
        senderAccountNumber: '00000000',
        senderName: 'MUNAFA Official HQ',
        recipientAccountNumber: newAccount.accountNumber,
        type: 'system',
        content: `WELCOME TO MUNAFA (Wage is registered with FBR Pakistan, NTN No: 1666865-7)!\n\nYour official credentials:\n• 8-Digit Account Number: ${newAccount.accountNumber}\n• 4-Digit Secret PIN: ${newAccount.pin}${
          accountType !== 'customer'
            ? `\n• Registration Subscription Submitted (${paymentChannel.toUpperCase()} — payable to Wage): Ref #${subscriptionTxRef.trim()} (PKR ${feePkr.toLocaleString()})\n• Status: Pending Admin verification. Once Admin checks payment received, your account will be activated with zero extra order fees.`
            : `\n• Buyer Membership: 100% Free & Active Immediately (zero extra fees on orders or ads).`
        }\n\nKeep these credentials safe. Your 8-digit Account Number and 4-digit PIN are your complete sign-in details.`,
      });

      if (accountType !== 'customer') {
        LocalEdgeDb.sendMessage({
          threadId: `th_system_${newAccount.accountNumber}`,
          senderAccountNumber: newAccount.accountNumber,
          senderName: newAccount.name,
          recipientAccountNumber: 'admin',
          type: 'payment_ref',
          content: `NEW REGISTRATION PAYMENT (${accountType.replace('_', ' ').toUpperCase()}): Ref #${subscriptionTxRef.trim()} via ${paymentChannel.toUpperCase()} · Fee PKR ${feePkr.toLocaleString()}. Please verify payment and click Activate Account.`,
          fileUrl: subscriptionSlipUrl || undefined,
          fileName: subscriptionSlipUrl ? 'Registration_Payment_Receipt.jpg' : undefined,
        });
      }

      setCredentials({
        accountNumber: newAccount.accountNumber,
        pin: newAccount.pin,
        name: newAccount.name,
        accountType: newAccount.accountType,
        email: newAccount.email,
      });

      setActiveMode('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(msg || (isUrdu ? 'اکاؤنٹ بنانے میں خرابی پیش آگئی ہے۔' : 'Failed to create account.'));
    }
  };

  // --- LOGIN ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedAcc = loginAccountNumber.trim();
    const trimmedPin = loginPin.trim();

    if (trimmedAcc.toLowerCase() === LocalEdgeDb.getAdminAccount().accountNumber.toLowerCase()) {
      const adminCheck = LocalEdgeDb.verifyAdminLoginDetailed(trimmedAcc, trimmedPin);
      if (adminCheck.success) {
        onLoginSuccess(LocalEdgeDb.getAdminAccount());
        return;
      }
      setErrorMessage(
        adminCheck.error ||
          (isUrdu
            ? 'درج شدہ ایڈمن معلومات درست نہیں ہیں۔'
            : 'Invalid Admin credentials.')
      );
      return;
    }

    const userCheck = LocalEdgeDb.verifyUserLogin(trimmedAcc, trimmedPin);
    if (userCheck.success && userCheck.account) {
      onLoginSuccess(userCheck.account);
    } else {
      setErrorMessage(
        userCheck.error ||
          (isUrdu
            ? 'درج شدہ 8 ہندسی اکاؤنٹ نمبر یا 4 ہندسی پن درست نہیں ہے۔ براہِ کرم دوبارہ چیک کریں یا شناختی کارڈ سے بازیابی کریں۔'
            : 'Invalid 8-digit Account Number or 4-digit PIN. Please check credentials or recover via CNIC.')
      );
    }
  };

  // --- RECOVER ---
  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const lookup = LocalEdgeDb.lookupAccountByCnicWithRateLimit(recoverCnic);
    if (!lookup.success || !lookup.account) {
      setErrorMessage(
        lookup.error ||
          (isUrdu
            ? `شناختی کارڈ نمبر ${recoverCnic} پر کوئی اکاؤنٹ موجود نہیں ہے۔`
            : `No account found for CNIC ${recoverCnic}. Please register a new account.`)
      );
      return;
    }
    const matched = lookup.account;

    LocalEdgeDb.sendMessage({
      threadId: `th_system_${matched.accountNumber}`,
      senderAccountNumber: '00000000',
      senderName: 'MUNAFA Security Recovery',
      recipientAccountNumber: matched.accountNumber,
      type: 'system',
      content: `ACCOUNT RECOVERY: Account Number: ${matched.accountNumber} | Secret PIN: ${matched.pin}.`,
    });

    setCredentials({
      accountNumber: matched.accountNumber,
      pin: matched.pin,
      name: matched.name,
      accountType: matched.accountType,
      email: matched.email,
    });

    setActiveMode('success');
  };

  // --- RETRIEVE ACCOUNT/PIN IN CHANGE PIN ---
  const handleRetrieveInChangePin = () => {
    setErrorMessage('');
    setChangePinMsg('');
    const lookup = LocalEdgeDb.lookupAccountByCnicWithRateLimit(changePinCnic);
    if (!lookup.success || !lookup.account) {
      setCnicLookupResult(null);
      setErrorMessage(
        lookup.error ||
          (isUrdu
            ? `شناختی کارڈ نمبر ${changePinCnic} پر کوئی اکاؤنٹ موجود نہیں ہے۔`
            : `No account found for CNIC ${changePinCnic}.`)
      );
      return;
    }
    const matched = lookup.account;
    setCnicLookupResult({
      accountNumber: matched.accountNumber,
      pin: matched.pin,
      name: matched.name,
    });
    setChangePinAcc(matched.accountNumber);
    setChangePinOld(matched.pin);
  };

  // --- CHANGE PIN ---
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setChangePinMsg('');

    if (changePinMethod === 'cnic') {
      const res = LocalEdgeDb.resetPinByCnic(changePinCnic, changePinNew.trim());
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setCnicLookupResult({
        accountNumber: res.accountNumber || '',
        pin: changePinNew.trim(),
        name: res.name || '',
      });
      setChangePinMsg(
        isUrdu
          ? `شناختی کارڈ کی تصدیق کے بعد اکاؤنٹ #${res.accountNumber} کا نیا پن محفوظ ہو گیا ہے!`
          : `CNIC verified! Account #${res.accountNumber} PIN updated to ${changePinNew.trim()}.`
      );
      setTimeout(() => {
        if (res.accountNumber) setLoginAccountNumber(res.accountNumber);
        setLoginPin(changePinNew.trim());
        setActiveMode('login');
        setChangePinMsg('');
      }, 1600);
      return;
    }

    const res = LocalEdgeDb.changePin(changePinAcc.trim(), changePinOld.trim(), changePinNew.trim());
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setChangePinMsg(
        isUrdu
          ? 'آپ کا 4 ہندسوں کا پن کامیابی سے تبدیل ہو گیا ہے۔ اب آپ نئے پن سے لاگ اِن کر سکتے ہیں۔'
          : 'Your 4-digit PIN has been updated. You may now log in with your new PIN.'
      );
      setTimeout(() => {
        setLoginAccountNumber(changePinAcc.trim());
        setLoginPin(changePinNew.trim());
        setActiveMode('login');
        setChangePinMsg('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* UNIFIED LOGIN, REGISTRATION, RECOVERY & CHANGE PIN CARD */}
      <div className="bg-white border-2 border-emerald-800/35 rounded-2xl sm:rounded-3xl shadow-md overflow-hidden">
        {/* Top Brand Plaque */}
        <div className="px-5 py-3.5 munafa-bg-header bg-[#034720] text-white border-b border-emerald-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-36 h-[72px] shrink-0 rounded-xl bg-white border-2 border-[#facc15] px-2 py-1 flex items-center justify-center shadow-md">
              <img
                src="/assets/aistudio/image_65c6c502.png"
                alt="MUNAFA"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="text-xs font-extrabold text-[#fef08a]">
            {t('fbrRegistered')}
          </div>
        </div>

        <div className="flex border-b-2 border-[#d4af37] bg-[#034720] text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'login', label: isUrdu ? '۱. لاگ اِن' : '1. Login (Account + PIN)' },
            { id: 'signup', label: isUrdu ? '۲. نیا اکاؤنٹ (رجسٹریشن)' : '2. Register Account' },
            { id: 'recover', label: isUrdu ? '۳. شناختی کارڈ سے بازیابی' : '3. Recover by CNIC' },
            { id: 'changepin', label: isUrdu ? '۴. پن تبدیل کریں' : '4. Change PIN' },
          ].map((tabBtn) => {
            const isTabActive =
              activeMode === tabBtn.id ||
              (tabBtn.id === 'signup' && (activeMode === 'otp' || activeMode === 'success'));
            return (
              <button
                key={tabBtn.id}
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setActiveMode(tabBtn.id as typeof activeMode);
                }}
                className={`flex-1 py-3.5 px-4 text-center border-b-4 transition-all cursor-pointer font-bold whitespace-nowrap ${
                  isTabActive
                    ? 'border-[#facc15] text-[#fef08a] bg-[#077a38] font-extrabold'
                    : 'border-transparent text-emerald-100 hover:text-white hover:bg-[#045c2a]'
                }`}
              >
                {tabBtn.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-8 bg-white">
          {errorMessage && (
            <div className="mb-5 p-4 bg-white border-2 border-red-500 text-red-900 text-xs sm:text-sm rounded-xl flex items-start gap-3 shadow-xs font-bold">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeMode === 'login' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'محفوظ لاگ اِن' : '8-Digit Account Access'}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-stone-900">
                  {isUrdu ? 'اپنے منافع اکاؤنٹ میں داخل ہوں' : 'Sign In to MUNAFA'}
                </h3>
                <p className="text-xs text-stone-600 font-semibold">
                  {isUrdu
                    ? 'داخل ہونے کے لیے اپنا 8 ہندسی اکاؤنٹ نمبر اور 4 ہندسی پن درج کریں۔'
                    : 'Enter your 8-digit Account Number and 4-digit PIN.'}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {isUrdu ? '8 ہندسوں پر مشتمل اکاؤنٹ نمبر' : '8-Digit Account Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-700 absolute start-3 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={loginAccountNumber}
                      onChange={(e) => setLoginAccountNumber(e.target.value)}
                      placeholder={isUrdu ? 'مثلاً 71029415' : 'e.g. 71029415'}
                      className="w-full ps-9 pe-3 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {isUrdu ? '4 ہندسوں کا خفیہ پن' : '4-Digit Secret PIN'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-emerald-700 absolute start-3 top-3.5 pointer-events-none" />
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="••••"
                      className="w-full ps-9 pe-3 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 tracking-widest font-bold text-[#065f46]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setActiveMode('recover');
                    }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer underline"
                  >
                    {isUrdu ? 'اکاؤنٹ یا پن بھول گئے؟' : 'Recover via CNIC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setActiveMode('changepin');
                    }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer underline"
                  >
                    {isUrdu ? 'پن تبدیل کریں' : 'Change PIN'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 munafa-green-btn font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>{isUrdu ? 'منافع میں داخل ہوں' : 'Authenticate & Enter MUNAFA'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SIGNUP */}
          {activeMode === 'signup' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="text-center space-y-1.5">
                <h3 className="text-2xl font-extrabold text-stone-900">
                  {isUrdu ? 'منافع رجسٹریشن فارم' : 'MUNAFA Account Registration Form'}
                </h3>
                <p className="text-xs text-stone-600 font-semibold max-w-lg mx-auto">
                  {isUrdu
                    ? 'رجسٹریشن کے بعد آپ کو 8 ہندسوں کا اکاؤنٹ نمبر اور 4 ہندسوں کا پن آپ کے اِن باکس میں موصول ہو جائے گا۔'
                    : 'Upon registration, your unique 8-digit Account Number and 4-digit PIN will be delivered to your Inbox.'}
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    {isUrdu ? 'اکاؤنٹ کی قسم منتخب کریں' : 'Select Account Type'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {[
                      {
                        id: 'customer',
                        title: isUrdu ? 'خریدار' : 'Buyer / Shop',
                        sub: isUrdu ? 'مفت خریداری' : 'Free buying',
                      },
                      {
                        id: 'farmer_mining',
                        title: isUrdu ? 'کسان / کان کنی' : 'Farmer / Mining',
                        sub: isUrdu ? '2,000 روپے سالانہ' : 'PKR 2,000 / year',
                      },
                      {
                        id: 'factory',
                        title: isUrdu ? 'فیکٹری' : 'Factory',
                        sub: isUrdu ? '2,000 روپے ماہانہ' : 'PKR 2,000 / month',
                      },
                      {
                        id: 'wholesaler',
                        title: isUrdu ? 'ہول سیلر' : 'Wholesaler',
                        sub: isUrdu ? '1,500 روپے ماہانہ' : 'PKR 1,500 / month',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccountType(opt.id as AccountType)}
                        className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          accountType === opt.id
                            ? 'movingLightGreenWhite border-[#d4af37] bg-[#034720] text-white font-bold shadow-xs'
                            : 'border-emerald-300 hover:border-emerald-600 text-[#023819] bg-[#f2fbf5]'
                        }`}
                      >
                        <div className="text-sm font-bold">{opt.title}</div>
                        <div
                          className={`text-[10px] font-mono font-bold mt-0.5 ${
                            accountType === opt.id ? 'text-[#fef08a]' : 'text-[#046c31]'
                          }`}
                        >
                          {opt.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('fullNameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isUrdu ? 'مثلاً حاجی محمد اسلم' : 'e.g. Haji Muhammad Aslam'}
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('addressLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isUrdu ? 'مثلاً چک 42، شیخوپورہ، پنجاب' : 'e.g. Gulberg III, Lahore, Punjab'}
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      {t('phoneLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      {t('emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@domain.pk"
                      className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      {t('cnicLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="xxxxx-xxxxxxx-x"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      {t('ntnLabel')}{' '}
                      {accountType !== 'customer' ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-stone-600 font-semibold">({isUrdu ? 'اختیاری' : 'Optional'})</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={accountType !== 'customer'}
                      value={ntn}
                      onChange={(e) => setNtn(e.target.value)}
                      placeholder="2849102-4"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                    />
                  </div>
                </div>

                {/* Live Camera or File Photo Capture */}
                <div className="bg-stone-50 p-4 rounded-xl border-2 border-stone-200 space-y-3">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {t('uploadPhotoLabel')} <span className="text-red-500">*</span>
                  </label>

                  {isCameraActive ? (
                    <div className="space-y-2.5 bg-stone-900 p-3.5 rounded-2xl text-center border-2 border-emerald-600">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 object-cover rounded-xl mx-auto bg-black"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={snapPhoto}
                          className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{isUrdu ? 'تصویر کھینچیں' : 'Snap Photo Now'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="py-2 px-3 bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Uploaded preview"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-600 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#eef7f1] border-2 border-dashed border-emerald-400 flex items-center justify-center text-[#046c31]">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="py-1.5 px-3 munafa-green-btn font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'کیمرہ کھولیں' : 'Live Camera Snap'}</span>
                          </button>
                          <label className="py-1.5 px-3 bg-[#eef7f1] border-2 border-[#046c31] text-[#023819] font-black text-xs rounded-xl hover:bg-[#dcfce7] cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-[#046c31]" />
                            <span>{isUrdu ? 'فائل منتخب کریں' : 'Upload File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="text-[11px] text-stone-600 font-semibold">
                          {t('photoUploadDeviceDesc')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mandatory Business Subscription Payment (JazzCash / Bank Transfer) */}
                {accountType !== 'customer' && (
                  <div className="bg-emerald-50/70 border-2 border-emerald-700 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                        <CreditCard className="w-4 h-4 text-emerald-800" />
                        <span>
                          {isUrdu
                            ? 'لازمی کاروباری سبسکرپشن ادائیگی'
                            : 'Mandatory Business Subscription Payment'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-400">
                        {accountType === 'farmer_mining'
                          ? isUrdu
                            ? '2,000 روپے سالانہ'
                            : 'PKR 2,000 / Year'
                          : accountType === 'factory'
                          ? isUrdu
                            ? '2,000 روپے ماہانہ'
                            : 'PKR 2,000 / Month'
                          : isUrdu
                          ? '1,500 روپے ماہانہ'
                          : 'PKR 1,500 / Month'}
                      </span>
                    </div>

                    <p className="text-stone-700 font-semibold leading-relaxed">
                      {isUrdu
                        ? 'منافع پر صرف یہی رجسٹریشن/رکنیت فیس جاز کیش یا بینک اکاؤنٹ ٹرانسفر کے ذریعے لاگو ہے (کوئی اور فیس لاگو نہیں)۔ ادائیگی چیک کرنے کے بعد ایڈمن آپ کا اکاؤنٹ فعال کرے گا۔'
                        : 'Payable via JazzCash or Bank Account Transfer. After checking payment received, Admin will activate your account. No other fees apply anywhere on orders or unlimited ads.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentChannel('jazzcash')}
                        className={`p-2.5 rounded-xl border-2 text-left cursor-pointer flex items-center gap-2 font-black ${
                          paymentChannel === 'jazzcash'
                            ? 'border-[#d4af37] bg-[#034720] text-[#fef08a] shadow-xs'
                            : 'border-emerald-300 bg-white text-[#023819]'
                        }`}
                      >
                        <Smartphone className={`w-4 h-4 ${paymentChannel === 'jazzcash' ? 'text-[#fef08a]' : 'text-[#046c31]'}`} />
                        <span>{t('jazzCash')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentChannel('bank')}
                        className={`p-2.5 rounded-xl border-2 text-left cursor-pointer flex items-center gap-2 font-black ${
                          paymentChannel === 'bank'
                            ? 'border-[#d4af37] bg-[#034720] text-[#fef08a] shadow-xs'
                            : 'border-emerald-300 bg-white text-[#023819]'
                        }`}
                      >
                        <Landmark className={`w-4 h-4 ${paymentChannel === 'bank' ? 'text-[#fef08a]' : 'text-[#046c31]'}`} />
                        <span>{t('bankTransfer')}</span>
                      </button>
                    </div>

                    <div className="bg-white border border-emerald-300 rounded-xl p-3 font-mono text-[11px] space-y-1 text-stone-800">
                      {paymentChannel === 'jazzcash' ? (
                        <>
                          <div>
                            <strong>{t('accountTitleLabel')}:</strong> {bankDetails.jazzCashTitle}
                          </div>
                          <div>
                            <strong>{t('mobileNumberLabel')}:</strong> {bankDetails.jazzCashNumber}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <strong>{t('bankNameLabel')}:</strong> {bankDetails.bankName}
                          </div>
                          <div>
                            <strong>{t('accountTitleLabel')}:</strong> {bankDetails.accountTitle}
                          </div>
                          <div>
                            <strong>{t('accountNumberLabel')}:</strong> {bankDetails.accountNumber} /{' '}
                            {bankDetails.iban}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black text-stone-800 uppercase mb-1">
                          {t('enterTxRef')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subscriptionTxRef}
                          onChange={(e) => setSubscriptionTxRef(e.target.value)}
                          placeholder={t('txRefPlaceholder')}
                          className="w-full px-3 py-2 text-xs font-mono font-bold border-2 border-stone-300 rounded-xl bg-white text-[#065f46]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-stone-800 uppercase mb-1">
                          {t('uploadSlipReceipt')}
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleSlipUpload}
                          className="w-full text-[11px] text-stone-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-emerald-700 file:text-xs file:font-bold file:bg-white file:text-emerald-950 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal Terms & Device Sync Consent Checkboxes */}
                <div className="bg-stone-50 border-2 border-stone-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-emerald-700 cursor-pointer"
                    />
                    <span className="font-bold text-stone-800 leading-snug">
                      {isUrdu
                        ? 'میں شرائط و ضوابط قبول کرتا ہوں۔ منافع پلیٹ فارم کی فیسیں Wage (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں۔'
                        : 'I accept Terms & Conditions. Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7), and Munafa acts strictly as a connecting marketplace.'}
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedSyncConsent}
                      onChange={(e) => setAcceptedSyncConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-emerald-700 cursor-pointer"
                    />
                    <span className="font-bold text-stone-800 leading-snug">
                      {isUrdu
                        ? 'میں آف لائن بلوں، چیٹ ریکارڈز اور اکاؤنٹ معلومات کے اپنی ڈیوائس پر محفوظ اور ہم آہنگ ہونے کی اجازت دیتا ہوں۔'
                        : 'I consent to offline invoice, order receipt, and chat history synchronization on my signed-in device.'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMode('login')}
                    className="text-xs text-stone-700 hover:text-stone-950 underline font-bold cursor-pointer"
                  >
                    {isUrdu ? 'پہلے سے اکاؤنٹ ہے؟ لاگ اِن کریں' : 'Already registered? Log In'}
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto py-3 px-8 munafa-green-btn font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{t('submitRequestOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: OTP VERIFICATION */}
          {activeMode === 'otp' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-extrabold text-stone-900">{t('enterOtpHeader')}</h3>
                <p className="text-xs text-stone-600 font-semibold">
                  {isUrdu ? `کوڈ بھیجا گیا: ${email}` : `Verification code dispatched to ${email}.`}
                </p>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl text-xs text-emerald-950 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  <span>{isUrdu ? 'ای میل تصدیقی کوڈ' : 'Email Verification Dispatch'}</span>
                </div>
                <div className="py-2.5 px-4 bg-white border-2 border-emerald-400 rounded-xl font-mono text-2xl font-extrabold text-center tracking-widest text-emerald-800">
                  {generatedOtp}
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="582910"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-extrabold text-[#065f46]"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMode('signup')}
                    className="text-xs text-stone-600 hover:text-stone-900 font-bold cursor-pointer"
                  >
                    {isUrdu ? '← معلومات درست کریں' : '← Edit Information'}
                  </button>

                  <button
                    type="submit"
                    className="py-3 px-6 munafa-green-btn font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {t('verifyAndGenerate')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CREDENTIALS DELIVERED */}
          {activeMode === 'success' && credentials && (
            <div className="max-w-lg mx-auto space-y-5">
              <div className="bg-emerald-50 border-2 border-emerald-400 p-6 rounded-2xl text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-800 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-emerald-950">{t('welcomeSuccessTitle')}</h3>
                <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                  {t('saveWarning')}
                </p>
                {credentials.accountType !== 'customer' ? (
                  <p className="text-xs font-extrabold text-amber-950 bg-amber-100 border border-amber-400 rounded-xl p-2.5">
                    {isUrdu
                      ? 'آپ کی جاز کیش / بینک ادائیگی ایڈمن کو بھیج دی گئی ہے۔ ایڈمن ادائیگی چیک کر کے بٹن کے ذریعے اکاؤنٹ فعال کر دے گا۔ کوئی دیگر فیس لاگو نہیں۔'
                      : 'Your JazzCash / Bank transfer has been submitted to Admin. After checking payment received, Admin will click Activate Account. No extra fees apply.'}
                  </p>
                ) : (
                  <p className="text-xs font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-400 rounded-xl p-2.5">
                    {isUrdu
                      ? 'خریدار اکاؤنٹ 100% مفت اور فوری طور پر فعال ہے۔'
                      : 'Buyer account is 100% Free and active immediately with zero extra fees.'}
                  </p>
                )}
              </div>

              <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-6 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-0.5">
                    {credentials.name}
                  </span>
                  <div className="text-xs text-emerald-900 font-bold capitalize">
                    {credentials.accountType.replace('_', ' ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isUrdu ? '8 ہندسوں کا اکاؤنٹ نمبر' : '8-Digit Account Number'}
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-wider">
                      {credentials.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(credentials.accountNumber, 'acc')}
                    className="py-2 px-3.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedField === 'acc' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'acc' ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : t('copyAccountNumber')}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isUrdu ? '4 ہندسوں کا خفیہ پن' : '4-Digit Secret PIN'}
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-widest">
                      {credentials.pin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(credentials.pin, 'pin')}
                    className="py-2 px-3.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'pin' ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : t('copyPin')}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const acc = LocalEdgeDb.getAccountByNumber(credentials.accountNumber);
                  if (acc) onLoginSuccess(acc);
                }}
                className="w-full py-3.5 munafa-green-btn font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('enterMunafaNow')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 5: RECOVER BY CNIC */}
          {activeMode === 'recover' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-extrabold text-stone-900">{t('recoverByCnicTitle')}</h3>
                <p className="text-xs text-stone-600 font-semibold leading-relaxed">{t('recoverByCnicDesc')}</p>
              </div>

              <form onSubmit={handleRecoverSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {t('cnicLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recoverCnic}
                    onChange={(e) => setRecoverCnic(e.target.value)}
                    placeholder="35404-8920194-3"
                    className="w-full px-4 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMode('login')}
                    className="text-xs text-stone-600 hover:text-stone-900 font-bold cursor-pointer underline"
                  >
                    {isUrdu ? '← لاگ اِن پر واپس جائیں' : '← Back to Login'}
                  </button>

                  <button
                    type="submit"
                    className="py-3 px-6 munafa-green-btn font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {t('retrieveCredentials')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: CHANGE PIN & RETRIEVE BY CNIC */}
          {activeMode === 'changepin' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-extrabold text-stone-900">
                  {isUrdu ? 'پن تبدیل کریں یا شناختی کارڈ سے بازیاب کریں' : 'Change PIN or Retrieve by CNIC'}
                </h3>
                <p className="text-xs text-stone-600 font-semibold">
                  {isUrdu
                    ? 'اپنے اکاؤنٹ نمبر و پرانے پن سے تبدیل کریں، یا 13 ہندسی شناختی کارڈ نمبر سے معلوم/تبدیل کریں۔'
                    : 'Enter your 8-digit Account Number and current PIN, or switch to Retrieve / Reset directly by CNIC No.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-emerald-50 border-2 border-emerald-800/30 rounded-xl text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setChangePinMethod('pin');
                  }}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                    changePinMethod === 'pin'
                      ? 'bg-[#034720] text-[#fef08a] shadow-xs'
                      : 'text-[#023819] hover:bg-emerald-100'
                  }`}
                >
                  {isUrdu ? 'موجودہ پن سے تبدیل کریں' : 'Via Account & Current PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setChangePinMethod('cnic');
                  }}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                    changePinMethod === 'cnic'
                      ? 'bg-[#034720] text-[#fef08a] shadow-xs'
                      : 'text-[#023819] hover:bg-emerald-100'
                  }`}
                >
                  {isUrdu ? 'شناختی کارڈ سے بازیاب/تبدیل کریں' : 'Retrieve / Reset by CNIC'}
                </button>
              </div>

              {changePinMsg && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{changePinMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePinSubmit} className="space-y-4">
                {changePinMethod === 'pin' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        {isUrdu ? '8 ہندسوں کا اکاؤنٹ نمبر' : '8-Digit Account Number'}
                      </label>
                      <input
                        type="text"
                        required
                        value={changePinAcc}
                        onChange={(e) => setChangePinAcc(e.target.value)}
                        placeholder="71029415"
                        className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        {isUrdu ? 'موجودہ پن' : 'Current 4-Digit PIN'}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={changePinOld}
                        onChange={(e) => setChangePinOld(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 tracking-widest font-bold text-[#065f46]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        {t('cnicLabel')} (13 Digits)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={changePinCnic}
                          onChange={(e) => setChangePinCnic(e.target.value)}
                          placeholder="35404-8920194-3"
                          className="flex-1 px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                        />
                        <button
                          type="button"
                          onClick={handleRetrieveInChangePin}
                          className="px-4 py-2.5 munafa-gold-btn text-xs font-black rounded-xl cursor-pointer shrink-0 shadow-xs"
                        >
                          {isUrdu ? 'معلوم کریں' : 'Retrieve'}
                        </button>
                      </div>
                    </div>

                    {cnicLookupResult && (
                      <div className="p-3.5 bg-[#f2fbf5] border-2 border-[#046c31] rounded-xl text-xs space-y-1.5">
                        <div className="font-black text-[#023819]">
                          {isUrdu ? 'بازیاب شدہ اکاؤنٹ:' : 'Retrieved Account:'} {cnicLookupResult.name}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono font-black text-[#034720]">
                          <span>Acc #: {cnicLookupResult.accountNumber}</span>
                          <span>PIN: {cnicLookupResult.pin}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginAccountNumber(cnicLookupResult.accountNumber);
                              setLoginPin(cnicLookupResult.pin);
                              setActiveMode('login');
                            }}
                            className="px-2.5 py-1 bg-[#034720] text-[#fef08a] rounded-lg text-[11px] font-sans font-extrabold cursor-pointer"
                          >
                            {isUrdu ? 'لاگ اِن پر بھریں' : 'Use in Login →'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    {isUrdu ? 'نیا 4 ہندسی پن' : 'New 4-Digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={changePinNew}
                    onChange={(e) => setChangePinNew(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 tracking-widest font-bold text-[#065f46]"
                  />
                </div>

                {changePinMethod === 'pin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setChangePinMethod('cnic');
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-extrabold underline cursor-pointer"
                    >
                      {isUrdu ? 'پن یا اکاؤنٹ نمبر بھول گئے؟ شناختی کارڈ سے بازیاب کریں →' : 'Forgot Account # or PIN? Retrieve by CNIC No →'}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 munafa-green-btn font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {changePinMethod === 'cnic'
                    ? isUrdu
                      ? 'شناختی کارڈ سے نیا پن محفوظ کریں'
                      : 'Reset 4-Digit PIN by CNIC'
                    : isUrdu
                    ? 'نیا پن محفوظ کریں'
                    : 'Update 4-Digit PIN'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* QUICK NON-ADMIN SAMPLE ACCOUNT ACCESS */}
      <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-5 text-xs shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <span className="font-extrabold text-[#023819] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#046c31]" />
            <span>
              {isUrdu
                ? 'فوری نمونہ اکاؤنٹ جائزہ (کسی بھی کردار پر کلک کریں):'
                : 'Quick Marketplace Role Preview (Select a Registered Member):'}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {accounts
            .filter((acc) => acc.accountType !== 'admin' && !acc.isDeleted)
            .map((acc) => (
              <button
                key={acc.accountNumber}
                type="button"
                onClick={() => onLoginSuccess(acc)}
                className="py-2 px-3.5 bg-[#f2fbf5] hover:bg-[#dcfce7] hover:border-[#046c31] border-2 border-emerald-300 rounded-xl font-bold text-[#023819] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="font-extrabold font-mono text-[#046c31]">#{acc.accountNumber}</span>
                <span className="font-bold">{acc.name.split(' ')[0]}</span>
                <span className="text-[10px] text-stone-700 font-bold capitalize">
                  (
                  {acc.accountType === 'farmer_mining'
                    ? isUrdu
                      ? 'کسان/مائننگ'
                      : 'Farmer'
                    : acc.accountType === 'factory'
                    ? isUrdu
                      ? 'فیکٹری'
                      : 'Factory'
                    : acc.accountType === 'wholesaler'
                    ? isUrdu
                      ? 'ہول سیلر'
                      : 'Wholesaler'
                    : isUrdu
                    ? 'خریدار'
                    : 'Buyer'}
                  )
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* SECTION 1: ABOUT MUNAFA & FBR CHARTER */}
      <div className="bg-white text-stone-900 rounded-3xl p-6 sm:p-8 border-2 border-stone-300 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-2 border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 uppercase tracking-widest mb-1.5">
              <span>{t('brandSubtitle')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('fbrRegistered')}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-950">
                {t('brandTitle')}
              </h2>
            </div>
            <p className="text-stone-800 text-sm mt-3 max-w-3xl leading-relaxed font-semibold">
              {isUrdu ? (
                <>
                  منافع ایک رابطے کا قومی پلیٹ فارم ہے جو پاکستانی کسانوں، کان کنوں، کارخانوں اور تھوک فروشوں کو براہِ راست دکانوں اور گھرانوں سے جوڑتا ہے۔ منافع پلیٹ فارم کی فیسیں Wage (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں۔
                </>
              ) : (
                <>
                  MUNAFA connects Pakistani farmers, miners, factories, and wholesalers directly with shops and households nationwide. Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7), while serving strictly as a connecting marketplace offering direct chat, 8-digit calling, order records, commercial GST invoices, and transparent subscription billing.
                </>
              )}
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-800 p-5 rounded-2xl text-xs space-y-2 shrink-0 max-w-xs shadow-xs">
            <div className="flex items-center gap-2 font-extrabold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>{t('fbrRegistered')}</span>
            </div>
            <p className="text-stone-800 text-xs font-semibold leading-relaxed">
              {isUrdu
                ? 'تمام کاروباری حضرات اپنی مصنوعات، ایف بی آر ٹیکس ادائیگی اور بیمہ شدہ ترسیل کے خود ذمہ دار ہیں۔'
                : 'Verified sellers issue transparent FBR GST invoices and arrange insured COD delivery directly with buyers.'}
            </p>
          </div>
        </div>

        {/* Core Legal Disclaimer */}
        <div className="bg-white border-2 border-amber-500 rounded-2xl p-5 text-xs text-stone-900 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-extrabold text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="uppercase tracking-wider">{t('coreDisclaimerTitle')}</span>
          </div>
          <p className="leading-relaxed text-[13px] text-stone-950 font-bold">{t('coreDisclaimerShort')}</p>
        </div>
      </div>

      {/* SECTION 2: THE FIVE ACCOUNT TYPES & STANDARDIZED MEMBERSHIP RATES */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-950">
            {isUrdu ? 'اکاؤنٹس کی اقسام اور رکنیت فیس' : 'Account Types & Membership Rates'}
          </h2>
          <p className="text-xs text-stone-600 font-bold">
            {isUrdu
              ? 'ہر اکاؤنٹ کو 8 ہندسوں کا مخصوص اکاؤنٹ نمبر، 4 ہندسوں کا پن اور مشترکہ اِن باکس ملتا ہے۔'
              : 'Every account receives an 8-digit Account Number, 4-digit Secret PIN, and unified Inbox with dialer & calling.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-700 text-emerald-900 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-stone-950 text-base">
                {isUrdu ? 'خریدار (دکان و گھر)' : 'Buyers'}
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1.5 leading-relaxed">
                {isUrdu
                  ? 'دکانیں اور عام گھریلو صارفین جو براہِ راست مال خریدتے ہیں۔'
                  : 'Shops and households ordering directly from producers.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-stone-200 text-xs font-mono text-emerald-900 font-extrabold">
              {isUrdu ? '100% مفت' : '100% Free'}
            </div>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-amber-600 text-amber-900 flex items-center justify-center mb-3">
                <Tractor className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-stone-950 text-base">
                {isUrdu ? 'کسان / کان کنی' : 'Farmers & Mining'}
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1.5 leading-relaxed">
                {isUrdu
                  ? 'زرعی اجناس، فصلیں اور قدرتی معدنیات فراہم کرنے والے۔'
                  : 'Producers of agricultural harvests and mineral commodities.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-stone-200 text-xs font-mono text-stone-900 font-extrabold">
              {isUrdu ? '2,000 روپے / سالانہ' : 'PKR 2,000 / Year'}
            </div>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-800 text-emerald-900 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-stone-950 text-base">
                {isUrdu ? 'فیکٹریاں' : 'Factories'}
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1.5 leading-relaxed">
                {isUrdu
                  ? 'صنعتی اور مینوفیکچرڈ مال براہِ راست فراہم کرنے والے۔'
                  : 'Industrial manufacturing plants supplying direct buyers.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-stone-200 text-xs font-mono text-stone-900 font-extrabold">
              {isUrdu ? '2,000 روپے / ماہانہ' : 'PKR 2,000 / Month'}
            </div>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-700 text-emerald-900 flex items-center justify-center mb-3">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-stone-950 text-base">
                {isUrdu ? 'ہول سیلرز' : 'Wholesalers'}
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1.5 leading-relaxed">
                {isUrdu
                  ? 'تھوک اور بلک مقدار میں دکان داروں کو مال فراہم کرنے والے۔'
                  : 'Bulk trade distributors supplying retail markets.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-stone-200 text-xs font-mono text-stone-900 font-extrabold">
              {isUrdu ? '1,500 روپے / ماہانہ' : 'PKR 1,500 / Month'}
            </div>
          </div>

          <div className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-900 text-emerald-950 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-stone-950 text-base">
                {isUrdu ? 'ایڈمن کنٹرول' : 'Admin Operations'}
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1.5 leading-relaxed">
                {isUrdu
                  ? 'مجاز عملہ کی تصدیق، سبسکرپشن بحالی اور تنازعات کا حل۔'
                  : 'Authorized dispute review, compliance & seller reactivation.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-stone-200 text-xs font-mono text-stone-900 font-extrabold">
              {isUrdu ? 'مجاز عملہ' : 'Verified Staff'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
