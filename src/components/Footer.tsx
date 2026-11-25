/**
 * MUNAFA Official Footer
 * Features the Pakistan Heritage Economy CTA Banner, clean Subscription Rates & Legal Disclaimer,
 * and Deep Emerald Footer Bar (with no central/local DB jargon and no exposed admin passwords).
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Scale,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageSquare,
  Package,
  Store,
  Shield,
  Phone,
  Mail,
  Cpu,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { UserAccount } from '../types';
import { BUNDLED_PRODUCT_ASSETS } from '../assets/productAssets';

interface FooterProps {
  onOpenTermsModal: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  unreadCount?: number;
  currentUser?: UserAccount | null;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTermsModal,
  activeTab,
  setActiveTab,
  unreadCount = 0,
  currentUser,
  onOpenAuth,
}) => {
  const { t, isUrdu } = useLanguage();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <footer className="mt-8 pb-16 md:pb-0" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* 1. HERITAGE PAKISTAN SKYLINE CTA BANNER (Matches Reference Screenshot) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6">
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-lg munafa-bg-banner-cta bg-[#045c29] min-h-[120px] flex items-center">
          <img
            src={BUNDLED_PRODUCT_ASSETS.heritageSkylineImg}
            alt={isUrdu ? 'مضبوط پاکستان، خوشحال شہری' : 'Pakistan National Heritage Economy'}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-luminosity sm:mix-blend-normal"
          />
          <div className="absolute inset-0 munafa-bg-banner-scrim" />

          <div className="relative z-10 w-full px-5 sm:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-36 h-[72px] rounded-xl bg-white border-2 border-[#facc15] px-2 py-1 items-center justify-center shrink-0 shadow-md">
                <img
                  src="/assets/aistudio/image_65c6c502.png"
                  alt="MUNAFA"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
                  {isUrdu
                    ? 'مضبوط معیشت • زیادہ روزگار • کم قیمتیں'
                    : 'A Stronger Economy • More Jobs • Lower Prices'}
                </h2>
                <p className="text-sm sm:text-base font-extrabold italic text-[#fde047] drop-shadow-xs">
                  {isUrdu
                    ? 'خوشحال شہری  |  محفوظ مستقبل  |  خود کفیل پاکستان'
                    : 'Prosperous Citizens  |  Secure Future  |  Self-Reliant Pakistan'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenAuth && !currentUser) {
                  onOpenAuth('signup');
                } else if (setActiveTab) {
                  setActiveTab('portal');
                }
              }}
              className="shrink-0 py-3 px-6 rounded-full font-black text-sm sm:text-base flex items-center gap-1.5 cursor-pointer munafa-gold-btn transition-transform hover:scale-102"
            >
              <span>{t('joinToday')}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXPANDABLE LEGAL DISCLAIMER & SUBSCRIPTION CHARTER STRIP */}
      <div className="bg-[#e3f1e8] border-t-2 border-emerald-700/30 py-8 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Core Disclaimer Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-emerald-700/30 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-black text-[#023819] text-sm block">
                    {t('coreDisclaimerTitle')}
                  </span>
                  <span className="text-xs font-bold text-[#046c31]">{t('footerWageNotice')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className="py-2 px-4 munafa-green-btn rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{showDisclaimer ? t('hideCoreDisclaimer') : t('viewCoreDisclaimer')}</span>
                {showDisclaimer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showDisclaimer && (
              <div className="mt-4 pt-4 border-t border-emerald-200 text-stone-800 space-y-3 leading-relaxed">
                <p className="text-stone-950 font-semibold text-xs bg-white p-3.5 rounded-xl border border-amber-400">
                  {t('coreDisclaimerShort')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-stone-200 p-3 rounded-xl">
                    <strong className="text-emerald-950 font-extrabold block mb-1">
                      {isUrdu ? 'محفوظ انشورڈ ڈیلیوری' : 'Insured Delivery Responsibility'}
                    </strong>
                    <span className="text-stone-700">
                      {isUrdu
                        ? 'کیش آن ڈیلیوری (COD) پر گمشدہ یا چوری شدہ سامان کی انشورنس بیچنے والے کی ذمہ داری ہے۔'
                        : 'Farmers, miners, factories & wholesalers arrange insured delivery against theft or loss for COD orders.'}
                    </span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl">
                    <strong className="text-emerald-950 font-extrabold block mb-1">
                      {isUrdu ? 'ایف بی آر سیلز ٹیکس' : 'FBR Sales Tax Obligations'}
                    </strong>
                    <span className="text-stone-700">
                      {isUrdu
                        ? 'کاروباری حضرات انوائس پر جی ایس ٹی درج کرنے اور ایف بی آر کو ٹیکس ادا کرنے کے خود ذمہ دار ہیں۔'
                        : 'Registered sellers collect and remit GST & applicable FBR taxes directly to the Government of Pakistan.'}
                    </span>
                  </div>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl">
                    <strong className="text-emerald-950 font-extrabold block mb-1">
                      {isUrdu ? 'سائٹ پک اپ ذمہ داری' : 'Self-Pickup Terms'}
                    </strong>
                    <span className="text-stone-700">
                      {isUrdu
                        ? 'بیچنے والے کے مقام سے خود سامان اٹھانا خریدار کی اپنی ذمہ داری اور ٹرانسپورٹ پر ہے۔'
                        : 'Buyers collecting goods directly from seller sites do so at their own transport and responsibility.'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3-Column Platform Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Brand Column */}
            <div className="bg-white border-2 border-emerald-700/25 p-5 rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-40 h-20 rounded-xl bg-white border-2 border-[#d4af37] px-2 py-1 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/assets/aistudio/image_65c6c502.png"
                    alt="MUNAFA"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <p className="text-stone-700 text-xs font-semibold leading-relaxed">
                {isUrdu
                  ? 'میڈ اِن پاکستان مارکیٹ پلیس — کسانوں، کان کنوں، فیکٹریوں اور ہول سیلرز کو دکانوں اور گھرانوں سے براہِ راست جوڑنے والا پلیٹ فارم۔'
                  : 'Made in Pakistan Marketplace connecting farmers, miners, factories, wholesalers, shops and households directly.'}
              </p>
              <div className="text-xs font-extrabold text-[#046c31] pt-1 leading-relaxed">
                {t('footerWageNotice')}
              </div>
            </div>

            {/* Legal Position */}
            <div className="bg-white border-2 border-emerald-700/25 p-5 rounded-2xl space-y-2 shadow-xs">
              <h4 className="text-[#023819] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#046c31]" />
                <span>{isUrdu ? 'صرف رابطہ پلیٹ فارم' : 'Connecting Marketplace Platform'}</span>
              </h4>
              <p className="text-stone-700 text-xs font-semibold leading-relaxed">
                {isUrdu
                  ? 'منافع صرف رابطے، چیٹ، کالز، آرڈر ریکارڈ اور انوائس کی سہولت دیتا ہے۔ خریدار اور کاروباری ادارے لین دین کے خود ذمہ دار ہیں۔'
                  : 'Munafa connects registered buyers and businesses with verified 8-digit account numbers, direct chat, audio/video calling, and PDF invoicing.'}
              </p>
            </div>

            {/* Official Membership Plans */}
            <div className="bg-white border-2 border-emerald-700/25 p-5 rounded-2xl space-y-2 shadow-xs">
              <h4 className="text-[#023819] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#046c31]" />
                <span>{isUrdu ? 'ممبرشپ اور سبسکرپشن پلانز' : 'Official Membership Plans'}</span>
              </h4>
              <ul className="text-stone-800 text-xs space-y-1 font-bold tabular-nums">
                <li className="text-[#046c31]">• {isUrdu ? 'خریدار (Buyers): 100% مفت' : 'Buyers: 100% Free'}</li>
                <li>• {isUrdu ? 'کسان / کان کنی: 2,000 روپے / سالانہ' : 'Farmers & Mining: PKR 2,000 / Year'}</li>
                <li>• {isUrdu ? 'فیکٹری: 2,000 روپے / ماہانہ' : 'Factories: PKR 2,000 / Month'}</li>
                <li>• {isUrdu ? 'ہول سیلر: 1,500 روپے / ماہانہ' : 'Wholesalers: PKR 1,500 / Month'}</li>
              </ul>
              <p className="text-[11px] text-stone-700 font-bold pt-0.5 leading-snug">
                {isUrdu
                  ? 'منافع پلیٹ فارم کی فیسیں Wage بینک اکاؤنٹ یا جاز کیش (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں۔'
                  : 'Munafa Platform fees are payable to Wage bank account or JazzCash (registered with FBR Pakistan, NTN No: 1666865-7).'}
              </p>
            </div>
          </div>

          {/* Quick Platform Actions Strip */}
          {setActiveTab && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'marketplace'
                    ? 'bg-[#034720] text-[#fef08a] border-[#d4af37]'
                    : 'bg-white text-[#023819] border-emerald-600/40 hover:bg-[#f0fdf4]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{t('marketplace')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inbox'
                    ? 'bg-[#034720] text-[#fef08a] border-[#d4af37]'
                    : 'bg-white text-[#023819] border-emerald-600/40 hover:bg-[#f0fdf4]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('sharedInbox')}</span>
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#034720] text-[#fef08a] border-[#d4af37]'
                    : 'bg-white text-[#023819] border-emerald-600/40 hover:bg-[#f0fdf4]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t('ordersInvoices')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edgedb')}
                className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'edgedb'
                    ? 'bg-[#034720] text-[#fef08a] border-[#d4af37]'
                    : 'bg-white text-[#023819] border-emerald-600/40 hover:bg-[#f0fdf4]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'ڈیوائس ڈیٹا بیس و سیکیورٹی' : 'Device DB & Security'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. DEEP EMERALD BOTTOM BAR (Matches Reference Screenshot) */}
      <div className="bg-[#023518] text-white border-t border-emerald-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 font-semibold text-emerald-100">
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="hover:text-[#fde047] transition-colors cursor-pointer"
            >
              {t('termsAndConditions')}
            </button>
            <span aria-hidden="true" className="text-emerald-600">|</span>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="hover:text-[#fde047] transition-colors cursor-pointer"
            >
              {t('privacyPolicy')}
            </button>
            <span aria-hidden="true" className="text-emerald-600">|</span>
            <button
              type="button"
              onClick={() => (setActiveTab ? setActiveTab('inbox') : onOpenTermsModal())}
              className="hover:text-[#fde047] transition-colors cursor-pointer"
            >
              {t('contactUs')}
            </button>
            <span aria-hidden="true" className="text-emerald-600">|</span>
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('admin')}
              className="hover:text-[#fde047] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-[#fde047]" />
              <span>{t('adminControl')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-emerald-100 font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('edgedb')}
              className="inline-flex items-center gap-1 text-[#fef08a] hover:text-white font-bold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#facc15]" />
              <span>{isUrdu ? '1 سیکنڈ سائبر شیلڈ و ڈیوائس DB' : '1st-Sec Cyber-Shield & Device DB'}</span>
            </button>
            <span aria-hidden="true" className="text-emerald-600">·</span>
            <span className="text-[#fde047] font-bold">{t('footerWageNotice')}</span>
            <span aria-hidden="true" className="text-emerald-600">·</span>
            <span>
              {isUrdu
                ? '© 2025 منافع۔ میڈ اِن پاکستان۔'
                : '© 2025 MUNAFA. Made in Pakistan.'}
            </span>
            <div className="flex items-center gap-1.5 pl-1">
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('inbox')}
                aria-label={t('sharedInbox')}
                className="w-6 h-6 rounded bg-[#0a7a3a] hover:bg-emerald-600 flex items-center justify-center text-white cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('inbox')}
                aria-label={t('contactUs')}
                className="w-6 h-6 rounded bg-[#055829] hover:bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-[#fde047] cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
