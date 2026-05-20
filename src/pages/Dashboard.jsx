import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import TouristDashboard from '../components/dashboard/TouristDashboard';
import HotelOwnerDashboard from '../components/dashboard/HotelOwnerDashboard';
import GuideDashboard from '../components/dashboard/GuideDashboard';
import TransportOwnerDashboard from '../components/dashboard/TransportOwnerDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import HotelAdminDashboard from '../components/dashboard/HotelAdminDashboard';
import ImageUpload from '../components/ImageUpload';

const AMENITIES = ['WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Bar', 'Parking', 'Air Conditioning', 'Room Service', 'Lake View', 'Breakfast Included', '24hr Reception'];
const SPECIALTIES = ['Lake Tana Monasteries', 'Blue Nile Falls', 'Cultural Tours', 'Bird Watching', 'Hiking', 'Boat Tours', 'City Tours', 'Photography', 'Food Tours', 'History Tours'];
const LANGUAGES = ['English', 'Amharic', 'French', 'Italian', 'German', 'Spanish', 'Arabic'];

function PendingApprovalDashboard({ user }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hotel owner form
  const [hotelForm, setHotelForm] = useState({ name: '', description: '', address: '', pricePerNight: '', amenities: [], images: [] });
  // Guide form
  const [guideForm, setGuideForm] = useState({ bio: '', pricePerDay: '', languages: [], specialties: [], certifications: '', profileImage: '' });
  // Transport form
  const [transportForm, setTransportForm] = useState({ name: '', type: 'boat', description: '', from: '', to: '', pricePerTrip: '', capacity: '', contactPhone: '', images: [] });

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/hotels', { ...hotelForm, pricePerNight: Number(hotelForm.pricePerNight) });
      toast.success('Hotel submitted! Waiting for admin approval.');
      setSubmitted(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  const handleGuideSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/guides', { ...guideForm, pricePerDay: Number(guideForm.pricePerDay), certifications: guideForm.certifications.split(',').map(c => c.trim()).filter(Boolean) });
      toast.success('Guide profile submitted! Waiting for admin approval.');
      setSubmitted(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/transport', { ...transportForm, pricePerTrip: Number(transportForm.pricePerTrip), capacity: Number(transportForm.capacity) });
      toast.success('Transport service submitted! Waiting for admin approval.');
      setSubmitted(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div style={styles.pendingCard}>
        <div style={{ fontSize: '3rem' }}>✅</div>
        <h3 style={{ color: '#1a6b3c' }}>Information Submitted!</h3>
        <p style={{ color: '#555' }}>The admin will review your submission and approve your account within 1-2 business days.</p>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>You will be able to manage your listing once approved.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pendingBanner}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span>
        <div>
          <strong>Your account is pending admin approval</strong>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
            While you wait, please fill in your {user.role === 'hotel_owner' ? 'hotel' : user.role === 'guide' ? 'guide profile' : 'transport service'} details below. The admin will review everything together.
          </p>
        </div>
      </div>

      {user.role === 'hotel_owner' && (
        <form onSubmit={handleHotelSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>🏨 Add Your Hotel</h3>
          <label style={styles.label}>Hotel Name *</label>
          <input style={styles.input} placeholder="e.g. Lakeside Hotel Bahir Dar" value={hotelForm.name} onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })} required />
          <label style={styles.label}>Description *</label>
          <textarea style={styles.input} rows={4} placeholder="Describe your hotel, its features, and what makes it special..." value={hotelForm.description} onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })} required />
          <label style={styles.label}>Address *</label>
          <input style={styles.input} placeholder="e.g. Lake Shore Road, Bahir Dar" value={hotelForm.address} onChange={e => setHotelForm({ ...hotelForm, address: e.target.value })} required />
          <label style={styles.label}>Price Per Night (ETB) *</label>
          <input style={styles.input} type="number" placeholder="e.g. 2500" value={hotelForm.pricePerNight} onChange={e => setHotelForm({ ...hotelForm, pricePerNight: e.target.value })} required />
          <label style={styles.label}>Amenities</label>
          <div style={styles.checkGrid}>
            {AMENITIES.map(a => (
              <label key={a} style={styles.checkLabel}>
                <input type="checkbox" checked={hotelForm.amenities.includes(a)} onChange={() => setHotelForm({ ...hotelForm, amenities: hotelForm.amenities.includes(a) ? hotelForm.amenities.filter(x => x !== a) : [...hotelForm.amenities, a] })} /> {a}
              </label>
            ))}
          </div>
          <label style={styles.label}>Hotel Photos</label>
          <ImageUpload multiple onUpload={(urls) => setHotelForm({ ...hotelForm, images: urls })} />
          <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'Submitting...' : '📤 Submit Hotel for Review'}</button>
        </form>
      )}

      {user.role === 'guide' && (
        <form onSubmit={handleGuideSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>🧭 Create Your Guide Profile</h3>
          <label style={styles.label}>Profile Photo</label>
          <ImageUpload onUpload={(url) => setGuideForm({ ...guideForm, profileImage: url })} />
          {guideForm.profileImage && <img src={guideForm.profileImage} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />}
          <label style={styles.label}>Bio / About You *</label>
          <textarea style={styles.input} rows={4} placeholder="Tell tourists about your experience, background, and what makes you a great guide..." value={guideForm.bio} onChange={e => setGuideForm({ ...guideForm, bio: e.target.value })} required />
          <label style={styles.label}>Price Per Day (ETB) *</label>
          <input style={styles.input} type="number" placeholder="e.g. 1200" value={guideForm.pricePerDay} onChange={e => setGuideForm({ ...guideForm, pricePerDay: e.target.value })} required />
          <label style={styles.label}>Languages Spoken</label>
          <div style={styles.checkGrid}>
            {LANGUAGES.map(l => (
              <label key={l} style={styles.checkLabel}>
                <input type="checkbox" checked={guideForm.languages.includes(l)} onChange={() => setGuideForm({ ...guideForm, languages: guideForm.languages.includes(l) ? guideForm.languages.filter(x => x !== l) : [...guideForm.languages, l] })} /> {l}
              </label>
            ))}
          </div>
          <label style={styles.label}>Specialties</label>
          <div style={styles.checkGrid}>
            {SPECIALTIES.map(s => (
              <label key={s} style={styles.checkLabel}>
                <input type="checkbox" checked={guideForm.specialties.includes(s)} onChange={() => setGuideForm({ ...guideForm, specialties: guideForm.specialties.includes(s) ? guideForm.specialties.filter(x => x !== s) : [...guideForm.specialties, s] })} /> {s}
              </label>
            ))}
          </div>
          <label style={styles.label}>Certifications (comma separated)</label>
          <input style={styles.input} placeholder="e.g. Ethiopian Tourism Authority Certified, First Aid" value={guideForm.certifications} onChange={e => setGuideForm({ ...guideForm, certifications: e.target.value })} />
          <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'Submitting...' : '📤 Submit Profile for Review'}</button>
        </form>
      )}

      {user.role === 'transport_owner' && (
        <form onSubmit={handleTransportSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>🚤 Add Your Transport Service</h3>
          <label style={styles.label}>Service Name *</label>
          <input style={styles.input} placeholder="e.g. Lake Tana Monastery Boat Tour" value={transportForm.name} onChange={e => setTransportForm({ ...transportForm, name: e.target.value })} required />
          <label style={styles.label}>Vehicle Type *</label>
          <select style={styles.input} value={transportForm.type} onChange={e => setTransportForm({ ...transportForm, type: e.target.value })}>
            {['boat', 'taxi', 'bus', 'minibus', 'car', 'van'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <label style={styles.label}>Description *</label>
          <textarea style={styles.input} rows={3} placeholder="Describe your service..." value={transportForm.description} onChange={e => setTransportForm({ ...transportForm, description: e.target.value })} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div><label style={styles.label}>From *</label><input style={styles.input} placeholder="e.g. Bahir Dar Main Port" value={transportForm.from} onChange={e => setTransportForm({ ...transportForm, from: e.target.value })} required /></div>
            <div><label style={styles.label}>To *</label><input style={styles.input} placeholder="e.g. Lake Tana Monasteries" value={transportForm.to} onChange={e => setTransportForm({ ...transportForm, to: e.target.value })} required /></div>
            <div><label style={styles.label}>Price Per Trip (ETB) *</label><input style={styles.input} type="number" value={transportForm.pricePerTrip} onChange={e => setTransportForm({ ...transportForm, pricePerTrip: e.target.value })} required /></div>
            <div><label style={styles.label}>Capacity (persons) *</label><input style={styles.input} type="number" value={transportForm.capacity} onChange={e => setTransportForm({ ...transportForm, capacity: e.target.value })} required /></div>
          </div>
          <label style={styles.label}>Contact Phone</label>
          <input style={styles.input} placeholder="+251..." value={transportForm.contactPhone} onChange={e => setTransportForm({ ...transportForm, contactPhone: e.target.value })} />
          <label style={styles.label}>Photos</label>
          <ImageUpload multiple onUpload={(urls) => setTransportForm({ ...transportForm, images: urls })} />
          <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'Submitting...' : '📤 Submit Service for Review'}</button>
        </form>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const isPending = ['hotel_owner', 'guide', 'transport_owner'].includes(user.role) && !user.isApproved;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name} 👋</h2>
        <p className="text-gray-400 mt-1">Role: <span className="inline-block bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize ml-1">{user.role.replace(/_/g, ' ')}</span></p>
      </div>

      {isPending && <PendingApprovalDashboard user={user} />}
      {!isPending && user.role === 'tourist' && <TouristDashboard />}
      {!isPending && user.role === 'hotel_owner' && <HotelOwnerDashboard />}
      {!isPending && user.role === 'guide' && <GuideDashboard />}
      {!isPending && user.role === 'transport_owner' && <TransportOwnerDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'hotel_admin' && <HotelAdminDashboard />}
    </div>
  );
}

const styles = {
  pendingBanner: { background: '#d97706', color: '#fff', padding: '1rem 1.5rem', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pendingCard: { background: '#fff', padding: '3rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  form: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  formTitle: { color: '#1a6b3c', margin: '0 0 0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.4rem', padding: '0.3rem 0' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' },
  submitBtn: { padding: '0.9rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' },
};
