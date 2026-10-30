import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { TOOLS } from '../constants/tools';
import { ToolWorkspace } from '../components/tools/ToolWorkspace';
import {
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  Shield,
  FileCheck,
  ChevronRight,
  Zap,
  Lock,
} from 'lucide-react';

export const ToolPage: React.FC = () => {
  const { toolSlug } = useParams<{ toolSlug: string }>();

  const tool = TOOLS.find((t) => t.slug === toolSlug);

  if (!tool) {
    return <Navigate to="/tools" replace />;
  }

  // Related tools
  const relatedTools = TOOLS.filter(
    (t) => tool.relatedSlugs?.includes(t.slug) || (t.category === tool.category && t.slug !== tool.slug)
  ).slice(0, 3);

  // Schema.org Structured Data: WebApplication, BreadcrumbList, and FAQPage
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.name,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All (Web Browser)',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description: tool.seoDescription,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://documorph.io',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: 'https://documorph.io/tools',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.name,
            item: `https://documorph.io/tools/${tool.slug}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      <SEOHead
        title={tool.seoTitle}
        description={tool.seoDescription}
        canonicalUrl={`https://documorph.io/tools/${tool.slug}`}
        schemaJson={schemaData}
      />

      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/tools" className="hover:text-slate-900 transition">
          Tools
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to={`/tools?cat=${encodeURIComponent(tool.category)}`} className="hover:text-slate-900 transition">
          {tool.category}
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-900">{tool.name}</span>
      </nav>

      {/* Main Interactive Tool Workspace */}
      <section>
        <ToolWorkspace tool={tool} />
      </section>

      {/* SEO Content: Step by Step Guide & Overview */}
      <section className="space-y-12 max-w-4xl mx-auto">
        {/* Comprehensive Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            About {tool.name}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{tool.longDesc}</p>
        </div>

        {/* How to use */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            How to Use {tool.name} in 4 Simple Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tool.howToSteps.map((step, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features & Technical Specs */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Key Features & Technical Capabilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tool.features.map((feat, idx) => (
              <div key={idx} className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Privacy Commitment */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Guaranteed Document Security</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your privacy is our utmost priority. Files uploaded to our {tool.name.toLowerCase()} engine are encrypted with TLS 1.3 in transit and automatically deleted from our servers immediately after your download link is generated. We never inspect, index, or store your personal contents.
          </p>
        </div>

        {/* FAQ Section */}
        {tool.faq && tool.faq.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {tool.faq.map((item, idx) => (
                <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{item.question}</span>
                  </h4>
                  <p className="text-xs text-slate-600 pl-6 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tools Internal Linking */}
        {relatedTools.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Related Document Utilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/tools/${rel.slug}`}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      {rel.name}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">{rel.shortDesc}</div>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-slate-900 flex items-center space-x-1 group-hover:text-emerald-700">
                    <span>Use tool</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
