import React, { useEffect, useState } from 'react';
import { templateApi } from '../api/templateApi';
import { Template } from '../types';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TemplateFormModal } from '../components/TemplateFormModal';
import { FileText, Plus, Clock, Trash2 } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await templateApi.getTemplates();
      if (res.success) {
        setTemplates(res.templates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this template?')) {
      try {
        await templateApi.deleteTemplate(id);
        fetchTemplates();
      } catch (err) {
        alert('Failed to delete template');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Interview Templates</h1>
          <p className="text-xs text-slate-400 mt-1">Reusable interview formats (Technical, HR, Managerial, System Design)</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Template
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading templates..." />
      ) : templates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Templates Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Create reusable templates for Technical screens, System Design, or HR interviews to quickly prefill new interview requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => (
            <div
              key={template._id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-100 text-sm">{template.title}</h3>
                  <button
                    onClick={() => handleDelete(template._id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {template.type}
                </span>

                {template.description && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">{template.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{template.duration} Minutes</span>
                </div>
                <div>
                  Hours: <span className="text-slate-200">{template.workingHours?.start || '09:00'} - {template.workingHours?.end || '17:00'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchTemplates()}
      />
    </div>
  );
};
