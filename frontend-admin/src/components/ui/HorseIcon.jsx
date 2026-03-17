import React from 'react';

/**
 * Equora Q monogram.
 * Stylized gold Q logo for brand identity across the admin dashboard.
 */
export const HorseIcon = ({ className = 'w-6 h-6', size, ...props }) => {
  const s = size ?? 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={s}
      height={s}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      {...props}
    >
      <circle cx="50" cy="50" r="38" />
      <path d="M 58 58 Q 75 75 92 92 L 92 78 Q 75 60 58 58 Z" />
    </svg>
  );
};

export default HorseIcon;
