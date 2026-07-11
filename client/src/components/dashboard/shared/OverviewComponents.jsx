import React from 'react';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export const DashboardStat = ({ label, value, helper, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  };

  return (
    <div className="overview-stat-card">
      <div className={`overview-stat-icon ${tones[tone] || tones.blue}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
      </div>
    </div>
  );
};

export const OverviewSectionHeading = ({ eyebrow, title, description, actionLabel, onAction }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && (
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
    </div>
    {actionLabel && (
      <button type="button" onClick={onAction} className="overview-text-link self-start sm:self-auto">
        {actionLabel}
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    )}
  </div>
);

export const MaterialOverviewCard = ({ material, onOpen, actions, index = 0 }) => (
  <article className="overview-material-card group">
    <button type="button" onClick={onOpen} className="flex w-full flex-1 flex-col text-left">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="overview-subject-badge">{material.subject || 'Learning material'}</span>
        <span className="text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
        {material.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
        {material.description || 'Open this material to review the lesson content.'}
      </p>
    </button>
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <button type="button" onClick={onOpen} className="overview-text-link">
        <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
        Open material
      </button>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  </article>
);

export const OverviewEmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="overview-empty-state">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <BookOpenIcon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h3 className="font-bold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    {actionLabel && (
      <button type="button" onClick={onAction} className="overview-secondary-button mt-5">
        {actionLabel}
      </button>
    )}
  </div>
);

export const OverviewLoadingCards = ({ count = 3 }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading dashboard content">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-24 rounded-full bg-slate-100" />
        <div className="mt-6 h-5 w-4/5 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
        <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
      </div>
    ))}
  </div>
);
