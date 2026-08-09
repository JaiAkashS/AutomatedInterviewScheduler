import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { templateApi } from '../api/templateApi';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: any) => void;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Technical Interview');
  const [duration, setDuration] = useState(60);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [minimumNotice, setMinimumNotice] = useState(12);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title) {
      setError('Template title is required');
      return;
    }

    setLoading(true);
    try {
      const res = await templateApi.createTemplate({
        title,
        type,
        duration: Number(duration),
        workingHours: { start: workStart, end: workEnd },
        minimumNotice: Number(minimumNotice),
        description,
      });

      if (res.success) {
        onSuccess(res.template);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Interview Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Template Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Standard Backend Tech Screen"
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Interview Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="HR Screening">HR Screening</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="System Design">System Design</option>
              <option value="Managerial Interview">Managerial Interview</option>
              <option value="Final Executive Round">Final Executive Round</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Duration (Minutes)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Working Hours</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Minimum Notice (Hours)</label>
            <input
              type="number"
              min={1}
              value={minimumNotice}
              onChange={(e) => setMinimumNotice(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Overview of expectations or format..."
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Template
          </Button>
        </div>
      </form>
    </Modal>
  );
};
