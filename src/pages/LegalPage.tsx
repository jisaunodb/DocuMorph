import React, { useState } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'privacy' | 'terms' | 'faq';
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'privacy' }) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'faq'>(initialTab);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEOHead
        title={tab === 'privacy' ? 'Privacy Policy & Zero Retention Protocol' : tab === 'terms' ? 'Terms of Service' : 'Frequently Asked Questions'}
        description="Enterprise confidentiality standards, zero retention protocol, and terms of service for DocuMorph."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('privacy')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition ${
            tab === 'privacy'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setTab('terms')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition ${
            tab === 'terms'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setTab('faq')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition ${
            tab === 'faq'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          FAQ
        </button>
      </div>

      {tab === 'privacy' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase">
              <Shield className="w-4 h-4" />
              <span>Zero Document Retention Commitment</span>
            </div>
            <h1 className="text-xl font-bold text-white">Privacy Policy & Confidentiality</h1>
            <p className="text-slate-300">
              DocuMorph processes files strictly in temporary memory. We do not inspect, retain, sell, or train AI models on user-provided documents.
            </p>
          </div>

          <h2 className="text-sm font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you create an account, we store your name, email address, and encrypted password hash (bcrypt). When you upload documents to be converted, those streams are held in temporary memory for processing only.
          </p>

          <h2 className="text-sm font-bold text-slate-900">2. Document Security & Storage</h2>
          <p>
            Processed documents are accessible solely through encrypted tokenized URLs tied to your authorized user account. Files stored in your personal vault are encrypted at rest with AES-256 standard and can be permanently deleted by you at any time.
          </p>

          <h2 className="text-sm font-bold text-slate-900">3. Third-Party Sharing</h2>
          <p>
            We do not sell, rent, or share personal data or document contents with any third parties or advertisers.
          </p>
        </div>
      )}

      {tab === 'terms' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          <p>Last updated: March 2026</p>

          <h2 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the DocuMorph website and document conversion services, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="text-sm font-bold text-slate-900">2. Permitted Use</h2>
          <p>
            You agree not to upload malicious payloads, viruses, copyrighted documents you do not hold rights to, or illegal content. We reserve the right to terminate accounts that violate system integrity.
          </p>

          <h2 className="text-sm font-bold text-slate-900">3. Disclaimer of Warranties</h2>
          <p>
            Services are provided on an "as is" and "as available" basis. DocuMorph makes reasonable efforts to ensure document conversion fidelity.
          </p>
        </div>
      )}

      {tab === 'faq' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
          <div className="space-y-3">
            {[
              {
                q: 'Are conversions free?',
                a: 'Yes, all standard tools (Merge, Compress, Split, Image to PDF, OCR) are free to use upon creating a free account.',
              },
              {
                q: 'How large can my uploaded files be?',
                a: 'Free accounts support files up to 50MB. Pro accounts support up to 250MB per document.',
              },
              {
                q: 'How do I delete my account or files?',
                a: 'You can delete individual files inside the Documents Vault, or delete your entire account in Account Settings.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-900">{faq.q}</div>
                <div className="text-xs text-slate-600">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
