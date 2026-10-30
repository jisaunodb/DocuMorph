import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <SEOHead title="Page Not Found (404)" description="The requested document page could not be found." noIndex={true} />

      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 - Page Not Found</h1>
        <p className="text-xs text-slate-500">
          The document, tool, or guide you are looking for might have been moved or does not exist.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
