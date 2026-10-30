import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';
import { TOOLS, TOOL_CATEGORIES } from '../constants/tools';
import { Search, Layers, ArrowRight, Sparkles, Filter } from 'lucide-react';

export const ToolsDirectory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'All Tools';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCat, setSelectedCat] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  useEffect(() => {
    const cat = searchParams.get('cat');
    const q = searchParams.get('q');
    if (cat) setSelectedCat(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCat = selectedCat === 'All Tools' || tool.category === selectedCat;
    const matchesQuery =
      searchQuery.trim() === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.seoKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleCategoryChange = (cat: string) => {
    setSelectedCat(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All Tools') {
      newParams.delete('cat');
    } else {
      newParams.set('cat', cat);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEOHead
        title="All PDF & Document Conversion Tools Directory"
        description="Explore our full collection of 30+ PDF and document conversion tools. Convert image to PDF, merge, compress, split, watermark, OCR, and edit online."
        schemaJson={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'DocuMorph PDF & Document Tools Directory',
          description: 'Comprehensive directory of online PDF and document processing tools.',
          url: 'https://documorph.io/tools',
        }}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          PDF & Document Tools Directory
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Select any utility below to convert, merge, split, compress, or secure your documents with guaranteed privacy and precision.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, keyword, or function (e.g. merge, word, image, ocr)..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                selectedCat === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 max-w-7xl mx-auto pt-2">
        <span>Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}</span>
        {(searchQuery || selectedCat !== 'All Tools') && (
          <button
            onClick={() => {
              setSearchQuery('');
              handleCategoryChange('All Tools');
            }}
            className="text-slate-900 hover:underline font-bold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <p className="text-sm font-bold text-slate-700">No tools found matching your search</p>
          <p className="text-xs text-slate-400">Try searching for "pdf", "image", "merge", or reset filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {tool.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded">
                        {tool.badge}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                      {tool.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {tool.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tool.shortDesc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                <span className="text-[11px] text-slate-400 font-normal">
                  {tool.acceptedFormats.join(', ')}
                </span>
                <span className="flex items-center space-x-1">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
