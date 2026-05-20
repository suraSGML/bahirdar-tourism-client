import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../ImageUpload';

const emptyForm = { name: '', type: 'boat', serviceType: 'general', description: '', from: '', to: '', pricePerTrip: '', capacity: '', contactPhone: '', images: [] };
const typeIcons = { boat: '🚤', taxi: '🚕', bus: '🚌', minibus: '🚐', car: '🚗', van: '🚐' };
const serviceLabels = { airport_pickup: '✈️ Airport Pickup', airport_dropoff: '✈️ Airport Drop-off', city_tour: '🗺️ City Tour', hotel_transfer: '🏨 Hotel Transfer', guide_transport: '🧭 Guide Transport', general: '🚗 General' };

export default function TransportOwnerDashboard() {
  const { user, updateUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/transport/my'),
      API.get('/bookings/received'),
    ]).then(([tr, b]) => {
      setTransports(tr.data);
      setBookings(b.data.filter(bk => bk.bookingType === 'transport'));
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, pricePerTrip: Number(form.pricePerTrip), capacity: Number(form.capacity) };
    try {
      if (editId) {
        const { data } = await API.put(`/transport/${editId}`, payload);
        setTransports(transports.map(t => t._id === editId ? data : t));
        toast.success('Service updated!');
      } else {
        const { data } = await API.post('/transport', payload);
        setTransports([...transports, data]);
        toast.success('Service added! Waiting for admin approval.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleEdit = (tr) => {
    setForm({ name: tr.name, type: tr.type, serviceType: tr.serviceType || 'general', description: tr.description, from: tr.from, to: tr.to, pricePerTrip: tr.pricePerTrip, capacity: tr.capacity, contactPhone: tr.contactPhone || '', images: tr.images || [] });
    setEditId(tr._id); setShowForm(true); setTab('services'); window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try { await API.delete(`/transport/${id}`); setTransports(transports.filter(t => t._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleAvailability = async (tr) => {
    try {
      const { data } = await API.put(`/transport/${tr._id}`, { ...tr, isAvailable: !tr.isAvailable });
      setTransports(transports.map(t => t._id === tr._id ? data : t));
      toast.success(`Marked as ${data.isAvailable ? 'available' : 'unavailable'}`);
    } catch { toast.error('Failed to update'); }
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
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) return toast.error('Passwords do not match');
    try {
      const payload = { name: profileForm.name, email: profileForm.email, phone: profileForm.phone };
      if (profileForm.password) payload.password = profileForm.password;
      const { data } = await API.put('/auth/profile', payload);
      updateUser({ ...user, name: data.name, email: data.email, phone: data.phone });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  const pending = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const revenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.totalPrice || 0), 0);
  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter).filter(b => !search || b.user?.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>⏳ Loading...</div>;

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'services', label: `🚤 My Services (${transports.length})` },
    { key: 'bookings', label: `📋 Bookings${pending > 0 ? ` (${pending})` : ''}` },
    { key: 'payment', label: '💰 Payment Info' },
    { key: 'profile', label: '👤 Profile' },
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
            <div style={styles.stat}><span style={styles.statNum}>{transports.length}</span><span>My Services</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{bookings.length}</span><span>Total Bookings</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{pending}</span><span>Pending</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{confirmed}</span><span>Confirmed</span></div>
            <div style={{ ...styles.stat, background: '#1a6b3c', color: '#fff' }}>
              <span style={{ ...styles.statNum, color: '#fff' }}>ETB {revenue.toLocaleString()}</span><span>Revenue</span>
            </div>
          </div>

          {/* Payment explanation */}
          <div style={styles.infoBox}>
            <h3 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>💰 How Payment Works</h3>
            <p style={styles.infoText}>Tourists book your service online through this platform. <strong>Payment is collected by you directly</strong> from the tourist on the day of the trip — cash or mobile money (Telebirr, CBE Birr).</p>
            <p style={styles.infoText}>Your job: <strong>Confirm</strong> bookings you can fulfill, <strong>Decline</strong> ones you cannot. The tourist will be notified by email automatically.</p>
          </div>

          <h3 style={{ color: '#1a6b3c', margin: '1.5rem 0 1rem' }}>My Services</h3>
          {transports.length === 0 && <p style={styles.empty}>No services yet. Go to "My Services" tab to add one.</p>}
          {transports.slice(0, 3).map(tr => (
            <div key={tr._id} style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{typeIcons[tr.type] || '🚗'} {tr.name}</p>
                  <p style={styles.info}>{tr.from} → {tr.to} · ETB {tr.pricePerTrip?.toLocaleString()}/trip</p>
                </div>
                <span style={{ ...styles.badge, background: tr.isAvailable ? '#1a6b3c' : '#e53e3e' }}>
                  {tr.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SERVICES */}
      {tab === 'services' && (
        <div>
          <button onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditId(null); }} style={styles.addBtn}>
            {showForm ? 'Cancel' : '+ Add New Service'}
          </button>
          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editId ? 'Edit Service' : 'Add Transport Service'}</h3>
              <label style={styles.label}>Service Name *</label>
              <input style={styles.input} placeholder="e.g. Airport Pickup - Toyota Land Cruiser" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={styles.label}>Vehicle Type *</label>
                  <select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['boat', 'taxi', 'bus', 'minibus', 'car', 'van'].map(t => <option key={t} value={t}>{typeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Service Type *</label>
                  <select style={styles.input} value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}>
                    {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <label style={styles.label}>Description *</label>
              <textarea style={styles.input} rows={3} placeholder="Describe your service..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div><label style={styles.label}>From *</label><input style={styles.input} placeholder="e.g. Bahir Dar Airport" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required /></div>
                <div><label style={styles.label}>To *</label><input style={styles.input} placeholder="e.g. City Center Hotels" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required /></div>
                <div><label style={styles.label}>Price Per Trip (ETB) *</label><input style={styles.input} type="number" value={form.pricePerTrip} onChange={e => setForm({ ...form, pricePerTrip: e.target.value })} required /></div>
                <div><label style={styles.label}>Capacity (persons) *</label><input style={styles.input} type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required /></div>
              </div>
              <label style={styles.label}>Contact Phone</label>
              <input style={styles.input} placeholder="+251..." value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
              <label style={styles.label}>Photos</label>
              <ImageUpload multiple onUpload={(urls) => setForm({ ...form, images: urls })} />
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button type="submit" style={styles.submitBtn}>{editId ? 'Update' : 'Add Service'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{ ...styles.submitBtn, background: '#888' }}>Cancel</button>
              </div>
            </form>
          )}
          {transports.length === 0 && !showForm && <div style={styles.emptyBox}><span style={{ fontSize: '3rem' }}>🚤</span><p>No services yet. Add your first one above!</p></div>}
          {transports.map(tr => (
            <div key={tr._id} style={styles.card}>
              <div style={styles.cardRow}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                  {tr.images?.[0] && <img src={tr.images[0]} alt="" style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{typeIcons[tr.type] || '🚗'} {tr.name}</p>
                    <p style={styles.info}>{serviceLabels[tr.serviceType] || 'General'}</p>
                    <p style={styles.info}>📍 {tr.from} → {tr.to}</p>
                    <p style={styles.info}>💰 ETB {tr.pricePerTrip?.toLocaleString()} · 👥 {tr.capacity} persons · 📞 {tr.contactPhone || 'N/A'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                  <span style={{ ...styles.badge, background: tr.isApproved ? '#1a6b3c' : '#d97706' }}>{tr.isApproved ? '✅ Approved' : '⏳ Pending'}</span>
                  <span style={{ ...styles.badge, background: tr.isAvailable ? '#2b6cb0' : '#e53e3e' }}>{tr.isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
              </div>
              <div style={styles.actions}>
                <button onClick={() => handleEdit(tr)} style={styles.editBtn}>✏️ Edit</button>
                <button onClick={() => toggleAvailability(tr)} style={{ ...styles.editBtn, background: tr.isAvailable ? '#d97706' : '#1a6b3c' }}>
                  {tr.isAvailable ? '⏸ Unavailable' : '▶ Available'}
                </button>
                <button onClick={() => handleDelete(tr._id)} style={styles.deleteBtn}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKINGS */}
      {tab === 'bookings' && (
        <div>
          <div style={styles.filterRow}>
            <input style={styles.searchInput} placeholder="Search guest name..." value={search} onChange={e => setSearch(e.target.value)} />
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
            <div key={b._id} style={{ ...styles.card, borderLeft: `4px solid ${b.status === 'confirmed' ? '#1a6b3c' : b.status === 'cancelled' ? '#e53e3e' : '#d97706'}` }}>
              <div style={styles.cardRow}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{b.user?.name}</p>
                  <p style={styles.info}>{b.user?.email} {b.user?.phone ? `· ${b.user.phone}` : ''}</p>
                </div>
                <span style={{ ...styles.badge, background: b.status === 'confirmed' ? '#1a6b3c' : b.status === 'cancelled' ? '#e53e3e' : '#d97706' }}>
                  {b.status}
                </span>
              </div>
              <p style={styles.info}>🚗 {b.transport?.name || 'Transport Service'}</p>
              <p style={styles.info}>📅 Trip Date: <strong>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'}</strong></p>
              <p style={styles.info}>💰 ETB {b.totalPrice?.toLocaleString()} — <strong style={{ color: '#d97706' }}>Collect cash on the day</strong></p>
              {b.paymentReference && <p style={styles.info}>🔖 Reference: <strong>{b.paymentReference}</strong></p>}
              {b.message && <p style={styles.info}>📝 "{b.message}"</p>}
              <p style={styles.info}>🕐 Booked: {new Date(b.createdAt).toLocaleDateString()}</p>
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

      {/* PAYMENT INFO */}
      {tab === 'payment' && (
        <div>
          <div style={styles.infoBox}>
            <h3 style={{ color: '#1a6b3c', margin: '0 0 1rem' }}>💰 Payment & Revenue Guide</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={styles.payStep}>
                <span style={styles.stepNum}>1</span>
                <div><strong>Tourist books online</strong><p style={styles.infoText}>Tourist selects your service, picks a date, and submits a booking request through the website.</p></div>
              </div>
              <div style={styles.payStep}>
                <span style={styles.stepNum}>2</span>
                <div><strong>You confirm or decline</strong><p style={styles.infoText}>Go to the Bookings tab and confirm if you can fulfill the trip. The tourist gets an email notification automatically.</p></div>
              </div>
              <div style={styles.payStep}>
                <span style={styles.stepNum}>3</span>
                <div><strong>Tourist pays you directly</strong><p style={styles.infoText}>On the day of the trip, collect payment in cash or via mobile money (Telebirr, CBE Birr, Amhara Bank). The website does NOT process payments.</p></div>
              </div>
              <div style={styles.payStep}>
                <span style={styles.stepNum}>4</span>
                <div><strong>Revenue tracking</strong><p style={styles.infoText}>Your confirmed bookings are tracked here as revenue. This is for your records only — actual money is collected by you.</p></div>
              </div>
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={{ color: '#1a6b3c', margin: '0 0 1rem' }}>📊 Revenue Summary</h3>
            <div style={styles.statsRow}>
              <div style={styles.stat}><span style={styles.statNum}>{bookings.length}</span><span>Total Bookings</span></div>
              <div style={styles.stat}><span style={styles.statNum}>{confirmed}</span><span>Confirmed</span></div>
              <div style={styles.stat}><span style={styles.statNum}>{pending}</span><span>Pending</span></div>
              <div style={{ ...styles.stat, background: '#1a6b3c', color: '#fff' }}>
                <span style={{ ...styles.statNum, color: '#fff' }}>ETB {revenue.toLocaleString()}</span><span>Expected Revenue</span>
              </div>
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>* Revenue shown is from confirmed bookings. Actual collection is done by you on the day of service.</p>
          </div>
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
  statsRow: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: '110px', background: '#f0faf4', borderRadius: '10px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#1a6b3c' },
  statNum: { fontSize: '1.6rem', fontWeight: 700, color: '#1a6b3c' },
  card: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' },
  badge: { color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', textTransform: 'capitalize', whiteSpace: 'nowrap' },
  info: { color: '#666', fontSize: '0.9rem', margin: '0.2rem 0' },
  infoBox: { background: '#f0faf4', border: '1px solid #c6e8d4', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  infoText: { color: '#555', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.6 },
  payStep: { display: 'flex', gap: '1rem', alignItems: 'flex-start' },
  stepNum: { background: '#1a6b3c', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '0.9rem' },
  filterRow: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '180px', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem' },
  filterBtns: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' },
  activeFilter: { background: '#1a6b3c', color: '#fff', border: '1px solid #1a6b3c' },
  actions: { display: 'flex', gap: '0.8rem', marginTop: '0.8rem', flexWrap: 'wrap' },
  confirmBtn: { padding: '0.5rem 1.2rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  declineBtn: { padding: '0.5rem 1.2rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  editBtn: { padding: '0.4rem 1rem', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  deleteBtn: { padding: '0.4rem 1rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  addBtn: { padding: '0.7rem 1.5rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '1.5rem' },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' },
  formTitle: { color: '#1a6b3c', margin: '0 0 0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '0.9rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '1rem' },
  emptyBox: { textAlign: 'center', padding: '3rem', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
};
