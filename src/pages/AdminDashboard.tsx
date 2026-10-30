import React, { useState, useEffect } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { SystemStats, User as UserType } from '../types';
import {
  ShieldCheck,
  Users,
  HardDrive,
  Activity,
  Layers,
  Settings,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, settingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminSettings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (settingsRes.success) setSettings(settingsRes.settings);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleActive = async (user: UserType) => {
    await api.updateUserStatus(user._id, { isActive: !user.isActive });
    setStatusMessage(`Updated ${user.email} status.`);
    loadAdminData();
  };

  const handleChangeRole = async (user: UserType, newRole: string) => {
    await api.updateUserStatus(user._id, { role: newRole });
    setStatusMessage(`Updated ${user.email} role to ${newRole}.`);
    loadAdminData();
  };

  const handleChangePlan = async (user: UserType, newPlan: string) => {
    await api.updateUserStatus(user._id, { plan: newPlan });
    setStatusMessage(`Updated ${user.email} plan to ${newPlan}.`);
    loadAdminData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const res = await api.deleteAdminUser(userId);
      if (res.success) {
        setStatusMessage('User account deleted.');
        loadAdminData();
      } else {
        alert(res.message);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateAdminSettings(settings);
    if (res.success) {
      setStatusMessage('System settings saved successfully.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead title="SaaS Administration Console" description="Platform oversight, user management, and system configuration." noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                Superuser
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live server statistics, user accounts, and platform configurations.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8 animate-in fade-in">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</div>
              <div className="text-[11px] text-slate-400">{stats.activeUsers} active accounts</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Total Conversions</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalConversions}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                {stats.successfulConversions} successful
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Vault Files</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalFiles}</div>
              <div className="text-[11px] text-slate-400">Total cataloged assets</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Storage Consumed</span>
                <HardDrive className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {formatBytes(stats.totalStorageBytes)}
              </div>
              <div className="text-[11px] text-slate-400">Across all user accounts</div>
            </div>
          </div>

          {/* Tool Popularity and Recent Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tools */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Top Utilized Tools</h2>
              {stats.topTools.length === 0 ? (
                <p className="text-xs text-slate-400">No conversions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.topTools.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                        {t.count} conversions
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Logs */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Security & Activity Audit Logs</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                {stats.recentLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-2.5 border border-slate-100 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full max-w-md p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
          />

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Plan</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Storage</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-6">
                        <select
                          value={u.plan}
                          onChange={(e) => handleChangePlan(u, e.target.value)}
                          className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold uppercase"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{formatBytes(u.storageUsed)}</td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <h2 className="text-base font-bold text-slate-900">SaaS System Settings</h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Upload File Size (MB)</label>
              <input
                type="number"
                value={settings.maxFileSizeMb || 50}
                onChange={(e) => setSettings({ ...settings, maxFileSizeMb: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Conversion Batch Files</label>
              <input
                type="number"
                value={settings.maxFilesPerBatch || 20}
                onChange={(e) => setSettings({ ...settings, maxFilesPerBatch: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <div className="font-bold text-slate-900">Allow New User Registrations</div>
                <div className="text-[11px] text-slate-500">Allow visitors to create new free accounts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationsEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, registrationsEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <div className="font-bold text-slate-900">Maintenance Mode</div>
                <div className="text-[11px] text-slate-500">Temporarily pause conversion workers</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode ?? false}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Save Configuration
          </button>
        </form>
      )}
    </div>
  );
};
