import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Coffee } from 'lucide-react';
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
  onCafeClick?: (cafe: Cafe) => void;
}

const CafeMap: React.FC<CafeMapProps> = ({ cafes, onCafeClick }) => {
  const navigate = useNavigate();

  // Filter cafes that have coordinates
  const mappableCafes = cafes.filter(cafe => cafe.latitude && cafe.longitude);

  // Calculate center point (average of all coordinates)
  const center: [number, number] = mappableCafes.length > 0
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
      <div className="w-full h-[500px] bg-zinc-900 border-2 border-zinc-800 rounded-[2rem] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">
            No Cafes with Location Data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-[2rem] overflow-hidden border-2 border-zinc-800">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all"
                >
                  View Cafe
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CafeMap;
