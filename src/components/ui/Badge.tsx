'use client';

import React from 'react';

interface BadgeProps {
  type: string;
  label: string;
}

export default function Badge({ type, label }: BadgeProps) {
  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'bg-status-vacant-bg text-status-vacant-fg';
      case 'occupied': return 'bg-status-occupied-bg text-status-occupied-fg';
      case 'cleaning': return 'bg-status-cleaning-bg text-status-cleaning-fg';
      case 'maintenance': return 'bg-status-maintenance-bg text-status-maintenance-fg';
      case 'checkout_today': return 'bg-status-checkout-bg text-status-checkout-fg';
      case 'arriving_today': return 'bg-status-arriving-bg text-status-arriving-fg';
      case 'confirmed': return 'bg-info-bg text-info';
      case 'checked_in': return 'bg-success-bg text-success';
      case 'checked_out': return 'bg-sunken text-ink-muted';
      case 'cancelled': return 'bg-danger-bg text-danger';
      case 'pending': return 'bg-warning-bg text-warning';
      case 'in_progress': return 'bg-info-bg text-info';
      case 'done': return 'bg-success-bg text-success';
      case 'skipped': return 'bg-sunken text-ink-muted';
      default: return 'bg-sunken text-ink-secondary';

    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.75 rounded-full font-sans font-semibold text-[10px] tracking-[0.04em] uppercase whitespace-nowrap ${getBadgeClass(type)}`}>
      <span className="w-1.25 h-1.25 rounded-full bg-current flex-shrink-0" />
      {label}
    </span>
  );
}
