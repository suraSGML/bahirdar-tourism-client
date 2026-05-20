import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import GoogleDirectionsMap from '../components/GoogleDirectionsMap';

export default function SiteDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    Promise.all([
      API.get(`/sites/${id}`),
      API.get(`/reviews/item/site/${id}`),
    ]).then(([s, r]) => {
      setSite(s.data);
      setReviews(Array.isArray(r.data) ? r.data : []);
      document.title = `${s.data.name} – Visit Bahir Dar`;
    }).catch(() => setError('Failed to load site details. Please refresh.'));
    if (user) {
      API.get('/auth/favorites').then(({ data }) => {
        setIsFavorite(data.sites?.some(f => f._id === id || f === id));
      }).catch(() => {});
    }
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return toast.error('Please login to save favorites');
    try {
      const { data } = await API.put('/auth/favorites', { type: 'sites', id });
      setIsFavorite(data.added);
      toast.success(data.added ? 'Added to favorites!' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorites'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    try {
      const { data } = await API.post('/reviews', { reviewType: 'site', site: id, ...review });
      setReviews([data, ...reviews]);
      toast.success('Review submitted!');
      setReview({ rating: 5, comment: '' });
    } catch { toast.error('Review failed'); }
  };

  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: '#e53e3e' }}>{error}</div>;
  if (!site) return <div style={styles.loading}>{t.common.loading}</div>;

  const categoryInfo = {
    monastery: { icon: '⛪', label: 'Monastery', color: '#8b5cf6' },
    lake: { icon: '🌊', label: 'Lake', color: '#3b82f6' },
    museum: { icon: '🏛', label: 'Museum', color: '#f59e0b' },
    park: { icon: '🌳', label: 'Park', color: '#10b981' },
    other: { icon: '📍', label: 'Attraction', color: '#6b7280' },
  };

  const cat = categoryInfo[site.category] || categoryInfo.other;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div style={styles.page}>
      {/* Hero Gallery */}
      <div style={styles.gallery}>
        <img src={site.images?.[activeImg] || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200'} alt={site.name} style={styles.mainImg} />
        {site.images?.length > 1 && (
          <div style={styles.thumbs}>
            {site.images.map((img, i) => (
              <img key={i} src={img} alt="" style={{ ...styles.thumb, outline: i === activeImg ? '3px solid #1a6b3c' : 'none' }} onClick={() => setActiveImg(i)} />
            ))}
          </div>
        )}
      </div>

      <div style={styles.body}>
        {/* Left Column */}
        <div style={styles.main}>
          {/* Title & Category */}
          <div style={styles.titleRow}>
            <div>
              <div style={{ ...styles.categoryBadge, background: cat.color }}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </div>
              <h1 style={styles.title}>{site.name}</h1>
            </div>
            <div style={styles.ratingBadge}>
              <span style={styles.ratingNum}>{site.rating?.toFixed(1)}</span>
              <span style={styles.ratingLabel}>⭐ {reviews.length} reviews</span>
            </div>
            <button onClick={toggleFavorite} style={{ padding: '0.6rem 1.2rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: isFavorite ? '#fee2e2' : '#f9f9f9', color: isFavorite ? '#e53e3e' : '#888', fontWeight: 600 }}>
              {isFavorite ? '❤️ Saved' : '🤍 Save'}
            </button>
          </div>

          {/* Quick Info Cards */}
          <div style={styles.infoCards}>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🎟</span>
              <span style={styles.infoVal}>{site.entranceFee ? `ETB ${site.entranceFee}` : t.common.free.toUpperCase()}</span>
              <span style={styles.infoLbl}>{t.sites.entranceFee}</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🕐</span>
              <span style={styles.infoVal}>{site.openingHours?.split(' ')[0] || t.common.free}</span>
              <span style={styles.infoLbl}>{t.sites.openingHours}</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>⭐</span>
              <span style={styles.infoVal}>{site.rating?.toFixed(1)}/5</span>
              <span style={styles.infoLbl}>{t.sites.rating}</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>💬</span>
              <span style={styles.infoVal}>{site.numReviews}</span>
              <span style={styles.infoLbl}>{t.common.reviews}</span>
            </div>
          </div>

          {/* Description */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.sites.aboutSite}</h2>
            <p style={styles.desc}>{site.description}</p>
          </div>

          {/* Visitor Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.sites.visitorInfo}</h2>
            <div style={styles.visitorInfo}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Managed By</span>
                <span style={styles.infoValue}>{site.managedBy || 'Bahir Dar City Administration'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Payment</span>
                <span style={{ ...styles.infoValue, color: site.paymentMethod === 'free' ? '#1a6b3c' : '#d97706', fontWeight: 600 }}>
                  {site.paymentMethod === 'free' ? '✅ Free Entry' : site.paymentMethod === 'pay_at_gate' ? '🎟 Pay at the Gate (Cash)' : '💳 Online Booking'}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>{t.sites.entranceFee}</span>
                <span style={styles.infoValue}>{site.entranceFee ? `ETB ${site.entranceFee}` : t.sites.freeEntry}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>{t.sites.openingHours}</span>
                <span style={styles.infoValue}>{site.openingHours || t.sites.open24}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>{t.sites.category}</span>
                <span style={styles.infoValue}>{cat.label}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>{t.sites.rating}</span>
                <span style={styles.infoValue}>{site.rating?.toFixed(1)} / 5.0 ({site.numReviews} {t.common.reviews})</span>
              </div>
            </div>
          </div>

          {/* Getting Here */}
          {site.travelTime && (site.travelTime.fromAirport?.taxi || site.travelTime.fromBusStation?.taxi) && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🚗 Getting Here</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                  <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>✈️ From Airport</h4>
                  <p style={styles.info}>🚕 Taxi: <strong>{site.travelTime.fromAirport?.taxi || 'N/A'}</strong></p>
                  <p style={styles.info}>🚌 Bus: <strong>{site.travelTime.fromAirport?.bus || 'N/A'}</strong></p>
                  <p style={styles.info}>🚶 Walk: <strong>{site.travelTime.fromAirport?.walk || 'N/A'}</strong></p>
                </div>
                <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                  <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>🚌 From Bus Station</h4>
                  <p style={styles.info}>🚕 Taxi: <strong>{site.travelTime.fromBusStation?.taxi || 'N/A'}</strong></p>
                  <p style={styles.info}>🚌 Bus: <strong>{site.travelTime.fromBusStation?.bus || 'N/A'}</strong></p>
                  <p style={styles.info}>🚶 Walk: <strong>{site.travelTime.fromBusStation?.walk || 'N/A'}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Tips & Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.sites.tipsTitle}</h2>
            <div style={styles.tips}>
              {site.category === 'monastery' && (
                <>
                  <div style={styles.tip}>✅ Dress modestly - shoulders and knees should be covered</div>
                  <div style={styles.tip}>✅ Remove shoes before entering the monastery</div>
                  <div style={styles.tip}>✅ Photography may be restricted inside - ask permission first</div>
                  <div style={styles.tip}>✅ Hire a local guide to learn about the history and religious art</div>
                </>
              )}
              {site.category === 'lake' && (
                <>
                  <div style={styles.tip}>✅ Best visited early morning or late afternoon for stunning views</div>
                  <div style={styles.tip}>✅ Boat tours available to explore the islands</div>
                  <div style={styles.tip}>✅ Bring sunscreen and a hat - it can get very sunny</div>
                  <div style={styles.tip}>✅ Watch for hippos and diverse bird species</div>
                </>
              )}
              {site.category === 'museum' && (
                <>
                  <div style={styles.tip}>✅ Allow 1-2 hours for a complete visit</div>
                  <div style={styles.tip}>✅ Guided tours available in multiple languages</div>
                  <div style={styles.tip}>✅ Photography may require an additional fee</div>
                  <div style={styles.tip}>✅ Visit on weekdays to avoid crowds</div>
                </>
              )}
              {site.category === 'park' && (
                <>
                  <div style={styles.tip}>✅ Perfect for morning walks and picnics</div>
                  <div style={styles.tip}>✅ Bring water and comfortable walking shoes</div>
                  <div style={styles.tip}>✅ Great spot for photography and bird watching</div>
                  <div style={styles.tip}>✅ Family-friendly with plenty of shade</div>
                </>
              )}
              {site.category === 'other' && (
                <>
                  <div style={styles.tip}>✅ Check opening hours before visiting</div>
                  <div style={styles.tip}>✅ Bring local currency for entrance fees and purchases</div>
                  <div style={styles.tip}>✅ Hire a local guide for the best experience</div>
                  <div style={styles.tip}>✅ Respect local customs and traditions</div>
                </>
              )}
            </div>
          </div>

          {/* Google Directions Map */}
          {site.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🗺️ {t.sites.locationMap} & Directions</h2>
              <GoogleDirectionsMap 
                destination={{ lat: site.location.lat, lng: site.location.lng }}
                destinationName={site.name}
                height="500px"
                showDirections={true}
              />
            </div>
          )}

          {/* Leaflet Map (Backup) */}
          {site.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📍 Map View</h2>
              <p style={styles.mapDesc}>Located at coordinates: {site.location.lat.toFixed(4)}, {site.location.lng.toFixed(4)}</p>
              <MapContainer center={[site.location.lat, site.location.lng]} zoom={14} style={styles.map}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[site.location.lat, site.location.lng]}>
                  <Popup>{site.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {/* Reviews */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.sites.visitorReviews} ({reviews.length})</h2>
            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>Write a Review</h3>
              {user ? (
                <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {[5,4,3,2,1].map(r => (
                      <button key={r} type="button" onClick={() => setReview({ ...review, rating: r })}
                        style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: r <= review.rating ? '#f59e0b' : '#ddd' }}>★</button>
                    ))}
                    <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '0.5rem' }}>{review.rating} stars</span>
                  </div>
                  <textarea style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }} rows={3} placeholder="Share your experience..." value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} required />
                  <button type="submit" style={{ padding: '0.8rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Review</button>
                </form>
              ) : (
                <p style={{ color: '#888' }}>Please <a href="/login" style={{ color: '#1a6b3c' }}>login</a> to write a review.</p>
              )}
            </div>

            {/* Rating Breakdown */}
            {reviews.length > 0 && (
              <div style={styles.ratingBreakdown}>
                <div style={styles.overallRating}>
                  <span style={styles.bigRating}>{site.rating?.toFixed(1)}</span>
                  <span>{'⭐'.repeat(Math.round(site.rating))}</span>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>{reviews.length} reviews</span>
                </div>
                <div style={styles.bars}>
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} style={styles.barRow}>
                      <span style={styles.barLabel}>{star}⭐</span>
                      <div style={styles.barBg}><div style={{ ...styles.barFill, width: `${pct}%` }} /></div>
                      <span style={styles.barCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.map(r => (
              <div key={r._id} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewAvatar}>{r.user?.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <strong>{r.user?.name}</strong>
                    <div style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                  <span style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={styles.reviewText}>{r.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p style={{ color: '#888' }}>{t.sites.noReviews}</p>}
          </div>
        </div>

        {/* Right Column - Info Card */}
        <div style={styles.sidebar}>
          <div style={styles.infoSidebar}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.sites.quickInfo}</h3>
            
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>Managed By</div>
              <div style={styles.sidebarValue}>{site.managedBy || 'Bahir Dar City Administration'}</div>
            </div>
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>Payment Method</div>
              <div style={{ ...styles.sidebarValue, color: site.paymentMethod === 'free' ? '#1a6b3c' : '#d97706', fontWeight: 600 }}>
                {site.paymentMethod === 'free' ? '✅ Free Entry' : '🎟 Pay at the Gate'}
              </div>
            </div>
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>{t.sites.entranceFee}</div>
              <div style={styles.sidebarValue}>{site.entranceFee ? `ETB ${site.entranceFee}` : t.common.free.toUpperCase()}</div>
            </div>

            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>{t.sites.openingHours}</div>
              <div style={styles.sidebarValue}>{site.openingHours || t.sites.open24}</div>
            </div>

            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>{t.sites.category}</div>
              <div style={styles.sidebarValue}>{cat.icon} {cat.label}</div>
            </div>

            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>{t.sites.rating}</div>
              <div style={styles.sidebarValue}>{site.rating?.toFixed(1)} / 5.0</div>
            </div>

            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>{t.sites.reviewsLabel}</div>
              <div style={styles.sidebarValue}>{site.numReviews} {t.common.reviews}</div>
            </div>
          </div>

          {/* Contact Card */}
          <div style={styles.contactCard}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.sites.planVisit}</h3>
            <p style={styles.policy}>📞 Call: +251 582 200 000</p>
            <p style={styles.policy}>📧 info@visitbahirdar.et</p>
            <p style={styles.policy}>🚤 Book boat tours</p>
            <p style={styles.policy}>🧭 Hire local guides</p>
          </div>

          {/* Share Card */}
          <div style={styles.shareCard}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.sites.shareTitle}</h3>
            <div style={styles.shareButtons}>
              <button style={styles.shareBtn}>{t.sites.share}</button>
              <button style={styles.shareBtn}>{t.sites.save}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' },
  loading: { padding: '4rem', textAlign: 'center', color: '#1a6b3c', fontSize: '1.2rem' },
  gallery: { borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem' },
  mainImg: { width: '100%', height: '480px', objectFit: 'cover', display: 'block' },
  thumbs: { display: 'flex', gap: '0.5rem', padding: '0.5rem', background: '#000' },
  thumb: { width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', opacity: 0.8 },
  body: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' },
  main: { minWidth: 0 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  categoryBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '20px', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.8rem' },
  title: { color: '#1a6b3c', margin: 0, fontSize: '2rem' },
  ratingBadge: { background: '#1a6b3c', color: '#fff', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' },
  ratingNum: { display: 'block', fontSize: '2rem', fontWeight: 'bold' },
  ratingLabel: { fontSize: '0.8rem' },
  infoCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  infoCard: { background: '#f0f7f3', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  infoIcon: { fontSize: '1.5rem' },
  infoVal: { fontWeight: 'bold', color: '#1a6b3c', fontSize: '1.1rem', textAlign: 'center' },
  infoLbl: { fontSize: '0.75rem', color: '#888', textAlign: 'center' },
  section: { marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem', fontSize: '1.3rem' },
  desc: { color: '#555', lineHeight: 1.8, fontSize: '1rem' },
  visitorInfo: { background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid #eee' },
  infoLabel: { fontWeight: 'bold', color: '#666' },
  infoValue: { color: '#333' },
  tips: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  tip: { background: '#f0f7f3', padding: '0.8rem 1rem', borderRadius: '8px', color: '#555', fontSize: '0.95rem' },
  mapDesc: { color: '#888', fontSize: '0.9rem', marginBottom: '0.8rem' },
  map: { height: '350px', borderRadius: '12px' },
  ratingBreakdown: { display: 'flex', gap: '2rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' },
  overallRating: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
  bigRating: { fontSize: '3rem', fontWeight: 'bold', color: '#1a6b3c' },
  bars: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  barLabel: { width: '30px', fontSize: '0.85rem', color: '#666' },
  barBg: { flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', background: '#f59e0b', borderRadius: '4px', transition: 'width 0.3s' },
  barCount: { width: '20px', fontSize: '0.8rem', color: '#888' },
  reviewCard: { background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' },
  reviewAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 },
  reviewDate: { marginLeft: 'auto', color: '#aaa', fontSize: '0.8rem' },
  reviewText: { color: '#555', lineHeight: 1.6, margin: 0 },
  sidebar: { position: 'sticky', top: '1rem' },
  infoSidebar: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: '1rem' },
  sidebarSection: { marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0' },
  sidebarLabel: { fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' },
  sidebarValue: { fontSize: '1rem', color: '#333', fontWeight: '500' },
  contactCard: { background: '#f0f7f3', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' },
  policy: { fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' },
  shareCard: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  shareButtons: { display: 'flex', gap: '0.5rem' },
  shareBtn: { flex: 1, padding: '0.7rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
};
