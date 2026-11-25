/**
 * MUNAFA Two-Tier Pakistani Emerald & Imperial Gold Header
 * Matches the flagship Made in Pakistan marketplace header aesthetic cleanly
 * with strict Urdu / English separation and responsive mobile controls.
 */

import React, { useState } from 'react';
import { UserAccount, ProductCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  Package,
  LogOut,
  ChevronDown,
  Home,
  ShoppingCart,
  Tractor,
  Factory,
  Boxes,
  Pickaxe,
  Headphones,
  UserPlus,
  LogIn,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount | null;
  unreadCount: number;
  onOpenAuth: (mode: 'login' | 'signup' | 'changepin') => void;
  onLogout: () => void;
  onSwitchAccount: (accountNumber: string) => void;
  accounts: UserAccount[];
  selectedCategory?: 'all' | ProductCategory;
  setSelectedCategory?: (cat: 'all' | ProductCategory) => void;
  setSearchQuery?: (q: string) => void;
  onOpenTermsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  unreadCount,
  onOpenAuth,
  onLogout,
  onSwitchAccount,
  accounts,
  selectedCategory = 'all',
  setSelectedCategory,
  setSearchQuery,
  onOpenTermsModal,
}) => {
  const { t, isUrdu, toggleLanguage } = useLanguage();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [activeSubNav, setActiveSubNav] = useState<string>('buyers');

  const getRoleBadge = (type: string) => {
    switch (type) {
      case 'farmer_mining':
        return t('roleFarmerMining');
      case 'factory':
        return t('roleFactory');
      case 'wholesaler':
        return t('roleWholesaler');
      case 'admin':
        return t('roleAdmin');
      default:
        return t('roleCustomer');
    }
  };

  const handleCategoryNav = (
    navKey: string,
    cat: 'all' | ProductCategory,
    searchHint = ''
  ) => {
    setActiveSubNav(navKey);
    if (setSelectedCategory) setSelectedCategory(cat);
    if (setSearchQuery) setSearchQuery(searchHint);
    setActiveTab('marketplace');
  };

  const handleSupportNav = () => {
    setActiveSubNav('support');
    if (currentUser) {
      setActiveTab('inbox');
    } else if (onOpenTermsModal) {
      onOpenTermsModal();
    } else {
      setActiveTab('portal');
    }
  };

  const isSeller =
    currentUser &&
    (currentUser.accountType === 'farmer_mining' ||
      currentUser.accountType === 'factory' ||
      currentUser.accountType === 'wholesaler');

  return (
    <header className="sticky top-0 z-40 shadow-md bg-[#034720]" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* TIER 1: Primary Emerald & Gold Brand Header */}
      <div className="munafa-bg-header bg-[#034720] text-white border-b border-emerald-700/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 min-h-[88px] py-1.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Uploaded 2cm x 2cm Logo Lockup + Brand Text */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveSubNav('buyers');
                if (setSelectedCategory) setSelectedCategory('all');
                if (setSearchQuery) setSearchQuery('');
                setActiveTab('marketplace');
              }}
              className="flex items-center gap-3 text-start cursor-pointer group shrink-0"
            >
              {/* Official MUNAFA Logo (Panoramic crisp white & gold crest for maximum readability) */}
              <div className="h-[54px] w-[108px] sm:h-[2cm] sm:w-[4cm] shrink-0 rounded-xl bg-white border-2 border-[#facc15] overflow-hidden flex items-center justify-center shadow-[0_0_14px_rgba(250,204,21,0.5)] px-1.5 py-0.5">
                <img
                  src="/assets/aistudio/image_65c6c502.png"
                  alt="MUNAFA"
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
            </button>

            <div className="hidden xl:flex items-center gap-3 ps-3 border-s border-emerald-500/40">
              <span className="text-xs font-semibold italic text-emerald-50 whitespace-nowrap">
                {t('brandTagline')}
              </span>
            </div>
          </div>

          {/* Right: Top Nav Links + Language + Auth / Active User */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Home (Gold CTA on active) */}
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer whitespace-nowrap transition-all ${
                activeTab === 'marketplace'
                  ? 'munafa-gold-btn'
                  : 'text-emerald-50 hover:text-amber-200 hover:bg-emerald-900/60 border border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('home')}</span>
            </button>

            {/* About / Portal */}
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`hidden lg:inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === 'portal'
                  ? 'text-amber-300 underline underline-offset-4'
                  : 'text-emerald-100 hover:text-amber-200'
              }`}
            >
              {t('about')}
            </button>

            {/* Orders Quick Link when logged in */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'orders'
                    ? 'text-amber-300 underline underline-offset-4'
                    : 'text-emerald-100 hover:text-amber-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t('ordersInvoices')}</span>
              </button>
            )}

            {/* Shared Inbox Quick Link when logged in */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors relative ${
                  activeTab === 'inbox'
                    ? 'text-amber-300 underline underline-offset-4'
                    : 'text-emerald-100 hover:text-amber-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('sharedInbox')}</span>
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.2 rounded-full tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Seller Desk Quick Link */}
            {isSeller && (
              <button
                type="button"
                onClick={() => setActiveTab('seller')}
                className={`hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'seller'
                    ? 'text-amber-300 underline underline-offset-4'
                    : 'text-emerald-100 hover:text-amber-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('sellerDesk')}</span>
              </button>
            )}

            {/* Strict Bilingual Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg bg-[#034a22] hover:bg-[#056630] border border-[#facc15]/60 text-amber-100 text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0"
              title={isUrdu ? 'انگریزی زبان' : 'Switch to Urdu'}
            >
              {t('langToggle')}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#facc15]/80 bg-[#023819] hover:bg-[#045226] text-white transition-colors text-left cursor-pointer shadow-xs"
                  >
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-[#facc15]"
                    />
                    <div className="hidden md:block text-[11px] leading-tight">
                      <div className="font-bold text-white truncate max-w-[105px]">{currentUser.name}</div>
                      <div className="text-[10px] text-amber-300 font-mono font-bold">
                        #{currentUser.accountNumber}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-200" />
                  </button>

                  {/* Account Switcher Dropdown (No CNIC or PIN revealed) */}
                  {showSwitchMenu && (
                    <div className="absolute end-0 mt-2 w-72 bg-white text-black rounded-xl shadow-2xl border-2 border-[#065f46] py-2 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-[#d6d3d1] text-black">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-black block mb-0.5">
                          {t('activeUser')}
                        </span>
                        <div className="font-black text-black text-sm">{currentUser.name}</div>
                        <div className="text-black text-[11px] font-mono font-bold">
                          #{currentUser.accountNumber}
                        </div>
                        <div className="mt-1 text-black font-extrabold">
                          {getRoleBadge(currentUser.accountType)}
                        </div>
                      </div>

                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-black">
                        {t('quickSwitcher')}
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {accounts
                          .filter((a) => !a.isDeleted)
                          .map((acc) => (
                            <button
                              key={acc.accountNumber}
                              type="button"
                              onClick={() => {
                                onSwitchAccount(acc.accountNumber);
                                setShowSwitchMenu(false);
                              }}
                              className={`w-full px-3 py-2 text-start flex items-center justify-between hover:bg-[#ecfdf5] transition-colors cursor-pointer text-black ${
                                acc.accountNumber === currentUser.accountNumber
                                  ? 'bg-[#ecfdf5] font-black text-black'
                                  : 'bg-white text-black font-bold'
                              }`}
                            >
                              <div className="truncate text-black">
                                <div className="truncate font-bold text-black">{acc.name}</div>
                                <div className="text-[10px] text-black font-mono font-semibold">
                                  #{acc.accountNumber} · {getRoleBadge(acc.accountType)}
                                </div>
                              </div>
                              {acc.subscription?.status === 'frozen' && (
                                <span className="text-[10px] text-[#991b1b] font-bold border border-[#dc2626] px-1 rounded bg-white">
                                  {isUrdu ? 'منجمد' : 'Paused'}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>

                      <div className="px-3 pt-2 mt-1 border-t border-[#d6d3d1]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSwitchMenu(false);
                            setActiveTab('edgedb');
                          }}
                          className="w-full mb-2 py-1.5 px-2.5 bg-[#eef7f1] hover:bg-[#dcfce7] text-black border border-[#047857] rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#046c31]" />
                          <span className="text-black">{isUrdu ? 'میرا ڈیوائس ڈیٹا بیس و سیکیورٹی' : 'My Device DB & Cyber-Shield'}</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-[#d6d3d1] flex items-center justify-between px-3 text-black">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSwitchMenu(false);
                            onOpenAuth('changepin');
                          }}
                          className="text-black hover:underline font-bold cursor-pointer text-xs"
                        >
                          {isUrdu ? 'پن تبدیل کریں' : 'Change PIN'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSwitchMenu(false);
                            onOpenAuth('signup');
                          }}
                          className="text-black hover:underline font-bold cursor-pointer text-xs"
                        >
                          {t('newRegistration')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSwitchMenu(false);
                            onLogout();
                          }}
                          className="text-[#991b1b] hover:underline flex items-center gap-1 cursor-pointer font-bold text-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('logOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="py-1.5 px-2.5 bg-[#045226] hover:bg-red-800 border border-emerald-400/50 text-white rounded-full text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  title={t('logOut')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('logOut')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 sm:px-4 py-1.5 text-xs font-extrabold text-white bg-[#045d2a] hover:bg-[#067837] border border-emerald-400/70 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-200" />
                  <span>{t('logIn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 sm:px-4 py-1.5 text-xs font-black rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 munafa-gold-btn"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('register')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2: Secondary Category Navigation Bar */}
      <nav
        aria-label={isUrdu ? 'زمروں کی نیویگیشن' : 'Category Navigation'}
        className="munafa-bg-subnav bg-[#05652c] border-b-2 border-[#d4af37] text-white"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-start md:justify-between min-w-max divide-x divide-emerald-400/30">
            {[
              {
                key: 'buyers',
                label: t('buyersNav'),
                icon: ShoppingCart,
                onClick: () => handleCategoryNav('buyers', 'all', ''),
                isActive: activeTab === 'marketplace' && activeSubNav === 'buyers' && selectedCategory === 'all',
              },
              {
                key: 'farmers',
                label: t('farmersNav'),
                icon: Tractor,
                onClick: () => handleCategoryNav('farmers', 'farm_mining', ''),
                isActive:
                  activeTab === 'marketplace' &&
                  activeSubNav === 'farmers' &&
                  selectedCategory === 'farm_mining',
              },
              {
                key: 'factories',
                label: t('factoriesNav'),
                icon: Factory,
                onClick: () => handleCategoryNav('factories', 'factory', ''),
                isActive: activeTab === 'marketplace' && selectedCategory === 'factory',
              },
              {
                key: 'wholesalers',
                label: t('wholesalersNav'),
                icon: Boxes,
                onClick: () => handleCategoryNav('wholesalers', 'wholesale', ''),
                isActive: activeTab === 'marketplace' && selectedCategory === 'wholesale',
              },
              {
                key: 'mining',
                label: t('miningNav'),
                icon: Pickaxe,
                onClick: () => handleCategoryNav('mining', 'farm_mining', ''),
                isActive:
                  activeTab === 'marketplace' &&
                  activeSubNav === 'mining' &&
                  selectedCategory === 'farm_mining',
              },
              {
                key: 'support',
                label: t('supportNav'),
                icon: Headphones,
                onClick: handleSupportNav,
                isActive: activeTab === 'inbox' && activeSubNav === 'support',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className={`flex-1 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                    item.isActive
                      ? 'bg-[#034720] text-[#fef08a] shadow-inner'
                      : 'text-white hover:bg-[#056830] hover:text-amber-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#fef08a] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};
