import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Coffee, Navigation } from 'lucide-react';
import type { Cafe } from '../lib/database';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CafeMapProps {
  cafes: Cafe[];
  center?: [number, number] | null;
  onCafeClick?: (cafe: Cafe) => void;
}

// Component to handle map recentering when center prop changes
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 });
    }
  }, [center, map]);

  return null;
}

// Component for geolocation button
function GeolocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 13, { duration: 1.5 });
          setLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not get your location. Please enable location services.');
          setLocating(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  return (
    <button
      onClick={handleLocate}
      disabled={locating}
      className="absolute top-4 right-4 z-10 bg-white text-black p-3 rounded-xl border-2 border-zinc-300 hover:bg-zinc-100 active:bg-zinc-200 transition-all shadow-lg disabled:opacity-50"
      title="Find my location"
    >
      <Navigation className={`w-5 h-5 ${locating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

const CafeMap: React.FC<CafeMapProps> = ({ cafes, center, onCafeClick }) => {
  const navigate = useNavigate();

  // Filter cafes that have coordinates
  const mappableCafes = cafes.filter(cafe => cafe.latitude && cafe.longitude);

  // Calculate initial center point (average of all coordinates or use provided center)
  const initialCenter: [number, number] = mappableCafes.length > 0
    ? [
        mappableCafes.reduce((sum, c) => sum + (c.latitude || 0), 0) / mappableCafes.length,
        mappableCafes.reduce((sum, c) => sum + (c.longitude || 0), 0) / mappableCafes.length
      ]
    : [40.7128, -74.0060]; // Default to NYC if no cafes

  const handleViewCafe = (cafeId: string) => {
    navigate(`/cafe/${cafeId}`);
  };

  if (mappableCafes.length === 0) {
    return (
      <div className="w-full h-[600px] bg-white border-2 border-zinc-300 rounded-[2rem] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-600 text-sm font-black uppercase tracking-widest">
            No Cafes with Location Data
          </p>
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider mt-2">
            Search for a location or add cafes with addresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] sm:h-[600px] rounded-[2rem] overflow-hidden border-2 border-zinc-300 shadow-lg">
      <MapContainer
        center={initialCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map controller to handle center changes */}
        <MapController center={center} />

        {/* Show circle around searched location */}
        {center && (
          <Circle
            center={center}
            radius={5000}
            pathOptions={{
              color: 'white',
              fillColor: 'white',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        )}

        {/* Cafe markers */}
        {mappableCafes.map(cafe => (
          <Marker
            key={cafe.id}
            position={[cafe.latitude!, cafe.longitude!]}
            eventHandlers={{
              click: () => onCafeClick?.(cafe)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="text-base font-black uppercase tracking-tight mb-2">
                  {cafe.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="font-bold uppercase tracking-wide">
                    {cafe.city}, {cafe.country}
                  </span>
                </div>
                {cafe.address && (
                  <p className="text-xs text-zinc-500 mb-2">
                    {cafe.address}
                  </p>
                )}
                {cafe.average_rating > 0 && (
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{cafe.average_rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-600 mb-3">
                  <Coffee className="w-3 h-3" />
                  <span className="font-bold">{cafe.visit_count} visits</span>
                </div>
                <button
                  onClick={() => handleViewCafe(cafe.id)}
                  className="w-full bg-zinc-50 text-black px-3 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                >
                  View Cafe
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Geolocation button - must be inside MapContainer */}
        <GeolocationButton />
      </MapContainer>

      {/* Map legend/instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-zinc-300 shadow-lg">
        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
          {mappableCafes.length} {mappableCafes.length === 1 ? 'Cafe' : 'Cafes'} Shown
        </p>
      </div>
    </div>
  );
};

export default CafeMap;
