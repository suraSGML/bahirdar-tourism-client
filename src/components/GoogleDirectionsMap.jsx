import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function GoogleDirectionsMap({ 
  destination, 
  destinationName = 'Destination',
  height = '500px',
  showDirections = true 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Google Map
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured');
      return;
    }

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: 11.5936, lng: 37.3906 }, // Bahir Dar center
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
    });

    const newDirectionsService = new window.google.maps.DirectionsService();
    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
      map: newMap,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#1a6b3c',
        strokeWeight: 4,
      },
    });

    setMap(newMap);
    setDirectionsService(newDirectionsService);
    setDirectionsRenderer(newDirectionsRenderer);

    // Get user's current location
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          newMap.setCenter(userLoc);
          
          // Add user location marker
          new window.google.maps.Marker({
            position: userLoc,
            map: newMap,
            title: 'Your Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });

          setLoading(false);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setLoading(false);
          // Continue without user location
        }
      );
    }
  };

  // Get directions when destination or user location changes
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !destination) return;

    if (!userLocation) {
      setError('Unable to get your location. Please enable location services.');
      return;
    }

    setLoading(true);
    setError(null);

    const request = {
      origin: userLocation,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      alternatives: true,
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
        
        // Get distance and duration from first route
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setDistance(leg.distance.text);
        setDuration(leg.duration.text);
        setLoading(false);
      } else {
        setError(`Directions request failed: ${status}`);
        setLoading(false);
      }
    });
  }, [directionsService, directionsRenderer, destination, userLocation]);

  const handleGetDirections = () => {
    if (!userLocation || !destination) {
      toast.error('Location information not available');
      return;
    }

    // Open Google Maps in new tab with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  const handleOpenInGoogleMaps = () => {
    if (!destination) return;
    const mapsUrl = `https://www.google.com/maps/search/${destination.lat},${destination.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📍 {destinationName}</h3>
        <div style={styles.actions}>
          {userLocation && distance && (
            <div style={styles.info}>
              <span style={styles.infoItem}>📏 {distance}</span>
              <span style={styles.infoItem}>⏱️ {duration}</span>
            </div>
          )}
          <button 
            onClick={handleGetDirections}
            style={styles.directionBtn}
            disabled={!userLocation || !destination}
            title="Open full directions in Google Maps"
          >
            🗺️ Get Directions
          </button>
          <button 
            onClick={handleOpenInGoogleMaps}
            style={styles.mapsBtn}
            title="Open in Google Maps"
          >
            🔗 Maps
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={styles.loadingBox}>
          ⏳ Loading directions...
        </div>
      )}

      <div 
        ref={mapRef} 
        style={{
          width: '100%',
          height: height,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      />

      {userLocation && distance && (
        <div style={styles.summaryBox}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>📍 From Your Location</span>
            <span style={styles.summaryValue}>{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>🎯 To {destinationName}</span>
            <span style={styles.summaryValue}>{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>📏 Distance</span>
            <span style={styles.summaryValue}>{distance}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>⏱️ Estimated Time</span>
            <span style={styles.summaryValue}>{duration}</span>
          </div>
        </div>
      )}

      <div style={styles.travelModes}>
        <p style={styles.travelModesLabel}>Travel Options:</p>
        <div style={styles.travelModeButtons}>
          <button style={styles.travelModeBtn} title="Driving">🚗 Drive</button>
          <button style={styles.travelModeBtn} title="Walking">🚶 Walk</button>
          <button style={styles.travelModeBtn} title="Public Transit">🚌 Transit</button>
          <button style={styles.travelModeBtn} title="Cycling">🚴 Bike</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    margin: 0,
    color: '#1a6b3c',
    fontSize: '1.2rem',
  },
  actions: {
    display: 'flex',
    gap: '0.8rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  info: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.9rem',
    color: '#555',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  directionBtn: {
    padding: '0.6rem 1.2rem',
    background: '#1a6b3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'background 0.2s',
  },
  mapsBtn: {
    padding: '0.6rem 1rem',
    background: '#4285f4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'background 0.2s',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#c53030',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  loadingBox: {
    background: '#e6f4ed',
    color: '#1a6b3c',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  summaryBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: '8px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  summaryLabel: {
    fontSize: '0.8rem',
    color: '#888',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: '0.95rem',
    color: '#1a6b3c',
    fontWeight: '600',
  },
  travelModes: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  travelModesLabel: {
    margin: '0 0 0.8rem',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 'bold',
  },
  travelModeButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  travelModeBtn: {
    padding: '0.5rem 1rem',
    background: '#f0f7f3',
    color: '#1a6b3c',
    border: '1px solid #d0e8e0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};
