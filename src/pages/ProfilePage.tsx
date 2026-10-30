import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { User, Key, Shield, CheckCircle2, AlertCircle, CreditCard, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { PaymentTransaction } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await api.getMyPayments();
      if (res.success && res.payments) {
        setPayments(res.payments);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await api.updateProfile({ name });
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Name updated successfully.' });
        refreshUser();
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Update failed.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPassMsg({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPassMsg({ type: 'error', text: res.message || 'Password change failed.' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Error changing password.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEOHead title="Account Settings" description="Manage your user profile, security credentials, and plan." noIndex={true} />

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal details, subscription plan, and billing history.</p>
      </div>

      {/* Subscription Plan Card */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Membership</span>
          </div>
          <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-extrabold uppercase">
            {user?.plan || 'Free'} Plan
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h3 className="text-xl font-black text-white capitalize">DocuMorph {user?.plan || 'Free'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.plan === 'pro'
                ? 'High-speed processing, 25GB vault, and unlimited batches active.'
                : user?.plan === 'enterprise'
                ? 'Unlimited file size and dedicated cluster processing active.'
                : 'Free tier with standard 50MB file limit and basic queue.'}
            </p>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <span>{user?.plan === 'free' ? 'Upgrade to Pro ($4/mo)' : 'Manage Subscription'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Profile Info */}
      <form onSubmit={handleUpdateName} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
          <User className="w-4 h-4 text-slate-500" />
          <span>Profile Information</span>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
        >
          Save Changes
        </button>
      </form>

      {/* Payment & Invoice History */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span>Billing &amp; Invoices</span>
          </div>
          <span className="text-[11px] text-slate-400">USD Billing</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No payment records found yet. Upgrade to Professional ($4/mo) to unlock premium features.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-2 font-medium">Transaction ID</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Channel</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="text-slate-700">
                    <td className="py-2.5 font-mono text-[11px] font-medium">{p.tranId}</td>
                    <td className="py-2.5 font-bold capitalize">{p.plan}</td>
                    <td className="py-2.5 font-bold text-slate-900">
                      {p.currency === 'BDT' ? `৳${p.amount}` : `$${p.amount}`}
                    </td>
                    <td className="py-2.5 text-slate-500">{p.cardType || 'SSLCommerz'}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          p.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
          <Key className="w-4 h-4 text-slate-500" />
          <span>Change Password</span>
        </div>

        {passMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {passMsg.text}
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};
