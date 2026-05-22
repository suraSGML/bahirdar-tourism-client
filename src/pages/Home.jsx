import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import GoogleMapView from '../components/GoogleMapView';
import WeatherWidget from '../components/WeatherWidget';
import { useLang } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLang();
  const [hotels, setHotels] = useState([]);
  const [sites, setSites] = useState([]);
  const [guides, setGuides] = useState([]);
  const [transports, setTransports] = useState([]);
  const [stats, setStats] = useState({ hotels: 0, guides: 0, sites: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Visit Bahir Dar – Discover Ethiopia's Lake City"; }, []);

  useEffect(() => {
    Promise.all([API.get('/hotels?limit=6'), API.get('/guides?limit=8'), API.get('/sites?limit=8'), API.get('/transport?limit=20')])
      .then(([h, g, s, tr]) => {
        // Handle both paginated and direct array responses
        const hotelsData = h.data?.data || h.data || [];
        const guidesData = g.data?.data || g.data || [];
        const sitesData = s.data?.data || s.data || [];
        const transportsData = tr.data?.data || tr.data || [];
        
        setStats({ hotels: hotelsData.length, guides: guidesData.length, sites: sitesData.length });
        setHotels(hotelsData); setGuides(guidesData); setSites(sitesData); setTransports(transportsData);
      })
      .catch(err => {
        console.error('Failed to load home data:', err);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-600 font-semibold text-lg">Loading Visit Bahir Dar...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 via-primary-800/60 to-primary-900/80" />
        <div className="relative z-10 max-w-4xl mx-auto animate-slide-up">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/30">
            🇪🇹 Bahir Dar, Ethiopia
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {t.home.title || 'Discover Bahir Dar'}
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.home.subtitle || 'Lake Tana, ancient monasteries, Blue Nile Falls and authentic Ethiopian culture await you.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/hotels" className="bg-white text-primary-700 font-bold px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-200 shadow-xl hover:-translate-y-0.5">
              🏨 Find Hotels
            </Link>
            <Link to="/guides" className="bg-primary-500 text-white font-bold px-8 py-4 rounded-full hover:bg-primary-400 transition-all duration-200 shadow-xl hover:-translate-y-0.5 border border-white/20">
              🧭 Find Guides
            </Link>
            <Link to="/explore" className="bg-transparent text-white font-semibold px-8 py-4 rounded-full border-2 border-white/60 hover:bg-white/10 transition-all duration-200">
              🗺️ Explore Map
            </Link>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-primary-500 py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🏨', count: stats.hotels, label: 'Hotels' },
            { icon: '🧭', count: stats.guides, label: 'Tour Guides' },
            { icon: '⛪', count: stats.sites, label: 'Tourist Sites' },
            { icon: '🚤', count: transports.length, label: 'Transport Services' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center text-white">
              <span className="text-3xl mb-1">{s.icon}</span>
              <span className="text-3xl font-bold">{s.count}+</span>
              <span className="text-white/70 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── WEATHER ── */}
      <div className="max-w-sm mx-auto px-4 -mt-4 relative z-10">
        <WeatherWidget />
      </div>

      {/* ── FEATURED HOTELS ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Hotels</h2>
            <p className="text-gray-400 mt-1">Handpicked stays on the shores of Lake Tana</p>
          </div>
          <Link to="/hotels" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1">
            View all <span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.slice(0, 3).map(hotel => (
            <Link to={`/hotels/${hotel._id}`} key={hotel._id}
              className="card group overflow-hidden hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-52 overflow-hidden">
                <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                  alt={hotel.name} className="w-full h-full object-contain bg-gray-100 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  ⭐ {hotel.rating?.toFixed(1)}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">{hotel.name}</h3>
                <p className="text-gray-400 text-sm mb-3">📍 {hotel.address}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {hotel.amenities?.slice(0, 3).map(a => (
                    <span key={a} className="bg-primary-50 text-primary-600 text-xs px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-primary-600 font-bold text-xl">ETB {hotel.pricePerNight?.toLocaleString()}<span className="text-gray-400 font-normal text-sm">/night</span></span>
                  <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full group-hover:bg-primary-600 transition-colors">Book Now</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TOURIST SITES ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Top Tourist Sites</h2>
              <p className="text-gray-400 mt-1">Ancient monasteries, waterfalls and natural wonders</p>
            </div>
            <Link to="/sites" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1">View all <span>→</span></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sites.slice(0, 4).map(site => (
              <Link to={`/sites/${site._id}`} key={site._id}
                className="group relative block rounded-2xl overflow-hidden h-64 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
                <img src={site.images?.[0] || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600'}
                  alt={site.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 bg-white/90 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⭐ {site.rating?.toFixed(1)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-block text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full capitalize mb-1.5">{site.category}</span>
                  <h3 className="font-bold text-white text-base">{site.name}</h3>
                  <p className="text-white/70 text-xs mt-1">{site.entranceFee ? `ETB ${site.entranceFee}` : '✅ Free Entry'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOUR GUIDES ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Expert Tour Guides</h2>
            <p className="text-gray-400 mt-1">Local experts to make your trip unforgettable</p>
          </div>
          <Link to="/guides" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1">View all <span>→</span></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {guides.slice(0, 4).map(guide => (
            <Link to={`/guides/${guide._id}`} key={guide._id}
              className="card group p-5 text-center hover:-translate-y-1 transition-all duration-300">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <img src={guide.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                  alt={guide.user?.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary-100 group-hover:border-primary-400 transition-all duration-300" loading="lazy" />
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  ⭐{guide.rating?.toFixed(1)}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-primary-600 transition-colors">{guide.user?.name}</h3>
              <p className="text-gray-400 text-xs mb-2 line-clamp-1">{guide.specialties?.[0]}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-primary-600 font-bold text-sm">ETB {guide.pricePerDay}<span className="text-gray-400 font-normal text-xs">/day</span></span>
                <span className="text-gray-400 text-xs">{guide.numReviews} reviews</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Explore the Map</h2>
              <p className="text-gray-400 mt-1">Find hotels, sites and guides near you</p>
            </div>
            <Link to="/explore" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1">Full Map <span>→</span></Link>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-card">
            <GoogleMapView hotels={hotels} sites={sites} guides={guides} transports={transports} height="500px" showFilter={true} />
          </div>
        </div>
      </section>

      {/* ── WHY BAHIR DAR ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Visit Bahir Dar?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🏛️', title: 'Ancient Monasteries', desc: '14th century island monasteries on Lake Tana with stunning religious art and manuscripts.' },
            { icon: '💧', title: 'Blue Nile Falls', desc: "The magnificent Tis Abay waterfall, one of Africa's most spectacular natural wonders." },
            { icon: '🚤', title: 'Lake Tana Cruises', desc: "Boat tours on Ethiopia's largest lake, home to hippos and over 200 bird species." },
            { icon: '🦅', title: 'Rich Wildlife', desc: 'Diverse wildlife including rare birds and unique Ethiopian flora and fauna.' },
            { icon: '🍽️', title: 'Ethiopian Cuisine', desc: 'Authentic dishes including injera, tibs, and traditional coffee ceremonies.' },
            { icon: '🎭', title: 'Cultural Festivals', desc: 'Vibrant Ethiopian festivals, traditional music and colorful celebrations.' },
          ].map(item => (
            <div key={item.title} className="card p-6 flex gap-4 hover:-translate-y-1 transition-all duration-300 group">
              <span className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200)', backgroundSize: 'cover' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Explore?</h2>
          <p className="text-white/75 text-lg mb-10">Join thousands of tourists discovering the beauty of Bahir Dar every day.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="bg-white text-primary-700 font-bold px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-200 shadow-xl hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <Link to="/explore" className="bg-transparent text-white font-semibold px-8 py-4 rounded-full border-2 border-white/60 hover:bg-white/10 transition-all duration-200">
              Explore Map
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
