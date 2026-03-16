import React from 'react';

export const SaudiRiyalIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg 
    viewBox="-2 -2 28 28" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className} 
    {...props}
  >
    {/* Right vertical line */}
    <path d="M16 4v16" />
    
    {/* Left vertical line with curve/foot */}
    <path d="M9 4v12l-3 4" />
    
    {/* Top horizontal line (slanted) */}
    <path d="M3 11l18-2" />
    
    {/* Bottom horizontal line (slanted) */}
    <path d="M3 17l18-2" />
  </svg>
);

export const SaudiRiyalText = ({ className = "", ...props }) => (
  <SaudiRiyalIcon className={`inline-block ${className}`} {...props} />
);
