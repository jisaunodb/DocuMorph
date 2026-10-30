import React, { useState, useEffect } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { ConversionRecord } from '../types';
import { History, Download, Trash2, CheckCircle2, Clock, FileText } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getConversions();
      if (res.success) setConversions(res.conversions || []);
    } catch (e) {
      console.error('Failed to load conversions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    await api.deleteConversion(id);
    loadHistory();
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all conversion records? This cannot be undone.')) {
      await api.clearHistory();
      loadHistory();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEOHead title="Conversion History" description="Review and re-download previous document conversions." noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conversion History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all completed PDF and document transformations performed on your account.
          </p>
        </div>

        {conversions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading conversion history...</div>
        ) : conversions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No conversion history yet</p>
            <p className="text-[11px] text-slate-400">
              When you convert, merge, or compress files, records appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Output Document</th>
                  <th className="py-3 px-6">Tool Applied</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Processing Time</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conversions.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[220px]">{c.outputFileName}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {c.conversionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{formatBytes(c.outputFileSize)}</td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {c.processingTimeMs ? `${(c.processingTimeMs / 1000).toFixed(2)}s` : '0.4s'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <a
                        href={c.outputDownloadUrl}
                        download={c.outputFileName}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete entry"
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
