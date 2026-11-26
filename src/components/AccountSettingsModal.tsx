import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Globe, LogIn, Trash2, Volume2, X } from 'lucide-react';
import { AuthUser, InterfaceLanguage } from '../types/learning';
import { LANGUAGE_OPTIONS, t } from '../utils/i18n';
import { resizeProfileImage } from '../utils/imageResize';

interface AccountSettingsModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  currentLanguage: InterfaceLanguage;
  onClose: () => void;
  onUpdateLanguage: (lang: InterfaceLanguage) => Promise<void>;
  onUpdateAvatar: (avatarUrl: string | null) => Promise<void>;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  user,
  currentLanguage,
  onClose,
  onUpdateLanguage,
  onUpdateAvatar,
  onOpenAuth,
  onLogout,
}) => {
  const [selectedLang, setSelectedLang] = useState<InterfaceLanguage>(currentLanguage);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedLang(currentLanguage);
    setSavedNotice(null);
    setPhotoError(null);
  }, [currentLanguage, isOpen]);

  if (!isOpen) return null;

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    await onUpdateLanguage(selectedLang);
    setSaving(false);
    setSavedNotice(
      user ? 'Language preference saved to your account.' : 'Language updated for this session.'
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setSavedNotice(null);
    setSavingPhoto(true);
    try {
      const resized = await resizeProfileImage(file);
      await onUpdateAvatar(resized);
      setSavedNotice('Profile photo updated.');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to upload profile photo.');
    } finally {
      setSavingPhoto(false);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = async () => {
    setPhotoError(null);
    setSavedNotice(null);
    setSavingPhoto(true);
    await onUpdateAvatar(null);
    setSavingPhoto(false);
    setSavedNotice('Profile photo removed.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17183e]/55 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
    >
      <div className="w-full max-w-md rounded-[25px] border border-[#e3dcf5] bg-white p-6 sm:p-7 shadow-[0_24px_60px_rgba(23,24,62,0.28)] space-y-5 my-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="account-settings-title" className="text-xl font-black text-[#191944]">
              {t(currentLanguage, 'settingsAccount')}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#5e5878]">
              Customize your profile photo, interface language, and voice narration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings modal"
            className="rounded-xl p-1.5 text-[#5e5878] hover:bg-[#f4efff] hover:text-[#191944]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account Status + Profile Photo Change */}
        {user ? (
          <div className="rounded-2xl border border-[#e0d5ff] bg-[#f4efff] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.name} avatar`}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-[#7041ed]"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7041ed] text-base font-black text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#191944]">{user.name}</p>
                  <p className="truncate text-xs font-medium text-[#5e5878]">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="rounded-full border border-rose-300 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-50 shrink-0"
              >
                {t(currentLanguage, 'signOut')}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={savingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6c9ff] bg-white px-3 py-1.5 text-xs font-bold text-[#7041ed] hover:bg-[#faf8ff] disabled:opacity-60 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {savingPhoto
                    ? 'Updating...'
                    : user.avatarUrl
                      ? 'Change Profile Photo'
                      : 'Add Profile Photo'}
                </span>
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  disabled={savingPhoto}
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {photoError && (
              <p className="text-xs font-semibold text-rose-700">{photoError}</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e9ddff] bg-[#fff0d4] p-4 space-y-3">
            <p className="text-xs font-bold text-[#5e3d00]">
              {t(currentLanguage, 'guestNotice')}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#352078] px-4 py-2 text-xs font-black text-white hover:bg-[#542bd5]"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        )}

        {/* Voice Profile Info */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#e3dcf5] bg-[#faf8ff] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8dcff] text-[#7041ed]">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-[#191944]">Gemini Pegasus Voice · Indian Accent</p>
            <p className="text-[#5e5878]">
              Active for Voice Video Lessons and MARK tutor message playback.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <form onSubmit={handleSaveLanguage} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="account-preferred-language"
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#191944]"
            >
              <Globe className="h-3.5 w-3.5 text-[#7041ed]" aria-hidden="true" />
              <span>{t(currentLanguage, 'preferredLanguage')}</span>
            </label>
            <select
              id="account-preferred-language"
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value as InterfaceLanguage);
                setSavedNotice(null);
              }}
              className="w-full rounded-xl border border-[#e0d5ff] bg-[#faf8ff] px-3.5 py-2.5 text-sm font-semibold text-[#191944] focus:border-[#7041ed] focus:outline-none"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
            <p className="text-[11px] font-medium text-[#696580]">
              {user
                ? 'Saved to your account across lessons, dashboard, and MARK responses.'
                : 'Previewing for this session only. Sign in to save your language choice.'}
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 rounded-xl bg-[#d8f8ef] px-3.5 py-2 text-xs font-bold text-[#0e5744]">
              <Check className="h-5 w-5 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#7041ed] px-5 py-2.5 text-xs font-black text-white hover:bg-[#542bd5] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : user ? 'Save Language Preference' : 'Apply for Session'}
          </button>
        </form>
      </div>
    </div>
  );
};
