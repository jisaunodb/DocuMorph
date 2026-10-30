import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/common/AuthModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';

// Pages
import { Home } from './pages/Home';
import { ToolsDirectory } from './pages/ToolsDirectory';
import { ToolPage } from './pages/ToolPage';
import { Dashboard } from './pages/Dashboard';
import { FilesPage } from './pages/FilesPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PricingPage } from './pages/PricingPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { LegalPage } from './pages/LegalPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#fafbfc] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<ToolsDirectory />} />
              <Route path="/tools/:toolSlug" element={<ToolPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/privacy" element={<LegalPage initialTab="privacy" />} />
              <Route path="/terms" element={<LegalPage initialTab="terms" />} />
              <Route path="/faq" element={<LegalPage initialTab="faq" />} />

              {/* Authenticated User Workspace */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <FilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Superuser Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <AuthModal />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
