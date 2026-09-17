import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviewApi } from '../api/interviewApi';
import { Interview } from '../types';
import { InterviewTable } from '../components/InterviewTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { FeedbackModal } from '../components/FeedbackModal';
import { ScorecardViewModal } from '../components/ScorecardViewModal';
import { PlusCircle, Search } from 'lucide-react';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [scorecardInterview, setScorecardInterview] = useState<Interview | null>(null);


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
    if (window.confirm('Cancel this interview?')) {
      try {
        await interviewApi.cancelInterview(id);
        fetchInterviews();
      } catch (err) {
        alert('Failed to cancel');
      }
    }
  };

  const handleReschedule = async (id: string) => {
    try {
      const res = await interviewApi.rescheduleInterview(id);
      alert(`Reschedule link:\n${res.schedulingUrl}`);
      fetchInterviews();
    } catch (err) {
      alert('Failed to initiate reschedule');
    }
  };

  // Filtered interviews
  const filteredInterviews = interviews.filter((item) => {
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'PENDING'
        ? item.status === 'SCHEDULING' || item.status === 'RESCHEDULE_REQUESTED'
        : item.status === activeFilter;

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.candidateId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.candidateId?.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Pending Candidate', value: 'PENDING' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Interview Requests</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and track candidate interview statuses</p>
        </div>

        <Link to="/interviews/new">
          <Button icon={<PlusCircle className="w-4 h-4" />}>Create Interview</Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === tab.value
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or title..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading interviews..." />
      ) : (
        <InterviewTable
          interviews={filteredInterviews}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          onSelect={(item) => setScorecardInterview(item)}
          onOpenFeedback={(item) => setFeedbackInterview(item)}
          onOpenScorecard={(item) => setScorecardInterview(item)}
        />
      )}

      {/* Interviewer Feedback Submission Modal */}
      {feedbackInterview && (
        <FeedbackModal
          isOpen={Boolean(feedbackInterview)}
          onClose={() => setFeedbackInterview(null)}
          interview={feedbackInterview}
          onSuccess={() => {
            fetchInterviews();
          }}
        />
      )}

      {/* Candidate Scorecard Viewer Modal */}
      {scorecardInterview && (
        <ScorecardViewModal
          isOpen={Boolean(scorecardInterview)}
          onClose={() => setScorecardInterview(null)}
          interview={scorecardInterview}
          onOpenSubmitFeedback={() => {
            setFeedbackInterview(scorecardInterview);
          }}
        />
      )}
    </div>
  );
};

