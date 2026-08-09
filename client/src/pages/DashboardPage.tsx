import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviewApi } from '../api/interviewApi';
import { Interview } from '../types';
import { InterviewTable } from '../components/InterviewTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const { user } = useAuth();

  const fetchInterviews = async () => {
    try {
      const res = await interviewApi.getInterviews();
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
    fetchInterviews();
  }, []);

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this interview?')) {
      try {
        await interviewApi.cancelInterview(id);
        fetchInterviews();
      } catch (err) {
        alert('Failed to cancel interview');
      }
    }
  };

  const handleReschedule = async (id: string) => {
    try {
      const res = await interviewApi.rescheduleInterview(id);
      alert(`Reschedule link generated:\n${res.schedulingUrl}`);
      fetchInterviews();
    } catch (err) {
      alert('Failed to initiate reschedule');
    }
  };

  // Metrics
  const scheduledCount = interviews.filter((i) => i.status === 'SCHEDULED').length;
  const pendingCount = interviews.filter((i) => i.status === 'SCHEDULING' || i.status === 'RESCHEDULE_REQUESTED').length;
  const completedCount = interviews.filter((i) => i.status === 'COMPLETED').length;
  const cancelledCount = interviews.filter((i) => i.status === 'CANCELLED').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Welcome back, {user?.name}. Here is your recruitment activity.</p>
        </div>

        <Link to="/interviews/new">
          <Button icon={<PlusCircle className="w-4 h-4" />}>Schedule Interview</Button>
        </Link>
      </div>

      {/* Google Calendar Connection Banner if disconnected */}
      {!user?.googleCalendarConnected && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Connect Google Calendar for Live Sync</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Automatically retrieve your free/busy availability and insert Google Meet links into scheduled interviews.
              </p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Connect Calendar
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Scheduled</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{scheduledCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Candidate</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{completedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancelled</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{cancelledCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Interviews Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Recent Interview Requests</h2>
          <Link to="/interviews" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
            View All Interviews <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching interviews..." />
        ) : (
          <InterviewTable
            interviews={interviews.slice(0, 5)}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onSelect={setSelectedInterview}
          />
        )}
      </div>

      {/* Selected Interview Details Modal */}
      {selectedInterview && (
        <Modal
          isOpen={Boolean(selectedInterview)}
          onClose={() => setSelectedInterview(null)}
          title={`Interview Details: ${selectedInterview.title}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Candidate Name</p>
                <p className="font-semibold text-slate-100">{selectedInterview.candidateId?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Candidate Email</p>
                <p className="font-semibold text-slate-100">{selectedInterview.candidateId?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Duration</p>
                <p className="font-semibold text-slate-100">{selectedInterview.duration} mins</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Working Hours</p>
                <p className="font-semibold text-slate-100">
                  {selectedInterview.workingHours?.start} - {selectedInterview.workingHours?.end}
                </p>
              </div>
            </div>

            {selectedInterview.meetingLink && (
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
                <p className="text-xs font-semibold text-brand-400">Google Meet Link</p>
                <a
                  href={selectedInterview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-300 underline font-mono break-all mt-1 block"
                >
                  {selectedInterview.meetingLink}
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
