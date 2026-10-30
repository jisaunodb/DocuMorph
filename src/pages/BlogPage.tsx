import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { BLOG_POSTS } from '../constants/blogPosts';
import { BookOpen, ArrowRight, Clock, Calendar } from 'lucide-react';

export const BlogPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SEOHead
        title="PDF & Document Management Guides & Blog"
        description="Helpful guides, conversion tips, and tutorials on editing, merging, splitting, compressing, and securing PDF documents."
        canonicalUrl="https://documorph.io/blog"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Guides & Document Knowledge Base
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Step-by-step tutorials, productivity best practices, and expert tips on mastering PDF conversions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                  {post.category}
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.date}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.readTime}</span>
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 hover:text-emerald-700 transition">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">By {post.author}</span>
              <Link
                to={`/blog/${post.slug}`}
                className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center space-x-1"
              >
                <span>Read Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
