import React, { useState, useRef } from 'react';
import { ToolMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  Eye,
  File,
  Loader2,
  Lock,
  ExternalLink,
  X,
  Check,
  Copy,
} from 'lucide-react';

interface ToolWorkspaceProps {
  tool: ToolMeta;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [options, setOptions] = useState<Record<string, any>>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: '20',
    pages: '1',
    level: 'medium',
    angle: '90',
    watermarkText: 'CONFIDENTIAL',
    opacity: '0.3',
    position: 'bottom-center',
    language: 'eng',
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState<{
    downloadUrl: string;
    previewUrl?: string;
    fileName: string;
    fileSize: number;
    processingTimeMs: number;
    downloadId: string;
    mimeType?: string;
    textContent?: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyText = async () => {
    if (!result?.textContent) return;
    try {
      await navigator.clipboard.writeText(result.textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  const handleDownloadFile = async () => {
    if (!result) return;
    try {
      setIsDownloading(true);
      const blob = await api.downloadProcessedBlob(result.downloadUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      console.warn('Direct blob download fallback:', e);
      window.open(result.downloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // File Drop / Selection handler
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setError(null);

    const newFiles = Array.from(selectedFiles);
    // Validate extensions
    const invalid = newFiles.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return !tool.acceptedFormats.some((allowed) => allowed.toLowerCase() === ext);
    });

    if (invalid.length > 0) {
      setError(`Some files were skipped because they do not match ${tool.acceptedFormats.join(', ')}`);
      return;
    }

    if (tool.maxFiles === 1) {
      setFiles([newFiles[0]]);
    } else {
      setFiles((prev) => [...prev, ...newFiles].slice(0, tool.maxFiles));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) setResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // The core execution routine
  const executeConversion = async () => {
    if (files.length === 0 && !textInput.trim()) {
      setError('Please upload at least one file to process.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStep('Preparing document stream...');

    try {
      const formData = new FormData();

      // Attach files
      files.forEach((file) => {
        formData.append('files', file);
      });

      if (textInput) {
        formData.append('text', textInput);
      }

      formData.append('options', JSON.stringify(options));

      setProcessingStep('Applying document transformations...');

      const res = await api.processTool(tool.slug, formData);

      if (!res.success) {
        throw new Error(res.message || 'Processing failed.');
      }

      setProcessingStep('Finalizing output file...');
      setResult(res.result);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Button Click Handler with Guest Interception
  const handleProcessClick = () => {
    if (files.length === 0 && !textInput.trim()) {
      setError('Please select or upload your files first.');
      return;
    }

    // GUEST FLOW INTERCEPTION
    if (!isAuthenticated) {
      openAuthModal(
        `Create a free account to convert your documents. Your uploaded files will be processed automatically without re-uploading.`,
        () => {
          // Callback executed seamlessly after login/register!
          executeConversion();
        }
      );
      return;
    }

    // Already authenticated
    executeConversion();
  };

  const resetAll = () => {
    setFiles([]);
    setTextInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Tool Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              <span>{tool.category}</span>
              {tool.badge && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{tool.badge}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{tool.name}</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">{tool.shortDesc}</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Accepted: {tool.acceptedFormats.join(', ')}</span>
            <span>•</span>
            <span>Max size: 50MB</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-sm text-red-700 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <div className="font-semibold">Unable to process document</div>
              <div className="text-xs text-red-600 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* State 1: Success State */}
        {result ? (
          <div className="p-8 bg-emerald-50/60 border border-emerald-200/80 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Your Document is Ready!</h3>
              <p className="text-xs text-slate-600">
                Processed in {(result.processingTimeMs / 1000).toFixed(2)}s • Output file size:{' '}
                {formatFileSize(result.fileSize)}
              </p>
            </div>

            {/* Document Action Card */}
            <div className="max-w-xl mx-auto p-4 bg-white rounded-2xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-left shadow-sm">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{result.fileName}</div>
                  <div className="text-[11px] text-slate-400">{formatFileSize(result.fileSize)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap">
                {/* View / Preview Button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Preview</span>
                </button>

                {/* Download Button with Blob fallback */}
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow flex items-center space-x-1.5 transition disabled:opacity-75"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                </button>

                {/* Open in New Tab Button */}
                <a
                  href={`${result.downloadUrl}?inline=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                  title="Open file in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Interactive Extracted Text Content (For PDF to Text, OCR, Summarizer, Markdown) */}
            {result.textContent && (
              <div className="max-w-2xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden text-left animate-in fade-in">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Extracted Plain Text</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      • {result.textContent.split(/\s+/).filter(Boolean).length} words • {result.textContent.length} characters
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-1.5 shadow-xs transition"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all bg-slate-900/90 selection:bg-emerald-500 selection:text-slate-950">
                  {result.textContent}
                </div>
              </div>
            )}

            {/* Embedded Live Preview */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Document Visual Preview</span>
                  <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    High Resolution
                  </span>
                </span>
                <div className="flex items-center space-x-3">
                  <a
                    href={`${result.downloadUrl}?inline=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 transition"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    Expand Full Screen
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-100/60 flex flex-col justify-center items-center min-h-[260px]">
                <div className="relative group max-w-full flex justify-center">
                  <img
                    src={result.previewUrl || `/api/tools/preview/${result.downloadId}`}
                    alt={result.fileName}
                    className="max-h-80 max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                  />
                </div>
                <div className="mt-3 flex items-center justify-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Processed &amp; Verified</span>
                  </span>
                  <span>•</span>
                  <a
                    href={`${result.downloadUrl}?inline=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Open raw file in separate tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Process Another File
              </button>
            </div>

            {/* Full Screen / Large Preview Modal */}
            {isPreviewOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
                  {/* Modal Header */}
                  <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white truncate">{result.fileName}</div>
                        <div className="text-[11px] text-slate-400">{formatFileSize(result.fileSize)} • DocuMorph High-Fidelity Preview</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`${result.downloadUrl}?inline=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center space-x-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        disabled={isDownloading}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(false)}
                        className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 bg-slate-100 p-4 overflow-auto flex flex-col items-center justify-center min-h-[60vh]">
                    <img
                      src={result.previewUrl || `/api/tools/preview/${result.downloadId}`}
                      alt={result.fileName}
                      className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-xl border border-slate-200 bg-white"
                    />
                    <div className="mt-4 flex items-center space-x-4">
                      <a
                        href={`${result.downloadUrl}?inline=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center space-x-2 shadow-xs transition"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                        <span>Open full document in reader tab</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Upload Zone */}
            {tool.slug === 'text-to-pdf' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Paste Text or Code</label>
                <textarea
                  rows={6}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste meeting notes, articles, plain text, or markdown here..."
                  className="w-full p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="group relative cursor-pointer border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-3xl p-8 sm:p-12 text-center bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.maxFiles > 1}
                accept={tool.acceptedFormats.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                <UploadCloud className="w-7 h-7 text-slate-700 group-hover:text-emerald-600 transition" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  Click to browse or drag and drop your {tool.name.toLowerCase()} files
                </p>
                <p className="text-xs text-slate-500">
                  Supports {tool.acceptedFormats.join(', ')} • Up to {tool.maxFiles} file{tool.maxFiles > 1 ? 's' : ''} • Max 50MB
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 pointer-events-none"
              >
                Choose File{tool.maxFiles > 1 ? 's' : ''}
              </button>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Selected Files ({files.length})</span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                          <File className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">{formatFileSize(file.size)}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tool-specific configuration options */}
            {(files.length > 0 || tool.slug === 'text-to-pdf') && (
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Processing Options</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Image to PDF options */}
                  {['image-to-pdf', 'jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf'].includes(tool.slug) && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Page Size</label>
                        <select
                          value={options.pageSize}
                          onChange={(e) => setOptions({ ...options, pageSize: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="a4">A4 (Standard)</option>
                          <option value="letter">US Letter</option>
                          <option value="fit">Fit to Image</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Orientation</label>
                        <select
                          value={options.orientation}
                          onChange={(e) => setOptions({ ...options, orientation: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Margin</label>
                        <select
                          value={options.margin}
                          onChange={(e) => setOptions({ ...options, margin: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="0">No Margin</option>
                          <option value="20">Small (20pt)</option>
                          <option value="40">Wide (40pt)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Split, Extract, and Delete Pages options */}
                  {['split-pdf', 'extract-pages', 'remove-pages', 'delete-pdf-pages'].includes(tool.slug) && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">
                        {tool.slug.includes('remove') || tool.slug.includes('delete')
                          ? 'Page Numbers to Remove (e.g. 1, 3, 5)'
                          : 'Page Numbers to Extract (e.g. 1, 2, 4-6)'}
                      </label>
                      <input
                        type="text"
                        value={options.pages || '1'}
                        onChange={(e) => setOptions({ ...options, pages: e.target.value })}
                        placeholder="1, 2, 3"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Separate individual pages with commas.
                      </p>
                    </div>
                  )}

                  {/* Organize PDF options */}
                  {tool.slug === 'organize-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">
                        New Page Sequence (e.g. 3, 1, 2, 4)
                      </label>
                      <input
                        type="text"
                        value={options.order || ''}
                        onChange={(e) => setOptions({ ...options, order: e.target.value })}
                        placeholder="e.g. 2, 1, 4, 3 (Leave empty for automatic cleanup & repair)"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter the desired page order sequence. Leaving it blank cleans and normalizes the document structure.
                      </p>
                    </div>
                  )}

                  {/* Scan to PDF options */}
                  {tool.slug === 'scan-to-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Scan Enhancement Filter</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'color', label: 'Enhanced Full Color' },
                          { id: 'grayscale', label: 'Clean Grayscale (Photocopy)' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setOptions({ ...options, filter: mode.id })}
                            className={`py-2 px-3 rounded-lg border text-center font-bold transition ${
                              (options.filter || 'color') === mode.id
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compress PDF options */}
                  {tool.slug === 'compress-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Compression Preset</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['low', 'medium', 'high'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setOptions({ ...options, level: lvl })}
                            className={`py-2 px-3 rounded-lg border text-center font-bold capitalize transition ${
                              options.level === lvl
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {lvl} Compression
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compress PNG options */}
                  {tool.slug === 'compress-png' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">PNG Compression Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'low', label: 'Low (~35% smaller)' },
                            { id: 'medium', label: 'Medium (~55% smaller)' },
                            { id: 'high', label: 'High (~70% smaller)' },
                          ].map((lvl) => (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setOptions({ ...options, level: lvl.id })}
                              className={`py-2 px-2.5 rounded-lg border text-center text-[11px] font-bold transition ${
                                (options.level || 'medium') === lvl.id
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Quality Target</label>
                        <select
                          value={options.quality || '80'}
                          onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="90">90% (Maximum detail)</option>
                          <option value="80">80% (Optimal web balance)</option>
                          <option value="65">65% (Aggressive shrink)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* PNG to JPG options */}
                  {tool.slug === 'png-to-jpg' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Transparent Area Fill Color</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { color: '#ffffff', label: 'White (#FFF)' },
                            { color: '#000000', label: 'Black (#000)' },
                            { color: '#f1f5f9', label: 'Slate Gray' },
                          ].map((bg) => (
                            <button
                              key={bg.color}
                              type="button"
                              onClick={() => setOptions({ ...options, background: bg.color })}
                              className={`py-2 px-2.5 rounded-lg border text-center text-xs font-bold transition ${
                                (options.background || '#ffffff') === bg.color
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              {bg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">JPEG Quality</label>
                        <select
                          value={options.quality || '90'}
                          onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="100">100% (Lossless)</option>
                          <option value="90">90% (High Quality)</option>
                          <option value="80">80% (Compact)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Transparent PNG / Background Remover options */}
                  {['remove-png-background', 'transparent-png'].includes(tool.slug) && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Background Color to Remove</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'white', label: 'White Backdrop' },
                            { id: 'black', label: 'Black Backdrop' },
                            { id: 'auto', label: 'Auto (Corner Color)' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setOptions({ ...options, targetColor: item.id })}
                              className={`py-2 px-2 rounded-lg border text-center text-xs font-bold transition ${
                                (options.targetColor || 'white') === item.id
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Edge Sensitivity</label>
                        <select
                          value={options.tolerance || '35'}
                          onChange={(e) => setOptions({ ...options, tolerance: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="20">Strict (20%)</option>
                          <option value="35">Balanced (35%)</option>
                          <option value="50">Broad (50%)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Resize PNG options */}
                  {tool.slug === 'resize-png' && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Target Width (px)</label>
                        <input
                          type="number"
                          value={options.width || '1200'}
                          onChange={(e) => setOptions({ ...options, width: e.target.value })}
                          placeholder="1200"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                        </input>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Target Height (px)</label>
                        <input
                          type="number"
                          value={options.height || ''}
                          onChange={(e) => setOptions({ ...options, height: e.target.value })}
                          placeholder="Auto (Aspect locked)"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                        </input>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Scaling Mode</label>
                        <select
                          value={options.fit || 'inside'}
                          onChange={(e) => setOptions({ ...options, fit: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="inside">Preserve Aspect Ratio (Inside)</option>
                          <option value="cover">Crop to Fill (Cover)</option>
                          <option value="contain">Pad with Transparency (Contain)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Watermark PNG options */}
                  {tool.slug === 'watermark-png' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Watermark Stamp Text</label>
                        <input
                          type="text"
                          value={options.watermarkText || 'CONFIDENTIAL'}
                          onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                          placeholder="CONFIDENTIAL or © 2025 BRAND"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Watermark Color</label>
                        <select
                          value={options.color || '#e11d48'}
                          onChange={(e) => setOptions({ ...options, color: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="#e11d48">Ruby Red (#e11d48)</option>
                          <option value="#2563eb">Royal Blue (#2563eb)</option>
                          <option value="#0f172a">Slate Black (#0f172a)</option>
                          <option value="#ffffff">Pure White (#ffffff)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Crop PNG options */}
                  {tool.slug === 'crop-png' && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Crop Width (px)</label>
                        <input
                          type="number"
                          value={options.width || '500'}
                          onChange={(e) => setOptions({ ...options, width: e.target.value })}
                          placeholder="500"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Crop Height (px)</label>
                        <input
                          type="number"
                          value={options.height || '500'}
                          onChange={(e) => setOptions({ ...options, height: e.target.value })}
                          placeholder="500"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Left / Top Offset (px)</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            value={options.left || '0'}
                            onChange={(e) => setOptions({ ...options, left: e.target.value })}
                            placeholder="Left: 0"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                          />
                          <input
                            type="number"
                            value={options.top || '0'}
                            onChange={(e) => setOptions({ ...options, top: e.target.value })}
                            placeholder="Top: 0"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* PNG OCR options */}
                  {tool.slug === 'png-ocr' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Document / Screenshot Language</label>
                      <select
                        value={options.language || 'eng'}
                        onChange={(e) => setOptions({ ...options, language: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="eng">English</option>
                        <option value="ben">Bengali (বাংলা)</option>
                        <option value="hin">Hindi (हिन्दी)</option>
                        <option value="spa">Spanish (Español)</option>
                        <option value="fra">French (Français)</option>
                        <option value="deu">German (Deutsch)</option>
                      </select>
                    </div>
                  )}

                  {/* Rotate PDF options */}
                  {tool.slug === 'rotate-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Rotation Angle</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { deg: '90', label: '90° Clockwise' },
                          { deg: '180', label: '180° Inverted' },
                          { deg: '270', label: '270° Counter-CW' },
                        ].map((item) => (
                          <button
                            key={item.deg}
                            type="button"
                            onClick={() => setOptions({ ...options, angle: item.deg })}
                            className={`py-2 px-3 rounded-lg border text-center font-bold transition ${
                              options.angle === item.deg
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Watermark PDF options */}
                  {['watermark-pdf', 'add-watermark'].includes(tool.slug) && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Watermark Stamp Text</label>
                        <input
                          type="text"
                          value={options.watermarkText || 'CONFIDENTIAL'}
                          onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                          placeholder="CONFIDENTIAL"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Opacity</label>
                        <select
                          value={options.opacity || '0.3'}
                          onChange={(e) => setOptions({ ...options, opacity: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="0.15">Light (15%)</option>
                          <option value="0.3">Standard (30%)</option>
                          <option value="0.6">Bold (60%)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Crop PDF options */}
                  {tool.slug === 'crop-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Trim Margin (Points)</label>
                      <select
                        value={options.margin || '30'}
                        onChange={(e) => setOptions({ ...options, margin: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="15">Minimal Trim (15pt)</option>
                        <option value="30">Standard Trim (30pt)</option>
                        <option value="50">Aggressive Trim (50pt)</option>
                      </select>
                    </div>
                  )}

                  {/* Protect PDF options */}
                  {tool.slug === 'protect-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Passcode to Encrypt PDF</label>
                      <input
                        type="text"
                        value={options.password || 'secure123'}
                        onChange={(e) => setOptions({ ...options, password: e.target.value })}
                        placeholder="Enter secure password"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-medium"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        This passcode will be required to verify and access the document.
                      </p>
                    </div>
                  )}

                  {/* Sign PDF options */}
                  {tool.slug === 'sign-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Signer Legal Name</label>
                      <input
                        type="text"
                        value={options.signerName || ''}
                        onChange={(e) => setOptions({ ...options, signerName: e.target.value })}
                        placeholder="e.g. John Doe, Esq."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        A certified digital timestamp seal will be permanently stamped on the last page.
                      </p>
                    </div>
                  )}

                  {/* Redact PDF options */}
                  {tool.slug === 'redact-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Keywords or Terms to Redact</label>
                      <input
                        type="text"
                        value={options.terms || 'CONFIDENTIAL, SSN, PRIVATE'}
                        onChange={(e) => setOptions({ ...options, terms: e.target.value })}
                        placeholder="CONFIDENTIAL, SSN, PRIVATE, ACCOUNT"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Separate sensitive words or phrases with commas. Matching areas will be permanently blacked out.
                      </p>
                    </div>
                  )}

                  {/* AI Summarizer options */}
                  {['ai-summarizer', 'summarize-pdf'].includes(tool.slug) && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Summary Style (Gemini AI)</label>
                      <select
                        value={options.style || 'executive'}
                        onChange={(e) => setOptions({ ...options, style: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="executive">Executive Summary (Overview &amp; Action Items)</option>
                        <option value="bullet">Bullet Highlights (Key Takeaways Only)</option>
                        <option value="detailed">Comprehensive Analysis (Section by Section)</option>
                      </select>
                    </div>
                  )}

                  {/* Translate PDF options */}
                  {tool.slug === 'translate-pdf' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Target Language</label>
                      <select
                        value={options.targetLanguage || 'Spanish'}
                        onChange={(e) => setOptions({ ...options, targetLanguage: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                        <option value="Arabic">Arabic (العربية)</option>
                        <option value="Portuguese">Portuguese (Português)</option>
                        <option value="Italian">Italian (Italiano)</option>
                        <option value="Chinese">Chinese (中文)</option>
                      </select>
                    </div>
                  )}

                  {/* Add Page Numbers */}
                  {tool.slug === 'add-page-numbers' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Page Number Position</label>
                      <select
                        value={options.position}
                        onChange={(e) => setOptions({ ...options, position: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="bottom-center">Bottom Center (Standard)</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                  )}

                  {/* Text or HTML to PDF options */}
                  {['text-to-pdf', 'markdown-to-pdf', 'html-to-pdf'].includes(tool.slug) && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Document Header Title</label>
                      <input
                        type="text"
                        value={options.title}
                        onChange={(e) => setOptions({ ...options, title: e.target.value })}
                        placeholder="e.g. Quarterly Meeting Minutes"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                    </div>
                  )}

                  {/* OCR options */}
                  {tool.slug === 'ocr' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Document Language</label>
                      <select
                        value={options.language}
                        onChange={(e) => setOptions({ ...options, language: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="eng">English (Latin)</option>
                        <option value="spa">Spanish (Español)</option>
                        <option value="fra">French (Français)</option>
                        <option value="deu">German (Deutsch)</option>
                      </select>
                    </div>
                  )}

                  {/* PDF to Text options */}
                  {tool.slug === 'pdf-to-text' && (
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Extraction Formatting</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'with-pages', label: 'Include Page Markers (--- Page N ---)' },
                          { id: 'clean-flow', label: 'Continuous Paragraph Stream' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setOptions({ ...options, textFormat: m.id })}
                            className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition ${
                              (options.textFormat || 'with-pages') === m.id
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {!isAuthenticated ? (
                  <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium">
                    <Lock className="w-3 h-3 mr-1" />
                    Guest Mode: Free account sign-up will continue conversion automatically
                  </span>
                ) : (
                  <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Authenticated • Results saved to your private vault
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing || (files.length === 0 && !textInput.trim())}
                onClick={handleProcessClick}
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{processingStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{tool.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
