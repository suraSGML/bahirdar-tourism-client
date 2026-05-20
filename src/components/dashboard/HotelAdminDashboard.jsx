import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../ImageUpload';

const AMENITIES_LIST = ['WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Bar', 'Parking', 'Air Conditioning', 'Room Service', 'Gym', 'Lake View', 'Airport Shuttle', 'Breakfast Included', 'Conference Room', 'Rooftop Bar', '24hr Reception'];

export default function HotelAdminDashboard() {
  const { user, updateUser } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [transports, setTransports] = useState([]);
  const [editingTransport, setEditingTransport] = useState(null);
  const [transportForm, setTransportForm] = useState({ name: '', type: 'car', serviceType: 'airport_pickup', description: '', from: 'Bahir Dar Belay Zeleke Airport', to: '', pricePerTrip: '', capacity: '', contactPhone: '' });

  useEffect(() => {
    Promise.all([
      API.get('/hotels/managed'),
      API.get('/hotels/managed/bookings'),
      API.get('/hotels/managed/analytics'),
      API.get('/transport/my'),
    ]).then(([h, b, a, tr]) => {
      setTransports(tr.data || []);
      setHotel(h.data);
      setBookings(b.data);
      setAnalytics(a.data);
      if (h.data) setForm({
        name: h.data.name || '',
        description: h.data.description || '',
        address: h.data.address || '',
        pricePerNight: h.data.pricePerNight || '',
        amenities: h.data.amenities || [],
        images: h.data.images || [],
      });
      setProfileForm({ name: user.name, email: user.email, password: '', confirmPassword: '' });
    }).catch(() => toast.error('Failed to load dashboard data. Please refresh.'))
      .finally(() => setLoading(false));
  }, [user.name, user.email]);

  const emptyTransportForm = { name: '', type: 'car', serviceType: 'airport_pickup', description: '', from: 'Bahir Dar Belay Zeleke Airport', to: '', pricePerTrip: '', capacity: '', contactPhone: '' };

  const handleTransportSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...transportForm, pricePerTrip: Number(transportForm.pricePerTrip), capacity: Number(transportForm.capacity) };
      if (editingTransport) {
        const { data } = await API.put(`/transport/${editingTransport._id}`, payload);
        setTransports(transports.map(t => t._id === data._id ? data : t));
        toast.success('Transport updated!');
      } else {
        const { data } = await API.post('/transport', payload);
        setTransports([...transports, data]);
        toast.success('Transport service added!');
      }
      setEditingTransport(null);
      setTransportForm(emptyTransportForm);
    } catch { toast.error('Failed to save transport'); }
  };

  const deleteTransport = async (id) => {
    if (!window.confirm('Delete this transport service?')) return;
    try {
      await API.delete(`/transport/${id}`);
      setTransports(transports.filter(t => t._id !== id));
      toast.success('Deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  const startEditTransport = (t) => {
    setEditingTransport(t);
    setTransportForm({ name: t.name, type: t.type, serviceType: t.serviceType, description: t.description, from: t.from, to: t.to, pricePerTrip: t.pricePerTrip, capacity: t.capacity, contactPhone: t.contactPhone || '' });
    setTab('transport');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put('/hotels/managed', { ...form, pricePerNight: Number(form.pricePerNight) });
      setHotel(data);
      toast.success('Hotel updated!');
    } catch { toast.error('Failed to update hotel'); }
  };

  const handleImageUpload = (urls) => {
    const merged = [...new Set([...form.images, ...(Array.isArray(urls) ? urls : [urls])])];
    setForm({ ...form, images: merged });
  };

  const removeImage = (idx) => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });

  const toggleAmenity = (a) => {
    setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a] });
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch { toast.error('Failed to update booking'); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileForm.password && profileForm.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword)
      return toast.error('Passwords do not match');
    try {
      const payload = { name: profileForm.name, email: profileForm.email };
      if (profileForm.password) payload.password = profileForm.password;
      const { data } = await API.put('/hotels/managed/profile', payload);
      updateUser({ ...user, name: data.name, email: data.email });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => !search || b.user?.name?.toLowerCase().includes(search.toLowerCase()) || b.user?.email?.toLowerCase().includes(search.toLowerCase()));

  const revenue = analytics?.revenue || 0;
  const monthly = analytics?.monthly || {};

  if (loading) return <div style={styles.center}>⏳ Loading dashboard...</div>;
  if (!hotel) return <div style={styles.center}>No hotel assigned. Contact the main admin.</div>;

  const tabs = [
    { key: 'overview', label: '🏨 Overview' },
    { key: 'bookings', label: `📋 Bookings ${bookings.filter(b => b.status === 'pending').length > 0 ? `(${bookings.filter(b => b.status === 'pending').length})` : ''}` },
    { key: 'edit', label: '✏️ Edit Hotel' },
    { key: 'images', label: '🖼️ Images' },
    { key: 'analytics', label: '📊 Analytics' },
    { key: 'transport', label: '🚗 Transport' },
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

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          <div style={styles.statsRow}>
            <div style={styles.stat}><span style={styles.statNum}>{bookings.length}</span><span>Total Bookings</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{bookings.filter(b => b.status === 'pending').length}</span><span>Pending</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{bookings.filter(b => b.status === 'confirmed').length}</span><span>Confirmed</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{bookings.filter(b => b.status === 'cancelled').length}</span><span>Cancelled</span></div>
            <div style={{ ...styles.stat, background: '#1a6b3c', color: '#fff' }}><span style={{ ...styles.statNum, color: '#fff' }}>ETB {revenue.toLocaleString()}</span><span>Total Revenue</span></div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardRow}>
              <h3 style={styles.cardTitle}>{hotel.name}</h3>
              <span style={{ ...styles.badge, background: hotel.isApproved ? '#1a6b3c' : '#d97706' }}>
                {hotel.isApproved ? '✅ Approved' : '⏳ Pending'}
              </span>
            </div>
            <div style={styles.imgGrid}>
              {hotel.images?.slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt="" style={styles.gridImg} />
              ))}
            </div>
            <p style={styles.info}>📍 {hotel.address}</p>
            <p style={styles.info}>💰 ETB {hotel.pricePerNight?.toLocaleString()} / night</p>
            <p style={styles.info}>⭐ {hotel.rating} ({hotel.numReviews} reviews)</p>
            <p style={styles.info}>🛎 {hotel.amenities?.join(' · ')}</p>
            <p style={{ marginTop: '0.8rem', color: '#555', lineHeight: 1.6 }}>{hotel.description}</p>
          </div>
        </div>
      )}

      {/* BOOKINGS */}
      {tab === 'bookings' && (
        <div>
          <div style={styles.filterRow}>
            <input style={styles.searchInput} placeholder="Search guest name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={styles.filterBtns}>
              {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f ? styles.activeFilter : {}) }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {filteredBookings.length === 0 && <p style={styles.empty}>No bookings found.</p>}
          {filteredBookings.map(b => (
            <div key={b._id} style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{b.user?.name}</p>
                  <p style={styles.info}>{b.user?.email} {b.user?.phone ? `· ${b.user.phone}` : ''}</p>
                </div>
                <span style={{ ...styles.badge, background: b.status === 'confirmed' ? '#1a6b3c' : b.status === 'cancelled' ? '#e53e3e' : '#d97706' }}>
                  {b.status}
                </span>
              </div>
              <p style={styles.info}>📅 Check-in: <strong>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'}</strong> → Check-out: <strong>{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</strong></p>
              <p style={styles.info}>💰 ETB {b.totalPrice?.toLocaleString()}</p>
              {b.paymentMethod && <p style={styles.info}>💳 Payment: <strong>{b.paymentMethod?.replace(/_/g, ' ')}</strong></p>}
              {b.paymentReference && <p style={styles.info}>🔖 Reference: <strong>{b.paymentReference}</strong></p>}
              {b.message && <p style={styles.info}>📝 "{b.message}"</p>}
              <p style={styles.info}>🕐 Booked on: {new Date(b.createdAt).toLocaleDateString()}</p>
              {b.status === 'pending' && (
                <div style={styles.actions}>
                  <button onClick={() => updateBookingStatus(b._id, 'confirmed')} style={styles.confirmBtn}>✅ Confirm</button>
                  <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={styles.declineBtn}>❌ Decline</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDIT HOTEL */}
      {tab === 'edit' && form && (
        <form onSubmit={handleUpdate} style={styles.form}>
          <h3 style={styles.formTitle}>Edit Hotel Details</h3>
          <label style={styles.label}>Hotel Name</label>
          <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <label style={styles.label}>Description</label>
          <textarea style={styles.input} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <label style={styles.label}>Address</label>
          <input style={styles.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
          <label style={styles.label}>Price Per Night (ETB)</label>
          <input style={styles.input} type="number" value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: e.target.value })} required />
          <label style={styles.label}>Amenities</label>
          <div style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map(a => (
              <label key={a} style={styles.checkLabel}>
                <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                {' '}{a}
              </label>
            ))}
          </div>
          <button type="submit" style={styles.submitBtn}>💾 Save Changes</button>
        </form>
      )}

      {/* IMAGES */}
      {tab === 'images' && form && (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>Manage Hotel Images</h3>
          <ImageUpload multiple onUpload={handleImageUpload} />
          <div style={styles.imgManageGrid}>
            {form.images.map((img, i) => (
              <div key={i} style={styles.imgWrapper}>
                <img src={img} alt="" style={styles.manageImg} />
                {i === 0 && <span style={styles.mainBadge}>Main</span>}
                <button onClick={() => removeImage(i)} style={styles.removeBtn}>✕</button>
              </div>
            ))}
          </div>
          {form.images.length === 0 && <p style={styles.empty}>No images yet. Upload some above.</p>}
          <button onClick={handleUpdate} style={styles.submitBtn}>💾 Save Images</button>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div>
          <div style={styles.statsRow}>
            <div style={styles.stat}><span style={styles.statNum}>{analytics?.total || 0}</span><span>Total Bookings</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{analytics?.confirmed || 0}</span><span>Confirmed</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{analytics?.cancelled || 0}</span><span>Cancelled</span></div>
            <div style={{ ...styles.stat, background: '#1a6b3c', color: '#fff' }}>
              <span style={{ ...styles.statNum, color: '#fff' }}>ETB {revenue.toLocaleString()}</span><span>Revenue</span>
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.formTitle}>Monthly Revenue (Last 6 Months)</h3>
            <div style={styles.chartWrap}>
              {Object.entries(monthly).map(([month, val]) => {
                const max = Math.max(...Object.values(monthly), 1);
                const pct = (val / max) * 100;
                return (
                  <div key={month} style={styles.barCol}>
                    <span style={styles.barVal}>ETB {val.toLocaleString()}</span>
                    <div style={{ ...styles.bar, height: `${Math.max(pct, 4)}%` }} />
                    <span style={styles.barLabel}>{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.formTitle}>Booking Status Breakdown</h3>
            <div style={styles.statsRow}>
              {[
                { label: 'Pending', val: analytics?.pending || 0, color: '#d97706' },
                { label: 'Confirmed', val: analytics?.confirmed || 0, color: '#1a6b3c' },
                { label: 'Cancelled', val: analytics?.cancelled || 0, color: '#e53e3e' },
              ].map(s => (
                <div key={s.label} style={{ ...styles.stat, borderTop: `4px solid ${s.color}` }}>
                  <span style={{ ...styles.statNum, color: s.color }}>{s.val}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRANSPORT */}
      {tab === 'transport' && (
        <div>
          <form onSubmit={handleTransportSave} style={styles.form}>
            <h3 style={styles.formTitle}>{editingTransport ? 'Edit Transport Service' : 'Add Transport Service'}</h3>
            <label style={styles.label}>Service Name</label>
            <input style={styles.input} placeholder="e.g. Airport Pickup - Toyota Land Cruiser" value={transportForm.name} onChange={e => setTransportForm({ ...transportForm, name: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={styles.label}>Vehicle Type</label>
                <select style={styles.input} value={transportForm.type} onChange={e => setTransportForm({ ...transportForm, type: e.target.value })}>
                  {['car', 'van', 'minibus', 'bus', 'taxi'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Service Type</label>
                <select style={styles.input} value={transportForm.serviceType} onChange={e => setTransportForm({ ...transportForm, serviceType: e.target.value })}>
                  <option value="airport_pickup">Airport Pickup</option>
                  <option value="airport_dropoff">Airport Drop-off</option>
                  <option value="hotel_transfer">Hotel Transfer</option>
                  <option value="city_tour">City Tour</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <label style={styles.label}>Description</label>
            <textarea style={styles.input} rows={2} value={transportForm.description} onChange={e => setTransportForm({ ...transportForm, description: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div><label style={styles.label}>From</label><input style={styles.input} value={transportForm.from} onChange={e => setTransportForm({ ...transportForm, from: e.target.value })} required /></div>
              <div><label style={styles.label}>To</label><input style={styles.input} placeholder="e.g. Kuriftu Resort" value={transportForm.to} onChange={e => setTransportForm({ ...transportForm, to: e.target.value })} required /></div>
              <div><label style={styles.label}>Price Per Trip (ETB)</label><input style={styles.input} type="number" value={transportForm.pricePerTrip} onChange={e => setTransportForm({ ...transportForm, pricePerTrip: e.target.value })} required /></div>
              <div><label style={styles.label}>Capacity (persons)</label><input style={styles.input} type="number" value={transportForm.capacity} onChange={e => setTransportForm({ ...transportForm, capacity: e.target.value })} required /></div>
            </div>
            <label style={styles.label}>Contact Phone</label>
            <input style={styles.input} placeholder="+251..." value={transportForm.contactPhone} onChange={e => setTransportForm({ ...transportForm, contactPhone: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" style={styles.submitBtn}>Save Service</button>
              {editingTransport && <button type="button" onClick={() => { setEditingTransport(null); setTransportForm(emptyTransportForm); }} style={{ ...styles.submitBtn, background: '#888' }}>Cancel</button>}
            </div>
          </form>
          <h3 style={{ color: '#1a6b3c', margin: '1.5rem 0 1rem' }}>Your Transport Services ({transports.length})</h3>
          {transports.length === 0 && <p style={styles.empty}>No transport services yet. Add one above.</p>}
          {transports.map(t => (
            <div key={t._id} style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{t.name}</p>
                  <p style={styles.info}>{t.type} · {t.serviceType?.replace(/_/g, ' ')}</p>
                </div>
                <span style={{ ...styles.badge, background: ['airport_pickup','airport_dropoff'].includes(t.serviceType) ? '#2b6cb0' : '#1a6b3c' }}>
                  {t.serviceType?.replace(/_/g, ' ')}
                </span>
              </div>
              <p style={styles.info}>From: {t.from} To: {t.to}</p>
              <p style={styles.info}>ETB {t.pricePerTrip?.toLocaleString()} · {t.capacity} persons</p>
              {t.contactPhone && <p style={styles.info}>{t.contactPhone}</p>}
              <div style={styles.actions}>
                <button onClick={() => startEditTransport(t)} style={styles.confirmBtn}>Edit</button>
                <button onClick={() => deleteTransport(t._id)} style={styles.declineBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileUpdate} style={styles.form}>
          <h3 style={styles.formTitle}>My Account Settings</h3>
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
          <label style={styles.label}>New Password (leave blank to keep current)</label>
          <input style={styles.input} type="password" placeholder="New password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
          <label style={styles.label}>Confirm New Password</label>
          <input style={styles.input} type="password" placeholder="Confirm password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
          <button type="submit" style={styles.submitBtn}>💾 Update Profile</button>
        </form>
      )}
    </div>
  );
}

const styles = {
  center: { textAlign: 'center', padding: '3rem', color: '#888' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { padding: '0.6rem 1.2rem', border: '1px solid #1a6b3c', borderRadius: '6px', cursor: 'pointer', background: '#fff', color: '#1a6b3c', fontSize: '0.9rem' },
  activeTab: { background: '#1a6b3c', color: '#fff' },
  statsRow: { display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: '120px', background: '#f0faf4', borderRadius: '10px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#1a6b3c' },
  statNum: { fontSize: '1.6rem', fontWeight: 700, color: '#1a6b3c' },
  card: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' },
  cardTitle: { margin: 0, color: '#1a6b3c' },
  badge: { color: '#fff', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', textTransform: 'capitalize', whiteSpace: 'nowrap' },
  imgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.8rem' },
  gridImg: { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' },
  info: { color: '#666', fontSize: '0.9rem', margin: '0.25rem 0' },
  filterRow: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '200px', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem' },
  filterBtns: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' },
  activeFilter: { background: '#1a6b3c', color: '#fff', border: '1px solid #1a6b3c' },
  actions: { display: 'flex', gap: '0.8rem', marginTop: '0.8rem' },
  confirmBtn: { padding: '0.5rem 1.2rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  declineBtn: { padding: '0.5rem 1.2rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  formTitle: { color: '#1a6b3c', margin: '0 0 0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', padding: '0.5rem 0' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' },
  submitBtn: { padding: '0.9rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' },
  imgManageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.8rem', margin: '1rem 0' },
  imgWrapper: { position: 'relative' },
  manageImg: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' },
  mainBadge: { position: 'absolute', top: '6px', left: '6px', background: '#1a6b3c', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' },
  removeBtn: { position: 'absolute', top: '6px', right: '6px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chartWrap: { display: 'flex', alignItems: 'flex-end', gap: '0.8rem', height: '180px', padding: '1rem 0 0' },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '0.3rem' },
  bar: { width: '100%', background: '#1a6b3c', borderRadius: '4px 4px 0 0', minHeight: '4px' },
  barLabel: { fontSize: '0.75rem', color: '#666', textAlign: 'center' },
  barVal: { fontSize: '0.65rem', color: '#444', textAlign: 'center' },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '1rem' },
};
