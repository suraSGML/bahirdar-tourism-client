import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const navLinks = [
  { to: '/hotels', label: '🏨 Hotels' },
  { to: '/guides', label: '🧭 Guides' },
  { to: '/sites', label: '⛪ Sites' },
  { to: '/transport', label: '🚤 Transport' },
  { to: '/explore', label: '🗺️ Map' },
  { to: '/itinerary', label: '📋 Itinerary' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹', short: 'አማ' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', short: 'عر' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLanguage } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav ref={menuRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-primary-600 shadow-xl' : 'bg-primary-500'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl hover:text-white/90 transition-colors">
            🌍 <span>Visit Bahir Dar</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(l.to) ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
          {/* Language Dropdown */}
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all duration-200 border border-white/20">
                <span>{currentLang.flag}</span>
                <span>{currentLang.short}</span>
                <span className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px] animate-scale-in">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-primary-50 ${lang === l.code ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'}`}>
                      <span className="text-base">{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto text-primary-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user ? (
              <>
                <Link to="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200">
                  👤 {user.name?.split(' ')[0]}
                </Link>
                <button onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-white/40 text-white hover:bg-white/10 transition-all duration-200">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200">
                  Login
                </Link>
                <Link to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-primary-600 hover:bg-white/90 transition-all duration-200 shadow-md">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu">
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-white my-1 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-2 space-y-1 border-t border-white/20 bg-primary-600">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(l.to) ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/20 space-y-1">
            {user ? (
              <>
                <Link to="/dashboard" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
                  👤 Dashboard
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">Login</Link>
                <Link to="/register" className="block px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-primary-600 hover:bg-white/90 transition-all text-center">Register</Link>
              </>
            )}
            <div className="pt-2 border-t border-white/20">
              <p className="text-white/50 text-xs px-4 py-1">Language / ቀንቀን / اللغة</p>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLanguage(l.code); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm transition-all ${lang === l.code ? 'bg-white/20 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'}` }>
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
