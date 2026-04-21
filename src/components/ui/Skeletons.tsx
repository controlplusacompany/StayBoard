import React from 'react';

export const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

export const SkeletonKPI = () => (
  <div className="bg-bg-sunken/40 border border-border-subtle rounded-xl p-4 h-24 relative overflow-hidden">
    <div className="h-2 w-16 bg-bg-sunken rounded opacity-60 mb-3" />
    <div className="h-6 w-24 bg-bg-sunken rounded mb-2" />
    <div className="h-2 w-32 bg-bg-sunken rounded opacity-40" />
    <Shimmer />
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-bg-sunken/40 border border-border-subtle rounded-2xl h-64 relative overflow-hidden p-6 flex flex-col justify-end">
    <div className="space-y-3">
      <div className="h-6 w-3/4 bg-bg-sunken rounded" />
      <div className="h-4 w-1/2 bg-bg-sunken rounded opacity-60" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-8 rounded-full bg-bg-sunken opacity-40" />
        <div className="h-8 w-8 rounded-full bg-bg-sunken opacity-40" />
        <div className="h-8 w-8 rounded-full bg-bg-sunken opacity-40" />
      </div>
    </div>
    <Shimmer />
  </div>
);

export const SkeletonArrival = () => (
    <div className="min-w-[340px] bg-bg-sunken/40 border border-border-subtle rounded-xl h-40 relative overflow-hidden p-5">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
                <div className="h-5 w-32 bg-bg-sunken rounded" />
                <div className="h-3 w-24 bg-bg-sunken rounded opacity-60" />
            </div>
            <div className="h-6 w-16 bg-bg-sunken rounded opacity-40" />
        </div>
        <div className="flex justify-between items-end mt-4">
            <div className="h-8 w-20 bg-bg-sunken rounded" />
            <div className="h-9 w-24 bg-bg-sunken rounded opacity-80" />
        </div>
        <Shimmer />
    </div>
);
