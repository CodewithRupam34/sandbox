import React from 'react';

export type SwirlFirePreset =
  | 'crimson-gold'
  | 'crimson-red'
  | 'violet'
  | 'blue-cyan'
  | 'emerald-cyan'
  | 'indigo-gold'
  | 'rose-amber'
  | 'magenta-pink'
  | 'lime-teal'
  | 'sapphire-gold';

const PRESET_FILTERS: Record<SwirlFirePreset, string> = {
  'crimson-gold': 'hue-rotate(0deg) saturate(1.45)',
  'crimson-red': 'hue-rotate(344deg) saturate(1.9) brightness(0.96) contrast(1.15)',
  violet: 'hue-rotate(255deg) saturate(1.55)',
  'blue-cyan': 'hue-rotate(155deg) saturate(1.65)',
  'emerald-cyan': 'hue-rotate(135deg) saturate(1.6)',
  'indigo-gold': 'hue-rotate(210deg) saturate(1.5)',
  'rose-amber': 'hue-rotate(320deg) saturate(1.5)',
  'magenta-pink': 'hue-rotate(285deg) saturate(1.65)',
  'lime-teal': 'hue-rotate(92deg) saturate(1.6)',
  'sapphire-gold': 'hue-rotate(188deg) saturate(1.55)',
};

interface SwirlFireBackdropProps {
  preset?: SwirlFirePreset;
  opacityClass?: string;
  className?: string;
}

export const SwirlFireBackdrop: React.FC<SwirlFireBackdropProps> = ({
  preset = 'crimson-gold',
  opacityClass = 'opacity-[0.36]',
  className = '',
}) => (
  <img
    src="/assets/aistudio/WhatsApp_Image_2026-11-26_at_2.56.49_PM_0a65ad7e.jpeg"
    alt=""
    aria-hidden="true"
    referrerPolicy="no-referrer"
    className={`pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen ${opacityClass} ${className}`}
    style={{ filter: PRESET_FILTERS[preset] }}
  />
);
