import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import GoogleDirectionsMap from '../components/GoogleDirectionsMap';

export default function GuideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLang();
  const [guide, setGuide] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', message: '', paymentMethod: 'telebirr' });
  const [days, setDays] = useState(0);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get(`/guides/${id}`),
      API.get(`/reviews/item/guide/${id}`),
    ]).then(([g, r]) => {
      setGuide(g.data);
      setReviews(Array.isArray(r.data) ? r.data : []);
      document.title = `${g.data.user?.name} – Tour Guide – Visit Bahir Dar`;
    }).catch(() => setError('Failed to load guide details. Please refresh.'));
    if (user) {
      API.get('/auth/favorites').then(({ data }) => {
        setIsFavorite(data.guides?.some(f => f._id === id || f === id));
      }).catch(() => {});
    }
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return toast.error('Please login to save favorites');
    try {
      const { data } = await API.put('/auth/favorites', { type: 'guides', id });
      setIsFavorite(data.added);
      toast.success(data.added ? 'Added to favorites!' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorites'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    try {
      const { data } = await API.post('/reviews', { reviewType: 'guide', guide: id, ...review });
      setReviews([data, ...reviews]);
      toast.success('Review submitted!');
      setReview({ rating: 5, comment: '' });
    } catch { toast.error('Review failed'); }
  };

  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      const d = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000);
      setDays(d > 0 ? d : 0);
    }
  }, [booking.checkIn, booking.checkOut]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to book');
    if (days <= 0) return toast.error('Invalid dates');
    try {
      const totalPrice = guide.pricePerDay * days;
      const { data } = await API.post('/bookings', { 
        bookingType: 'guide', 
        guide: id, 
        totalPrice,
        ...booking 
      });
      // Fetch guide payment accounts for confirmation
      const guideData = await API.get(`/guides/${id}`);
      setBookingConfirmed({ 
        ...data.booking || data, 
        paymentAccounts: guideData.data.paymentAccounts 
      });
      setBooking({ checkIn: '', checkOut: '', message: '', paymentMethod: 'telebirr' });
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
  };

  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: '#e53e3e' }}>{error}</div>;
  if (!guide) return <div style={styles.loading}>{t.common.loading}</div>;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <img src={guide.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'} alt={guide.user?.name} style={styles.avatar} />
          <div style={styles.heroText}>
            <h1 style={styles.name}>{guide.user?.name}</h1>
            <div style={styles.heroMeta}>
              <span style={styles.metaItem}>🧭 Professional Tour Guide</span>
              <span style={styles.metaItem}>📞 {guide.user?.phone}</span>
              <span style={styles.metaItem}>⭐ {guide.rating?.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
            <div style={styles.languages}>
              {guide.languages?.map(lang => (
                <span key={lang} style={styles.langBadge}>🗣 {lang}</span>
              ))}
            </div>
          </div>
          <div style={styles.ratingBadge}>
            <span style={styles.ratingNum}>{guide.rating?.toFixed(1)}</span>
            <span style={styles.ratingLabel}>⭐ {reviews.length} reviews</span>
          </div>
          <button onClick={toggleFavorite} style={{ padding: '0.6rem 1.2rem', border: '2px solid #fff', borderRadius: '8px', cursor: 'pointer', background: isFavorite ? '#fff' : 'transparent', color: isFavorite ? '#e53e3e' : '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
            {isFavorite ? '❤️ Saved' : '🤍 Save Guide'}
          </button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Left Column */}
        <div style={styles.main}>
          {/* Quick Info Cards */}
          <div style={styles.infoCards}>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>💰</span>
              <span style={styles.infoVal}>ETB {guide.pricePerDay?.toLocaleString()}</span>
              <span style={styles.infoLbl}>per day</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🗣</span>
              <span style={styles.infoVal}>{guide.languages?.length || 0}</span>
              <span style={styles.infoLbl}>languages</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🎯</span>
              <span style={styles.infoVal}>{guide.specialties?.length || 0}</span>
              <span style={styles.infoLbl}>specialties</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>⭐</span>
              <span style={styles.infoVal}>{guide.rating?.toFixed(1)}/5</span>
              <span style={styles.infoLbl}>rating</span>
            </div>
          </div>

          {/* About */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.guides.about} {guide.user?.name}</h2>
            <p style={styles.bio}>{guide.bio}</p>
          </div>

          {/* Specialties */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.guides.specialties}</h2>
            <div style={styles.specialties}>
              {guide.specialties?.map(spec => (
                <div key={spec} style={styles.specialty}>
                  <span style={styles.specIcon}>✓</span>
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.guides.languages}</h2>
            <div style={styles.languageList}>
              {guide.languages?.map(lang => (
                <div key={lang} style={styles.languageItem}>
                  <span style={styles.langIcon}>🌐</span>
                  <span style={styles.langName}>{lang}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {guide.certifications?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>{t.guides.certifications}</h2>
              <div style={styles.certifications}>
                {guide.certifications.map((cert, i) => (
                  <div key={i} style={styles.certification}>
                    <span style={styles.certIcon}>✓</span>
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Expect */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.guides.whatToExpect}</h2>
            <div style={styles.expectations}>
              <div style={styles.expectation}>
                <span style={styles.expectIcon}>🧭</span>
                <div>
                  <strong>Expert Local Knowledge</strong>
                  <p>Deep understanding of Bahir Dar's history, culture, and hidden gems</p>
                </div>
              </div>
              <div style={styles.expectation}>
                <span style={styles.expectIcon}>🚤</span>
                <div>
                  <strong>Customized Tours</strong>
                  <p>Flexible itineraries tailored to your interests and schedule</p>
                </div>
              </div>
              <div style={styles.expectation}>
                <span style={styles.expectIcon}>📸</span>
                <div>
                  <strong>Photo Opportunities</strong>
                  <p>Best spots and timing for capturing memorable photos</p>
                </div>
              </div>
              <div style={styles.expectation}>
                <span style={styles.expectIcon}>🍽</span>
                <div>
                  <strong>Local Recommendations</strong>
                  <p>Authentic restaurants, cafes, and cultural experiences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Directions Map */}
          {guide.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🗺️ Operating Area & Directions</h2>
              <GoogleDirectionsMap 
                destination={{ lat: guide.location.lat, lng: guide.location.lng }}
                destinationName={guide.user?.name}
                height="500px"
                showDirections={true}
              />
            </div>
          )}

          {/* Leaflet Map (Backup) */}
          {guide.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📍 Map View</h2>
              {guide.travelTime && (guide.travelTime.fromAirport?.taxi || guide.travelTime.fromBusStation?.taxi) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                    <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>✈️ From Airport</h4>
                    <p style={styles.bio}>🚕 Taxi: <strong>{guide.travelTime.fromAirport?.taxi}</strong></p>
                    <p style={styles.bio}>🚌 Bus: <strong>{guide.travelTime.fromAirport?.bus}</strong></p>
                    <p style={styles.bio}>🚶 Walk: <strong>{guide.travelTime.fromAirport?.walk}</strong></p>
                  </div>
                  <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                    <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>🚌 From Bus Station</h4>
                    <p style={styles.bio}>🚕 Taxi: <strong>{guide.travelTime.fromBusStation?.taxi}</strong></p>
                    <p style={styles.bio}>🚌 Bus: <strong>{guide.travelTime.fromBusStation?.bus}</strong></p>
                    <p style={styles.bio}>🚶 Walk: <strong>{guide.travelTime.fromBusStation?.walk}</strong></p>
                  </div>
                </div>
              )}
              <MapContainer center={[guide.location.lat, guide.location.lng]} zoom={13} style={styles.map}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[guide.location.lat, guide.location.lng]}>
                  <Popup>{guide.user?.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {/* Reviews */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.guides.clientReviews} ({reviews.length})</h2>

            {/* Write Review */}
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
                  <textarea style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', width: '100%', boxSizing: 'border-box', resize: 'vertical' }} rows={3} placeholder="Share your experience with this guide..." value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} required />
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
                  <span style={styles.bigRating}>{guide.rating?.toFixed(1)}</span>
                  <span>{'⭐'.repeat(Math.round(guide.rating))}</span>
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
            {reviews.length === 0 && <p style={{ color: '#888' }}>{t.common.noReviews}</p>}
          </div>
        </div>

        {/* Right Column - Booking */}
        <div style={styles.sidebar}>
          <div style={styles.bookingCard}>
            <div style={styles.priceRow}>
              <span style={styles.price}>ETB {guide.pricePerDay?.toLocaleString()}</span>
              <span style={styles.priceUnit}> {t.guides.perDayLabel}</span>
            </div>
            <div style={styles.ratingRow}>
              {'⭐'.repeat(Math.round(guide.rating))} <span style={{ color: '#888', fontSize: '0.85rem' }}>({reviews.length} reviews)</span>
            </div>

            <form onSubmit={handleBooking} style={styles.bookForm}>
              <div style={styles.dateGrid}>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{t.guides.startDate}</label>
                  <input style={styles.dateInput} type="date" value={booking.checkIn} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, checkIn: e.target.value })} required />
                </div>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{t.guides.endDate}</label>
                  <input style={styles.dateInput} type="date" value={booking.checkOut} min={booking.checkIn || new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, checkOut: e.target.value })} required />
                </div>
              </div>
              <textarea style={{ ...styles.dateInput, resize: 'none' }} rows={3} placeholder={t.guides.tourPreferences}
                value={booking.message} onChange={e => setBooking({ ...booking, message: e.target.value })} />

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', display: 'block', marginBottom: '0.4rem' }}>PAYMENT METHOD</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  {[
                    { value: 'telebirr', label: '📱 Telebirr' },
                    { value: 'cbe_birr', label: '🏦 CBE Birr' },
                    { value: 'bank_transfer', label: '🏛️ Bank Transfer' },
                    { value: 'cash', label: '💵 Pay After Tour' },
                  ].map(pm => (
                    <button key={pm.value} type="button"
                      onClick={() => setBooking({ ...booking, paymentMethod: pm.value })}
                      style={{ padding: '0.5rem', border: `2px solid ${booking.paymentMethod === pm.value ? '#1a6b3c' : '#ddd'}`, borderRadius: '8px', background: booking.paymentMethod === pm.value ? '#e6f4ed' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: booking.paymentMethod === pm.value ? 700 : 400 }}>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {days > 0 && (
                <div style={styles.priceBreakdown}>
                  <div style={styles.priceRow2}><span>ETB {guide.pricePerDay?.toLocaleString()} × {days} {t.guides.days}</span><span>ETB {(guide.pricePerDay * days).toLocaleString()}</span></div>
                  <div style={{ ...styles.priceRow2, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                    <span>{t.guides.total}</span><span style={{ color: '#1a6b3c' }}>ETB {(guide.pricePerDay * days).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button type="submit" style={styles.bookBtn}>{t.guides.requestBooking}</button>
            </form>

            <div style={styles.policies}>
              <p style={styles.policy}>{t.guides.flexibleCancellation}</p>
              <p style={styles.policy}>{t.guides.confirmation}</p>
              <p style={styles.policy}>{t.guides.payAfterTour}</p>
            </div>
          </div>

          {/* Services Included */}
          <div style={styles.servicesCard}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.guides.servicesIncluded}</h3>
            <div style={styles.servicesList}>
              <p style={styles.service}>✓ Professional tour guide</p>
              <p style={styles.service}>✓ Customized itinerary</p>
              <p style={styles.service}>✓ Local insights & stories</p>
              <p style={styles.service}>✓ Photo assistance</p>
              <p style={styles.service}>✓ Restaurant recommendations</p>
            </div>
          </div>

          {/* Contact Card */}
          <div style={styles.contactCard}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.guides.contactGuide}</h3>
            {guide.user?.phone && <p style={styles.policy}>📞 {guide.user.phone}</p>}
            {guide.user?.email && <p style={styles.policy}>📧 {guide.user.email}</p>}
          </div>
        </div>
      </div>
      {/* Booking Confirmation Modal */}
      {bookingConfirmed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '3rem', textAlign: 'center' }}>✅</div>
            <h2 style={{ color: '#1a6b3c', textAlign: 'center', margin: '0.5rem 0' }}>Booking Confirmed!</h2>
            <p style={{ color: '#555', textAlign: 'center', marginBottom: '1.5rem' }}>Your tour with <strong>{guide.user?.name}</strong> has been submitted.</p>
            <div style={{ background: '#f0faf4', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#1a6b3c', margin: '0 0 1rem' }}>💰 Payment Instructions</h3>
              {bookingConfirmed.paymentMethod === 'telebirr' && bookingConfirmed.paymentAccounts?.telebirr?.enabled && (
                <>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>📱 <strong>Send ETB {bookingConfirmed.totalPrice?.toLocaleString()} via Telebirr</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Telebirr Number: <strong>{bookingConfirmed.paymentAccounts.telebirr.phoneNumber}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Account Name: <strong>{bookingConfirmed.paymentAccounts.telebirr.accountName || guide.user?.name}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'cbe_birr' && bookingConfirmed.paymentAccounts?.cbeBirr?.enabled && (
                <>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>🏦 <strong>Send ETB {bookingConfirmed.totalPrice?.toLocaleString()} via CBE Birr</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>CBE Account: <strong>{bookingConfirmed.paymentAccounts.cbeBirr.accountNumber}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Account Name: <strong>{bookingConfirmed.paymentAccounts.cbeBirr.accountName || guide.user?.name}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'bank_transfer' && bookingConfirmed.paymentAccounts?.bankTransfer?.enabled && (
                <>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>🏛️ <strong>Bank Transfer — ETB {bookingConfirmed.totalPrice?.toLocaleString()}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Bank: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.bankName}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Account: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.accountNumber}</strong></p>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Account Name: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.accountName || guide.user?.name}</strong></p>
                  {bookingConfirmed.paymentAccounts.bankTransfer.branchCode && (
                    <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Branch Code: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.branchCode}</strong></p>
                  )}
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'cash' && bookingConfirmed.paymentAccounts?.cash?.enabled && (
                <>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>💵 <strong>Pay ETB {bookingConfirmed.totalPrice?.toLocaleString()} cash to the guide after your tour</strong></p>
                  {bookingConfirmed.paymentAccounts.cash.instructions && (
                    <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>{bookingConfirmed.paymentAccounts.cash.instructions}</p>
                  )}
                </>
              )}
              <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '0.8rem', marginTop: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>✅ Your booking request and payment details have been sent directly to <strong>{guide.user?.name}</strong>. They will confirm or decline your booking shortly.</p>
              </div>
            </div>
            <button onClick={() => setBookingConfirmed(null)} style={{ width: '100%', padding: '0.9rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' },
  loading: { padding: '4rem', textAlign: 'center', color: '#1a6b3c', fontSize: '1.2rem' },
  hero: { background: 'linear-gradient(135deg, #1a6b3c 0%, #2d8659 100%)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', color: '#fff' },
  heroContent: { display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' },
  avatar: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', flexShrink: 0 },
  heroText: { flex: 1, minWidth: '250px' },
  name: { margin: '0 0 0.5rem', fontSize: '2rem', color: '#fff' },
  heroMeta: { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' },
  metaItem: { fontSize: '0.95rem', opacity: 0.95 },
  languages: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  langBadge: { background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' },
  ratingBadge: { background: 'rgba(255,255,255,0.2)', padding: '1rem 1.5rem', borderRadius: '12px', textAlign: 'center', backdropFilter: 'blur(10px)' },
  ratingNum: { display: 'block', fontSize: '2.5rem', fontWeight: 'bold' },
  ratingLabel: { fontSize: '0.85rem' },
  body: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' },
  main: { minWidth: 0 },
  infoCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  infoCard: { background: '#f0f7f3', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  infoIcon: { fontSize: '1.5rem' },
  infoVal: { fontWeight: 'bold', color: '#1a6b3c', fontSize: '1.1rem' },
  infoLbl: { fontSize: '0.75rem', color: '#888' },
  section: { marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem', fontSize: '1.3rem' },
  bio: { color: '#555', lineHeight: 1.8, fontSize: '1rem' },
  specialties: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' },
  specialty: { display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f0f7f3', padding: '0.8rem 1rem', borderRadius: '8px' },
  specIcon: { color: '#1a6b3c', fontWeight: 'bold', fontSize: '1.2rem' },
  languageList: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  languageItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9f9f9', padding: '0.8rem 1.2rem', borderRadius: '8px' },
  langIcon: { fontSize: '1.2rem' },
  langName: { fontWeight: '500', color: '#333' },
  certifications: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  certification: { display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff4e6', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #f59e0b' },
  certIcon: { color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem' },
  expectations: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  expectation: { display: 'flex', gap: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '12px' },
  expectIcon: { fontSize: '2rem', flexShrink: 0 },
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
  bookingCard: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: '1rem' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.3rem' },
  price: { fontSize: '1.8rem', fontWeight: 'bold', color: '#1a6b3c' },
  priceUnit: { color: '#888', fontSize: '1rem' },
  ratingRow: { marginBottom: '1.2rem', fontSize: '0.9rem' },
  bookForm: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  dateGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  dateField: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  dateLabel: { fontSize: '0.7rem', fontWeight: 'bold', color: '#888', letterSpacing: '0.05em' },
  dateInput: { padding: '0.7rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  priceBreakdown: { background: '#f9f9f9', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  priceRow2: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' },
  bookBtn: { padding: '1rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  policies: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  policy: { fontSize: '0.85rem', color: '#666', margin: 0 },
  servicesCard: { background: '#f0f7f3', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' },
  servicesList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  service: { fontSize: '0.9rem', color: '#555', margin: 0 },
  contactCard: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  contactBtn: { width: '100%', padding: '0.8rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.8rem' },
};
