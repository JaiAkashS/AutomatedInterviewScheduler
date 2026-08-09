import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { scheduleApi } from '../api/scheduleApi';
import { Interview, TimeSlot } from '../types';
import { Button } from '../components/Button';
import { TimezoneSelector } from '../components/TimezoneSelector';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Badge } from '../components/Badge';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  Video,
  AlertTriangle,
  ChevronRight,
  Globe,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const PublicSchedulePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loadingInterview, setLoadingInterview] = useState(true);
  const [interviewError, setInterviewError] = useState('');

  const [timezone, setTimezone] = useState('America/New_York');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [confirmedData, setConfirmedData] = useState<{ interview: Interview; meetingLink?: string } | null>(null);

  // Load interview info
  useEffect(() => {
    const fetchInterview = async () => {
      if (!token) return;
      try {
        const res = await scheduleApi.getInterviewByToken(token);
        if (res.success) {
          setInterview(res.interview);
          if (res.interview.candidateId?.timezone) {
            setTimezone(res.interview.candidateId.timezone);
          }
          if (res.interview.selectedSlot) {
            setConfirmedData({
              interview: res.interview,
              meetingLink: res.interview.meetingLink,
            });
          }
        }
      } catch (err: any) {
        setInterviewError(err.response?.data?.message || 'Invalid or expired scheduling link.');
      } finally {
        setLoadingInterview(false);
      }
    };
    fetchInterview();
  }, [token]);

  // Load slots whenever timezone changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!token || !interview || interview.status === 'CANCELLED' || interview.status === 'COMPLETED') return;
      setLoadingSlots(true);
      try {
        const res = await scheduleApi.getSlotsByToken(token, timezone);
        if (res.success) {
          setSlots(res.slots);
          // Auto select first date if available
          if (res.slots.length > 0) {
            const firstDateStr = format(parseISO(res.slots[0].start), 'yyyy-MM-dd');
            setSelectedDate(firstDateStr);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    if (interview && (interview.status === 'SCHEDULING' || interview.status === 'RESCHEDULE_REQUESTED')) {
      fetchSlots();
    }
  }, [token, interview, timezone]);

  const handleConfirm = async () => {
    if (!token || !selectedSlot) return;
    setConfirmError('');
    setConfirming(true);

    try {
      const res = await scheduleApi.confirmSlot(token, selectedSlot.start, selectedSlot.end, timezone);
      if (res.success) {
        setConfirmedData({
          interview: res.interview,
          meetingLink: res.meetingLink,
        });
      }
    } catch (err: any) {
      setConfirmError(
        err.response?.data?.message || 'This time slot is no longer available. Please select another slot.'
      );
      // Refresh slots on error
      if (token) {
        scheduleApi.getSlotsByToken(token, timezone).then((res) => {
          if (res.slots) setSlots(res.slots);
        });
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleReschedule = async () => {
    if (!token) return;
    try {
      const res = await scheduleApi.reschedule(token);
      if (res.success) {
        setInterview(res.interview);
        setConfirmedData(null);
        setSelectedSlot(null);
      }
    } catch (err: any) {
      alert('Failed to initiate reschedule');
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    if (window.confirm('Are you sure you want to cancel this interview appointment?')) {
      try {
        const res = await scheduleApi.cancel(token, 'Cancelled by candidate.');
        if (res.success) {
          setInterview(res.interview);
          setConfirmedData(null);
        }
      } catch (err: any) {
        alert('Failed to cancel interview.');
      }
    }
  };

  if (loadingInterview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center w-full max-w-lg shadow-2xl">
        <LoadingSpinner message="Retrieving interview invitation details..." />
      </div>
    );
  }

  if (interviewError || !interview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center w-full max-w-lg shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Scheduling Link Unavailable</h2>
        <p className="text-xs text-slate-400">{interviewError || 'This scheduling link is invalid or has expired.'}</p>
      </div>
    );
  }

  // If already confirmed or completed
  if (confirmedData || interview.status === 'SCHEDULED') {
    const activeInterview = confirmedData?.interview || interview;
    const slot = activeInterview.selectedSlot;

    return (
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Interview Confirmed!</h2>
          <p className="text-xs text-slate-400">
            A calendar invitation has been sent to <span className="text-slate-200 font-semibold">{activeInterview.candidateId?.email}</span>.
          </p>
        </div>

        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm">{activeInterview.title}</h3>
            <Badge status={activeInterview.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Candidate</p>
              <p className="font-semibold text-slate-200 mt-0.5">{activeInterview.candidateId?.name}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Duration</p>
              <p className="font-semibold text-slate-200 mt-0.5">{activeInterview.duration} Minutes</p>
            </div>
          </div>

          {slot && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-semibold text-slate-200">
                  {format(new Date(slot.start), 'EEEE, MMMM d, yyyy')}
                </span>
              </p>
              <p className="text-slate-300 font-mono pl-5">
                {format(new Date(slot.start), 'h:mm a')} - {format(new Date(slot.end), 'h:mm a')} ({slot.timezone})
              </p>
            </div>
          )}

          {confirmedData?.meetingLink && (
            <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-xs">
                <Video className="w-4 h-4" /> Google Meet Video Conference
              </div>
              <a
                href={confirmedData.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-300 underline font-mono break-all block"
              >
                {confirmedData.meetingLink}
              </a>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={handleReschedule} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Reschedule
          </Button>
          <Button variant="danger" size="sm" onClick={handleCancel} icon={<XCircle className="w-3.5 h-3.5" />}>
            Cancel Interview
          </Button>
        </div>
      </div>
    );
  }

  // If Cancelled
  if (interview.status === 'CANCELLED') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center w-full max-w-lg shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Interview Cancelled</h2>
        <p className="text-xs text-slate-400">This interview appointment has been cancelled.</p>
      </div>
    );
  }

  // Unique dates extracted from generated slots
  const availableDates = Array.from(
    new Set(slots.map((s) => format(parseISO(s.start), 'yyyy-MM-dd')))
  );

  const slotsForSelectedDate = slots.filter(
    (s) => format(parseISO(s.start), 'yyyy-MM-dd') === selectedDate
  );

  return (
    <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            {interview.type}
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{interview.title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" /> Candidate: <strong className="text-slate-200">{interview.candidateId?.name}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" /> Duration: <strong className="text-slate-200">{interview.duration} mins</strong>
            </span>
          </div>
        </div>

        {/* Timezone Switcher */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Your Local Timezone
          </label>
          <TimezoneSelector value={timezone} onChange={setTimezone} className="w-full text-xs" />
        </div>
      </div>

      {confirmError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{confirmError}</span>
        </div>
      )}

      {/* Date & Time Slot Picker */}
      {loadingSlots ? (
        <LoadingSpinner message="Calculating real-time interviewer availability..." />
      ) : slots.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-10 text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No Available Slots Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All interviewers are currently busy or outside working hours during this scheduling window. Please contact the recruiter for alternative dates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Select Date */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-400" /> Select a Date
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {availableDates.map((dateStr) => {
                const dateObj = parseISO(dateStr);
                const isSelected = dateStr === selectedDate;
                const count = slots.filter((s) => format(parseISO(s.start), 'yyyy-MM-dd') === dateStr).length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`w-full p-3.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{format(dateObj, 'EEEE, MMM d')}</p>
                      <p className="text-xs text-slate-500">{count} slots available</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Select Time Slot */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-400" /> Available Times ({timezone})
            </h3>

            {slotsForSelectedDate.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6">Select a date on the left to see times.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {slotsForSelectedDate.map((slot) => {
                  const startTimeStr = format(parseISO(slot.start), 'h:mm a');
                  const endTimeStr = format(parseISO(slot.end), 'h:mm a');
                  const isSelected = selectedSlot?.start === slot.start;

                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-brand-600 to-brand-500 border-brand-400 text-white font-bold shadow-lg shadow-brand-500/25 scale-[1.02]'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <p className="text-xs font-semibold">{startTimeStr}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">to {endTimeStr}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Card */}
      {selectedSlot && (
        <div className="p-6 bg-slate-950 border border-brand-500/40 rounded-2xl space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Confirm Your Selection</p>
              <h4 className="text-base font-bold text-slate-100 mt-0.5">
                {format(parseISO(selectedSlot.start), 'EEEE, MMMM d, yyyy')}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-brand-400 font-mono">
                {format(parseISO(selectedSlot.start), 'h:mm a')} - {format(parseISO(selectedSlot.end), 'h:mm a')}
              </span>
              <p className="text-[11px] text-slate-500">{timezone}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setSelectedSlot(null)}>
              Change Slot
            </Button>
            <Button onClick={handleConfirm} loading={confirming} className="px-8">
              Confirm & Schedule Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
