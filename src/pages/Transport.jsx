import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const typeConfig = {
  boat:    { icon: '🚤', color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700',   border: 'border-blue-400' },
  taxi:    { icon: '🚕', color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700', border: 'border-amber-400' },
  bus:     { icon: '🚌', color: 'bg-emerald-500',light: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-400' },
  minibus: { icon: '🚐', color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700', border: 'border-purple-400' },
  car:     { icon: '🚗', color: 'bg-rose-500',   light: 'bg-rose-50 text-rose-700',   border: 'border-rose-400' },
  van:     { icon: '🚐', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-400' },
};

export default function Transport() {
  const { user } = useAuth();
  const { t } = useLang();
  const [transports, setTransports] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Transport – Visit Bahir Dar'; }, []);

  useEffect(() => {
    API.get('/transport')
      .then(({ data }) => {
        // Handle both array and object responses
        const transportData = Array.isArray(data) ? data : data.data || data.transport || [];
        setTransports(transportData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (transport) => {
    if (!user) return toast.error('Please login to book');
    if (!bookingDate) return toast.error('Please select a date');
    try {
      const totalPrice = transport.pricePerTrip;
      const { data } = await API.post('/bookings', {
        bookingType: 'transport', 
        transport: transport._id,
        checkIn: bookingDate, 
        checkOut: bookingDate, 
        totalPrice,
        paymentMethod: 'pay_on_arrival',
      });
      // Fetch transport payment accounts for confirmation
      const transportData = await API.get(`/transport/${transport._id}`);
      setBookingConfirmed({ 
        ...data.booking || data, 
        transportName: transport.name, 
        transportPrice: transport.pricePerTrip,
        paymentAccounts: transportData.data.paymentAccounts 
      });
      setSelected(null); 
      setBookingDate('');
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Booking failed'); 
    }
  };

  const types = [...new Set(transports.map(t => t.type))];
  const filtered = transports
    .filter(tr => typeFilter === 'all' || tr.type === typeFilter)
    .filter(tr => !search || tr.name.toLowerCase().includes(search.toLowerCase()) || tr.from.toLowerCase().includes(search.toLowerCase()) || tr.to.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-500 font-medium">Loading transport...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🚤 Transport Services</h1>
        <p className="text-gray-500">Boats, taxis, buses and more to get you around Bahir Dar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {types.map(type => {
          const cfg = typeConfig[type] || typeConfig.taxi;
          const count = transports.filter(t => t.type === type).length;
          return (
            <div key={type} className={`card p-4 flex flex-col items-center gap-1 border-t-4 ${cfg.border} cursor-pointer hover:-translate-y-0.5 transition-all duration-200 ${typeFilter === type ? 'ring-2 ring-primary-400' : ''}`}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
              <span className="text-3xl">{cfg.icon}</span>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
              <span className="text-xs text-gray-400 capitalize">{type} services</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input className="input flex-1 min-w-[200px]" placeholder="Search by name, from or to..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${typeFilter === 'all' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'}`}>
            All Types
          </button>
          {types.map(type => {
            const cfg = typeConfig[type] || typeConfig.taxi;
            return (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${typeFilter === type ? `${cfg.color} text-white shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cfg.icon} {type}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-6">{filtered.length} services found</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filtered.map(tr => {
          const cfg = typeConfig[tr.type] || typeConfig.taxi;
          const isSelected = selected?._id === tr._id;
          return (
            <div key={tr._id} className="card overflow-hidden hover:-translate-y-1 transition-all duration-300">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {tr.images?.[0]
                  ? <img src={tr.images[0]} alt={tr.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  : <div className={`w-full h-full flex items-center justify-center ${cfg.light}`}>
                      <span className="text-6xl">{cfg.icon}</span>
                    </div>
                }
                <span className={`absolute top-3 left-3 ${cfg.color} text-white text-xs font-bold px-3 py-1 rounded-full capitalize`}>
                  {cfg.icon} {tr.type}
                </span>
                {!tr.isAvailable && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Unavailable</span>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{tr.name}</h3>
                <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-3 py-2 mb-3 text-sm">
                  <span className="text-gray-600 font-medium truncate">📍 {tr.from}</span>
                  <span className="text-primary-500 font-bold flex-shrink-0">→</span>
                  <span className="text-gray-600 font-medium truncate">🏁 {tr.to}</span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{tr.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: '👥', label: 'Capacity', val: `${tr.capacity} persons` },
                    { icon: '📞', label: 'Contact', val: tr.contactPhone || 'N/A' },
                    { icon: '✅', label: 'Status', val: tr.isAvailable ? 'Available' : 'Unavailable', color: tr.isAvailable ? 'text-emerald-600' : 'text-red-500' },
                    { icon: '🚦', label: 'Type', val: tr.type, capitalize: true },
                  ].map(d => (
                    <div key={d.label} className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{d.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{d.label}</p>
                        <p className={`text-xs font-semibold truncate ${d.color || 'text-gray-700'} ${d.capitalize ? 'capitalize' : ''}`}>{d.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-primary-600 font-bold text-2xl">ETB {tr.pricePerTrip?.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">/trip</span>
                  </div>
                  {tr.isAvailable && (
                    <button onClick={() => setSelected(isSelected ? null : tr)}
                      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${isSelected ? 'bg-gray-200 text-gray-600' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:-translate-y-0.5'}`}>
                      {isSelected ? 'Cancel' : 'Book Now'}
                    </button>
                  )}
                </div>

                {/* Booking Form */}
                {isSelected && (
                  <div className="mt-4 bg-primary-50 rounded-2xl p-4 animate-slide-up">
                    <h4 className="font-bold text-primary-700 mb-3">Select Trip Date</h4>
                    <input type="date" className="input mb-3" value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} />
                    <div className="bg-white rounded-xl p-3 mb-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600"><span>Service</span><span className="font-medium">{tr.name}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Route</span><span className="font-medium">{tr.from} → {tr.to}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Capacity</span><span className="font-medium">{tr.capacity} persons</span></div>
                      <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-primary-600">ETB {tr.pricePerTrip?.toLocaleString()}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleBook(tr)} className="flex-1 btn-primary py-2.5 text-sm">✅ Confirm Booking</button>
                      <button onClick={() => setSelected(null)} className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">✕</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">💵 Pay cash to the driver on the day of your trip</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">No transport services found.</p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-primary-50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Getting Around Bahir Dar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: '🚤', title: 'Boat Tours', desc: "Explore Lake Tana's island monasteries by traditional boat from the main port." },
            { icon: '🚕', title: 'Taxi Services', desc: 'Comfortable taxis available 24/7 for city transfers and airport pickups.' },
            { icon: '🚐', title: 'Minibus Shuttles', desc: 'Shared minibus services connecting hotels, university and city center.' },
            { icon: '🚌', title: 'City Buses', desc: 'Affordable public buses running regular routes across Bahir Dar.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-5 text-center shadow-card hover:-translate-y-1 transition-all duration-300">
              <span className="text-4xl block mb-3">{item.icon}</span>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {bookingConfirmed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-5xl text-center mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Trip Booked!</h2>
            <p className="text-gray-400 text-center mb-6">Your transport booking has been submitted.</p>
            <div className="bg-primary-50 rounded-2xl p-5 mb-5 space-y-2 text-sm">
              <h3 className="font-bold text-primary-700 mb-3">💰 Payment — Pay on the Day</h3>
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold">{bookingConfirmed.transportName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Trip Date</span><span className="font-semibold">{bookingConfirmed.checkIn ? new Date(bookingConfirmed.checkIn).toLocaleDateString() : 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary-600">ETB {bookingConfirmed.transportPrice?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Booking Ref</span><span className="font-bold">BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</span></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                <p className="text-amber-700 text-xs">💵 Pay <strong>ETB {bookingConfirmed.transportPrice?.toLocaleString()}</strong> cash to the driver. Show reference <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong>.</p>
              </div>
            </div>
            <button onClick={() => setBookingConfirmed(null)} className="btn-primary w-full">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
