import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BAHIRDAR_CENTER = [11.5936, 37.3906];

const TYPE_LABELS = {
  hotel: '🏨 Hotel',
  site: '⛪ Tourist Site',
  transport: '🚤 Transport',
  guide: '🧭 Tour Guide',
};

const TYPE_COLORS = {
  hotel: '#3b82f6',
  site: '#10b981',
  transport: '#f59e0b',
  guide: '#ef4444',
};

function LeafletMap({ allMarkers, height, showFilter, filter, setFilter }) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.1)' }}>
      {showFilter && (
        <div style={styles.filterBar}>
          {Object.keys(filter).map(type => (
            <button
              key={type}
              onClick={() => setFilter(f => ({ ...f, [type]: !f[type] }))}
              style={{ ...styles.filterBtn, opacity: filter[type] ? 1 : 0.4, borderColor: TYPE_COLORS[type] }}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
      <MapContainer center={BAHIRDAR_CENTER} zoom={13} style={{ width: '100%', height }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {allMarkers.map(marker => (
          <Marker key={`${marker.markerType}-${marker._id}`} position={[marker.location.lat, marker.location.lng]}>
            <Popup>
              <div style={{ minWidth: '160px' }}>
                {marker.images?.[0] && (
                  <img src={marker.images[0]} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.4rem' }} />
                )}
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{TYPE_LABELS[marker.markerType]}</span>
                <h4 style={{ margin: '0.2rem 0', color: '#1a6b3c', fontSize: '0.95rem' }}>
                  {marker.name || marker.user?.name}
                </h4>
                {marker.address && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>📍 {marker.address}</p>}
                {marker.pricePerNight && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>💰 ETB {marker.pricePerNight}/night</p>}
                {marker.pricePerDay && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>💰 ETB {marker.pricePerDay}/day</p>}
                {marker.pricePerTrip && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>💰 ETB {marker.pricePerTrip}/trip</p>}
                {marker.entranceFee !== undefined && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>🎟 {marker.entranceFee ? `ETB ${marker.entranceFee}` : 'Free'}</p>}
                {marker.rating > 0 && <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>⭐ {marker.rating.toFixed(1)}</p>}
                {marker.markerType === 'hotel' && <Link to={`/hotels/${marker._id}`} style={styles.infoBtn}>View Hotel →</Link>}
                {marker.markerType === 'site' && <Link to={`/sites/${marker._id}`} style={styles.infoBtn}>View Site →</Link>}
                {marker.markerType === 'guide' && <Link to={`/guides/${marker._id}`} style={styles.infoBtn}>View Guide →</Link>}
                {marker.markerType === 'transport' && <Link to="/transport" style={styles.infoBtn}>Book Transport →</Link>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function GoogleMapView({ hotels = [], sites = [], transports = [], guides = [], height = '500px', showFilter = true }) {
  const [filter, setFilter] = useState({ hotel: true, site: true, transport: true, guide: true });

  // Ensure all props are arrays
  const hotelsArray = Array.isArray(hotels) ? hotels : [];
  const sitesArray = Array.isArray(sites) ? sites : [];
  const transportsArray = Array.isArray(transports) ? transports : [];
  const guidesArray = Array.isArray(guides) ? guides : [];

  const allMarkers = [
    ...hotelsArray.filter(h => h?.location?.lat).map(h => ({ ...h, markerType: 'hotel' })),
    ...sitesArray.filter(s => s?.location?.lat).map(s => ({ ...s, markerType: 'site' })),
    ...transportsArray.filter(t => t?.location?.lat).map(t => ({ ...t, markerType: 'transport' })),
    ...guidesArray.filter(g => g?.location?.lat).map(g => ({ ...g, markerType: 'guide' })),
  ].filter(m => filter[m.markerType]);

  // Always use Leaflet/OpenStreetMap (free, no API key needed)
  return <LeafletMap allMarkers={allMarkers} height={height} showFilter={showFilter} filter={filter} setFilter={setFilter} />;
}

const styles = {
  filterBar: { display: 'flex', gap: '0.5rem', padding: '0.8rem', background: '#fff', flexWrap: 'wrap', borderBottom: '1px solid #eee' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', border: '2px solid', borderRadius: '20px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem', transition: 'opacity 0.2s' },
  infoBtn: { display: 'inline-block', marginTop: '0.5rem', padding: '0.3rem 0.7rem', background: '#1a6b3c', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.8rem' },
};
