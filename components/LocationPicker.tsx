import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { MapPin, Loader2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    if (isOpen && !position) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const newPos = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };
      setPosition(newPos);

      // Reverse geocode to get address
      reverseGeocode(newPos.lat, newPos.lng);
    } catch (error) {
      console.error('Error getting location:', error);
      // Default to NYC if can't get location
      setPosition({ lat: 40.7128, lng: -74.006 });
      alert('Could not get your location. Using default location.');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using Nominatim (OpenStreetMap) for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await response.json();

      if (data.display_name) {
        // Extract city and country
        const address = data.address;
        const city = address.city || address.town || address.village || '';
        const country = address.country || '';
        setLocationName(`${city}, ${country}`.trim());
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    if (position) {
      onSelectLocation(position.lat, position.lng, locationName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-3xl max-w-2xl w-full border-2 border-black shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-black" />
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Select Location</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: '400px' }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
              <Loader2 className="w-8 h-8 text-black animate-spin" />
            </div>
          ) : position ? (
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onClick={handleMapClick} />
              {position && <Marker position={[position.lat, position.lng]} />}
            </MapContainer>
          ) : null}
        </div>

        {/* Location Info */}
        {locationName && (
          <div className="px-6 py-4 bg-zinc-50 border-t-2 border-black">
            <p className="text-xs font-black text-zinc-600 uppercase tracking-wider mb-1">Selected Location</p>
            <p className="text-sm font-black text-black">{locationName}</p>
            {position && (
              <p className="text-xs text-zinc-500 mt-1">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-white border-t-2 border-black px-6 py-4 flex gap-3">
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex-1 bg-white text-black border-2 border-black py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {loading ? 'Getting Location...' : 'Use Current Location'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position}
            className="flex-1 bg-black text-white border-2 border-black py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
