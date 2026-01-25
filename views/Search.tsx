import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, ShieldCheck, Loader2 } from 'lucide-react';
import { searchProfiles, type Profile } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const ExploreView: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      const q = query.trim();
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
    }

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, currentProfile]);

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
        <div className="relative group">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-200 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="SEARCH THE NETWORK..."
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
        {searchResults.length > 0 ? (
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
        )}
      </div>
    </div>
  );
};

export default ExploreView;
