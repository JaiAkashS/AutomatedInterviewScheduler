import React from 'react';
import { Interview } from '../types';
import { Badge } from './Badge';
import { CopyLinkButton } from './CopyLinkButton';
import { Button } from './Button';
import { Calendar, Clock, Video, XCircle, RefreshCw, Edit3, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface InterviewTableProps {
  interviews: Interview[];
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onSelect: (interview: Interview) => void;
  onOpenFeedback?: (interview: Interview) => void;
  onOpenScorecard?: (interview: Interview) => void;
}

export const InterviewTable: React.FC<InterviewTableProps> = ({
  interviews,
  onCancel,
  onReschedule,
  onSelect,
  onOpenFeedback,
  onOpenScorecard,
}) => {

  if (interviews.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">No Interviews Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Create an interview request to automatically generate candidate scheduling links and sync with Google Calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-6">Candidate</th>
              <th className="py-4 px-6">Interview Title</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Scheduled Time</th>
              <th className="py-4 px-6">Duration</th>
              <th className="py-4 px-[#1a202c] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {interviews.map((item) => {
              const scheduleUrl = `${window.location.origin}/schedule/${item.schedulingToken}`;
              const candidate = item.candidateId;

              return (
                <tr
                  key={item._id}
                  onClick={() => onSelect(item)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-100">{candidate?.name || 'Unknown Candidate'}</div>
                    <div className="text-xs text-slate-400">{candidate?.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-200">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.type}</div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge status={item.status} />
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-300">
                    {item.selectedSlot?.start ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">
                          {format(new Date(item.selectedSlot.start), 'EEE, MMM d, yyyy')}
                        </span>
                        <span className="text-slate-400">
                          {format(new Date(item.selectedSlot.start), 'h:mm a')} -{' '}
                          {format(new Date(item.selectedSlot.end), 'h:mm a')} ({item.selectedSlot.timezone || item.timezone})
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-slate-500">Awaiting candidate selection</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.duration} mins</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <CopyLinkButton url={scheduleUrl} />

                      {item.meetingLink && (
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 transition-colors"
                          title="Open Google Meet"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}

                      {/* Feedback & Scorecard Actions */}
                      {(item.status === 'SCHEDULED' || item.status === 'COMPLETED') && (
                        <>
                          {onOpenFeedback && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenFeedback(item)}
                              icon={<Edit3 className="w-3.5 h-3.5 text-brand-400" />}
                              title="Submit / Edit Feedback"
                            >
                              <span className="hidden xl:inline text-xs">Feedback</span>
                            </Button>
                          )}
                          {onOpenScorecard && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenScorecard(item)}
                              icon={<FileText className="w-3.5 h-3.5 text-amber-400" />}
                              title="View Scorecard"
                            />
                          )}
                        </>
                      )}

                      {item.status === 'SCHEDULED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReschedule(item._id)}
                            icon={<RefreshCw className="w-3.5 h-3.5 text-purple-400" />}
                            title="Request Reschedule"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancel(item._id)}
                            icon={<XCircle className="w-3.5 h-3.5 text-red-400" />}
                            title="Cancel Interview"
                          />
                        </>
                      )}
                    </div>

                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
