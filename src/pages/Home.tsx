import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { TOOLS } from '../constants/tools';
import {
  Layers,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  Lock,
  FileCheck,
  Star,
  Users,
  ChevronRight,
  FileText,
  Images,
  Scissors,
  Minimize2,
  HelpCircle,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const popularTools = TOOLS.filter((t) => t.popular);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tools?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/tools');
    }
  };

  return (
    <div className="space-y-24 pb-20">
      <SEOHead
        title="DocuMorph - Complete Online PDF & Document Suite"
        description="Free online PDF tools to convert, merge, split, compress, watermark, rotate, and secure documents. Fast, cloud-encrypted, and trusted by professionals worldwide."
        schemaJson={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DocuMorph',
          url: 'https://documorph.io',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://documorph.io/tools?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Next-Generation Document Utility Engine</span>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Every PDF & Document Tool You’ll Ever Need.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Convert, merge, compress, edit, and secure your files directly in your browser with real server-side precision. No watermarks, no spam, total privacy.
          </p>
        </div>

        {/* Quick Search & Launch Bar */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30+ tools (e.g. merge pdf, image to pdf, ocr, compress)..."
              className="w-full py-4 pl-3 pr-28 text-sm outline-none text-slate-900"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Search
            </button>
          </form>

          {/* Quick Keywords */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Quick picks:</span>
            {['Image to PDF', 'Merge PDF', 'Compress PDF', 'Split PDF', 'OCR'].map((name) => {
              const tool = TOOLS.find((t) => t.name === name);
              return tool ? (
                <Link
                  key={tool.slug}
                  to={`/tools/${tool.slug}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  {name}
                </Link>
              ) : null;
            })}
          </div>
        </div>
      </section>

      {/* Popular Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Most Popular Tools</h2>
            <p className="text-xs text-slate-500 mt-1">High-performance utilities used by thousands daily</p>
          </div>
          <Link to="/tools" className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center space-x-1">
            <span>Explore all tools</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularTools.map((tool) => (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">
                    {tool.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tool.shortDesc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-14 text-white space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Streamlined 3-Step Processing</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No software installations required. Process files in seconds straight from your desktop, tablet, or phone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-3 p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">Select Tool & Upload</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from over 30+ conversion and editing tools. Drag and drop single or multiple documents directly into the workspace.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">Configure & Process</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tune page orientation, split ranges, watermarks, or compression ratios. Hit convert and our dedicated engine processes your job in milliseconds.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white">Download or Save to Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download your output file instantly. Access your conversions history anytime in your secure personal documents vault.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Shield className="w-3.5 h-3.5" />
              <span>Strict Security & Privacy Protocol</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise-Grade Confidentiality For Every Document
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We never read, mine, or share your content. All files are processed in isolated in-memory sandboxes over TLS 1.3 encrypted connections and automatically deleted after processing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Zero Retention Policy</div>
                  <div className="text-[11px] text-slate-500">Temporary processing files are flushed continuously.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">End-to-End Encryption</div>
                  <div className="text-[11px] text-slate-500">Protected in transit and at rest with AES-256 standard.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Isolated User Vaults</div>
                  <div className="text-[11px] text-slate-500">Only you can view or download your generated files.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">GDPR & CCPA Compliant</div>
                  <div className="text-[11px] text-slate-500">Permanent delete controls on every account asset.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Live Encryption Status</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">TLS 1.3 Active • 256-Bit SSL</div>
                </div>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                Verified
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span>In-Memory Stream Parsing</span>
                <span className="font-bold text-slate-900">Active</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span>Automatic 2-Hour File Expire</span>
                <span className="font-bold text-slate-900">Enforced</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span>Owner Authorization Checks</span>
                <span className="font-bold text-slate-900">Strict (JWT)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Everything you need to know about converting and managing files</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Is DocuMorph free to use?',
              a: 'Yes, all core tools (Image to PDF, Merge PDF, Compress, Split, Rotate, OCR) are free to use. Simply create a free account to download and access your files.',
            },
            {
              q: 'What happens to my uploaded files after conversion?',
              a: 'Temporary processing streams are purged automatically from our server memory. If you save files to your account, they are stored securely and privately accessible only by you.',
            },
            {
              q: 'Why do I need an account to convert files?',
              a: 'An account ensures your output files are securely tied to you rather than open to public link hijacking, grants you conversion history, and prevents automated bot abuse.',
            },
            {
              q: 'Can I use DocuMorph on mobile devices?',
              a: 'Yes! DocuMorph is designed mobile-first and works seamlessly on iPhone, iPad, Android smartphones, and all desktop browsers.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{item.q}</span>
              </h3>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-center text-white space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Convert & Manage Your Documents?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of professionals, students, and businesses who rely on DocuMorph daily.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/tools"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-xl shadow transition"
            >
              Browse All 30+ Tools
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              View SaaS Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
