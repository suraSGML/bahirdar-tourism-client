import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import GoogleDirectionsMap from '../components/GoogleDirectionsMap';

export default function HotelDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLang();
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', message: '', paymentMethod: 'telebirr' });
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [activeImg, setActiveImg] = useState(0);
  const [nights, setNights] = useState(0);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get(`/hotels/${id}`),
      API.get(`/reviews/item/hotel/${id}`),
    ]).then(([h, r]) => {
      setHotel(h.data);
      setReviews(Array.isArray(r.data) ? r.data : []);
      document.title = `${h.data.name} – Visit Bahir Dar`;
    }).catch(() => setError('Failed to load hotel details. Please refresh.'));
    if (user) {
      API.get('/auth/favorites').then(({ data }) => {
        setIsFavorite(data.hotels?.some(f => f._id === id || f === id));
      }).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      const n = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000);
      setNights(n > 0 ? n : 0);
    }
  }, [booking.checkIn, booking.checkOut]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to book');
    if (nights <= 0) return toast.error('Invalid dates');
    try {
      const totalPrice = hotel.pricePerNight * nights;
      const { data } = await API.post('/bookings', { 
        bookingType: 'hotel', 
        hotel: id, 
        totalPrice,
        ...booking 
      });
      // Fetch hotel payment accounts for confirmation
      const hotelData = await API.get(`/hotels/${id}`);
      setBookingConfirmed({ 
        ...data.booking || data, 
        paymentAccounts: hotelData.data.paymentAccounts 
      });
      setBooking({ checkIn: '', checkOut: '', message: '', paymentMethod: 'telebirr' });
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    try {
      const { data } = await API.post('/reviews', { reviewType: 'hotel', hotel: id, ...review });
      setReviews([data, ...reviews]);
      toast.success('Review submitted!');
      setReview({ rating: 5, comment: '' });
    } catch { toast.error('Review failed'); }
  };

  const toggleFavorite = async () => {
    if (!user) return toast.error('Please login to save favorites');
    try {
      const { data } = await API.put('/auth/favorites', { type: 'hotels', id });
      setIsFavorite(data.added);
      toast.success(data.added ? 'Added to favorites!' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorites'); }
  };

  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: '#e53e3e' }}>{error}</div>;
  if (!hotel) return <div style={styles.loading}>{t.common.loading}</div>;

  const amenityIcons = {
    'WiFi': '📶', 'Swimming Pool': '🏊', 'Spa': '💆', 'Restaurant': '🍽',
    'Bar': '🍸', 'Lake View': '🌊', 'Boat Tours': '🚤', 'Parking': '🅿',
    'Air Conditioning': '❄', 'Garden': '🌿', 'Conference Room': '🏢',
    'Rooftop Bar': '🌆', '24hr Reception': '🕐', 'Room Service': '🛎',
    'Breakfast Included': '🍳', 'Nature Trails': '🥾', 'Waterfall View': '💧',
    'Eco Bungalows': '🌱', 'River View': '🏞', 'Traditional Decor': '🏺',
    'Shared Terrace': '🌅',
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div style={styles.page}>
      {/* Hero Gallery */}
      <div style={styles.gallery}>
        <img src={hotel.images?.[activeImg] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'} alt={hotel.name} style={styles.mainImg} />
        {hotel.images?.length > 1 && (
          <div style={styles.thumbs}>
            {hotel.images.map((img, i) => (
              <img key={i} src={img} alt="" style={{ ...styles.thumb, outline: i === activeImg ? '3px solid #1a6b3c' : 'none' }} onClick={() => setActiveImg(i)} />
            ))}
          </div>
        )}
      </div>

      <div style={styles.body}>
        {/* Left Column */}
        <div style={styles.main}>
          {/* Title & Rating */}
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>{hotel.name}</h1>
              <p style={styles.addr}>📍 {hotel.address}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <button onClick={toggleFavorite} style={{ ...styles.favBtn, background: isFavorite ? '#fee2e2' : '#f9f9f9', color: isFavorite ? '#e53e3e' : '#888' }}>
                {isFavorite ? '❤️ Saved' : '🤍 Save'}
              </button>
              <div style={styles.ratingBadge}>
              <span style={styles.ratingNum}>{hotel.rating?.toFixed(1)}</span>
              <span style={styles.ratingLabel}>⭐ {reviews.length} reviews</span>
            </div>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div style={styles.infoCards}>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>💰</span>
              <span style={styles.infoVal}>ETB {hotel.pricePerNight?.toLocaleString()}</span>
              <span style={styles.infoLbl}>per night</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>⭐</span>
              <span style={styles.infoVal}>{hotel.rating?.toFixed(1)}/5</span>
              <span style={styles.infoLbl}>rating</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>💬</span>
              <span style={styles.infoVal}>{hotel.numReviews}</span>
              <span style={styles.infoLbl}>reviews</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>✅</span>
              <span style={styles.infoVal}>{hotel.isApproved ? 'Verified' : 'Pending'}</span>
              <span style={styles.infoLbl}>status</span>
            </div>
          </div>

          {/* Description */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.hotels.aboutHotel}</h2>
            <p style={styles.desc}>{hotel.description}</p>
          </div>

          {/* Amenities */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.hotels.amenities}</h2>
            <div style={styles.amenities}>
              {hotel.amenities?.map(a => (
                <div key={a} style={styles.amenity}>
                  <span>{amenityIcons[a] || '✔'}</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Here */}
          {hotel.travelTime && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🚗 Getting Here</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                  <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>✈️ From Airport</h4>
                  <p style={styles.info}>🚕 Taxi: <strong>{hotel.travelTime.fromAirport?.taxi || 'N/A'}</strong></p>
                  <p style={styles.info}>🚌 Bus: <strong>{hotel.travelTime.fromAirport?.bus || 'N/A'}</strong></p>
                  <p style={styles.info}>🚶 Walk: <strong>{hotel.travelTime.fromAirport?.walk || 'N/A'}</strong></p>
                </div>
                <div style={{ background: '#f0f7f3', borderRadius: '12px', padding: '1.2rem' }}>
                  <h4 style={{ color: '#1a6b3c', margin: '0 0 0.8rem' }}>🚌 From Bus Station</h4>
                  <p style={styles.info}>🚕 Taxi: <strong>{hotel.travelTime.fromBusStation?.taxi || 'N/A'}</strong></p>
                  <p style={styles.info}>🚌 Bus: <strong>{hotel.travelTime.fromBusStation?.bus || 'N/A'}</strong></p>
                  <p style={styles.info}>🚶 Walk: <strong>{hotel.travelTime.fromBusStation?.walk || 'N/A'}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Google Directions Map */}
          {hotel.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🗺️ {t.hotels.location} & Directions</h2>
              <GoogleDirectionsMap 
                destination={{ lat: hotel.location.lat, lng: hotel.location.lng }}
                destinationName={hotel.name}
                height="500px"
                showDirections={true}
              />
            </div>
          )}

          {/* Leaflet Map (Backup) */}
          {hotel.location?.lat && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📍 Map View</h2>
              <MapContainer center={[hotel.location.lat, hotel.location.lng]} zoom={15} style={styles.map}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[hotel.location.lat, hotel.location.lng]}>
                  <Popup>{hotel.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {/* Reviews */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.hotels.guestReviews} ({reviews.length})</h2>

            {/* Rating Breakdown */}
            {reviews.length > 0 && (
              <div style={styles.ratingBreakdown}>
                <div style={styles.overallRating}>
                  <span style={styles.bigRating}>{hotel.rating?.toFixed(1)}</span>
                  <span>{'⭐'.repeat(Math.round(hotel.rating))}</span>
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

            {/* Write Review */}
            <div style={styles.reviewForm}>
              <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.hotels.writeReview}</h3>
              {user ? (
                <form onSubmit={handleReview} style={styles.form}>
                  <div style={styles.starSelect}>
                    {[5, 4, 3, 2, 1].map(r => (
                      <button key={r} type="button" onClick={() => setReview({ ...review, rating: r })}
                        style={{ ...styles.starBtn, color: r <= review.rating ? '#f59e0b' : '#ddd' }}>★</button>
                    ))}
                    <span style={{ color: '#888', fontSize: '0.9rem' }}>{review.rating} {t.common.stars}</span>
                  </div>
                  <textarea style={styles.input} rows={3} placeholder={t.hotels.shareExperience} value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} required />
                  <button type="submit" style={styles.btn}>{t.hotels.submitReview}</button>
                </form>
              ) : (
                <p style={{ color: '#888' }}>{t.hotels.loginToReview} <a href="/login" style={{ color: '#1a6b3c' }}>{t.hotels.loginToReviewLink}</a> {t.hotels.loginToReviewSuffix}</p>
              )}
            </div>

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
              <span style={styles.price}>ETB {hotel.pricePerNight?.toLocaleString()}</span>
              <span style={styles.priceUnit}> {t.hotels.perNightLabel}</span>
            </div>
            <div style={styles.ratingRow}>
              {'⭐'.repeat(Math.round(hotel.rating))} <span style={{ color: '#888', fontSize: '0.85rem' }}>({reviews.length} reviews)</span>
            </div>

            <form onSubmit={handleBooking} style={styles.bookForm}>
              <div style={styles.dateGrid}>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{t.hotels.checkIn}</label>
                  <input style={styles.dateInput} type="date" value={booking.checkIn} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, checkIn: e.target.value })} required />
                </div>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{t.hotels.checkOut}</label>
                  <input style={styles.dateInput} type="date" value={booking.checkOut} min={booking.checkIn || new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, checkOut: e.target.value })} required />
                </div>
              </div>
              <textarea style={{ ...styles.dateInput, resize: 'none' }} rows={2} placeholder={t.hotels.specialRequests}
                value={booking.message} onChange={e => setBooking({ ...booking, message: e.target.value })} />

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', display: 'block', marginBottom: '0.4rem' }}>PAYMENT METHOD</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  {[
                    { value: 'telebirr', label: '📱 Telebirr' },
                    { value: 'cbe_birr', label: '🏦 CBE Birr' },
                    { value: 'bank_transfer', label: '🏛️ Bank Transfer' },
                    { value: 'cash', label: '💵 Cash at Hotel' },
                  ].map(pm => (
                    <button key={pm.value} type="button"
                      onClick={() => setBooking({ ...booking, paymentMethod: pm.value })}
                      style={{ padding: '0.5rem', border: `2px solid ${booking.paymentMethod === pm.value ? '#1a6b3c' : '#ddd'}`, borderRadius: '8px', background: booking.paymentMethod === pm.value ? '#e6f4ed' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: booking.paymentMethod === pm.value ? 700 : 400 }}>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {nights > 0 && (
                <div style={styles.priceBreakdown}>
                  <div style={styles.priceRow2}><span>ETB {hotel.pricePerNight?.toLocaleString()} × {nights} {t.hotels.nights}</span><span>ETB {(hotel.pricePerNight * nights).toLocaleString()}</span></div>
                  <div style={{ ...styles.priceRow2, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                    <span>{t.hotels.total}</span><span style={{ color: '#1a6b3c' }}>ETB {(hotel.pricePerNight * nights).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button type="submit" style={styles.bookBtn}>{t.hotels.reserveNow}</button>
            </form>

            <div style={styles.policies}>
              <p style={styles.policy}>{t.hotels.freeCancellation}</p>
              <p style={styles.policy}>{t.hotels.confirmation}</p>
              <p style={styles.policy}>{t.hotels.payAtHotel}</p>
            </div>
          </div>

          {/* Contact Card */}
          <div style={styles.contactCard}>
            <h3 style={{ color: '#1a6b3c', marginBottom: '1rem' }}>{t.hotels.needHelp}</h3>
            <p style={styles.policy}>📞 Call us: +251 582 200 000</p>
            <p style={styles.policy}>📧 info@visitbahirdar.et</p>
            <p style={styles.policy}>🕐 Available 24/7</p>
          </div>
        </div>
      </div>
      {/* Booking Confirmation Modal */}
      {bookingConfirmed && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: '3rem', textAlign: 'center' }}>✅</div>
            <h2 style={{ color: '#1a6b3c', textAlign: 'center', margin: '0.5rem 0' }}>Booking Confirmed!</h2>
            <p style={{ color: '#555', textAlign: 'center', marginBottom: '1.5rem' }}>Your reservation at <strong>{hotel.name}</strong> has been submitted.</p>
            <div style={styles.paymentBox}>
              <h3 style={{ color: '#1a6b3c', margin: '0 0 1rem' }}>💰 Payment Instructions</h3>
              {bookingConfirmed.paymentMethod === 'telebirr' && bookingConfirmed.paymentAccounts?.telebirr?.enabled && (
                <>
                  <p style={styles.payStep}>📱 <strong>Send ETB {bookingConfirmed.totalPrice?.toLocaleString()} via Telebirr</strong></p>
                  <p style={styles.payStep}>Telebirr Number: <strong>{bookingConfirmed.paymentAccounts.telebirr.phoneNumber}</strong></p>
                  <p style={styles.payStep}>Account Name: <strong>{bookingConfirmed.paymentAccounts.telebirr.accountName || hotel.name}</strong></p>
                  <p style={styles.payStep}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'cbe_birr' && bookingConfirmed.paymentAccounts?.cbeBirr?.enabled && (
                <>
                  <p style={styles.payStep}>🏦 <strong>Send ETB {bookingConfirmed.totalPrice?.toLocaleString()} via CBE Birr</strong></p>
                  <p style={styles.payStep}>CBE Account: <strong>{bookingConfirmed.paymentAccounts.cbeBirr.accountNumber}</strong></p>
                  <p style={styles.payStep}>Account Name: <strong>{bookingConfirmed.paymentAccounts.cbeBirr.accountName || hotel.name}</strong></p>
                  <p style={styles.payStep}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'bank_transfer' && bookingConfirmed.paymentAccounts?.bankTransfer?.enabled && (
                <>
                  <p style={styles.payStep}>🏛️ <strong>Bank Transfer — ETB {bookingConfirmed.totalPrice?.toLocaleString()}</strong></p>
                  <p style={styles.payStep}>Bank: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.bankName}</strong></p>
                  <p style={styles.payStep}>Account: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.accountNumber}</strong></p>
                  <p style={styles.payStep}>Account Name: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.accountName || hotel.name}</strong></p>
                  {bookingConfirmed.paymentAccounts.bankTransfer.branchCode && (
                    <p style={styles.payStep}>Branch Code: <strong>{bookingConfirmed.paymentAccounts.bankTransfer.branchCode}</strong></p>
                  )}
                  <p style={styles.payStep}>Reference: <strong>BK-{bookingConfirmed._id?.slice(-6).toUpperCase()}</strong></p>
                </>
              )}
              {bookingConfirmed.paymentMethod === 'cash' && bookingConfirmed.paymentAccounts?.cash?.enabled && (
                <>
                  <p style={styles.payStep}>💵 <strong>Pay ETB {bookingConfirmed.totalPrice?.toLocaleString()} cash at the hotel</strong></p>
                  <p style={styles.payStep}>Pay upon check-in on <strong>{bookingConfirmed.checkIn ? new Date(bookingConfirmed.checkIn).toLocaleDateString() : 'your arrival date'}</strong></p>
                  {bookingConfirmed.paymentAccounts.cash.instructions && (
                    <p style={styles.payStep}>{bookingConfirmed.paymentAccounts.cash.instructions}</p>
                  )}
                </>
              )}
              <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '0.8rem', marginTop: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>✅ Your booking request and payment details have been sent directly to <strong>{hotel.name}</strong>. They will confirm or decline your booking shortly.</p>
              </div>
            </div>
            <button onClick={() => setBookingConfirmed(null)} style={{ ...styles.bookBtn, marginTop: '1rem' }}>Close</button>
          </div>
        </div>
      )}

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
  body: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' },
  main: { minWidth: 0 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { color: '#1a6b3c', margin: 0, fontSize: '2rem' },
  addr: { color: '#666', margin: '0.3rem 0 0' },
  ratingBadge: { background: '#1a6b3c', color: '#fff', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' },
  ratingNum: { display: 'block', fontSize: '2rem', fontWeight: 'bold' },
  ratingLabel: { fontSize: '0.8rem' },
  infoCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  infoCard: { background: '#f0f7f3', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  infoIcon: { fontSize: '1.5rem' },
  infoVal: { fontWeight: 'bold', color: '#1a6b3c', fontSize: '1.1rem' },
  infoLbl: { fontSize: '0.75rem', color: '#888' },
  section: { marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { color: '#1a6b3c', marginBottom: '1rem', fontSize: '1.3rem' },
  desc: { color: '#555', lineHeight: 1.8, fontSize: '1rem' },
  amenities: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.8rem' },
  amenity: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9f9f9', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' },
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
  reviewForm: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' },
  starSelect: { display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.8rem' },
  starBtn: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', padding: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  input: { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '0.8rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
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
  contactCard: { background: '#f0f7f3', borderRadius: '16px', padding: '1.5rem' },
  favBtn: { padding: '0.6rem 1.2rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  paymentBox: { background: '#f0faf4', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' },
  payStep: { margin: '0.4rem 0', fontSize: '0.9rem', color: '#333' },
};
