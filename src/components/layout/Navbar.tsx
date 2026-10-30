import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Search,
  ChevronDown,
  LayoutDashboard,
  FolderOpen,
  History,
  ShieldCheck,
  User,
  LogOut,
  Layers,
  Sparkles,
  Menu,
  X,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { TOOLS } from '../../constants/tools';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsToolsOpen(false);
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const filteredTools = searchQuery.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">DocuMorph</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded">
                    SaaS
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {/* Tools Mega Dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 flex items-center space-x-1 transition"
                >
                  <span>Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToolsOpen && (
                  <div className="absolute left-0 mt-2 w-[520px] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                    <div className="col-span-2 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Tools</span>
                      <Link to="/tools" className="text-xs font-semibold text-slate-900 hover:underline">
                        View all 30+ tools &rarr;
                      </Link>
                    </div>
                    {TOOLS.slice(0, 8).map((tool) => (
                      <Link
                        key={tool.slug}
                        to={`/tools/${tool.slug}`}
                        className="p-2 rounded-xl hover:bg-slate-50 flex items-start space-x-3 transition group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {tool.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{tool.shortDesc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/tools"
                className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
              >
                All Tools
              </Link>
              <Link
                to="/pricing"
                className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
              >
                Pricing
              </Link>
              <Link
                to="/blog"
                className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
              >
                Guides & Blog
              </Link>
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center space-x-3">
            {/* Search Input Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden lg:flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200/80 rounded-lg hover:border-slate-300 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search tools (e.g. merge, word)...</span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono">⌘K</kbd>
              </button>
            </div>

            {/* Authenticated vs Guest Actions */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded uppercase">
                        {user.plan} Plan
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Workspace Dashboard</span>
                    </Link>

                    <Link
                      to="/files"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span>My Documents Vault</span>
                    </Link>

                    <Link
                      to="/history"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                      <span>Conversion History</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-semibold transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('Sign in to access your saved documents and processing history.')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('Create a free account to unlock high-speed processing and document storage.')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
                >
                  Get Started Free
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link to="/tools" className="block py-2 text-sm font-semibold text-slate-800">
            All PDF & Document Tools
          </Link>
          <Link to="/pricing" className="block py-2 text-sm font-semibold text-slate-800">
            Pricing Plans
          </Link>
          <Link to="/blog" className="block py-2 text-sm font-semibold text-slate-800">
            Guides & Blog
          </Link>
          {isAuthenticated && (
            <>
              <div className="border-t border-slate-100 pt-2"></div>
              <Link to="/dashboard" className="block py-2 text-sm font-semibold text-slate-800">
                Workspace Dashboard
              </Link>
              <Link to="/files" className="block py-2 text-sm font-semibold text-slate-800">
                My Files
              </Link>
              <Link to="/history" className="block py-2 text-sm font-semibold text-slate-800">
                Conversion History
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block py-2 text-sm font-semibold text-indigo-700">
                  Admin Console
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Global Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center space-x-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. merge, compress, word, ocr)..."
                className="w-full text-sm outline-none text-slate-800"
              />
              <button onClick={() => setIsSearchOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-xs text-slate-400 text-center">
                  Type a keyword to discover PDF and document conversion tools...
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 text-center">No tools matched "{searchQuery}"</div>
              ) : (
                filteredTools.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      navigate(`/tools/${t.slug}`);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">{t.name}</div>
                      <div className="text-[11px] text-slate-500">{t.shortDesc}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.category}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
