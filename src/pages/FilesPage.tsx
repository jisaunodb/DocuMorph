import React, { useState, useEffect } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { StoredFile } from '../types';
import {
  FolderOpen,
  Search,
  Upload,
  Trash2,
  Download,
  Star,
  Edit2,
  File,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Cloud,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'pdf' | 'document' | 'image' | 'favorites'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [cloudinaryInfo, setCloudinaryInfo] = useState<{
    connected: boolean;
    cloudName: string;
    apiKey: string;
    secretLength: number;
    message: string;
  } | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [res, cloudStatus] = await Promise.all([
        api.getMyFiles(),
        api.getCloudinaryStatus(),
      ]);
      if (res.success) setFiles(res.files || []);
      if (cloudStatus?.status) setCloudinaryInfo(cloudStatus.status);
    } catch (e) {
      console.error('Failed to load files:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleToggleFavorite = async (id: string) => {
    await api.toggleFavorite(id);
    loadFiles();
  };

  const handleDeleteFile = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this file?')) {
      await api.deleteFile(id);
      loadFiles();
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!newName.trim()) return;
    await api.renameFile(id, newName.trim());
    setEditingId(null);
    setNewName('');
    loadFiles();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filtered = files.filter((f) => {
    const matchesSearch =
      f.currentName.toLowerCase().includes(search.toLowerCase()) ||
      f.originalName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCat === 'favorites') return f.isFavorite;
    if (filterCat !== 'all') return f.category === filterCat;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEOHead title="My Documents Vault" description="Organize, rename, download, and delete your vault files." noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal documents, processed outputs, and saved assets.
          </p>
        </div>
      </div>

      {/* Cloudinary Diagnostic Banner */}
      {cloudinaryInfo && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
            cloudinaryInfo.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          {cloudinaryInfo.connected ? (
            <Cloud className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <span>Cloudinary Cloud Storage:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-extrabold ${
                  cloudinaryInfo.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {cloudinaryInfo.connected ? 'Connected' : 'Action Needed'}
              </span>
              <span className="text-slate-500 font-normal">
                (Cloud: <strong className="font-semibold text-slate-700">{cloudinaryInfo.cloudName}</strong>, Key: <strong className="font-semibold text-slate-700">{cloudinaryInfo.apiKey}</strong>)
              </span>
            </div>
            <p className="leading-relaxed">
              {cloudinaryInfo.connected ? (
                'Your Cloudinary credentials are fully validated. Processed outputs and files sync to Cloudinary storage.'
              ) : (
                <span>
                  <strong>Diagnostic Status:</strong> {cloudinaryInfo.message}
                  <br />
                  <span className="text-amber-800">
                    💡 <strong>Tip:</strong> In your Cloudinary console (<strong>console.cloudinary.com</strong> &gt; Settings &gt; API Keys), copy the 27-28 character <em>API Secret</em>. Please ensure you do not use your account login password.
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Controls Bar: Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved files by name..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'image', label: 'Images' },
            { id: 'document', label: 'Documents' },
            { id: 'favorites', label: 'Starred' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCat(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterCat === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading vault documents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No documents found</p>
            <p className="text-[11px] text-slate-400">
              Files created using any conversion tool will be automatically cataloged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Created</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {editingId === f._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="p-1 text-xs border border-slate-300 rounded outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(f._id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleFavorite(f._id)}
                            className={`p-1 rounded transition ${
                              f.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                          {f.thumbnailUrl ? (
                            <img
                              src={f.thumbnailUrl}
                              alt={f.currentName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100 flex-shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                              {f.fileType ? f.fileType.slice(0, 3) : 'DOC'}
                            </div>
                          )}
                          <span className="truncate max-w-[240px] text-slate-900">{f.currentName}</span>
                          <button
                            onClick={() => {
                              setEditingId(f._id);
                              setNewName(f.currentName);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {f.category}
                        </span>
                        {f.cloudinaryUrl && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                            <Cloud className="w-2.5 h-2.5" />
                            <span>Cloud</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{formatBytes(f.fileSize)}</td>
                    <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1">
                      <a
                        href={f.cloudinaryUrl || `/api/files/${f._id}/download`}
                        download={f.currentName}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <a
                        href={f.cloudinaryUrl || `/api/files/${f._id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Open file in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(f._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
