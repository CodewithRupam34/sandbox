import React, { useState } from 'react';
import { ArrowLeft, Bell, ChevronDown, Globe, Menu, Search, User } from 'lucide-react';
import { AppNotification, AuthUser, InterfaceLanguage } from '../types/learning';
import { t } from '../utils/i18n';
import { SandboxHourglassLogo } from './SendBoxIllustrations';

interface DashboardHeaderProps {
  user: AuthUser | null;
  language: InterfaceLanguage;
  notifications: AppNotification[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  onOpenMobileSidebar: () => void;
  onMarkAllRead: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  language,
  notifications,
  searchQuery,
  onSearchChange,
  canGoBack,
  onGoBack,
  onOpenMobileSidebar,
  onMarkAllRead,
  onOpenSettings,
  onOpenAuth,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#FAF8FF]/95 px-4 py-3.5 backdrop-blur-md sm:px-7 border-b border-[#EFEAFF]">
      {/* Left: Mobile Menu + Optional Back Button + ((⌛)) Sandbox Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="rounded-full border border-[#E3DCFF] bg-white p-2 text-[#191944] hover:border-[#6248F5] lg:hidden shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>

        {canGoBack && (
          <button
            type="button"
            onClick={onGoBack}
            aria-label={t(language, 'backPreviousPage')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E3DCFF] bg-white px-3 py-1.5 text-xs font-extrabold text-[#4E38E2] hover:border-[#6248F5] hover:bg-[#F3EFFF] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(language, 'back')}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <SandboxHourglassLogo className="h-8 w-12" variant="dark" />
          <span className="text-[22px] font-extrabold tracking-tight text-[#1E1B4B]">
            Sandbox
          </span>
        </div>
      </div>

      {/* Center: Rounded Search Input */}
      <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 sm:max-w-[380px]">
        <div className="flex items-center gap-2.5 rounded-full border border-[#E6E0FF] bg-white px-4 py-2 shadow-2xs focus-within:border-[#6248F5] transition-colors">
          <Search className="h-4 w-4 shrink-0 text-[#7E76A8]" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
            aria-label={t(language, 'searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#191944] placeholder:text-[#8E86B0] focus:outline-none sm:text-sm"
          />
        </div>
      </div>

      {/* Right: Notification Bell with count + Language Globe + Avatar Profile Pill */}
      <div className="relative order-2 sm:order-3 flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            setNotifOpen((prev) => !prev);
            if (!notifOpen && unreadCount > 0) {
              onMarkAllRead();
            }
          }}
          aria-label="Notifications"
          className="relative rounded-full bg-white p-2.5 text-[#5B44EB] border border-[#EAE4FF] shadow-2xs hover:bg-[#F3EFFF] transition-colors"
        >
          <Bell className="h-4 w-4 fill-current" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#EF4444] px-1 text-[10px] font-extrabold text-white ring-2 ring-white tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title={t(language, 'preferredLanguage')}
          aria-label={t(language, 'preferredLanguage')}
          className="rounded-full bg-white p-2.5 text-[#5B44EB] border border-[#EAE4FF] shadow-2xs hover:bg-[#F3EFFF] transition-colors"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={user ? onOpenSettings : onOpenAuth}
          aria-label={user ? user.name : t(language, 'signIn')}
          className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 border border-[#EAE4FF] shadow-2xs hover:border-[#6248F5] transition-colors"
        >
          <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#4E38E2] text-xs font-extrabold text-white">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : user ? (
              user.name.slice(0, 1).toUpperCase()
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          {user && (
            <span className="hidden md:inline text-xs font-bold text-[#191944] whitespace-nowrap">
              {user.name}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-[#6D6691]" aria-hidden="true" />
        </button>

        {/* Notification Popover */}
        {notifOpen && (
          <div className="absolute right-0 top-12 z-30 w-80 rounded-[20px] border border-[#E3DCF5] bg-white p-4 shadow-[0_14px_35px_rgba(25,25,68,0.14)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#191944]">Activity &amp; Points</h3>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="text-[11px] font-bold text-[#5B44EB] hover:underline"
              >
                Close
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-[#696580]">
                Sign in to save points across lessons, quizzes, and collaboration.
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-[#E3DCF5] bg-[#FAF8FF] px-3 py-2 text-xs"
                  >
                    <p className="font-extrabold text-[#5B44EB]">{n.title}</p>
                    <p className="mt-0.5 text-[#5E5878]">{n.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
