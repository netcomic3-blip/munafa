/**
 * MUNAFA Unified Ad Posting Form
 * Allows Farmers, Miners, Factories, Wholesalers, and Registered Sellers to publish
 * product listings with Name, Category Section, Description, Photo (Upload/Camera),
 * Price (PKR), Tax Amount (PKR) & GST %, Stock Quantity, City, and Submit.
 * Automatically publishes to the Main Page and the corresponding Sector Section.
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, ProductItem, ProductCategory, ProductUnit } from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { useLanguage } from '../context/LanguageContext';
import { compressImageFile, captureCompressedVideoFrame } from '../utils/mediaCompression';
import { isSafeMediaUrl, scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import { getFallbackProductImage } from '../assets/productAssets';
import {
  Camera,
  Upload,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  X,
  Tractor,
  Factory,
  Boxes,
  Megaphone,
  LogIn,
} from 'lucide-react';

interface AdPostingFormProps {
  currentUser: UserAccount | null;
  defaultCategory?: 'all' | ProductCategory;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onCancel?: () => void;
  onPublished?: (product: ProductItem) => void;
}

const resolveInitialCategory = (
  currentUser: UserAccount | null,
  defaultCategory?: 'all' | ProductCategory
): ProductCategory => {
  if (defaultCategory && defaultCategory !== 'all') {
    return defaultCategory;
  }
  if (currentUser?.accountType === 'farmer_mining') return 'farm_mining';
  if (currentUser?.accountType === 'factory') return 'factory';
  if (currentUser?.accountType === 'wholesaler') return 'wholesale';
  return 'farm_mining';
};

export const AdPostingForm: React.FC<AdPostingFormProps> = ({
  currentUser,
  defaultCategory,
  onOpenAuth,
  onCancel,
  onPublished,
}) => {
  const { isUrdu } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>(() =>
    resolveInitialCategory(currentUser, defaultCategory)
  );
  const [unit, setUnit] = useState<ProductUnit>('bag');
  const [pricePerUnit, setPricePerUnit] = useState<number>(5000);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [taxAmountPkr, setTaxAmountPkr] = useState<number>(900);
  const [quantityAvailable, setQuantityAvailable] = useState<number>(100);
  const [minOrderQty, setMinOrderQty] = useState<number>(1);
  const [city, setCity] = useState<string>(
    currentUser?.address ? currentUser.address.split(',').pop()?.trim() || 'Lahore' : 'Lahore'
  );
  const [sellerPhone, setSellerPhone] = useState<string>(currentUser?.phone || '');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [publishedSuccess, setPublishedSuccess] = useState<ProductItem | null>(null);

  // Live Camera Capture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCategory(resolveInitialCategory(currentUser, defaultCategory));
    if (currentUser) {
      setCity(currentUser.address.split(',').pop()?.trim() || 'Lahore');
      setSellerPhone(currentUser.phone || '');
    }
  }, [currentUser?.accountNumber, defaultCategory]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const handlePriceChange = (newPrice: number) => {
    const safePrice = Number.isFinite(newPrice) && newPrice >= 0 ? newPrice : 0;
    setPricePerUnit(safePrice);
    setTaxAmountPkr(Math.round((safePrice * taxRatePercent) / 100));
  };

  const handleTaxRateChange = (newRate: number) => {
    const safeRate = Number.isFinite(newRate) && newRate >= 0 ? Math.min(100, newRate) : 0;
    setTaxRatePercent(safeRate);
    setTaxAmountPkr(Math.round((pricePerUnit * safeRate) / 100));
  };

  const handleTaxAmountChange = (newTaxAmount: number) => {
    const safeAmt = Number.isFinite(newTaxAmount) && newTaxAmount >= 0 ? Math.round(newTaxAmount) : 0;
    setTaxAmountPkr(safeAmt);
    if (pricePerUnit > 0) {
      setTaxRatePercent(Number(((safeAmt / pricePerUnit) * 100).toFixed(2)));
    } else {
      setTaxRatePercent(0);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compactUrl = await compressImageFile(file, 640, 0.72);
      setImageUrl(compactUrl);
      setFormError(null);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : isUrdu
          ? 'غیر محفوظ یا غلط تصویر بلاک کر دی گئی ہے۔'
          : 'Unsafe or invalid image file blocked by security shield.'
      );
    }
    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setFormError(null);
    } catch {
      setFormError(
        isUrdu
          ? 'کیمرہ دستیاب نہیں ہے۔ براہِ کرم ڈیوائس سے تصویر اپ لوڈ کریں۔'
          : 'Camera unavailable or blocked. Please upload a photo from your device.'
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
      const compactSnapshot = captureCompressedVideoFrame(videoRef.current, 640, 0.72);
      if (compactSnapshot) {
        setImageUrl(compactSnapshot);
      }
      stopCamera();
    }
  };

  const getSectionLabel = (cat: ProductCategory) => {
    switch (cat) {
      case 'farm_mining':
        return isUrdu ? 'کسان و کان کنی سیکشن' : 'Farmers & Mining Section';
      case 'factory':
        return isUrdu ? 'فیکٹری مصنوعات سیکشن' : 'Factories Section';
      case 'wholesale':
        return isUrdu ? 'ہول سیل سیکشن' : 'Wholesalers Section';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPublishedSuccess(null);

    if (!currentUser) {
      setFormError(
        isUrdu
          ? 'اشتہار شائع کرنے کے لیے براہِ کرم پہلے اپنے منافع اکاؤنٹ میں لاگ اِن یا رجسٹر ہوں۔'
          : 'Please log in or register your Munafa account before posting a product ad.'
      );
      return;
    }

    if (!title.trim() || !description.trim() || !city.trim()) {
      setFormError(
        isUrdu
          ? 'پروڈکٹ کا نام، تفصیل اور شہر درج کرنا لازمی ہے۔'
          : 'Product name, description, and city location are required.'
      );
      return;
    }

    if (pricePerUnit <= 0 || quantityAvailable <= 0) {
      setFormError(
        isUrdu
          ? 'قیمت اور دستیاب مقدار صفر سے زیادہ ہونی چاہیے۔'
          : 'Price per unit and available quantity must be greater than zero.'
      );
      return;
    }

    for (const val of [title, description, city, sellerPhone]) {
      const scan = scanPayloadForThreats(val, 'ad_posting_form');
      if (!scan.safe) {
        setFormError(scan.reason || 'Security shield blocked unsafe ad content.');
        return;
      }
    }

    if (imageUrl.trim() && !isSafeMediaUrl(imageUrl.trim())) {
      setFormError('Security shield blocked an unsafe product photo URL.');
      return;
    }

    const fallbackImg = getFallbackProductImage(category, city);

    const isFrozen = currentUser.subscription?.status === 'frozen';

    const newItem: ProductItem = {
      id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sellerAccountNumber: currentUser.accountNumber,
      sellerName: currentUser.name,
      sellerPhone: sanitizeTextInput(sellerPhone || currentUser.phone),
      title: sanitizeTextInput(title),
      description: sanitizeTextInput(description),
      category,
      unit,
      pricePerUnit,
      taxRatePercent,
      taxAmountPkr,
      quantityAvailable,
      minOrderQty: Math.max(1, minOrderQty),
      city: sanitizeTextInput(city),
      imageUrl: imageUrl.trim() || fallbackImg,
      createdAt: new Date().toISOString(),
      isActive: !isFrozen,
    };

    try {
      LocalEdgeDb.addProduct(newItem);
      setPublishedSuccess(newItem);
      setTitle('');
      setDescription('');
      setImageUrl('');
      if (onPublished) {
        onPublished(newItem);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish product ad.');
    }
  };

  return (
    <div
      className="bg-white border-2 border-[#046c31] rounded-2xl overflow-hidden shadow-lg"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {/* Form Header */}
      <div className="munafa-bg-header bg-[#034720] text-white px-5 py-4 border-b-2 border-[#d4af37] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#023819] border border-[#facc15] flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-[#fef08a]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-white truncate">
              {isUrdu ? 'نیا پروڈکٹ اشتہار شائع کریں' : 'Post New Product Ad to MUNAFA'}
            </h3>
            <p className="text-[11px] font-bold text-[#fef08a] truncate">
              {isUrdu
                ? `مرکزی صفحہ + ${getSectionLabel(category)} میں فوری طور پر ظاہر ہوگا`
                : `Displays automatically on Main Page + ${getSectionLabel(category)}`}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-amber-100 hover:bg-emerald-900 cursor-pointer shrink-0"
            aria-label={isUrdu ? 'بند کریں' : 'Close form'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-white">
        {!currentUser && (
          <div className="p-4 bg-[#fef9c3] border-2 border-[#d4af37] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs font-extrabold text-[#052e16]">
              {isUrdu
                ? 'اشتہار شائع کرنے کے لیے اپنے 8 ہندسی اکاؤنٹ نمبر سے لاگ اِن یا نیا اکاؤنٹ رجسٹر کریں۔'
                : 'Sign in or register an account (Farmer, Factory, Wholesaler, or Shop) to publish your ad live.'}
            </div>
            {onOpenAuth && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="py-1.5 px-3.5 munafa-green-btn rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'لاگ اِن' : 'Log In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="py-1.5 px-3.5 munafa-gold-btn rounded-xl text-xs font-black cursor-pointer"
                >
                  {isUrdu ? 'رجسٹر کریں' : 'Register'}
                </button>
              </div>
            )}
          </div>
        )}

        {formError && (
          <div className="p-3.5 bg-red-50 border-2 border-red-600 text-red-950 text-xs font-black rounded-xl flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {publishedSuccess && (
          <div className="p-4 bg-[#eef7f1] border-2 border-[#046c31] rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#046c31] shrink-0 mt-0.5" />
            <div className="text-xs text-[#023819] font-bold space-y-1">
              <div className="font-black text-sm">
                {isUrdu
                  ? `"${publishedSuccess.title}" کامیابی سے شائع ہو گیا!`
                  : `"${publishedSuccess.title}" Published Live!`}
              </div>
              <div>
                {isUrdu
                  ? `آپ کا اشتہار اب مین پیج اور ${getSectionLabel(publishedSuccess.category)} میں ایک ہی فارمیٹ میں نظر آ رہا ہے۔`
                  : `Visible now in Main Page ("All Commodities") and ${getSectionLabel(publishedSuccess.category)}.`}
              </div>
            </div>
          </div>
        )}

        {/* Section / Category Picker */}
        <div>
          <label className="block text-xs font-extrabold text-[#023819] uppercase tracking-wider mb-2">
            {isUrdu ? 'سیکشن منتخب کریں (کہاں شائع کرنا ہے)' : 'Target Marketplace Section'}{' '}
            <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              {
                id: 'farm_mining' as ProductCategory,
                title: isUrdu ? 'کسان اور کان کنی' : 'Farmers & Mining',
                sub: isUrdu ? 'فصلیں، نمک، معدنیات' : 'Crops, produce, salt & minerals',
                icon: Tractor,
              },
              {
                id: 'factory' as ProductCategory,
                title: isUrdu ? 'فیکٹری مصنوعات' : 'Factories & Manufacturing',
                sub: isUrdu ? 'صنعتی و فیکٹری سامان' : 'Factory tools, steel, machinery',
                icon: Factory,
              },
              {
                id: 'wholesale' as ProductCategory,
                title: isUrdu ? 'ہول سیل بلک' : 'Wholesalers & Bulk',
                sub: isUrdu ? 'تھوک و منڈی آرڈرز' : 'Wholesale trade & bulk supplies',
                icon: Boxes,
              },
            ].map((sec) => {
              const Icon = sec.icon;
              const active = category === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setCategory(sec.id)}
                  className={`p-3 rounded-xl border-2 text-start cursor-pointer transition-all flex items-center gap-2.5 ${
                    active
                      ? 'bg-[#034720] border-[#d4af37] text-white shadow-xs'
                      : 'bg-[#f4faf6] border-emerald-300 text-[#023819] hover:border-[#046c31]'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#fef08a]' : 'text-[#046c31]'}`} />
                  <div className="min-w-0">
                    <div className="font-black text-xs truncate">{sec.title}</div>
                    <div
                      className={`text-[10px] font-bold truncate ${
                        active ? 'text-[#fef08a]' : 'text-[#046c31]'
                      }`}
                    >
                      {sec.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Name & Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-[#023819] uppercase tracking-wider mb-1">
              {isUrdu ? 'پروڈکٹ / اشتہار کا نام' : 'Product Name'} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isUrdu
                  ? 'مثلاً: سپر کرنل باسمتی چاول، گلابی نمک، سرجیکل آلات'
                  : 'e.g. Export Grade Super Kernel Basmati Rice / Pink Salt / Surgical Steel'
              }
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold text-[#065f46]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#023819] uppercase tracking-wider mb-1">
              {isUrdu ? 'شہر / مقام' : 'City / Origin'} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isUrdu ? 'مثلاً لاہور، سیالکوٹ، ملتان' : 'e.g. Lahore, Sialkot, Multan'}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold text-[#065f46]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-extrabold text-[#023819] uppercase tracking-wider mb-1">
            {isUrdu ? 'مکمل تفصیل (معیار، وزن، پیکنگ، خصوصیات)' : 'Product Description & Specifications'}{' '}
            <span className="text-red-600">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isUrdu
                ? 'پروڈکٹ کا معیار، پیکنگ سائز، فصل کا سال یا فیکٹری سرٹیفکیٹ تفصیل سے لکھیں...'
                : 'Enter grade, purity, crop/batch year, packaging specifications, and delivery details...'
            }
            className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold text-[#065f46]"
          />
        </div>

        {/* Pricing, Tax Amount (PKR), Tax Rate %, Unit & Stock */}
        <div className="bg-[#f4faf6] border-2 border-emerald-700/25 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'یونٹ' : 'Unit'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 rounded-xl bg-white font-mono font-bold text-[#065f46]"
              >
                <option value="bag">bag</option>
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
                <option value="meter">meter</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'قیمت (روپے)' : 'Price (PKR)'} <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={pricePerUnit}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 rounded-xl bg-white font-mono font-black text-[#065f46]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'ٹیکس رقم (روپے)' : 'Tax Amount (PKR)'}
              </label>
              <input
                type="number"
                min={0}
                value={taxAmountPkr}
                onChange={(e) => handleTaxAmountChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 rounded-xl bg-white font-mono font-black text-[#065f46]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'جی ایس ٹی %' : 'GST Tax %'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={taxRatePercent}
                onChange={(e) => handleTaxRateChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 rounded-xl bg-white font-mono font-bold text-[#065f46]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'دستیاب اسٹاک' : 'Available Stock'} <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 rounded-xl bg-white font-mono font-black text-[#065f46]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'کم از کم آرڈر' : 'Min Order Qty'}
              </label>
              <input
                type="number"
                min={1}
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs border-2 border-stone-300 rounded-xl bg-white font-mono font-bold text-[#065f46]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#023819] uppercase mb-1">
                {isUrdu ? 'رابطہ / واٹس ایپ نمبر' : 'Seller Contact Phone'}
              </label>
              <input
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full px-3 py-2 text-xs border-2 border-stone-300 rounded-xl bg-white font-mono font-bold text-[#065f46]"
              />
            </div>

            <div className="p-2.5 bg-white border border-emerald-400 rounded-xl text-xs font-mono font-black text-[#023819] flex flex-col justify-center">
              <span className="text-[10px] uppercase text-[#046c31] font-sans font-extrabold">
                {isUrdu ? 'فی یونٹ کل قیمت مع ٹیکس' : 'Total Unit Rate (Price + Tax)'}
              </span>
              <span className="tabular-nums">
                PKR {(pricePerUnit + taxAmountPkr).toLocaleString()} / {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Product Photo Upload & Live Camera */}
        <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-extrabold text-[#023819] uppercase tracking-wider">
              {isUrdu ? 'پروڈکٹ کی تصویر (اپ لوڈ یا کیمرہ)' : 'Product Photo (Upload or Live Camera)'}
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#046c31]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUrdu ? '1-سیکنڈ وائرس و کوڈ شیلڈ' : '1st-Sec Malware Scan'}</span>
            </span>
          </div>

          {isCameraActive ? (
            <div className="space-y-2.5 bg-stone-900 p-3.5 rounded-2xl text-center border-2 border-emerald-600">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-52 object-cover rounded-xl mx-auto bg-black"
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isUrdu ? 'تصویر کھینچیں' : 'Capture Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2 px-3 bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Ad preview"
                  className="w-24 h-20 rounded-xl object-cover border-2 border-emerald-700 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-24 h-20 rounded-xl bg-[#eef7f1] border-2 border-dashed border-emerald-400 flex items-center justify-center text-[#046c31] shrink-0">
                  <Camera className="w-7 h-7" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="py-2 px-3.5 munafa-green-btn font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'لائیو کیمرہ' : 'Live Camera Snap'}</span>
                  </button>
                  <label className="py-2 px-3.5 bg-[#eef7f1] border-2 border-[#046c31] text-[#023819] font-black text-xs rounded-xl hover:bg-[#dcfce7] cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#046c31]" />
                    <span>{isUrdu ? 'تصویر اپ لوڈ کریں' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="py-1.5 px-2.5 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      {isUrdu ? 'تصویر ہٹائیں' : 'Remove'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-700 font-semibold">
                  {isUrdu
                    ? 'تصویر نہ ہونے کی صورت میں منتخب سیکشن کی معیاری تصویر خودکار شامل ہو جائے گی۔'
                    : 'Only verified images are accepted. If left blank, a matching sector image is attached automatically.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-stone-200">
          <div className="text-[11px] text-[#046c31] font-extrabold">
            {currentUser?.subscription?.status === 'frozen'
              ? isUrdu
                ? '✓ آپ کا اشتہار محفوظ ہو جائے گا اور ایڈمن کے اکاؤنٹ فعال کرنے پر فوری لائیو ہو جائے گا۔ لامحدود اشتہارات مفت ہیں۔'
                : '✓ Unlimited ads saved! Your ad will appear live as soon as Admin verifies payment & activates your account.'
              : isUrdu
              ? '✓ لامحدود مفت اشتہارات: فوری طور پر مین پیج اور متعلقہ سیکشن دونوں میں شامل ہوگا۔'
              : '✓ Unlimited free ads — published immediately to Main Page + matching sector section.'}
          </div>

          <div className="flex items-center gap-2.5 ms-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-white border-2 border-stone-300 text-stone-800 hover:bg-stone-100 rounded-xl text-xs font-black cursor-pointer"
              >
                {isUrdu ? 'بند کریں' : 'Close'}
              </button>
            )}
            <button
              type="submit"
              className="py-2.5 px-6 munafa-gold-btn font-black text-xs sm:text-sm rounded-xl shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4 text-[#052e16]" />
              <span>{isUrdu ? 'اشتہار شائع کریں (Submit Ad)' : 'Submit & Publish Ad'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
