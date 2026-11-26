import React from 'react';

interface MarkBrainLogoProps {
  className?: string;
}

/**
 * Custom Brain-with-Sunglasses logo for MARK AI Study Buddy.
 */
export const MarkBrainLogo: React.FC<MarkBrainLogoProps> = ({ className = 'h-8 w-8' }) => (
  <svg
    viewBox="7 9 50 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Brain Left & Right Hemispheres */}
    <path
      d="M31 12C24.5 12 19.5 15.6 17.6 20.6C13.8 21.4 11 24.8 11 29C11 31.6 12.1 33.9 13.9 35.4C13.3 36.8 13 38.3 13 39.9C13 45.5 17.5 50 23.1 50H29.5C30.3 50 31 49.3 31 48.5V12Z"
      fill="#FF85B3"
    />
    <path
      d="M33 12C39.5 12 44.5 15.6 46.4 20.6C50.2 21.4 53 24.8 53 29C53 31.6 51.9 33.9 50.1 35.4C50.7 36.8 51 38.3 51 39.9C51 45.5 46.5 50 40.9 50H34.5C33.7 50 33 49.3 33 48.5V12Z"
      fill="#FFA6C9"
    />
    {/* Brain Folds */}
    <path
      d="M22 19C24.5 19 26.5 21 26.5 23.5M18 27C20.5 27 22.5 28.8 22.5 31M20 42C22.5 42 24.5 40.4 25.2 38.4"
      stroke="#C83D78"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M42 19C39.5 19 37.5 21 37.5 23.5M46 27C43.5 27 41.5 28.8 41.5 31M44 42C41.5 42 39.5 40.4 38.8 38.4"
      stroke="#D94E88"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* Center Divider */}
    <line x1="32" y1="12" x2="32" y2="50" stroke="#A62B5E" strokeWidth="2.2" strokeLinecap="round" />

    {/* Cool Dark Sunglasses */}
    <rect x="11" y="25" width="19" height="12.5" rx="4.5" fill="#17183E" stroke="#42DCE8" strokeWidth="1.8" />
    <rect x="34" y="25" width="19" height="12.5" rx="4.5" fill="#17183E" stroke="#42DCE8" strokeWidth="1.8" />
    {/* Sunglasses Bridge & Arms */}
    <path d="M29.5 29.5H34.5" stroke="#42DCE8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M8.5 28.5L11.5 29.5M55.5 28.5L52.5 29.5" stroke="#42DCE8" strokeWidth="2.2" strokeLinecap="round" />
    {/* Glossy Glint on Sunglasses Lenses */}
    <path d="M15.5 28.5L18.5 34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    <path d="M38.5 28.5L41.5 34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    {/* Confident Smile */}
    <path
      d="M27.5 42.5C29.5 44.5 34.5 44.5 36.5 42.5"
      stroke="#5A1032"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
  </svg>
);
