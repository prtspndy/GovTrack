import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await login(email, password);
    if (res.success) {
      if (redirect) {
        navigate(redirect);
      } else if (email.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickDemo = async (role: 'citizen' | 'admin') => {
    setError(null);
    const ok = await quickLogin(role);
    if (ok) {
      if (redirect) {
        navigate(redirect);
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900 text-amber-400 mb-3 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to GovTrack Portal
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Official access for Citizens and Authorized Departmental Officers
          </p>
        </div>

        {/* 1-Click Demo Login Box */}
        <div className="mt-6 mx-4 sm:mx-0 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span>Instant Demo Account Sign-In (No Typing Required)</span>
          </div>
          <p className="text-[11px] text-blue-800 mb-3">
            Choose an account persona below to evaluate the complete end-to-end workflow:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              className="px-3 py-2 rounded-lg bg-white border border-blue-300 text-blue-900 hover:bg-blue-100 text-xs font-semibold text-left shadow-xs transition-colors"
            >
              <div className="font-bold text-xs">👤 Citizen Persona</div>
              <div className="text-[10px] text-slate-500 truncate">citizen@govtrack.demo</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 text-xs font-semibold text-left shadow-xs transition-colors"
            >
              <div className="font-bold text-xs">🛡️ Officer Persona</div>
              <div className="text-[10px] text-slate-500 truncate">admin@govtrack.demo</div>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New citizen to the digital portal?{' '}
                <Link to="/register" className="font-semibold text-blue-700 hover:underline">
                  Create citizen account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
