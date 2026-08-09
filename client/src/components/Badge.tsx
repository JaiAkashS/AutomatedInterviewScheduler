import React from 'react';
import { clsx } from 'clsx';
import { InterviewStatus } from '../types';

interface BadgeProps {
  status: InterviewStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'SCHEDULED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SCHEDULING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESCHEDULE_REQUESTED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EXPIRED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'DRAFT':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider',
        getBadgeStyle(status),
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
