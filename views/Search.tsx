import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, ShieldCheck, Loader2, Coffee, MapPin, Star } from 'lucide-react';
import { searchProfiles, searchCafes, getCafes, type Profile, type Cafe } from '../lib/database';
import { useAuth } from '../hooks/useAuth';
import CafeMap from '../components/CafeMap';

const ExploreView: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'people' | 'cafes'>('people');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [cafeResults, setCafeResults] = useState<Cafe[]>([]);
  const [allCafes, setAllCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [searchType, setSearchType] = useState<'cafe' | 'location'>('cafe');

  // Load all cafes when cafes tab is selected
  useEffect(() => {
    async function loadAllCafes() {
      if (activeTab === 'cafes') {
        const cafes = await getCafes();
        setAllCafes(cafes);
        // If no search query, show all cafes
        if (!query.trim()) {
          setCafeResults(cafes);
        }
      }
    }
    loadAllCafes();
  }, [activeTab]);

  // Geocode a location search
  async function geocodeLocation(locationQuery: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Elixr Coffee App (contact@elixr.coffee)'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }

  // Calculate distance between two points (Haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  useEffect(() => {
    async function performSearch() {
      const q = query.trim();

      if (activeTab === 'people') {
        if (!q) {
          setSearchResults([]);
          return;
        }
        setLoading(true);
        try {
          const results = await searchProfiles(q);
          // Filter out current user from results
          setSearchResults(results.filter(p => p.id !== currentProfile?.id));
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        // Cafes tab
        if (!q) {
          setCafeResults(allCafes);
          setMapCenter(null);
          return;
        }

        setLoading(true);
        try {
          // First try searching by cafe name
          const cafeNameResults = await searchCafes(q);

          if (cafeNameResults.length > 0) {
            // Found cafes by name
            setCafeResults(cafeNameResults);
            setSearchType('cafe');
            setMapCenter(null);
          } else {
            // No cafes found by name, try geocoding as location
            const location = await geocodeLocation(q);
            if (location) {
              // Found a location, filter cafes by proximity
              const cafesWithDistance = allCafes
                .filter(cafe => cafe.latitude && cafe.longitude)
                .map(cafe => ({
                  ...cafe,
                  distance: calculateDistance(location.lat, location.lng, cafe.latitude!, cafe.longitude!)
                }))
                .filter(cafe => cafe.distance < 50) // Within 50km
                .sort((a, b) => a.distance - b.distance);

              setCafeResults(cafesWithDistance);
              setMapCenter([location.lat, location.lng]);
              setSearchType('location');
            } else {
              // No results found
              setCafeResults([]);
              setMapCenter(null);
            }
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [query, currentProfile, activeTab, allCafes]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-28 sm:pb-24 -mt-2 animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <h1 className="text-5xl font-black text-black tracking-tighter uppercase leading-none">EXPLORE</h1>
          <div className="flex items-center gap-2 text-black">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">RLS ENABLED</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('people')}
            className={`px-6 py-3 rounded-full border-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'people' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-50 active:scale-95'}`}
          >
            <Users className="w-4 h-4" />
            People
          </button>
          <button
            onClick={() => setActiveTab('cafes')}
            className={`px-6 py-3 rounded-full border-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'cafes' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-50 active:scale-95'}`}
          >
            <MapPin className="w-4 h-4" />
            Cafes
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-black transition-colors" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={activeTab === 'people' ? "SEARCH FOR PEOPLE" : "SEARCH CAFES OR LOCATIONS..."}
            className="w-full bg-white border-2 border-black rounded-3xl py-7 pl-16 pr-8 text-sm font-black text-black outline-none focus:border-black transition-all uppercase placeholder:text-black"
          />
          {loading && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-black animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Cafe Map - Always show on cafes tab */}
      {activeTab === 'cafes' && (
        <div className="mb-8">
          <CafeMap
            cafes={cafeResults}
            center={mapCenter}
            onCafeClick={(cafe) => console.log('Clicked cafe:', cafe)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        {activeTab === 'people' ? (
          searchResults.length > 0 ? (
            searchResults.map(person => (
              <Link
                key={person.id}
                to={`/profile/${person.username}`}
                className="bg-white border-2 border-black p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] hover:border-black hover:bg-zinc-50 active:bg-zinc-700/50 transition-all flex items-center gap-4 sm:gap-6 group shadow-lg shadow-black/5"
              >
                <div className="w-16 h-16 rounded-2xl border-2 border-black group-hover:border-black active:border-black flex items-center justify-center overflow-hidden transition-all bg-white text-black shadow-lg">
                  {person.avatar_url ? (
                    <img src={person.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-black text-xl tracking-tighter uppercase leading-none">
                    {person.first_name} {person.last_name}
                  </h4>
                  <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mt-2">
                    @{person.username} • {person.city}, {person.country}
                  </p>
                </div>
              </Link>
            ))
          ) : query.trim() ? (
            <div className="col-span-full py-24 text-center">
              <p className="text-black font-black uppercase text-sm tracking-[0.3em]">
                {loading ? "SEARCHING..." : "NO USERS FOUND"}
              </p>
            </div>
          ) : null
        ) : (
          cafeResults.length > 0 ? (
            cafeResults.map(cafe => (
              <Link
                key={cafe.id}
                to={`/cafe/${cafe.id}`}
                className="bg-white border-2 border-black p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] hover:border-black hover:bg-zinc-50 active:bg-zinc-700/50 transition-all group shadow-lg shadow-black/5"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-black text-lg sm:text-xl tracking-tighter uppercase leading-tight">
                        {cafe.name}
                      </h4>
                      <div className="flex items-center gap-2 text-black mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wide">
                          {cafe.city}, {cafe.country}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white text-black px-3 py-1 rounded-lg border-2 border-black">
                      <div className="flex items-center justify-center">
                        <span className="text-xs font-black">{cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-black">
                    <Coffee className="w-3 h-3" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      {cafe.visit_count} {cafe.visit_count === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-black rounded-[3rem]">
              <p className="text-black font-black uppercase text-sm tracking-[0.3em]">
                {query.trim() ? (loading ? "SEARCHING..." : "NO CAFES FOUND") : "SEARCH FOR CAFES"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ExploreView;
