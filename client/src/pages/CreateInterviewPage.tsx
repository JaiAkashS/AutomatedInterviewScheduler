import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '../api/interviewApi';
import { candidateApi } from '../api/candidateApi';
import { templateApi } from '../api/templateApi';
import { Candidate, Template } from '../types';
import { Button } from '../components/Button';
import { TimezoneSelector } from '../components/TimezoneSelector';
import { CopyLinkButton } from '../components/CopyLinkButton';
import { CandidateFormModal } from '../components/CandidateFormModal';
import { Calendar, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';

export const CreateInterviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  
  // Inline candidate fields
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateTimezone, setCandidateTimezone] = useState('America/New_York');

  // Interview settings
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Technical Interview');
  const [duration, setDuration] = useState(60);
  const [schedulingWindowDays, setSchedulingWindowDays] = useState(7);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [minimumNotice, setMinimumNotice] = useState(12);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [expirationDays, setExpirationDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState<{ interview: any; schedulingUrl: string } | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candRes, tmplRes] = await Promise.all([
          candidateApi.getCandidates(),
          templateApi.getTemplates(),
        ]);
        if (candRes.success) setCandidates(candRes.candidates);
        if (tmplRes.success) setTemplates(tmplRes.templates);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find((t) => t._id === templateId);
    if (tmpl) {
      setTitle(tmpl.title);
      setType(tmpl.type);
      setDuration(tmpl.duration);
      if (tmpl.workingHours) {
        setWorkStart(tmpl.workingHours.start);
        setWorkEnd(tmpl.workingHours.end);
      }
      setMinimumNotice(tmpl.minimumNotice);
    }
  };

  const handleCandidateDropdown = (candId: string) => {
    setSelectedCandidateId(candId);
    if (candId) {
      const cand = candidates.find((c) => c._id === candId);
      if (cand) {
        setCandidateName(cand.name);
        setCandidateEmail(cand.email);
        setCandidateTimezone(cand.timezone || 'America/New_York');
      }
    } else {
      setCandidateName('');
      setCandidateEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title) {
      setError('Interview title is required.');
      return;
    }

    if (!selectedCandidateId && (!candidateName || !candidateEmail)) {
      setError('Please select or provide candidate details.');
      return;
    }

    setLoading(true);
    try {
      const res = await interviewApi.createInterview({
        candidateId: selectedCandidateId || undefined,
        candidateName: !selectedCandidateId ? candidateName : undefined,
        candidateEmail: !selectedCandidateId ? candidateEmail : undefined,
        candidateTimezone,
        title,
        type,
        duration: Number(duration),
        schedulingWindowDays: Number(schedulingWindowDays),
        workingHours: { start: workStart, end: workEnd },
        minimumNotice: Number(minimumNotice),
        timezone,
        expirationDays: Number(expirationDays),
      });

      if (res.success) {
        setCreatedResult(res);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create interview request.');
    } finally {
      setLoading(false);
    }
  };

  if (createdResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Interview Created Successfully!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Send this unique scheduling link to candidate <span className="text-slate-200 font-semibold">{createdResult.interview.candidateId?.name}</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Scheduling Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdResult.schedulingUrl}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 text-xs font-mono select-all focus:outline-none"
              />
              <CopyLinkButton url={createdResult.schedulingUrl} size="md" variant="primary" />
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              View All Interviews
            </Button>
            <Button onClick={() => setCreatedResult(null)}>Create Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/interviews')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Interview Request</h1>
          <p className="text-xs text-slate-400 mt-1">Configure candidate parameters and generate an automated invitation link</p>
        </div>
      </div>

      {error && <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Template Prefill Selector */}
        {templates.length > 0 && (
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-slate-300">Quick Fill from Template:</span>
            </div>
            <select
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="">-- Choose Template --</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.duration} mins)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Section 1: Candidate Information */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">1. Candidate Information</h3>
            <button
              type="button"
              onClick={() => setShowCandidateModal(true)}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add New Candidate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Candidate</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => handleCandidateDropdown(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">-- Or enter candidate manually below --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Candidate Timezone</label>
              <TimezoneSelector value={candidateTimezone} onChange={setCandidateTimezone} className="w-full" />
            </div>

            {!selectedCandidateId && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Interview Configuration */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">2. Interview Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interview Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer Technical Round"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interview Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="HR Screening">HR Screening</option>
                <option value="Technical Interview">Technical Interview</option>
                <option value="System Design">System Design</option>
                <option value="Managerial Interview">Managerial Interview</option>
                <option value="Executive Round">Executive Round</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scheduling Window</label>
              <select
                value={schedulingWindowDays}
                onChange={(e) => setSchedulingWindowDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value={5}>Next 5 Days</option>
                <option value={7}>Next 7 Days</option>
                <option value={14}>Next 14 Days</option>
                <option value={30}>Next 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Availability & Constraints */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">3. Scheduling Constraints</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Working Start Time</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Working End Time</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Minimum Notice (Hours)</label>
              <input
                type="number"
                min={1}
                value={minimumNotice}
                onChange={(e) => setMinimumNotice(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={() => navigate('/interviews')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="px-8">
            Create Interview & Generate Link
          </Button>
        </div>
      </form>

      <CandidateFormModal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        onSuccess={(cand) => {
          setCandidates((prev) => [cand, ...prev]);
          setSelectedCandidateId(cand._id);
          setCandidateName(cand.name);
          setCandidateEmail(cand.email);
        }}
      />
    </div>
  );
};
