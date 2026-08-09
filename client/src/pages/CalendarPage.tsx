import React, { useEffect, useState } from 'react';
import { interviewApi } from '../api/interviewApi';
import { Interview } from '../types';
import { CalendarView } from '../components/CalendarView';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { Video, CalendarCheck, User, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const CalendarPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
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
    fetchInterviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Recruiter Calendar</h1>
        <p className="text-xs text-slate-400 mt-1">Interactive monthly and weekly schedule of all recruitment interviews</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading calendar appointments..." />
      ) : (
        <CalendarView interviews={interviews} onSelectInterview={setSelectedInterview} />
      )}

      {selectedInterview && (
        <Modal
          isOpen={Boolean(selectedInterview)}
          onClose={() => setSelectedInterview(null)}
          title={`Scheduled Interview: ${selectedInterview.title}`}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100">{selectedInterview.candidateId?.name}</h4>
                <p className="text-xs text-slate-400">{selectedInterview.candidateId?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-brand-400" /> Date & Time
                </p>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedInterview.selectedSlot?.start
                    ? format(new Date(selectedInterview.selectedSlot.start), 'EEE, MMM d, yyyy')
                    : 'N/A'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedInterview.selectedSlot?.start
                    ? `${format(new Date(selectedInterview.selectedSlot.start), 'h:mm a')} - ${format(
                        new Date(selectedInterview.selectedSlot.end),
                        'h:mm a'
                      )}`
                    : ''}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-brand-400" /> Duration & Type
                </p>
                <p className="text-xs font-semibold text-slate-200">{selectedInterview.duration} mins</p>
                <p className="text-[11px] text-slate-400">{selectedInterview.type}</p>
              </div>
            </div>

            {selectedInterview.meetingLink && (
              <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4" /> Google Meet Teleconference
                  </p>
                  <p className="text-xs text-brand-200/80 mt-0.5 font-mono truncate">{selectedInterview.meetingLink}</p>
                </div>
                <a
                  href={selectedInterview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-400 transition-colors shrink-0"
                >
                  Join Call
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
