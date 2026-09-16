import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { googleApi } from '../api/googleApi';
import { Button } from '../components/Button';
import { TimezoneSelector } from '../components/TimezoneSelector';
import { CalendarCheck, ShieldCheck, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; calendarId: string; configured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchGoogleStatus = async () => {
    try {
      const res = await googleApi.getStatus();
      setGoogleStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();

    const googleParam = searchParams.get('google');
    const errorParam = searchParams.get('error');

    if (googleParam === 'connected') {
      setNotice({ type: 'success', message: 'Google Calendar successfully connected and synchronized!' });
      refreshUser();
    } else if (errorParam) {
      setNotice({ type: 'error', message: `Google OAuth connection failed (${errorParam}). Please try again.` });
    }
  }, [searchParams]);

  const handleConnectGoogle = async () => {
    setActionLoading(true);
    try {
      const res = await googleApi.getAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      alert('Failed to initialize Google OAuth');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Disconnect Google Calendar synchronization?')) {
      setActionLoading(true);
      try {
        await googleApi.disconnect();
        await refreshUser();
        await fetchGoogleStatus();
        setNotice({ type: 'success', message: 'Google Calendar disconnected.' });
      } catch (err) {
        alert('Failed to disconnect Google Calendar');
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">
            ×
          </button>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account & Integrations</h1>
        <p className="text-xs text-slate-400 mt-1">Manage Google Calendar OAuth connection and default timezone settings</p>
      </div>

      {/* Google Calendar Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Google Calendar Synchronization</h3>
            <p className="text-xs text-slate-400">Real-time FreeBusy query & automatic calendar event generation</p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OAuth Connection Status</span>
              <div className="flex items-center gap-2">
                {googleStatus?.connected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Connected ({googleStatus.calendarId})</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-sm font-bold text-amber-400">Not Connected</span>
                  </>
                )}
              </div>
            </div>

            {googleStatus?.connected ? (
              <Button variant="danger" size="sm" onClick={handleDisconnectGoogle} loading={actionLoading}>
                Disconnect Calendar
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnectGoogle} loading={actionLoading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Connect Google Calendar
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-400 space-y-2 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>We only request permission to inspect busy intervals and create interview calendar invitations.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Timezone Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Recruiter Default Timezone</h3>
        <p className="text-xs text-slate-400">Your default timezone used when calculating recruiter working hours.</p>

        <div className="max-w-md">
          <TimezoneSelector value={timezone} onChange={setTimezone} className="w-full" />
        </div>
      </div>
    </div>
  );
};
