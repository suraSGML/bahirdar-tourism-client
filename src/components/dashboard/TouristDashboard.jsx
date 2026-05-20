import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../ImageUpload';

export default function TouristDashboard() {
  const { user, updateUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState({ hotels: [], guides: [], sites: [] });
  const [tab, setTab] = useState('bookings');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', profileImage: user?.profileImage || '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      API.get('/bookings/my'),
      API.get('/auth/favorites'),
    ]).then(([b, f]) => {
      setBookings(b.data);
      setFavorites(f.data);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.put(`/bookings/${id}/status`, { status: 'cancelled' });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed to cancel'); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileForm.password && profileForm.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword)
      return toast.error('Passwords do not match');
    try {
      const payload = { name: profileForm.name, email: profileForm.email, phone: profileForm.phone, profileImage: profileForm.profileImage };
      if (profileForm.password) payload.password = profileForm.password;
      const { data } = await API.put('/auth/profile', payload);
      updateUser({ ...user, name: data.name, email: data.email, phone: data.phone, profileImage: data.profileImage });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  const removeFavorite = async (type, id) => {
    try {
      const { data } = await API.put('/auth/favorites', { type, id });
      setFavorites(data.favorites);
      toast.success('Removed from favorites');
    } catch { toast.error('Failed to remove'); }
  };

  const printBooking = (b) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Booking Confirmation</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}
      h1{color:#1a6b3c}.badge{background:#1a6b3c;color:#fff;padding:4px 12px;border-radius:20px;font-size:14px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .footer{margin-top:30px;color:#888;font-size:12px;text-align:center}</style>
      </head><body>
      <h1>Visit Bahir Dar</h1>
      <h2>Booking Confirmation <span class="badge">${b.status.toUpperCase()}</span></h2>
      <div class="row"><span>Booking ID</span><span>${b._id}</span></div>
      <div class="row"><span>Type</span><span>${b.bookingType}</span></div>
      <div class="row"><span>Name</span><span>${b.hotel?.name || b.guide?.bio?.slice(0, 30) || b.transport?.name || 'N/A'}</span></div>
      <div class="row"><span>Check-in</span><span>${b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'}</span></div>
      <div class="row"><span>Check-out</span><span>${b.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</span></div>
      <div class="row"><strong>Total</strong><strong>ETB ${b.totalPrice?.toLocaleString()}</strong></div>
      <div class="footer">Visit Bahir Dar Tourism Platform | info@visitbahirdar.et | +251 582 200 000</div>
      <script>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  if (loading) return <div style={styles.empty}>⏳ Loading...</div>;

  const tabs = [
    { key: 'bookings', label: `📋 Bookings (${bookings.length})` },
    { key: 'favorites', label: `❤️ Favorites (${(favorites.hotels?.length || 0) + (favorites.guides?.length || 0) + (favorites.sites?.length || 0)})` },
    { key: 'profile', label: '👤 My Profile' },
  ];

  return (
    <div>
      <div style={styles.tabs}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* BOOKINGS */}
      {tab === 'bookings' && (
        <div>
          <div style={styles.filterRow}>
            {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f ? styles.activeFilter : {}) }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {filteredBookings.length === 0 && <p style={styles.empty}>No bookings found.</p>}
          {filteredBookings.map(b => (
            <div key={b._id} style={styles.card}>
              <div style={styles.cardRow}>
                <span style={styles.type}>
                  {b.bookingType === 'hotel' ? '🏨 Hotel' : b.bookingType === 'guide' ? '🧭 Guide' : '🚤 Transport'}
                </span>
                <span style={{ ...styles.statusBadge, background: b.status === 'confirmed' ? '#1a6b3c' : b.status === 'cancelled' ? '#e53e3e' : '#d97706' }}>
                  {b.status}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0', fontWeight: 600 }}>
                {b.hotel?.name || (b.guide ? 'Guide Tour' : b.transport?.name || 'Transport')}
              </p>
              <p style={styles.info}>📅 {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'} → {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</p>
              <p style={styles.info}>💰 ETB {b.totalPrice?.toLocaleString()}</p>
              {b.bookingType === 'transport' && <p style={{ ...styles.info, color: '#d97706', fontWeight: 600 }}>💵 Pay cash to the driver on the day of your trip</p>}
              {b.bookingType === 'hotel' && b.paymentMethod === 'cash' && <p style={{ ...styles.info, color: '#d97706', fontWeight: 600 }}>💵 Pay at the hotel upon check-in</p>}
              {b.bookingType === 'hotel' && b.paymentMethod !== 'cash' && b.paymentMethod && <p style={{ ...styles.info, color: '#1a6b3c', fontWeight: 600 }}>💳 Payment via {b.paymentMethod?.replace('_', ' ')}</p>}
              {b.bookingType === 'guide' && b.paymentMethod === 'cash' && <p style={{ ...styles.info, color: '#d97706', fontWeight: 600 }}>💵 Pay the guide after your tour</p>}
              {b.bookingType === 'guide' && b.paymentMethod !== 'cash' && b.paymentMethod && <p style={{ ...styles.info, color: '#1a6b3c', fontWeight: 600 }}>💳 Payment via {b.paymentMethod?.replace('_', ' ')}</p>}
              <p style={styles.info}>🕐 Booked: {new Date(b.createdAt).toLocaleDateString()}</p>
              <div style={styles.actions}>
                <button onClick={() => printBooking(b)} style={styles.printBtn}>🖨️ Print</button>
                {b.status === 'pending' && (
                  <button onClick={() => cancelBooking(b._id)} style={styles.cancelBtn}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAVORITES */}
      {tab === 'favorites' && (
        <div>
          {favorites.hotels?.length > 0 && (
            <div>
              <h3 style={styles.sectionTitle}>🏨 Saved Hotels</h3>
              {favorites.hotels.map(h => (
                <div key={h._id} style={styles.favCard}>
                  <img src={h.images?.[0]} alt="" style={styles.favImg} />
                  <div style={{ flex: 1 }}>
                    <Link to={`/hotels/${h._id}`} style={{ color: '#1a6b3c', fontWeight: 600, textDecoration: 'none' }}>{h.name}</Link>
                    <p style={styles.info}>📍 {h.address} · ETB {h.pricePerNight?.toLocaleString()}/night</p>
                    <p style={styles.info}>⭐ {h.rating?.toFixed(1)}</p>
                  </div>
                  <button onClick={() => removeFavorite('hotels', h._id)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
          {favorites.guides?.length > 0 && (
            <div>
              <h3 style={styles.sectionTitle}>🧭 Saved Guides</h3>
              {favorites.guides.map(g => (
                <div key={g._id} style={styles.favCard}>
                  {g.profileImage && <img src={g.profileImage} alt="" style={{ ...styles.favImg, borderRadius: '50%' }} />}
                  <div style={{ flex: 1 }}>
                    <Link to={`/guides/${g._id}`} style={{ color: '#1a6b3c', fontWeight: 600, textDecoration: 'none' }}>{g.user?.name || 'Guide'}</Link>
                    <p style={styles.info}>ETB {g.pricePerDay?.toLocaleString()}/day · ⭐ {g.rating?.toFixed(1)}</p>
                  </div>
                  <button onClick={() => removeFavorite('guides', g._id)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
          {favorites.sites?.length > 0 && (
            <div>
              <h3 style={styles.sectionTitle}>⛪ Saved Sites</h3>
              {favorites.sites.map(s => (
                <div key={s._id} style={styles.favCard}>
                  <img src={s.images?.[0]} alt="" style={styles.favImg} />
                  <div style={{ flex: 1 }}>
                    <Link to={`/sites/${s._id}`} style={{ color: '#1a6b3c', fontWeight: 600, textDecoration: 'none' }}>{s.name}</Link>
                    <p style={styles.info}>{s.category} · {s.entranceFee ? `ETB ${s.entranceFee}` : 'Free'}</p>
                  </div>
                  <button onClick={() => removeFavorite('sites', s._id)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
          {!favorites.hotels?.length && !favorites.guides?.length && !favorites.sites?.length && (
            <p style={styles.empty}>No favorites yet. Click ❤️ on any hotel, guide, or site to save it here.</p>
          )}
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileUpdate} style={styles.form}>
          <h3 style={styles.sectionTitle}>My Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {profileForm.profileImage
              ? <img src={profileForm.profileImage} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{user?.name?.[0]}</div>
            }
            <ImageUpload onUpload={(url) => setProfileForm({ ...profileForm, profileImage: url })} />
          </div>
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
          <label style={styles.label}>Phone</label>
          <input style={styles.input} placeholder="+251..." value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
          <label style={styles.label}>New Password (leave blank to keep current)</label>
          <input style={styles.input} type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
          <label style={styles.label}>Confirm New Password</label>
          <input style={styles.input} type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
          <button type="submit" style={styles.submitBtn}>💾 Save Profile</button>
        </form>
      )}
    </div>
  );
}

const styles = {
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { padding: '0.6rem 1.2rem', border: '1px solid #1a6b3c', borderRadius: '6px', cursor: 'pointer', background: '#fff', color: '#1a6b3c', fontSize: '0.9rem' },
  activeTab: { background: '#1a6b3c', color: '#fff' },
  filterRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' },
  activeFilter: { background: '#1a6b3c', color: '#fff', border: '1px solid #1a6b3c' },
  card: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  type: { fontWeight: 'bold', color: '#555' },
  statusBadge: { color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize' },
  info: { color: '#666', fontSize: '0.9rem', margin: '0.2rem 0' },
  actions: { display: 'flex', gap: '0.8rem', marginTop: '0.8rem' },
  printBtn: { padding: '0.4rem 1rem', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { padding: '0.4rem 1rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem' },
  favCard: { display: 'flex', gap: '1rem', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '0.8rem' },
  favImg: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  removeBtn: { background: '#fee2e2', color: '#e53e3e', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', flexShrink: 0 },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '0.9rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '2rem' },
};
