import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Bahir Dar center coordinates
const BAHIRDAR_CENTER = [11.5936, 37.3906];

export default function MapView({ items = [], linkPrefix = '' }) {
  const validItems = items.filter(item => item.location?.lat && item.location?.lng);

  return (
    <MapContainer center={BAHIRDAR_CENTER} zoom={13} style={styles.map}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {validItems.map(item => (
        <Marker key={item._id} position={[item.location.lat, item.location.lng]}>
          <Popup>
            <strong>{item.name}</strong><br />
            {item.address && <span>📍 {item.address}<br /></span>}
            {item.pricePerNight && <span>💰 ETB {item.pricePerNight}/night<br /></span>}
            {item.entranceFee !== undefined && <span>🎟 ETB {item.entranceFee || 'Free'}<br /></span>}
            {linkPrefix && <Link to={`/${linkPrefix}/${item._id}`}>View Details →</Link>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const styles = {
  map: { height: '400px', width: '100%', borderRadius: '10px', zIndex: 0 },
};
