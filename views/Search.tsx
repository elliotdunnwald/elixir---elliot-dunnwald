import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, ShieldCheck, Loader2, Coffee, MapPin, Star } from 'lucide-react';
import { searchProfiles, searchCafes, type Profile, type Cafe } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const ExploreView: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'people' | 'cafes'>('people');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [cafeResults, setCafeResults] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      const q = query.trim();
      if (!q) {
        setSearchResults([]);
        setCafeResults([]);
        return;
      }

      setLoading(true);
      try {
        if (activeTab === 'people') {
          const results = await searchProfiles(q);
          // Filter out current user from results
          setSearchResults(results.filter(p => p.id !== currentProfile?.id));
        } else {
          const results = await searchCafes(q);
          setCafeResults(results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, currentProfile, activeTab]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">EXPLORE</h1>
          <div className="flex items-center gap-2 text-zinc-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">RLS ENABLED</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('people')}
            className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-white text-black border-white' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            People
          </button>
          <button
            onClick={() => setActiveTab('cafes')}
            className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cafes' ? 'bg-white text-black border-white' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
          >
            <Coffee className="inline w-4 h-4 mr-2" />
            Cafes
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-200 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={activeTab === 'people' ? "SEARCH THE NETWORK..." : "SEARCH CAFES..."}
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl py-7 pl-16 pr-8 text-sm font-black text-white outline-none focus:border-white transition-all uppercase placeholder:text-zinc-700"
          />
          {loading && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-zinc-200 animate-spin" />
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === 'people' ? (
          searchResults.length > 0 ? (
            searchResults.map(person => (
              <Link
                key={person.id}
                to={`/profile/${person.username}`}
                className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-600 hover:bg-zinc-800/50 transition-all flex items-center gap-6 group shadow-lg shadow-white/5"
              >
                <div className="w-16 h-16 rounded-2xl border-2 border-white group-hover:border-white flex items-center justify-center overflow-hidden transition-all bg-white text-black shadow-lg">
                  {person.avatar_url ? (
                    <img src={person.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none">
                    {person.first_name} {person.last_name}
                  </h4>
                  <p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest mt-2">
                    @{person.username} • {person.city}, {person.country}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
              <p className="text-zinc-200 font-black uppercase text-sm tracking-[0.3em]">
                {query.trim() ? (loading ? "SEARCHING..." : "NO USERS FOUND") : "SEARCH FOR PEOPLE"}
              </p>
            </div>
          )
        ) : (
          cafeResults.length > 0 ? (
            cafeResults.map(cafe => (
              <Link
                key={cafe.id}
                to={`/cafe/${cafe.id}`}
                className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group shadow-lg shadow-white/5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-tight">
                        {cafe.name}
                      </h4>
                      <div className="flex items-center gap-2 text-zinc-400 mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wide">
                          {cafe.city}, {cafe.country}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white text-black px-3 py-1 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-black">{cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Coffee className="w-3 h-3" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      {cafe.visit_count} {cafe.visit_count === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
              <p className="text-zinc-200 font-black uppercase text-sm tracking-[0.3em]">
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
