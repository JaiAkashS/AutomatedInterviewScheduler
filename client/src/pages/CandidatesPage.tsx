import React, { useEffect, useState } from 'react';
import { candidateApi } from '../api/candidateApi';
import { Candidate } from '../types';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CandidateFormModal } from '../components/CandidateFormModal';
import { Users, UserPlus, Mail, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await candidateApi.getCandidates();
      if (res.success) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Candidate Profiles</h1>
          <p className="text-xs text-slate-400 mt-1">Manage candidate information and preferred timezones</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={<UserPlus className="w-4 h-4" />}>
          Add Candidate
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading candidates..." />
      ) : candidates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Candidates Added Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Add candidates to create interview scheduling links for technical, HR, or executive rounds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((candidate) => (
            <div
              key={candidate._id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20">
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{candidate.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{candidate.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-400" /> Timezone:
                  </span>
                  <span className="font-medium text-slate-200">{candidate.timezone || 'America/New_York'}</span>
                </div>

                {candidate.createdAt && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Added:
                    </span>
                    <span className="text-slate-300">{format(new Date(candidate.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {candidate.notes && (
                  <p className="text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 italic mt-2">
                    "{candidate.notes}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CandidateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCandidates()}
      />
    </div>
  );
};
