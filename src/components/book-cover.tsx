'use client';

import Image from 'next/image';

const GRADIENTS = [
  'from-blue-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-red-600',
  'from-purple-400 to-pink-600',
  'from-cyan-400 to-blue-600',
  'from-rose-400 to-fuchsia-600',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface BookCoverProps {
  title: string;
  imageUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function BookCover({ title, imageUrl, width = 96, height = 128, className }: BookCoverProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`${title} の表紙`}
        width={width}
        height={height}
        className={`rounded-md object-cover ${className ?? ''}`}
        loading="eager"
        style={{ width, height }}
      />
    );
  }

  const gradient = GRADIENTS[hashCode(title) % GRADIENTS.length];
  const initial = title.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-md bg-gradient-to-br ${gradient} text-white font-bold shadow-inner ${className ?? ''}`}
      style={{ width, height }}
      aria-label={`${title} の表紙`}
    >
      <span className="text-2xl select-none drop-shadow">{initial}</span>
    </div>
  );
}
