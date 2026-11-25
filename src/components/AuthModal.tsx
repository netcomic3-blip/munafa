/**
 * MUNAFA Unified Authentication Modal
 * Supports Signup (Buyers, Farmers/Mining, Factories, Wholesalers) with JazzCash / Bank Transfer,
 * Live Camera Snap, Terms & Offline Sync Consent, CNIC Recovery, and Change PIN.
 */

import React, { useState } from 'react';
import { UserAccount, AccountType } from '../types';
import { LocalEdgeDb, createAvatarSvg } from '../services/localEdgeDb';
import { useLanguage } from '../context/LanguageContext';
import { compressImageFile, captureCompressedVideoFrame } from '../utils/mediaCompression';
import { scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  Upload,
  Camera,
  User,
  KeyRound,
  ArrowRight,
  CreditCard,
  Smartphone,
  Landmark,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup' | 'changepin';
  onLoginSuccess: (account: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onLoginSuccess,
}) => {
  const { t, isUrdu } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'success' | 'recover' | 'changepin'>(
    initialMode
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankDetails = LocalEdgeDb.getBankDetails();

  // Login form state
  const [loginAccountNumber, setLoginAccountNumber] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [ntn, setNtn] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Subscription Payment state
  const [paymentChannel, setPaymentChannel] = useState<'jazzcash' | 'bank'>('jazzcash');
  const [subscriptionTxRef, setSubscriptionTxRef] = useState('');
  const [subscriptionSlipUrl, setSubscriptionSlipUrl] = useState('');

  // Consent Checkboxes
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSyncConsent, setAcceptedSyncConsent] = useState(false);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Change PIN state
  const [changePinMethod, setChangePinMethod] = useState<'pin' | 'cnic'>('pin');
  const [changePinAcc, setChangePinAcc] = useState('');
  const [changePinOldPin, setChangePinOldPin] = useState('');
  const [changePinNewPin, setChangePinNewPin] = useState('');
  const [changePinCnic, setChangePinCnic] = useState('');
  const [cnicLookupResult, setCnicLookupResult] = useState<{
    accountNumber: string;
    pin: string;
    name: string;
  } | null>(null);
  const [changePinSuccessMsg, setChangePinSuccessMsg] = useState('');

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');

  // Result state
  const [resultAccount, setResultAccount] = useState<{
    accountNumber: string;
    pin: string;
    name: string;
  } | null>(null);

  // Recovery CNIC
  const [recoverCnic, setRecoverCnic] = useState('');

  React.useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setChangePinSuccessMsg('');
    setCnicLookupResult(null);
  }, [initialMode, isOpen]);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFeePkr = (type: AccountType) => {
    if (type === 'farmer_mining') return 2000;
    if (type === 'factory') return 2000;
    if (type === 'wholesaler') return 1500;
    return 0;
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    for (const val of [fullName, address, phone, email, cnic, ntn, subscriptionTxRef]) {
      const scan = scanPayloadForThreats(val, 'auth_modal_signup');
      if (!scan.safe) {
        setErrorMessage(
          isUrdu
            ? 'سیکیورٹی شیلڈ نے غیر محفوظ یا مشکوک اندراج کو بلاک کر دیا ہے۔ براہِ کرم درست معلومات درج کریں۔'
            : scan.reason || 'Security shield blocked unsafe characters in registration form.'
        );
        return;
      }
    }

    const cleanCnic = cnic.replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      setErrorMessage(
        isUrdu
          ? 'شناختی کارڈ نمبر 13 ہندسوں کا ہونا لازمی ہے (مثلاً 42101-1234567-1)۔'
          : 'CNIC must be exactly 13 digits (e.g. 42101-1234567-1).'
      );
      return;
    }

    const existing = LocalEdgeDb.getAccountByCnic(cleanCnic);
    if (existing) {
      setErrorMessage(
        isUrdu
          ? 'یہ شناختی کارڈ پہلے سے منافع پر رجسٹرڈ ہے۔ براہِ کرم لاگ اِن کریں۔'
          : 'This CNIC is already registered on Munafa. Please log in or recover your account.'
      );
      return;
    }

    if (accountType !== 'customer' && !ntn.trim()) {
      setErrorMessage(
        isUrdu
          ? 'کاروباری اکاؤنٹ کے لیے این ٹی این (NTN) نمبر لازمی ہے۔'
          : 'NTN (National Tax Number) is mandatory for Farmer/Mining, Factory, and Wholesaler accounts.'
      );
      return;
    }

    if (accountType !== 'customer' && !subscriptionTxRef.trim()) {
      setErrorMessage(
        isUrdu
          ? 'کاروباری سرگرمی سے پہلے جاز کیش یا بینک ٹرانسفر ریفرنس نمبر درج کریں۔'
          : 'Please remit subscription via JazzCash or Bank Transfer and enter your Transaction Reference #.'
      );
      return;
    }

    if (!acceptedTerms || !acceptedSyncConsent) {
      setErrorMessage(
        isUrdu
          ? 'جاری رکھنے کے لیے شرائط و ضوابط اور آف لائن رسید کی اجازت قبول کریں۔'
          : 'Please accept Terms & Conditions and Invoice Sync Consent to proceed.'
      );
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setMode('otp');

    LocalEdgeDb.dispatchMobilePush({
      id: `otp-push-${Date.now()}`,
      title: 'MUNAFA Security OTP',
      body: `Your verification OTP is ${otp}.`,
      timestamp: new Date().toLocaleTimeString(),
      accountNumber: 'registration',
      type: 'otp',
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage(
        isUrdu
          ? 'غلط او ٹی پی کوڈ۔ براہِ کرم درست 6 ہندسے درج کریں۔'
          : 'Invalid OTP code. Please enter the 6 digits sent to your email.'
      );
      return;
    }

    try {
      const accountNumber = LocalEdgeDb.generateAccountNumber();
      const pin = LocalEdgeDb.generatePin();
      const nowIso = new Date().toISOString();
      const feePkr = getFeePkr(accountType);

      const newAccount: UserAccount = {
        accountNumber,
        pin,
        name: sanitizeTextInput(fullName),
        accountType,
        address: sanitizeTextInput(address),
        phone: sanitizeTextInput(phone),
        email: sanitizeTextInput(email).toLowerCase(),
        cnic: sanitizeTextInput(cnic),
        ntn: ntn.trim() ? sanitizeTextInput(ntn) : undefined,
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
                  refNumber: sanitizeTextInput(subscriptionTxRef),
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
        threadId: `th_system_${accountNumber}`,
        senderAccountNumber: 'system',
        senderName: 'MUNAFA Security Bureau',
        recipientAccountNumber: accountNumber,
        type: 'system',
        content: `WELCOME TO MUNAFA (Wage is registered with FBR Pakistan, NTN No: 1666865-7): Your 8-digit Account Number is [${accountNumber}] and 4-digit PIN is [${pin}].${
          accountType !== 'customer'
            ? ` Your ${paymentChannel.toUpperCase()} subscription payment (PKR ${feePkr.toLocaleString()}, Ref #${sanitizeTextInput(subscriptionTxRef)}) payable to Wage has been submitted. Admin will check your payment and activate your account.`
            : ' Buyer accounts are 100% Free and active immediately with zero extra order fees.'
        }`,
      });

      if (accountType !== 'customer') {
        LocalEdgeDb.sendMessage({
          threadId: `th_system_${accountNumber}`,
          senderAccountNumber: accountNumber,
          senderName: newAccount.name,
          recipientAccountNumber: 'admin',
          type: 'payment_ref',
          content: `NEW REGISTRATION PAYMENT (${accountType.replace('_', ' ').toUpperCase()}): Ref #${sanitizeTextInput(subscriptionTxRef)} via ${paymentChannel.toUpperCase()} · Amount PKR ${feePkr.toLocaleString()}. Please verify payment and click Activate Account.`,
          fileUrl: subscriptionSlipUrl || undefined,
          fileName: subscriptionSlipUrl ? 'Registration_Payment_Receipt.jpg' : undefined,
        });
      }

      setResultAccount({
        accountNumber,
        pin,
        name: newAccount.name,
      });

      setMode('success');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : isUrdu
          ? 'اکاؤنٹ محفوظ کرنے میں خرابی پیش آئی۔'
          : 'Unable to complete registration. Please check your entries.'
      );
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedAcc = loginAccountNumber.trim();
    const trimmedPin = loginPin.trim();

    if (trimmedAcc.toLowerCase() === LocalEdgeDb.getAdminAccount().accountNumber.toLowerCase()) {
      const adminCheck = LocalEdgeDb.verifyAdminLoginDetailed(trimmedAcc, trimmedPin);
      if (adminCheck.success) {
        onLoginSuccess(LocalEdgeDb.getAdminAccount());
        onClose();
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

    const auth = LocalEdgeDb.verifyUserLogin(trimmedAcc, trimmedPin);
    if (!auth.success || !auth.account) {
      setErrorMessage(
        auth.error ||
          (isUrdu
            ? 'غلط 8 ہندسی اکاؤنٹ نمبر یا 4 ہندسی خفیہ پن۔'
            : 'Invalid 8-digit Account Number or 4-digit PIN.')
      );
      return;
    }

    onLoginSuccess(auth.account);
    onClose();
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const lookup = LocalEdgeDb.lookupAccountByCnicWithRateLimit(recoverCnic);
    if (!lookup.success || !lookup.account) {
      setErrorMessage(
        lookup.error ||
          (isUrdu
            ? 'اس شناختی کارڈ پر کوئی اکاؤنٹ موجود نہیں ہے۔'
            : 'No registered account found matching this CNIC.')
      );
      return;
    }
    const acc = lookup.account;

    LocalEdgeDb.sendMessage({
      threadId: `th_system_${acc.accountNumber}`,
      senderAccountNumber: 'system',
      senderName: 'MUNAFA Security Recovery',
      recipientAccountNumber: acc.accountNumber,
      type: 'system',
      content: `RECOVERY NOTICE: Your Account Number is ${acc.accountNumber} and Secret PIN is ${acc.pin}.`,
    });

    setResultAccount({
      accountNumber: acc.accountNumber,
      pin: acc.pin,
      name: acc.name,
    });

    setMode('success');
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

  const handleSlipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          ? 'کیمرہ دستیاب نہیں ہے۔ براہِ کرم ڈیوائس سے تصویر اپ لوڈ کریں۔'
          : 'Camera access was blocked or is unavailable. Please upload a photo from your device.'
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

  const handleRetrieveInChangePin = () => {
    setErrorMessage('');
    setChangePinSuccessMsg('');
    const lookup = LocalEdgeDb.lookupAccountByCnicWithRateLimit(changePinCnic);
    if (!lookup.success || !lookup.account) {
      setCnicLookupResult(null);
      setErrorMessage(
        lookup.error ||
          (isUrdu
            ? 'اس شناختی کارڈ پر کوئی اکاؤنٹ موجود نہیں ہے۔'
            : 'No registered account found matching this CNIC.')
      );
      return;
    }
    const acc = lookup.account;
    setCnicLookupResult({
      accountNumber: acc.accountNumber,
      pin: acc.pin,
      name: acc.name,
    });
    setChangePinAcc(acc.accountNumber);
    setChangePinOldPin(acc.pin);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setChangePinSuccessMsg('');

    if (changePinNewPin.trim().length !== 4 || !/^\d{4}$/.test(changePinNewPin.trim())) {
      setErrorMessage(isUrdu ? 'نیا پن لازمی 4 ہندسوں پر مشتمل ہونا چاہیے۔' : 'New PIN must be exactly 4 digits.');
      return;
    }

    if (changePinMethod === 'cnic') {
      const res = LocalEdgeDb.resetPinByCnic(changePinCnic, changePinNewPin.trim());
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setCnicLookupResult({
        accountNumber: res.accountNumber || '',
        pin: changePinNewPin.trim(),
        name: res.name || '',
      });
      setChangePinSuccessMsg(
        isUrdu
          ? `شناختی کارڈ کی تصدیق کے بعد اکاؤنٹ #${res.accountNumber} کا نیا پن محفوظ ہو گیا ہے!`
          : `CNIC verified! Account #${res.accountNumber} PIN updated to ${changePinNewPin.trim()}.`
      );
      setTimeout(() => {
        if (res.accountNumber) setLoginAccountNumber(res.accountNumber);
        setLoginPin(changePinNewPin.trim());
        setMode('login');
        setChangePinSuccessMsg('');
      }, 1600);
      return;
    }

    const res = LocalEdgeDb.changePin(changePinAcc.trim(), changePinOldPin.trim(), changePinNewPin.trim());
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setChangePinSuccessMsg(
        isUrdu
          ? 'پن کامیابی سے تبدیل ہو گیا ہے! اب آپ نئے پن سے لاگ اِن کر سکتے ہیں۔'
          : 'PIN successfully updated! You can now log in with your new 4-digit PIN.'
      );
      setTimeout(() => {
        setLoginAccountNumber(changePinAcc.trim());
        setLoginPin(changePinNewPin.trim());
        setMode('login');
        setChangePinSuccessMsg('');
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden my-2 sm:my-8 max-h-[95dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 munafa-bg-header bg-[#034720] text-white flex items-center justify-between gap-3 shrink-0 border-b-2 border-[#d4af37]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-28 h-14 shrink-0 rounded-xl bg-white border-2 border-[#facc15] px-1.5 py-0.5 flex items-center justify-center shadow-sm">
              <img
                src="/assets/aistudio/image_65c6c502.png"
                alt="MUNAFA"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-[#fef08a] font-bold truncate">
                {t('brandTitle')} · {t('brandSubtitle')}
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                {mode === 'login' && t('logIn')}
                {mode === 'signup' && t('register')}
                {mode === 'otp' && t('enterOtpHeader')}
                {mode === 'success' && t('welcomeSuccessTitle')}
                {mode === 'recover' && t('recoverByCnicTitle')}
                {mode === 'changepin' && (isUrdu ? '4 ہندسی پن تبدیل کریں' : 'Change 4-Digit PIN')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:bg-emerald-900 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-xs text-stone-700 font-semibold bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                {isUrdu
                  ? 'داخل ہونے کے لیے اپنا 8 ہندسی اکاؤنٹ نمبر اور 4 ہندسی پن درج کریں۔'
                  : 'Enter your 8-digit Account Number and 4-digit PIN to access your Munafa account.'}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {t('enter8DigitAcc')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-700 absolute start-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={loginAccountNumber}
                    onChange={(e) => setLoginAccountNumber(e.target.value)}
                    placeholder="71029415"
                    className="w-full ps-9 pe-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold text-[#065f46]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {t('enter4DigitPin')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-emerald-700 absolute start-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="••••"
                    className="w-full ps-9 pe-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest font-bold text-[#065f46]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('recover');
                    }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer underline"
                  >
                    {t('forgotAccOrPin')}
                  </button>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('changepin');
                    }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer underline"
                  >
                    {isUrdu ? 'پن تبدیل کریں' : 'Change PIN'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('signup');
                  }}
                  className="text-stone-700 hover:text-stone-950 font-black cursor-pointer"
                >
                  {t('createNewAccount')}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 munafa-green-btn font-black text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{t('accessAccount')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE: SIGNUP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 pr-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {isUrdu ? 'اکاؤنٹ کی قسم' : 'Account Type'} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      id: 'customer',
                      title: isUrdu ? 'خریدار (دکان و گھر)' : 'Buyers (Shops & Homes)',
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
                      className={`p-2.5 rounded-xl border-2 text-left cursor-pointer transition-colors ${
                        accountType === opt.id
                          ? 'movingLightGreenWhite border-[#d4af37] bg-[#034720] text-white font-bold shadow-xs'
                          : 'border-emerald-300 bg-[#f2fbf5] hover:border-emerald-600 text-[#023819]'
                      }`}
                    >
                      <div className="font-bold">{opt.title}</div>
                      <div
                        className={`text-[10px] font-mono font-bold ${
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
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {t('fullNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Haji Muhammad Aslam"
                  className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {t('addressLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Millat Road, Faisalabad"
                  className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    {t('phoneLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold text-[#065f46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    {t('emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aslam@agro.pk"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    {t('cnicLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="xxxxx-xxxxxxx-x"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold text-[#065f46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    {t('ntnLabel')}{' '}
                    {accountType !== 'customer' ? <span className="text-red-500">*</span> : ''}
                  </label>
                  <input
                    type="text"
                    required={accountType !== 'customer'}
                    value={ntn}
                    onChange={(e) => setNtn(e.target.value)}
                    placeholder="1234567-8"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold text-[#065f46]"
                  />
                </div>
              </div>

              {/* Photo Capture */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {t('uploadPhotoLabel')} <span className="text-red-500">*</span>
                </label>

                {isCameraActive ? (
                  <div className="space-y-2.5 bg-stone-900 p-3.5 rounded-2xl text-center border-2 border-emerald-600">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-44 object-cover rounded-xl mx-auto bg-black"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={snapPhoto}
                        className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4 text-white" />
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
                  <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border-2 border-stone-200">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Uploaded preview"
                        className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-600"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#eef7f1] border-2 border-dashed border-emerald-400 flex items-center justify-center text-[#046c31]">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="py-1.5 px-3 munafa-green-btn font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isUrdu ? 'لائیو کیمرہ' : 'Live Camera Snap'}</span>
                        </button>
                        <label className="py-1.5 px-3 bg-[#eef7f1] border-2 border-[#046c31] text-[#023819] font-black text-xs rounded-xl hover:bg-[#dcfce7] cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-[#046c31]" />
                          <span>{isUrdu ? 'فائل منتخب کریں' : 'Choose File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <span className="text-[10px] text-stone-600 font-bold">{t('photoUploadDeviceDesc')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Subscription Payment for Business Accounts */}
              {accountType !== 'customer' && (
                <div className="bg-emerald-50/70 border-2 border-emerald-700 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-black text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-800" />
                      {isUrdu ? 'لازمی سبسکرپشن ادائیگی' : 'Subscription Payment'}
                    </span>
                    <span className="font-mono text-emerald-900">
                      {accountType === 'farmer_mining'
                        ? isUrdu
                          ? '2,000 روپے سالانہ'
                          : 'PKR 2,000 / Yr'
                        : accountType === 'factory'
                        ? isUrdu
                          ? '2,000 روپے ماہانہ'
                          : 'PKR 2,000 / Mo'
                        : isUrdu
                        ? '1,500 روپے ماہانہ'
                        : 'PKR 1,500 / Mo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('jazzcash')}
                      className={`p-2 rounded-lg border-2 text-left cursor-pointer flex items-center gap-1.5 font-black ${
                        paymentChannel === 'jazzcash'
                          ? 'border-[#d4af37] bg-[#034720] text-[#fef08a]'
                          : 'border-emerald-300 bg-white text-[#023819]'
                      }`}
                    >
                      <Smartphone className={`w-3.5 h-3.5 ${paymentChannel === 'jazzcash' ? 'text-[#fef08a]' : 'text-[#046c31]'}`} />
                      <span>{t('jazzCash')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('bank')}
                      className={`p-2 rounded-lg border-2 text-left cursor-pointer flex items-center gap-1.5 font-black ${
                        paymentChannel === 'bank'
                          ? 'border-[#d4af37] bg-[#034720] text-[#fef08a]'
                          : 'border-emerald-300 bg-white text-[#023819]'
                      }`}
                    >
                      <Landmark className={`w-3.5 h-3.5 ${paymentChannel === 'bank' ? 'text-[#fef08a]' : 'text-[#046c31]'}`} />
                      <span>{t('bankTransfer')}</span>
                    </button>
                  </div>

                  <div className="bg-white border border-emerald-300 rounded-lg p-2.5 font-mono text-[10px] space-y-0.5 text-stone-800">
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
                          <strong>{t('accountNumberLabel')}:</strong> {bankDetails.accountNumber}
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={subscriptionTxRef}
                    onChange={(e) => setSubscriptionTxRef(e.target.value)}
                    placeholder={t('enterTxRef')}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border-2 border-stone-300 rounded-lg bg-white text-[#065f46]"
                  />

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleSlipSelect}
                    className="w-full text-[10px] text-stone-700 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-emerald-700 file:text-[10px] file:font-bold file:bg-white cursor-pointer"
                  />
                </div>
              )}

              {/* Consent Checkboxes */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-[11px]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 accent-emerald-700"
                  />
                  <span className="font-bold text-stone-800 leading-snug">
                    {isUrdu
                      ? 'میں منافع کی شرائط و ضوابط قبول کرتا ہوں (منافع پلیٹ فارم کی فیسیں Wage کو قابلِ ادائیگی ہیں، رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7)۔'
                      : 'I accept Terms & Conditions (Munafa Platform fees are payable to Wage, registered with FBR Pakistan, NTN No: 1666865-7).'}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedSyncConsent}
                    onChange={(e) => setAcceptedSyncConsent(e.target.checked)}
                    className="mt-0.5 accent-emerald-700"
                  />
                  <span className="font-bold text-stone-800 leading-snug">
                    {isUrdu
                      ? 'میں آف لائن بلوں اور چیٹ ریکارڈز کی اپنی ڈیوائس پر مطابقت پذیری سے متفق ہوں۔'
                      : 'I consent to offline invoice and chat history synchronization on my device.'}
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-stone-700 hover:text-stone-950 font-bold cursor-pointer underline"
                >
                  {isUrdu ? 'پہلے سے اکاؤنٹ ہے؟ لاگ اِن کریں' : 'Already registered? Log In'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 munafa-green-btn font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{t('submitRequestOtp')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* MODE: OTP VERIFICATION */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-900 text-xs">
                <p className="font-semibold mb-1">{t('enterOtpHeader')}</p>
                <div className="mt-2 py-1 px-3 bg-white border border-emerald-300 font-mono text-base font-bold text-center tracking-widest text-emerald-800 rounded">
                  {generatedOtp}
                </div>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="582910"
                className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-[#065f46]"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-xs text-stone-600 hover:text-stone-900 font-bold cursor-pointer"
                >
                  {isUrdu ? '← معلومات درست کریں' : '← Edit Information'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 munafa-green-btn font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('verifyAndGenerate')}
                </button>
              </div>
            </form>
          )}

          {/* MODE: SUCCESS SCREEN */}
          {mode === 'success' && resultAccount && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center">
                <div className="w-10 h-10 bg-emerald-700 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-950">{t('welcomeSuccessTitle')}</h3>
                <p className="text-xs text-emerald-800 mt-1">{t('saveWarning')}</p>
                {accountType !== 'customer' ? (
                  <p className="text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-400 rounded-lg px-2.5 py-1.5 mt-2">
                    {isUrdu
                      ? 'آپ کی جاز کیش / بینک ادائیگی ایڈمن تصدیق کے لیے بھیج دی گئی ہے۔ ایڈمن ادائیگی چیک کر کے آپ کا اکاؤنٹ فعال کرے گا۔ کوئی اضافی فیس لاگو نہیں ہے۔'
                      : 'JazzCash / Bank payment submitted for Admin verification. Admin will check payment received and activate your account. Zero extra fees apply.'}
                  </p>
                ) : (
                  <p className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-400 rounded-lg px-2.5 py-1.5 mt-2">
                    {isUrdu
                      ? 'خریدار اکاؤنٹ 100% مفت ہے اور فوری طور پر فعال ہو گیا ہے۔'
                      : 'Buyer account is 100% Free and active immediately with zero extra fees.'}
                  </p>
                )}
              </div>

              <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    {isUrdu ? '8 ہندسوں کا اکاؤنٹ نمبر' : '8-Digit Account Number'}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-xl font-extrabold text-stone-900 tracking-wider">
                      {resultAccount.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(resultAccount.accountNumber, 'acc')}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-stone-300 rounded-md hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'acc' ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : t('copyAccountNumber')}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    {isUrdu ? '4 ہندسوں کا خفیہ پن' : '4-Digit Secret PIN'}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-xl font-extrabold text-stone-900 tracking-widest">
                      {resultAccount.pin}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(resultAccount.pin, 'pin')}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-stone-300 rounded-md hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'pin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'pin' ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : t('copyPin')}</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const acc = LocalEdgeDb.getAccountByNumber(resultAccount.accountNumber);
                  if (acc) onLoginSuccess(acc);
                  onClose();
                }}
                className="w-full py-2.5 munafa-green-btn font-black text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t('enterMunafaNow')}
              </button>
            </div>
          )}

          {/* MODE: FORGOT / RECOVER BY CNIC */}
          {mode === 'recover' && (
            <form onSubmit={handleRecoverSubmit} className="space-y-4">
              <div className="text-xs text-stone-700 font-semibold bg-stone-50 p-3 rounded-xl border border-stone-200">
                {t('recoverByCnicDesc')}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {t('cnicLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={recoverCnic}
                  onChange={(e) => setRecoverCnic(e.target.value)}
                  placeholder="35404-8920194-3"
                  className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold text-[#065f46]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-stone-600 hover:text-stone-900 cursor-pointer font-bold"
                >
                  {isUrdu ? '← واپس جائیں' : '← Back to Login'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 munafa-green-btn font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('retrieveCredentials')}
                </button>
              </div>
            </form>
          )}

          {/* MODE: CHANGE PIN & RETRIEVE BY CNIC */}
          {mode === 'changepin' && (
            <form onSubmit={handleChangePinSubmit} className="space-y-4">
              {/* Method Switcher: Current PIN vs Retrieve/Reset by CNIC */}
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

              {changePinSuccessMsg && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs rounded-xl flex items-center gap-2 font-black">
                  <Check className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{changePinSuccessMsg}</span>
                </div>
              )}

              {changePinMethod === 'pin' ? (
                <>
                  <div className="text-xs text-stone-700 bg-stone-50 p-3.5 rounded-xl border-2 border-stone-200 font-semibold">
                    {isUrdu
                      ? 'اپنا 8 ہندسی اکاؤنٹ نمبر، پرانا پن اور نیا 4 ہندسی پن درج کریں، یا شناختی کارڈ سے بازیاب کریں۔'
                      : 'Enter your 8-digit Account Number, current PIN, and desired new 4-digit PIN — or switch to Retrieve / Reset by CNIC.'}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      {t('enter8DigitAcc')}
                    </label>
                    <input
                      type="text"
                      required
                      value={changePinAcc}
                      onChange={(e) => setChangePinAcc(e.target.value)}
                      placeholder="71029415"
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold bg-white text-[#065f46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      {isUrdu ? 'موجودہ پن' : 'Current PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={changePinOldPin}
                      onChange={(e) => setChangePinOldPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest font-bold bg-white text-[#065f46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      {isUrdu ? 'نیا 4 ہندسی پن' : 'New 4-Digit PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={changePinNewPin}
                      onChange={(e) => setChangePinNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest font-bold bg-white text-[#065f46]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-emerald-950 bg-emerald-50 p-3.5 rounded-xl border-2 border-emerald-700/30 font-semibold">
                    {isUrdu
                      ? 'اپنا 13 ہندسی شناختی کارڈ نمبر درج کر کے فوری طور پر اپنا اکاؤنٹ نمبر و موجودہ پن معلوم کریں یا نیا 4 ہندسی پن سیٹ کریں۔'
                      : 'Enter your 13-digit CNIC number to retrieve your 8-digit Account Number & PIN, or set a new 4-digit PIN directly.'}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      {t('cnicLabel')} (13 Digits)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={changePinCnic}
                        onChange={(e) => setChangePinCnic(e.target.value)}
                        placeholder="35404-8920194-3"
                        className="flex-1 px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold bg-white text-[#065f46]"
                      />
                      <button
                        type="button"
                        onClick={handleRetrieveInChangePin}
                        className="px-3.5 py-2 munafa-gold-btn text-xs font-black rounded-xl cursor-pointer shrink-0 shadow-xs"
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
                            setMode('login');
                          }}
                          className="px-2.5 py-1 bg-[#034720] text-[#fef08a] rounded-lg text-[11px] font-sans font-extrabold cursor-pointer"
                        >
                          {isUrdu ? 'لاگ اِن پر بھریں' : 'Use in Login →'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-black uppercase mb-1">
                      {isUrdu ? 'نیا 4 ہندسی پن (تبدیل کرنے کے لیے)' : 'New 4-Digit PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={changePinNewPin}
                      onChange={(e) => setChangePinNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest font-bold bg-white text-[#065f46]"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-stone-600 hover:text-black cursor-pointer font-bold"
                  >
                    {isUrdu ? '← واپس جائیں' : '← Back to Login'}
                  </button>
                  {changePinMethod === 'pin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setChangePinMethod('cnic');
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-extrabold underline cursor-pointer"
                    >
                      {isUrdu ? 'شناختی کارڈ سے بازیاب کریں' : 'Retrieve by CNIC No →'}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-6 munafa-green-btn font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {changePinMethod === 'cnic'
                    ? isUrdu
                      ? 'شناختی کارڈ سے نیا پن محفوظ کریں'
                      : 'Reset PIN by CNIC'
                    : isUrdu
                    ? 'پن تبدیل کریں'
                    : 'Update PIN'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
