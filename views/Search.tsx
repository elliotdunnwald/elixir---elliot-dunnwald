
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, ShieldCheck } from 'lucide-react';
import { PEERS } from '../data/database';

interface ExploreViewProps {
  currentUser?: any;
  discoveredPeers?: any[];
  following?: string[];
}

const ExploreView: React.FC<ExploreViewProps> = ({ currentUser, discoveredPeers = [], following = [] }) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];

    // Simulate Row Level Security: 
    // Users can only find others if they are public OR if they are already following them.
    const allUsers = [
      ...PEERS,
      ...discoveredPeers.map(p => ({
        id: p.id,
        name: p.name.toUpperCase(),
        username: p.name.split(' ')[0].toUpperCase(),
        avatar: p.avatar,
        location: `${p.city}, ${p.country}`.toUpperCase(),
        brews: 0,
        isPrivate: p.isPrivate
      }))
    ];

    const results = allUsers.filter(p => {
      const matchesQuery = p.name.includes(q) || p.username.includes(q) || p.location.includes(q);
      const isAuthorized = !p.isPrivate || following.includes(p.id);
      return matchesQuery && isAuthorized;
    });

    if (currentUser && (
      currentUser.name.toUpperCase().includes(q) || 
      currentUser.city.toUpperCase().includes(q) ||
      currentUser.country.toUpperCase().includes(q)
    )) {
      results.push({
        id: 'me',
        name: currentUser.name.toUpperCase(),
        username: currentUser.name.split(' ')[0].toUpperCase(),
        avatar: currentUser.avatar,
        location: `${currentUser.city}, ${currentUser.country}`.toUpperCase(),
        brews: 0,
        isPrivate: currentUser.isPrivate
      });
    }

    // Filter unique by ID
    return Array.from(new Map(results.map(item => [item.id, item])).values());
  }, [query, currentUser, discoveredPeers, following]);

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
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-focus-within:text-white transition-colors" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="SEARCH THE NETWORK..." className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl py-7 pl-16 pr-8 text-sm font-black text-white outline-none focus:border-white transition-all uppercase placeholder:text-zinc-700" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {searchResults.length > 0 ? (
          searchResults.map(person => (
            <Link key={person.id} to={person.id === 'me' ? '/profile/me' : `/profile/${person.id}`} className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[2.5rem] hover:border-white hover:bg-zinc-800/50 transition-all flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl border-2 border-zinc-800 flex items-center justify-center overflow-hidden transition-all bg-white text-black">
                {person.avatar ? <img src={person.avatar} className="w-full h-full object-cover grayscale" alt="" /> : <User className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none">{person.name}</h4>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">@{person.username} • {person.location}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <p className="text-zinc-600 font-black uppercase text-sm tracking-[0.3em]">{query.trim() ? "NO AUTHORIZED PEERS MATCHED" : "SEARCH FOR PEERS"}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ExploreView;
