/**
 * MUNAFA Android Native Mobile Bottom Navigation Dock
 * Matching Emerald Green & Gold mobile app experience
 */

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UserAccount } from '../types';
import {
  ShoppingBag,
  MessageSquare,
  Package,
  Building2,
  Shield,
  LogIn,
  HelpCircle,
} from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  currentUser: UserAccount | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 0,
  currentUser,
  onOpenAuth,
}) => {
  const { isUrdu } = useLanguage();

  const isSeller =
    currentUser &&
    (currentUser.accountType === 'farmer_mining' ||
      currentUser.accountType === 'factory' ||
      currentUser.accountType === 'wholesaler');
  const isAdmin = currentUser && currentUser.accountType === 'admin';

  return (
    <nav
      aria-label={isUrdu ? 'موبائل نیویگیشن' : 'Mobile Navigation'}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#033d1c] text-white border-t-2 border-[#d4af37] px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.2)] flex items-center justify-around select-none"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {/* 1. Marketplace */}
      <button
        type="button"
        onClick={() => setActiveTab('marketplace')}
        className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'marketplace' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
        }`}
      >
        <div
          className={`p-1 rounded-full transition-colors ${
            activeTab === 'marketplace' ? 'bg-[#076e34] border border-[#facc15]' : ''
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
          {isUrdu ? 'مارکیٹ' : 'Market'}
        </span>
      </button>

      {/* 2. Shared Inbox with Unread Badge */}
      <button
        type="button"
        onClick={() => setActiveTab('inbox')}
        className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'inbox' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
        }`}
      >
        <div
          className={`p-1 rounded-full relative transition-colors ${
            activeTab === 'inbox' ? 'bg-[#076e34] border border-[#facc15]' : ''
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
          {isUrdu ? 'اِن باکس' : 'Inbox'}
        </span>
      </button>

      {/* 3. Orders & Invoices */}
      <button
        type="button"
        onClick={() => setActiveTab('orders')}
        className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'orders' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
        }`}
      >
        <div
          className={`p-1 rounded-full transition-colors ${
            activeTab === 'orders' ? 'bg-[#076e34] border border-[#facc15]' : ''
          }`}
        >
          <Package className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
          {isUrdu ? 'آرڈرز' : 'Orders'}
        </span>
      </button>

      {/* 4. Role Desk (Seller Desk / Admin / Account Portal) */}
      {isAdmin ? (
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'admin' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
          }`}
        >
          <div
            className={`p-1 rounded-full transition-colors ${
              activeTab === 'admin' ? 'bg-[#076e34] border border-[#facc15]' : ''
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
            {isUrdu ? 'ایڈمن' : 'Admin'}
          </span>
        </button>
      ) : isSeller ? (
        <button
          type="button"
          onClick={() => setActiveTab('seller')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'seller' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
          }`}
        >
          <div
            className={`p-1 rounded-full transition-colors ${
              activeTab === 'seller' ? 'bg-[#076e34] border border-[#facc15]' : ''
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
            {isUrdu ? 'سیلر ڈیسک' : 'Seller Desk'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'portal' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
          }`}
        >
          <div
            className={`p-1 rounded-full transition-colors ${
              activeTab === 'portal' ? 'bg-[#076e34] border border-[#facc15]' : ''
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
            {isUrdu ? 'رہنمائی' : 'Portal'}
          </span>
        </button>
      )}

      {/* 5. Profile / Login */}
      {currentUser ? (
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'portal' ? 'text-[#fef08a] font-black' : 'text-emerald-100 font-semibold'
          }`}
        >
          <div
            className={`p-0.5 rounded-full transition-colors ${
              activeTab === 'portal' ? 'ring-2 ring-[#facc15]' : ''
            }`}
          >
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-[#facc15]"
            />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight truncate max-w-[52px]">
            {isUrdu ? 'اکاؤنٹ' : 'Profile'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onOpenAuth('login')}
          className="flex-1 py-1 px-1 flex flex-col items-center justify-center text-emerald-100 hover:text-[#fef08a] font-bold cursor-pointer"
        >
          <div className="p-1 rounded-full bg-[#055829] border border-[#facc15]/70">
            <LogIn className="w-5 h-5 text-[#fef08a]" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap">
            {isUrdu ? 'لاگ اِن' : 'Login'}
          </span>
        </button>
      )}
    </nav>
  );
};
