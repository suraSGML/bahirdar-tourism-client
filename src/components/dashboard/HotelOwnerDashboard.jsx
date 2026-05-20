import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import ImageUpload from '../ImageUpload';

const emptyForm = { name: '', description: '', address: '', pricePerNight: '', amenities: '', images: '' };

export default function HotelOwnerDashboard() {
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('hotels');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    API.get('/hotels/my').then(({ data }) => setHotels(data));
    API.get('/bookings/received').then(({ data }) => setBookings(data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      pricePerNight: Number(form.pricePerNight),
      amenities: typeof form.amenities === 'string'
        ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : form.amenities,
      images: Array.isArray(form.images) ? form.images
        : form.images.split(',').map(i => i.trim()).filter(Boolean),
    };
    try {
      if (editId) {
        const { data } = await API.put(`/hotels/${editId}`, payload);
        setHotels(hotels.map(h => h._id === editId ? data : h));
        toast.success('Hotel updated!');
      } else {
        const { data } = await API.post('/hotels', payload);
        setHotels([...hotels, data]);
        toast.success('Hotel added! Waiting for admin approval.');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel');
    }
  };

  const handleEdit = (hotel) => {
    setForm({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      pricePerNight: hotel.pricePerNight,
      amenities: hotel.amenities?.join(', ') || '',
      images: hotel.images?.join(', ') || '',
    });
    setEditId(hotel._id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hotel?')) return;
    try {
      await API.delete(`/hotels/${id}`);
      setHotels(hotels.filter(h => h._id !== id));
      toast.success('Hotel deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch { toast.error('Failed to update booking'); }
  };

  return (
    <div>
      <div style={styles.tabs}>
        {['hotels', 'bookings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}>
            {t === 'hotels' ? '🏨 My Hotels' : '📋 Bookings'}
          </button>
        ))}
      </div>

      {tab === 'hotels' && (
        <div>
          <button onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditId(null); }} style={styles.addBtn}>
            {showForm ? 'Cancel' : '+ Add New Hotel'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>{editId ? 'Edit Hotel' : 'Add New Hotel'}</h3>
              <input style={styles.input} placeholder="Hotel Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <textarea style={styles.input} placeholder="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              <input style={styles.input} placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Price Per Night (ETB)" value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: e.target.value })} required />
              <input style={styles.input} placeholder="Amenities (comma separated: WiFi, Pool, Parking)" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
              <ImageUpload multiple onUpload={(urls) => setForm({ ...form, images: urls.join(', ') })} />
              <button type="submit" style={styles.submitBtn}>{editId ? 'Update Hotel' : 'Add Hotel'}</button>
            </form>
          )}

          <div style={styles.list}>
            {hotels.length === 0 && <p style={styles.empty}>No hotels added yet.</p>}
            {hotels.map(hotel => (
              <div key={hotel._id} style={styles.card}>
                <div style={styles.cardRow}>
                  <h4 style={styles.cardTitle}>{hotel.name}</h4>
                  <span style={{ ...styles.badge, background: hotel.isApproved ? '#1a6b3c' : '#d97706' }}>
                    {hotel.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <p style={styles.info}>📍 {hotel.address}</p>
                <p style={styles.info}>💰 ETB {hotel.pricePerNight} / night</p>
                <p style={styles.info}>🛎 {hotel.amenities?.join(', ')}</p>
                <div style={styles.actions}>
                  <button onClick={() => handleEdit(hotel)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(hotel._id)} style={styles.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          <h3 style={styles.sectionTitle}>Incoming Bookings</h3>
          {bookings.length === 0 && <p style={styles.empty}>No bookings yet.</p>}
          {bookings.map(b => (
            <div key={b._id} style={styles.card}>
              <p><strong>Guest:</strong> {b.user?.name}</p>
              <p style={styles.info}>📅 {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
              <p style={styles.info}>💰 ETB {b.totalPrice}</p>
              <p style={styles.info}>📝 {b.message}</p>
              <p><strong>Status:</strong> <span style={{ color: b.status === 'confirmed' ? '#1a6b3c' : b.status === 'cancelled' ? '#e53e3e' : '#d97706', textTransform: 'capitalize' }}>{b.status}</span></p>
              {b.status === 'pending' && (
                <div style={styles.actions}>
                  <button onClick={() => updateBookingStatus(b._id, 'confirmed')} style={styles.editBtn}>Confirm</button>
                  <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={styles.deleteBtn}>Decline</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  tabs: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  tab: { padding: '0.6rem 1.5rem', border: '1px solid #1a6b3c', borderRadius: '6px', cursor: 'pointer', background: '#fff', color: '#1a6b3c' },
  activeTab: { background: '#1a6b3c', color: '#fff' },
  addBtn: { padding: '0.7rem 1.5rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '1.5rem' },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  formTitle: { color: '#1a6b3c', margin: '0 0 0.5rem' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '0.8rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  cardTitle: { margin: 0, color: '#1a6b3c' },
  badge: { color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem' },
  info: { color: '#666', fontSize: '0.9rem', margin: '0.2rem 0' },
  actions: { display: 'flex', gap: '0.8rem', marginTop: '0.8rem' },
  editBtn: { padding: '0.4rem 1rem', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 1rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem' },
  empty: { color: '#888', fontStyle: 'italic' },
};
