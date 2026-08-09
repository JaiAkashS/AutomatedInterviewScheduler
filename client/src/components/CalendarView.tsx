import React, { useState } from 'react';
import { Interview } from '../types';
import { Badge } from './Badge';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from './Button';

interface CalendarViewProps {
  interviews: Interview[];
  onSelectInterview: (interview: Interview) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ interviews, onSelectInterview }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Month navigation
  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const today = () => setCurrentDate(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <p className="text-xs text-slate-400">Recruiter Interview Schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  viewMode === mode ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={prevPeriod} icon={<ChevronLeft className="w-4 h-4" />} />
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextPeriod} icon={<ChevronRight className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div>
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center font-semibold text-xs text-slate-400 py-2 border-b border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-800/60 rounded-xl overflow-hidden mt-2 border border-slate-800">
            {days.map((day) => {
              const dayInterviews = interviews.filter(
                (item) => item.selectedSlot?.start && isSameDay(new Date(item.selectedSlot.start), day)
              );

              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] p-2 bg-slate-900 transition-colors flex flex-col justify-between ${
                    !isCurrentMonth ? 'opacity-40 bg-slate-950/40' : ''
                  } ${isToday ? 'ring-1 ring-brand-500/50 bg-brand-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-brand-500 text-white' : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayInterviews.map((intvw) => (
                      <div
                        key={intvw._id}
                        onClick={() => onSelectInterview(intvw)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200 truncate">
                          <span>{intvw.candidateId?.name || 'Candidate'}</span>
                          {intvw.meetingLink && <Video className="w-3 h-3 text-brand-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(intvw.selectedSlot!.start), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day Simple Agenda View */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="space-y-3">
          {interviews.filter((i) => i.selectedSlot?.start).length === 0 ? (
            <p className="text-slate-400 text-xs italic py-8 text-center">No scheduled interviews in this timeframe.</p>
          ) : (
            interviews
              .filter((i) => i.selectedSlot?.start)
              .map((intvw) => (
                <div
                  key={intvw._id}
                  onClick={() => onSelectInterview(intvw)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{intvw.title}</h4>
                      <p className="text-xs text-slate-400">
                        Candidate: <span className="text-slate-200">{intvw.candidateId?.name}</span> ({intvw.candidateId?.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-200">
                        {format(new Date(intvw.selectedSlot!.start), 'EEEE, MMM d')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {format(new Date(intvw.selectedSlot!.start), 'h:mm a')} -{' '}
                        {format(new Date(intvw.selectedSlot!.end), 'h:mm a')}
                      </div>
                    </div>
                    <Badge status={intvw.status} />
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};
