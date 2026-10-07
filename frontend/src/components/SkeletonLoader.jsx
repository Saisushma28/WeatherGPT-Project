import React from 'react';

export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'card') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-10 bg-slate-800 rounded-xl w-24" />
        </div>
        <div className="h-16 bg-slate-800/80 rounded w-1/2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'forecast') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse space-y-3">
        <div className="h-5 bg-slate-800 rounded w-1/4 mb-4" />
        <div className="h-12 bg-slate-800/60 rounded-xl" />
        <div className="h-12 bg-slate-800/60 rounded-xl" />
        <div className="h-12 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-48 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
  );
}
