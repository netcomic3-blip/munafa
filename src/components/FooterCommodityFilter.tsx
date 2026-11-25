/**
 * MUNAFA Commodity Search & Filter Bar (Positioned Above Footer)
 * Directly matches the design and specifications in user reference image,
 * with bilingual Urdu & English translation support.
 */

import React from 'react';
import { Search, MapPin, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ProductCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterCommodityFilterProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: 'all' | ProductCategory;
  setSelectedCategory: (cat: 'all' | ProductCategory) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  activeCount: number;
  onNavigateToMarketplace: () => void;
}

export const FooterCommodityFilter: React.FC<FooterCommodityFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity,
  maxPrice,
  setMaxPrice,
  activeCount,
  onNavigateToMarketplace,
}) => {
  const { t, isUrdu } = useLanguage();

  const cities = [
    { id: 'all', en: 'All Cities (Pakistan)', ur: 'تمام شہر (پاکستان)' },
    { id: 'Lahore', en: 'Lahore', ur: 'لاہور' },
    { id: 'Karachi', en: 'Karachi', ur: 'کراچی' },
    { id: 'Faisalabad', en: 'Faisalabad', ur: 'فیصل آباد' },
    { id: 'Sialkot', en: 'Sialkot', ur: 'سیالکوٹ' },
    { id: 'Sheikhupura', en: 'Sheikhupura', ur: 'شیخوپورہ' },
    { id: 'Khewra / Jhelum', en: 'Khewra / Jhelum', ur: 'کھیوڑہ / جہلم' },
    { id: 'Gujranwala', en: 'Gujranwala', ur: 'گوجرانوالہ' },
    { id: 'Peshawar', en: 'Peshawar', ur: 'پشاور' },
    { id: 'Quetta', en: 'Quetta', ur: 'کوئٹہ' },
    { id: 'Multan', en: 'Multan', ur: 'ملتان' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6">
      <div className="bg-white border-2 border-emerald-700/35 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-emerald-700/15 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#023819] tracking-tight">
              {isUrdu ? 'پاکستانی اجناس و اشیاء کی تلاش و فلٹرز' : 'Commodity Marketplace Search & Filter'}
            </h3>
            <p className="text-xs text-stone-700 font-semibold">
              {isUrdu
                ? 'پاکستانی کھیتوں، کانوں اور فیکٹریوں سے براہِ راست آپ کی دکان یا گھر تک۔'
                : 'Direct connection from Pakistani fields, mines, and factories to your shop or house.'}
            </p>
          </div>
          <button
            onClick={onNavigateToMarketplace}
            className="text-xs font-extrabold px-3 py-1.5 rounded-lg munafa-green-btn flex items-center gap-1 cursor-pointer"
          >
            <span>{isUrdu ? 'مکمل مارکیٹ کھولیں' : 'Open Full Marketplace'}</span>
            <ArrowRight className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>

        {/* Row 1: Search Box */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#046c31] absolute start-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onNavigateToMarketplace();
            }}
            placeholder={
              isUrdu
                ? 'پاکستانی چاول، گندم، کھیوڑہ نمک، سنگ مرمر، جراحی آلات، تولیے تلاش کریں...'
                : 'Search Basmati, Khewra Salt, Surgical Steel, Towels, Minerals...'
            }
            className="w-full ps-11 pe-4 py-2.5 text-sm font-bold border-2 border-emerald-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-[#065f46]"
          />
        </div>

        {/* Row 2: Category Segmented Control */}
        <div className="flex items-center p-1.5 bg-[#e3f1e8] border-2 border-emerald-700/25 rounded-xl text-xs font-bold overflow-x-auto gap-1.5">
          <button
            onClick={() => {
              setSelectedCategory('all');
              onNavigateToMarketplace();
            }}
            className={`flex-1 min-w-[90px] py-2 px-3 text-center rounded-lg transition-all whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'all'
                ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs font-extrabold'
                : 'bg-white text-[#023819] hover:bg-[#f2fbf5]'
            }`}
          >
            {isUrdu ? 'تمام اقسام' : 'All Types'}
          </button>

          <button
            onClick={() => {
              setSelectedCategory('farm_mining');
              onNavigateToMarketplace();
            }}
            className={`flex-1 min-w-[90px] py-2 px-3 text-center rounded-lg transition-all whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'farm_mining'
                ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs font-extrabold'
                : 'bg-white text-[#023819] hover:bg-[#f2fbf5]'
            }`}
          >
            {isUrdu ? 'کسان / کان کنی' : 'Farm/Mine'}
          </button>

          <button
            onClick={() => {
              setSelectedCategory('factory');
              onNavigateToMarketplace();
            }}
            className={`flex-1 min-w-[90px] py-2 px-3 text-center rounded-lg transition-all whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'factory'
                ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs font-extrabold'
                : 'bg-white text-[#023819] hover:bg-[#f2fbf5]'
            }`}
          >
            {isUrdu ? 'فیکٹری مال' : 'Factory'}
          </button>

          <button
            onClick={() => {
              setSelectedCategory('wholesale');
              onNavigateToMarketplace();
            }}
            className={`flex-1 min-w-[90px] py-2 px-3 text-center rounded-lg transition-all whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'wholesale'
                ? 'bg-[#034720] text-[#fef08a] border border-[#d4af37] shadow-xs font-extrabold'
                : 'bg-white text-[#023819] hover:bg-[#f2fbf5]'
            }`}
          >
            {isUrdu ? 'تھوک مارکیٹ' : 'Wholesale'}
          </button>
        </div>

        {/* Row 3: City Select */}
        <div>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              onNavigateToMarketplace();
            }}
            className="w-full py-2.5 px-3.5 text-xs font-bold border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-950 cursor-pointer"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id} className="font-bold">
                {isUrdu ? c.ur : c.en}
              </option>
            ))}
          </select>
        </div>

        {/* Row 4: Max Price Slider & Commodities Count */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 gap-3 pt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-medium whitespace-nowrap">
              {isUrdu ? 'زیادہ سے زیادہ قیمت:' : 'Max Price:'}
            </span>
            <input
              type="range"
              min="1000"
              max="500000"
              step="5000"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                onNavigateToMarketplace();
              }}
              className="w-40 sm:w-52 accent-emerald-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-stone-900 tabular-nums whitespace-nowrap">
              {isUrdu ? `${maxPrice.toLocaleString()} روپے` : `PKR ${maxPrice.toLocaleString()}`}
            </span>
          </div>

          <div className="text-right w-full sm:w-auto">
            {isUrdu ? (
              <span>
                مجموعی <strong className="text-stone-900 font-bold">{activeCount}</strong> تصدیق شدہ پاکستانی اشیاء دستیاب ہیں
              </span>
            ) : (
              <span>
                Showing <strong className="text-stone-900 font-bold">{activeCount}</strong> active verified commodities
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
