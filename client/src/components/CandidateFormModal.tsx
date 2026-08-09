import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { TimezoneSelector } from './TimezoneSelector';
import { candidateApi } from '../api/candidateApi';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidate: any) => void;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const res = await candidateApi.createCandidate({ name, email, timezone, notes });
      if (res.success) {
        setName('');
        setEmail('');
        setNotes('');
        onSuccess(res.candidate);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Candidate">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Candidate Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah.j@example.com"
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Candidate Timezone</label>
          <TimezoneSelector value={timezone} onChange={setTimezone} className="w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Notes (Optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key skills, position applied for..."
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Candidate
          </Button>
        </div>
      </form>
    </Modal>
  );
};
