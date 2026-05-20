import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import GoogleMapView from '../components/GoogleMapView';
import { useLang } from '../context/LanguageContext';

const categories = ['all', 'monastery', 'lake', 'museum', 'park', 'other'];
const catIcons = { monastery: '⛪', lake: '🌊', museum: '🏛️', park: '🌳', other: '📍', all: '🗺️' };
const catColors = { monastery: 'bg-purple-100 text-purple-700', lake: 'bg-blue-100 text-blue-700', museum: 'bg-amber-100 text-amber-700', park: 'bg-green-100 text-green-700', other: 'bg-gray-100 text-gray-700' };

export function SiteCard({ site }) {
  return (
    <Link to={`/sites/${site._id}`} className="group relative block rounded-2xl overflow-hidden h-60 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
      <img
        src={site.images?.[0] || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600'}
        alt={site.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="inline-block text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full capitalize mb-1.5">
          {catIcons[site.category]} {site.category}
        </span>
        <h3 className="font-bold text-white text-base leading-tight">{site.name}</h3>
        <p className="text-white/70 text-xs mt-1">{site.entranceFee ? `ETB ${site.entranceFee} entrance` : '✅ Free Entry'}</p>
      </div>
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold text-amber-600 px-2 py-0.5 rounded-full">
        ⭐ {site.rating?.toFixed(1)}
      </div>
    </Link>
  );
}

export default function Sites() {
  const { t } = useLang();
  const [sites, setSites] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = `Tourist Sites – Visit Bahir Dar`; }, []);

  useEffect(() => {
    API.get('/sites')
      .then(({ data }) => {
        // Handle both array and object responses
        const sitesData = Array.isArray(data) ? data : data.data || data.sites || [];
        setSites(sitesData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-500 font-medium">Loading sites...</p>
      </div>
    </div>
  );

  const filtered = sites
    .filter(s => category === 'all' || s.category === category)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">⛪ Tourist Sites</h1>
        <p className="text-gray-500">Explore Bahir Dar's most iconic landmarks and hidden gems</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input className="input flex-1 min-w-[200px]" placeholder="Search sites..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${category === c ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'}`}>
              {catIcons[c]} {c === 'all' ? 'All Sites' : c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowMap(!showMap)}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${showMap ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}`}>
          {showMap ? '📋 List' : '🗺️ Map'}
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-6">{filtered.length} sites found</p>

      {showMap && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-card">
          <GoogleMapView sites={filtered} height="420px" showFilter={false} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(site => <SiteCard key={site._id} site={site} />)}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-lg">No sites found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
