'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export default function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        'group inline-flex items-center gap-3 rounded-full border border-[rgba(32,24,20,0.14)] bg-[rgba(255,248,237,0.76)] px-3 py-2 text-[var(--brand-ink)] shadow-[0_14px_36px_rgba(32,24,20,0.08)] backdrop-blur transition-transform duration-200 hover:-translate-y-0.5',
        compact ? 'pr-4' : 'pr-5',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[var(--brand-cream-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
        <Crown size={compact ? 16 : 18} />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-[1.05rem] font-black uppercase leading-none tracking-[-0.08em]">
          Grandmaster Council
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(32,24,20,0.58)]">
          Editorial personality chess
        </span>
      </span>
    </Link>
  );
}
