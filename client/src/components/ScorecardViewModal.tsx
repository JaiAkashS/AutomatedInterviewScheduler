import React, { useState, useEffect } from 'react';
import { Interview, Feedback } from '../types';
import { feedbackApi } from '../api/feedbackApi';
import { RecommendationBadge } from './RecommendationBadge';
import { Button } from './Button';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import {
  FileText,
  Star,
  Sparkles,
  AlertOctagon,
  UserCheck,
  Calendar,
  Clock,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface ScorecardViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview?: Interview | null;
  candidateId?: string | null;
  candidateName?: string;
  onOpenSubmitFeedback?: () => void;
}

export const ScorecardViewModal: React.FC<ScorecardViewModalProps> = ({
  isOpen,
  onClose,
  interview,
  candidateId,
  candidateName,
  onOpenSubmitFeedback,
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScorecards = async () => {
    setLoading(true);
    try {
      if (interview?._id) {
        const res = await feedbackApi.getInterviewFeedback(interview._id);
        if (res.success) {
          setFeedbacks(res.feedbacks);
        }
      } else if (candidateId) {
        const res = await feedbackApi.getCandidateFeedback(candidateId);
        if (res.success) {
          setFeedbacks(res.feedbacks);
        }
      }
    } catch (err) {
      console.error('Error loading scorecards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScorecards();
    }
  }, [isOpen, interview?._id, candidateId]);

  // Aggregate metrics
  const totalReviews = feedbacks.length;
  const allScores = feedbacks.flatMap((f) => f.ratings?.map((r) => r.score) || []);
  const avgScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : null;

  // Consensus recommendation: most frequent or weighted
  const recCounts: Record<string, number> = {};
  feedbacks.forEach((f) => {
    recCounts[f.overallRecommendation] = (recCounts[f.overallRecommendation] || 0) + 1;
  });
  const dominantRec = Object.keys(recCounts).sort((a, b) => recCounts[b] - recCounts[a])[0];

  const titleName = candidateName || interview?.candidateId?.name || 'Candidate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Candidate Scorecard & Feedback: ${titleName}`}
    >
      <div className="space-y-6 text-slate-200">
        {interview && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Round:</span>{' '}
              <span className="font-semibold text-slate-100">{interview.title}</span>
              <span className="mx-2 text-slate-600">•</span>
              <span className="text-slate-400">{interview.type}</span>
            </div>
            {onOpenSubmitFeedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSubmitFeedback();
                }}
                icon={<Edit3 className="w-3.5 h-3.5 text-brand-400" />}
              >
                Log / Edit Feedback
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading submitted scorecards..." />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No Feedback Submitted Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No interviewers have logged an evaluation for this interview session.
            </p>
            {onOpenSubmitFeedback && (
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenSubmitFeedback();
                  }}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Submit First Scorecard
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Consolidated Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Submissions</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-extrabold text-white">{totalReviews}</span>
                  <span className="text-xs text-slate-400">
                    {totalReviews === 1 ? 'Evaluator' : 'Evaluators'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xl font-extrabold text-white">{avgScore || 'N/A'}</span>
                  <span className="text-xs text-slate-500">/ 5.0</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Consensus</p>
                <div className="mt-1">
                  {dominantRec ? (
                    <RecommendationBadge recommendation={dominantRec} size="sm" />
                  ) : (
                    <span className="text-xs text-slate-400">Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Reviewer Cards */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detailed Evaluator Submissions ({feedbacks.length})
              </h4>

              {feedbacks.map((item) => {
                const reviewer = item.interviewerId;
                const interviewRef = typeof item.interviewId === 'object' ? item.interviewId : null;

                return (
                  <div
                    key={item._id}
                    className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg"
                  >
                    {/* Evaluator header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                          {reviewer?.name ? reviewer.name.charAt(0) : 'E'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{reviewer?.name || 'Evaluator'}</div>
                          <div className="text-[11px] text-slate-400">
                            {reviewer?.role || 'INTERVIEWER'} • {reviewer?.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <RecommendationBadge recommendation={item.overallRecommendation} size="md" />
                        {item.submittedAt && (
                          <span className="text-[11px] text-slate-500">
                            {format(new Date(item.submittedAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interview Context if Candidate view */}
                    {interviewRef && (
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="font-semibold text-slate-300">{interviewRef.title}</span>
                        <span>({interviewRef.type})</span>
                      </div>
                    )}

                    {/* Ratings Grid */}
                    {item.ratings && item.ratings.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        {item.ratings.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-400">{r.category}</span>
                            <div className="flex items-center gap-1 font-bold text-amber-400">
                              <span>{r.score}</span>
                              <Star className="w-3 h-3 fill-amber-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Strengths & Red Flags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {item.strengths && item.strengths.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> Strengths
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.strengths.map((str, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]"
                              >
                                {str}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.redFlags && item.redFlags.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                            <AlertOctagon className="w-3.5 h-3.5" /> Concerns / Red Flags
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.redFlags.map((rf, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]"
                              >
                                {rf}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5 text-brand-400" /> Evaluation Notes
                      </span>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.notes}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-800/80">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
