import React, { useState, useEffect } from 'react';
import { Interview, FeedbackRecommendation, FeedbackRating } from '../types';
import { feedbackApi } from '../api/feedbackApi';
import { Button } from './Button';
import { Modal } from './Modal';
import {
  CheckCheck,
  Check,
  MinusCircle,
  ThumbsDown,
  AlertOctagon,
  Plus,
  X,
  Star,
  Sparkles,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onSuccess: (updatedStatus?: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Technical Depth & Problem Solving',
  'System Design & Architecture',
  'Communication & Clarity',
  'Cultural & Team Fit',
];

const STRENGTH_SUGGESTIONS = [
  'Strong algorithmic reasoning',
  'Clear verbal articulation',
  'Clean modular code structure',
  'Proactive edge case handling',
  'High system design depth',
];

const RED_FLAG_SUGGESTIONS = [
  'Struggled with fundamental algorithms',
  'Hesitation under pressure',
  'Did not test or validate assumptions',
  'Difficulty explaining tradeoffs',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  interview,
  onSuccess,
}) => {
  const [recommendation, setRecommendation] = useState<FeedbackRecommendation>('YES');
  const [ratings, setRatings] = useState<FeedbackRating[]>(
    DEFAULT_CATEGORIES.map((cat) => ({ category: cat, score: 4 }))
  );
  const [strengths, setStrengths] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [redFlagInput, setRedFlagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsCompleted, setMarkAsCompleted] = useState(interview.status === 'SCHEDULED');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && interview?._id) {
      setFetching(true);
      setErrorMsg(null);
      feedbackApi
        .getMyFeedback(interview._id)
        .then((res) => {
          if (res.feedback) {
            setRecommendation(res.feedback.overallRecommendation);
            if (res.feedback.ratings && res.feedback.ratings.length > 0) {
              setRatings(res.feedback.ratings);
            }
            setStrengths(res.feedback.strengths || []);
            setRedFlags(res.feedback.redFlags || []);
            setNotes(res.feedback.notes || '');
          }
        })
        .catch((err) => console.error('Failed to load existing feedback:', err))
        .finally(() => setFetching(false));

      setMarkAsCompleted(interview.status === 'SCHEDULED');
    }
  }, [isOpen, interview]);

  const handleAddStrength = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !strengths.includes(trimmed)) {
      setStrengths([...strengths, trimmed]);
      setStrengthInput('');
    }
  };

  const handleRemoveStrength = (idx: number) => {
    setStrengths(strengths.filter((_, i) => i !== idx));
  };

  const handleAddRedFlag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !redFlags.includes(trimmed)) {
      setRedFlags([...redFlags, trimmed]);
      setRedFlagInput('');
    }
  };

  const handleRemoveRedFlag = (idx: number) => {
    setRedFlags(redFlags.filter((_, i) => i !== idx));
  };

  const handleRatingChange = (category: string, score: number) => {
    setRatings(ratings.map((r) => (r.category === category ? { ...r, score } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMsg('Please enter detailed evaluation notes before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await feedbackApi.submitFeedback({
        interviewId: interview._id,
        overallRecommendation: recommendation,
        ratings,
        strengths,
        redFlags,
        notes: notes.trim(),
        markAsCompleted,
      });

      if (res.success) {
        onSuccess(res.interviewStatus);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const RECOMMENDATION_OPTIONS: {
    value: FeedbackRecommendation;
    title: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    selectedStyle: string;
  }[] = [
    {
      value: 'STRONG_YES',
      title: 'Strong Yes',
      sub: 'Top percentile hire, raises team bar',
      icon: <CheckCheck className="w-5 h-5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50',
      selectedStyle: 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30',
    },
    {
      value: 'YES',
      title: 'Yes',
      sub: 'Solid hire, meets all core requirements',
      icon: <Check className="w-5 h-5 text-teal-400" />,
      color: 'hover:border-teal-500/50',
      selectedStyle: 'border-teal-500 bg-teal-500/15 text-teal-300 ring-2 ring-teal-500/30',
    },
    {
      value: 'NEUTRAL',
      title: 'Neutral',
      sub: 'Borderline or conflicting signals',
      icon: <MinusCircle className="w-5 h-5 text-amber-400" />,
      color: 'hover:border-amber-500/50',
      selectedStyle: 'border-amber-500 bg-amber-500/15 text-amber-300 ring-2 ring-amber-500/30',
    },
    {
      value: 'NO',
      title: 'No',
      sub: 'Did not meet competency bar',
      icon: <ThumbsDown className="w-5 h-5 text-orange-400" />,
      color: 'hover:border-orange-500/50',
      selectedStyle: 'border-orange-500 bg-orange-500/15 text-orange-300 ring-2 ring-orange-500/30',
    },
    {
      value: 'STRONG_NO',
      title: 'Strong No',
      sub: 'Definite reject, critical deficiencies',
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      color: 'hover:border-rose-500/50',
      selectedStyle: 'border-rose-500 bg-rose-500/15 text-rose-300 ring-2 ring-rose-500/30',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Interviewer Scorecard: ${interview.candidateId?.name || 'Candidate'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-200">
        {/* Candidate & Interview Header Strip */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 font-medium">Interview:</span>{' '}
            <span className="font-semibold text-slate-200">{interview.title}</span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-slate-400">{interview.type} ({interview.duration} mins)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Private Scorecard
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Overall Hiring Recommendation */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-400" />
            Overall Recommendation <span className="text-rose-400">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {RECOMMENDATION_OPTIONS.map((opt) => {
              const isSelected = recommendation === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setRecommendation(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? opt.selectedStyle
                      : `bg-slate-950/60 border-slate-800 text-slate-400 ${opt.color}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{opt.title}</span>
                    {opt.icon}
                  </div>
                  <span className="text-[10px] leading-tight text-slate-500 mt-2 block">
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Competency Ratings (1-5 Scale) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            Competency Evaluation (1 to 5)
          </label>

          <div className="grid grid-cols-1 gap-3 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            {ratings.map((rating) => (
              <div
                key={rating.category}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60 last:border-b-0 last:pb-0"
              >
                <span className="text-xs font-medium text-slate-300">{rating.category}</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const active = rating.score >= val;
                    return (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleRatingChange(rating.category, val)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                          active
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                  <span className="text-[10px] text-slate-500 font-semibold ml-2 w-14 text-right">
                    {rating.score === 5
                      ? 'Exceptional'
                      : rating.score === 4
                      ? 'Strong'
                      : rating.score === 3
                      ? 'Average'
                      : rating.score === 2
                      ? 'Marginal'
                      : 'Poor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Strengths */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Demonstrated Strengths
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={strengthInput}
              onChange={(e) => setStrengthInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStrength(strengthInput);
                }
              }}
              placeholder="e.g. Clean async design, handled scale constraints..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddStrength(strengthInput)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STRENGTH_SUGGESTIONS.map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleAddStrength(sug)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              >
                + {sug}
              </button>
            ))}
          </div>

          {/* Tag Chips */}
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {strengths.map((str, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs"
                >
                  <span>{str}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStrength(idx)}
                    className="hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4. Red Flags & Concerns */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Red Flags & Areas of Concern
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={redFlagInput}
              onChange={(e) => setRedFlagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRedFlag(redFlagInput);
                }
              }}
              placeholder="e.g. Superficial explanations, weak concurrency grasp..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddRedFlag(redFlagInput)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {RED_FLAG_SUGGESTIONS.map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleAddRedFlag(sug)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                + {sug}
              </button>
            ))}
          </div>

          {/* Tag Chips */}
          {redFlags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {redFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs"
                >
                  <span>{flag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRedFlag(idx)}
                    className="hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. Detailed Notes */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-400" />
            Detailed Evaluation Notes <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Document the technical problems presented, code quality, approach to edge cases, responses to hints, and overall justification for your recommendation..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>

        {/* 6. Mark as Completed Checkbox */}
        {interview.status === 'SCHEDULED' && (
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center gap-3">
            <input
              type="checkbox"
              id="markCompleted"
              checked={markAsCompleted}
              onChange={(e) => setMarkAsCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 bg-slate-900 border-slate-700 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="markCompleted" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-slate-200">Advance Interview Status to COMPLETED</span>
              <p className="text-[11px] text-slate-500">
                Marking completed updates the recruitment pipeline and moves this interview to the completed archive.
              </p>
            </label>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting || fetching} icon={<CheckCheck className="w-4 h-4" />}>
            Submit Evaluation Scorecard
          </Button>
        </div>
      </form>
    </Modal>
  );
};
