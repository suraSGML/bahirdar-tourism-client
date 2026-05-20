import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLink from './components/SkipLink';

// Lazy-loaded pages — each page is a separate chunk loaded on demand
const Home        = lazy(() => import('./pages/Home'));
const Hotels      = lazy(() => import('./pages/Hotels'));
const HotelDetail = lazy(() => import('./pages/HotelDetail'));
const Guides      = lazy(() => import('./pages/Guides'));
const GuideDetail = lazy(() => import('./pages/GuideDetail'));
const Sites       = lazy(() => import('./pages/Sites'));
const SiteDetail  = lazy(() => import('./pages/SiteDetail'));
const Transport   = lazy(() => import('./pages/Transport'));
const Itinerary   = lazy(() => import('./pages/Itinerary'));
const ExploreMap  = lazy(() => import('./pages/ExploreMap'));
const Login       = lazy(() => import('./pages/Login'));
const Register    = lazy(() => import('./pages/Register'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const NotFound    = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4" role="status" aria-live="polite">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-primary-500 font-medium">Loading...</p>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <SkipLink />
          <Navbar />
          <ErrorBoundary>
            <main id="main-content" role="main">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/hotels" element={<Hotels />} />
                  <Route path="/hotels/:id" element={<HotelDetail />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/guides/:id" element={<GuideDetail />} />
                  <Route path="/sites" element={<Sites />} />
                  <Route path="/sites/:id" element={<SiteDetail />} />
                  <Route path="/transport" element={<Transport />} />
                  <Route path="/itinerary" element={<Itinerary />} />
                  <Route path="/explore" element={<ExploreMap />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </ErrorBoundary>
          <Footer />
          <ToastContainer position="top-right" autoClose={3000} role="status" aria-live="polite" />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
