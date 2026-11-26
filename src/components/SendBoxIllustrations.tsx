import React, { useState } from 'react';
import badgeExplorerImg from '../assets/images/badge_anime_explorer_1795684024581.jpg';
import badgeRunnerImg from '../assets/images/badge_anime_runner_1795684025351.jpg';
import badgeChampionImg from '../assets/images/badge_anime_champion_1795684026536.jpg';
import badgeMasterImg from '../assets/images/badge_anime_master_1795684025652.jpg';

/**
 * Sandbox Hourglass Logo with Double-Parenthesis Ringing-Alarm Arcs (( ⌛ ))
 * Rendered in glowing golden glittery gradients with zero outer boundary.
 */
export const SandboxHourglassLogo: React.FC<{
  className?: string;
  variant?: 'light' | 'dark' | 'golden';
}> = ({ className = 'h-12 w-16', variant = 'golden' }) => {
  const uid = React.useId().replace(/:/g, '');
  const isLightHeader = variant === 'dark';

  return (
    <svg
      viewBox="0 0 88 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-[0_0_10px_rgba(251,191,36,0.65)]`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`goldArc-${uid}`} x1="0" y1="8" x2="88" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isLightHeader ? '#D97706' : '#FEF08A'} />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor={isLightHeader ? '#B45309' : '#FDE047'} />
        </linearGradient>
        <linearGradient id={`goldFrame-${uid}`} x1="33" y1="8" x2="55" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="40%" stopColor="#FACC15" />
          <stop offset="80%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`goldGlass-${uid}`} x1="36" y1="12" x2="52" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.92" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.88" />
        </linearGradient>
      </defs>

      {/* Left Double Parenthesis (Glowing Golden Ringing Alarm Arcs) */}
      <path
        d="M19 10C11.5 18 11.5 38 19 46"
        stroke={`url(#goldArc-${uid})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M27 14C21.2 20.5 21.2 35.5 27 42"
        stroke={`url(#goldArc-${uid})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Right Double Parenthesis (Glowing Golden Ringing Alarm Arcs) */}
      <path
        d="M61 14C66.8 20.5 66.8 35.5 61 42"
        stroke={`url(#goldArc-${uid})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M69 10C76.5 18 76.5 38 69 46"
        stroke={`url(#goldArc-${uid})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.82"
      />

      {/* Center Hourglass — Golden Frame */}
      <rect x="33" y="8" width="22" height="4.5" rx="2.2" fill={`url(#goldFrame-${uid})`} />
      <rect x="33" y="43.5" width="22" height="4.5" rx="2.2" fill={`url(#goldFrame-${uid})`} />

      {/* Outer Glass Bulbs */}
      <path
        d="M36 12.5H52C52 21 46.2 25.2 44 28C46.2 30.8 52 35 52 43.5H36C36 35 41.8 30.8 44 28C41.8 25.2 36 21 36 12.5Z"
        fill={`url(#goldGlass-${uid})`}
        stroke={`url(#goldFrame-${uid})`}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Top Glittering Golden Sand */}
      <path d="M38.5 15.5H49.5C49 20 45.8 23.2 44 25.4C42.2 23.2 39 20 38.5 15.5Z" fill="#F59E0B" />
      {/* Falling Golden Sand Stream */}
      <line x1="44" y1="26" x2="44" y2="36" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom Golden Sand Mound */}
      <path d="M37.8 41.8C38.6 37 41.4 34.5 44 34.5C46.6 34.5 49.4 37 50.2 41.8H37.8Z" fill="#D97706" />
      <path d="M39.5 41.8C40.5 38.6 42.4 36.8 44 36.8C45.6 36.8 47.5 38.6 48.5 41.8H39.5Z" fill="#FEF08A" />

      {/* Golden Glitter Sparkles */}
      <path d="M29 10L30.2 12.6L32.8 13.8L30.2 15L29 17.6L27.8 15L25.2 13.8L27.8 12.6L29 10Z" fill="#FEF9C3" />
      <path d="M59 38L60 40.2L62.2 41.2L60 42.2L59 44.4L58 42.2L55.8 41.2L58 40.2L59 38Z" fill="#FEF08A" />
      <circle cx="57" cy="14" r="1.4" fill="#FEF9C3" />
      <circle cx="30" cy="40" r="1.3" fill="#FDE047" />
    </svg>
  );
};

export const SendBoxCubeLogo: React.FC<{ className?: string }> = ({ className = 'h-12 w-12' }) => (
  <SandboxHourglassLogo className={className} variant="golden" />
);

export const GiftBoxIllustration: React.FC<{ className?: string }> = ({ className = 'h-14 w-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M14 40L20 20H44L50 40H14Z" fill="#FBBF24" />
    <circle cx="20" cy="18" r="3.5" fill="#F59E0B" />
    <circle cx="32" cy="14" r="4" fill="#FDE047" />
    <circle cx="44" cy="18" r="3.5" fill="#F59E0B" />
    <rect x="13" y="40" width="38" height="7" rx="3.5" fill="#D97706" />
  </svg>
);

/**
 * Hero Illustration matching Sandbox Learning Dashboard:
 * Student with glasses & purple Python hoodie coding on laptop with floating code screen, lightbulb & books
 */
export const HeroCodingIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[360px]',
}) => (
  <svg viewBox="0 0 380 230" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    {/* Soft ambient glows */}
    <circle cx="195" cy="42" r="24" fill="#FDE68A" opacity="0.45" />
    <circle cx="304" cy="64" r="30" fill="#FFFFFF" opacity="0.22" />
    <path d="M294 20L296.5 26L302.5 28.5L296.5 31L294 37L291.5 31L285.5 28.5L291.5 26L294 20Z" fill="#FDE047" />

    {/* Potted plant in left background */}
    <g transform="translate(8, 122)">
      <path d="M16 42C8 24 6 10 17 5C25 12 24 28 21 42Z" fill="#22C55E" />
      <path d="M23 42C24 22 33 10 42 15C41 27 32 34 27 42Z" fill="#4ADE80" />
      <polygon points="10,42 36,42 32,70 14,70" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
    </g>

    {/* Stacked Books on Desk Left */}
    <g transform="translate(6, 174)">
      <rect x="4" y="0" width="54" height="14" rx="4" fill="#E11D48" />
      <rect x="0" y="14" width="60" height="15" rx="4" fill="#2563EB" />
      <rect x="6" y="17" width="46" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="6" y="3" width="44" height="3" rx="1.5" fill="#FDA4AF" />
    </g>

    {/* Glowing Lightbulb above */}
    <g transform="translate(174, 18)">
      <path
        d="M21 6C13.5 6 8 11.6 8 18.8C8 23.7 10.8 27.9 14.8 30V35H27.2V30C31.2 27.9 34 23.7 34 18.8C34 11.6 28.5 6 21 6Z"
        fill="#FACC15"
      />
      <path d="M16 17C16 14 18.5 12 21 12" stroke="#FEF9C3" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="16" y="36" width="10" height="5" rx="2.5" fill="#64748B" />
    </g>

    {/* Floating Code Screen Hologram */}
    <g transform="translate(160, 72) rotate(-3)">
      <rect x="0" y="0" width="96" height="58" rx="10" fill="#1E1B4B" fillOpacity="0.88" stroke="#93C5FD" strokeWidth="1.8" />
      <circle cx="11" cy="10" r="2.5" fill="#F87171" />
      <circle cx="19" cy="10" r="2.5" fill="#FBBF24" />
      <circle cx="27" cy="10" r="2.5" fill="#34D399" />
      <rect x="10" y="20" width="48" height="4" rx="2" fill="#38BDF8" />
      <rect x="16" y="29" width="62" height="4" rx="2" fill="#C084FC" />
      <rect x="16" y="38" width="42" height="4" rx="2" fill="#34D399" />
      <rect x="10" y="47" width="32" height="4" rx="2" fill="#FBBF24" />
    </g>

    {/* Floating Python Emblem Badge */}
    <g transform="translate(274, 34)">
      <circle cx="28" cy="28" r="26" fill="#FFFFFF" fillOpacity="0.22" />
      <path
        d="M28 10C19.5 10 20.5 13.8 20.5 13.8V17.8H28V19.5H16.5C12.5 19.5 10.5 22.3 10.5 27C10.5 31.7 12.5 34.5 16.5 34.5H19.5V29.8C19.5 26 22.4 23 26.2 23H33.8C36.7 23 38.5 21.1 38.5 18.2V13.8C38.5 11 34.6 10 28 10Z"
        fill="#3B82F6"
      />
      <circle cx="24" cy="14" r="1.6" fill="#FFFFFF" />
      <path
        d="M28 45C36.5 45 35.5 41.2 35.5 41.2V37.2H28V35.5H39.5C43.5 35.5 45.5 32.7 45.5 28C45.5 23.3 43.5 20.5 39.5 20.5H36.5V25.2C36.5 29 33.6 32 29.8 32H22.2C19.3 32 17.5 33.9 17.5 36.8V41.2C17.5 44 21.4 45 28 45Z"
        fill="#FACC15"
      />
      <circle cx="32" cy="41" r="1.6" fill="#FFFFFF" />
    </g>

    {/* Student Character with Glasses & Purple Python Hoodie */}
    <g transform="translate(46, 20)">
      {/* Chair back */}
      <rect x="6" y="76" width="44" height="72" rx="14" fill="#1E293B" />
      {/* Hoodie Body */}
      <path d="M26 112C26 95 42 86 62 86C82 86 98 96 98 114L104 166H22L26 112Z" fill="#6D4AFF" />
      {/* Hoodie Strings & Python mini emblem */}
      <line x1="53" y1="95" x2="53" y2="112" stroke="#DDD6FE" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="71" y1="95" x2="71" y2="112" stroke="#DDD6FE" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="62" cy="128" r="11" fill="#4C2EE0" />
      <path d="M57 125H67V128H57V125Z" fill="#60A5FA" />
      <path d="M57 129H67V132H57V129Z" fill="#FACC15" />

      {/* Arms reaching to laptop */}
      <path d="M84 114L118 148L108 158L74 130Z" fill="#7C5CFF" />
      <circle cx="116" cy="154" r="8" fill="#FDBA74" />

      {/* Neck & Smiling Head */}
      <rect x="55" y="72" width="14" height="16" rx="6" fill="#FDBA74" />
      <ellipse cx="64" cy="54" rx="25" ry="26" fill="#FDBA74" />
      {/* Fluffy Dark Hair */}
      <path
        d="M36 52C34 32 48 16 68 18C84 19 94 31 90 48C86 38 78 34 65 34C52 34 42 40 36 52Z"
        fill="#1E1B2E"
      />
      <path d="M46 28C54 16 74 14 84 26" stroke="#1E1B2E" strokeWidth="8" strokeLinecap="round" />
      {/* Glasses */}
      <circle cx="57" cy="53" r="9.5" fill="#FFFFFF" fillOpacity="0.25" stroke="#1E1B4B" strokeWidth="2.6" />
      <circle cx="79" cy="53" r="9.5" fill="#FFFFFF" fillOpacity="0.25" stroke="#1E1B4B" strokeWidth="2.6" />
      <line x1="66.5" y1="53" x2="69.5" y2="53" stroke="#1E1B4B" strokeWidth="2.4" />
      {/* Eyes & Smile */}
      <circle cx="58" cy="53" r="2.2" fill="#1E1B4B" />
      <circle cx="79" cy="53" r="2.2" fill="#1E1B4B" />
      <path d="M61 64C64.5 68 71.5 68 75 64" stroke="#9A3412" strokeWidth="2.4" strokeLinecap="round" />
    </g>

    {/* Desk Surface */}
    <rect x="14" y="196" width="352" height="18" rx="9" fill="#B47852" />
    <rect x="14" y="196" width="352" height="6" rx="3" fill="#D2956B" />

    {/* Laptop on Desk */}
    <g transform="translate(152, 128)">
      {/* Lid */}
      <polygon points="34,0 132,0 116,62 18,62" fill="#475569" stroke="#94A3B8" strokeWidth="2" />
      {/* Python icon on laptop lid */}
      <circle cx="75" cy="31" r="11" fill="#334155" />
      <path d="M70 27H80V31H70V27Z" fill="#60A5FA" />
      <path d="M70 31H80V35H70V31Z" fill="#FACC15" />
      {/* Keyboard base */}
      <polygon points="14,62 116,62 100,72 -2,72" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
    </g>
  </svg>
);

export const AstronautBadgeIllustration: React.FC<{ className?: string }> = ({
  className = 'h-20 w-20',
}) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <ellipse cx="40" cy="74" rx="34" ry="9" fill="#FFBE55" opacity="0.85" />
    <rect x="26" y="42" width="28" height="24" rx="10" fill="#FFFFFF" />
    <rect x="31" y="48" width="18" height="10" rx="3" fill="#E3DCF5" />
    <circle cx="36" cy="53" r="2" fill="#42DCE8" />
    <circle cx="44" cy="53" r="2" fill="#FF78A8" />
    <path d="M26 48L14 34" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    <circle cx="13" cy="33" r="4" fill="#42DCE8" />
    <path d="M54 48L62 58" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    <circle cx="40" cy="27" r="17" fill="#FFFFFF" />
    <rect x="27" y="17" width="26" height="17" rx="8" fill="#17183E" />
    <circle cx="35" cy="25" r="2.2" fill="#42DCE8" />
    <circle cx="45" cy="25" r="2.2" fill="#42DCE8" />
    <path d="M37 29C38.5 31 41.5 31 43 29" stroke="#FFD45F" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SandboxAchievementBadge: React.FC<{
  kind: 'explorer' | 'runner' | 'champion' | 'master';
  unlocked: boolean;
}> = ({ kind, unlocked }) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc =
    kind === 'explorer'
      ? badgeExplorerImg
      : kind === 'runner'
        ? badgeRunnerImg
        : kind === 'champion'
          ? badgeChampionImg
          : badgeMasterImg;

  const altText =
    kind === 'explorer'
      ? 'Anime Python Explorer crest badge'
      : kind === 'runner'
        ? 'Anime Code Runner cyber badge'
        : kind === 'champion'
          ? 'Anime Quiz Champion flame dragon badge'
          : 'Anime Python Master imperial crown badge';

  if (!imgError) {
    return (
      <div
        className={`relative h-16 w-16 overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
          unlocked
            ? 'border-[#A78BFA] shadow-[0_8px_18px_rgba(91,68,235,0.28)]'
            : 'border-[#D8D1F5] opacity-55 grayscale-[55%]'
        }`}
      >
        <img
          src={imgSrc}
          alt={altText}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const opacityClass = unlocked ? 'opacity-100' : 'opacity-45 grayscale-[45%]';
  if (kind === 'explorer') {
    return (
      <svg viewBox="0 0 64 64" className={`h-16 w-16 ${opacityClass}`} fill="none" aria-hidden="true">
        <polygon points="32,4 58,22 48,54 16,54 6,22" fill="#7C5CFF" stroke="#A78BFA" strokeWidth="3" />
        <polygon points="32,14 37,25 49,26 40,34 42,46 32,40 22,46 24,34 15,26 27,25" fill="#FACC15" />
      </svg>
    );
  }
  if (kind === 'runner') {
    return (
      <svg viewBox="0 0 64 64" className={`h-16 w-16 ${opacityClass}`} fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="#3B82F6" stroke="#93C5FD" strokeWidth="3" />
        <circle cx="32" cy="32" r="19" fill="#2563EB" />
        <path d="M25 25L18 32L25 39M39 25L46 32L39 39" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'champion') {
    return (
      <svg viewBox="0 0 64 64" className={`h-16 w-16 ${opacityClass}`} fill="none" aria-hidden="true">
        <polygon points="32,4 52,14 58,34 46,54 18,54 6,34 12,14" fill="#F97316" stroke="#FDBA74" strokeWidth="3" />
        <path d="M32 15C38 22 42 29 40 37C38 43 34 47 32 47C26 47 22 41 24 33C25 27 29 22 32 15Z" fill="#FDE047" />
        <path d="M32 27C35 31 36 35 34 40C33 43 31 44 30 44C28 44 27 40 28 35C29 31 31 29 32 27Z" fill="#FB923C" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={`h-16 w-16 ${opacityClass}`} fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="#0EA5E9" stroke="#7DD3FC" strokeWidth="3" />
      <path d="M18 40L21 23L32 31L43 23L46 40H18Z" fill="#FACC15" stroke="#FEF08A" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="18" y="42" width="28" height="4" rx="2" fill="#F59E0B" />
    </svg>
  );
};

export const QuickAccessGraphic: React.FC<{
  kind: 'lists' | 'types' | 'lessons' | 'quiz' | 'game' | 'playground';
}> = ({ kind }) => {
  if (kind === 'lists') {
    return (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="8" fill="#EEF2FF" />
        <circle cx="14" cy="18" r="2.6" fill="#4F46E5" />
        <rect x="20" y="16" width="16" height="4" rx="2" fill="#4F46E5" />
        <circle cx="14" cy="25" r="2.6" fill="#6366F1" />
        <rect x="20" y="23" width="16" height="4" rx="2" fill="#6366F1" />
        <circle cx="14" cy="32" r="2.6" fill="#818CF8" />
        <rect x="20" y="30" width="16" height="4" rx="2" fill="#818CF8" />
      </svg>
    );
  }
  if (kind === 'types') {
    return (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
        <polygon points="24,8 40,16 24,24 8,16" fill="#60A5FA" />
        <polygon points="8,16 24,24 24,40 8,32" fill="#2563EB" />
        <polygon points="40,16 24,24 24,40 40,32" fill="#3B82F6" />
      </svg>
    );
  }
  if (kind === 'lessons') {
    return (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
        <rect x="8" y="13" width="32" height="23" rx="6" fill="#5B44EB" />
        <polygon points="20,19 31,24.5 20,30" fill="#FDE047" />
      </svg>
    );
  }
  if (kind === 'quiz') {
    return (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
        <rect x="7" y="6" width="30" height="36" rx="6" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.8" />
        <path
          d="M14 24.5L20 30.5L31 17.5"
          stroke="#059669"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M33 37L42 20L46 22L37 39L32 41L33 37Z" fill="#7041ED" />
      </svg>
    );
  }
  if (kind === 'game') {
    return (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
        <rect x="6" y="15" width="36" height="20" rx="10" fill="#7041ED" />
        <path d="M15 21V29M11 25H19" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="31" cy="22" r="2.2" fill="#FFD45F" />
        <circle cx="35" cy="26" r="2.2" fill="#42DCE8" />
        <circle cx="29" cy="27" r="2.2" fill="#FF85B3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M24 6C15 6 16 10 16 10V14H24V16H12C8 16 6 19 6 24C6 29 8 32 12 32H15V27C15 23 18 20 22 20H30C33 20 35 18 35 15V10C35 7 31 6 24 6Z" fill="#3B82F6" />
      <circle cx="20" cy="10.5" r="1.6" fill="#FFFFFF" />
      <path d="M24 42C33 42 32 38 32 38V34H24V32H36C40 32 42 29 42 24C42 19 40 16 36 16H33V21C33 25 30 28 26 28H18C15 28 13 30 13 33V38C13 41 17 42 24 42Z" fill="#FACC15" />
      <circle cx="28" cy="37.5" r="1.6" fill="#FFFFFF" />
    </svg>
  );
};
