import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, CalendarCheck } from 'lucide-react';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-300">Recruiter Workspace</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Google Calendar Status pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            user?.googleCalendarConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>{user?.googleCalendarConnected ? 'Google Calendar Connected' : 'Calendar Not Connected'}</span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-100">{user?.name || 'Recruiter'}</p>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
