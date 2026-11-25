/**
 * MUNAFA Live Marketplace
 * Connects Pakistani farmers, miners, factories and wholesalers directly to shops and households
 */

import React, { useState } from 'react';
import { ProductItem, UserAccount, ProductCategory, FulfilmentType, OrderItem } from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { useLanguage } from '../context/LanguageContext';
import { AdPostingForm } from './AdPostingForm';
import { scanPayloadForThreats, sanitizeTextInput } from '../utils/security';
import {
  Search,
  MapPin,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  PackageCheck,
  Boxes,
  Truck,
  X,
  FileText,
  Info,
  Phone,
  Megaphone,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface MarketplaceProps {
  currentUser: UserAccount | null;
  onOpenChatWithSeller: (sellerAccountNumber: string, initialText?: string) => void;
  onOrderPlaced: (orderId: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedCategory?: 'all' | ProductCategory;
  setSelectedCategory?: (cat: 'all' | ProductCategory) => void;
  selectedCity?: string;
  setSelectedCity?: (city: string) => void;
  maxPrice?: number;
  setMaxPrice?: (price: number) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  currentUser,
  onOpenChatWithSeller,
  onOrderPlaced,
  onOpenAuth,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  selectedCategory: propCategory,
  setSelectedCategory: propSetCategory,
  selectedCity: propCity,
  setSelectedCity: propSetCity,
  maxPrice: propMaxPrice,
  setMaxPrice: propSetMaxPrice,
}) => {
  const [products, setProducts] = useState<ProductItem[]>(() => LocalEdgeDb.getActiveProducts());
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localCategory, setLocalCategory] = useState<'all' | ProductCategory>('all');
  const [localCity, setLocalCity] = useState('all');
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(1000000);

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery || setLocalSearchQuery;

  const selectedCategory = propCategory !== undefined ? propCategory : localCategory;
  const setSelectedCategory = propSetCategory || setLocalCategory;

  const selectedCity = propCity !== undefined ? propCity : localCity;
  const setSelectedCity = propSetCity || setLocalCity;

  const maxPrice = propMaxPrice !== undefined ? propMaxPrice : localMaxPrice;
  const setMaxPrice = propSetMaxPrice || setLocalMaxPrice;

  // Selected product for modal view / order
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [specsProduct, setSpecsProduct] = useState<ProductItem | null>(null);
  const { t, isUrdu } = useLanguage();
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderQtyInput, setOrderQtyInput] = useState('1');
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>('cod');
  const [orderAddress, setOrderAddress] = useState(currentUser?.address || '');
  const [orderPhone, setOrderPhone] = useState(currentUser?.phone || '');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [specsImageFailed, setSpecsImageFailed] = useState(false);
  const [showPostAdForm, setShowPostAdForm] = useState(false);
  const [recentlyPostedAd, setRecentlyPostedAd] = useState<ProductItem | null>(null);
  const [adminRemoveAdTarget, setAdminRemoveAdTarget] = useState<ProductItem | null>(null);
  const [adminAdNotice, setAdminAdNotice] = useState<string | null>(null);

  React.useEffect(() => {
    const unsub = LocalEdgeDb.subscribe(() => {
      const latest = LocalEdgeDb.getActiveProducts();
      setProducts(latest);
      setSelectedProduct((prev) => (prev ? latest.find((p) => p.id === prev.id) || null : null));
      setSpecsProduct((prev) => (prev ? latest.find((p) => p.id === prev.id) || null : null));
    });
    return unsub;
  }, []);

  const cities = [
    'all',
    'Lahore',
    'Karachi',
    'Faisalabad',
    'Sialkot',
    'Sheikhupura',
    'Khewra / Jhelum',
    'Gujranwala',
    'Peshawar',
    'Quetta',
    'Multan',
  ];

  const getSellerPhone = (prod: ProductItem): string => {
    if (prod.sellerPhone) return prod.sellerPhone;
    const acc = LocalEdgeDb.getAccountByNumber(prod.sellerAccountNumber);
    return acc?.phone || '+92 300 4819203';
  };

  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && !p.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    if (p.pricePerUnit > maxPrice) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSeller = p.sellerName.toLowerCase().includes(q);
      const matchCity = p.city.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchSeller || matchCity;
    }
    return true;
  });

  const handleOpenOrder = (prod: ProductItem) => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (prod.quantityAvailable <= 0) {
      return;
    }
    setIsSubmittingOrder(false);
    setOrderError('');
    setSelectedProduct(prod);
    const initialQty = Math.min(prod.quantityAvailable, Math.max(1, prod.minOrderQty || 1));
    setOrderQuantity(initialQty);
    setOrderQtyInput(String(initialQty));
    setOrderAddress(currentUser.address || '');
    setOrderPhone(currentUser.phone || '');
    setOrderModalOpen(true);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProduct || selectedProduct.quantityAvailable <= 0) return;

    if (currentUser.accountNumber === selectedProduct.sellerAccountNumber) {
      setOrderError(
        isUrdu
          ? 'آپ اپنے ہی اشتہار پر آرڈر نہیں دے سکتے۔'
          : 'You cannot place an order on your own product listing.'
      );
      return;
    }

    const addrScan = scanPayloadForThreats(orderAddress, 'order_address');
    const phoneScan = scanPayloadForThreats(orderPhone, 'order_phone');
    if (!addrScan.safe || !phoneScan.safe) {
      setOrderError(
        addrScan.reason || phoneScan.reason || '1st-Second Shield blocked unsafe order delivery text.'
      );
      return;
    }

    const minQty = Math.max(1, selectedProduct.minOrderQty || 1);
    const parsedQty = Math.floor(Number(orderQtyInput));
    if (!Number.isFinite(parsedQty) || parsedQty < minQty || parsedQty > selectedProduct.quantityAvailable) {
      setOrderError(
        isUrdu
          ? `مقدار ${minQty} سے ${selectedProduct.quantityAvailable} ${selectedProduct.unit} کے درمیان ہونی چاہیے۔`
          : `Quantity must be between ${minQty} and ${selectedProduct.quantityAvailable} ${selectedProduct.unit}.`
      );
      return;
    }

    setOrderError('');

    const safeQty = Math.min(selectedProduct.quantityAvailable, Math.max(minQty, parsedQty));

    setIsSubmittingOrder(true);

    const sellerAccount = LocalEdgeDb.getAccountByNumber(selectedProduct.sellerAccountNumber);
    const subtotal = selectedProduct.pricePerUnit * safeQty;
    const gstAmount = Math.round((subtotal * selectedProduct.taxRatePercent) / 100);
    const deliveryFee = 0;
    const grandTotal = subtotal + gstAmount;

    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const orderNumber = `MNF-${Date.now().toString().slice(-6)}`;

    const newOrder: OrderItem = {
      id: orderId,
      orderNumber,
      buyerAccountNumber: currentUser.accountNumber,
      buyerName: currentUser.name,
      buyerPhone: sanitizeTextInput(orderPhone || currentUser.phone),
      buyerAddress: sanitizeTextInput(orderAddress || currentUser.address),
      sellerAccountNumber: selectedProduct.sellerAccountNumber,
      sellerName: selectedProduct.sellerName,
      sellerPhone: getSellerPhone(selectedProduct),
      sellerAddress: sellerAccount?.address || `${selectedProduct.city}, Pakistan`,
      sellerNtn: sellerAccount?.ntn,
      productId: selectedProduct.id,
      productTitle: selectedProduct.title,
      unit: selectedProduct.unit,
      quantity: safeQty,
      unitPrice: selectedProduct.pricePerUnit,
      subtotal,
      gstAmount,
      deliveryFee,
      grandTotal,
      fulfilmentType,
      status: 'placed' as const,
      munafaFeePkr: 0,
      munafaFeeStatus: 'verified' as const,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          status: 'placed' as const,
          timestamp: new Date().toISOString(),
          note: `Order placed via Munafa (${
            fulfilmentType === 'cod'
              ? 'Cash on Delivery — Direct w/ Seller, PKR 0 Extra Fee'
              : 'Self-Arranged Pickup — PKR 0 Extra Fee'
          }). Dispatched directly to Seller.`,
        },
      ],
    };

    try {
      LocalEdgeDb.createOrder(newOrder);
    } catch (err: unknown) {
      setIsSubmittingOrder(false);
      setOrderError(
        err instanceof Error
          ? err.message
          : isUrdu
          ? 'آرڈر محفوظ کرنے میں خرابی پیش آئی۔'
          : 'Unable to complete order. Please check details and stock.'
      );
      return;
    }

    setTimeout(() => {
      setIsSubmittingOrder(false);
      setOrderModalOpen(false);
      onOrderPlaced(orderId);
    }, 250);
  };

  const categoryName = (cat: ProductCategory) => {
    if (isUrdu) {
      switch (cat) {
        case 'farm_mining':
          return 'کسان و کان کنی';
        case 'factory':
          return 'فیکٹری مصنوعات';
        case 'wholesale':
          return 'ہول سیل بلک';
      }
    }
    switch (cat) {
      case 'farm_mining':
        return 'Farmer & Mining';
      case 'factory':
        return 'Factory Goods';
      case 'wholesale':
        return 'Wholesale Bulk';
    }
  };

  return (
    <div dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* MAIN CATALOG FILTERS & PRODUCT GRID */}
      <div id="munafa-catalog-grid" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-8 space-y-5">
        {/* Active Section Header + Post Ad CTA Bar */}
        <div className="munafa-bg-header bg-[#034720] text-white border-2 border-[#d4af37] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-widest text-[#fef08a]">
              {selectedCategory === 'all'
                ? isUrdu
                  ? 'منافع مرکزی صفحہ — تمام شعبے'
                  : 'MUNAFA MAIN MARKETPLACE — ALL SECTORS'
                : `${categoryName(selectedCategory)} · ${isUrdu ? 'سیکشن' : 'SECTION'}`}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              {selectedCategory === 'all'
                ? isUrdu
                  ? 'پاکستانی کسانوں، کان کنی، فیکٹریوں اور ہول سیلرز کے اشتہارات'
                  : 'Direct Pakistani Farmers, Mining, Factories & Wholesalers Marketplace'
                : `${categoryName(selectedCategory)} (${filteredProducts.length} ${isUrdu ? 'اشتہارات' : 'Ads'})`}
            </h2>
            <p className="text-xs text-emerald-100 font-semibold">
              {isUrdu
                ? 'نیا اشتہار پوسٹ کریں: کسان کا اشتہار کسان سیکشن اور مین پیج دونوں میں، اور فیکٹری کا اشتہار فیکٹری سیکشن اور مین پیج میں فوراً نظر آئے گا۔'
                : 'Post your product ad once — Farmer ads appear in Main Page & Farmers/Mining, Factory ads in Main Page & Factories, Wholesale in Wholesalers.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPostAdForm((v) => !v)}
            className="shrink-0 py-2.5 px-5 munafa-gold-btn font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-transform hover:scale-102"
          >
            <Megaphone className="w-4 h-4 text-[#052e16]" />
            <span>
              {showPostAdForm
                ? isUrdu
                  ? 'فارم بند کریں'
                  : 'Hide Ad Form'
                : isUrdu
                ? '+ نیا پروڈکٹ اشتہار لگائیں'
                : '+ Post Product Ad'}
            </span>
          </button>
        </div>

        {/* Inline Ad Posting Form Drawer (Shows on Main Page & Every Sector Section) */}
        {showPostAdForm && (
          <AdPostingForm
            currentUser={currentUser}
            defaultCategory={selectedCategory}
            onOpenAuth={onOpenAuth}
            onCancel={() => setShowPostAdForm(false)}
            onPublished={(newProd) => {
              setRecentlyPostedAd(newProd);
              if (newProd.pricePerUnit > maxPrice) {
                setMaxPrice(newProd.pricePerUnit);
              }
              setShowPostAdForm(false);
            }}
          />
        )}

        {/* Confirmation Banner After Publishing */}
        {recentlyPostedAd && (
          <div className="p-4 bg-white border-2 border-[#046c31] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#046c31] shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-[#023819]">
                <strong className="font-black text-sm block">
                  {isUrdu
                    ? `آپ کا اشتہار "${recentlyPostedAd.title}" شائع ہو گیا ہے!`
                    : `Ad Published: "${recentlyPostedAd.title}"`}
                </strong>
                <span>
                  {isUrdu
                    ? `یہ اب مین پیج اور "${categoryName(recentlyPostedAd.category)}" سیکشن دونوں میں شامل ہے۔`
                    : `Now live in Main Page & "${categoryName(recentlyPostedAd.category)}" section.`}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="px-3 py-1.5 bg-[#eef7f1] hover:bg-[#dcfce7] border border-[#046c31] text-[#023819] rounded-xl text-xs font-black cursor-pointer"
              >
                {isUrdu ? 'مین پیج دیکھیں' : 'View on Main Page'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(recentlyPostedAd.category)}
                className="px-3 py-1.5 munafa-green-btn rounded-xl text-xs font-black cursor-pointer"
              >
                {isUrdu
                  ? `${categoryName(recentlyPostedAd.category)} سیکشن`
                  : `View in ${categoryName(recentlyPostedAd.category)}`}
              </button>
              <button
                type="button"
                onClick={() => setRecentlyPostedAd(null)}
                className="p-1 text-stone-600 hover:text-stone-950 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {adminAdNotice && (
          <div className="p-3 bg-emerald-50 border-2 border-[#046c31] text-[#023819] text-xs font-extrabold rounded-xl flex items-center justify-between gap-2">
            <span>{adminAdNotice}</span>
            <button
              type="button"
              onClick={() => setAdminAdNotice(null)}
              className="underline cursor-pointer"
            >
              {isUrdu ? 'بند کریں' : 'Dismiss'}
            </button>
          </div>
        )}

        <div className="bg-white border-2 border-emerald-700/35 rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-emerald-700 absolute start-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchCommodityPlaceholder')}
                className="w-full ps-10 pe-3 py-2.5 text-xs sm:text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold text-[#065f46]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const v = e.target.value as 'all' | ProductCategory;
                  setSelectedCategory(v);
                }}
                className="w-full py-2.5 px-3 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-[#065f46]"
              >
                <option value="all">{t('allCategories')}</option>
                <option value="farm_mining">{t('categoryFarmMining')}</option>
                <option value="factory">{t('categoryFactory')}</option>
                <option value="wholesale">{t('categoryWholesale')}</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full py-2.5 px-3 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-[#065f46]"
              >
                <option value="all">{t('allCities')}</option>
                {cities
                  .filter((c) => c !== 'all')
                  .map((c) => (
                    <option key={c} value={c} className="font-bold">
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Price Slider Filter */}
          <div className="mt-3 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-800 font-bold gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span>{t('maxPriceFilter')}:</span>
              <input
                type="range"
                min="1000"
                max="1000000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-36 accent-emerald-700 cursor-pointer"
              />
              <span className="font-mono font-extrabold text-[#023819] tabular-nums">
                {isUrdu ? `${maxPrice.toLocaleString()} روپے` : `PKR ${maxPrice.toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {(selectedCategory !== 'all' || selectedCity !== 'all' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCity('all');
                    setSearchQuery('');
                    setMaxPrice(1000000);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#034720] hover:bg-[#046c31] text-[#fef08a] border border-[#d4af37] font-extrabold text-[11px] cursor-pointer"
                >
                  {t('resetFilters')}
                </button>
              )}
              <span>
                {isUrdu ? (
                  <>
                    دستیاب تصدیق شدہ اشیاء:{' '}
                    <strong className="text-[#023819] font-black">{filteredProducts.length}</strong>
                  </>
                ) : (
                  <>
                    Showing <strong className="text-[#023819] font-black">{filteredProducts.length}</strong>{' '}
                    verified commodities
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => {
            const sellerPhone = getSellerPhone(prod);
            const hasImageError = !!failedImages[prod.id];
            return (
              <article
                key={prod.id}
                className="group bg-white rounded-2xl border-2 border-stone-200 overflow-hidden flex flex-col hover:border-emerald-700 hover:shadow-lg transition-all duration-200"
              >
                {/* Clean Unobstructed Product Photography (Zero Text Overlay) */}
                <div className="relative aspect-4/3 bg-stone-100 overflow-hidden border-b border-stone-200">
                  {hasImageError || !prod.imageUrl ? (
                    <div className="w-full h-full bg-gradient-to-br from-[#eef7f1] via-[#dcfce7] to-[#f8faf9] flex flex-col items-center justify-center p-4 text-center">
                      <Boxes className="w-10 h-10 text-[#046c31] mb-2" />
                      <span className="text-xs font-extrabold text-[#023819] line-clamp-2 max-w-[200px]">
                        {prod.title}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [prod.id]: true }))
                      }
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Structured Content Body — Clean Spacing, Zero Overwriting */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
                  <div className="space-y-3">
                    {/* Clean Unboxed Category & City Metadata Row */}
                    <div className="flex items-center justify-between gap-3 text-[11px] font-extrabold">
                      <span className="text-[#046c31] uppercase tracking-wide truncate">
                        {categoryName(prod.category)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-stone-700 truncate shrink-0 max-w-[50%]">
                        <MapPin className="w-3.5 h-3.5 text-[#046c31] shrink-0" />
                        <span className="truncate">{prod.city}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-black text-[#023819] text-base sm:text-lg leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2 min-h-[2.75rem]">
                        {prod.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mt-1.5 min-h-[2.3rem]">
                        {prod.description}
                      </p>
                    </div>

                    {/* Supplier Identity Card — Clean 2-Line Stack */}
                    <div className="p-3 bg-[#f4faf6] border border-emerald-700/20 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-[#023819] truncate">
                          {prod.sellerName}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#046c31] shrink-0 whitespace-nowrap">
                          {isUrdu ? '✓ تصدیق شدہ' : '✓ Verified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold text-[#065f46]">
                        <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                          <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span className="truncate">{sellerPhone}</span>
                        </span>
                        <span className="text-stone-700 font-black tabular-nums shrink-0">
                          #{prod.sellerAccountNumber}
                        </span>
                      </div>
                    </div>

                    {/* Specifications Strip — Stacked Label Over Value (No Overlap) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 min-w-0">
                        <div className="text-[10px] text-stone-500 font-bold truncate">
                          {t('minOrderQty')}
                        </div>
                        <div className="font-mono font-black text-xs text-[#023819] tabular-nums mt-0.5 truncate">
                          {prod.minOrderQty} {prod.unit}
                        </div>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 min-w-0">
                        <div className="text-[10px] text-stone-500 font-bold truncate">
                          {t('availableStock')}
                        </div>
                        <div className="font-mono font-black text-xs text-[#023819] tabular-nums mt-0.5 truncate">
                          {prod.quantityAvailable} {prod.unit}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Pricing & Actions */}
                  <div className="space-y-3 pt-1">
                    {/* 2-Column Pricing & GST Matrix */}
                    <div className="border-2 border-stone-200 rounded-xl bg-white overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-stone-200">
                        <div className="p-3 bg-white min-w-0">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 block truncate">
                            {isUrdu ? `قیمت فی ${prod.unit}` : `Price / ${prod.unit}`}
                          </span>
                          <div className="font-mono font-black text-sm sm:text-base text-[#023819] tabular-nums leading-tight mt-1 truncate">
                            {isUrdu
                              ? `${prod.pricePerUnit.toLocaleString()} روپے`
                              : `PKR ${prod.pricePerUnit.toLocaleString()}`}
                          </div>
                          <span className="text-[10px] text-stone-500 font-semibold block mt-1 truncate">
                            {isUrdu ? 'بغیر کرایہ' : 'Excl. Transport'}
                          </span>
                        </div>

                        <div className="p-3 bg-stone-50/80 min-w-0">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900 block truncate">
                            {isUrdu ? `جی ایس ٹی (${prod.taxRatePercent}%)` : `Govt GST (${prod.taxRatePercent}%)`}
                          </span>
                          <div className="font-mono font-extrabold text-xs sm:text-sm text-emerald-900 tabular-nums leading-tight mt-1 truncate">
                            {isUrdu
                              ? `+${prod.taxAmountPkr.toLocaleString()} روپے`
                              : `+PKR ${prod.taxAmountPkr.toLocaleString()}`}
                          </div>
                          <span className="text-[10px] text-emerald-800 font-semibold block mt-1 truncate">
                            {t('gstTaxIncluded')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenChatWithSeller(
                            prod.sellerAccountNumber,
                            `Inquiring about ${prod.title} (${prod.id})`
                          )
                        }
                        className="min-h-[42px] py-2.5 px-3 border-2 border-[#046c31] bg-[#eef7f1] hover:bg-[#dcfce7] text-[#023819] font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-w-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#046c31] shrink-0" />
                        <span className="truncate">{t('chatWithSeller')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={prod.quantityAvailable <= 0}
                        onClick={() => handleOpenOrder(prod)}
                        className="min-h-[42px] py-2.5 px-3 munafa-gold-btn disabled:opacity-50 disabled:cursor-not-allowed font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                      >
                        <span className="truncate">
                          {prod.quantityAvailable <= 0 ? (isUrdu ? 'اسٹاک ختم' : 'Out of Stock') : t('placeOrder')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#052e16] shrink-0" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSpecsImageFailed(false);
                        setSpecsProduct(prod);
                      }}
                      className="w-full py-2 px-3 bg-[#f4faf6] text-[#023819] hover:bg-[#e2f5ea] border border-emerald-300 font-extrabold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-[#046c31] shrink-0" />
                      <span className="truncate">
                        {isUrdu ? 'تفصیلی معیار اور تجارتی شرائط دیکھیں' : 'Inspect Specs & Commercial Terms'}
                      </span>
                    </button>

                    {currentUser?.accountType === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setAdminRemoveAdTarget(prod)}
                        className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white border border-red-800 font-extrabold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {isUrdu ? 'اشتہار ہٹائیں (ایڈمن)' : 'Remove Ad (Admin)'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-14 px-4 bg-white rounded-2xl border-2 border-emerald-700/30 shadow-xs space-y-2">
            <Boxes className="w-10 h-10 text-[#046c31] mx-auto" />
            <h3 className="text-base font-black text-[#023819]">
              {isUrdu ? 'آپ کی تلاش کے مطابق کوئی مصنوعات نہیں ملیں' : 'No commodities found matching your criteria'}
            </h3>
            <p className="text-xs text-stone-700 font-bold">
              {isUrdu ? 'فلٹرز تبدیل کریں یا قیمت کی حد بڑھائیں۔' : 'Try resetting filters or expanding price limit.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedCity('all');
                setSearchQuery('');
                setMaxPrice(1000000);
              }}
              className="mt-2 py-2 px-4 munafa-green-btn rounded-xl text-xs font-black cursor-pointer"
            >
              {t('resetFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Contiguous Order Purchase Modal */}
      {orderModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden my-2 sm:my-6 max-h-[92dvh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 sm:py-5 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37] flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#fef08a] font-extrabold">
                  {isUrdu ? 'سیلر کو براہِ راست آرڈر بھیجیں' : 'Place Order with Seller'}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white">{selectedProduct.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="p-2 text-white hover:bg-[#077a38] rounded-xl transition-colors cursor-pointer font-bold border border-[#facc15]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="p-4 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1">
              {orderError && (
                <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl text-xs font-black text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
              {/* Seller details */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-stone-300 text-xs text-stone-800 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">
                    {isUrdu ? 'سپلائر' : 'Supplier'}
                  </span>
                  <span className="font-extrabold text-stone-950 block">{selectedProduct.sellerName}</span>
                  <span className="font-mono text-[11px] font-bold text-[#065f46] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {getSellerPhone(selectedProduct)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">
                    {isUrdu ? 'اکاؤنٹ نمبر' : 'Account #'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-900">
                    {selectedProduct.sellerAccountNumber}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {isUrdu ? `مقدار (${selectedProduct.unit})` : `Quantity (${selectedProduct.unit})`}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={selectedProduct.minOrderQty || 1}
                    max={selectedProduct.quantityAvailable}
                    value={orderQtyInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOrderQtyInput(val);
                      const parsed = parseInt(val, 10);
                      if (Number.isFinite(parsed) && parsed >= 1) {
                        setOrderQuantity(
                          Math.min(selectedProduct.quantityAvailable, Math.max(selectedProduct.minOrderQty || 1, parsed))
                        );
                      }
                    }}
                    onBlur={() => {
                      const minQty = Math.max(1, selectedProduct.minOrderQty || 1);
                      const parsed = parseInt(orderQtyInput, 10);
                      const clamped = Number.isFinite(parsed)
                        ? Math.min(selectedProduct.quantityAvailable, Math.max(minQty, parsed))
                        : minQty;
                      setOrderQuantity(clamped);
                      setOrderQtyInput(String(clamped));
                    }}
                    className="w-32 px-3 py-2 text-sm font-mono font-bold border-2 border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#065f46]"
                  />
                  <span className="text-xs text-stone-600 font-bold">
                    {isUrdu ? 'دستیاب اسٹاک:' : 'Stock available:'}{' '}
                    <strong className="text-stone-900 font-mono">
                      {selectedProduct.quantityAvailable} {selectedProduct.unit}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Fulfilment Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {isUrdu ? 'ترسیل کا طریقہ منتخب کریں' : 'Fulfilment Method'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setFulfilmentType('cod')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      fulfilmentType === 'cod'
                        ? 'movingLightGreenWhite border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Truck className="w-4 h-4 text-emerald-800" />
                      <span>{isUrdu ? 'کیش آن ڈیلیوری' : 'Cash on Delivery'}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-tight">
                      {isUrdu
                        ? 'سیلر بیمہ شدہ کوریئر کے ذریعے سامان بھیجے گا۔ وصولی پر نقد ادائیگی۔'
                        : 'Seller arranges insured delivery service. Pay cash at handover.'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfilmentType('pickup')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      fulfilmentType === 'pickup'
                        ? 'movingLightGreenWhite border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <PackageCheck className="w-4 h-4 text-emerald-800" />
                      <span>{isUrdu ? 'خود وصولی (پک اپ)' : 'Self Pickup'}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-tight">
                      {isUrdu
                        ? 'فیکٹری، کھیت یا کان سے اپنی ذمہ داری پر براہِ راست وصول کریں۔'
                        : 'Collect directly from seller site at buyer own responsibility.'}
                    </p>
                  </button>
                </div>
              </div>

              {fulfilmentType === 'pickup' && (
                <div className="p-3.5 bg-white border-2 border-amber-500 rounded-2xl text-amber-950 text-xs font-bold flex items-start gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    {isUrdu ? (
                      <>
                        <strong className="font-extrabold">حفاظتی انتباہ:</strong> ہمیشہ دن کی روشنی میں یا تصدیق شدہ فیکٹری احاطے میں ملاقات کریں اور وصولی کے وقت ذمہ دار نمائندوں کی موجودگی کو یقینی بنائیں۔
                      </>
                    ) : (
                      <>
                        <strong className="font-extrabold">Safety Warning:</strong> Meet in broad daylight at certified business premises with authorized personnel present during handover.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Delivery Address & WhatsApp Number */}
              <div>
                <label className="block text-xs font-extrabold text-stone-800 uppercase mb-1">
                  {fulfilmentType === 'cod'
                    ? isUrdu
                      ? 'ترسیل کا مکمل پتہ'
                      : 'Delivery Address'
                    : isUrdu
                    ? 'وصول کرنے والے نمائندے کی تفصیل'
                    : 'Pickup Representative Details'}
                </label>
                <input
                  type="text"
                  required
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder={isUrdu ? 'گلی، مکان/دکان نمبر، شہر' : 'Street address, city, landmark'}
                  className="w-full px-3 py-2 text-sm font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 mb-2 bg-white text-[#065f46]"
                />
                <input
                  type="tel"
                  required
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder={isUrdu ? 'واٹس ایپ رابطہ نمبر (مثلاً 0300-1234567)' : 'WhatsApp phone (e.g. 0300-1234567)'}
                  className="w-full px-3 py-2 text-sm font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono bg-white text-[#065f46]"
                />
              </div>

              {/* Price Calculation Breakdown */}
              <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 text-xs space-y-1.5 font-mono font-bold shadow-xs">
                <div className="flex justify-between text-stone-700">
                  <span>
                    {isUrdu
                      ? `بنیادی قیمت (${orderQuantity} × ${selectedProduct.pricePerUnit.toLocaleString()}):`
                      : `Subtotal (${orderQuantity} × ${selectedProduct.pricePerUnit.toLocaleString()}):`}
                  </span>
                  <span>
                    {isUrdu
                      ? `${(selectedProduct.pricePerUnit * orderQuantity).toLocaleString()} روپے`
                      : `PKR ${(selectedProduct.pricePerUnit * orderQuantity).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>
                    {isUrdu
                      ? `ایف بی آر جی ایس ٹی (${selectedProduct.taxRatePercent}%):`
                      : `FBR GST (${selectedProduct.taxRatePercent}%):`}
                  </span>
                  <span>
                    {isUrdu
                      ? `${Math.round(
                          (selectedProduct.pricePerUnit * orderQuantity * selectedProduct.taxRatePercent) / 100
                        ).toLocaleString()} روپے`
                      : `PKR ${Math.round(
                          (selectedProduct.pricePerUnit * orderQuantity * selectedProduct.taxRatePercent) / 100
                        ).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>
                    {fulfilmentType === 'cod'
                      ? isUrdu
                        ? 'کوریئر / ترسیل (بیمہ شدہ):'
                        : 'Delivery / Handover:'
                      : isUrdu
                      ? 'براہِ راست وصولی:'
                      : 'Pickup (Self-Arranged):'}
                  </span>
                  <span className="text-emerald-800">
                    {isUrdu ? '0 روپے (کوئی اضافی فیس نہیں)' : 'PKR 0 (No Extra Fee)'}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>{isUrdu ? 'منافع پلیٹ فارم فیس:' : 'Munafa Platform / Order Fee:'}</span>
                  <span>{isUrdu ? '0 روپے (مفت)' : 'PKR 0 (100% Free)'}</span>
                </div>
                <div className="pt-2 border-t-2 border-stone-200 flex justify-between text-sm font-extrabold text-stone-950">
                  <span>{isUrdu ? 'کل رقم:' : 'Grand Total:'}</span>
                  <span className="text-emerald-900 font-black">
                    {isUrdu
                      ? `${(
                          selectedProduct.pricePerUnit * orderQuantity +
                          Math.round(
                            (selectedProduct.pricePerUnit * orderQuantity * selectedProduct.taxRatePercent) / 100
                          )
                        ).toLocaleString()} روپے`
                      : `PKR ${(
                          selectedProduct.pricePerUnit * orderQuantity +
                          Math.round(
                            (selectedProduct.pricePerUnit * orderQuantity * selectedProduct.taxRatePercent) / 100
                          )
                        ).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-stone-600 font-semibold leading-tight">
                {t('fbrRegistered')}. {t('coreDisclaimerShort')}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-black text-[#023819] bg-[#eef7f1] border-2 border-emerald-300 rounded-xl hover:bg-[#dcfce7] cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="py-2.5 px-6 munafa-green-btn disabled:opacity-50 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>
                    {isSubmittingOrder
                      ? isUrdu
                        ? 'پروسیسنگ جاری...'
                        : 'Processing...'
                      : isUrdu
                      ? 'آرڈر کی تصدیق کریں'
                      : 'Confirm Order & Issue Invoice'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Details & Commercial Specs Modal */}
      {specsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-emerald-800/40 overflow-hidden my-2 sm:my-6 max-h-[92dvh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 munafa-bg-header bg-[#034720] text-white border-b-2 border-[#d4af37] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#fef08a] font-extrabold block">
                  {isUrdu ? 'مصنوعات کی تفصیلات اور تجارتی شرائط' : 'Commodity Specification & Commercial Compliance'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-white">{specsProduct.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSpecsProduct(null)}
                className="p-2 text-white hover:bg-[#077a38] rounded-xl transition-colors cursor-pointer font-black border border-[#facc15]/60"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 bg-white text-stone-900 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-stone-200 overflow-hidden aspect-4/3 bg-[#eef7f1] flex items-center justify-center">
                  {specsImageFailed || !specsProduct.imageUrl ? (
                    <Boxes className="w-10 h-10 text-[#046c31]" />
                  ) : (
                    <img
                      src={specsProduct.imageUrl}
                      alt={specsProduct.title}
                      referrerPolicy="no-referrer"
                      onError={() => setSpecsImageFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-500 block mb-1">
                      {isUrdu ? 'تصدیق شدہ سپلائر' : 'Verified Supplier'}
                    </span>
                    <div className="text-base font-black text-stone-950">{specsProduct.sellerName}</div>
                    <div className="text-xs font-mono font-extrabold text-[#023819] mt-0.5">
                      {isUrdu ? `اکاؤنٹ نمبر #${specsProduct.sellerAccountNumber}` : `Account #${specsProduct.sellerAccountNumber}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#065f46] mt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-800" />
                      <span>{getSellerPhone(specsProduct)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-700 font-bold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                      <span>{specsProduct.city}, Pakistan</span>
                    </div>
                  </div>

                  <div className="border-2 border-stone-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                    <div className="grid grid-cols-2 divide-x-2 divide-stone-200">
                      <div className="p-3 bg-white">
                        <span className="text-[9px] uppercase font-extrabold text-stone-500 block">
                          {isUrdu ? 'یونٹ ریٹ' : 'Unit Rate'}
                        </span>
                        <span className="font-mono font-black text-base text-stone-950 block">
                          {isUrdu
                            ? `${specsProduct.pricePerUnit.toLocaleString()} روپے`
                            : `PKR ${specsProduct.pricePerUnit.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-stone-500 font-bold block mt-0.5">
                          {isUrdu ? `فی ${specsProduct.unit}` : `per ${specsProduct.unit}`}
                        </span>
                      </div>
                      <div className="p-3 bg-stone-50">
                        <span className="text-[9px] uppercase font-extrabold text-emerald-900 block">
                          {isUrdu
                            ? `جی ایس ٹی (${specsProduct.taxRatePercent}%)`
                            : `Govt GST (${specsProduct.taxRatePercent}%)`}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-emerald-900 block">
                          {isUrdu
                            ? `+${specsProduct.taxAmountPkr.toLocaleString()} روپے`
                            : `+PKR ${specsProduct.taxAmountPkr.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                          {isUrdu ? 'ٹیکس رسید شامل ہے' : 'FBR Invoice Included'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-stone-200 rounded-2xl p-4 bg-white space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-stone-700 border-b border-stone-200 pb-2">
                  {isUrdu ? 'تکنیکی تفصیلات اور اسٹاک' : 'Technical Specifications & Supply Ledger'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-extrabold text-stone-500 block">
                      {isUrdu ? 'قسم' : 'Category'}
                    </span>
                    <span className="font-extrabold text-stone-900">{categoryName(specsProduct.category)}</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-extrabold text-stone-500 block">
                      {t('minOrderQty')}
                    </span>
                    <span className="font-mono font-extrabold text-stone-900">
                      {specsProduct.minOrderQty} {specsProduct.unit}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-extrabold text-stone-500 block">
                      {t('availableStock')}
                    </span>
                    <span className="font-mono font-extrabold text-stone-900">
                      {specsProduct.quantityAvailable} {specsProduct.unit}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-extrabold text-stone-500 block">
                      {isUrdu ? 'رجسٹریشن' : 'Compliance'}
                    </span>
                    <span className="font-extrabold text-emerald-900">FBR Pakistan</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-stone-200 rounded-2xl p-4 bg-white">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-500 block mb-1">
                  {isUrdu ? 'مصنوعات کی تفصیل' : 'Commodity Details & Processing'}
                </span>
                <p className="text-xs text-stone-700 leading-relaxed font-semibold">{specsProduct.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const sellerAcc = specsProduct.sellerAccountNumber;
                    const title = specsProduct.title;
                    const id = specsProduct.id;
                    setSpecsProduct(null);
                    onOpenChatWithSeller(sellerAcc, `Inquiring about ${title} (${id})`);
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 border-2 border-[#046c31] bg-[#eef7f1] hover:bg-[#dcfce7] text-[#023819] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#046c31]" />
                  <span>{t('chatWithSeller')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = specsProduct;
                    setSpecsProduct(null);
                    handleOpenOrder(p);
                  }}
                  className="w-full sm:w-auto py-2.5 px-6 munafa-gold-btn font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t('placeOrder')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#052e16]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Remove Ad Confirmation Modal */}
      {adminRemoveAdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-red-700 overflow-hidden">
            <div className="bg-red-700 text-white px-5 py-4 border-b border-red-900 flex items-center justify-between">
              <h3 className="text-sm font-black">
                {isUrdu ? 'اشتہار تمام پینلز سے ہٹائیں؟' : 'Remove Ad From All Panels?'}
              </h3>
              <button
                type="button"
                onClick={() => setAdminRemoveAdTarget(null)}
                className="text-white hover:text-amber-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-stone-800 font-bold leading-relaxed">
                {isUrdu
                  ? `کیا آپ واقعی "${adminRemoveAdTarget.title}" کو مرکزی صفحہ اور تمام سیکشن پینلز سے ہٹانا چاہتے ہیں؟`
                  : `Permanently remove "${adminRemoveAdTarget.title}" (Seller #${adminRemoveAdTarget.sellerAccountNumber}) from Main Page and all marketplace panels?`}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminRemoveAdTarget(null)}
                  className="px-4 py-2 font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                >
                  {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = LocalEdgeDb.deleteProduct(adminRemoveAdTarget.id, true);
                    setAdminAdNotice(res.message);
                    setAdminRemoveAdTarget(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'اشتہار ہٹائیں' : 'Remove Ad Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
