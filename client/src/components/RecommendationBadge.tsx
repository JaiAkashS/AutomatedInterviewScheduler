import React from 'react';
import { clsx } from 'clsx';
import { FeedbackRecommendation } from '../types';
import { CheckCheck, Check, MinusCircle, ThumbsDown, AlertOctagon } from 'lucide-react';

interface RecommendationBadgeProps {
  recommendation: FeedbackRecommendation | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  recommendation,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const getDetails = (rec: string) => {
    switch (rec) {
      case 'STRONG_YES':
        return {
          label: 'Strong Yes',
          style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-bold',
          icon: <CheckCheck className="shrink-0" />,
        };
      case 'YES':
        return {
          label: 'Yes',
          style: 'bg-teal-500/15 text-teal-400 border-teal-500/30 font-semibold',
          icon: <Check className="shrink-0" />,
        };
      case 'NEUTRAL':
        return {
          label: 'Neutral',
          style: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
          icon: <MinusCircle className="shrink-0" />,
        };
      case 'NO':
        return {
          label: 'No',
          style: 'bg-orange-500/15 text-orange-400 border-orange-500/30 font-semibold',
          icon: <ThumbsDown className="shrink-0" />,
        };
      case 'STRONG_NO':
        return {
          label: 'Strong No',
          style: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/10 font-bold',
          icon: <AlertOctagon className="shrink-0" />,
        };
      default:
        return {
          label: rec,
          style: 'bg-slate-700/40 text-slate-300 border-slate-600/30',
          icon: null,
        };
    }
  };

  const { label, style, icon } = getDetails(recommendation);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border uppercase tracking-wider transition-all',
        sizeClasses,
        style,
        className
      )}
    >
      {showIcon && icon && React.cloneElement(icon as React.ReactElement, { className: iconSizes })}
      <span>{label}</span>
    </span>
  );
};
