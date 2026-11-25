/**
 * MUNAFA High-Contrast Notification & 1st-Second Security Shield Toast
 */

import React, { useState, useEffect } from 'react';
import { MobileNotification, UserAccount } from '../types';
import { LocalEdgeDb } from '../services/localEdgeDb';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface NotificationToastProps {
  currentUser?: UserAccount | null;
  onOpenInbox: () => void;
}

export const MobileNotificationToast: React.FC<NotificationToastProps> = ({ currentUser, onOpenInbox }) => {
  const { isUrdu } = useLanguage();
  const [notification, setNotification] = useState<MobileNotification | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = LocalEdgeDb.onMobilePush((notif) => {
      if (notif.type !== 'security') {
        if (!currentUser) return;
        const isRecipient =
          notif.accountNumber === currentUser.accountNumber ||
          (currentUser.accountType === 'admin' && notif.accountNumber === 'admin');
        if (!isRecipient) return;
      }
      setNotification(notif);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setNotification(null);
      }, 6500);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [currentUser?.accountNumber, currentUser?.accountType]);

  if (!notification) return null;

  const isSecurity = notification.type === 'security';

  return (
    <div
      className="fixed top-3 end-3 z-50 max-w-sm w-[calc(100vw-1.5rem)] animate-in slide-in-from-top-4 fade-in duration-300"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      <div
        className={`rounded-2xl p-3.5 shadow-2xl border-2 flex items-start gap-3 ${
          isSecurity
            ? 'bg-[#7f1d1d] border-[#facc15] text-white'
            : 'bg-[#023819] border-[#facc15] text-white'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
            isSecurity
              ? 'bg-red-950 border-red-300 text-[#fef08a]'
              : 'bg-[#046c31] border-[#facc15]/70 text-[#fef08a]'
          }`}
        >
          {isSecurity ? <ShieldAlert className="w-5 h-5" /> : <MessageSquare className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] text-[#fef08a] mb-0.5 font-mono font-extrabold">
            <span>
              {isSecurity
                ? isUrdu
                  ? '1 سیکنڈ سائبر شیلڈ الرٹ'
                  : '1ST-SECOND FIREWALL SHIELD'
                : isUrdu
                ? 'منافع سسٹم الرٹ'
                : 'MUNAFA LIVE ALERT'}
            </span>
            <span>{notification.timestamp}</span>
          </div>

          <h4 className="text-xs font-black text-white truncate">{notification.title}</h4>
          <p className="text-xs text-emerald-50 line-clamp-2 mt-0.5 leading-snug font-semibold">
            {notification.body}
          </p>

          {!isSecurity && (
            <button
              type="button"
              onClick={() => {
                setNotification(null);
                onOpenInbox();
              }}
              className="mt-2 text-[11px] text-[#fef08a] hover:text-white font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>{isUrdu ? 'ان باکس کھولیں' : 'Open in Shared Inbox'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setNotification(null)}
          aria-label="Close Alert"
          className="text-emerald-100 hover:text-white p-1 cursor-pointer shrink-0 rounded-lg hover:bg-black/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
