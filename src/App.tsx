/**
 * MUNAFA — Made in Pakistan Marketplace
 * Main Application Controller
 * Coordinates Main Registry Auth with Per-User Device Database Nodes.
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { UserAccount, ProductCategory } from './types';
import { LocalEdgeDb } from './services/localEdgeDb';
import { useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Marketplace } from './components/Marketplace';
import { AuthModal } from './components/AuthModal';
import { MobileNotificationToast } from './components/MobileNotificationToast';
import { Footer } from './components/Footer';
import { AndroidBottomNav } from './components/AndroidBottomNav';

const Inbox = lazy(() => import('./components/Inbox').then((m) => ({ default: m.Inbox })));
const OrdersView = lazy(() => import('./components/OrdersView').then((m) => ({ default: m.OrdersView })));
const SellerDashboard = lazy(() =>
  import('./components/SellerDashboard').then((m) => ({ default: m.SellerDashboard }))
);
const AdminPanel = lazy(() => import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const AuthPortal = lazy(() => import('./components/AuthPortal').then((m) => ({ default: m.AuthPortal })));
const TermsModal = lazy(() => import('./components/TermsModal').then((m) => ({ default: m.TermsModal })));
const EdgeDbView = lazy(() => import('./components/EdgeDbView').then((m) => ({ default: m.EdgeDbView })));

const RouteLoadingFallback = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
    <div className="px-5 py-3 rounded-2xl bg-white border-2 border-[#046c31] text-[#023819] text-xs font-extrabold shadow-xs">
      Loading MUNAFA...
    </div>
  </div>
);

export default function App() {
  const { isUrdu } = useLanguage();
  const [accounts, setAccounts] = useState<UserAccount[]>(() => LocalEdgeDb.getAccounts());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    LocalEdgeDb.restoreActiveSessionAccount()
  );
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'changepin'>('login');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [targetInboxThreadId, setTargetInboxThreadId] = useState<string | null>(null);

  // Commodity search and filter state synchronized across views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(1000000);

  // Sync state when local Edge DB updates
  useEffect(() => {
    const unsub = LocalEdgeDb.subscribe(() => {
      const all = LocalEdgeDb.getAccounts();
      setAccounts(all);
      if (currentUser) {
        const fresh = all.find((a) => a.accountNumber === currentUser.accountNumber);
        if (!fresh || fresh.isDeleted) {
          LocalEdgeDb.unmountUserDeviceNode();
          setCurrentUser(null);
          setActiveTab('marketplace');
        } else {
          setCurrentUser(fresh);
        }
      } else {
        const restored = LocalEdgeDb.restoreActiveSessionAccount();
        if (restored) {
          setCurrentUser(restored);
        }
      }
    });
    return unsub;
  }, [currentUser?.accountNumber]);

  const unreadCount = currentUser
    ? LocalEdgeDb.getMessagesForAccount(currentUser.accountNumber).filter(
        (m) =>
          !m.isRead &&
          (m.recipientAccountNumber === currentUser.accountNumber ||
            (currentUser.accountType === 'admin' && m.recipientAccountNumber === 'admin'))
      ).length
    : 0;

  const handleOpenAuth = (mode: 'login' | 'signup' | 'changepin') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (account: UserAccount) => {
    LocalEdgeDb.mountUserDeviceNode(account.accountNumber);
    setTargetInboxThreadId(null);
    setCurrentUser(account);
    setActiveTab('marketplace');
  };

  const handleLogout = () => {
    LocalEdgeDb.unmountUserDeviceNode();
    setTargetInboxThreadId(null);
    setCurrentUser(null);
    setActiveTab('marketplace');
  };

  const handleSwitchAccount = (accountNumber: string) => {
    const target = LocalEdgeDb.getAccountByNumber(accountNumber);
    if (target) {
      LocalEdgeDb.mountUserDeviceNode(target.accountNumber);
      setTargetInboxThreadId(null);
      setCurrentUser(target);
    }
  };

  // Open Chat directly with Seller from Marketplace (also handles same-account safely)
  const handleOpenChatWithSeller = (sellerAccountNumber: string, initialText?: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }

    const threadId = `th_${[currentUser.accountNumber, sellerAccountNumber].sort().join('_')}`;
    if (initialText && currentUser.accountNumber !== sellerAccountNumber) {
      LocalEdgeDb.sendMessage({
        threadId,
        senderAccountNumber: currentUser.accountNumber,
        senderName: currentUser.name,
        recipientAccountNumber: sellerAccountNumber,
        type: 'text',
        content: initialText,
      });
    }

    setTargetInboxThreadId(currentUser.accountNumber === sellerAccountNumber ? 'th_system_' + currentUser.accountNumber : threadId);
    setActiveTab('inbox');
  };

  const handleOrderPlaced = (_orderId: string) => {
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-[#edf6f0] flex flex-col text-[#052e16] selection:bg-emerald-700 selection:text-white">
      {/* Live Notification & 1st-Second Security Shield Banner */}
      <MobileNotificationToast currentUser={currentUser} onOpenInbox={() => setActiveTab('inbox')} />

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        unreadCount={unreadCount}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        accounts={accounts}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setSearchQuery={setSearchQuery}
        onOpenTermsModal={() => setTermsModalOpen(true)}
      />

      {/* Main Content Area — Android Safe Bottom Clearance */}
      <main className="flex-1 pb-20 md:pb-8">
        {activeTab === 'marketplace' && (
          <Marketplace
            currentUser={currentUser}
            onOpenChatWithSeller={handleOpenChatWithSeller}
            onOrderPlaced={handleOrderPlaced}
            onOpenAuth={handleOpenAuth}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />
        )}

        <Suspense fallback={<RouteLoadingFallback />}>
          {activeTab === 'inbox' && (
            currentUser ? (
              <Inbox
                currentUser={currentUser}
                initialThreadId={targetInboxThreadId}
                onLogout={handleLogout}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 sm:my-16 text-center bg-white p-8 rounded-2xl border-2 border-[#046c31]/40 shadow-sm" dir={isUrdu ? 'rtl' : 'ltr'}>
                <div className="w-40 h-20 mx-auto mb-4 rounded-xl bg-white border-2 border-[#d4af37] px-2 py-1 flex items-center justify-center shadow-sm">
                  <img
                    src="/assets/aistudio/image_65c6c502.png"
                    alt="MUNAFA"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-base text-[#023819] mb-2">
                  {isUrdu ? 'مشترکہ ان باکس کے لیے لاگ اِن درکار ہے' : 'Login Required for Shared Inbox'}
                </h3>
                <p className="text-xs text-stone-700 font-bold mb-5 leading-relaxed">
                  {isUrdu
                    ? 'محفوظ چیٹ، آڈیو/ویڈیو کالز، اور پی ڈی ایف رسیدوں تک رسائی کے لیے اپنا 8 ہندسوں کا اکاؤنٹ نمبر اور 4 ہندسوں کا پن درج کریں۔'
                    : 'Please enter your 8-digit Account Number and 4-digit PIN to fetch your encrypted chat records, audio/video dialer, and PDF invoices onto your device.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="py-2.5 px-6 munafa-green-btn font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {isUrdu ? 'اکاؤنٹ نمبر سے لاگ اِن کریں' : 'Log In with Account Number'}
                </button>
              </div>
            )
          )}

          {activeTab === 'orders' && (
            currentUser ? (
              <OrdersView
                currentUser={currentUser}
                onOpenChatWithCounterparty={(accountNumber) => handleOpenChatWithSeller(accountNumber)}
                onLogout={handleLogout}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 sm:my-16 text-center bg-white p-8 rounded-2xl border-2 border-[#046c31]/40 shadow-sm" dir={isUrdu ? 'rtl' : 'ltr'}>
                <div className="w-40 h-20 mx-auto mb-4 rounded-xl bg-white border-2 border-[#d4af37] px-2 py-1 flex items-center justify-center shadow-sm">
                  <img
                    src="/assets/aistudio/image_65c6c502.png"
                    alt="MUNAFA"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-base text-[#023819] mb-2">
                  {isUrdu ? 'آرڈرز اور انوائس کے لیے لاگ اِن درکار ہے' : 'Login Required for Orders & Invoices'}
                </h3>
                <p className="text-xs text-stone-700 font-bold mb-5 leading-relaxed">
                  {isUrdu
                    ? 'اپنے آرڈرز کی ٹریکنگ اور ٹیکس رسیدیں دیکھنے کے لیے اپنے منافع اکاؤنٹ میں لاگ اِن کریں۔'
                    : 'Log in with your Munafa 8-digit account to view your dispatched orders, GST invoices, and courier tracking.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="py-2.5 px-6 munafa-green-btn font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {isUrdu ? 'لاگ اِن کریں' : 'Log In'}
                </button>
              </div>
            )
          )}

          {activeTab === 'seller' && (
            currentUser ? (
              <SellerDashboard
                currentUser={currentUser}
                onOpenInbox={() => setActiveTab('inbox')}
                onLogout={handleLogout}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 sm:my-16 text-center bg-white p-8 rounded-2xl border-2 border-[#046c31]/40 shadow-sm" dir={isUrdu ? 'rtl' : 'ltr'}>
                <div className="w-40 h-20 mx-auto mb-4 rounded-xl bg-white border-2 border-[#d4af37] px-2 py-1 flex items-center justify-center shadow-sm">
                  <img
                    src="/assets/aistudio/image_65c6c502.png"
                    alt="MUNAFA"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-base text-[#023819] mb-2">
                  {isUrdu ? 'سیلر ڈیسک تک رسائی' : 'Seller Desk Access'}
                </h3>
                <p className="text-xs text-stone-700 font-bold mb-5 leading-relaxed">
                  {isUrdu
                    ? 'مصنوعات اور سبسکرپشن منیج کرنے کے لیے اپنے کسان، کان کنی، فیکٹری یا ہول سیلر اکاؤنٹ سے لاگ اِن کریں۔'
                    : 'Log in with your Farmer/Mining, Factory, or Wholesaler account to manage commodities and subscriptions.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="py-2.5 px-6 munafa-green-btn font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {isUrdu ? 'لاگ اِن کریں' : 'Log In'}
                </button>
              </div>
            )
          )}

          {activeTab === 'edgedb' && (
            <EdgeDbView currentUser={currentUser} />
          )}

          {activeTab === 'admin' && (
            <AdminPanel
              onOpenChatWithAccount={(accountNumber) => {
                setTargetInboxThreadId(`th_${[currentUser?.accountNumber || 'admin', accountNumber].sort().join('_')}`);
                setActiveTab('inbox');
              }}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'portal' && (
            <AuthPortal
              onLoginSuccess={handleLoginSuccess}
              accounts={accounts}
            />
          )}
        </Suspense>
      </main>

      {/* Official Footer with Heritage CTA Banner, Legal Terms & Navigation */}
      <Footer
        onOpenTermsModal={() => setTermsModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Unified Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Terms & Conditions Modal */}
      {termsModalOpen && (
        <Suspense fallback={null}>
          <TermsModal
            isOpen={termsModalOpen}
            onClose={() => setTermsModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Android Native Bottom Navigation Bar (Mobile View) */}
      <AndroidBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />
    </div>
  );
}
