/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'text-only' | 'light';
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'full', 
  height = '100%' 
}) => {
  // Deep corporate blue from the Ethiopian Reinsurance logo
  const brandBlue = '#16689d';
  // Vivid gold yellow from the logo monogram
  const brandGold = '#e3af23';

  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`shrink-0 ${className}`}
        style={{ height }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Card */}
        <rect width="100" height="100" fill={brandBlue} rx="8" />
        {/* White Border outline */}
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="#ffffff" strokeWidth="1.5" rx="6" />
        
        {/* Monogram RE */}
        <g transform="translate(2, 6) scale(0.85)">
          {/* R Stem */}
          <rect x="22" y="24" width="10" height="42" fill={brandGold} rx="1" />
          {/* R Loop Outer */}
          <path d="M 32 24 L 56 24 C 67 24, 67 44, 56 44 L 32 44 Z" fill={brandGold} />
          {/* R Loop Inner (punch hole matching background blue) */}
          <path d="M 32 31 L 52 31 C 58 31, 58 37, 52 37 L 32 37 Z" fill={brandBlue} />
          
          {/* R Leg flowing into lower bar */}
          <path 
            d="M 37 44 L 54 60 L 80 60 L 80 66 L 48 66 L 32 50 L 32 44 Z" 
            fill={brandGold} 
          />

          {/* E Horizontal Bars */}
          {/* Top Bar */}
          <rect x="62" y="24" width="18" height="7" fill={brandGold} rx="0.5" />
          {/* Middle Bar */}
          <rect x="62" y="38" width="18" height="7" fill={brandGold} rx="0.5" />
          {/* Bottom Bar */}
          <rect x="62" y="51" width="18" height="7" fill={brandGold} rx="0.5" />
        </g>
      </svg>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`flex flex-col text-left leading-tight ${className}`}>
        <span className="font-extrabold text-slate-800 tracking-tight text-sm md:text-base">
          Ethiopian Reinsurance S.C.
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          የኢትዮጵያ ጠለፋ መድን ማኅበር
        </span>
      </div>
    );
  }

  if (variant === 'light') {
    // Light version of the card suitable for clean white backgrounds
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Logo Icon with white bg, blue details or standard icon */}
        <Logo variant="compact" height={40} className="shadow-sm" />
        <div className="flex flex-col text-left leading-none">
          <span className="font-black text-slate-900 tracking-tight text-base">EthioRe</span>
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">
            Ethiopian Reinsurance S.C.
          </span>
        </div>
      </div>
    );
  }

  // Full rectangular branding badge (Exact matching design card)
  return (
    <svg
      viewBox="0 0 170 215"
      className={`shrink-0 ${className}`}
      style={{ height }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue background canvas */}
      <rect width="170" height="215" fill={brandBlue} rx="4" />
      {/* White frame line */}
      <rect x="4" y="4" width="162" height="207" fill="none" stroke="#ffffff" strokeWidth="2.2" rx="2" />

      {/* Styled Yellow RE Monogram */}
      <g id="monogram" transform="translate(0, 10)">
        {/* R Vertical Stem */}
        <rect x="30" y="45" width="12" height="42" fill={brandGold} />
        {/* R Loop Bowl */}
        <path d="M 42 45 L 72 45 C 83 45, 83 67, 72 67 L 42 67 Z" fill={brandGold} />
        {/* R Loop Inner hole (bg color match) */}
        <path d="M 42 53 L 68 53 C 73 53, 73 59, 68 59 L 42 59 Z" fill={brandBlue} />

        {/* Dynamic connection leg: sweeps down and becomes bottom border line */}
        <path 
          d="M 47 67 L 67 87 L 118 87 L 118 95 L 59 95 L 39 75 L 39 67 Z" 
          fill={brandGold} 
        />

        {/* Three E Bars aligned with R */}
        {/* Top E Bar */}
        <rect x="78" y="45" width="40" height="9" fill={brandGold} />
        {/* Middle E Bar */}
        <rect x="78" y="60" width="40" height="9" fill={brandGold} />
        {/* Bottom E Bar */}
        <rect x="78" y="74" width="40" height="9" fill={brandGold} />
      </g>

      {/* White English text "Ethiopian Reinsurance" */}
      <text
        x="30"
        y="126"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="bold"
        fontSize="17.5"
        letterSpacing="-0.3"
      >
        Ethiopian
      </text>
      <text
        x="30"
        y="148"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="bold"
        fontSize="17.5"
        letterSpacing="-0.3"
      >
        Reinsurance
      </text>

      {/* Amharic Text "የኢትዮጵያ ጠለፋ መድን" */}
      <text
        x="30"
        y="182"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="normal"
        fontSize="12.5"
        letterSpacing="0.2"
      >
        የኢትዮጵያ ጠለፋ መድን
      </text>
    </svg>
  );
};
