import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { BLOG_POSTS } from '../constants/blogPosts';
import { TOOLS } from '../constants/tools';
import { Calendar, Clock, ArrowLeft, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedTool = TOOLS.find((t) => t.slug === post.relatedToolSlug);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SEOHead
        title={`${post.title} | DocuMorph Guides`}
        description={post.excerpt}
        canonicalUrl={`https://documorph.io/blog/${post.slug}`}
        ogType="article"
      />

      <Link
        to="/blog"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Guides</span>
      </Link>

      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
            {post.category}
          </span>
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {post.title}
        </h1>

        <p className="text-sm text-slate-500 font-medium">Published by {post.author}</p>
      </div>

      {/* Featured Callout leading to Tool */}
      {relatedTool && (
        <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Try {relatedTool.name} for Free</div>
              <div className="text-[11px] text-slate-600">{relatedTool.shortDesc}</div>
            </div>
          </div>

          <Link
            to={`/tools/${relatedTool.slug}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 flex-shrink-0 transition"
          >
            <span>Open Tool</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-6">
        {post.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-lg font-bold text-slate-900 pt-4">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
            return (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-xs space-y-1">
                {paragraph}
              </div>
            );
          }
          return <p key={idx}>{paragraph}</p>;
        })}
      </div>
    </div>
  );
};
