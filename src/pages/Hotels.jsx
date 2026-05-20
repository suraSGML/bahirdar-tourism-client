import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import GoogleMapView from '../components/GoogleMapView';
import { useLang } from '../context/LanguageContext';

export default function Hotels() {
  const { t } = useLang();
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { document.title = `Hotels – Visit Bahir Dar`; }, []);

  useEffect(() => {
    API.get('/hotels')
      .then(({ data }) => {
        // Handle both array and object responses
        const hotelsData = Array.isArray(data) ? data : data.data || data.hotels || [];
        setHotels(hotelsData);
      })
      .catch(() => setError('Failed to load hotels. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-500 font-medium">Loading hotels...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-red-500 text-lg">{error}</p>
    </div>
  );

  const filtered = hotels
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase()))
    .filter(h => maxPrice ? h.pricePerNight <= Number(maxPrice) : true)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price_desc') return b.pricePerNight - a.pricePerNight;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🏨 Hotels in Bahir Dar</h1>
        <p className="text-gray-500">Find the perfect place to stay on the shores of Lake Tana</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Search hotels or location..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <input
          className="input w-44"
          type="number" placeholder="Max price (ETB)"
          value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
        />
        <select className="input w-44" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Sort by</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${showMap ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}`}
        >
          {showMap ? '📋 List View' : '🗺️ Map View'}
        </button>
        {(search || maxPrice || sortBy !== 'default') && (
          <button onClick={() => { setSearch(''); setMaxPrice(''); setSortBy('default'); }}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      <p className="text-gray-400 text-sm mb-6">{filtered.length} hotels found</p>

      {/* Map */}
      {showMap && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-card">
          <GoogleMapView hotels={filtered} height="420px" showFilter={false} />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(hotel => (
          <Link to={`/hotels/${hotel._id}`} key={hotel._id}
            className="card group overflow-hidden block hover:-translate-y-1 transition-all duration-300">
            <div className="relative overflow-hidden h-52">
              <img
                src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary-600 text-xs font-bold px-2.5 py-1 rounded-full">
                ⭐ {hotel.rating?.toFixed(1)}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">{hotel.name}</h3>
              <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">📍 {hotel.address}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {hotel.amenities?.slice(0, 3).map(a => (
                  <span key={a} className="bg-primary-50 text-primary-600 text-xs px-2.5 py-1 rounded-full font-medium">{a}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-primary-600 font-bold text-xl">ETB {hotel.pricePerNight?.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/night</span>
                </div>
                <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full group-hover:bg-primary-600 transition-colors">
                  Book Now
                </span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-lg">No hotels found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
