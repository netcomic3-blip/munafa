/**
 * MUNAFA Terms & Conditions + Privacy Policy Modal
 * Covers Connecting Platform Status, Delivery/Insurance/COD & Tax Rules,
 * Subscription Plans, and User Privacy & Device Preferences.
 */

import React, { useState } from 'react';
import { X, Scale, ShieldCheck, Lock, FileCheck2, ZoomIn, ZoomOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const { isUrdu } = useLanguage();
  const [zoomCert, setZoomCert] = useState(false);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-emerald-800 overflow-hidden my-2 sm:my-6 max-h-[92dvh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 bg-[#033d1c] text-white border-b-2 border-[#d4af37] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-24 h-12 shrink-0 rounded-xl bg-white border-2 border-[#facc15] px-1.5 py-0.5 flex items-center justify-center shadow-xs">
              <img
                src="/assets/aistudio/image_65c6c502.png"
                alt="MUNAFA"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Scale className="w-5 h-5 text-[#fde047] shrink-0" />
              <h2 className="text-sm sm:text-base font-black truncate">
                {isUrdu
                  ? 'منافع شرائط و ضوابط اور پرائیویسی پالیسی'
                  : 'Munafa Terms & Conditions & Privacy Policy'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-stone-900 leading-relaxed bg-white">
          {/* FBR & Core Legal Disclaimer */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-700 text-stone-950 rounded-2xl">
            <strong className="block text-emerald-950 font-black mb-1 text-sm">
              {isUrdu ? 'بنیادی قانونی وضاحت اور ایف بی آر رجسٹریشن' : 'Core Legal Disclaimer & FBR Registration'}
            </strong>
            <p className="font-bold leading-relaxed text-black">
              {isUrdu
                ? 'منافع پلیٹ فارم کی فیسیں Wage (رجسٹرڈ از ایف بی آر پاکستان، NTN نمبر: 1666865-7) کو قابلِ ادائیگی ہیں۔ منافع صرف پاکستانی کسانوں، کان کنوں، فیکٹریوں، ہول سیلرز، دکانوں اور گھرانوں کو آپس میں جوڑنے کا ایک پلیٹ فارم ہے اور کسی بھی سامان کے نقصان، چوری، گمشدگی، راستے میں خرابی یا کسی غیر ادا شدہ حکومتی ٹیکس کا ذمہ دار نہیں ہے۔'
                : 'Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7). Munafa operates strictly as a connecting platform linking Pakistani farmers, miners, factories, wholesalers, shops, and households, and is not responsible for any item loss, theft, missing goods, damage in transit, non-payment, or any tax not paid to the Government of Pakistan.'}
            </p>
          </div>

          {/* Delivery, Insurance, COD & Tax Rules */}
          <div className="space-y-2.5 bg-white border border-stone-300 p-4 rounded-2xl">
            <h3 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {isUrdu ? 'ڈیلیوری، انشورنس، کیش آن ڈیلیوری اور ٹیکس قواعد' : 'Delivery, Insurance, COD & Tax Rules'}
              </span>
            </h3>
            <ul className="space-y-2 list-disc list-inside font-semibold text-stone-900">
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'بیمہ شدہ ڈیلیوری:' : 'Mandatory Insured Delivery:'}
                </strong>{' '}
                {isUrdu
                  ? 'تمام کیش آن ڈیلیوری (COD) آرڈرز پر سامان کے گم ہونے یا چوری کی صورت میں مکمل انشورنس اور حفاظت بیچنے والے (کسان، کان کن، فیکٹری، ہول سیلر) کی ذمہ داری ہے۔'
                  : 'For Cash on Delivery orders, farmers, miners, factories, and wholesalers are responsible for arranging insured delivery covering missing or stolen items.'}
              </li>
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'سائٹ سے پک اپ:' : 'Site Pickup Option:'}
                </strong>{' '}
                {isUrdu
                  ? 'خریدار اپنی ذمہ داری پر بیچنے والے کے مقام سے براہِ راست سامان وصول کر سکتا ہے۔'
                  : 'Customers may collect goods directly from the seller’s site at their own transport and responsibility.'}
              </li>
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'ایف بی آر ٹیکس اور جی ایس ٹی:' : 'FBR Taxes & GST Receipts:'}
                </strong>{' '}
                {isUrdu
                  ? 'جی ایس ٹی، ٹیکس اور ڈیلیوری چارجز بیچنے والا ایڈجسٹ کر کے انوائس پر ظاہر کرتا ہے اور ایف بی آر کو خود ادا کرنے کا پابند ہے۔'
                  : 'Businesses adjust GST, taxes, and delivery charges on receipts/invoices and remain solely responsible for remitting applicable FBR taxes.'}
              </li>
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'سبسکرپشن پلانز:' : 'Subscription Plans:'}
                </strong>{' '}
                {isUrdu
                  ? 'خریداروں کے لیے مفت، کسان/کان کنی 2,000 روپے سالانہ، فیکٹری 2,000 روپے ماہانہ، ہول سیلر 1,500 روپے ماہانہ (جاز کیش یا بینک ٹرانسفر کے ذریعے رجسٹریشن کے وقت قابلِ ادائیگی)۔'
                  : 'Buyers: Free | Farmer/Mining: PKR 2,000/yr | Factory: PKR 2,000/mo | Wholesaler: PKR 1,500/mo (payable via JazzCash or Bank Transfer at registration).'}
              </li>
            </ul>
          </div>

          {/* Privacy Policy & Consent */}
          <div className="space-y-2.5 bg-white border border-stone-300 p-4 rounded-2xl">
            <h3 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>{isUrdu ? 'پرائیویسی پالیسی اور صارف کی اجازت' : 'Privacy Policy & User Consent'}</span>
            </h3>
            <ul className="space-y-2 list-disc list-inside font-semibold text-stone-900">
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'شناختی کارڈ اور پن کا تحفظ:' : 'CNIC & Credential Confidentiality:'}
                </strong>{' '}
                {isUrdu
                  ? 'آپ کا شناختی کارڈ نمبر، 4 ہندسی پن اور ای میل خفیہ رکھے جاتے ہیں اور کبھی بھی عوامی صفحات پر ظاہر نہیں کیے جاتے۔ شناختی کارڈ صرف اکاؤنٹ بازیابی کے لیے استعمال ہوتا ہے۔'
                  : 'Your CNIC number, 4-digit PIN, and private credentials are never displayed publicly and are used strictly for account identity verification and PIN/account recovery.'}
              </li>
              <li>
                <strong className="font-extrabold text-black">
                  {isUrdu ? 'آف لائن سہولت اور صارف کی رضامندی:' : 'Offline Convenience & Explicit Consent:'}
                </strong>{' '}
                {isUrdu
                  ? 'آرڈرز، چیٹ اور انوائسز تک تیز رسائی کے لیے صارف کی واضح اجازت سے ڈیوائس پر عارضی کیش محفوظ کیا جا سکتا ہے۔ آپ کسی بھی وقت اکاؤنٹ یا رابطے بلاک/حذف کر سکتے ہیں۔'
                  : 'With your explicit consent during registration, recent invoices and messages may be cached locally on your device for reliable access. You retain full control to block peers or manage contacts.'}
              </li>
            </ul>
          </div>

          {/* Official Government Registration Certificate (Form C) */}
          <div className="space-y-3 bg-white border-2 border-emerald-700 p-4 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  {isUrdu
                    ? 'سرکاری رجسٹریشن سرٹیفکیٹ (فارم C — محکمہ لیبر ویلفیئر پنجاب)'
                    : 'Official Registration Certificate (Form "C" — Directorate of Labour Welfare Lahore)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setZoomCert(!zoomCert)}
                className="py-1.5 px-3 rounded-lg bg-[#eef7f1] hover:bg-[#dcfce7] border border-emerald-700 text-[#023819] text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                {zoomCert ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                <span>
                  {zoomCert
                    ? isUrdu
                      ? 'عام سائز'
                      : 'Normal Size'
                    : isUrdu
                    ? 'بڑا کر کے دیکھیں'
                    : 'Enlarge Certificate'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#f4faf6] border border-emerald-200 rounded-xl p-2.5 text-black font-bold">
              <div>
                <span className="block text-[10px] text-stone-700 font-semibold">Establishment</span>
                <span className="font-black">M/S MUNAFA</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-700 font-semibold">Registration No.</span>
                <span className="font-mono font-black">2026011704352</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-700 font-semibold">Registration Date</span>
                <span className="font-mono font-black">24-11-2026</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-700 font-semibold">Valid Till</span>
                <span className="font-mono font-black">23-11-2028</span>
              </div>
            </div>

            <div className="bg-white border border-stone-300 rounded-xl p-2 flex justify-center overflow-auto">
              <img
                src="/assets/aistudio/image_86a91090.png"
                alt="Form C Registration Certificate — Directorate of Labour Welfare Lahore, Government of the Punjab — M/S MUNAFA (Reg. No. 2026011704352)"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onClick={() => setZoomCert(!zoomCert)}
                className={`rounded-lg cursor-pointer transition-all ${
                  zoomCert ? 'w-full max-w-none' : 'w-full max-w-md h-auto object-contain'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl text-xs font-black cursor-pointer munafa-gold-btn"
          >
            {isUrdu ? 'میں نے پڑھ لیا اور متفق ہوں' : 'I Understand and Agree'}
          </button>
        </div>
      </div>
    </div>
  );
};
