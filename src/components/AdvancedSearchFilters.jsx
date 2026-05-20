import { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';

export default function AdvancedSearchFilters({ onSearch, type = 'hotels' }) {
  const [filters, setFilters] = useState({
    query: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    amenities: [],
    languages: [],
    specialties: [],
    category: '',
    sortBy: 'rating',
  });
  const [loading, setLoading] = useState(false);

  const amenitiesList = [
    'WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Bar', 'Lake View',
    'Boat Tours', 'Parking', 'Air Conditioning', 'Garden', 'Conference Room',
  ];

  const languagesList = ['English', 'Amharic', 'Arabic', 'French', 'German', 'Italian'];

  const specialtiesList = [
    'Historical Tours', 'Nature Walks', 'Photography', 'Adventure',
    'Cultural Experience', 'Religious Sites', 'Water Sports',
  ];

  const categoriesList = ['monastery', 'lake', 'museum', 'park', 'other'];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value],
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.amenities.length) params.append('amenities', filters.amenities.join(','));
      if (filters.languages.length) params.append('languages', filters.languages.join(','));
      if (filters.specialties.length) params.append('specialties', filters.specialties.join(','));
      if (filters.category) params.append('category', filters.category);

      const endpoint = type === 'hotels' ? '/search/hotels' : 
                      type === 'guides' ? '/search/guides' :
                      type === 'sites' ? '/search/sites' : '/search';

      const { data } = await API.get(`${endpoint}?${params.toString()}`);
      onSearch(data);
      toast.success(`Found ${data.data?.length || 0} results`);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      query: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      amenities: [],
      languages: [],
      specialties: [],
      category: '',
      sortBy: 'rating',
    });
  };

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Advanced Search</h2>

      {/* Search Query */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
        <input
          type="text"
          name="query"
          placeholder="Search by name, description..."
          value={filters.query}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price</label>
          <input
            type="number"
            name="minPrice"
            placeholder="0"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
          <input
            type="number"
            name="maxPrice"
            placeholder="10000"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Rating</label>
        <select
          name="rating"
          value={filters.rating}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>

      {/* Amenities (Hotels) */}
      {type === 'hotels' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
          <div className="grid grid-cols-2 gap-2">
            {amenitiesList.map(amenity => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleMultiSelect('amenities', amenity)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Languages (Guides) */}
      {type === 'guides' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
          <div className="grid grid-cols-2 gap-2">
            {languagesList.map(lang => (
              <label key={lang} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.languages.includes(lang)}
                  onChange={() => handleMultiSelect('languages', lang)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{lang}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Specialties (Guides) */}
      {type === 'guides' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Specialties</label>
          <div className="grid grid-cols-2 gap-2">
            {specialtiesList.map(specialty => (
              <label key={specialty} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.specialties.includes(specialty)}
                  onChange={() => handleMultiSelect('specialties', specialty)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category (Sites) */}
      {type === 'sites' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sort By */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="rating">Highest Rating</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
