import React from 'react';
import Image from 'next/image';

interface ElisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizeMap = {
  sm: { w: 32, h: 28, text: 14, tag: 7 },
  md: { w: 44, h: 38, text: 18, tag: 8 },
  lg: { w: 64, h: 56, text: 26, tag: 10 },
};

export function ElisLogo({ size = 'md', variant = 'full', className = '' }: ElisLogoProps) {
  const s = sizeMap[size];

  const logo = (
    <Image
      src="/elis-logo.png"
      alt="Elis"
      width={s.w}
      height={s.h}
      className="object-contain"
      priority
    />
  );

  if (variant === 'icon') {
    return <span className={className}>{logo}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {logo}
      <span className="flex flex-col leading-none">
        <span
          style={{ fontSize: s.text, fontWeight: 800, letterSpacing: '-0.02em' }}
          className="text-[#4f657a]"
        >
          elis
        </span>
        {size !== 'sm' && (
          <span
            style={{ fontSize: s.tag, letterSpacing: '0.06em' }}
            className="text-[#00a5aa] uppercase font-semibold mt-0.5"
          >
            circular at work
          </span>
        )}
      </span>
    </span>
  );
}
