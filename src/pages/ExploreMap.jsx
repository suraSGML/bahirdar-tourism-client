import { useEffect, useState } from 'react';
import API from '../api/axios';
import GoogleMapView from '../components/GoogleMapView';

export default function ExploreMap() {
  const [hotels, setHotels] = useState([]);
  const [sites, setSites] = useState([]);
  const [guides, setGuides] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/hotels'),
      API.get('/sites'),
      API.get('/guides'),
      API.get('/transport'),
    ]).then(([h, s, g, t]) => {
      // Handle both paginated and direct array responses
      setHotels(h.data?.data || h.data || []);
      setSites(s.data?.data || s.data || []);
      setGuides(g.data?.data || g.data || []);
      setTransports(t.data?.data || t.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load map data:', err);
      setLoading(false);
    });
  }, []);

  const total = hotels.length + sites.length + guides.length + transports.length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🗺 Explore Bahir Dar</h2>
        <p style={styles.sub}>Discover all {total} locations on the map - hotels, tourist sites, tour guides and transport services</p>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {[
          { icon: '🏨', count: hotels.length, label: 'Hotels', color: '#2b6cb0' },
          { icon: '⛪', count: sites.length, label: 'Tourist Sites', color: '#1a6b3c' },
          { icon: '🧭', count: guides.length, label: 'Tour Guides', color: '#e53e3e' },
          { icon: '🚤', count: transports.length, label: 'Transport', color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, borderTop: `3px solid ${s.color}` }}>
            <span style={styles.statIcon}>{s.icon}</span>
            <span style={{ ...styles.statCount, color: s.color }}>{s.count}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      {loading ? (
        <div style={styles.loading}>Loading map data...</div>
      ) : (
        <GoogleMapView
          hotels={hotels}
          sites={sites}
          guides={guides}
          transports={transports}
          height="600px"
          showFilter={true}
        />
      )}

      {/* Quick Lists */}
      <div style={styles.lists}>
        <QuickList title="🏨 Hotels" items={hotels} linkPrefix="hotels" priceKey="pricePerNight" priceLabel="night" />
        <QuickList title="⛪ Tourist Sites" items={sites} linkPrefix="sites" priceKey="entranceFee" priceLabel="entrance" />
        <QuickList title="🧭 Tour Guides" items={guides} linkPrefix="guides" priceKey="pricePerDay" priceLabel="day" nameKey="user.name" />
        <QuickList title="🚤 Transport" items={transports} linkPrefix="transport" priceKey="pricePerTrip" priceLabel="trip" />
      </div>
    </div>
  );
}

function QuickList({ title, items, linkPrefix, priceKey, priceLabel, nameKey }) {
  const getName = (item) => {
    if (nameKey === 'user.name') return item.user?.name;
    return item.name;
  };

  const getPrice = (item) => {
    const val = item[priceKey];
    if (priceKey === 'entranceFee') return val ? `ETB ${val}` : 'Free';
    return `ETB ${val}/${priceLabel}`;
  };

  const getLink = (item) => linkPrefix === 'transport' ? '/transport' : `/${linkPrefix}/${item._id}`;

  return (
    <div style={styles.quickList}>
      <h3 style={styles.listTitle}>{title}</h3>
      {items.slice(0, 5).map(item => (
        <a key={item._id} href={getLink(item)} style={styles.listItem}>
          {item.images?.[0] && <img src={item.images[0]} alt="" style={styles.listImg} />}
          {!item.images?.[0] && item.profileImage && <img src={item.profileImage} alt="" style={styles.listImg} />}
          <div style={styles.listInfo}>
            <span style={styles.listName}>{getName(item)}</span>
            <span style={styles.listPrice}>{getPrice(item)}</span>
            {item.rating > 0 && <span style={styles.listRating}>⭐ {item.rating.toFixed(1)}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { color: '#1a6b3c', marginBottom: '0.5rem' },
  sub: { color: '#666', fontSize: '0.95rem' },
  stats: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '120px', background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  statIcon: { fontSize: '1.8rem' },
  statCount: { fontSize: '2rem', fontWeight: 'bold' },
  statLabel: { fontSize: '0.85rem', color: '#666' },
  loading: { height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7f3', borderRadius: '12px', color: '#1a6b3c', fontSize: '1.1rem' },
  lists: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  quickList: { background: '#fff', borderRadius: '10px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  listTitle: { color: '#1a6b3c', marginBottom: '1rem', fontSize: '1rem' },
  listItem: { display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' },
  listImg: { width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
  listInfo: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  listName: { fontSize: '0.9rem', fontWeight: '500', color: '#333' },
  listPrice: { fontSize: '0.8rem', color: '#1a6b3c', fontWeight: 'bold' },
  listRating: { fontSize: '0.75rem', color: '#888' },
};
