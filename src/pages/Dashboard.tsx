import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { StoredFile, ConversionRecord } from '../types';
import { TOOLS } from '../constants/tools';
import {
  FolderOpen,
  History,
  FileText,
  HardDrive,
  Layers,
  ArrowRight,
  Download,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesRes, convsRes] = await Promise.all([
          api.getMyFiles(),
          api.getConversions(),
        ]);
        if (filesRes.success) setFiles(filesRes.files || []);
        if (convsRes.success) setConversions(convsRes.conversions || []);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const maxStorage =
    user?.plan === 'enterprise'
      ? 500 * 1024 * 1024 * 1024
      : user?.plan === 'pro'
      ? 25 * 1024 * 1024 * 1024
      : 500 * 1024 * 1024;
  const storagePercentage = Math.min(100, Math.round(((user?.storageUsed || 0) / maxStorage) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead title="User Workspace Dashboard" description="Manage your PDF conversions, files, and vault storage." noIndex={true} />

      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Personal Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Explorer'}!
          </h1>
          <p className="text-xs text-slate-300 max-w-lg">
            Manage your document vault, review previous conversion jobs, or jump right into your next PDF task.
          </p>
        </div>

        <Link
          to="/tools"
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-bold rounded-xl shadow transition flex items-center space-x-2"
        >
          <span>Launch New Tool</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Storage Meter Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cloud Storage</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatBytes(user?.storageUsed || 0)}
              <span className="text-xs text-slate-400 font-normal">
                {' '}
                / {user?.plan === 'enterprise' ? '500 GB' : user?.plan === 'pro' ? '25 GB' : '500 MB'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, storagePercentage)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span className="capitalize">{user?.plan || 'Free'} Plan Vault</span>
            {user?.plan === 'free' ? (
              <Link to="/pricing" className="text-rose-600 font-bold hover:underline">
                Get Pro for $4 &rarr;
              </Link>
            ) : (
              <span className="text-emerald-600 font-bold">Active</span>
            )}
          </div>
        </div>

        {/* Total Conversions */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversions Executed</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {user?.conversionsCount || conversions.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Processed securely in your vault</p>
          </div>
          <div className="text-[11px] text-slate-500">
            <Link to="/history" className="text-slate-900 font-semibold hover:underline">
              View complete history &rarr;
            </Link>
          </div>
        </div>

        {/* Files Stored */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Vault Files</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{files.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active documents ready for download</p>
          </div>
          <div className="text-[11px] text-slate-500">
            <Link to="/files" className="text-slate-900 font-semibold hover:underline">
              Open file manager &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Tool Launchers */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Quick Launch Utilities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TOOLS.slice(0, 4).map((tool) => (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition group flex items-center space-x-3"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition">
                <Layers className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                  {tool.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{tool.category}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Conversions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Conversion Jobs</h2>
            <p className="text-xs text-slate-500">Your latest converted output files</p>
          </div>
          <Link to="/history" className="text-xs font-semibold text-slate-900 hover:underline">
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
        ) : conversions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-600">No conversions recorded yet.</p>
            <p className="text-[11px] text-slate-400">Process your first document using any tool above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Output Document</th>
                  <th className="py-3 px-6">Tool</th>
                  <th className="py-3 px-6">Output Size</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conversions.slice(0, 5).map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[200px]">{c.outputFileName}</span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{c.conversionType}</td>
                    <td className="py-3.5 px-6 text-slate-500">{formatBytes(c.outputFileSize)}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <a
                        href={c.outputDownloadUrl}
                        download={c.outputFileName}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
