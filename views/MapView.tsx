import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, Coffee, Loader2 } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { Geolocation } from '@capacitor/geolocation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView: React.FC = () => {
  const { profile } = useAuth();
  const { activities, loading } = useActivities({ realtime: true });
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.006 });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 5000,
      });

      const loc = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };
      setUserLocation(loc);
      setMapCenter(loc);
    } catch (error) {
      console.error('Could not get user location:', error);
      // Use NYC as default
    }
  };

  // Filter activities that have location data
  const activitiesWithLocation = activities.filter(a => {
    // For now, we'll check if they have city/country in locationName
    // In the future, you'll store lat/lng in the database
    return a.locationName && a.locationName.includes(',');
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-28 sm:pb-0">
      <div className="mb-6">
        <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em] mb-4">
          Brew Map
        </h2>
      </div>

      <div className="bg-white rounded-3xl border-2 border-black overflow-hidden shadow-2xl">
        <div className="relative" style={{ height: '70vh', minHeight: '400px' }}>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={userLocation ? 12 : 3}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User's current location */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Activity markers - for demo, we'll just show message */}
            {/* In the future, you'll add lat/lng to brew_activities table */}
          </MapContainer>
        </div>

        {/* Info Panel */}
        <div className="border-t-2 border-black p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-black" />
            <h3 className="text-sm font-black text-black uppercase tracking-wider">
              Your Brew Locations
            </h3>
          </div>

          {activitiesWithLocation.length === 0 ? (
            <div className="py-8 text-center">
              <Coffee className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-xs font-black text-zinc-600 uppercase tracking-wider">
                No brews with location data yet
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Add location when logging brews to see them on the map
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-black">{activitiesWithLocation.length}</p>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mt-1">
                  Locations
                </p>
              </div>
              <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-black">{activities.length}</p>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mt-1">
                  Total Brews
                </p>
              </div>
              {userLocation && (
                <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-black">📍</p>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mt-1">
                    You are here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-6 bg-amber-50 border-2 border-amber-900 rounded-2xl p-6">
        <p className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2">
          🚧 Map Feature Coming Soon
        </p>
        <p className="text-xs text-amber-800">
          We're adding precise location tracking to brews. Soon you'll see all your brewing locations on this map,
          discover nearby specialty cafes, and find roasters in your area.
        </p>
      </div>
    </div>
  );
};

export default MapView;
