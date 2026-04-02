'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  badge?: string;
  iconColor?: string;
  iconBg?: string;
}

export function BentoCard({
  title,
  description,
  href,
  icon: Icon,
  className,
  badge,
  iconColor = 'text-foreground',
  iconBg = 'bg-muted',
}: BentoCardProps) {
  return (
    <Link href={href} className={cn('group', className)}>
      <div className="glass rounded-2xl p-6 h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={cn('rounded-xl p-2.5', iconBg)}>
              <Icon className={cn('h-6 w-6', iconColor)} />
            </div>
            {badge && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                {badge}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold group-hover:underline">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
