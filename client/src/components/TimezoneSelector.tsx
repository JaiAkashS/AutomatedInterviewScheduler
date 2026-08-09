import React from 'react';
import { Globe } from 'lucide-react';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

interface TimezoneSelectorProps {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className="w-4 h-4 absolute left-3 text-brand-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 font-medium hover:border-brand-500/50 focus:border-brand-500 focus:outline-none transition-colors appearance-none cursor-pointer"
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz} className="bg-slate-900 text-slate-100">
            {tz.replace('_', ' ')}
          </option>
        ))}
      </select>
    </div>
  );
};
