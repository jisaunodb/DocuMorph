import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Sparkles, CheckCircle2, Shield, ArrowRight, Mail, Key, User as UserIcon } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalReason, closeAuthModal, login, register, googleLogin } = useAuth();
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'register') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.success) setError(res.message || 'Registration failed.');
      } else {
        const res = await login(email, password);
        if (!res.success) setError(res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (type: 'admin' | 'user') => {
    setLoading(true);
    setError('');
    if (type === 'admin') {
      await login('admin@documorph.io', 'Admin@123456');
    } else {
      await login('alex.vance@example.com', 'User@123456');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    // Google OAuth architecture simulation with instant access
    await googleLogin('google.user@example.com', 'Google User');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Header */}
        <div className="relative p-6 bg-slate-900 text-white">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Document Ready for Processing</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {tab === 'register' ? 'Create a Free Account to Continue' : 'Sign in to Continue'}
          </h3>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {authModalReason} Your uploaded files are safe and will be processed immediately upon sign in.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Private & Encrypted</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>No Re-upload Needed</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work or Personal Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : tab === 'register' ? 'Sign Up & Continue Conversion' : 'Sign In & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="mt-4">
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Instant Test Accounts:</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline"
              >
                Demo User
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="text-slate-900 hover:text-indigo-600 font-semibold underline"
              >
                Demo Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
