import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import ImageUpload from '../ImageUpload';

const emptySiteForm = { name: '', description: '', category: 'monastery', entranceFee: '', openingHours: '', images: '', location: { lat: '', lng: '' } };
const emptyTransportForm = { name: '', type: 'boat', description: '', from: '', to: '', pricePerTrip: '', capacity: '', contactPhone: '', images: '' };
const emptyHotelForm = { name: '', description: '', address: '', pricePerNight: '', amenities: '', images: '', location: { lat: '', lng: '' } };
const emptyGuideForm = { bio: '', languages: '', specialties: '', pricePerDay: '', certifications: '' };
const emptyUserForm = { name: '', email: '', phone: '', role: 'tourist' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [guides, setGuides] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [transports, setTransports] = useState([]);
  const [siteForm, setSiteForm] = useState(emptySiteForm);
  const [editSiteId, setEditSiteId] = useState(null);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [transportForm, setTransportForm] = useState(emptyTransportForm);
  const [editTransportId, setEditTransportId] = useState(null);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [editHotelId, setEditHotelId] = useState(null);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [guideForm, setGuideForm] = useState(emptyGuideForm);
  const [editGuideId, setEditGuideId] = useState(null);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editUserId, setEditUserId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/analytics'),
      API.get('/hotels/all'),
      API.get('/guides/all'),
      API.get('/sites'),
      API.get('/auth/users'),
      API.get('/auth/pending'),
      API.get('/transport/all'),
    ]).then(([a, h, g, s, u, p, tr]) => {
      setAnalytics(a.data);
      setHotels(h.data);
      setGuides(g.data);
      setSites(s.data);
      setUsers(u.data.users || u.data);
      setPendingUsers(p.data);
      setTransports(tr.data);
    }).catch(() => toast.error('Failed to load admin data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const approveUser = async (id) => {
    try {
      await API.put(`/auth/approve/${id}`);
      setPendingUsers(pendingUsers.filter(u => u._id !== id));
      toast.success('User approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const rejectUser = async (id) => {
    if (!window.confirm('Reject and delete this user?')) return;
    try {
      await API.delete(`/auth/reject/${id}`);
      setPendingUsers(pendingUsers.filter(u => u._id !== id));
      toast.success('User rejected');
    } catch { toast.error('Failed to reject'); }
  };

  const deleteHotel = async (id) => {
    if (!window.confirm('Permanently delete this hotel?')) return;
    try {
      await API.delete(`/hotels/${id}/admin`);
      setHotels(hotels.filter(h => h._id !== id));
      toast.success('Hotel deleted');
    } catch { toast.error('Failed to delete hotel'); }
  };

  const deleteGuide = async (id) => {
    if (!window.confirm('Permanently delete this guide?')) return;
    try {
      await API.delete(`/guides/${id}/admin`);
      setGuides(guides.filter(g => g._id !== id));
      toast.success('Guide deleted');
    } catch { toast.error('Failed to delete guide'); }
  };

  const approveHotel = async (id) => {
    try {
      await API.put(`/hotels/${id}/approve`);
      setHotels(hotels.map(h => h._id === id ? { ...h, isApproved: true } : h));
      toast.success('Hotel approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const approveGuide = async (id) => {
    try {
      await API.put(`/guides/${id}/approve`);
      setGuides(guides.map(g => g._id === id ? { ...g, isApproved: true } : g));
      toast.success('Guide approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const approveTransport = async (id) => {
    try {
      await API.put(`/transport/${id}/approve`);
      setTransports(transports.map(t => t._id === id ? { ...t, isApproved: true } : t));
      toast.success('Transport approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...siteForm,
      entranceFee: Number(siteForm.entranceFee),
      images: typeof siteForm.images === 'string' ? siteForm.images.split(',').map(i => i.trim()).filter(Boolean) : siteForm.images,
      location: { lat: Number(siteForm.location.lat), lng: Number(siteForm.location.lng) },
    };
    try {
      if (editSiteId) {
        const { data } = await API.put(`/sites/${editSiteId}`, payload);
        setSites(sites.map(s => s._id === editSiteId ? data : s));
        toast.success('Site updated!');
      } else {
        const { data } = await API.post('/sites', payload);
        setSites([...sites, data]);
        toast.success('Site added!');
      }
      setSiteForm(emptySiteForm);
      setEditSiteId(null);
      setShowSiteForm(false);
    } catch { toast.error('Failed to save site'); }
  };

  const handleEditSite = (site) => {
    setSiteForm({ name: site.name, description: site.description, category: site.category, entranceFee: site.entranceFee, openingHours: site.openingHours || '', images: site.images?.join(', ') || '', location: { lat: site.location?.lat || '', lng: site.location?.lng || '' } });
    setEditSiteId(site._id);
    setShowSiteForm(true);
  };

  const handleDeleteSite = async (id) => {
    if (!window.confirm('Delete this site?')) return;
    try {
      await API.delete(`/sites/${id}`);
      setSites(sites.filter(s => s._id !== id));
      toast.success('Site deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...transportForm,
      pricePerTrip: Number(transportForm.pricePerTrip),
      capacity: Number(transportForm.capacity),
      images: typeof transportForm.images === 'string' ? transportForm.images.split(',').map(i => i.trim()).filter(Boolean) : transportForm.images,
    };
    try {
      if (editTransportId) {
        const { data } = await API.put(`/transport/${editTransportId}`, payload);
        setTransports(transports.map(t => t._id === editTransportId ? data : t));
        toast.success('Transport updated!');
      } else {
        const { data } = await API.post('/transport', payload);
        setTransports([...transports, data]);
        toast.success('Transport added!');
      }
      setTransportForm(emptyTransportForm);
      setEditTransportId(null);
      setShowTransportForm(false);
    } catch { toast.error('Failed to save transport'); }
  };

  const handleEditTransport = (tr) => {
    setTransportForm({ name: tr.name, type: tr.type, description: tr.description, from: tr.from, to: tr.to, pricePerTrip: tr.pricePerTrip, capacity: tr.capacity, contactPhone: tr.contactPhone || '', images: tr.images?.join(', ') || '' });
    setEditTransportId(tr._id);
    setShowTransportForm(true);
  };

  const handleDeleteTransport = async (id) => {
    if (!window.confirm('Delete this transport?')) return;
    try {
      await API.delete(`/transport/${id}`);
      setTransports(transports.filter(t => t._id !== id));
      toast.success('Transport deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...hotelForm,
      pricePerNight: Number(hotelForm.pricePerNight),
      amenities: typeof hotelForm.amenities === 'string' ? hotelForm.amenities.split(',').map(a => a.trim()).filter(Boolean) : hotelForm.amenities,
      images: typeof hotelForm.images === 'string' ? hotelForm.images.split(',').map(i => i.trim()).filter(Boolean) : hotelForm.images,
      location: { lat: Number(hotelForm.location.lat), lng: Number(hotelForm.location.lng) },
    };
    try {
      if (editHotelId) {
        const { data } = await API.put(`/hotels/${editHotelId}`, payload);
        setHotels(hotels.map(h => h._id === editHotelId ? data : h));
        toast.success('Hotel updated!');
      } else {
        const { data } = await API.post('/hotels', payload);
        setHotels([...hotels, data]);
        toast.success('Hotel added!');
      }
      setHotelForm(emptyHotelForm);
      setEditHotelId(null);
      setShowHotelForm(false);
    } catch { toast.error('Failed to save hotel'); }
  };

  const handleEditHotel = (hotel) => {
    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      pricePerNight: hotel.pricePerNight,
      amenities: hotel.amenities?.join(', ') || '',
      images: hotel.images?.join(', ') || '',
      location: { lat: hotel.location?.lat || '', lng: hotel.location?.lng || '' },
    });
    setEditHotelId(hotel._id);
    setShowHotelForm(true);
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Delete this hotel?')) return;
    try {
      await API.delete(`/hotels/${id}/admin`);
      setHotels(hotels.filter(h => h._id !== id));
      toast.success('Hotel deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleGuideSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...guideForm,
      pricePerDay: Number(guideForm.pricePerDay),
      languages: typeof guideForm.languages === 'string' ? guideForm.languages.split(',').map(l => l.trim()).filter(Boolean) : guideForm.languages,
      specialties: typeof guideForm.specialties === 'string' ? guideForm.specialties.split(',').map(s => s.trim()).filter(Boolean) : guideForm.specialties,
      certifications: typeof guideForm.certifications === 'string' ? guideForm.certifications.split(',').map(c => c.trim()).filter(Boolean) : guideForm.certifications,
    };
    try {
      if (editGuideId) {
        const { data } = await API.put(`/guides/${editGuideId}`, payload);
        setGuides(guides.map(g => g._id === editGuideId ? data : g));
        toast.success('Guide updated!');
      } else {
        const { data } = await API.post('/guides', payload);
        setGuides([...guides, data]);
        toast.success('Guide added!');
      }
      setGuideForm(emptyGuideForm);
      setEditGuideId(null);
      setShowGuideForm(false);
    } catch { toast.error('Failed to save guide'); }
  };

  const handleEditGuide = (guide) => {
    setGuideForm({
      bio: guide.bio,
      languages: guide.languages?.join(', ') || '',
      specialties: guide.specialties?.join(', ') || '',
      pricePerDay: guide.pricePerDay,
      certifications: guide.certifications?.join(', ') || '',
    });
    setEditGuideId(guide._id);
    setShowGuideForm(true);
  };

  const handleDeleteGuide = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try {
      await API.delete(`/guides/${id}/admin`);
      setGuides(guides.filter(g => g._id !== id));
      toast.success('Guide deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUserId) {
        const { data } = await API.put(`/auth/users/${editUserId}`, userForm);
        setUsers(users.map(u => u._id === editUserId ? data : u));
        toast.success('User updated!');
      } else {
        const { data } = await API.post('/auth/register', userForm);
        setUsers([...users, data]);
        toast.success('User added!');
      }
      setUserForm(emptyUserForm);
      setEditUserId(null);
      setShowUserForm(false);
    } catch { toast.error('Failed to save user'); }
  };

  const handleEditUser = (user) => {
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
    setEditUserId(user._id);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleChangeHotelStatus = async (hotelId, newStatus) => {
    const reason = window.prompt(`Enter reason for ${newStatus}:`);
    if (reason === null) return;
    try {
      const { data } = await API.put(`/hotels/${hotelId}/status/change`, { status: newStatus, reason });
      setHotels(hotels.map(h => h._id === hotelId ? data.hotel : h));
      toast.success(`Hotel ${newStatus}`);
    } catch { toast.error('Failed to change hotel status'); }
  };

  const handleChangeGuideStatus = async (guideId, newStatus) => {
    const reason = window.prompt(`Enter reason for ${newStatus}:`);
    if (reason === null) return;
    try {
      const { data } = await API.put(`/guides/${guideId}/status/change`, { status: newStatus, reason });
      setGuides(guides.map(g => g._id === guideId ? data.guide : g));
      toast.success(`Guide ${newStatus}`);
    } catch { toast.error('Failed to change guide status'); }
  };

  const tabs = ['analytics', 'hotels', 'guides', 'sites', 'transport', 'users'];
  const tabLabels = { analytics: '📊 Analytics', hotels: '🏨 Hotels', guides: '🧭 Guides', sites: '⛪ Sites', transport: '🚤 Transport', users: '👥 Users' };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>⏳ Loading admin data...</div>;

  return (
    <div>
      <div style={styles.tabs}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {tab === 'analytics' && analytics && (
        <div>
          <h3 style={styles.sectionTitle}>Platform Overview</h3>
          <div style={styles.statsGrid}>
            {[
              { label: 'Total Users', value: analytics.totalUsers, icon: '👥', color: '#2b6cb0' },
              { label: 'Total Hotels', value: analytics.totalHotels, icon: '🏨', color: '#1a6b3c' },
              { label: 'Total Guides', value: analytics.totalGuides, icon: '🧭', color: '#d97706' },
              { label: 'Tourist Sites', value: analytics.totalSites, icon: '⛪', color: '#7c3aed' },
              { label: 'Total Bookings', value: analytics.totalBookings, icon: '📋', color: '#db2777' },
              { label: 'Total Revenue', value: `ETB ${analytics.revenue.toLocaleString()}`, icon: '💰', color: '#059669' },
            ].map(stat => (
              <div key={stat.label} style={{ ...styles.statCard, borderTop: `4px solid ${stat.color}` }}>
                <span style={styles.statIcon}>{stat.icon}</span>
                <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          <h3 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>Booking Status</h3>
          <div style={styles.bookingStats}>
            {[
              { label: 'Confirmed', value: analytics.confirmedBookings, color: '#1a6b3c', bg: '#e6f4ed' },
              { label: 'Pending', value: analytics.pendingBookings, color: '#d97706', bg: '#fef3c7' },
              { label: 'Cancelled', value: analytics.cancelledBookings, color: '#e53e3e', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ ...styles.bookingStatCard, background: s.bg }}>
                <span style={{ ...styles.bookingStatValue, color: s.color }}>{s.value}</span>
                <span style={{ color: s.color }}>{s.label}</span>
              </div>
            ))}
          </div>

          <h3 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>Pending Approvals</h3>
          <div style={styles.pendingRow}>
            <div style={styles.pendingCard}>
              <span style={styles.pendingNum}>{analytics.pendingHotels}</span>
              <span>Hotels awaiting approval</span>
              <button onClick={() => setTab('hotels')} style={styles.goBtn}>Review →</button>
            </div>
            <div style={styles.pendingCard}>
              <span style={styles.pendingNum}>{analytics.pendingGuides}</span>
              <span>Guides awaiting approval</span>
              <button onClick={() => setTab('guides')} style={styles.goBtn}>Review →</button>
            </div>
            <div style={styles.pendingCard}>
              <span style={styles.pendingNum}>{transports.filter(t => !t.isApproved).length}</span>
              <span>Transport awaiting approval</span>
              <button onClick={() => setTab('transport')} style={styles.goBtn}>Review →</button>
            </div>
            <div style={styles.pendingCard}>
              <span style={styles.pendingNum}>{pendingUsers.length}</span>
              <span>Users awaiting approval</span>
              <button onClick={() => setTab('users')} style={styles.goBtn}>Review →</button>
            </div>
          </div>
        </div>
      )}

      {/* Hotels Tab */}
      {tab === 'hotels' && (
        <div>
          <div style={styles.cardRow}>
            <h3 style={styles.sectionTitle}>All Hotels ({hotels.length})</h3>
            <button onClick={() => { setShowHotelForm(!showHotelForm); setHotelForm(emptyHotelForm); setEditHotelId(null); }} style={styles.addBtn}>
              {showHotelForm ? 'Cancel' : '+ Add Hotel'}
            </button>
          </div>
          {showHotelForm && (
            <form onSubmit={handleHotelSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editHotelId ? 'Edit Hotel' : 'Add Hotel'}</h3>
              <input style={styles.input} placeholder="Hotel Name" value={hotelForm.name} onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })} required />
              <textarea style={styles.input} placeholder="Description" rows={3} value={hotelForm.description} onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })} required />
              <input style={styles.input} placeholder="Address" value={hotelForm.address} onChange={e => setHotelForm({ ...hotelForm, address: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Price Per Night (ETB)" value={hotelForm.pricePerNight} onChange={e => setHotelForm({ ...hotelForm, pricePerNight: e.target.value })} required />
              <input style={styles.input} placeholder="Amenities (comma-separated, e.g. WiFi, Pool, Restaurant)" value={hotelForm.amenities} onChange={e => setHotelForm({ ...hotelForm, amenities: e.target.value })} />
              <div style={styles.row}>
                <input style={styles.input} placeholder="Latitude" value={hotelForm.location.lat} onChange={e => setHotelForm({ ...hotelForm, location: { ...hotelForm.location, lat: e.target.value } })} />
                <input style={styles.input} placeholder="Longitude" value={hotelForm.location.lng} onChange={e => setHotelForm({ ...hotelForm, location: { ...hotelForm.location, lng: e.target.value } })} />
              </div>
              <ImageUpload multiple onUpload={(urls) => setHotelForm({ ...hotelForm, images: urls })} />
              <button type="submit" style={styles.submitBtn}>{editHotelId ? 'Update Hotel' : 'Add Hotel'}</button>
            </form>
          )}
          {hotels.map(hotel => (
            <div key={hotel._id} style={styles.card}>
              <div style={styles.cardRow}>
                <h4 style={styles.cardTitle}>{hotel.name}</h4>
                <span style={{ ...styles.badge, background: hotel.isApproved ? '#1a6b3c' : '#d97706' }}>
                  {hotel.isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
              </div>
              <p style={styles.info}>📍 {hotel.address} | 💰 ETB {hotel.pricePerNight}/night</p>
              <p style={styles.info}>👤 Owner: {hotel.owner?.name} ({hotel.owner?.email})</p>
              <p style={styles.info}>🏷️ {hotel.amenities?.join(', ')}</p>
              <p style={{ ...styles.info, fontWeight: 600, color: hotel.status === 'active' ? '#1a6b3c' : hotel.status === 'banned' ? '#e53e3e' : '#d97706' }}>
                Status: {hotel.status === 'active' ? '🟢' : hotel.status === 'inactive' ? '⚪' : hotel.status === 'suspended' ? '🟡' : '🔴'} {hotel.status}
                {hotel.statusReason && ` - ${hotel.statusReason}`}
              </p>
              <div style={styles.actions}>
                {!hotel.isApproved && <button onClick={() => approveHotel(hotel._id)} style={styles.approveBtn}>✅ Approve Hotel</button>}
                <button onClick={() => handleEditHotel(hotel)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDeleteHotel(hotel._id)} style={styles.deleteBtn}>🗑 Delete</button>
              </div>
              <div style={{ ...styles.actions, marginTop: '0.8rem', borderTop: '1px solid #eee', paddingTop: '0.8rem' }}>
                <select style={{ ...styles.input, flex: 1, marginRight: '0.5rem', padding: '0.4rem' }} value={hotel.status || 'active'} onChange={e => handleChangeHotelStatus(hotel._id, e.target.value)}>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                  <option value="suspended">🟡 Suspended</option>
                  <option value="banned">🔴 Banned</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guides Tab */}
      {tab === 'guides' && (
        <div>
          <div style={styles.cardRow}>
            <h3 style={styles.sectionTitle}>All Tour Guides ({guides.length})</h3>
            <button onClick={() => { setShowGuideForm(!showGuideForm); setGuideForm(emptyGuideForm); setEditGuideId(null); }} style={styles.addBtn}>
              {showGuideForm ? 'Cancel' : '+ Add Guide'}
            </button>
          </div>
          {showGuideForm && (
            <form onSubmit={handleGuideSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editGuideId ? 'Edit Guide' : 'Add Guide'}</h3>
              <textarea style={styles.input} placeholder="Bio" rows={3} value={guideForm.bio} onChange={e => setGuideForm({ ...guideForm, bio: e.target.value })} required />
              <input style={styles.input} placeholder="Languages (comma-separated, e.g. English, Amharic, Arabic)" value={guideForm.languages} onChange={e => setGuideForm({ ...guideForm, languages: e.target.value })} required />
              <input style={styles.input} placeholder="Specialties (comma-separated, e.g. History, Nature, Culture)" value={guideForm.specialties} onChange={e => setGuideForm({ ...guideForm, specialties: e.target.value })} />
              <input style={styles.input} type="number" placeholder="Price Per Day (ETB)" value={guideForm.pricePerDay} onChange={e => setGuideForm({ ...guideForm, pricePerDay: e.target.value })} required />
              <input style={styles.input} placeholder="Certifications (comma-separated)" value={guideForm.certifications} onChange={e => setGuideForm({ ...guideForm, certifications: e.target.value })} />
              <button type="submit" style={styles.submitBtn}>{editGuideId ? 'Update Guide' : 'Add Guide'}</button>
            </form>
          )}
          {guides.map(guide => (
            <div key={guide._id} style={styles.card}>
              <div style={styles.cardRow}>
                <h4 style={styles.cardTitle}>{guide.user?.name}</h4>
                <span style={{ ...styles.badge, background: guide.isApproved ? '#1a6b3c' : '#d97706' }}>
                  {guide.isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
              </div>
              <p style={styles.info}>🗣 {guide.languages?.join(', ')} | 💰 ETB {guide.pricePerDay}/day</p>
              <p style={styles.info}>🎯 {guide.specialties?.join(', ')}</p>
              <p style={styles.info}>📧 {guide.user?.email}</p>
              <p style={{ ...styles.info, fontWeight: 600, color: guide.status === 'active' ? '#1a6b3c' : guide.status === 'banned' ? '#e53e3e' : '#d97706' }}>
                Status: {guide.status === 'active' ? '🟢' : guide.status === 'inactive' ? '⚪' : guide.status === 'suspended' ? '🟡' : '🔴'} {guide.status}
                {guide.statusReason && ` - ${guide.statusReason}`}
              </p>
              <div style={styles.actions}>
                {!guide.isApproved && <button onClick={() => approveGuide(guide._id)} style={styles.approveBtn}>✅ Approve Guide</button>}
                <button onClick={() => handleEditGuide(guide)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDeleteGuide(guide._id)} style={styles.deleteBtn}>🗑 Delete</button>
              </div>
              <div style={{ ...styles.actions, marginTop: '0.8rem', borderTop: '1px solid #eee', paddingTop: '0.8rem' }}>
                <select style={{ ...styles.input, flex: 1, marginRight: '0.5rem', padding: '0.4rem' }} value={guide.status || 'active'} onChange={e => handleChangeGuideStatus(guide._id, e.target.value)}>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                  <option value="suspended">🟡 Suspended</option>
                  <option value="banned">🔴 Banned</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sites Tab */}
      {tab === 'sites' && (
        <div>
          <div style={styles.cardRow}>
            <h3 style={styles.sectionTitle}>Tourist Sites ({sites.length})</h3>
            <button onClick={() => { setShowSiteForm(!showSiteForm); setSiteForm(emptySiteForm); setEditSiteId(null); }} style={styles.addBtn}>
              {showSiteForm ? 'Cancel' : '+ Add Site'}
            </button>
          </div>
          {showSiteForm && (
            <form onSubmit={handleSiteSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editSiteId ? 'Edit Site' : 'Add Tourist Site'}</h3>
              <input style={styles.input} placeholder="Site Name" value={siteForm.name} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} required />
              <textarea style={styles.input} placeholder="Description" rows={3} value={siteForm.description} onChange={e => setSiteForm({ ...siteForm, description: e.target.value })} required />
              <select style={styles.input} value={siteForm.category} onChange={e => setSiteForm({ ...siteForm, category: e.target.value })}>
                {['monastery', 'lake', 'museum', 'park', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={styles.input} type="number" placeholder="Entrance Fee (0 for free)" value={siteForm.entranceFee} onChange={e => setSiteForm({ ...siteForm, entranceFee: e.target.value })} />
              <input style={styles.input} placeholder="Opening Hours (e.g. 8AM - 6PM)" value={siteForm.openingHours} onChange={e => setSiteForm({ ...siteForm, openingHours: e.target.value })} />
              <div style={styles.row}>
                <input style={styles.input} placeholder="Latitude (e.g. 11.5936)" value={siteForm.location.lat} onChange={e => setSiteForm({ ...siteForm, location: { ...siteForm.location, lat: e.target.value } })} />
                <input style={styles.input} placeholder="Longitude (e.g. 37.3906)" value={siteForm.location.lng} onChange={e => setSiteForm({ ...siteForm, location: { ...siteForm.location, lng: e.target.value } })} />
              </div>
              <ImageUpload multiple onUpload={(urls) => setSiteForm({ ...siteForm, images: urls })} />
              <button type="submit" style={styles.submitBtn}>{editSiteId ? 'Update Site' : 'Add Site'}</button>
            </form>
          )}
          {sites.map(site => (
            <div key={site._id} style={styles.card}>
              <div style={styles.cardRow}>
                <h4 style={styles.cardTitle}>{site.name}</h4>
                <span style={styles.categoryBadge}>{site.category}</span>
              </div>
              <p style={styles.info}>🎟 ETB {site.entranceFee || 'Free'} | 🕐 {site.openingHours}</p>
              <div style={styles.actions}>
                <button onClick={() => handleEditSite(site)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDeleteSite(site._id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transport Tab */}
      {tab === 'transport' && (
        <div>
          <div style={styles.cardRow}>
            <h3 style={styles.sectionTitle}>Transport Services ({transports.length})</h3>
            <button onClick={() => { setShowTransportForm(!showTransportForm); setTransportForm(emptyTransportForm); setEditTransportId(null); }} style={styles.addBtn}>
              {showTransportForm ? 'Cancel' : '+ Add Transport'}
            </button>
          </div>
          {showTransportForm && (
            <form onSubmit={handleTransportSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editTransportId ? 'Edit Transport' : 'Add Transport Service'}</h3>
              <input style={styles.input} placeholder="Service Name (e.g. Lake Tana Boat Tour)" value={transportForm.name} onChange={e => setTransportForm({ ...transportForm, name: e.target.value })} required />
              <select style={styles.input} value={transportForm.type} onChange={e => setTransportForm({ ...transportForm, type: e.target.value })}>
                {['boat', 'taxi', 'bus', 'minibus'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea style={styles.input} placeholder="Description" rows={2} value={transportForm.description} onChange={e => setTransportForm({ ...transportForm, description: e.target.value })} required />
              <div style={styles.row}>
                <input style={styles.input} placeholder="From (e.g. Bahir Dar Port)" value={transportForm.from} onChange={e => setTransportForm({ ...transportForm, from: e.target.value })} required />
                <input style={styles.input} placeholder="To (e.g. Tana Monasteries)" value={transportForm.to} onChange={e => setTransportForm({ ...transportForm, to: e.target.value })} required />
              </div>
              <div style={styles.row}>
                <input style={styles.input} type="number" placeholder="Price Per Trip (ETB)" value={transportForm.pricePerTrip} onChange={e => setTransportForm({ ...transportForm, pricePerTrip: e.target.value })} required />
                <input style={styles.input} type="number" placeholder="Capacity (people)" value={transportForm.capacity} onChange={e => setTransportForm({ ...transportForm, capacity: e.target.value })} required />
              </div>
              <input style={styles.input} placeholder="Contact Phone" value={transportForm.contactPhone} onChange={e => setTransportForm({ ...transportForm, contactPhone: e.target.value })} />
              <ImageUpload multiple onUpload={(urls) => setTransportForm({ ...transportForm, images: urls })} />
              <button type="submit" style={styles.submitBtn}>{editTransportId ? 'Update Transport' : 'Add Transport'}</button>
            </form>
          )}
          {transports.map(tr => (
            <div key={tr._id} style={styles.card}>
              <div style={styles.cardRow}>
                <h4 style={styles.cardTitle}>{tr.name}</h4>
                <span style={styles.categoryBadge}>{tr.type}</span>
              </div>
              <p style={styles.info}>📍 {tr.from} → {tr.to}</p>
              <p style={styles.info}>💰 ETB {tr.pricePerTrip}/trip | 👥 {tr.capacity} people</p>
              <p style={styles.info}>👤 Owner: {tr.owner?.name || 'Admin'} {tr.owner?.email ? `(${tr.owner.email})` : ''}</p>
              <p style={styles.info}>Status: <span style={{ color: tr.isApproved ? '#1a6b3c' : '#d97706', fontWeight: 600 }}>{tr.isApproved ? '✅ Approved' : '⏳ Pending'}</span></p>
              <div style={styles.actions}>
                {!tr.isApproved && <button onClick={() => approveTransport(tr._id)} style={styles.approveBtn}>✅ Approve</button>}
                <button onClick={() => handleEditTransport(tr)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDeleteTransport(tr._id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div style={styles.cardRow}>
            <h3 style={{ ...styles.sectionTitle, color: '#d97706' }}>👥 User Management</h3>
            <button onClick={() => { setShowUserForm(!showUserForm); setUserForm(emptyUserForm); setEditUserId(null); }} style={styles.addBtn}>
              {showUserForm ? 'Cancel' : '+ Add User'}
            </button>
          </div>
          {showUserForm && (
            <form onSubmit={handleUserSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editUserId ? 'Edit User' : 'Add User'}</h3>
              <input style={styles.input} placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
              <input style={styles.input} type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
              <input style={styles.input} placeholder="Phone" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
              <select style={styles.input} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                {['tourist', 'hotel_owner', 'guide', 'transport_owner', 'admin'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <button type="submit" style={styles.submitBtn}>{editUserId ? 'Update User' : 'Add User'}</button>
            </form>
          )}
          {pendingUsers.length > 0 && (
            <div style={styles.pendingSection}>
              <h3 style={{ ...styles.sectionTitle, color: '#d97706' }}>⏳ Pending Approval Requests ({pendingUsers.length})</h3>
              {pendingUsers.map(u => (
                <div key={u._id} style={{ ...styles.card, borderLeft: '4px solid #d97706' }}>
                  <div style={styles.cardRow}>
                    <h4 style={styles.cardTitle}>{u.name}</h4>
                    <span style={{ ...styles.badge, background: '#d97706' }}>{u.role.replace('_', ' ')}</span>
                  </div>
                  <p style={styles.info}>📧 {u.email} | 📞 {u.phone || 'N/A'}</p>
                  {u.requestMessage && <p style={styles.requestMsg}>📝 "{u.requestMessage}"</p>}
                  <p style={styles.info}>🕐 Registered: {new Date(u.createdAt).toLocaleDateString()}</p>
                  <div style={styles.actions}>
                    <button onClick={() => approveUser(u._id)} style={styles.approveBtn}>✅ Approve</button>
                    <button onClick={() => rejectUser(u._id)} style={styles.deleteBtn}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <h3 style={styles.sectionTitle}>All Users ({users.length})</h3>
          {users.length === 0 && <p style={styles.empty}>No users data available.</p>}
          {users.map(u => (
            <div key={u._id} style={styles.card}>
              <div style={styles.cardRow}>
                <h4 style={styles.cardTitle}>{u.name}</h4>
                <span style={{ ...styles.badge, background: '#2b6cb0' }}>{u.role?.replace('_', ' ')}</span>
              </div>
              <p style={styles.info}>📧 {u.email} | 📞 {u.phone || 'N/A'}</p>
              <div style={styles.actions}>
                <button onClick={() => handleEditUser(u)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDeleteUser(u._id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { padding: '0.6rem 1rem', border: '1px solid #1a6b3c', borderRadius: '6px', cursor: 'pointer', background: '#fff', color: '#1a6b3c', fontSize: '0.9rem' },
  activeTab: { background: '#1a6b3c', color: '#fff' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' },
  statCard: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
  statIcon: { fontSize: '2rem' },
  statValue: { fontSize: '1.8rem', fontWeight: 'bold' },
  statLabel: { fontSize: '0.85rem', color: '#666', textAlign: 'center' },
  bookingStats: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  bookingStatCard: { flex: 1, minWidth: '120px', padding: '1.2rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
  bookingStatValue: { fontSize: '2rem', fontWeight: 'bold' },
  pendingRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  pendingCard: { flex: 1, minWidth: '200px', background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  pendingNum: { fontSize: '2.5rem', fontWeight: 'bold', color: '#d97706' },
  goBtn: { padding: '0.4rem 1rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  card: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  cardTitle: { margin: 0, color: '#1a6b3c' },
  badge: { color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize' },
  categoryBadge: { background: '#2b6cb0', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize' },
  info: { color: '#666', fontSize: '0.9rem', margin: '0.2rem 0' },
  approveBtn: { marginTop: '0.8rem', padding: '0.5rem 1.2rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  addBtn: { padding: '0.6rem 1.2rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  formTitle: { color: '#1a6b3c', margin: '0 0 0.5rem' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '1rem' },
  submitBtn: { padding: '0.8rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  actions: { display: 'flex', gap: '0.8rem', marginTop: '0.8rem' },
  editBtn: { padding: '0.4rem 1rem', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 1rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  empty: { color: '#888', fontStyle: 'italic' },
  pendingSection: { marginBottom: '2rem' },
  requestMsg: { color: '#555', fontStyle: 'italic', fontSize: '0.9rem', margin: '0.5rem 0', padding: '0.5rem', background: '#fef3c7', borderRadius: '4px' },
};
