import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from '@/lib/formatting';

interface StatCardProps {
  label: string;
  value: number | string;
  subLabel?: string;
  isCurrency?: boolean;
  trend?: {
    value: string;
    type: 'up' | 'down';
  };
  accentColor?: 'blue' | 'purple' | 'orange' | 'green';
  href?: string;
}

export default function StatCard({
  label,
  value,
  subLabel,
  isCurrency,
  trend,
  accentColor,
  href
}: StatCardProps) {
  // Use JetBrains Mono for currency
  const valueDisplay = typeof value === 'number' && isCurrency ? formatINR(value) : value;

  const accentClasses = {
    blue: 'border-l-accent',
    purple: 'border-l-[#8B5CF6]', // Purple-500 equivalent
    orange: 'border-l-[#F97316]', // Orange-500 equivalent
    green: 'border-l-[#22C55E]'   // Green-500 equivalent
  };

  const content = (
    <div className={`
      group flex flex-col gap-1 p-6 rounded-2xl bg-white border border-border-subtle shadow-sm transition-all duration-220 ease-out 
      ${href ? 'cursor-pointer hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 hover:border-accent/20 active:scale-[0.98]' : ''}
      relative overflow-hidden
    `}>
      {accentColor && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          accentColor === 'blue' ? 'bg-status-occupied-fg' : 
          accentColor === 'purple' ? 'bg-status-arriving-fg' : 
          accentColor === 'orange' ? 'bg-status-checkout-fg' : 
          'bg-status-vacant-fg'
        }`} />
      )}
      
      <span className="text-[10px] font-sans text-ink-muted uppercase font-medium tracking-[0.1em] leading-none mb-1">
        {label}
      </span>

      <div className={`
        text-ink-primary font-sans tracking-tighter leading-tight
        ${isCurrency ? 'text-2xl md:text-3xl font-mono font-semibold' : 'text-3xl md:text-4xl font-semibold'}
      `}>
        {valueDisplay}
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        {trend && (
          <div className={`flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trend.type === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {trend.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span className="ml-0.5">{trend.value}</span>
          </div>
        )}
        
        {subLabel && (
          <span className="text-[11px] font-sans text-ink-muted font-medium">{subLabel}</span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="no-underline block">
        {content}
      </Link>
    );
  }

  return content;
}
