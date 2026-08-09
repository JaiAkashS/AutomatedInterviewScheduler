import React from 'react';
import { Outlet } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="py-4 px-6 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-100 tracking-tight">AutoSched</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">Candidate Scheduling Portal</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto flex items-center justify-center">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-950">
        Powered by AutoSched • Automated Interview Scheduling System
      </footer>
    </div>
  );
};
