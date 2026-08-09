import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidateApi } from '../api/candidateApi';
import { scheduleApi } from '../api/scheduleApi';
import { useAuth } from '../context/AuthContext';
import { Interview } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Calendar, Clock, Video, RefreshCw, XCircle, LogOut, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const CandidateDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyInterviews = async () => {
    try {
      const res = await candidateApi.getMyInterviews();
      if (res.success) {
        setInterviews(res.interviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInterviews();
  }, []);

  const handleReschedule = async (token: string) => {
    try {
      await scheduleApi.reschedule(token);
      navigate(`/schedule/${token}`);
    } catch (err) {
      alert('Failed to initiate reschedule');
    }
  };

  const handleCancel = async (token: string) => {
    if (window.confirm('Are you sure you want to cancel your interview appointment?')) {
      try {
        await scheduleApi.cancel(token, 'Cancelled by candidate from Candidate Portal.');
        fetchMyInterviews();
      } catch (err) {
        alert('Failed to cancel interview.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Fetching your candidate dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Candidate Portal Header */}
        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-brand-500/20">
              {user?.name ? user.name.charAt(0) : 'C'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Welcome, {user?.name || 'Candidate'}</h1>
              <p className="text-xs text-slate-400">{user?.email} • Candidate Workspace</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </header>

        {/* Candidate Interviews Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Your Recruitment Interviews</h2>
            <p className="text-xs text-slate-400 mt-1">Review scheduled appointments, join Google Meet calls, or select time slots</p>
          </div>

          {interviews.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">No Interviews Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active recruitment interviews were found for {user?.email}. Check back once your recruiter sends you an interview link.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((item) => {
                const isScheduled = item.status === 'SCHEDULED';
                const isPending = item.status === 'SCHEDULING' || item.status === 'RESCHEDULE_REQUESTED';
                const slot = item.selectedSlot;

                return (
                  <div
                    key={item._id}
                    className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">{item.type}</span>
                        <h3 className="text-lg font-bold text-slate-100">{item.title}</h3>
                      </div>
                      <Badge status={item.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-slate-500 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-brand-400" /> Recruiter / Hiring Team
                        </p>
                        <p className="font-semibold text-slate-200">{(item.recruiterId as any)?.name || 'Hiring Manager'}</p>
                        <p className="text-[11px] text-slate-400">{(item.recruiterId as any)?.email}</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-400" /> Interview Details
                        </p>
                        <p className="font-semibold text-slate-200">{item.duration} Minutes</p>
                        <p className="text-[11px] text-slate-400">Timezone: {slot?.timezone || item.timezone}</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" /> Appointment Slot
                        </p>
                        {slot?.start ? (
                          <>
                            <p className="font-semibold text-slate-200">
                              {format(new Date(slot.start), 'EEE, MMM d, yyyy')}
                            </p>
                            <p className="text-[11px] text-brand-400 font-mono">
                              {format(new Date(slot.start), 'h:mm a')} - {format(new Date(slot.end), 'h:mm a')}
                            </p>
                          </>
                        ) : (
                          <p className="italic text-slate-500">Not scheduled yet</p>
                        )}
                      </div>
                    </div>

                    {/* Google Meet Link Banner */}
                    {isScheduled && item.meetingLink && (
                      <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-brand-300">Google Meet Teleconference</h4>
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-200 underline font-mono break-all"
                            >
                              {item.meetingLink}
                            </a>
                          </div>
                        </div>

                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-lg shadow-brand-500/20"
                        >
                          Join Call
                        </a>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-2">
                      {isPending && (
                        <Link to={`/schedule/${item.schedulingToken}`}>
                          <Button icon={<CheckCircle className="w-4 h-4" />}>Select Time Slot</Button>
                        </Link>
                      )}

                      {isScheduled && (
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(item.schedulingToken)}
                            icon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancel(item.schedulingToken)}
                            icon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
