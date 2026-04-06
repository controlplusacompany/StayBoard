import React from 'react';

export default function Legend() {
  const items = [
    { label: 'Vacant', className: 'bg-status-vacant-bg text-status-vacant-fg border border-status-vacant-border' },
    { label: 'Occupied', className: 'bg-status-occupied-bg text-status-occupied-fg border border-status-occupied-border' },
    { label: 'Arrival', className: 'bg-status-arriving-bg text-status-arriving-fg border border-status-arriving-border' },
    { label: 'Checkout', className: 'bg-status-checkout-bg text-status-checkout-fg border border-status-checkout-border' },
    { label: 'Cleaning', className: 'bg-status-cleaning-bg text-status-cleaning-fg border border-status-cleaning-border' },
    { label: 'Maintenance', className: 'bg-status-maintenance-bg text-status-maintenance-fg border border-status-maintenance-border' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-full ${item.className}`}></div>
          <span className="text-[11px] font-medium text-ink-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
