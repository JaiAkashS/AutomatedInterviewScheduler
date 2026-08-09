import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';

export const CandidateLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [useToken, setUseToken] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.candidateLogin(email, useToken ? token : undefined, !useToken ? password : undefined);
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        await refreshUser();
        navigate('/candidate/portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Candidate authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Candidate Portal Sign In</h2>
        <p className="text-xs text-slate-400 mt-1">Access your scheduled interview details & meeting links</p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Your Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {useToken ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Scheduling Code (Optional)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste code from invitation link"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password (If set)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (or switch to code below)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => setUseToken(!useToken)}
            className="text-brand-400 hover:text-brand-300 font-semibold"
          >
            {useToken ? 'Use Password instead' : 'Have a Scheduling Code? Use Code'}
          </button>
        </div>

        <Button type="submit" loading={loading} className="w-full py-2.5" icon={<ArrowRight className="w-4 h-4" />}>
          Access Candidate Portal
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        Are you a Recruiter?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline">
          Recruiter Sign In
        </Link>
      </div>
    </div>
  );
};
