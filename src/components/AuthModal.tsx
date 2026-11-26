import React, { useRef, useState } from 'react';
import { Camera, Globe, LogIn, Trash2, UserPlus, X } from 'lucide-react';
import { AuthUser, InterfaceLanguage } from '../types/learning';
import { LANGUAGE_OPTIONS, t } from '../utils/i18n';
import { resizeProfileImage } from '../utils/imageResize';

interface AuthModalProps {
  isOpen: boolean;
  currentLanguage: InterfaceLanguage;
  onClose: () => void;
  onAuthSuccess: (token: string, user: AuthUser, isNewAccount: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentLanguage,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [preferredLanguage, setPreferredLanguage] = useState<InterfaceLanguage>(currentLanguage);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const resized = await resizeProfileImage(file);
      setAvatarUrl(resized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image.');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        mode === 'register'
          ? {
              name: name.trim(),
              email: email.trim(),
              password,
              preferredLanguage,
              ...(avatarUrl ? { avatarUrl } : {}),
            }
          : {
              email: email.trim(),
              password,
              ...(avatarUrl ? { avatarUrl } : {}),
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        token?: string;
        user?: AuthUser;
        error?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        setError(data.error ?? 'Authentication failed. Please check your details.');
        setLoading(false);
        return;
      }

      onAuthSuccess(data.token, data.user, mode === 'register');
      setName('');
      setEmail('');
      setPassword('');
      setAvatarUrl(undefined);
      onClose();
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (name.trim() || email.trim() || 'S').slice(0, 1).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17183e]/55 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-[25px] border border-[#e3dcf5] bg-white p-6 sm:p-7 shadow-[0_24px_60px_rgba(23,24,62,0.28)] space-y-5 my-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-black text-[#191944]">
              {mode === 'register' ? 'Create Your Sandbox Account' : 'Sign In to Sandbox'}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#5e5878]">
              {mode === 'register'
                ? 'Progress, XP points, and preferred language are saved only when signed in (+50 welcome pts).'
                : 'Sign in to load your saved progress, points, and language preference.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-[#5e5878] hover:bg-[#f4efff] hover:text-[#191944]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#f4efff] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-xl py-2 text-xs font-extrabold transition-colors ${
              mode === 'register'
                ? 'bg-[#7041ed] text-white shadow-xs'
                : 'text-[#5e5878] hover:text-[#191944]'
            }`}
          >
            {t(currentLanguage, 'createAccount')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-xl py-2 text-xs font-extrabold transition-colors ${
              mode === 'login'
                ? 'bg-[#7041ed] text-white shadow-xs'
                : 'text-[#5e5878] hover:text-[#191944]'
            }`}
          >
            {t(currentLanguage, 'signIn')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo Picker (available on both Create Account & Sign In) */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e3dcf5] bg-[#faf8ff] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Selected profile preview"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-[#7041ed]"
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#4E38E2] text-sm font-black text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#191944]">
                  {mode === 'register' ? 'Profile Photo (Optional)' : 'Update Profile Photo (Optional)'}
                </p>
                <p className="text-[11px] font-medium text-[#696580]">
                  Upload or change your avatar photo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-xl border border-[#d6c9ff] bg-white px-3 py-1.5 text-xs font-bold text-[#7041ed] hover:bg-[#f4efff] transition-colors"
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{avatarUrl ? 'Change' : 'Upload'}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(undefined)}
                  aria-label="Remove selected photo"
                  className="rounded-xl border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="block text-xs font-extrabold text-[#191944]">
                Display Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full rounded-xl border border-[#e0d5ff] bg-[#faf8ff] px-3.5 py-2.5 text-sm font-semibold text-[#191944] placeholder:text-[#9693b7] focus:border-[#7041ed] focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xs font-extrabold text-[#191944]">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="w-full rounded-xl border border-[#e0d5ff] bg-[#faf8ff] px-3.5 py-2.5 text-sm font-semibold text-[#191944] placeholder:text-[#9693b7] focus:border-[#7041ed] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block text-xs font-extrabold text-[#191944]">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-[#e0d5ff] bg-[#faf8ff] px-3.5 py-2.5 text-sm font-semibold text-[#191944] placeholder:text-[#9693b7] focus:border-[#7041ed] focus:outline-none"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-language"
                className="flex items-center gap-1.5 text-xs font-extrabold text-[#191944]"
              >
                <Globe className="h-3.5 w-3.5 text-[#7041ed]" aria-hidden="true" />
                <span>{t(currentLanguage, 'preferredLanguage')}</span>
              </label>
              <select
                id="auth-language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as InterfaceLanguage)}
                className="w-full rounded-xl border border-[#e0d5ff] bg-[#faf8ff] px-3.5 py-2.5 text-sm font-semibold text-[#191944] focus:border-[#7041ed] focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.nativeLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#352078] px-5 py-3 text-xs font-black text-white hover:bg-[#542bd5] disabled:opacity-60 transition-colors"
          >
            {mode === 'register' ? (
              <>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>{loading ? 'Creating Account...' : 'Create Account & Claim +50 pts'}</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
