"use client";

import React from 'react';
import { Recycle } from 'lucide-react';

interface CircularBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function CircularBadge({ className = '', size = 'sm' }: CircularBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[#00a5aa]/30 bg-[#e0f5f6] text-[#008a8f] font-semibold ${
        isSmall ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      title="Item segue princípios de economia circular / reuso"
    >
      <Recycle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {!isSmall && 'Circular'}
    </span>
  );
}
