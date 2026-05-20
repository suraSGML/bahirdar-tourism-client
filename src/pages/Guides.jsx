import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useLang } from '../context/LanguageContext';

export function GuideCard({ guide, t }) {
  return (
    <Link to={`/guides/${guide._id}`}
      className="card group block p-5 text-center hover:-translate-y-1 transition-all duration-300">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <img
          src={guide.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
          alt={guide.user?.name || 'Guide'}
          className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 group-hover:border-primary-400 transition-all duration-300"
          loading="lazy"
        />
        <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          ⭐ {guide.rating?.toFixed(1)}
        </div>
      </div>
      <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-primary-600 transition-colors">{guide.user?.name}</h3>
      <p className="text-gray-400 text-sm mb-1">🗣 {guide.languages?.slice(0, 2).join(', ')}</p>
      <p className="text-gray-400 text-sm mb-3 line-clamp-1">🎯 {guide.specialties?.[0]}</p>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-primary-600 font-bold">ETB {guide.pricePerDay}<span className="text-gray-400 font-normal text-xs">/day</span></span>
        <span className="text-xs text-gray-400">{guide.numReviews} reviews</span>
      </div>
    </Link>
  );
}

export default function Guides() {
  const { t } = useLang();
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { document.title = `Tour Guides – Visit Bahir Dar`; }, []);

  useEffect(() => {
    API.get('/guides')
      .then(({ data }) => {
        // Handle both array and object responses
        const guidesData = Array.isArray(data) ? data : data.data || data.guides || [];
        setGuides(guidesData);
      })
      .catch(() => setError('Failed to load guides.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-500 font-medium">Loading guides...</p>
      </div>
    </div>
  );

  const allLanguages = [...new Set(guides.flatMap(g => g.languages || []))];

  const filtered = guides
    .filter(g => g.user?.name?.toLowerCase().includes(search.toLowerCase()) || g.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase())))
    .filter(g => language ? g.languages?.includes(language) : true)
    .filter(g => maxPrice ? g.pricePerDay <= Number(maxPrice) : true)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price_desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🧭 Tour Guides</h1>
        <p className="text-gray-500">Expert local guides to make your Bahir Dar experience unforgettable</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input className="input flex-1 min-w-[180px]" placeholder="Search guides or specialties..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-44" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="">All Languages</option>
          {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input className="input w-44" type="number" placeholder="Max price/day (ETB)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        <select className="input w-44" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Sort by</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        {(search || language || maxPrice || sortBy !== 'default') && (
          <button onClick={() => { setSearch(''); setLanguage(''); setMaxPrice(''); setSortBy('default'); }}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      <p className="text-gray-400 text-sm mb-6">{filtered.length} guides found</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {filtered.map(guide => <GuideCard key={guide._id} guide={guide} t={t} />)}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-lg">No guides found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
