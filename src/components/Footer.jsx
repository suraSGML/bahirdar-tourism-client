import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-3">🌍 Visit Bahir Dar</h3>
            <p className="text-white/50 text-sm leading-relaxed">Your gateway to Lake Tana, ancient monasteries, and the best of Ethiopian tourism.</p>
            <div className="flex gap-3 mt-4">
              {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-all duration-200 hover:-translate-y-0.5">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-2.5">
              {[['/', 'Home'], ['/hotels', 'Hotels'], ['/guides', 'Tour Guides'], ['/sites', 'Tourist Sites'], ['/transport', 'Transport'], ['/itinerary', 'Itinerary Planner'], ['/explore', 'Explore Map']].map(([to, label]) => (
                <Link key={to} to={to} className="block text-white/50 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-3">
              <p className="text-white/50 text-sm flex items-start gap-2"><span>📍</span>Bahir Dar, Amhara Region, Ethiopia</p>
              <p className="text-white/50 text-sm flex items-center gap-2"><span>📞</span>+251 58 220 0000</p>
              <p className="text-white/50 text-sm flex items-center gap-2"><span>📧</span>info@visitbahirdar.et</p>
            </div>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm uppercase tracking-wider">Emergency Numbers</h4>
            <div className="space-y-2.5">
              {[
                ['🚨', 'Police', '991'],
                ['🚑', 'Ambulance', '907'],
                ['🔥', 'Fire', '939'],
                ['🏥', 'Felege Hiwot Hospital', '+251 58 220 6835'],
              ].map(([icon, label, num]) => (
                <div key={label} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <div>
                    <span className="text-white/40 text-xs">{label}</span>
                    <p className="text-amber-300 text-sm font-semibold">{num}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} Visit Bahir Dar · Developed by Amhara Innovation & Technology Bureau Interns
          </p>
          <div className="flex gap-4">
            <Link to="/" className="text-white/30 hover:text-white/60 text-xs transition-colors">Privacy Policy</Link>
            <Link to="/" className="text-white/30 hover:text-white/60 text-xs transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
