import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Lock, CheckCircle2, Globe, Heart } from 'lucide-react';
import { TOOLS } from '../../constants/tools';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">DocuMorph</span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Enterprise-grade online PDF converter and document utility platform. Merge, split, compress, protect, watermark and convert documents with zero privacy compromise.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>TLS 1.3 Encryption</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero File Retention</span>
              </div>
            </div>
          </div>

          {/* Popular Tools */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Popular Tools</h4>
            <ul className="space-y-2 text-xs">
              {TOOLS.filter((t) => t.popular).slice(0, 5).map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tools/${tool.slug}`} className="hover:text-slate-900 transition">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/tools?cat=PDF Tools" className="hover:text-slate-900 transition">PDF Tools</Link>
              </li>
              <li>
                <Link to="/tools?cat=Document Tools" className="hover:text-slate-900 transition">Document Tools</Link>
              </li>
              <li>
                <Link to="/tools?cat=Image Tools" className="hover:text-slate-900 transition">Image Tools</Link>
              </li>
              <li>
                <Link to="/tools?cat=Security Tools" className="hover:text-slate-900 transition">Security Tools</Link>
              </li>
              <li>
                <Link to="/tools?cat=OCR Tools" className="hover:text-slate-900 transition">OCR Text Tools</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/pricing" className="hover:text-slate-900 transition">Pricing & Plans</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-slate-900 transition">SEO Guides & Blog</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-slate-900 transition">Frequently Asked Questions</Link>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition">
                  XML Sitemap
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            &copy; {new Date().getFullYear()} DocuMorph SaaS Platform. Built with modern full-stack MERN architecture.
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              All Conversion Services Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
